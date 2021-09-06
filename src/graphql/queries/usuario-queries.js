import gql from 'graphql-tag';
const usuarioQueries = gql `
  type Query {
    queryUsuarioById(id: String!): UsuarioType!
  }

  type Mutation {
    inicioSesion(correo: String!, contrasena: String!): UsuarioType!,
    registroUsuario(input: UsuarioInput!): UsuarioType!,
    actualizacionContrasena(id_usuario: String!, contrasenaVieja: String!, contrasenaNueva: String!): String!,
    compararVerificacionCelular(input: String!, id_usuario: String!):String!,
    compararVerificacionUsuario(input: String!, usuario: String!):String!,
    solicitarVerificacionCelular( id_usuario: String! ):String!,
    solicitarRestablecerContrasena( usuario: String! ):String!
    restablecerContrasena(input: String!, usuario: String!, contrasena: String!):String!,
  }
`;
module.exports = usuarioQueries;
