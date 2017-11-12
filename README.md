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

const requestHandler = wrap(req => {
    const jsonBody = req.body.asJson();

    return jsonBody.fold(
        error => BadRequest.apply(new JsValue([error]), jsValueWriteable),
        jsValue =>
            req.query.get('age').fold(
                () =>
                    BadRequest.apply(
                        new JsValue(["Expecting query parameter 'age' but instead got none."]),
                        jsValueWriteable,
                    ),
                ageString => {
                    const maybeValidatedBody = jsValue.validate(Body);
                    const maybeValidatedAge = t.validate(ageString, NumberFromString);

                    return maybeValidatedBody.fold(validationErrorsToBadRequest('body'), body =>
                        maybeValidatedAge.fold(validationErrorsToBadRequest('age'), age =>
                            Ok.apply(
                                new JsValue({
                                    // We defined the shape of the request body and the request
                                    // query parameter 'age' for validation purposes, but it also
                                    // gives us static types! For example, here the type checker
                                    // knows the types:
                                    // - `body.name` is type `string`
                                    // - `age` is type `number`
                                    name: body.name,
                                    age,
                                }),
                                jsValueWriteable,
                            ),
                        ),
                    );
                },
            ),
    );
});

app.post('/', requestHandler);

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
