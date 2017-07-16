import * as bodyParser from 'body-parser';
import * as express from 'express';
import { BadRequest, HttpEntity, Ok, Result } from 'express-result-types/target/result';
import { applyResultToExpress } from 'express-result-types/target/wrap';
import * as session from 'express-session';
import * as either from 'fp-ts/lib/Either';
import * as http from 'http';
import * as t from 'io-ts';

import { Either } from 'fp-ts/lib/Either';
import {
    composeTypes,
    createTuple,
    formatValidationErrors,
    JSONFromString,
    NumberFromString,
} from './helpers/other';
import { wrap } from './index';

const app = express();
app.use(session({ secret: 'foo' }));
// We parse JSON using io-ts.
app.use(bodyParser.text({ type: 'application/json' }));

const Query = t.interface({ age: NumberFromString });

const Body = composeTypes(
    JSONFromString,
    t.interface({
        name: t.string,
    }),
    'Body',
);

const validationErrorsToBadRequest = (validationErrors: t.ValidationError[]): Result =>
    BadRequest.apply(
        new HttpEntity(
            JSON.stringify(formatValidationErrors(validationErrors)),
            'application/json',
        ),
    );

const requestHandler = wrap(req =>
    req.body
        .validate(Body)
        .chain(body => req.query.validate(Query).map(query => createTuple(body, query)))
        .fold(validationErrorsToBadRequest, ([body, query]) =>
            Ok.apply(
                new HttpEntity(
                    JSON.stringify({
                        // Here the type checker knows the type of `body`:
                        // - `body.name` is type `string`
                        // - `body.age` is type `number`
                        name: body.name,
                        age: query.age,
                    }),
                    'application/json',
                ),
            ),
        ),
);

const sessionRequestHandler = wrap(req => {
    const maybeUserId = req.session.get('userId');

    return maybeUserId.fold(
        () =>
            Ok.apply(new HttpEntity(JSON.stringify({}), 'application/json')).withSession(
                new Map([['userId', 'foo']]),
            ),
        userId => Ok.apply(new HttpEntity(JSON.stringify({ userId }), 'application/json')),
    );
});

app.post('/', requestHandler);
app.get('/session', sessionRequestHandler);

const onListen = (server: http.Server) => {
    const { port } = server.address();

    console.log(`Server running on port ${port}`);
};

const httpServer = http.createServer(app);
httpServer.listen(8080, () => {
    onListen(httpServer);
});

// ❯ curl --request POST --silent "localhost:8080/" | jq '.'
// [
//   "Expecting Body but instead got: {}."
// ]

// ❯ curl --request POST --silent --header 'Content-Type: application/json' \
//     --data '{ "name": "bob" }' "localhost:8080/?age=foo" | jq '.'
// [
//   "Expecting NumberFromString at age but instead got: \"foo\"."
// ]

// ❯ curl --request POST --silent --header 'Content-Type: application/json' \
//     --data '{ "name": "bob" }' "localhost:8080/?age=5" | jq '.'
// {
//   "result": "name: bob, age: 5"
// }
