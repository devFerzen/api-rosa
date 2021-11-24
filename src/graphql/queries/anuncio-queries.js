import gql from 'graphql-tag';

import QueryAnuncio from '../../utilities/queryAnuncio'
import UsuarioClass from '../../utilities/Usuario'
import { crearBitacoraCreaciones, crearVerificacionAnuncio, crearBitacoraBusquedas } from '../../utilities/bitacoras'
import path from 'path';


import fs from 'fs';
import { promisify } from 'util';
const unlinkAsync = promisify(fs.unlink);

export const typeDef = gql `
  extend type Query {
    queryAnunciosById(ids: [String]): [AnuncioType],
    queryAnuncios(query: QueryAnuncioInput!): [AnuncioType],

  },
  extend type Mutation {
    anuncioCreacion(input: AnuncioInput!): AnuncioType!,
    anuncioActualizacion(input: AnuncioInput!): String!,
    anuncioEliminacion(id_anuncio: String!): String!,
    imagenEliminacion(input: String!): String!,
    anunciolike(idAnuncio: String!): String!,
    anuncioVista(idAnuncio: String!): String!,
    solicitarVerificacionCelular: String!,
    solicitarVerificacionAnuncio(id_anuncio: String!, foto_anuncio: String!): String!,
    anuncioResponderVerificacion(input: VerificacionInput!): String!
  }
`;

