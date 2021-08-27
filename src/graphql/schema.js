import { makeExecutableSchema } from 'apollo-server-express';
import { mergeTypeDefs, mergeResolvers } from 'graphql-tools';

import tiposBase from './queries/tipos-globales-base';
import tiposSubBase from './queries/tipos-globales-subBase';

import usuarioQueries from './queries/usuario-queries';
import anuncioQueries from './queries/anuncio-queries';
import bitacoraCreacionQueries from './queries/bitacora-creacion-queries';

import usuarioResolvers from './resolvers/usuario-resolver';
import anuncioResolvers from './resolvers/anuncio-resolver';
import bitacorasCreacionResolvers from './resolvers/bitacoras-creacion-resolver';

const defs = mergeTypeDefs([tiposBase, tiposSubBase, usuarioQueries, anuncioQueries]);
const resolver = mergeResolvers([usuarioResolvers, anuncioResolvers]);

export default makeExecutableSchema({
  typeDefs: defs,
  resolvers: resolver
});
