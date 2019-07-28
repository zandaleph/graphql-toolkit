import { mergeSchemas } from '../../src/epoxy';
import { graphql, buildSchema, GraphQLScalarType, Kind, buildASTSchema, GraphQLSchema, ListValueNode, parse } from "graphql";
import { mergeSchemasAsync } from "../../src/epoxy/merge-schemas";
import { buildSchemaWithResolvers } from '../../src';

describe('Merge Schemas', () => {
    it('should merge two valid executable schemas', async () => {
        const fooSchema = buildSchemaWithResolvers({
            typeDefs: /* GraphQL */ `
                type Query {
                    foo: String
                }
            `,
            resolvers: {
                Query: {
                    foo: () => 'FOO'
                }
            }
        });
        const barSchema = buildSchemaWithResolvers({
            typeDefs: /* GraphQL */ `
                type Query {
                    bar: String
                }
            `,
            resolvers: {
                Query: {
                    bar: () => 'BAR'
                }
            }
        });
        const { errors, data } = await graphql({
            schema: mergeSchemas({
                schemas: [fooSchema, barSchema]
            }),
            source: `
                {
                    foo
                    bar
                }
            `
        });
        expect(errors).toBeFalsy();
        expect(data.foo).toBe('FOO');
        expect(data.bar).toBe('BAR');
    });
    it('should merge two valid executable schemas async', async () => {
        const fooSchema = buildSchemaWithResolvers({
            typeDefs: /* GraphQL */ `
                type Query {
                    foo: String
                }
            `,
            resolvers: {
                Query: {
                    foo: () => 'FOO'
                }
            }
        });
        const barSchema = buildSchemaWithResolvers({
            typeDefs: /* GraphQL */ `
                type Query {
                    bar: String
                }
            `,
            resolvers: {
                Query: {
                    bar: () => 'BAR'
                }
            }
        });
        const { errors, data } = await graphql({
            schema: await mergeSchemasAsync({
                schemas: [fooSchema, barSchema]
            }),
            source: `
                {
                    foo
                    bar
                }
            `
        });
        expect(errors).toBeFalsy();
        expect(data.foo).toBe('FOO');
        expect(data.bar).toBe('BAR');
    });
    it('should merge two valid executable schemas with extra resolvers', async () => {
        const fooSchema = buildSchemaWithResolvers({
            typeDefs: /* GraphQL */ `
                type Query {
                    foo: String
                }
            `,
            resolvers: {
                Query: {
                    foo: () => 'FOO'
                }
            }
        });
        const barSchema = buildSchemaWithResolvers({
            typeDefs: /* GraphQL */ `
                type Query {
                    bar: String
                    qux: String
                }
            `,
            resolvers: {
                Query: {
                    bar: () => 'BAR'
                }
            }
        });
        const { errors, data } = await graphql({
            schema: mergeSchemas({
                schemas: [fooSchema, barSchema],
                resolvers: {
                    Query: {
                        qux: () => 'QUX'
                    }
                }
            }),
            source: `
                {
                    foo
                    bar
                    qux
                }
            `
        });
        expect(errors).toBeFalsy();
        expect(data.foo).toBe('FOO');
        expect(data.bar).toBe('BAR');
        expect(data.qux).toBe('QUX');
    });
    it('should merge two valid executable schemas with extra typeDefs and resolvers', async () => {
        const fooSchema = buildSchemaWithResolvers({
            typeDefs: /* GraphQL */ `
                type Query {
                    foo: String
                }
            `,
            resolvers: {
                Query: {
                    foo: () => 'FOO'
                }
            }
        });
        const barSchema = buildSchemaWithResolvers({
            typeDefs: /* GraphQL */ `
                type Query {
                    bar: String
                }
            `,
            resolvers: {
                Query: {
                    bar: () => 'BAR'
                }
            }
        });
        const { errors, data } = await graphql({
            schema: mergeSchemas({
                schemas: [fooSchema, barSchema],
                typeDefs: /* GraphQL */ `
                    type Query {
                        qux: String
                    }
                `,
                resolvers: {
                    Query: {
                        qux: () => 'QUX'
                    }
                }
            }),
            source: `
                {
                    foo
                    bar
                    qux
                }
            `
        });
        expect(errors).toBeFalsy();
        expect(data.foo).toBe('FOO');
        expect(data.bar).toBe('BAR');
        expect(data.qux).toBe('QUX');
    });
    it('should merge two valid schemas by keeping their directives to be used in extra typeDefs', async () => {
        const fooSchema = buildSchemaWithResolvers({
            typeDefs: /* GraphQL */ `
                directive @fooDirective on FIELD_DEFINITION
                type Query {
                    foo: String
                }
            `,
            resolvers: {
                Query: {
                    foo: () => 'FOO'
                }
            }
        });
        const barSchema = buildSchemaWithResolvers({
            typeDefs: /* GraphQL */ `
                type Query {
                    bar: String
                }
            `,
            resolvers: {
                Query: {
                    bar: () => 'BAR'
                }
            }
        });
        const { errors, data } = await graphql({
            schema: mergeSchemas({
                schemas: [fooSchema, barSchema],
                typeDefs: /* GraphQL */ `
                    type Query {
                        qux: String @fooDirective
                    }
                `,
                resolvers: {
                    Query: {
                        qux: () => 'QUX'
                    }
                }
            }),
            source: `
                {
                    foo
                    bar
                    qux
                }
            `
        });
        expect(errors).toBeFalsy();
        expect(data.foo).toBe('FOO');
        expect(data.bar).toBe('BAR');
        expect(data.qux).toBe('QUX');
    });
    it('should merge valid schemas with interfaces correctly', async () => {
        const fooSchema = buildSchemaWithResolvers({
            typeDefs: /* GraphQL */ `
                interface Foo {
                    foo: String
                }
                type Bar implements Foo {
                    foo: String
                    bar: String
                }
                type Qux implements Foo {
                    foo: String
                    qux: String
                }
            `
        })
        const barSchema = buildSchemaWithResolvers({
            typeDefs: /* GraphQL */ `
                interface Foo {
                    foo: String
                }
                type Query {
                    bar: Foo
                    qux: Foo
                }
            `,
            resolvers: {
                Foo: {
                    __resolveType: (root: any) => {
                        if ('bar' in root) {
                            return 'Bar';
                        }
                        if ('qux' in root) {
                            return 'Qux';
                        }
                        return null;
                    }
                },
                Query: {
                    bar: () => ({ foo: 'foo', bar: 'bar' }),
                    qux: () => ({ foo: 'foo', qux: 'qux'})
                }
            }
        });
        const { errors, data } = await graphql({
            schema: mergeSchemas({
                schemas: [fooSchema, barSchema]
            }),
            source: `
                {
                    bar {
                        foo
                        ... on Bar {
                            bar
                        }
                    }
                    qux {
                        foo
                        ... on Qux {
                            qux
                        }
                    }
                }
            `
        });
        expect(errors).toBeFalsy();
        expect(data.bar.foo).toBe('foo');
        expect(data.bar.bar).toBe('bar');
        expect(data.qux.foo).toBe('foo');
        expect(data.qux.qux).toBe('qux');
    })

    it('should merge scalars (part of resolvers)', async () => {
        const now = new Date();
        const schemaA = buildSchemaWithResolvers({
            typeDefs: `
                        scalar Date
                        type Query { a: Date }
                       `,
            resolvers: {
                Query: {
                    a: () => now,
                },
                Date: new GraphQLScalarType({
                    name: 'DateTime',
                    serialize(value) {
                        return new Date(value).toISOString()
                    },
                    parseValue(value) {
                        return new Date(value);
                    },
                    parseLiteral(ast) {
                        if (ast.kind !== Kind.STRING) {
                            throw new TypeError(`Date cannot represent non string type`);
                        }
                        return new Date(ast.value);
                    }
                })
            }
        });
        const schemaB = buildSchemaWithResolvers({
            typeDefs: `type Query { b: String }`,
        });

        const schema = mergeSchemas({ schemas: [schemaA, schemaB] });

        // original schema A
        const { data: dataA } = await graphql({
            schema: schemaA,
            source: /* GraphQL */` { a } `
        });

        expect(dataA.a).toEqual(now.toISOString());

        // merged schema
        const { data } = await graphql({
            schema,
            source: /* GraphQL */` { a } `
        });

        expect(data.a).toEqual(now.toISOString());
    })

    it('should merge when directive uses enum', () => {
        const merged = mergeSchemas({
            schemas: [buildASTSchema(/* GraphQL */ parse(`
                directive @date(format: DateFormat) on FIELD_DEFINITION
                
                enum DateFormat {
                    LOCAL
                    ISO
                }
            `))],
            typeDefs: /* GraphQL */ `
                scalar Date

                type Query {
                    today: Date @date
                }
            `
        });
  
        expect(merged.getDirective('date')).toBeDefined();
      });
      it('should merge a lot of directives but without high memory usage', () => {
          let num = 100;
          const base = buildSchema(/* GraphQL */`
              directive @access(roles: [String]) on FIELD_DEFINITION
  
              type Query {
                test: Boolean @access(roles: ["Admin"])
              }
          `);

          let prev: GraphQLSchema = base;

          while(num--) {
              prev = mergeSchemas({schemas: [prev, base]})
          }

        expect((prev.getQueryType().getFields().test.astNode.directives[0].arguments[0].value as ListValueNode).values).toHaveLength(1);
      });
})