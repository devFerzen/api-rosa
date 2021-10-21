import { makeExecutableSchema } from 'apollo-server-express';
import { mergeTypeDefs, mergeResolvers } from 'graphql-tools';

import tiposBase from './queries/tipos-globales-base';
import tiposSubBase from './queries/tipos-globales-subBase';

import usuarioQueries from './queries/usuario-queries';
import anuncioQueries from './queries/anuncio-queries';
import paquetesQueries from './queries/paquetes-queries';
import generalQueries from './queries/general-queries';

import usuarioResolvers from './resolvers/usuario-resolver';
import anuncioResolvers from './resolvers/anuncio-resolver';
import paquetesResolvers from './resolvers/paquetes-resolver';
import generalResolvers from './resolvers/general-resolver';

const defs = mergeTypeDefs([tiposBase, tiposSubBase, usuarioQueries, anuncioQueries, paquetesQueries, generalQueries]);
const resolver = mergeResolvers([usuarioResolvers, anuncioResolvers, paquetesResolvers, generalResolvers]);

export default makeExecutableSchema({
    typeDefs: defs,
    resolvers: resolver
});