import {  SchemaDirectiveVisitor } from '@kamilkisiela/graphql-tools/dist/schemaVisitor';
import { GraphQLField, defaultFieldResolver } from 'graphql';
import { DirectiveResolverFn } from '@kamilkisiela/graphql-tools/dist/Interfaces';

export function getSchemaDirectiveFromDirectiveResolver<TSource, TContext, TArgs>(directiveResolver: DirectiveResolverFn<TSource, TContext>) {
  return class extends SchemaDirectiveVisitor {
    public visitFieldDefinition(field: GraphQLField<TSource, TContext, TArgs>) {
      const resolver = directiveResolver;
      const originalResolver = field.resolve || defaultFieldResolver;
      const directiveArgs = this.args;
      field.resolve = (...args: any[]) => {
        const [source, /* original args */, context, info] = args;
        return resolver(
          async () => originalResolver.apply(field, args),
          source,
          directiveArgs,
          context,
          info,
        );
      };
    }
  } as typeof SchemaDirectiveVisitor;
}
