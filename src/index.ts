import * as express from 'express';
import { Result } from 'express-result-types/target/result';
import { applyResultToExpress } from 'express-result-types/target/wrap';
import * as either from 'fp-ts/lib/Either';
import * as t from 'io-ts';

import { wrapAsyncRequestHandler } from './helpers/express';

import Either = either.Either;
import { SafeMutableMap } from './helpers/other';

export class SafeRequest {
    constructor(private req: express.Request) {}
    body = {
        validate: <Type>(type: t.Type<Type>): Either<t.ValidationError[], Type> =>
            t.validate(this.req.body, type),
    };
    query = {
        validate: <Type>(type: t.Type<Type>): Either<t.ValidationError[], Type> =>
            t.validate(this.req.query, type),
    };
    // If `req.session` exists, we presume it is a string dictionary (`{ [key: string]: string }`),
    // which it will be if the session was created using the Result type.
    session = new SafeMutableMap<string, string>(
        Object.entries(
            this.req.session.data === undefined || this.req.session.data === null
                ? []
                : this.req.session.data,
        ),
    );
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
