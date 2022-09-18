import gql from "graphql-tag";

import bcrypt from "bcrypt";
import creacionToken from "../../utilities/autorizacionToken";
import { crearBitacoraCreaciones } from "../../utilities/bitacoras";
import UsuarioClass from "../../utilities/Usuario";

import { GraphQLScalarType } from "graphql";
import { Kind } from "graphql/language";

export const typeDef = gql`
  extend type Query {
    queryUsuarioById(id: String!): UsuarioType
    queryUsuario(input: String!): UsuarioType
  }

  extend type Mutation {
    inicioSesion(correo: String!, contrasena: String!): String!
    cerrarSesion(input: String): String!
    registroUsuario(input: UsuarioInput!): String!
    actualizacionDefaultContactos(input: [SecContactoInput]!): String!
    actualizacionContrasena(
      contrasenaVieja: String!
      contrasenaNueva: String!
    ): String!
    compararVerificacionCelular(input: String!): String!
    compararVerificacionUsuario(
      input: String
      usuario: String!
      clean: Boolean!
    ): String!
    solicitarRestablecerContrasena(usuario: String!): String!
    restablecerContrasena(
      input: String
      usuario: String!
      contrasena: String!
    ): String!
  }
`;

export const resolvers = {
  Date: new GraphQLScalarType({
    name: "Date",
    description: "Date custom scalar type",
    parseValue(value) {
      const activationDate = new Date(value);
      return new Date(
        activationDate.getUTCFullYear(),
        activationDate.getUTCMonth(),
        activationDate.getUTCDate(),
        activationDate.getUTCHours(),
        activationDate.getUTCMinutes(),
        activationDate.getUTCSeconds()
      );
      // value from the client
    },
    serialize(value) {
      return value.getTime(); // value sent to the client
    },
    parseLiteral(ast) {
      if (ast.kind === Kind.INT) {
        // ast value is always in string format
        const activationDate = new Date(+ast.value);
        return new Date(
          activationDate.getUTCFullYear(),
          activationDate.getUTCMonth(),
          activationDate.getUTCDate(),
          activationDate.getUTCHours(),
          activationDate.getUTCMinutes(),
          activationDate.getUTCSeconds()
        );
      }
      return null;
    },
  }),

  Query: {
    queryUsuarioById: async (_, { id }, { Models }) => {
      try {
        console.log("id", id);

        return await Models.Usuario.findById(id)
          .lean()
          .populate("anuncios_usuario")
          .exec();
      } catch (err) {
        console.log("queryUsuarioById... en error"); //guardar el input
        console.dir(error);

        return JSON.stringify({
          componenteInterno: {
            activationAlert: {
              type: "error",
              message: `Error al intentar encontrar el Usuario!.`,
            },
          },
        });
      }
    },

    queryUsuario: async (_, { input }, { Models, user }) => {
      let result;

      if (!user) {
        console.log("queryUsuario... en error !user");
        throw new Error(
          JSON.stringify({
            pagina: "home",
            componenteInterno: {
              componenteInterno: { panelHerramientasInicioSesion: true },
              activationAlert: {
                type: "error",
                message: `Favor de iniciar Sesion primero!`,
              },
            },
          })
        );
      }

      try {
        return await Models.Usuario.findById(user.id)
          .lean()
          .populate("anuncios_usuario")
          .exec();
      } catch (error) {
        console.log("queryUsuario... en error");
        console.dir(error);

        return JSON.stringify({
          pagina: "home",
          cerrarSesion: "",
          componenteInterno: {
            panelHerramientasInicioSesion: true,
            activationAlert: {
              type: "error",
              message: `Error al buscar el usuario!.`,
            },
          },
        });
      }
    },
  },

  Mutation: {
    /*
          inicioSesion: 
        */
    async inicioSesion(parent, { correo, contrasena }, { Models, res }) {
      let UsuarioLoggeado, Usuario, comparacionContrasenas;

      try {
        UsuarioLoggeado = await Models.Usuario.findOne(
          { usuario: correo, estado: true },
          { max_intentos: 1, codigo_verificacion_usuario: 1, contrasena: 1 }
        ).exec();
      } catch (err) {
        console.log("inicioSesion... en error");
        console.dir(err);

        return JSON.stringify({
          componenteInterno: {
            activationAlert: {
              type: "error",
              message: `Error inesperado, favor de validar su correo o comunicarse al servicio al cliente!.`,
            },
          },
        });
      }

      if (!UsuarioLoggeado) {
        throw new Error(
          JSON.stringify({
            componenteInterno: {
              activationAlert: {
                type: "error",
                message: `Usuario no encontrado, favor de validar su correo o comunicarse al servicio al cliente!.`,
              },
            },
          })
        );
      }

      //Cuenta ya con un bloqueo de tipo verificacion usuario, debe de validar su correo
      if (UsuarioLoggeado.codigo_verificacion_usuario != undefined) {
        throw new Error(
          JSON.stringify({
            pagina: "home",
            componenteInterno: {
              setTipoVerificacion: "verificacionUsuarioContrasena",
              activationAlert: {
                type: "warning",
                message:
                  "Favor de validar tu cuenta, con el código de verificación que se le ha enviado a su correo!.",
              },
              panelHerramientasVerificacion: true,
              setCorreo: correo,
            },
          })
        );
      }

      comparacionContrasenas = await bcrypt.compare(
        contrasena,
        UsuarioLoggeado.contrasena
      );

      if (!comparacionContrasenas) {
        Usuario = new UsuarioClass(UsuarioLoggeado);

        //se crea un nuevo codigo de verificacion para el usuario
        if (UsuarioLoggeado.max_intentos >= 5) {
          let result = await Usuario.verificacionNuevoUsuario().catch((err) => {
            console.log(err);
            console.dir(err);

            return JSON.stringify({
              componenteInterno: {
                activationAlert: {
                  type: "error",
                  message: `Error al tratar de crear su código de verificación, Favor de intentar de nuevo o comunicarse al servicio al cliente!.`,
                },
              },
            });
          });

          //Este envío de correo es con el template Verificación!!
          Usuario.enviandoCorreo({
            templateId: "d-42b7fb4fd59b48e4a293267f83c1523b",
            codigoVerificacion: result.data,
            correo: UsuarioLoggeado.usuario,
          }).catch((err) => {
            return JSON.stringify({
              componenteInterno: {
                activationAlert: {
                  type: "error",
                  message:
                    "Error al enviar el correo, favor de validarlo o comunicarse con servicio al cliente!.",
                },
              },
            });
          });

          throw new Error(
            JSON.stringify({
              pagina: "home",
              componenteInterno: {
                setTipoVerificacion: "verificacionUsuario",
                setCorreo: UsuarioLoggeado.usuario,
                activationAlert: {
                  type: "warning",
                  message: `Haz excedido el limite de intentos favor de validar su cuenta en su correo!.`,
                },
                panelHerramientasVerificacion: true,
              },
            })
          );
        } // Se paso de intentos

        //Se la da un nuevo intento
        Usuario.verificacionUsuarioNuevoIntento();
        throw new Error(
          JSON.stringify({
            componenteInterno: {
              activationAlert: {
                type: "warning",
                message: `Contraseña Incorrecta! Te restan ${
                  5 - UsuarioLoggeado.max_intentos
                } intentos!.`,
              },
            },
          })
        );
      } // Comparacion de contraseña fue incorrecta

      // Nueva busqueda mas limpia y se limpia los intentos y se crean los tokens
      UsuarioLoggeado = await Models.Usuario.findOne(
        { usuario: correo, estado: true },
        {}
      )
        .populate("anuncios_usuario")
        .exec();

      Models.Usuario.findByIdAndUpdate(UsuarioLoggeado._id, {
        $set: { max_intentos: 0, codigo_verificacion_usuario: null },
      })
        .lean()
        .exec();

      const { autorizacion_token, actualizacion_token } =
        creacionToken(UsuarioLoggeado);

      res.cookie("auth-token", autorizacion_token, {
        sameSite: "strict",
        path: "/",
        expire: new Date(new Date().getTime() + 60 * 1000),
        httpOnly: true,
        secure: process.env.NODE_ENV !== "development",
      });

      res.cookie("refresh-token", actualizacion_token, {
        expire: new Date(new Date().getTime() + 6 * 1000), //60 * 60000)
      });

      //Registro de bitacora
      const Bitacora = {
        Creacion: {
          id_usuario: UsuarioLoggeado.id,
          estado: UsuarioLoggeado.Ubicacion_Usuario.estado,
          ciudad: UsuarioLoggeado.Ubicacion_Usuario.ciudad,
          categorias: [],
          tipo: "Login",
        },
      };
      crearBitacoraCreaciones(Bitacora, "count_inicio_sesion");

      return JSON.stringify({
        pagina: "dashboard",
        componenteInterno: {
          activationAlert: { type: "success", message: "Bienvenido.!" },
          panelHerramientasBusqueda: true,
          setSesion: UsuarioLoggeado,
        },
      });
    },

    async cerrarSesion(parent, { input }, { res }) {
      res.clearCookie("refresh-token");
      res.clearCookie("auth-token");

      return JSON.stringify({
        pagina: "home",
        componenteInterno: {
          activationAlert: {
            type: "success",
            message: "Sesion cerrada, hasta pronto!.",
          },
          panelHerramientasBusqueda: true,
          cerrarSesion: "",
        },
      });
    },

    /*
          registroUsuario: Registra un nuevo usuario.
        */
    async registroUsuario(parent, { input }, { Models, res }) {
      let Usuario;

      //Pendiente Validación de inputs

      input.contrasena = await bcrypt
        .hash(input.contrasena, 10)
        .catch((err) => {
          console.log("encirptando contrasena");
          console.dir(err);
          throw new Error(
            JSON.stringify({
              componenteInterno: {
                activationAlert: {
                  type: "error",
                  message:
                    "Error inesperado, favor de validar su contraseña e intentarlo de nuevo o comunicarse con servicio al cliente!.",
                },
              },
            })
          );
        });

      const NuevoUsuarioModel = new Models.Usuario(input);
      let NuevoUsuario = await NuevoUsuarioModel.save().catch((err) => {
        console.log("NuevoUsuarioModel.save... en error");
        console.dir(err);

        let _mensaje = err.toString();
        return JSON.stringify({
          componenteInterno: {
            activationAlert: {
              type: "error",
              message:
                _mensaje.search("duplicate key error") > 0
                  ? "Usuario duplicado, favor de iniciar sesion o reportar el caso con servicio al cliente!."
                  : "Error al tratar de crear el usuario, favor de intentarlo de nuevo o comunicarse con servicio al cliente!.",
            },
          },
        });
      });

      console.dir(NuevoUsuario);
      const { autorizacion_token, actualizacion_token } =
        creacionToken(NuevoUsuario);

      res.cookie("auth-token", autorizacion_token, {
        sameSite: "strict",
        path: "/",
        expire: new Date(new Date().getTime() + 60 * 1000),
        httpOnly: true,
        secure: process.env.NODE_ENV !== "development",
      });

      res.cookie("refresh-token", actualizacion_token, {
        expire: new Date(new Date().getTime() + 6 * 1000), //60 * 60000)
      });

      const Bitacora = {
        Creacion: {
          id_usuario: NuevoUsuarioModel.id,
          estado: NuevoUsuarioModel.Ubicacion_Usuario.estado,
          ciudad: NuevoUsuarioModel.Ubicacion_Usuario.ciudad,
          categorias: [],
          tipo: "Registro",
        },
      };
      crearBitacoraCreaciones(Bitacora, "count_registro");

      //Este envío de correo es con el template Registro!!
      Usuario = new UsuarioClass(NuevoUsuarioModel);
      Usuario.enviandoCorreo({
        templateId: "d-293c0995cd20464cb732b025783c5e65",
      }).catch((err) => {
        console.log("enviandoCorreo... en error");
        console.dir(err);
        //Esto para ni regresa al cliente... porque???
        return JSON.stringify({
          componenteInterno: {
            activationAlert: {
              type: "error",
              message: `Error al enviar el correo, favor de validarlo o comunicarse con servicio al cliente!.`,
            },
          },
        });
      });

      return JSON.stringify({
        pagina: "dashboard",
        componenteInterno: {
          activationAlert: { type: "success", message: "Bienvenido!" },
          panelHerramientasBusqueda: true,
          setSesion: NuevoUsuarioModel,
        },
      });
    },

    async actualizacionDefaultContactos(parent, { input }, { Models, user }) {
      let ResultadoUsuario, Usuario, result;

      /*Analizar su uso aqui, ya que ya se creo un plugin en el file permisos...
      if(!user){
            throw new Error(JSON.stringify({ mensaje: `Favor de inicar Sesion`, pagina: 'home', componenteInterno:{ panelHerramientasInicioSesion: true, cerrarSesion: true } }));
        }*/

      try {
        ResultadoUsuario = await Models.Usuario.findById(user.id, {
          Default_Contactos: 1,
        }).exec();
      } catch (err) {
        return JSON.stringify({
          pagina: "home",
          componenteInterno: {
            panelHerramientasInicioSesion: true,
            cerrarSesion: true,
            activationAlert: {
              type: "error",
              message:
                "Favor de inicar Sesion nuevamente y validar los cambios!",
            },
          },
        });
      }

      console.log(`input`);
      console.log(ResultadoUsuario);
      console.dir(input);

      if (!ResultadoUsuario) {
        throw new Error(
          JSON.stringify({
            pagina: "home",
            componenteInterno: {
              panelHerramientasInicioSesion: true,
              cerrarSesion: true,
              activationAlert: {
                type: "error",
                message:
                  "Favor de inicar Sesion nuevamente y validar los cambios!",
              },
            },
          })
        );
      }

      ResultadoUsuario.Default_Contactos = input;
      Usuario = new UsuarioClass(ResultadoUsuario);

      result = await Usuario.guardandoDefaultContactos().catch((err) => {
        throw new Error(
          JSON.stringify({
            componenteInterno: {
              activationAlert: {
                type: "error",
                message: "Error al querer actualizar los datos!.",
              },
            },
          })
        );
      });

      return JSON.stringify({
        componenteInterno: {
          activationAlert: { type: "success", message: `${result.mensaje}` },
        },
      });
    },
    /*
          actualizacionContrasena: Actualización de contraseña que se hace dentro de una sesion del usuario.
        */
    async actualizacionContrasena(
      parent,
      { contrasenaVieja, contrasenaNueva },
      { Models, user }
    ) {
      let ResultadoUsuario, Usuario, comparacionContrasenas, result;

      //busqueda de usuadio
      try {
        ResultadoUsuario = await Models.Usuario.findById(user.id, {
          contrasena: 1,
          max_intentos: 1,
        }).exec();
      } catch (err) {
        console.log("actualizacionContrasena... en error findById");
        console.dir(err);

        return JSON.stringify({
          componenteInterno: {
            activationAlert: {
              type: "error",
              message: `Error al tratar de encontrar al usuario.`,
            },
          },
        });
      }

      if (!ResultadoUsuario) {
        throw new Error(
          JSON.stringify({
            componenteInterno: {
              activationAlert: {
                type: "error",
                message: `Error al tratar de encontrar al usuario.`,
              },
            },
          })
        );
      }

      ResultadoUsuario.contrasenaNueva = contrasenaNueva;
      Usuario = new UsuarioClass(ResultadoUsuario);

      if (ResultadoUsuario.max_intentos >= 5) {
        //se crea un nuevo codigo de verificacion para el usuario
        let result = await Usuario.verificacionNuevoUsuario().catch((err) => {
          console.log(err);
          console.dir(err);

          return JSON.stringify({
            componenteInterno: {
              activationAlert: {
                type: "error",
                message:
                  error.mensaje || `Error en la creación de verificacion!.`,
              },
            },
          });
        });

        //Este envío de correo es con el template Verificación!!
        Usuario.enviandoCorreo({
          templateId: "d-42b7fb4fd59b48e4a293267f83c1523b",
          codigoVerificacion: result.data,
        }).catch((err) => {
          return JSON.stringify({
            componenteInterno: {
              activationAlert: {
                type: "error",
                message:
                  "Error al enviar el correo, favor de validarlo o comunicarse con servicio al cliente.",
              },
            },
          });
        });

        throw new Error(
          JSON.stringify({
            pagina: "home",
            componenteInterno: {
              setTipoVerificacion: "verificacionUsuario",
              setCorreo: correo,
              activationAlert: {
                type: "warning",
                message: `Haz excedido el limite de intentos favor de validar su cuenta en su correo.`,
              },
              panelHerramientasVerificacion: true,
            },
          })
        );
      } //Si al momento de actualizar su contraseña este excede de mas de 5 intentos este lo envia a verificar su cuenta

      comparacionContrasenas = await bcrypt.compare(
        contrasenaVieja,
        ResultadoUsuario.contrasena
      );
      if (!comparacionContrasenas) {
        Usuario.verificacionUsuarioNuevoIntento();
        console.log(
          `Error contrasenas incorrectas: contrasenaVieja ${contrasenaVieja}, contrasenaNueva ${contrasenaNueva}`
        );
        throw new Error(
          JSON.stringify({
            componenteInterno: {
              activationAlert: {
                type: "error",
                message: `Contraseña Incorrecta`,
              },
            },
          })
        );
      } //Comparaciones de contrasenas

      try {
        await Usuario.guardandoContrasena({ max_intentos: 1 });
      } catch (error) {
        return JSON.stringify({
          componenteInterno: {
            activationAlert: {
              type: "error",
              message: `Error al querer actualizar los datos.`,
            },
          },
        });
      } // guardandoContrasena

      return JSON.stringify({
        componenteInterno: {
          activationAlert: {
            type: "success",
            message: `Contraseña guardada exitosamente!.`,
          },
        },
      });
    },

    /*
            compararVerificacionCelular: Compara el código de verificación de celular creado la primera vez que quizo
            crear un anuncio.
         */
    async compararVerificacionCelular(parent, { input }, { Models, user }) {
      let ResultadoUsuario, Usuario, result;

      try {
        ResultadoUsuario = await Models.Usuario.findById(user.id, {
          max_updates: 1,
          codigo_verificacion_celular: 1,
          numero_telefonico_verificado: 1,
        }).exec();
      } catch (err) {
        console.dir(err);

        throw new Error(
          JSON.stringify({
            componenteInterno: {
              activationAlert: {
                type: "error",
                message: `Error inesperado, Favor de Iniciar Sesion nuevamente e intentarlo de nuevo, o comunicarse con servicio al cliente!.`,
              },
            },
          })
        );
      }

      if (!ResultadoUsuario) {
        throw new Error(
          JSON.stringify({
            componenteInterno: {
              activationAlert: {
                type: "error",
                message: `Usuario no encontrado, favor de Iniciar Sesion nuevamente e intentarlo de nuevo, o comunicarse con servicio al cliente!.`,
              },
            },
          })
        );
      }

      Usuario = new UsuarioClass(ResultadoUsuario);

      if (ResultadoUsuario.max_updates >= 3) {
        let result = await Usuario.verificacionNuevaCelular().catch((err) => {
          console.log(`${err.mensaje}`);

          throw new Error(
            JSON.stringify({
              componenteInterno: {
                activationAlert: {
                  type: "error",
                  message: `Error inesperado, Favor de Iniciar Sesion nuevamente e intentarlo de nuevo, o comunicarse con servicio al cliente!.`,
                },
              },
            })
          );
        });

        //Este envío de correo es con el template Verificación!!
        Usuario.enviandoCorreo({
          templateId: "d-42b7fb4fd59b48e4a293267f83c1523b",
          codigoVerificacion: result.data,
        }).catch((err) => {
          console.log("enviandoCorreo... en error");
          console.dir(err);
          return JSON.stringify({
            componenteInterno: {
              activationAlert: {
                type: "error",
                message:
                  "Error al enviar el correo, favor de validarlo o comunicarse con servicio al cliente!.",
              },
            },
          });
        });

        //Posiblemente cambiar verificacionUsuarioCelular por verificacionCelular
        throw new Error(
          JSON.stringify({
            pagina: "home",
            componenteInterno: {
              setTipoVerificacion: "verificacionUsuarioCelular",
              activationAlert: {
                type: "error",
                message:
                  "Haz excedido el limite de intentos favor de validar su cuenta con el código de verificación que se le ha enviado a su celular!.",
              },
              panelHerramientasVerificacion: true,
            },
          })
        );
      } // Validacion de intentos

      if (!ResultadoUsuario.codigo_verificacion_celular) {
        await Usuario.verificacionNuevaCelular().catch((err) => {
          console.log("verificacionNuevaCelular... en error");
          console.dir(err);
          return JSON.stringify({
            activationAlert: {
              type: "error",
              message:
                "Error inesperado, favor de Iniciar Sesion nuevamente e intentarlo de nuevo, o comunicarse con servicio al cliente!.",
            },
          });
        });

        //Este envío de correo es con el template Verificación!!
        Usuario.enviandoCorreo({
          templateId: "d-42b7fb4fd59b48e4a293267f83c1523b",
          codigoVerificacion: result.data,
        }).catch((err) => {
          console.log("enviandoCorreo... en error");
          console.dir(err);
          return JSON.stringify({
            componenteInterno: {
              activationAlert: {
                type: "error",
                message:
                  "Error al enviar el correo, favor de validarlo o comunicarse con servicio al cliente!.",
              },
            },
          });
        });

        throw new Error(
          JSON.stringify({
            pagina: "home",
            componenteInterno: {
              setTipoVerificacion: "verificacionUsuarioCelular",
              panelHerramientasVerificacion: true,
              activationAlert: {
                type: "error",
                message:
                  "Favor de validar su cuenta con el código de verificación enviado a su celular!.",
              },
            },
          })
        );
      } // No a verificado el celular

      if (ResultadoUsuario.codigo_verificacion_celular !== input) {
        Usuario.verificacionCelularNuevoIntento();
        throw new Error(
          JSON.stringify({
            componenteInterno: {
              activationAlert: {
                type: "warning",
                message: `Código de verificación incorrecto, Te restan ${
                  5 - ResultadoUsuario.max_updates
                } intentos.`,
              },
            },
          })
        );
      }

      //Se quita su bloquéo
      result = await Usuario.codigoCelularVerificado().catch((err) => {
        console.log("codigoCelularVerificado... en error");
        console.dir(err);
        return JSON.stringify({
          componenteInterno: {
            activationAlert: {
              type: "error",
              message:
                "Error inesperado, favor de intentarlo de nuevo  o reportar el caso a servicio al cliente!.",
            },
          },
        });
      });

      return JSON.stringify({
        mensaje: `${result.mensaje}`,
        pagina: "dashboard",
        componenteInterno: {
          numerotelefonicoUsuario: true,
          panelHerramientasBusqueda: true,
        },
      });
    },

    /*
          solicitarRestablecerContraseña 1: Manda un código de verificación USUARIO por correo, en el 
          cuál deberá proporcionarlo para habilitar cambiar la contraseña
         */
    async solicitarRestablecerContrasena(parent, { usuario }, { Models }) {
      let ResultadoUsuario, result, Usuario;
      try {
        ResultadoUsuario = await Models.Usuario.findOne(
          { usuario: usuario },
          { max_intentos: 1, codigo_verificacion_usuario: 1 }
        ).exec();
      } catch (err) {
        console.log(
          "solicitarRestablecerContrasena... en error ResultadoUsuario"
        );
        console.dir(err);

        return JSON.stringify({
          componenteInterno: {
            activationAlert: {
              type: "error",
              message:
                "Error inesperado, Favor de validar su usuario e intentarlo de nuevo!.",
            },
          },
        });
      }

      if (!ResultadoUsuario) {
        console.log(`Usuario no encontrado ${ResultadoUsuario}`);
        throw new Error(
          JSON.stringify({
            componenteInterno: {
              activationAlert: {
                type: "error",
                message: `Usuario no encontrado, Favor de validar su usuario e intentarlo de nuevo!.`,
              },
            },
          })
        );
      }

      //se crea un nuevo codigo de verificacion para el usuario
      Usuario = new UsuarioClass(ResultadoUsuario);
      result = await Usuario.verificacionNuevoUsuario().catch((err) => {
        console.log(err);
        console.dir(err);

        return JSON.stringify({
          componenteInterno: {
            activationAlert: {
              type: "error",
              message: `Error al tratar de crear su código de verificación, Favor de intentar de nuevo o comunicarse al servicio al cliente!.`,
            },
          },
        });
      });

      //Este envío de correo es con el template Verificación!!
      Usuario.enviandoCorreo({
        templateId: "d-42b7fb4fd59b48e4a293267f83c1523b",
        codigoVerificacion: result.data,
      }).catch((err) => {
        return JSON.stringify({
          componenteInterno: {
            activationAlert: {
              type: "error",
              message:
                "Error al enviar el correo, favor de validarlo o comunicarse con servicio al cliente!.",
            },
          },
        });
      });

      return JSON.stringify({
        pagina: "home",
        componenteInterno: {
          setTipoVerificacion: "verificacionUsuarioContrasena",
          setCorreo: usuario,
          activationAlert: {
            type: "success",
            message: result.mensaje,
          },
          panelHerramientasVerificacion: true,
        },
      });
    },

    /*
      compararVerificacionUsuario 2: Compara el código de verificación USUARIO mandado al usuario por correo
    */
    async compararVerificacionUsuario(
      parent,
      { input, usuario, clean },
      { Models, res }
    ) {
      let ResultadoUsuario, Usuario;
      try {
        ResultadoUsuario = await Models.Usuario.findOne(
          { usuario: usuario },
          { max_intentos: 1, codigo_verificacion_usuario: 1 }
        ).exec();
      } catch (err) {
        console.dir(err);
        return JSON.stringify({
          componenteInterno: {
            activationAlert: {
              type: "error",
              message: `Favor de Iniciar Sesion nuevamente e intentarlo de nuevo, o comunicarse con servicio al cliente!.`,
            },
          },
        });
      }

      if (!ResultadoUsuario) {
        throw new Error(
          JSON.stringify({
            componenteInterno: {
              activationAlert: {
                type: "error",
                message: `Error inesperado, favor de iniciar Sesion nuevamente e intentarlo de nuevo, o comunicarse con servicio al cliente!.`,
              },
            },
          })
        );
      } //Usuario no existe!

      Usuario = new UsuarioClass(ResultadoUsuario);

      if (ResultadoUsuario.max_intentos >= 3) {
        //se crea un nuevo codigo de verificacion para el usuario
        let result = await Usuario.verificacionNuevoUsuario().catch((err) => {
          console.log(err);
          console.dir(err);

          return JSON.stringify({
            componenteInterno: {
              activationAlert: {
                type: "error",
                message: `Error inesperado, favor de iniciar sesion nuevamente e intentarlo de nuevo o comunicarse al servicio al cliente!.`,
              },
            },
          });
        });

        //Este envío de correo es con el template Verificación!!
        Usuario.enviandoCorreo({
          templateId: "d-42b7fb4fd59b48e4a293267f83c1523b",
          codigoVerificacion: result.data,
        }).catch((err) => {
          return JSON.stringify({
            componenteInterno: {
              activationAlert: {
                type: "error",
                message:
                  "Error al enviar el correo, favor de validarlo o comunicarse con servicio al cliente!.",
              },
            },
          });
        });

        throw new Error(
          JSON.stringify({
            pagina: "home",
            componenteInterno: {
              setTipoVerificacion: "verificacionUsuario",
              setCorreo: correo,
              activationAlert: {
                type: "warning",
                message: `Haz excedido el limite de intentos favor de validar su cuenta en su correo!.`,
              },
              panelHerramientasVerificacion: true,
            },
          })
        );
      }

      if (ResultadoUsuario.codigo_verificacion_usuario !== input) {
        Usuario.verificacionUsuarioNuevoIntento();
        throw new Error(
          JSON.stringify({
            componenteInterno: {
              activationAlert: {
                type: "error",
                message: `Contraseña Incorrecta! Te restan ${
                  3 - ResultadoUsuario.max_intentos
                } intentos!.`,
              },
            },
          })
        );
      }

      //Quieren limpiar el campo del bloque de verificación usuario
      if (clean) {
        Usuario.verificacionNuevoUsuario(true).catch((err) => {
          return JSON.stringify({
            componenteInterno: {
              activationAlert: {
                type: "error",
                message:
                  "Error inesperado, favor de iniciar sesion nuevamente e intentarlo de nuevo o comunicarse al servicio al cliente!.",
              },
            },
          });
        });
      }

      //Al tener exito de verificacion este mandar a llamar la creacion de token, si esq la borra al hacer el intento de iniciar sesion
      const { autorizacion_token, actualizacion_token } =
        creacionToken(ResultadoUsuario);

      res.cookie("auth-token", autorizacion_token, {
        sameSite: "strict",
        path: "/",
        expire: new Date(new Date().getTime() + 60 * 1000),
        httpOnly: true,
        secure: process.env.NODE_ENV !== "development",
      });

      res.cookie("refresh-token", actualizacion_token, {
        expire: new Date(new Date().getTime() + 6 * 1000), //60 * 60000)
      });

      return JSON.stringify({
        componenteInterno: {
          panelHerramientasCambioContrasena: true,
          setVerificacionUsuario: input,
          activationAlert: {
            type: "success",
            message: "Verificación de usuario con éxito!.",
          },
        },
      });
    },

    /*
          restablecerContrasena 3: Guarda una nueva contrasena dada por el usuario
         */
    async restablecerContrasena(
      parent,
      { input, usuario, contrasena },
      { Models, user, res }
    ) {
      let ResultadoUsuario, Usuario, result, borrarCodigo;
      console.log("restablecerContrasena...");

      //Agregar que sea un usuario verificado en el contexto user...
      //Falta testear
      if (!user) {
        //Si usuario no esta loggeado, no puede restablecerContrasena (el tiempo es importante en el cierre de sesion del token)
        throw new Error(
          JSON.stringify({
            componenteInterno: {
              activationAlert: {
                type: "error",
                message: `Favor de Iniciar sesion y intentarlo de nuevo!.`,
              },
            },
          })
        );
      }
      console.dir(user);

      //busqueda de usuario
      //Analizar - usar el Id de context
      try {
        ResultadoUsuario = await Models.Usuario.findOne(
          { usuario: usuario },
          { contrasena: 1, max_intentos: 1, codigo_verificacion_usuario: 1 }
        ).exec();
      } catch (err) {
        console.dir(err);
        res.clearCookie("refresh-token");
        res.clearCookie("auth-token");

        return JSON.stringify({
          componenteInterno: {
            activationAlert: {
              type: "error",
              message: `Error inesperado, favor de iniciar sesion nuevamente e intentarlo de nuevo  o comunicarse a servicio al cliente!.`,
            },
          },
        });
      }

      if (!ResultadoUsuario) {
        res.clearCookie("refresh-token");
        res.clearCookie("auth-token");

        throw new Error(
          JSON.stringify({
            componenteInterno: {
              cerrarSesion: "",
              panelHerramientasInicioSesion: true,
              activationAlert: {
                type: `error`,
                message: `Error inesperado, favor de iniciar sesion nuevamente e intentarlo de nuevo  o comunicarse a servicio al cliente!.`,
              },
            },
          })
        );
      }

      ResultadoUsuario.contrasenaNueva = contrasena;
      Usuario = new UsuarioClass(ResultadoUsuario);

      console.log(
        "ResultadoUsuario.codigo_verificacion_usuario ",
        ResultadoUsuario.codigo_verificacion_usuario,
        " input",
        input
      );

      //Vuelve a comparar el codigo de verificacion de usario (ya que al pedir una actualizacion de contraseña este crea un codigo, creo???)
      /*if (ResultadoUsuario.codigo_verificacion_usuario !== input) {
        Usuario.verificacionNuevoUsuario(true).catch((err) => {
          return JSON.stringify({
            componenteInterno: {
              activationAlert: {
                type: "error",
                message:
                  error.mensaje || `Error en la creación de verificacion!.`,
              },
            },
          });
        });

        //Este envío de correo es con el template Verificación!!
        Usuario.enviandoCorreo({
          templateId: "d-42b7fb4fd59b48e4a293267f83c1523b",
          codigoVerificacion: result.data,
        }).catch((err) => {
          throw new Error(
            JSON.stringify({
              componenteInterno: {
                activationAlert: {
                  type: `error`,
                  message: `Favor de validar su correo o comunicarse con servicio al cliente!.`,
                },
              },
            })
          );
        });

        throw new Error(
          JSON.stringify({
            componenteInterno: {
              activationAlert: {
                type: `error`,
                message: `No pudimos actualizar su contraseña correctamente, le enviaremos un nuevo código de verificación a correo!.`,
              },
            },
          })
        );
      }*/

      result = await Usuario.guardandoContrasena().catch((err) => {
        throw new Error(
          JSON.stringify({
            componenteInterno: {
              cerrarSesion: "",
              panelHerramientasInicioSesion: true,
              activationAlert: {
                type: `error`,
                message: `Error al tratar de actualizar contraseña, favor de intentarlo de nuevo  o reportar el caso a servicio al cliente!.`,
              },
            },
          })
        );
      });

      //Analizar si se deba de borrar? porque hay dos comportamientos
      Usuario.verificacionNuevoUsuario((borrarCodigo = true)).catch((err) => {
        return JSON.stringify({
          componenteInterno: {
            cerrarSesion: "",
            panelHerramientasInicioSesion: true,
            activationAlert: {
              type: `error`,
              message: `Error inesperado, favor de iniciar sesion nuevamente e intentarlo de nuevo o comunicarse al servicio al cliente!.`,
            },
          },
        });
      });

      res.clearCookie("refresh-token");
      res.clearCookie("auth-token");

      return JSON.stringify({
        pagina: "home",
        componenteInterno: {
          cerrarSesion: "",
          panelHerramientasInicioSesion: true,
          activationAlert: {
            type: `success`,
            message: `Contraseña actualizada, favor de Iniciar Sesion nuevamente!.`,
          },
        },
      });
    },

    //Creación para hacer un update de datos de usuario de Ubicacion_usuario y default_contacto
    //creo para que agregar un array es empujarlo así nada más...?
  },
};
