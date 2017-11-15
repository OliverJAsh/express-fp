import * as bodyParser from 'body-parser';
import * as express from 'express';
import { JsValue, jsValueWriteable, Ok } from 'express-result-types/target/result';
import * as session from 'express-session';
import * as http from 'http';
import * as t from 'io-ts';

import { NumberFromString, validationErrorsToBadRequest } from './helpers/example';
import { SafeRequest, wrap } from './index';

const app = express();
app.use(session({ secret: 'foo' }));
// Don't parse body using middleware. Body parsing is instead handled in the request handler.
app.use(bodyParser.text({ type: 'application/json' }));

const QueryParams = t.interface({
    age: NumberFromString,
    gender: t.union([t.literal('male'), t.literal('female')]),
});

const collectQueryParams = <Key extends string>(keys: Key[], query: SafeRequest['query']) =>
    keys.reduce<Partial<Record<Key, string | string[] | undefined>>>(
        (acc, key) => ({
            // @ts-ignore
            // Workaround TS bug
            // https://github.com/Microsoft/TypeScript/issues/14409
            ...acc,
            [key]: query.get(key).getOrElseValue(undefined),
        }),
        {},
    );

const requestHandler = wrap(req => {
    const queryParams = collectQueryParams(['age', 'gender'], req.query);
    const maybeValidQueryParams = t.validate(queryParams, QueryParams);

    return maybeValidQueryParams.fold(
        validationErrorsToBadRequest('query params'),
        validatedQueryParams => Ok.apply(new JsValue(validatedQueryParams), jsValueWriteable),
    );
});

const sessionRequestHandler = wrap(req => {
    const maybeUserId = req.session.get('userId');

    return maybeUserId.fold(
        () => Ok.apply(new JsValue({}), jsValueWriteable).withSession(new Map([['userId', 'foo']])),
        userId => Ok.apply(new JsValue({ userId }), jsValueWriteable),
    );
});

app.post('/', requestHandler);
app.get('/session', sessionRequestHandler);

const onListen = (server: http.Server) => {
    const { port } = server.address();

    console.log(`Server running on port ${port}`);
};

const httpServer = http.createServer(
    // TODO: Investigate bug in Express/Node typings
    // @ts-ignore
    app,
);
httpServer.listen(8080, () => {
    onListen(httpServer);
});

// ❯ curl --request POST --silent --header 'Content-Type: application/json' \
//     --data '{ "name": 1 }' "localhost:8080/" | jq '.'
// [
//   "Expecting query parameter 'age', but instead got none."
// ]

// ❯ curl --request POST --silent --header 'Content-Type: invalid' \
//     --data '{ "name": 1 }' "localhost:8080/" | jq '.'
// [
//   "Expecting request header 'Content-Type' to equal 'application/json', but instead got 'invalid'."
// ]

// ❯ curl --request POST --silent --header 'Content-Type: application/json' \
//     --data 'invalid' "localhost:8080/" | jq '.'
// [
//   "JSON parsing error: Unexpected token i in JSON at position 0"
// ]

// ❯ curl --request POST --silent --header 'Content-Type: application/json' \
//     --data '{ "name": "bob" }' "localhost:8080/?age=foo" | jq '.'
// [
//   "Validation errors for age: Expecting NumberFromString but instead got: \"foo\"."
// ]

// ❯ curl --request POST --silent --header 'Content-Type: application/json' \
//     --data '{ "name": "bob" }' "localhost:8080/?age=5" | jq '.'
// {
//   "name": "bob",
//   "age": 5
// }
