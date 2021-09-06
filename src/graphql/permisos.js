import { and, or, rule, shield } from "graphql-shield";

function checkPermission(user, permiso) {
    if (user && user["http://localhost:3000/graphql"]) {
        return user["http://localhost:3000/graphql"].permisos.includes(permiso);
    }
    return false;
}

const isAuthenticated = rule({ cache: 'contextual' })((parent, args, { user }) => {
    return user !== null;
});

const freepass = rule({ cache: 'contextual' })((parent, args, { user }) => {
    return true;
});

export default shield({
    Query: {
        //test: or(and(canReadOwnUser, isReadingOwnUser), canReadAnyUser),
        //Usuario
        queryUsuarioById: freepass,
        //Anuncio
        queryAnuncios: freepass
    },
    Mutation: {
        //Usuario
        inicioSesion: freepass,
        registroUsuario: freepass,
        actualizacionContrasena: isAuthenticated,
        solicitarVerificacionCelular: freepass,
        compararVerificacionCelular: freepass,
        solicitarRestablecerContrasena: freepass,
        compararVerificacionUsuario: freepass,
        restablecerContrasena: freepass,
        //Anuncio
        anuncioCreacion: isAuthenticated,
        anuncioActualizacion: isAuthenticated,
        anuncioEliminacion: isAuthenticated,
        anuncioSolicitarVerificacion: isAuthenticated,
        anuncioResponderVerificacion: isAuthenticated

    }
});