# express-fp

Type safe request handlers for [Express]. TypeScript compatible.

- Validate Express requests (body and query objects) using [io-ts].
- Construct Express responses without mutation using [express-result-types].

## Example

Below is small example that demonstrates request body and query validation using [io-ts] and fully typed response construction using [express-result-types].

[See the full example](./src/example.ts).

``` ts
const Body = t.interface({
    name: t.string,
});
type BodyT = t.TypeOf<typeof Body>;

const Query = t.interface({
    age: NumberFromString,
});
type QueryT = t.TypeOf<typeof Query>;

const validationFromEitherArrayString = validation.fromEither(array.getSemigroup<string>());

const requestHandler = wrap(req => {
    const jsonBody = req.body.asJson();

    const maybeQuery = t
        .validate(
            {
                age: req.query.get('age').toNullable(),
            },
            Query,
        )
        .mapLeft(formatValidationErrors('query'))
        .mapLeft(error => [error]);

    const maybeBody = jsonBody
        .chain(jsValue => jsValue.validate(Body).mapLeft(formatValidationErrors('body')))
        .mapLeft(error => [error]);

    const getResult = (query: QueryT) => (body: BodyT) =>
        Ok.apply(
            new JsValue({
                // We defined the shape of the request body and the request query parameter 'age'
                // for validation purposes, but it also gives us static types! For example, here the
                // type checker knows the types:
                // - `body.name` is type `string`
                // - `age` is type `number`
                name: body.name,
                age: query.age,
            }),
            jsValueWriteable,
        );

    return apply.liftA2(validation)(getResult)
        (validationFromEitherArrayString(maybeQuery))
        (validationFromEitherArrayString(maybeBody))
        .toEither()
        .getOrElse(error => BadRequest.apply(new JsValue(error), jsValueWriteable));
});

app.post('/', requestHandler);

// ❯ curl --request POST --silent --header 'Content-Type: application/json' \
//     --data '{ "name": 1 }' "localhost:8080/" | jq '.'
// [
//   "Validation errors for body: Expecting string at name but instead got: 1.",
//   "Validation errors for query: Expecting NumberFromString at age but instead got: null."
// ]

// ❯ curl --request POST --silent --header 'Content-Type: invalid' \
//     --data '{ "name": "bob" }' "localhost:8080/?age=5" | jq '.'
// [
//   "Expecting request header 'Content-Type' to equal 'application/json', but instead got 'invalid'."
// ]

// ❯ curl --request POST --silent --header 'Content-Type: application/json' \
//     --data 'invalid' "localhost:8080/?age=5" | jq '.'
// [
//   "JSON parsing error: Unexpected token i in JSON at position 0"
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
