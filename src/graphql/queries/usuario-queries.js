import gql from 'graphql-tag';
const usuarioQueries = gql `
  type Query {
    queryUsuarioById(id: String!): UsuarioType!
  }

  type Mutation {
    inicioSesion(correo: String!, contrasena: String!): UsuarioType!,
    registroUsuario(input: UsuarioInput!): UsuarioType!,
    actualizacionContrasena(contrasenaVieja: String!, contrasenaNueva: String!): String!,
    compararVerificacionCelular(input: String!):String!,
    compararVerificacionUsuario(input: String!, usuario: String!):String!,
    solicitarRestablecerContrasena( usuario: String! ):String!
    restablecerContrasena(input: String!, usuario: String!, contrasena: String!):String!,
  }
`;
module.exports = usuarioQueries;