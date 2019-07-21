import { GraphQLObjectType, GraphQLScalarType, GraphQLInterfaceType, GraphQLUnionType, GraphQLEnumType, buildASTSchema, DocumentNode, parse } from 'graphql';
import { mergeTypeDefs, mergeResolvers } from '../epoxy';
import { ResolversComposerMapping, composeResolvers } from './resolvers-composition';

export interface BuildSchemaWithResolversOptions {
    typeDefs: string | string[] | DocumentNode | DocumentNode[];
    resolvers?: any;
    resolversComposition?: ResolversComposerMapping;
}

export function buildSchemaWithResolvers({ typeDefs, resolvers, resolversComposition }: BuildSchemaWithResolversOptions) {
    if (typeDefs instanceof Array) {
        typeDefs = mergeTypeDefs(typeDefs);
    }
    if (typeof typeDefs === 'string') {
        typeDefs = parse(typeDefs);
    }
    const schema = buildASTSchema(typeDefs);
    if (resolvers) {
        if (resolvers instanceof Array) {
            resolvers = mergeResolvers(resolvers);
        }
        if (resolversComposition) {
            resolvers = composeResolvers(resolvers, resolversComposition);
        }
        const typeMap = schema.getTypeMap();
        for (const typeName in resolvers) {
            if (typeName in typeMap) {
                const typeResolvers = resolvers[typeName];
                const type = typeMap[typeName];
                if (type instanceof GraphQLScalarType) {
                    Object.assign(typeMap[typeName], typeResolvers);
                } else if (type instanceof GraphQLObjectType || type instanceof GraphQLInterfaceType) {
                    const fields = type.getFields();
                    for (const fieldName in typeResolvers) {
                        if (type instanceof GraphQLInterfaceType && fieldName === '__resolveType') {
                            type.resolveType = typeResolvers.__resolveType;
                        } else if (type instanceof GraphQLObjectType && fieldName === '__isTypeOf') {
                            type.isTypeOf = typeResolvers.__isTypeOf;
                        } else if (fieldName in fields) {
                            const fieldResolver = typeResolvers[fieldName];
                            if ('subscribe' in fieldResolver) {
                                fields[fieldName].subscribe = fieldResolver.subscribe;
                            }
                            if ('resolve' in fieldResolver) {
                                fields[fieldName].resolve = fieldResolver.resolve
                            }
                            if (fieldResolver instanceof Function) {
                                fields[fieldName].resolve = typeResolvers[fieldName].bind(typeResolvers);
                            }
                        }
                    }
                } else if (type instanceof GraphQLEnumType) {
                    const enumValues = type.getValues();
                    for (const enumValue of enumValues) {
                        if (enumValue.name in typeResolvers) {
                            enumValue.value = typeResolvers[enumValue.name];
                        }
                    }
                } else if (type instanceof GraphQLUnionType) {
                    if ('__resolveType' in typeResolvers) {
                        type.resolveType = typeResolvers.__resolveType;
                    }
                }
            }
        }
    }

    return schema;
}
