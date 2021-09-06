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

const canUpdateOwnData = rule()((parent, args, { user }) => {
  return checkPermission(user, "moduloCompras:270122021");
});

const freepass = rule({ cache: 'contextual' })((parent, args, { user }) => {
  console.log("user")
  console.dir(user)
  return true;
});

export default shield({
  Query: {
    //test: or(and(canReadOwnUser, isReadingOwnUser), canReadAnyUser),
    queryAnuncios: freepass
  },
  Mutation: {
  }
});
