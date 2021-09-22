import QueryAnuncio from '../../utilities/queryAnuncio'
import UsuarioClass from '../../utilities/Usuario'
import { crearBitacoraCreaciones, crearVerificacionAnuncio, crearBitacoraBusquedas } from '../../utilities/bitacoras'

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
                let result = await Models.Anuncio.find(Query.queryLimpiada()).exec();
                return result;
            } catch (err) {
                console.dir(err)
                throw new Error(err);
            }
        }
    },
    Mutation: {
        /*
          anuncioCreacion: 
        */
        async anuncioCreacion(parent, { input, id_usuario }, { Models }) {
            let ResultadoUsuario, usuarioClass, Usuario;

            try {
                ResultadoUsuario = await Models.Usuario.findById(id_usuario, { 'max_updates': 1, 'codigo_verificacion': 1, 'estado': 1, 'anuncios_usuario': 1, 'numero_telefonico_verificado': 1 })
                    .exec();
            } catch (err) {
                console.dir(err);
                throw new Error('anuncioCreacion: Error al querer encontrar el usuario del anuncio!');
            }

            if(!ResultadoUsuario){
                throw new Error('anuncioCreacion: Error al querer encontrar el usuario del anuncio!');
            }

            if(!ResultadoUsuario.estado){
                throw new Error('anuncioCreacion: Tu cuenta presenta problemas de bloqueo, favor de contactar a servicio al cliente!');
            }

            usuarioClass = UsuarioClass.Usuario;
            Usuario = new usuarioClass(ResultadoUsuario);

            if (!ResultadoUsuario.numero_telefonico_verificado) {
                let result = await Usuario.verificacionNuevaCelular().catch(err => {
                    throw new Error(`anuncioCreacion: Favor de intentar nuevamente o contactar a servicio al cliente!`);
                });

                Usuario.enviandoCorreo().then(resolved => {
                    console.log(`${resolved.mensaje}: Nueva verificación de celular`);
                });
                //Hacer el return en homologación con respuesta, cuando no regrese el resultado esperado. { resultX, RespuestaRedirección/Mensaje/Error}
                throw new Error(`anuncioCreacion: Necesitas verificar tu número de celular para crear un anuncio, su nuevo código de verificación de celular ya fue creado ${result.mensaje} y enviada a su celular.!`);
            }

            //Usuario con el numero_telefonico_verificado
            const AnuncioModel = new Models.Anuncio(input);
            AnuncioModel.id_usuario = id_usuario;

            //Salvando Anuncio
            let NuevoAnuncio = await AnuncioModel.save()
                .catch(
                    err => {
                        console.dir(err);
                        throw new Error('creacionAnuncio: Error en el salvado del anuncio!');
                    }
                );

            //Salvando Id del nuevo anuncio la Creador
            ResultadoUsuario.anuncios_usuario.unshift(NuevoAnuncio._id);
            await ResultadoUsuario.save()
                .catch(
                    err => {
                        console.dir(err);
                        throw new Error('creacionAnuncio: Error en la actualización del Usuario!');
                    }
                );

            const Bitacora = {
                "Creacion": {
                    "id_usuario": ResultadoUsuario.id,
                    "estado": NuevoAnuncio.Sec_Descripcion.estado,
                    "ciudad": NuevoAnuncio.Sec_Descripcion.ciudad,
                    "categorias": NuevoAnuncio.categorias,
                    "tipo": "Anuncio"
                }
            };
            crearBitacoraCreaciones(Bitacora, 'count_anuncio');


            return AnuncioModel;
        },

        /*
          anuncioVista: 
        */
        async anuncioActualizacion(parent, { input }, { Models, user }) {
            let ResultadoAnuncio;

            try {
                ResultadoAnuncio = await Models.Anuncio.findByIdAndUpdate(input.id, input, { timestamps: false, new: true }).lean().exec();
            } catch (err) {
                console.dir(err);
                throw new Error("anuncioActualizacion: Posible error en el id brindado!");
            }

            if (!ResultadoAnuncio) {
                throw new Error('anuncioActualizacion: Anuncio no encontrado');
            }

            return "Éxito";
        },

        /*
          anuncioEliminacion: 
        */
        async anuncioEliminacion(parent, { id_anuncio }, { Models, user }) {
            let ResultadoAnuncio, ResultadoUsuario;
            try {
                ResultadoAnuncio = await Models.Anuncio.findById(id_anuncio).lean().exec();
            } catch (err) {
                console.dir(err);
                throw new Error(err);
            }

            if (!ResultadoAnuncio) {
                throw new Error("El anuncio proporcionado no fue encontrado.");
            }

            if (user['http://localhost:3000/graphql'].id != ResultadoAnuncio.id_usuario) {
                throw new Error("No cuentas con los permisos suficientes de eliminar este anuncio.");
            }

            //caso contrario usar callback para
            await Models.Anuncio.findByIdAndRemove(id_anuncio).exec();
            
            ResultadoUsuario = await Models.Usuario.findById(ResultadoAnuncio.id_usuario).exec();
            ResultadoUsuario.anuncios_usuario = ResultadoUsuario.anuncios_usuario.splice(1,0,id_anuncio);
            ResultadoUsuario.save();

            return "Éxito";
        },

        /*
          anuncioVista: 
        */
        async anunciolike(parent, { idAnuncio }, { Models }) {
            let ResultadoAnuncio;

            try {
                ResultadoAnuncio = await Models.Anuncio.findById(idAnuncio, 'no_corazones').exec()
            } catch (error) {
                console.dir(err);
                throw new Error("likeAnuncio: Posible error en el id brindado!");
            }

            if (!ResultadoAnuncio) {
                throw new Error('likeAnuncio: Error al encontrar el Anuncio');
            }

            ResultadoAnuncio.no_corazones++;
            await ResultadoAnuncio.save({ timestamps: false }).catch(err => {
                console.dir(err);
                throw new Error('likeAnuncio: error en el save');
            });
            return "Éxito!";
        },

        /*
          anuncioVista: 
        */
        async anuncioVista(parent, { idAnuncio }, { Models }) {
            let ResultadoAnuncio;

            try {
                ResultadoAnuncio = await Models.Anuncio.findById(idAnuncio, 'no_vistas').exec()
            } catch (error) {
                console.dir(err);
                throw new Error("anuncioVista: Posible error en el id brindado!");
            }

            if (!ResultadoAnuncio) {
                throw new Error('anuncioVista: Error al encontrar el Anuncio');
            }

            ResultadoAnuncio.no_vistas++;
            await ResultadoAnuncio.save({ timestamps: false }).catch(err => {
                console.dir(err);
                throw new Error('anuncioVista: error en el save');
            });
            return "Éxito!";
        },

        /*
          anuncioSolicitarVerificacion: Se le asigna un código al usuario para pasar a verificar su identidad.
        */
        async anuncioSolicitarVerificacion(parent, { input }, { Models }) {
            let ResultadoUsuario, Usuario, result, usuarioClass;

            try {
                ResultadoUsuario = await Models.Usuario.findById(input.id_usuario, { 'max_updates': 1, 'codigo_verificacion_celular': 1, 'numero_telefonico_verificado': 1 }).exec();
            } catch (err) {
                console.dir(err)
                throw new Error(`anuncioSolicitarVerificacion: Error en la búsqueda!`);
            }

            if (!ResultadoUsuario) {
                throw new Error('anuncioSolicitarVerificacion: Usuario no existe!');
            }

            usuarioClass = UsuarioClass.Usuario;
            Usuario = new usuarioClass(ResultadoUsuario);
            result = await Usuario.verificacionNuevaCelular().catch(err => {
                console.dir(err)
                throw new Error(`compararVerificacionCelular: Favor de intentar nuevamente o contactar a servicio al cliente!`);
            });

            Usuario.enviandoCorreo().then(resolved => {
                console.log(resolved.mensaje);
            });

            const BitacoraInfo = {
                "id_anuncio": input.id_anuncio,
                "foto_anuncio": input.foto_anuncio,
            };
            crearVerificacionAnuncio(BitacoraInfo);

            return `Solicitud de verificación fue creada con ${result.mensaje}!`;
        },

        /*
          anuncioResponderVerificacion: Contesta una verificación de anuncio.
          Pendiente* Permiso solo para ejecutivos
        */
        async anuncioResponderVerificacion(parent, { input }, { Models }) {
            let ResultadoUsuario;
            try {
                ResultadoUsuario = await Models.AnunciosEnVerificacion.findById(input.id_verificacion).exec();
            } catch (error) {
                console.dir(err);
                throw new Error("anuncioResponderVerificacion: Posible error en el id brindado!");
            }

            if (!ResultadoUsuario) {
                throw new Error("anuncioResponderVerificacion: Usuario no se encontro");
            }

            const activationDate = new Date();
            const hoyEs = new Date(activationDate.getUTCFullYear(),
                            activationDate.getUTCMonth(),
                            activationDate.getUTCDate(),
                            activationDate.getUTCHours(),
                            activationDate.getUTCMinutes(),
                            activationDate.getUTCSeconds()
                            );

            ResultadoUsuario.respuesta = input.respuesta;
            ResultadoUsuario.comentario = input.comentario;
            ResultadoUsuario.fecha_respuesta = hoyEs;
            await ResultadoUsuario.save().catch(err => {
                console.log("anuncioResponderVerificacion: error en el save!");
                throw new Error('anuncioVista: error en el save');
            });

            return "Éxito Verificación!";
        }

    }
}