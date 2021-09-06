import bcrypt from 'bcrypt';
import creacionToken from '../../utilities/autorizacionToken'
import CodigoVerificacion from '../../utilities/codigoVerificacion'
import UsuarioClass from '../../utilities/Usuario'
import { GraphQLScalarType } from 'graphql';
import { Kind } from 'graphql/language';
import sizeof from 'object-sizeof';


module.exports = {
    Date: new GraphQLScalarType({
        name: 'Date',
        description: 'Date custom scalar type',
        parseValue(value) {
            return new Date(value); // value from the client
        },
        serialize(value) {
            return value.getTime(); // value sent to the client
        },
        parseLiteral(ast) {
            if (ast.kind === Kind.INT) {
                return new Date(+ast.value) // ast value is always in string format
            }
            return null;
        },
    }),
    Query: {
        queryUsuarioById: async(_, { id }, { Models }) => {
            try {
                let result = await Models.Usuario.findById(id).lean();
                console.log(sizeof(result));
                return result;
            } catch (error) {
                console.dir(err)
                throw new Error(err);
            }
        }
    },

    Mutation: {
        async inicioSesion(parent, { correo, contrasena }, { Models }) {
          let UsuarioLoggeado, Usuario, comparacionContrasenas;
          let usuarioClass = UsuarioClass.Usuario;
          try {
            UsuarioLoggeado = await Models.Usuario.findOne({ usuario: correo, estado: true}, {}).exec();
            Usuario = new usuarioClass(UsuarioLoggeado);
          } catch (error) {
            console.dir(error);
            throw new Error('Error en la búsqueda!')
          }

          if (!UsuarioLoggeado) {
              throw new Error('Usuario no existe!');
          }

          comparacionContrasenas = await bcrypt.compare(contrasena, UsuarioLoggeado.contrasena);

          if (!comparacionContrasenas) {
            Usuario.verificacionUsuarioNuevoIntento();
            throw new Error('inicioSesion: Contraseña Incorrecta');
          }

          const { autorizacion_token } = creacionToken(UsuarioLoggeado);
          UsuarioLoggeado.token = autorizacion_token;

          //Ver el auth de vuemaster para ver si guardar en cookie esta bien
          return UsuarioLoggeado;
        },


        /*
          registroUsuario: Registra un nuevo usuario.
        */
        async registroUsuario(parent, { input }, { Models }) {
          let Usuario;
          let usuarioClass = UsuarioClass.Usuario;

          input.contrasena = await bcrypt.hash(input.contrasena, 10).catch(
              err => {
                  throw new Error('registroUsuario: Error en la encriptacion');
                  console.dir(err);
              }
          );

          Usuario = new usuarioClass(input);
          const NuevoUsuario = new Models.Usuario(input);
          await NuevoUsuario.save()
          .catch(
              err => {
                throw new Error(`registroUsuario: Error en la save ${err}`);
              }
          );

            const { autorizacion_token } = creacionToken(NuevoUsuario);
            NuevoUsuario.token = autorizacion_token;

            // Salvando en la bitacora.  require refactorización**
            const updateOne = Models.BitacoraCreaciones.updateOne({ "fecha_creacion": "2021-08-24" }, {
                "$push": {
                    "Creacion": {
                        "id_usuario": NuevoUsuario.id,
                        "estado": NuevoUsuario.Ubicacion_Usuario.estado,
                        "ciudad": NuevoUsuario.Ubicacion_Usuario.ciudad,
                        "categorias": [],
                        "tipo": "Registro"
                    }
                },
                "$inc": { "count_registro": 1 }
              },
              {
                upsert: true,
                strict: false
              }
            ).catch(err => {
                console.log(`error en el updateOne de bitacoraCreacion... Registro`);
                console.dir(err);
            });

            return NuevoUsuario;
        },

        /*
          actualizacionContrasena: Actualización que se hace dentro de la sesion del usuario.
        */
        async actualizacionContrasena(parent, { id_usuario, contrasenaVieja, contrasenaNueva }, { Models }){
          let ResultadoUsuario, Usuario, comparacionContrasenas, result;
          let usuarioClass = UsuarioClass.Usuario;

          //busqueda de usuadio
          try {
            ResultadoUsuario = await Models.Usuario.findById(id_usuario, {'contrasena':1,'max_intentos':1}).exec();
            ResultadoUsuario.contrasenaNueva = contrasenaNueva;
            Usuario = new usuarioClass(ResultadoUsuario);
          } catch (err) {
            console.dir(err);
            throw new Error("actualizacionContrasena: Posible error en el id brindado!");
          }

          if(!ResultadoUsuario){
            throw new Error("actualizacionContrasena: Usuario no se encontro");
          }

          if(ResultadoUsuario.max_intentos >= 5){
            // nueva verificacion ** Pendiente bloqueo de usuario
            let result = await Usuario.verificacionNuevoUsuario()
              .catch(err => {
                throw new Error( `compararVerificacionUsuario: ${err.mensaje}`);
              });
            
            Usuario.enviandoCorreo().then(
              resolved => {
                console.log(`${resolved.mensaje}: Favor de verificar el código enviado a su correo!`);
              },
              err => {
                throw new Error( `compararVerificacionUsuario: ${err.mensaje}`);
              }
            );
            throw new Error(`compararVerificacionUsuario: Haz excedido el limite de intentos su nuevo ${result.mensaje} y enviado a su correo.!`);
          }

          //Comparaciones de contrasenas
          comparacionContrasenas = await bcrypt.compare(contrasenaVieja, ResultadoUsuario.contrasena);
          if (!comparacionContrasenas) {
              Usuario.verificacionUsuarioNuevoIntento();
              throw new Error('actualizacionContrasena: Contraseña Incorrecta');
          }

          result = await Usuario.guardandoContrasena({'max_intentos': 1}).catch(err => {
              throw new Error(`actualizacionContrasena:  ${err.mensaje}`);
          });

          //Función de email
          Usuario.enviandoCorreo().then(
            result => {
              console.log(result.mensaje);
            },
            reject => {}
          );

          return `actualizacionContrasena: ${result.mensaje}`;
        },
        
        /*
        solicitarVerificacionCelular: Manda una verificación de celular
         */
        async solicitarVerificacionCelular(parent, { id_usuario }, { Models }){
          let ResultadoUsuario, Usuario, result;

          try {
            ResultadoUsuario = await Models.Usuario.findById(id_usuario,{ 'max_updates':1, 'codigo_verificacion_celular':1, 'numero_telefonico_verificado':1}).exec();
            let usuarioClass = UsuarioClass.Usuario;
            Usuario = new usuarioClass(ResultadoUsuario);
          } catch (error) {
            console.dir(error)
            throw new Error( `solicitarVerificacionCelular: Error en la búsqueda!`);
          }

          if (!ResultadoUsuario) {
            throw new Error('solicitarVerificacionCelular: Usuario no existe!');
          }

          result = await Usuario.verificacionNuevaCelular().catch(err => {
            throw new Error(`compararVerificacionCelular: Favor de intentar nuevamente o contactar a servicio al cliente!`);
          });

          Usuario.enviandoCorreo().then(resolved => {
            console.log(resolved.mensaje);
          });

          return `solicitarVerificacionCelular: ${result.mensaje}`;
        },

        /*
        compararVerificacionCelular: Compara el código de verificación de celular y permitirá
        crear anuncios ahora
         */
        async compararVerificacionCelular(parent, { input, id_usuario }, { Models }){
          let ResultadoUsuario, Usuario, result;

          try {
            ResultadoUsuario = await Models.Usuario.findById(id_usuario,{ 'max_updates':1, 'codigo_verificacion_celular':1, 'numero_telefonico_verificado':1}).exec();
            let usuarioClass = UsuarioClass.Usuario;
            Usuario = new usuarioClass(ResultadoUsuario);
          } catch (error) {
            console.dir(error)
            throw new Error( `compararVerificacionCelular: Error en la búsqueda!`);
          }

          if (!ResultadoUsuario) {
            throw new Error('compararVerificacionCelular: Usuario no existe!');
          }

          if(ResultadoUsuario.max_updates >= 3){            
            let result = await Usuario.verificacionNuevaCelular().catch(err => {
              throw new Error(`compararVerificacionCelular: Favor de intentar nuevamente o contactar a servicio al cliente!`);
            });

            Usuario.enviandoCorreo().then(resolved => {
              console.log(`${resolved.mensaje}: Nueva verificación de celuar`);
            });
            throw new Error(`compararVerificacionCelular: Haz excedido el limite de intentos su nueva ${result.mensaje} y enviado a su correo.!`);
          }

          if(!ResultadoUsuario.codigo_verificacion_celular){
            await Usuario.verificacionNuevaCelular().catch(err => {
              throw new Error(`compararVerificacionCelular: Favor de intentar nuevamente o contactar a servicio al cliente!`);
            });

            Usuario.enviandoCorreo().then(resolved => {
              console.log(`${resolved.mensaje}: Nueva verificación de celuar`);
            });
            return "compararVerificacionCelular: No cuenta con código de verificación, enviarlo a la vista de verificación!";
          }

          if(ResultadoUsuario.codigo_verificacion_celular !== input){
            Usuario.verificacionCelularNuevoIntento();
            throw new Error(`compararVerificacionUsuario: Código de verificación incorrecto!`);
          }

          result = await Usuario.verificarCelularUsuario().catch(err => {
            throw new Error( `compararVerificacionCelular: ${err.mensaje}`);
          });

          return result.mensaje;
        },        

        /*
          solicitarRestablecerContraseña: Manda una verificación usuario
         */
        async solicitarRestablecerContrasena(parent, { usuario }, { Models }){
          let ResultadoUsuario,result;
          try {
            ResultadoUsuario = await Models.Usuario.findOne({usuario: usuario}, { 'max_intentos':1, 'codigo_verificacion_usuario':1 })
                                          .exec();
          } catch (error) {
            console.dir(error)
            throw new Error( `solicitarRestablecerContraseña: Error en la búsqueda!`);
          }
          
          if (!ResultadoUsuario) {
            throw new Error('solicitarRestablecerContraseña: Usuario no existe!');
          }
          
          let usuarioClass = UsuarioClass.Usuario;
          let Usuario = new usuarioClass(ResultadoUsuario);

          result = await Usuario.verificacionNuevoUsuario()
              .catch(err => {
                throw new Error( `compararVerificacionUsuario: ${err.mensaje}`);
              });

            Usuario.enviandoCorreo().then(
              resolved => {
                console.log(`${resolved.mensaje}: Favor de verificar el código enviado a su correo!`);
              },
              err => {
                throw new Error( `compararVerificacionUsuario: ${err.mensaje}`);
              }
            );

          return `solicitarRestablecerContrasena: Su ${result.mensaje} y enviado a su correo, favor de validar!`;
        },

        /*
          compararVerificacionUsuario: Compara el código de verificación de Usuario para que el front
          pueda renderizar la vista para la actualización de la contraseña
         */
        async compararVerificacionUsuario(parent, { input, usuario }, { Models }){
          let ResultadoUsuario;
          try {
            ResultadoUsuario = await Models.Usuario.findOne({usuario: usuario}, { 'max_intentos':1, 'codigo_verificacion_usuario':1 }).exec();            
          } catch (error) {
            console.dir(error);
            throw new Error("actualizacionContrasena: posible error en el id brindado!");
          }

          if (!ResultadoUsuario) {
              throw new Error('compararVerificacionUsuario: Usuario no existe!');
          }

          let usuarioClass = UsuarioClass.Usuario;
          let Usuario = new usuarioClass(ResultadoUsuario);

          if(ResultadoUsuario.max_intentos >= 5){
            // nueva verificacion
            let result = await Usuario.verificacionNuevoUsuario()
              .catch(err => {
                throw new Error( `compararVerificacionUsuario: ${err.mensaje}`);
              });
            
            Usuario.enviandoCorreo().then(
              resolved => {
                console.log(`${resolved.mensaje}: Favor de verificar el código enviado a su correo!`);
              },
              err => {
                throw new Error( `compararVerificacionUsuario: ${err.mensaje}`);
              }
            );

            return `compararVerificacionUsuario: Haz excedido el limite de intentos su nuevo ${result.mensaje} y enviado a su correo.!`;
          }

          if(!ResultadoUsuario.codigo_verificacion_usuario){
            let result = await Usuario.verificacionNuevoUsuario()
              .catch(err => {
                throw new Error( `compararVerificacionUsuario: ${err.mensaje}`);
              });

            Usuario.enviandoCorreo().then(
              resolved => {
                console.log(`${resolved.mensaje}: Nueva verificación de celuar`);
              },
              err => {
                throw new Error( `compararVerificacionUsuario: ${err.mensaje}`);
              }
            );

            return `compararVerificacionUsuario: No cuenta con código de verificación, su ${result.mensaje}`;
          }

          if(ResultadoUsuario.codigo_verificacion_usuario !== input){
            Usuario.verificacionUsuarioNuevoIntento();
            throw new Error(`compararVerificacionUsuario: Código de verificación incorrecto!`);
          }

          let result = await Usuario.verificarUsuario().catch(err => {
            throw new Error( `compararVerificacionUsuario: ${err.mensaje}`);
          });

          return result.mensaje;
        },

        /*
          restablecerContrasena: Guarda una nueva contrasena dada por el usuario
         */
        async restablecerContrasena(parent, { input, usuario, contrasena }, { Models }){
          let ResultadoUsuario, Usuario, result;
          let usuarioClass = UsuarioClass.Usuario;

          //busqueda de usuadio
          try {
            ResultadoUsuario = await Models.Usuario.findOne({usuario: usuario}, {'contrasena':1,'max_intentos':1, 'codigo_verificacion_usuario':1}).exec();
            ResultadoUsuario.contrasenaNueva = contrasena;
            Usuario = new usuarioClass(ResultadoUsuario);
          } catch (err) {
            console.dir(err);
            throw new Error("actualizacionContrasena: Posible error en el id brindado o Usuario no encontrado!");
          }

          if(!ResultadoUsuario){
            throw new Error("actualizacionContrasena: Usuario no se encontro");
          }

          if(ResultadoUsuario.codigo_verificacion_usuario !== input){
            Usuario.verificacionNuevoUsuario().then(result => {
              console.log(`actualizacionContrasena: ${result.mensaje}`);
            });

             Usuario.enviandoCorreo().then(
              resolved => {
                console.log(`${resolved.mensaje}: Favor de verificar el código enviado a su correo!`);
              },
              err => {
                throw new Error( `actualizacionContrasena: ${err.mensaje}`);
              }
            );
            throw new Error("No pudimos actualizar su contraseña correctamente, le enviaremos un código de verificación a sus cuentas!");
          }

          result = await Usuario.guardandoContrasena().catch(err => {
            throw new Error(`actualizacionContrasena: ${err.mensaje}`);
          });

          return `Contraseña actualizada ${result.mensaje}`;
        }
    }
}
