import { GraphQLSchema, GraphQLScalarType, GraphQLObjectType, GraphQLInterfaceType, DocumentNode, buildASTSchema, GraphQLEnumType, GraphQLUnionType, parse } from "graphql";
import { IResolvers } from "@kamilkisiela/graphql-tools";
import { extractFieldResolversFromObjectType } from "./extract-field-resolvers-from-object-type";

export interface ExtractResolversFromSchemaOptions {
    selectedTypeDefs?: DocumentNode | string;
}

export function extractResolversFromSchema(schema: GraphQLSchema, options ?: ExtractResolversFromSchemaOptions): IResolvers {
    const resolvers: IResolvers = {};
    const typeMap = schema.getTypeMap();
    let selectedTypeNames: string[];
    const selectedTypeDefs = options && options.selectedTypeDefs && (typeof options.selectedTypeDefs === 'string' ? parse(options.selectedTypeDefs) : options.selectedTypeDefs);
    if(selectedTypeDefs) {
        const invalidSchema = buildASTSchema(selectedTypeDefs);
        selectedTypeNames = Object.keys(invalidSchema.getTypeMap());
    }
    for (const typeName in typeMap) {
        if (!typeName.startsWith('__')){
            const typeDef = typeMap[typeName];
            if (selectedTypeNames && !selectedTypeNames.includes(typeName)) {
                continue;
            }
            if (typeDef instanceof GraphQLScalarType) {
                resolvers[typeName] = typeDef as GraphQLScalarType;
            } else if (typeDef instanceof GraphQLObjectType || typeDef instanceof GraphQLInterfaceType) {
                resolvers[typeName] = extractFieldResolversFromObjectType(typeDef, {
                    selectedTypeDefs,
                });
            } else if (typeDef instanceof GraphQLEnumType) {
                const enumValues = typeDef.getValues();
                resolvers[typeName] = {};
                for (const { name, value } of enumValues) {
                    resolvers[typeName][name] = value;
                }
            } else if (typeDef instanceof GraphQLUnionType) {
                resolvers[typeName] = {
                    __resolveType: typeDef.resolveType,
                };
            }
        }
    }
    return resolvers;
}