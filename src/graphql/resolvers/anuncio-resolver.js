import CodigoVerificacion from '../../utilities/codigoVerificacion'
import QueryAnuncio from '../../utilities/queryAnuncio'


module.exports = {
    Query: {
        queryAnunciosById: async(_, { ids }, { Models }) => {
            try {
                return await Models.Anuncio.find({ _id: { $in: ids } })
            } catch (error) {
                console.dir(err)
                throw new Error(err);
            }
        },
        // Falta agregarle la projection, para solo traer especificamente esos datos
        queryAnuncios: async(_, { query }, { Models }) => {
          const Query = new QueryAnuncio(query);
          try {
            let result = await Models.Anuncio.find( Query.queryLimpiada() ).exec();
            return result;
          } catch (error) {
              console.dir(error)
              throw new Error(error);
          }
        }
    },
    Mutation: {
        // Refactorizacion **
        async anuncioCreacion(parent, { input, idUsuario }, { Models }) {

            //Verificar que el usuario tenga estado verdadero
            let UsuarioCreador;
            try {
              UsuarioCreador = await Models.Usuario.findById(idUsuario, { 'max_updates':1, 'codigo_verificacion':1, 'estado':1, 'anuncios_usuario':1, 'numero_telefonico_verificado':1})
                                                    .exec();
            } catch (e) {
              console.dir(error)
              throw new Error('anuncioCreacion: Error al querer encontrar el usuario del anuncio!');
            }

            //Usuario sin el numero_telefonico_verificado
            if(!UsuarioCreador.numero_telefonico_verificado){
              UsuarioCreador.max_updates = 0;
              UsuarioCreador.codigo_verificacion = CodigoVerificacion.creacion();
              UsuarioCreador.numero_telefonico_verificado = false;

              await UsuarioCreador.save()
                .catch(err => {
                  console.dir(err);
                  throw new Error(`solicitarVerificacionCelular: error en el update del usario ${id_usuario}`);
                });

                //Enviar por correo el número verificado

                //Hacer el return en homologación con respuesta, cuando no regrese el resultado esperado. { resultX, RespuestaRedirección/Mensaje/Error}
                throw new Error( "comprarVerificacionCelular: Se mandará al usuario a la vista de verificación de celular");
            }


            //Usuario con el numero_telefonico_verificado
            const AnuncioModel = new Models.Anuncio(input);
            AnuncioModel.id_usuario = idUsuario;

            //Salvando Anuncio
            let NuevoAnuncio = await AnuncioModel.save()
                .catch(
                    err => {
                        console.dir(err);
                        throw new Error('creacionAnuncio: Error en el salvado del anuncio!');
                    }
                );

            console.dir(NuevoAnuncio);

            //Salvando Id del nuevo anuncio la Creador
            UsuarioCreador.anuncios_usuario.unshift(NuevoAnuncio._id);
            await UsuarioCreador.save()
                .catch(
                    err => {
                        console.dir(err);
                        throw new Error('creacionAnuncio: Error en la actualización del Usuario!');
                    }
                );

            // Salvando en la bitacora.  require refactorización**
            try {
              let categorias = NuevoAnuncio.categorias.toString();
              const updateOne = Models.BitacoraCreaciones.updateOne({ "fecha_creacion": "2021-08-24" }, {
                  "$push": {
                      "Creacion": {
                          "id_usuario": NuevoAnuncio.id_usuario,
                          "estado": NuevoAnuncio.Sec_Descripcion.estado,
                          "ciudad": NuevoAnuncio.Sec_Descripcion.ciudad,
                          "categorias": categorias,
                          "tipo": "Creación"
                      }
                  },
                  "$inc": { "count_creacion": 1 }
              },
              {
                upsert: true,
                strict: false
              }).exec();
            } catch (err) {
                console.log("error en el updateOne de bitacoraCreacion...");
                console.dir(err);
            }

            console.log("anuncioCreacion... updateOne:");
            console.dir(updateOne);

            return AnuncioModel;
        },

        async anuncioActualizacion(parent, { input }, { Models }) {

            let Anuncio = await Models.Anuncio.findByIdAndUpdate(input.id, input, { timestamps: false })
                .catch(err => {
                    console.dir(err);
                    throw new Error('updateAnuncio: Error al actualizar el Anuncio');
                });

            console.dir(Anuncio);

            if (!Anuncio) {
                throw new Error('updateAnuncio: Anuncio no encontrado');
            }

            //Refactorización en función privada (uso tmb en creacion)
            let categorias = Anuncio.categorias.toString();

            // Futura refactorización, pasarlo a un hook del schema Model
            const updateOne = Models.BitacoraCreaciones.updateOne({ "fecha_creacion": "2021-08-24" }, {
                "$push": {
                    "Creacion": {
                        "id_usuario": Anuncio.id_usuario,
                        "estado": Anuncio.Sec_Descripcion.estado,
                        "ciudad": Anuncio.Sec_Descripcion.ciudad,
                        "categorias": categorias,
                        "tipo": "Actualizacion"
                    }
                },
                "$inc": { "count_actualizacion": 1 }
            },
            {
              upsert: true,
              strict: false
            })
            .catch(err => {
                console.log("bitacoraCreacion: handle rejection without waiting...");
                console.dir(err);
            });

            return Anuncio;
        },

        async anunciolike(parent, { idAnuncio }, { Models }) {
            let Anuncio = await Models.Anuncio.findById(idAnuncio, 'no_corazones')
                .catch(err => {
                    console.dir(err);
                    throw new Error('likeAnuncio: Error al encontrar el Anuncio');
                });

            Anuncio.no_corazones++;
            await Anuncio.save({ timestamps: false })
            .catch(err => {
              console.dir(err);
              throw new Error("likeAnuncio: error al actualiza el no_corazones");
            });
            return "Éxito!";
        },

        async anuncioVista(parent, { idAnuncio }, { Models }) {
            let Anuncio = await Models.Anuncio.findById(idAnuncio, 'no_vistas')
                .catch(err => {
                    console.dir(err);
                    throw new Error('vistaAnuncio: Error al encontrar el Anuncio');
                });

            Anuncio.no_vistas++;
            await Anuncio.save({ timestamps: false });
            return "Éxito!";
        },

        async anuncioSolicitarVerificacion(parent, { input }, { Models }) {
            let verificacion = new Models.AnunciosEnVerificacion({
                id_anuncio: input.id_anuncio,
                foto_anuncio: input.foto_anuncio
            });

            let result = verificacion.save().catch(err => {
                console.log("solicitarVerificacionAnuncio: error en el save!");
                console.dir(err);
            });

            //Falta activar la verificacion en positivo

            console.dir(result);
            return "Éxito solicitarVerificacionAnuncio!";
        },

        async anuncioResponderVerificacion(parent, { input }, { Models }) {
            let result = await Models.AnunciosEnVerificacion.findById(input.id_verificacion, (err, verificacion) => {
                if (err) {
                    console.dir(err);
                    throw new Error('responderVerificacionAnuncio: Error al encontrar la verificación');
                }

                verificacion.respuesta = input.respuesta;
                verificacion.comentario = input.comentario;
                verificacion.fecha_respuesta = "2021-08-25";
                verificacion.save().catch(err => {
                    console.log("anuncioResponderVerificacion: error en el save!");
                    console.dir(err);
                });
            });

            //Devuelve el antiguo objeto
            console.dir(result);
            return "Éxito Verificación!";

        }

    }
}
