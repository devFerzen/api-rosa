import gql from 'graphql-tag';
const anuncioQueries = gql `
  type Query {
    queryAnunciosById(ids: [String]): [AnuncioType],
    queryAnuncios(query: QueryAnuncioInput!): [AnuncioType],

  },
  type Mutation {
    anuncioCreacion(input: AnuncioInput!, id_usuario: String!): AnuncioType!,
    anuncioActualizacion(input: AnuncioInput!): String!,
    anuncioEliminacion(id_anuncio: String!): String!,
    anunciolike(idAnuncio: String!): String!,
    anuncioVista(idAnuncio: String!): String!,
    solicitarVerificacionCelular: String!,
    solicitarVerificacionAnuncio(id_anuncio: String!, foto_anuncio: String!): String!,
    anuncioResponderVerificacion(input: VerificacionInput!): String!
  }
`;
module.exports = anuncioQueries;