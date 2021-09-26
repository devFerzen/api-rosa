import { and, or, rule, shield } from "graphql-shield";

function checkPermission(user, permiso) {
    if (user && user["http://localhost:3000/graphql"]) {
        return user["http://localhost:3000/graphql"].permisos.includes(permiso);
    }
    return false;
}

const usuarioConAutoridad = rule({ cache: 'contextual' })((parent, args, { user }) => {
  console.log(`Shield: user ${user}`);
  return user !== null;
});

const paseLibre = rule({ cache: 'contextual' })((parent, args, { user }) => {
    return true;
});

export default shield(
  {
    Query: {
        //test: or(and(canReadOwnUser, isReadingOwnUser), canReadAnyUser),
        //Usuario
        queryUsuarioById: paseLibre,
        //Anuncio
        queryAnuncios: paseLibre
    },
    Mutation: {
        //Usuario
        inicioSesion: paseLibre,
        registroUsuario: paseLibre,
        actualizacionContrasena: usuarioConAutoridad,
        compararVerificacionCelular: paseLibre,
        solicitarRestablecerContrasena: paseLibre,
        compararVerificacionUsuario: paseLibre,
        restablecerContrasena: paseLibre,
        //Anuncio
        anuncioCreacion: usuarioConAutoridad,
        anuncioActualizacion: usuarioConAutoridad,
        anuncioEliminacion: usuarioConAutoridad,
        anuncioSolicitarVerificacion: usuarioConAutoridad,
        anuncioResponderVerificacion: usuarioConAutoridad
    }
  },
  {
    fallbackError: 'Estas presentando un error en el sistema, favor de contactar a servicio al cliente'
  }
);