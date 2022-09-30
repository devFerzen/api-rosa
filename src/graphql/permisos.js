import { and, or, rule, shield } from "graphql-shield";

function checkPermission(user, permiso) {
    if (user && user["http://localhost:3080/graphql"]) {
        return user["http://localhost:3080/graphql"].permisos.includes(permiso);
    }
    return false;
}

const usuarioConAutoridad = rule({ cache: 'contextual' })((parent, args, { user }) => {
  console.log(`Shield: user ${user}`);
  console.dir(user);
  return user !== null;
});

const paseLibre = rule()((parent, args, { user }) => {
    console.log(`Shield: user ${user} debe ser null`);
    console.dir(user);
    return true;
});

export default shield(
  {
    Query: {
        //test: or(and(canReadOwnUser, isReadingOwnUser), canReadAnyUser),
        //Usuario
        queryUsuarioById: paseLibre,
        queryUsuario: paseLibre,
        //Anuncio
        queryAnuncios: paseLibre,
        //General
        queryddlsByCategoria: paseLibre
    },
    Mutation: {
        //Usuario
        inicioSesion: paseLibre,
        cerrarSesion: paseLibre,
        registroUsuario: paseLibre,
        actualizacionContrasena: usuarioConAutoridad,
        actualizacionDefaultContactos: usuarioConAutoridad,
        compararVerificacionCelular: paseLibre,
        compararVerificacionUsuario: paseLibre,
        solicitarRestablecerContrasena: paseLibre,
        restablecerContrasena: paseLibre,
        //Anuncio
        anuncioCreacion: usuarioConAutoridad,
        anuncioActualizacion: usuarioConAutoridad,
        anuncioEliminacion: usuarioConAutoridad,
        imagenEliminacion:usuarioConAutoridad,
        anunciolike:paseLibre,
        anuncioVista:paseLibre,
        solicitarVerificacionCelular: usuarioConAutoridad,
        solicitarVerificacionAnuncio: usuarioConAutoridad,
        anuncioResponderVerificacion: usuarioConAutoridad
    }
  },
  {
    allowExternalErrors: true,
    fallbackError: 'Estas presentando un error en el sistema, favor de contactar a servicio al cliente'
  }
);