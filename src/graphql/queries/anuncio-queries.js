import gql from 'graphql-tag';
const anuncioQueries = gql `
  type Query {
    queryAnunciosById(ids: [String]): [AnuncioType],
    queryAnuncios(query: QueryAnuncioInput!): [AnuncioType],

  },
  type Mutation {
    anuncioCreacion(input: AnuncioInput!, idUsuario: String!): AnuncioType!,
    anuncioActualizacion(input: AnuncioInput!): String!,
    anunciolike(idAnuncio: String!): String!,
    anuncioVista(idAnuncio: String!): String!,
    anuncioSolicitarVerificacion(input: VerificacionInput!): String!,
    anuncioResponderVerificacion(input: VerificacionInput!): String!
  }
`;
module.exports = anuncioQueries;
