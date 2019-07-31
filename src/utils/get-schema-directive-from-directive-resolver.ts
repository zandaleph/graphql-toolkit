import { DirectiveResolverFn, SchemaDirectiveVisitor } from '@kamilkisiela/graphql-tools';
import { GraphQLField } from 'graphql/type/definition';
import { defaultFieldResolver } from 'graphql/execution/execute';

export function getSchemaDirectiveFromDirectiveResolver<TSource, TContext, TArgs>(directiveResolver: DirectiveResolverFn<TSource, TContext>) {
  const { SchemaDirectiveVisitor: Clazz }: { SchemaDirectiveVisitor: typeof SchemaDirectiveVisitor } = eval(`require('graphql-tools')`);
  return class extends Clazz {
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
