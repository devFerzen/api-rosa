import gql from 'graphql-tag';
const anuncioQueries = gql `
  type Mutation {
    creacionAnuncio(input: AnuncioInput!, idUsuario: String!): AnuncioType!,
    updateAnuncio(input: AnuncioInput!): AnuncioType!,
    likeAnuncio(idAnuncio: String!): String!,
    vistaAnuncio(idAnuncio: String!): String!,
    solicitarVerificacionAnuncio(input: VerificacionInput!): String!
    responderVerificacionAnuncio(input: VerificacionInput!): String!
  }
`;
module.exports = anuncioQueries;
