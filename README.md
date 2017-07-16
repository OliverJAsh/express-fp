# express-fp

Type safe request handlers for [Express]. TypeScript compatible.

- Validate Express requests (session, body, and query objects) using [io-ts].
- Construct Express responses without mutation using [express-result-types].

## Example

Below is small example that demonstrates request body validation using [io-ts] response construction using [express-result-types].

[See a larger example](./src/example.ts).

``` ts
const requestHandler = wrap(req =>
    req.body.validate(Body).fold(
        validationErrors =>
            BadRequest.apply(
                new HttpEntity(JSON.stringify('Validation errors!'), 'application/json'),
            ),
        body =>
            Ok.apply(
                new HttpEntity(
                    JSON.stringify({
                        // Here the type checker knows the type of `body`, and that `body.name`
                        // is type `string`.
                        name: body.name,
                    }),
                    'application/json',
                ),
            ),
    ),
);

app.post('/', requestHandler);

// ❯ curl --request POST --silent "localhost:8080/" | jq '.'
// [
//   "Validation errors!"
// ]

// ❯ curl --request POST --silent --header 'Content-Type: application/json' \
//     --data '{ "name": "bob" }' "localhost:8080/" | jq '.'
// {
//   "name": "bob"
// }
```

## Installation

```
yarn add express-fp
```

## Development

```
yarn
npm run compile
npm run lint
```

[io-ts]: https://github.com/gcanti/io-ts
[fp-ts]: https://github.com/gcanti/fp-ts
[express-result-types]: https://github.com/OliverJAsh/express-result-types
[Express]: https://expressjs.com/
