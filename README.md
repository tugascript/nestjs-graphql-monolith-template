# NestJS GraphQL Boilerplate

NOTE: I added any tests, I'll write the tests this weekend so it can have several problems till then.

## Description

Full boiler plate of a NestJS, GraphQL and PostgreSQL (with Mikro-ORM) monolithic backend app.
It implements:

- Authentication:

* - JWT Authentication for HTTP
* - Session Authentication for Websockets
* - Two-Factor authentication with email

- Uploader:

* - Basic image only uploader with Sharp optimizations for a Linode Bucket (it can be changed for AWS S3)

- Pagination:

* - Has the generics for Edges and Paginated types
* - A basic cursor pagination function

- Subscriptions and GraphQL through Websockets:

* - A basic pubsub module
* - Sessions with a way to see online status

## Installation

```bash
$ yarn install
```

## Database Migrations

```bash
# creation
$ yarn migrate:create

# update
$ yarn migrate:update
```

## Running the app

```bash
# development
$ yarn run start

# watch mode
$ yarn run start:dev

# production mode
$ yarn run start:prod
```

## Test

NOTE: I still have not written all test, I'll deploy all test on a single commit when they're ready

```bash
# unit tests
$ yarn run test

# e2e tests
$ yarn run test:e2e

# test coverage
$ yarn run test:cov
```

## Support the frameworks used in this boilerplate

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

Mikro-ORM is a TypeScript ORM for Node.js based on Data Mapper, Unit of Work and Identity Map patterns. If you like MikroORM, give it a [star](https://github.com/mikro-orm/mikro-orm) on GitHub and consider [sponsoring](https://github.com/sponsors/B4nan) its development!

[Sharp](https://github.com/lovell/sharp) is a high performance Node.js image processor. If you want to [support them.](https://opencollective.com/libvips)

## License

This boilerplate code is [MIT licensed](LICENSE).
