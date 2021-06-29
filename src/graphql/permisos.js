import { and, or, rule, shield } from "graphql-shield";

function checkPermission(user, permiso) {
  if (user && user["http://localhost:3000/graphql"]) {
    return user["http://localhost:3000/graphql"].permisos.includes(permiso);
  }
  return false;
}

const isAuthenticated = rule()((parent, args, { user }) => {
  return user !== null;
});

const canUpdateOwnData = rule()((parent, args, { user }) => {
  return checkPermission(user, "mdCompras:270122021");
});

const freepass = rule()((parent, args, { user }) => {
  return true;
});

export default shield({
  Query: {
    //test: or(and(canReadOwnUser, isReadingOwnUser), canReadAnyUser),
    test: canUpdateOwnData
  },
  Mutation: {
    inicioSesion: freepass
  }
});
