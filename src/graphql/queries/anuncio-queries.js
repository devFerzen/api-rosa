import gql from "graphql-tag";

import QueryAnuncio from "../../utilities/queryAnuncio";
import UsuarioClass from "../../utilities/Usuario";
import {
  crearBitacoraCreaciones,
  crearVerificacionAnuncio,
  crearBitacoraBusquedas,
} from "../../utilities/bitacoras";
import mongoose from 'mongoose';
import path from "path";
import fs from "fs";
import { promisify } from "util";
const unlinkAsync = promisify(fs.unlink);

export const typeDef = gql`
  extend type Query {
    queryAnunciosById(ids: [String]): [AnuncioType]
    queryAnuncios(query: QueryAnuncioInput!): [AnuncioType]
  }
  extend type Mutation {
    anuncioCreacion(input: AnuncioNewInput!): String!
    anuncioActualizacion(input: AnuncioInput!): String!
    anuncioEliminacion(id_anuncio: String!): String!
    imagenEliminacion(input: String!): String!
    anunciolike(idAnuncio: String!): String!
    anuncioVista(idAnuncio: String!): String!
    solicitarVerificacionCelular: String!
    solicitarVerificacionAnuncio(
      id_anuncio: String!
      foto_anuncio: String!
    ): String!
    anuncioResponderVerificacion(input: VerificacionInput!): String!
  }
`;

