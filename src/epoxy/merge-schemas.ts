import { GraphQLSchema, DocumentNode } from "graphql";
import { IResolvers } from "@kamilkisiela/graphql-tools";
import { mergeTypeDefs } from "./typedefs-mergers/merge-typedefs";
import { mergeResolvers } from "./resolvers-mergers/merge-resolvers";
import { extractResolversFromSchema, ResolversComposerMapping, composeResolvers, buildSchemaWithResolvers } from "../utils";

export interface MergeSchemasConfig<Resolvers extends IResolvers = IResolvers> {
    schemas: GraphQLSchema[];
    typeDefs?: DocumentNode | string;
    resolvers?: Resolvers;
    resolversComposition?: ResolversComposerMapping<Resolvers>;
    exclusions?: string[];
}

export function mergeSchemas({
    schemas,
    typeDefs,
    resolvers = {},
    resolversComposition = {},
    exclusions,
}: MergeSchemasConfig) {
    return buildSchemaWithResolvers({
        typeDefs: mergeTypeDefs(typeDefs ? [
            ...schemas,
            typeDefs,
        ] : schemas, { exclusions }),
        resolvers: composeResolvers(
            mergeResolvers([
                ...schemas.map(schema => extractResolversFromSchema(schema)),
                resolvers,
            ], { exclusions }),
            resolversComposition,
        )
    })
}

export async function mergeSchemasAsync({
    schemas,
    typeDefs,
    resolvers = {},
    resolversComposition = {},
    exclusions,
}: MergeSchemasConfig) {
    const [
        typeDefsOutput,
        resolversOutput,
    ] = await Promise.all([
        mergeTypeDefs(typeDefs ? [
            ...schemas,
            typeDefs,
        ] : schemas, { exclusions }),
        Promise
            .all(schemas.map(async schema => extractResolversFromSchema(schema)))
            .then(extractedResolvers => composeResolvers(
                mergeResolvers([
                    ...extractedResolvers,
                    resolvers,
                ], { exclusions }),
                resolversComposition,
            )),
    ])
    return buildSchemaWithResolvers({
        typeDefs: typeDefsOutput,
        resolvers: resolversOutput
    })
}