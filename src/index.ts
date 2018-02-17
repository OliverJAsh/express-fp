import * as express from 'express';
import { Result } from 'express-result-types/target/result';
import { applyResultToExpress, ExpressRequestSession } from 'express-result-types/target/wrap';
import * as either from 'fp-ts/lib/Either';
import * as t from 'io-ts';

import { wrapAsyncRequestHandler } from './helpers/express';

import Either = either.Either;
import { SafeMutableMap } from './helpers/other';

export class JsValue {
    constructor(private value: {}) {}

    // https://www.playframework.com/documentation/2.6.x/ScalaJson#Using-validation
    validate<Type>(type: t.Type<Type>): Either<t.ValidationError[], Type> {
        return type.decode(this.value);
    }
}

enum Header {
    ContentType = 'Content-Type',
}

enum ContentType {
    ApplicationJson = 'application/json',
}

// https://www.playframework.com/documentation/2.6.x/ScalaBodyParsers#The-default-body-parser
// https://playframework.com/documentation/2.6.x/api/scala/index.html#play.api.mvc.AnyContent
export class AnyContent {
    constructor(private req: express.Request) {}

    asText(): string {
        // TODO: How to enforce string? Don't use body parser middleware?
        return this.req.body;
    }

    asJson(): Either<string, JsValue> {
        const contentType = this.req.get(Header.ContentType);
        if (contentType !== ContentType.ApplicationJson) {
            return either.left(
                `Expecting request header '${Header.ContentType}' to equal '${ContentType.ApplicationJson}' but instead got '${contentType}'.`,
            );
        } else {
            return either
                .tryCatch((): {} =>
                    JSON.parse(
                        // TODO: How to enforce string? Don't use body parser middleware?
                        this.req.body,
                    ),
                )
                .map(json => new JsValue(json))
                .mapLeft(error => `JSON parsing error: ${error.message}`);
        }
    }
}

export class SafeRequest {
    constructor(private req: express.Request) {}

    ip = this.req.ip;

    body = new AnyContent(this.req);

    // https://playframework.com/documentation/2.6.x/api/scala/index.html#play.api.mvc.Request@queryString:Map[String,Seq[String]]
    // http://expressjs.com/en/api.html#req.query
    query = (() => {
        // We presume Express is using the default query string parser, Node's native `querystring`.
        const query: { [key: string]: string | string[] } = this.req.query;

        return new SafeMutableMap(Object.entries(query));
    })();

    session = (() => {
        const maybeSessionData: ExpressRequestSession['data'] | undefined =
            this.req.session !== undefined
                ? // We presume the session was defined using `Result.withSession`.
                  this.req.session.data as ExpressRequestSession['data']
                : undefined;

        return new SafeMutableMap(
            Object.entries(maybeSessionData !== undefined ? maybeSessionData : {}),
        );
    })();
}
export type SafeRequestHandler = (req: SafeRequest) => Result;
export type wrap = (safeRequestHandler: SafeRequestHandler) => express.RequestHandler;
export const wrap: wrap = safeRequestHandler => (req, res) => {
    const safeRequest = new SafeRequest(req);
    const result = safeRequestHandler(safeRequest);
    applyResultToExpress({ req, res, result });
};

export type SafeRequestHandlerAsync = (req: SafeRequest) => Promise<Result>;
export type wrapAsync = (safeRequestHandler: SafeRequestHandlerAsync) => express.RequestHandler;
export const wrapAsync: wrapAsync = safeRequestHandler =>
    wrapAsyncRequestHandler((req, res) => {
        const safeRequest = new SafeRequest(req);
        const resultPromise = safeRequestHandler(safeRequest);
        return resultPromise.then(result => {
            applyResultToExpress({ req, res, result });
        });
    });
