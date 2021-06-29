import { users } from './data';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

module.exports = {
  Query: {
      test: async(_, args, { user }) => {
        console.log("user.sub para saber id");
        console.dir(user);
        return `testing...${user["http://localhost:3000/graphql"].permisos[0]}`;
      }
  },

  Mutation: {
    async inicioSesion(parent, {correo, contrasena}, {Models}){
      const SearchedUser = await Models.Usuario.findOne({usuario: correo});
      /*let comparacionContras = await bcrypt.compare(contrasena, SearchedUser.contrasena);
      if(!comparacionContras){
        throw new Error('Contraseña Incorrecta');
      }*/
      console.dir(SearchedUser);

      let sesion = {
        token: jwt.sign( {"http://localhost:3000/graphql": { id: SearchedUser.id }} ,"envPassSecret",{algorithm: "HS256", subject: SearchedUser.id, expiresIn: "1d"})
      }

      return sesion;
    }
  }
}
