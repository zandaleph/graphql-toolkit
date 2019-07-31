import { loadTypedefs, LoadTypedefsOptions } from './load-typedefs';
import { LoadFromUrlOptions } from './load-from-url';
import { OPERATION_KINDS } from './documents';
import { mergeTypeDefs } from '../epoxy';
import { buildASTSchema } from 'graphql/utilities/buildASTSchema';
import { GraphQLSchema } from 'graphql/type/schema';

export async function loadSchema(pointToSchema: string | string[], options?: LoadTypedefsOptions, cwd = process.cwd()): Promise<GraphQLSchema> {
  const types = await loadTypedefs<LoadFromUrlOptions>(pointToSchema, options, OPERATION_KINDS, cwd);

  return buildASTSchema(mergeTypeDefs(types.map(m => m.content)));
}
