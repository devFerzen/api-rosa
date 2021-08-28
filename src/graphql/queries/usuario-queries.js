import gql from 'graphql-tag';
const usuarioQueries = gql `
  type Query {
    queryUsuarioById(id: String!): UsuarioType!
  }

  type Mutation {
    inicioSesion(correo: String!, contrasena: String!): UsuarioType!,
    registroUsuario(input: UsuarioInput!): UsuarioType!
  }
`;
module.exports = usuarioQueries;