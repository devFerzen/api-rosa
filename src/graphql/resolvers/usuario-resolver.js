import bcrypt from 'bcrypt';
import creacionToken from '../../utilities/autorizacionToken'
import { crearBitacoraCreaciones } from '../../utilities/bitacoras'
import UsuarioClass from '../../utilities/Usuario'

import { GraphQLScalarType } from 'graphql';
import { Kind } from 'graphql/language';
import sizeof from 'object-sizeof';



module.exports = {
    Date: new GraphQLScalarType({
        name: 'Date',
        description: 'Date custom scalar type',
        parseValue(value) {
            const activationDate = new Date(value);
            return new Date(activationDate.getUTCFullYear(),
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
            if (ast.kind === Kind.INT) { // ast value is always in string format
                const activationDate = new Date(+ast.value);
                return new Date(activationDate.getUTCFullYear(),
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
        queryUsuarioById: async(_, { id }, { Models }) => {
            try {
                let result = await Models.Usuario.findById(id).lean().exec();
                return result;
            } catch (err) {
                console.dir(err)
                throw new Error(err);
            }
        }
    },

    Mutation: {
        /*
          inicioSesion: 
        */
        async inicioSesion(parent, { correo, contrasena }, { Models, res }) {
            let UsuarioLoggeado, Usuario, comparacionContrasenas;
            let usuarioClass = UsuarioClass.Usuario;
            try {
                UsuarioLoggeado = await Models.Usuario.findOne({ usuario: correo, estado: true }, {}).populate('anuncios_usuario').exec();
            } catch (err) {
                console.dir(err);
                throw new Error('Error en la búsqueda!')
            }

            if (!UsuarioLoggeado) {
                throw new Error('Usuario no existe!');
            }


            comparacionContrasenas = await bcrypt.compare(contrasena, UsuarioLoggeado.contrasena);
            if (!comparacionContrasenas) {
                UsuarioLoggeado = await Models.Usuario.findOne({ usuario: correo, estado: true }, { 'max_intentos': 1, 'codigo_verificacion_usuario': 1 }).exec();
                Usuario = new usuarioClass(UsuarioLoggeado);
                if (UsuarioLoggeado.max_intentos >= 5) {
                    // nueva verificacion ** Pendiente bloqueo de usuario
                    let result = await Usuario.verificacionNuevoUsuario()
                        .catch(err => {
                            throw new Error(`inicioSesion: ${err.mensaje}`);
                        });

                    Usuario.enviandoCorreo()
                        .catch(err => {
                            throw new Error("inicioSesion: Error al enviar el correo, favor de validarlo o comunicarse con servicio al cliente!");
                        });
                    throw new Error(`inicioSesion: Haz excedido el limite de intentos su nuevo ${result.mensaje} y enviado a su correo.!`);
                }

                Usuario.verificacionUsuarioNuevoIntento();
                throw new Error('inicioSesion: Contraseña Incorrecta');
            }

            const { autorizacion_token } = creacionToken(UsuarioLoggeado);
            UsuarioLoggeado.token = autorizacion_token;

            res.cookie('refresh-token', UsuarioLoggeado.token, {
                expire: 60 + Date.now(),
                httpOnly: true,
                secure: process.env.NODE_ENV !== "development" //Investigar
            });

            const Bitacora = {
                "Creacion": {
                    "id_usuario": UsuarioLoggeado.id,
                    "estado": UsuarioLoggeado.Ubicacion_Usuario.estado,
                    "ciudad": UsuarioLoggeado.Ubicacion_Usuario.ciudad,
                    "categorias": [],
                    "tipo": "Login"
                }
            };
            crearBitacoraCreaciones(Bitacora, 'count_inicio_sesion');

            //Ver el auth de vuemaster para ver si guardar en cookie esta bien
            return UsuarioLoggeado;
        },


        /*
          registroUsuario: Registra un nuevo usuario.
        */
        async registroUsuario(parent, { input }, { Models }) {
            //Pendiente Validación de inputs

            input.contrasena = await bcrypt.hash(input.contrasena, 10).catch(
                err => {
                    console.dir(err);
                    throw new Error('registroUsuario: Error en la encriptacion');
                }
            );

            const NuevoUsuarioModel = new Models.Usuario(input);
            let NuevoUsuario = await NuevoUsuarioModel.save()
                .catch(
                    err => {
                        throw new Error(`registroUsuario: Error en la save ${err}`);
                    }
                );

            console.dir(NuevoUsuario);
            const { autorizacion_token } = creacionToken(NuevoUsuarioModel);
            NuevoUsuarioModel.token = autorizacion_token;

            const Bitacora = {
                "Creacion": {
                    "id_usuario": NuevoUsuarioModel.id,
                    "estado": NuevoUsuarioModel.Ubicacion_Usuario.estado,
                    "ciudad": NuevoUsuarioModel.Ubicacion_Usuario.ciudad,
                    "categorias": [],
                    "tipo": "Registro"
                }
            };
            crearBitacoraCreaciones(Bitacora, 'count_registro');

            return NuevoUsuarioModel;
        },



        /*
          actualizacionContrasena: Actualización de contraseña que se hace dentro de una sesion del usuario.
        */
        async actualizacionContrasena(parent, { contrasenaVieja, contrasenaNueva }, { Models, user }) {
            let ResultadoUsuario, Usuario, comparacionContrasenas, result;
            let usuarioClass = UsuarioClass.Usuario;

            //busqueda de usuadio
            try {
                ResultadoUsuario = await Models.Usuario.findById(user['http://localhost:3000/graphql'].id, { 'contrasena': 1, 'max_intentos': 1 }).exec();
            } catch (err) {
                console.dir(err);
                throw new Error("actualizacionContrasena: Posible error en el id brindado!");
            }

            if (!ResultadoUsuario) {
                throw new Error("actualizacionContrasena: Usuario no se encontro");
            }

            ResultadoUsuario.contrasenaNueva = contrasenaNueva;
            Usuario = new usuarioClass(ResultadoUsuario);

            if (ResultadoUsuario.max_intentos >= 5) {
                // nueva verificacion ** Pendiente bloqueo de usuario
                let result = await Usuario.verificacionNuevoUsuario()
                    .catch(err => {
                        throw new Error(`actualizacionContrasena: ${err.mensaje}`);
                    });

                Usuario.enviandoCorreo()
                    .catch(err => {
                        throw new Error("actualizacionContrasena: Error al enviar el correo, favor de validarlo o comunicarse con servicio al cliente!");
                    });
                throw new Error(`actualizacionContrasena: Haz excedido el limite de intentos su nuevo ${result.mensaje} y enviado a su correo.!`);
            }

            //Comparaciones de contrasenas
            comparacionContrasenas = await bcrypt.compare(contrasenaVieja, ResultadoUsuario.contrasena);
            if (!comparacionContrasenas) {
                Usuario.verificacionUsuarioNuevoIntento();
                console.log(`Error contrasenas incorrectas: contrasenaVieja ${contrasenaVieja}, contrasenaNueva ${contrasenaNueva}`);
                throw new Error('actualizacionContrasena: Contraseña Incorrecta');
            }

            result = await Usuario.guardandoContrasena({ 'max_intentos': 1 }).catch(err => {
                throw new Error(`actualizacionContrasena:  ${err.mensaje}`);
            });

            return `actualizacionContrasena: ${result.mensaje}`;
        },

        /*
            compararVerificacionCelular: Compara el código de verificación de celular creado la primera vez que quizo
            crear un anuncio.
         */
        async compararVerificacionCelular(parent, { input }, { Models, user }) {
            let ResultadoUsuario, Usuario, result, usuarioClass;

            try {
                ResultadoUsuario = await Models.Usuario.findById(user['http://localhost:3000/graphql'].id, { 'max_updates': 1, 'codigo_verificacion_celular': 1, 'numero_telefonico_verificado': 1 }).exec();
            } catch (err) {
                console.dir(err)
                throw new Error(`compararVerificacionCelular: Error en la búsqueda!>>> Favor de iniciar Sesion nuevamente!`);
            }

            if (!ResultadoUsuario) {
                throw new Error('compararVerificacionCelular: Usuario no existe!');
            }

            usuarioClass = UsuarioClass.Usuario;
            Usuario = new usuarioClass(ResultadoUsuario);

            if (ResultadoUsuario.max_updates >= 3) {
                let result = await Usuario.verificacionNuevaCelular().catch(err => {
                    throw new Error(`compararVerificacionCelular: Favor de intentar nuevamente o contactar a servicio al cliente!`);
                });

                Usuario.enviandoCorreo()
                    .catch(err => {
                        throw new Error("Error al enviar el correo, favor de validarlo o comunicarse con servicio al cliente!");
                    });
                throw new Error(`compararVerificacionCelular: Haz excedido el limite de intentos su nueva verificación de celular ${result.mensaje} y enviado a su correo.!`);
            }

            if (!ResultadoUsuario.codigo_verificacion_celular) {
                await Usuario.verificacionNuevaCelular().catch(err => {
                    throw new Error(`compararVerificacionCelular: Favor de intentar nuevamente o contactar a servicio al cliente!`);
                });

                Usuario.enviandoCorreo()
                    .catch(err => {
                        throw new Error("Error al enviar el correo, favor de validarlo o comunicarse con servicio al cliente!");
                    });

                throw new Error("compararVerificacionCelular: Se le ha enviado una código de verificación a su correo, favor de verificarlo!");
            }

            if (ResultadoUsuario.codigo_verificacion_celular !== input) {
                Usuario.verificacionCelularNuevoIntento();
                throw new Error(`compararVerificacionCelular: Código de verificación incorrecto!`);
            }

            result = await Usuario.verificarCelularUsuario().catch(err => {
                throw new Error(`compararVerificacionCelular: ${err.mensaje}`);
            });

            return result.mensaje;
        },

        /*
          solicitarRestablecerContraseña 1: Manda un código de verificación USUARIO por correo, en el 
          cuál deberá proporcionarlo para habilitar cambiar la contraseña
         */
        async solicitarRestablecerContrasena(parent, { usuario }, { Models }) {
            let ResultadoUsuario, result, usuarioClass, Usuario;
            try {
                ResultadoUsuario = await Models.Usuario.findOne({ usuario: usuario }, { 'max_intentos': 1, 'codigo_verificacion_usuario': 1 })
                    .exec();
            } catch (err) {
                console.dir(err)
                throw new Error(`solicitarRestablecerContraseña: Error en la búsqueda!`);
            }

            if (!ResultadoUsuario) {
                throw new Error('solicitarRestablecerContraseña: Usuario no existe!');
            }

            usuarioClass = UsuarioClass.Usuario;
            Usuario = new usuarioClass(ResultadoUsuario);

            result = await Usuario.verificacionNuevoUsuario()
                .catch(err => {
                    throw new Error(`solicitarRestablecerContrasena: ${err.mensaje}`);
                });

            Usuario.enviandoCorreo()
                .catch(err => {
                    throw new Error("Error al enviar el correo, favor de validarlo o comunicarse con servicio al cliente!");
                });

            return `solicitarRestablecerContrasena: Su ${result.mensaje} y enviado a su correo, favor de validar!`;
        },

        /*
          compararVerificacionUsuario 2: Compara el código de verificación USUARIO mandado al usuario por correo
         */
        async compararVerificacionUsuario(parent, { input, usuario }, { Models }) {
            let ResultadoUsuario, usuarioClass, Usuario, result;
            try {
                ResultadoUsuario = await Models.Usuario.findOne({ usuario: usuario }, { 'max_intentos': 1, 'codigo_verificacion_usuario': 1 }).exec();
            } catch (err) {
                console.dir(err);
                throw new Error("compararVerificacionUsuario: posible error en el id brindado! >>> Usuario Incorrecto favor de verificarlo");
            }

            if (!ResultadoUsuario) {
                throw new Error('compararVerificacionUsuario: Usuario no existe!');
            }

            usuarioClass = UsuarioClass.Usuario;
            Usuario = new usuarioClass(ResultadoUsuario);

            if (ResultadoUsuario.max_intentos >= 5) {
                // nueva verificacion
                result = await Usuario.verificacionNuevoUsuario()
                    .catch(err => {
                        throw new Error(`compararVerificacionUsuario: ${err.mensaje}`);
                    });

                Usuario.enviandoCorreo()
                    .catch(err => {
                        throw new Error("Error al enviar el correo, favor de validarlo o comunicarse con servicio al cliente!");
                    });

                throw new Error(`Haz excedido el limite de intentos su nuevo ${result.mensaje} y enviado a su correo.!`);
            }

            if (!ResultadoUsuario.codigo_verificacion_usuario) {
                result = await Usuario.verificacionNuevoUsuario()
                    .catch(err => {
                        throw new Error(`compararVerificacionUsuario: ${err.mensaje}`);
                    });

                Usuario.enviandoCorreo()
                    .catch(err => {
                        throw new Error("Error al enviar el correo, favor de validarlo o comunicarse con servicio al cliente!");
                    });

                throw new Error(`compararVerificacionUsuario: No cuenta con código de verificación, su ${result.mensaje}`);
            }

            if (ResultadoUsuario.codigo_verificacion_usuario !== input) {
                Usuario.verificacionUsuarioNuevoIntento();
                throw new Error(`compararVerificacionUsuario: Código de verificación incorrecto!`);
            }

            return "Verificación de usuario con Éxito!";
        },

        /*
          restablecerContrasena 3: Guarda una nueva contrasena dada por el usuario
         */
        async restablecerContrasena(parent, { input, usuario, contrasena }, { Models }) {
            let ResultadoUsuario, Usuario, result;
            let usuarioClass = UsuarioClass.Usuario;
            console.log("restablecerContrasena...")

            //busqueda de usuadio
            try {
                ResultadoUsuario = await Models.Usuario.findOne({ usuario: usuario }, { 'contrasena': 1, 'max_intentos': 1, 'codigo_verificacion_usuario': 1 }).exec();
            } catch (err) {
                console.dir(err);
                throw new Error("restablecerContrasena: Posible error en el id brindado o Usuario no encontrado!");
            }

            if (!ResultadoUsuario) {
                throw new Error("restablecerContrasena: Usuario no se encontro");
            }

            ResultadoUsuario.contrasenaNueva = contrasena;
            Usuario = new usuarioClass(ResultadoUsuario);

            if (ResultadoUsuario.codigo_verificacion_usuario !== input) {
                Usuario.verificacionNuevoUsuario().then(result => {
                    console.log(`restablecerContrasena: ${result.mensaje}`);
                });

                Usuario.enviandoCorreo()
                    .catch(err => {
                        throw new Error("Error al enviar el correo, favor de validarlo o comunicarse con servicio al cliente!");
                    });
                throw new Error("No pudimos actualizar su contraseña correctamente, le enviaremos un código de verificación a sus cuentas!");
            }

            result = await Usuario.guardandoContrasena().catch(err => {
                throw new Error(`restablecerContrasena: ${err.mensaje}`);
            });

            return `Contraseña actualizada ${result.mensaje}`;
        }

        //Creación para hacer un update de datos de usuario de Ubicacion_usuario y default_contacto
        //creo para que agregar un array es empujarlo así nada más...?

    }
}