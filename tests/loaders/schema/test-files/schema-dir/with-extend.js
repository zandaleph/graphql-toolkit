const { buildASTSchema } = require('graphql');

const schema = buildASTSchema(
  /* GraphQL */ `
    type User {
      a: String
    }

    type Query {
      user: User
    }

    extend type Query {
      hello: String
    }
  `
);

module.exports = schema;
