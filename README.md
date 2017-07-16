# express-fp

Type safe request handlers for [Express]. TypeScript compatible.

- Validate Express requests (session, body, and query objects) using [io-ts].
- Construct Express responses without mutation using [express-result-types].

[See the example](./src/example.ts).

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
