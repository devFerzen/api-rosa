import gql from 'graphql-tag';
const usuarioQueries = gql `
  type Query {
    test: String
  }

  type Mutation {
    inicioSesion(correo: String!, contrasena: String!): UsuarioType!,
    registroUsuario(input: UsuarioInput!): UsuarioType!
  }
`;
module.exports = usuarioQueries;
