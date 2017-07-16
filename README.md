# express-fp

Type safe request handlers for [Express]. TypeScript compatible.

- Validate Express requests (body and query objects) using [io-ts].
- Construct Express responses without mutation using [express-result-types].

## Example

Below is small example that demonstrates request body and query validation using [io-ts] and fully typed response construction using [express-result-types].

[See the full example](./src/example.ts).

``` ts
const Query = t.interface({ age: NumberFromString });

const Body = composeTypes(
    JSONFromString,
    t.interface({
        name: t.string,
    }),
    'Body',
);

const requestHandler = wrap(req =>
    req.body
        .validate(Body)
        .chain(body => req.query.validate(Query).map(query => createTuple(body, query)))
        .fold(validationErrorsToBadRequest, ([body, query]) =>
            Ok.apply(
                new JsValue({
                    // Here the type checker knows the type of `body`:
                    // - `body.name` is type `string`
                    // - `body.age` is type `number`
                    name: body.name,
                    age: query.age,
                }),
                jsValueWriteable,
            ),
        ),
);

app.post('/', requestHandler);

// ❯ curl --request POST --silent --header 'Content-Type: application/json' \
//     --data '{ "name": 1 }' "localhost:8080/" | jq '.'
// [
//   "Expecting string at name but instead got: 1."
// ]

// ❯ curl --request POST --silent --header 'Content-Type: application/json' \
//     --data '{ "name": "bob" }' "localhost:8080/?age=foo" | jq '.'
// [
//   "Expecting NumberFromString at age but instead got: \"foo\"."
// ]

// ❯ curl --request POST --silent --header 'Content-Type: application/json' \
//     --data '{ "name": "bob" }' "localhost:8080/?age=5" | jq '.'
// {
//   "name": "bob",
//   "age": 5
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