export const resolvers = {
  Query: {
    queryAnunciosById: async (_, { ids }, { Models }) => {
      try {
        return await Models.Anuncio.find({ _id: { $in: ids } });
      } catch (error) {
        console.log("queryAnunciosById... en error"); //guardar el input
        console.dir(error);

        return JSON.stringify({
          componenteInterno: {
            activationAlert: {
              type: "error",
              message: `Lo sentimos anuncio no encontrado!.`,
            },
          },
        });
      }
    },
    // Falta agregarle la projection, para solo traer especificamente esos datos
    queryAnuncios: async (_, { query }, { Models }) => {
      const Query = new QueryAnuncio(query);
      let QueryLimpia = {};

      try {
        QueryLimpia = Query.queryLimpiada();
        console.log(`<<< QueryLimpia`);
        console.dir(QueryLimpia);

        return await Models.Anuncio.find(QueryLimpia).exec();
      } catch (err) {
        console.log("queryAnuncios... en error"); //guardar el input
        console.dir(error);

        return JSON.stringify({
          componenteInterno: {
            activationAlert: {
              type: "error",
              message: `Favor de validar su correo y intentarlo nuevamente o comunicarse con servicio al cliente.`,
            },
          },
        });
      }
    },
  },
  Mutation: {
    /*
          anuncioCreacion: 
        */
    async anuncioCreacion(parent, { input }, { Models, user }) {
      let ResultadoUsuario, Usuario;

      if (!user) {
        throw new Error(
          JSON.stringify({
            pagina: "home",
            componenteInterno: {
              panelHerramientasInicioSesion: true,
              activationAlert: {
                type: "error",
                message: `Sesión cerrada por inactividad, favor de iniciar sesión nuevamente!.`,
              },
            },
          })
        );
      }

      try {
        ResultadoUsuario = await Models.Usuario.findById(user.id, {
          max_updates: 1,
          estado: 1,
          anuncios_usuario: 1,
          numero_telefonico_verificado: 1,
        }).exec();
      } catch (err) {
        console.log("anuncioCreacion... en error");
        console.dir(err);

        return JSON.stringify({
          pagina: "home",
          componenteInterno: {
            cerrarSesion: "",
            panelHerramientasInicioSesion: true,
            activationAlert: {
              type: "error",
              message: `Error inesperado, favor de validar formulario e intentar nuevamente, si el error persiste reportar el caso a servicio al cliente!.`,
            },
          },
        });
      }

      if (!ResultadoUsuario) {
        throw new Error(
          JSON.stringify({
            pagina: "home",
            componenteInterno: {
              cerrarSesion: "",
              panelHerramientasInicioSesion: true,
              activationAlert: {
                type: "error",
                message: `Error inesperado favor de iniciar sesión nuevamente, si el error persiste reportar el caso a servicio al cliente!.`,
              },
            },
          })
        );
      } //Usuario no existe

      if (!ResultadoUsuario.estado) {
        throw new Error(
          JSON.stringify({
            componenteInterno: {
              activationAlert: {
                type: "error",
                message: `Tu cuenta presenta problemas de bloqueo, favor de contactar a servicio al cliente!.`,
              },
            },
          })
        );
      } // Usuario con cuenta bloqueda no le permite crear anuncios

      Usuario = new UsuarioClass(ResultadoUsuario);

      if (!ResultadoUsuario.numero_telefonico_verificado) {
        let result = await Usuario.verificacionNuevaCelular().catch((err) => {
          //Registrar este error de usuario para atenderlo despues
          console.log("verificacionNuevaCelular... en error");
          console.dir(err);

          return JSON.stringify({
            componenteInterno: {
              activationAlert: {
                type: "error",
                message: `Error inesperado celular no verificado, favor de intentarlo de nuevo  o reportar el caso a servicio al cliente!.`,
              },
            },
          });
        });

        //Este envío de correo es con el template Verificación!!
        Usuario.enviandoCorreo({
          templateId: "d-42b7fb4fd59b48e4a293267f83c1523b",
          codigoVerificacion: result.data,
        }).catch((err) => {
          //Registrar este error de usuario para atenderlo???
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
              panelHerramientasVerificacion: true,
              setTipoVerificacion: "verificacionCelular",
              activationAlert: {
                type: "warning",
                message: `Favor de validar su cuenta con el código de verificación que se le ha enviado a su celular!.`,
              },
            },
          })
        );
      } // Numero de telefono no verificado
      
      let _id = new mongoose.Types.ObjectId();
      input._id = _id;
       
      const AnuncioModel = new Models.Anuncio(input);
      AnuncioModel.id_usuario = user.id;

      //Salvando Anuncio
      let NuevoAnuncio = await AnuncioModel.save().catch((err) => {
        console.log("AnuncioModel.save... en error");
        console.dir(err);
        throw new Error(
          JSON.stringify({
            componenteInterno: {
              activationAlert: {
                type: "error",
                message: `Error al intentar guardar el anuncio, favor de validar los formularios!.`,
              },
            },
          })
        );
      });

      //Salvando Id del nuevo anuncio la Creador
      ResultadoUsuario.anuncios_usuario.unshift(NuevoAnuncio._id);
      await ResultadoUsuario.save().catch((err) => {
        console.log("ResultadoUsuario.save... en error");
        console.dir(err);
        return JSON.stringify({
          componenteInterno: {
            activationAlert: {
              type: "error",
              message: `Error al intentar actualizar su información, favor de intentarlo de nuevo o reportar el caso a servicio al cliente!.`,
            },
          },
        });
      });

      const Bitacora = {
        Creacion: {
          id_usuario: ResultadoUsuario.id,
          estado: NuevoAnuncio.Sec_Descripcion.estado,
          ciudad: NuevoAnuncio.Sec_Descripcion.ciudad,
          categorias: NuevoAnuncio.categorias,
          tipo: "Anuncio",
        },
      };
      crearBitacoraCreaciones(Bitacora, "count_anuncio");

      return JSON.stringify({
        componenteInterno: {
          agregarEnAnunciosUsuario: NuevoAnuncio,
          activationAlert: {
            type: "success",
            message: `Anunció creado con éxito!`,
          },
        },
      });
    },

    /*
          anuncioActualizacion: 
        */
    async anuncioActualizacion(parent, { input }, { Models, user }) {
      let ResultadoAnuncio;

      try {
        ResultadoAnuncio = await Models.Anuncio.findByIdAndUpdate(
          input.id,
          { $set: input },
          { timestamps: false, upsert: true, new: true }
        )
          .lean()
          .exec();
      } catch (err) {
        console.log("anuncioActualizacion... en error");
        console.dir(err);
        return JSON.stringify({
          componenteInterno: {
            activationAlert: {
              type: "error",
              message: `Error inesperado, favor de validar los formularios o reportar el caso a servicio al cliente!.`,
            },
          },
        });
      }

      if (!ResultadoAnuncio) {
        throw new Error(
          JSON.stringify({
            componenteInterno: {
              activationAlert: {
                type: "error",
                message: `Anuncio no encontrado, favor de actualizar e intentarlo de nuevo o reportar el caso a servicio al cliente!.`,
              },
            },
          })
        );
      }

      console.dir(ResultadoAnuncio);
      return JSON.stringify({
        componenteInterno: {
          anuncioEditado: input,
          activationAlert: {
            type: "success",
            message: `Anuncio actualizado con éxito!.`,
          },
        },
      });
    },

    /*
          anuncioEliminacion: 
        */
    async anuncioEliminacion(parent, { id_anuncio }, { Models, user }) {
      let ResultadoAnuncio, newResultadoUsuario;
      let anunciosRestantes;

      //Se valida que sea el dueño del anuncio y se extrae la llamada en lean
      console.log(`anuncioEliminacion ${id_anuncio}`);
      try {
        ResultadoAnuncio = await Models.Anuncio.findById(id_anuncio)
          .lean()
          .exec();
      } catch (err) {
        console.log("anuncioEliminacion... en error");
        console.dir(err);

        throw new Error(
          JSON.stringify({
            componenteInterno: {
              activationAlert: {
                type: "error",
                message: `Error inesperado, favor de actualizar o reportar el caso a servicio al cliente!.`,
              },
            },
          })
        );
      }

      if (!ResultadoAnuncio) {
        throw new Error(
          JSON.stringify({
            componenteInterno: {
              activationAlert: {
                type: "error",
                message: `Anuncio no encontrado, favor de actualizar o reportar el caso a servicio al cliente!.`,
              },
            },
          })
        );
      }

      if (user.id != ResultadoAnuncio.id_usuario) {
        throw new Error(
          JSON.stringify({
            componenteInterno: {
              activationAlert: {
                type: "error",
                message: `No cuentas con los permisos suficientes de eliminar este anuncio!.`,
              },
            },
          })
        );
      }

      try {
        await Models.Anuncio.findByIdAndRemove(id_anuncio).exec();
        //Encontrar el usuario y actualizar su lista de anuncios
        newResultadoUsuario = await Models.Usuario.findById(user.id, {
          anuncios_usuario: 1,
        }).exec();

        if (!newResultadoUsuario) {
          console.log(`User no encontrado ${user.id}`);
          throw Error;
        }

        anunciosRestantes = newResultadoUsuario.anuncios_usuario.filter(
          (value, index) => {
            //When value is extracted directly from mongoose
            if (typeof value == "object") {
              value.id.toString();
              console.log(value);
            }

            console.log(`value ${typeof value} :${value}`);
            console.log(`id_anuncio ${typeof id_anuncio} :${id_anuncio}`);

            if (value != id_anuncio) {
              return value;
            }
          }
        );
      } catch (error) {
        console.log("anuncioEliminacion... en error");
        console.dir(error);

        return JSON.stringify({
          componenteInterno: {
            activationAlert: {
              type: "error",
              message: `Error inesperado, al eliminar anuncio, favor de inicar sesión nuevamente!.`,
            },
          },
        });
      }

      console.log(`anunciosRestantes`);
      console.dir(anunciosRestantes);

      //Saving the remainig anuncios
      newResultadoUsuario.anuncios_usuario = anunciosRestantes;
      newResultadoUsuario.save();

      return JSON.stringify({
        componenteInterno: {
          eliminarEnAnunciosUsuario: id_anuncio,
          anuncioEditSet: {},
          activationAlert: {
            type: "success",
            message: `Anuncio eliminado exitosamente!.`,
          },
        },
      });
    },

    async imagenEliminacion(parent, { input }, { Models, user }) {
      console.log("imagenEliminacion...");

      try {
        console.log("dirName...", __dirname);
        const uploadPath = path.join(__dirname, "../../..", "uploads");
        const fileLocation = path.resolve(uploadPath, input);
        console.log(
          "input ",
          input,
          "uploadPath",
          uploadPath,
          "fileLocation",
          fileLocation
        );

        //que se traiga en su lista de imagenes de aunicio la imagen y que esa actualice y elimine tmb
        await unlinkAsync(fileLocation);
      } catch (error) {
        console.log("imagenEliminacion... en error");
        console.dir(error);

        return JSON.stringify({
          componenteInterno: {
            activationAlert: {
              type: "error",
              message: `Problemas al borrar el archivo.`,
            },
          },
        });
      }

      return JSON.stringify({
        componenteInterno: {
          activationAlert: {
            type: "success",
            message: `Imagen eliminada con éxito!.`,
          },
        },
      });
    },

    /*
          anunciolike: 
        */
    async anunciolike(parent, { idAnuncio }, { Models }) {
      let ResultadoAnuncio;

      try {
        ResultadoAnuncio = await Models.Anuncio.findById(
          idAnuncio,
          "no_corazones"
        ).exec();
      } catch (error) {
        console.log("anunciolike... en error");
        console.dir(error);

        return JSON.stringify({
          componenteInterno: {
            activationAlert: {
              type: "error",
              message: `Error al dar like al anuncio, favor de intentarlo más tarde!`,
            },
          },
        });
      }

      if (!ResultadoAnuncio) {
        throw new Error(
          JSON.stringify({
            componenteInterno: {
              activationAlert: {
                type: "error",
                message: `Error al dar like al anuncio, favor de intentarlo más tarde!.`,
              },
            },
          })
        );
      }

      ResultadoAnuncio.no_corazones++;
      ResultadoAnuncio.save({ timestamps: false });
      return JSON.stringify({
        componenteInterno: {
          activationAlert: {
            type: "success",
            message: `Me encanta enviado!.`,
          },
        },
      });
    },

    /*
          anuncioVista: 
        */
    async anuncioVista(parent, { idAnuncio }, { Models }) {
      let ResultadoAnuncio;

      try {
        ResultadoAnuncio = await Models.Anuncio.findById(
          idAnuncio,
          "no_vistas"
        ).exec();
      } catch (error) {
        console.log("anuncioVista... en error");
        console.dir(error);

        return JSON.stringify({
          componenteInterno: {
            activationAlert: {
              type: "error",
              message: `Anuncio no Encontrado, favor de actualizar e intentarlo de nuevo!.`,
            },
          },
        });
      }

      if (!ResultadoAnuncio) {
        throw new Error(
          JSON.stringify({
            componenteInterno: {
              activationAlert: {
                type: "error",
                message: `Anuncio no Encontrado, favor de actualizar e intentarlo de nuevo!.`,
              },
            },
          })
        );
      }

      ResultadoAnuncio.no_vistas++;
      ResultadoAnuncio.save({ timestamps: false });

      return JSON.stringify({
        componenteInterno: {
          activationAlert: {
            type: "success",
            message: `Éxito en la vista!.`,
          },
        },
      });
    },

    /*
          solicitarVerificacionCelular: Se le asigna un código al usuario para pasar a verificar su identidad.
        */
    async solicitarVerificacionCelular(parent, params, { Models, user }) {
      let ResultadoUsuario, Usuario, result;

      try {
        ResultadoUsuario = await Models.Usuario.findById(user.id, {
          max_updates: 1,
          codigo_verificacion_celular: 1,
          numero_telefonico_verificado: 1,
        }).exec();
      } catch (err) {
        console.dir(err);
        return JSON.stringify({
          componenteInterno: {
            activationAlert: {
              type: "error",
              message: `Favor de volver a iniciar sesion e intentarlo nuevamente o contactar a servicio al cliente.`,
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
                message: `Favor de volver a iniciar sesion e intentarlo nuevamente o contactar a servicio al cliente.`,
              },
            },
          })
        );
      }

      Usuario = new UsuarioClass(ResultadoUsuario);

      result = await Usuario.verificacionNuevaCelular();

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
              message: `Favor de volver a iniciar sesion e intentarlo nuevamente o contactar a servicio al cliente.`,
            },
          },
        });
      });

      return JSON.stringify({
        pagina: "home",
        componenteInterno: {
          panelHerramientasVerificacion: true,
          setTipoVerificacion: "verificacionUsuarioCelular",
          activationAlert: {
            type: "success",
            message: `${result.mensaje}`,
          },
        },
      });
    },

    //aqui este es nuevo
    async solicitarVerificacionAnuncio(
      parent,
      { id_anuncio, foto_anuncio },
      { Models }
    ) {
      const BitacoraInfo = {
        id_anuncio: id_anuncio,
        foto_anuncio: foto_anuncio,
      };
      let result = crearVerificacionAnuncio(BitacoraInfo);

      if (!result) {
        throw new Error(
          JSON.stringify({
            componenteInterno: {
              activationAlert: {
                type: "error",
                message: `Favor de intentarlo nuevamente o comunicarse con servicio al cliente.`,
              },
            },
          })
        );
      }

      return JSON.stringify({
        componenteInterno: {
          activationAlert: {
            type: "success",
            message: `Solicitud de verificación enviada con éxito, espere la repsuesta pronto!.`,
          },
        },
      });
    },

    /*
          anuncioResponderVerificacion: Contesta una verificación de anuncio.
          Pendiente* Permiso solo para ejecutivos
        */
    async anuncioResponderVerificacion(parent, { input }, { Models }) {
      let ResultadoUsuario;
      try {
        ResultadoUsuario = await Models.AnunciosEnVerificacion.findById(
          input.id_verificacion
        ).exec();
      } catch (error) {
        console.log("enviandoCorreo... en error");
        console.dir(err);

        return JSON.stringify({
          componenteInterno: {
            activationAlert: {
              type: "error",
              message: `Verificación no encontrada!.`,
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
                message: `Verificación no encontrada!.`,
              },
            },
          })
        );
      }

      const activationDate = new Date();
      const hoyEs = new Date(
        activationDate.getUTCFullYear(),
        activationDate.getUTCMonth(),
        activationDate.getUTCDate(),
        activationDate.getUTCHours(),
        activationDate.getUTCMinutes(),
        activationDate.getUTCSeconds()
      );

      ResultadoUsuario.respuesta = input.respuesta;
      ResultadoUsuario.comentario = input.comentario;
      ResultadoUsuario.fecha_respuesta = hoyEs;
      await ResultadoUsuario.save().catch((err) => {
        console.log("ResultadoUsuario.save... en error");
        console.dir(err);

        return JSON.stringify({
          componenteInterno: {
            activationAlert: {
              type: "error",
              message: `Error al actualizar verificación!.`,
            },
          },
        });
      });

      return JSON.stringify({
        componenteInterno: {
          activationAlert: {
            type: "success",
            message: `Verificación actualizada con éxito!.`,
          },
        },
      });
    },
  },
};