export const resolvers = {
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
            let QueryLimpia = {};
            let QueryResult;

            try {
                QueryLimpia = Query.queryLimpiada();
                QueryResult = await Models.Anuncio.find(QueryLimpia).exec();
            } catch (err) {
                console.dir(err)
                throw new Error(err);
            }
            return QueryResult;
        }
    },
    Mutation: {
        /*
          anuncioCreacion: 
        */
        async anuncioCreacion(parent, { input }, { Models, user }) {
            let ResultadoUsuario, usuarioClass, Usuario;

            try {
                ResultadoUsuario = await Models.Usuario.findById(user['http://localhost:3000/graphql'].id, { 'max_updates': 1, 'estado': 1, 'anuncios_usuario': 1, 'numero_telefonico_verificado': 1 })
                    .exec();
            } catch (err) {
                console.dir(err);
                throw new Error('anuncioCreacion: Error al querer encontrar el usuario del anuncio!');
            }

            if (!ResultadoUsuario) {
                throw new Error('anuncioCreacion: Error al querer encontrar el usuario del anuncio!');
            }

            if (!ResultadoUsuario.estado) {
                throw new Error('anuncioCreacion: Tu cuenta presenta problemas de bloqueo, favor de contactar a servicio al cliente!');
            }

            usuarioClass = UsuarioClass.Usuario;
            Usuario = new usuarioClass(ResultadoUsuario);

            if (!ResultadoUsuario.numero_telefonico_verificado) {
                //Agregar una forma de actualizar su telefono y su estado "numero_telefonico_verificado", por cambio de celular tal vez.

                let result = await Usuario.verificacionNuevaCelular().catch(err => {
                    //Registrar este error de usuario para atenderlo despues
                    throw new Error(`anuncioCreacion: Favor de intentar nuevamente o verificar tu número de celular registrado en la cuenta de lo contrario contactar a servicio al cliente!`);
                });

                //Este envío de correo es con el template Verificación!!
                Usuario.enviandoCorreo({ templateId: 'd-42b7fb4fd59b48e4a293267f83c1523b', codigoVerificacion: result.data })
                    .catch(err => {
                        //Registrar este error de usuario para atenderlo
                        throw new Error("Error al enviar el correo, favor de validarlo o comunicarse con servicio al cliente!");
                    });
                throw new Error(`anuncioCreacion: Necesitas verificar tu número de celular para crear un anuncio, su nuevo código de verificación de celular ya fue creado ${result.mensaje} y enviada a su celular.!`);
            }

            //Usuario con el numero_telefonico_verificado
            console.dir(input);
            const AnuncioModel = new Models.Anuncio(input);
            AnuncioModel.id_usuario = user['http://localhost:3000/graphql'].id;

            //Salvando Anuncio
            let NuevoAnuncio = await AnuncioModel.save()
                .catch(
                    err => {
                        console.log("err save anuncio");
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
            console.log('anuncioActualizacion...');

            try {
                ResultadoAnuncio = await Models.Anuncio.findByIdAndUpdate(input.id, { $set: input }, { timestamps: false, upsert: true, new: true }).lean().exec();
            } catch (err) {
                console.dir(err);
                throw new Error("anuncioActualizacion: Posible error en el id brindado!");
            }

            if (!ResultadoAnuncio) {
                throw new Error('anuncioActualizacion: Anuncio no encontrado');
            }

            console.dir(ResultadoAnuncio);

            return "Anuncio actualizado con éxito!";
        },

        /*
          anuncioEliminacion: 
        */
        async anuncioEliminacion(parent, { id_anuncio }, { Models, user }) {
            let ResultadoAnuncio, ResultadoUsuario;

            //Se valida que sea el dueño del anuncio y se extrae la llamada en lean
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

            await Models.Anuncio.findByIdAndRemove(id_anuncio).exec();

            //Encontrar el usuario y actualizar su lista de anuncios
            ResultadoUsuario = await Models.Usuario.findById(ResultadoAnuncio.id_usuario, { 'anuncios_usuario': 1 }).exec();
            let anunciosRestantes = ResultadoUsuario.anuncios_usuario.filter((value, index) => {
                if (value.toString() !== id_anuncio) {
                    return value;
                }
            });
            ResultadoUsuario.anuncios_usuario = anunciosRestantes;
            ResultadoUsuario.save();

            return "Anuncio eliminado con éxito!";
        },

        async imagenEliminacion(parent, { input }, { Models, user }) {
            console.log("imagenEliminacion...");

            try {
                console.log("dirName...", __dirname);
                const uploadPath = path.join(__dirname, '../../..', 'uploads');
                const fileLocation = path.resolve(uploadPath, input);
                console.log("input ", input, "uploadPath", uploadPath, "fileLocation", fileLocation);
                //que se traiga en su lista de imagenes de aunicio la imagen y que esa actualice y elimine tmb
                await unlinkAsync(fileLocation);
            } catch (error) {
                console.dir(error);
                throw new Error("´Problemas al borrar el archivo");
            }
            return "Anuncio eliminado con éxito!";
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
          solicitarVerificacionCelular: Se le asigna un código al usuario para pasar a verificar su identidad.
        */
        async solicitarVerificacionCelular(parent, params, { Models, user }) {
            let ResultadoUsuario, Usuario, result, usuarioClass;

            try {
                ResultadoUsuario = await Models.Usuario.findById(user['http://localhost:3000/graphql'].id, { 'max_updates': 1, 'codigo_verificacion_celular': 1, 'numero_telefonico_verificado': 1 }).exec();
            } catch (err) {
                console.dir(err)
                throw new Error(`solicitarVerificacionCelular: Error en la búsqueda!>>> Favor de volver a iniciar sesion e iniciar de nuevo o contactar a servicio al cliente!`);
            }

            if (!ResultadoUsuario) {
                throw new Error('solicitarVerificacionCelular: Usuario no existe!>>> Favor de volver a iniciar sesion e iniciar de nuevo o contactar a servicio al cliente!');
            }

            usuarioClass = UsuarioClass.Usuario;
            Usuario = new usuarioClass(ResultadoUsuario);
            result = await Usuario.verificacionNuevaCelular()
                .catch(err => {
                    console.dir(err)
                    throw new Error(`solicitarVerificacionCelular: ${err.mensaje}`);
                });

            //Este envío de correo es con el template Verificación!!
            Usuario.enviandoCorreo({ templateId: 'd-42b7fb4fd59b48e4a293267f83c1523b', codigoVerificacion: result.data })
                .catch(err => {
                    throw new Error(`${err.mensaje}`);
                });

            return `Solicitud de verificación fue creada con ${result.mensaje} y enviada a su correo!`;
        },

        async solicitarVerificacionAnuncio(parent, { id_anuncio, foto_anuncio }, { Models }) {

            const BitacoraInfo = {
                "id_anuncio": id_anuncio,
                "foto_anuncio": foto_anuncio,
            };
            crearVerificacionAnuncio(BitacoraInfo);
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