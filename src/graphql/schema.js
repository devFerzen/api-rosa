import { makeExecutableSchema } from 'apollo-server-express';
import { mergeTypeDefs, mergeResolvers } from 'graphql-tools';
import usuarioQueries from './queries/usuario-queries';
import globalQueries from './queries/global-queries';
import usuarioResolvers from './resolvers/usuario-resolver';

const defs = mergeTypeDefs([usuarioQueries, globalQueries]);
const resolver = mergeResolvers([usuarioResolvers]);

export default makeExecutableSchema({
  typeDefs: defs,
  resolvers: resolver
});
