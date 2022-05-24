import gql from 'graphql-tag';

import bcrypt from 'bcrypt';
import creacionToken from '../../utilities/autorizacionToken'
import { crearBitacoraCreaciones } from '../../utilities/bitacoras'
import UsuarioClass from '../../utilities/Usuario'

import { GraphQLScalarType } from 'graphql';
import { Kind } from 'graphql/language';

export const typeDef = gql `
  extend type Query {
    queryUsuarioById(id: String!): UsuarioType,
    queryUsuario(input: String!): UsuarioType
  }

  extend type Mutation {
    inicioSesion(correo: String!, contrasena: String!): String!,
    cerrarSesion(input: String):String!,
    registroUsuario(input: UsuarioInput!): String!,
    actualizacionDefaultContactos(input: [SecContactoInput]!):String!,
    actualizacionContrasena(contrasenaVieja: String!, contrasenaNueva: String!): String!,
    compararVerificacionCelular(input: String!):String!,
    compararVerificacionUsuario(input: String, usuario: String!, clean: Boolean!):String!,
    solicitarRestablecerContrasena( usuario: String! ):String!
    restablecerContrasena(input: String, usuario: String!, contrasena: String!):String!,
  }
`;

export const resolvers = {
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
                console.log("id",id);

                let result = await Models.Usuario.findById(id).lean().populate('anuncios_usuario').exec();
                return result;
            } catch (err) {
                console.dir(err)
                throw new Error(err);
            }
        },

        queryUsuario: async(_, { input }, { Models, user }) => {
            let result;

            if(!user){
                console.log(">>> queryUsuario ", queryUsuario);
                throw new Error('Sin usuario loggeado.!');
            }
            
            try {                
                result = await Models.Usuario.findById(user.id).lean().populate('anuncios_usuario').exec();
                return result;
            } catch (error) {
                console.log(">>> error");
                return new Error('Error al buscar el usuario');    
            }
        }
    },

    Mutation: {
        /*
          inicioSesion: 
        */
        async inicioSesion(parent, { correo, contrasena }, { Models, res }) {
            let UsuarioLoggeado, Usuario, comparacionContrasenas;

            try {
                UsuarioLoggeado = await Models.Usuario.findOne({ usuario: correo, estado: true }, {}).populate('anuncios_usuario').exec();
            } catch (err) {
                console.dir(err);
                throw new Error(JSON.stringify({ mensaje: 'Error en la búsqueda!' }));
            }

            if (!UsuarioLoggeado) {
                throw new Error(JSON.stringify({ mensaje: 'Usuario no existe!' }));
            }

            //Cuenta con bloqueo
            if (UsuarioLoggeado.codigo_verificacion_usuario != undefined) {
                throw new Error(JSON.stringify({ mensaje: `Haz excedido el limite de intentos favor de validar su correo.`, pagina: 'home', componenteInterno: { panelHerramientasVerificacion: true, setTipoVerificacion: 'verificacionUsuarioContrasena', setCorreo: correo } }));
            }

            comparacionContrasenas = await bcrypt.compare(contrasena, UsuarioLoggeado.contrasena);
            if (!comparacionContrasenas) {
                UsuarioLoggeado = await Models.Usuario.findOne({ usuario: correo, estado: true }, { 'max_intentos': 1, 'codigo_verificacion_usuario': 1 }).exec();
                Usuario = new UsuarioClass(UsuarioLoggeado);

                if (UsuarioLoggeado.max_intentos >= 5) {
                    let result = await Usuario.verificacionNuevoUsuario()
                        .catch(err => {
                            throw new Error(JSON.stringify({ mensaje: `Favor de actualizar y intentarlo de nuevo, o comunicarse con servicio al cliente.` }));
                        });

                    //Este envío de correo es con el template Verificación!!
                    Usuario.enviandoCorreo({ templateId: 'd-42b7fb4fd59b48e4a293267f83c1523b', codigoVerificacion: result.data })
                        .catch(err => {
                            console.dir(err);
                            throw new Error(JSON.stringify({ mensaje: `Favor de validar su correo o comunicarse con servicio al cliente.` }));
                        });

                    throw new Error(JSON.stringify({ mensaje: `Haz excedido el limite de intentos favor de validar su cuenta en su correo.`, pagina: 'home', componenteInterno: { panelHerramientasVerificacion: true, setTipoVerificacion: 'verificacionUsuario', setCorreo: correo } }));
                }

                //Se la da un nuevo intento
                Usuario.verificacionUsuarioNuevoIntento();
                throw new Error(JSON.stringify({ mensaje: `Contraseña Incorrecta! Te restan ${5 - UsuarioLoggeado.max_intentos} intentos.!` }));
            }

            //Inicio de Sesión correcto
            Models.Usuario.findByIdAndUpdate(UsuarioLoggeado._id, { $set: { 'max_intentos': 0, 'codigo_verificacion_usuario': null } }).lean().exec();

            const { autorizacion_token, actualizacion_token } = creacionToken(UsuarioLoggeado);

            res.cookie('auth-token', autorizacion_token, {
                sameSite: 'strict',
                path: '/',
                expire: new Date(new Date().getTime() + 60 * 1000),
                httpOnly: true,
                secure: process.env.NODE_ENV !== "development"
            });

            res.cookie("refresh-token", actualizacion_token, {
                expire: new Date(new Date().getTime() + 6 * 1000) //60 * 60000)
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

            return JSON.stringify({ mensaje: 'Bienvenido', pagina: 'dashboard', componenteInterno: { setSesion: UsuarioLoggeado, panelHerramientasBusqueda: true } });
        },

        async cerrarSesion(parent, {input}, {res}){
            res.clearCookie('refresh-token');
            res.clearCookie('auth-token');
            return JSON.stringify({ mensaje: `Sesion cerrada, hasta pronto!`, pagina: 'home', componenteInterno:{ panelHerramientasBusqueda: true } });
        },

        /*
          registroUsuario: Registra un nuevo usuario.
        */
        async registroUsuario(parent, { input }, { Models, res }) {
            let Usuario;

            //Pendiente Validación de inputs

            input.contrasena = await bcrypt.hash(input.contrasena, 10).catch(
                err => {
                    console.dir(err);
                    throw new Error(JSON.stringify({ mensaje: 'Error en la encriptacion de la contraseña.' }));
                }
            );

            const NuevoUsuarioModel = new Models.Usuario(input);
            let NuevoUsuario = await NuevoUsuarioModel.save()
                .catch(
                    err => {
                        let _mensaje = err.toString();
                        console.dir(err);
                        throw new Error(JSON.stringify({ mensaje: _mensaje.search("duplicate key error") > 0 ? 'Usuario duplicado, favor de iniciar sesion o reportar el caso con servicio al cliente.' : 'Error en la creación del usuario.' }));
                    }
                );

            console.dir(NuevoUsuario);
            const { autorizacion_token, actualizacion_token } = creacionToken(NuevoUsuario);

            res.cookie('auth-token', autorizacion_token, {
                sameSite: 'strict',
                path: '/',
                expire: new Date(new Date().getTime() + 60 * 1000),
                httpOnly: true,
                secure: process.env.NODE_ENV !== "development"
            });

            res.cookie("refresh-token", actualizacion_token, {
                expire: new Date(new Date().getTime() + 6 * 1000) //60 * 60000)
            });

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

            //Este envío de correo es con el template Registro!!
            Usuario = new UsuarioClass(NuevoUsuarioModel);
            Usuario.enviandoCorreo({ templateId: 'd-293c0995cd20464cb732b025783c5e65' })
                .catch(err => {
                    throw new Error(JSON.stringify({ mensaje: `Envío fallido, favor de validar su correo o comunicarse con servicio al cliente!` }));
                });

            return JSON.stringify({ mensaje: 'Bienvenido', pagina: 'dashboard', componenteInterno: { setSesion: NuevoUsuarioModel, panelHerramientasBusqueda: true } });
        },

        /*
          actualizacionDefaultContactos: Actualización de contraseña que se hace dentro de una sesion del usuario.
        */
        async actualizacionDefaultContactos(parent, { input }, { Models, user }){
            let ResultadoUsuario, Usuario, result;

            /*Analizar su uso aqui, ya que ya se creo un plugin en el file permisos...if(!user){
                throw new Error(JSON.stringify({ mensaje: `Favor de inicar Sesion`, pagina: 'home', componenteInterno:{ panelHerramientasInicioSesion: true, cerrarSesion: true } }));
            }*/

            try{
                ResultadoUsuario = await Models.Usuario.findById(user.id, { 'Default_Contactos': 1 }).exec();
            }catch(err){
                throw new Error(JSON.stringify({ mensaje: `Favor de inicar Sesion nuevamente y validar los cambios!`, pagina: 'home', componenteInterno:{ panelHerramientasInicioSesion: true, cerrarSesion: true } }));
            }

            console.log(`input`);
            console.log(ResultadoUsuario);
            console.dir(input);

            if(!ResultadoUsuario){
                throw new Error(JSON.stringify({ mensaje: `Favor de inicar Sesion nuevamente y validar los cambios!`, pagina: 'home', componenteInterno:{ panelHerramientasInicioSesion: true, cerrarSesion: true } }));
            }
            ResultadoUsuario.Default_Contactos = input;
            Usuario = new UsuarioClass(ResultadoUsuario);

            result = await Usuario.guardandoDefaultContactos().catch(err => {
                throw new Error(JSON.stringify({ mensaje: `Error al querer actualizar los datos.` }));
            });

            return JSON.stringify({ mensaje: `${result.mensaje}` });

        },
        /*
          actualizacionContrasena: Actualización de contraseña que se hace dentro de una sesion del usuario.
        */
        async actualizacionContrasena(parent, { contrasenaVieja, contrasenaNueva }, { Models, user }) {
            let ResultadoUsuario, Usuario, comparacionContrasenas, result;

            //busqueda de usuadio
            try {
                ResultadoUsuario = await Models.Usuario.findById(user.id, { 'contrasena': 1, 'max_intentos': 1 }).exec();
            } catch (err) {
                console.dir(err);
                throw new Error(JSON.stringify({ mensaje: `Error al tratar de encontrar al usuario.` }));
            }

            if (!ResultadoUsuario) {
                throw new Error(JSON.stringify({ mensaje: `Usuario no se encontro.` }));
            }

            ResultadoUsuario.contrasenaNueva = contrasenaNueva;
            Usuario = new UsuarioClass(ResultadoUsuario);

            //Si al momento de actualizar su contraseña este excede de mas de 5 intentos este lo envia a verificar su cuenta
            if (ResultadoUsuario.max_intentos >= 5) {
                // nueva verificacion ** Pendiente bloqueo de usuario
                let result = await Usuario.verificacionNuevoUsuario()
                    .catch(err => {
                        throw new Error(JSON.stringify({ mensaje: `Favor de Iniciar Sesion nuevamente y intentarlo de nuevo, o comunicarse con servicio al cliente.!` }));
                    });

                //AFSS: Aquí preguntar si se tiene que avisar si el usuario ya intentado o fallado al iniciar sesion?
                //Este envío de correo es con el template Verificación!!
                Usuario.enviandoCorreo({ templateId: 'd-42b7fb4fd59b48e4a293267f83c1523b', codigoVerificacion: result.data })
                    .catch(err => {
                        throw new Error(JSON.stringify({ mensaje: `Envío fallido, favor de validar su correo o comunicarse con servicio al cliente!` }));
                    });
                throw new Error(JSON.stringify({ mensaje: `Haz excedido el limite de intentos favor INCIAR SESION nuevamente y de validar tu cuenta con el código de verificación que se le ha enviado a su correo.`, pagina: 'home', componenteInterno: { panelHerramientasVerificacion: true } }));
            }

            //Comparaciones de contrasenas
            comparacionContrasenas = await bcrypt.compare(contrasenaVieja, ResultadoUsuario.contrasena);
            if (!comparacionContrasenas) {
                Usuario.verificacionUsuarioNuevoIntento();
                console.log(`Error contrasenas incorrectas: contrasenaVieja ${contrasenaVieja}, contrasenaNueva ${contrasenaNueva}`);
                throw new Error(JSON.stringify({ mensaje: `Contraseña Incorrecta` }));
            }

            result = await Usuario.guardandoContrasena({ 'max_intentos': 1 }).catch(err => {
                throw new Error(JSON.stringify({ mensaje: `Error al querer actualizar los datos.` }));
            });

            return JSON.stringify({ mensaje: `${result.mensaje}` });
        },

        /*
            compararVerificacionCelular: Compara el código de verificación de celular creado la primera vez que quizo
            crear un anuncio.
         */
        async compararVerificacionCelular(parent, { input }, { Models, user }) {
            let ResultadoUsuario, Usuario, result;

            try {
                ResultadoUsuario = await Models.Usuario.findById(user.id, { 'max_updates': 1, 'codigo_verificacion_celular': 1, 'numero_telefonico_verificado': 1 }).exec();
            } catch (err) {
                console.dir(err)
                throw new Error(JSON.stringify({ mensaje: `Error inesperado, Favor de intentar de iniciar Sesion nuevamente!` }));
            }

            if (!ResultadoUsuario) {
                throw new Error(JSON.stringify({ mensaje: 'Usuario no existe, favor de validar su usuario!' }));
            }

            Usuario = new UsuarioClass(ResultadoUsuario);

            if (ResultadoUsuario.max_updates >= 3) {
                let result = await Usuario.verificacionNuevaCelular()
                    .catch(err => {
                        console.log(`${err.mensaje}`)
                        throw new Error(JSON.stringify({ mensaje: `Favor de actualizar eh intentarlo nuevamente o contactar a servicio al cliente!` }));
                    });

                //Este envío de correo es con el template Verificación!!
                Usuario.enviandoCorreo({ templateId: 'd-42b7fb4fd59b48e4a293267f83c1523b', codigoVerificacion: result.data })
                    .catch(err => {
                        throw new Error(JSON.stringify({ mensaje: "Error al enviar el correo, favor de validarlo o comunicarse con servicio al cliente!" }));
                    });
                throw new Error(JSON.stringify({ mensaje: `Haz excedido el limite de intentos favor de validar tu cuenta, con el código de verificación que se le ha enviado a su celular.`, pagina: 'home', componenteInterno: { panelHerramientasVerificacion: true, setTipoVerificacion: 'verificacionUsuarioCelular' } }));
            }

            if (!ResultadoUsuario.codigo_verificacion_celular) {
                await Usuario.verificacionNuevaCelular().catch(err => {
                    throw new Error(JSON.stringify({ mensaje: `Favor de intentar nuevamente o contactar a servicio al cliente!` }));
                });

                //Este envío de correo es con el template Verificación!!
                Usuario.enviandoCorreo({ templateId: 'd-42b7fb4fd59b48e4a293267f83c1523b', codigoVerificacion: result.data })
                    .catch(err => {
                        throw new Error(JSON.stringify({ mensaje: "Error al enviar el correo, favor de validarlo o comunicarse con servicio al cliente!" }));
                    });
                throw new Error(JSON.stringify({ mensaje: `Se le ha enviado una código de verificación a su correo, favor de verificarlo.`, pagina: 'home', componenteInterno: { panelHerramientasVerificacion: true, setTipoVerificacion: 'verificacionUsuarioCelular' } }));
            }

            if (ResultadoUsuario.codigo_verificacion_celular !== input) {
                Usuario.verificacionCelularNuevoIntento();
                throw new Error(JSON.stringify({ mensaje: `Código de verificación incorrecto, favor de validarlo. Te restan ${5 - ResultadoUsuario.max_updates} intentos.` }));
            }

            //Se quita su bloquéo
            result = await Usuario.codigoCelularVerificado()
                .catch(err => {
                    throw new Error(JSON.stringify({ mensaje: `Error al guardar su verificación, favor de actualizar y verificar o hacer el proceso nuevamente.` }));
                });

            return JSON.stringify({ mensaje: `${result.mensaje}`, pagina: 'dashboard', componenteInterno: { numerotelefonicoUsuario: true, panelHerramientasBusqueda: true } });
        },

        /*
          solicitarRestablecerContraseña 1: Manda un código de verificación USUARIO por correo, en el 
          cuál deberá proporcionarlo para habilitar cambiar la contraseña
         */
        async solicitarRestablecerContrasena(parent, { usuario }, { Models }) {
            let ResultadoUsuario, result, Usuario;
            try {
                ResultadoUsuario = await Models.Usuario.findOne({ usuario: usuario }, { 'max_intentos': 1, 'codigo_verificacion_usuario': 1 })
                    .exec();
            } catch (err) {
                console.dir(err)
                throw new Error(JSON.stringify({ mensaje: `Error en la búsqueda!` }));
            }

            if (!ResultadoUsuario) {
                throw new Error(JSON.stringify({ mensaje: 'Usuario no existe!' }));
            }

            Usuario = new UsuarioClass(ResultadoUsuario);

            result = await Usuario.verificacionNuevoUsuario()
                .catch(err => {
                    throw new Error(JSON.stringify({ mensaje: `Favor de Iniciar Sesion nuevamente y intentarlo de nuevo, o comunicarse con servicio al cliente.!` }));
                });

            //Este envío de correo es con el template Verificación!!
            Usuario.enviandoCorreo({ templateId: 'd-42b7fb4fd59b48e4a293267f83c1523b', codigoVerificacion: result.data })
                .catch(err => {
                    throw new Error(JSON.stringify({ mensaje: `Error al enviar el correo, favor de validarlo o comunicarse con servicio al cliente.` }));
                });

            return JSON.stringify({ mensaje: `${result.mensaje}`, pagina: 'home', componenteInterno: { panelHerramientasVerificacion: true, setTipoVerificacion: 'verificacionUsuarioContrasena', setCorreo: usuario } });
        },

        /*
          compararVerificacionUsuario 2: Compara el código de verificación USUARIO mandado al usuario por correo
         */
        async compararVerificacionUsuario(parent, { input, usuario, clean }, { Models, res }) {
            let ResultadoUsuario, Usuario, result;
            try {
                ResultadoUsuario = await Models.Usuario.findOne({ usuario: usuario }, { 'max_intentos': 1, 'codigo_verificacion_usuario': 1 }).exec();
            } catch (err) {
                console.dir(err);
                throw new Error(JSON.stringify({ mensaje: `Favor de Iniciar Sesion nuevamente y intentarlo de nuevo, o comunicarse con servicio al cliente.!` })); //Usuario Incorrecto favor de verificarlo
            }

            if (!ResultadoUsuario) {
                throw new Error(JSON.stringify({ mensaje: 'Favor de Iniciar Sesion nuevamente y intentarlo de nuevo, o comunicarse con servicio al cliente.!' })); //Usuario no existe!
            }

            Usuario = new UsuarioClass(ResultadoUsuario);

            if (ResultadoUsuario.max_intentos >= 3) {
                // nueva verificacion
                result = await Usuario.verificacionNuevoUsuario()
                    .catch(err => {
                        throw new Error(JSON.stringify({ mensaje: `Favor de Iniciar Sesion nuevamente y intentarlo de nuevo, o comunicarse con servicio al cliente.!` }));
                    });

                //Este envío de correo es con el template Verificación!!
                Usuario.enviandoCorreo({ templateId: 'd-42b7fb4fd59b48e4a293267f83c1523b', codigoVerificacion: result.data })
                    .catch(err => {
                        throw new Error("Error al enviar el correo, favor de validarlo o comunicarse con servicio al cliente.!");
                    });
                throw new Error(JSON.stringify({ mensaje: `Haz excedido el limite de intentos favor de validar tu cuenta, con el código de verificación que se le ha enviado a su correo.`, pagina: 'home', componenteInterno: { panelHerramientasVerificacion: true } }));
            }

            //AFSS: Esta verificando su cuenta y no cuenta con su código de verificación... Validar flujo - habia comentario de mala idea
            if (!ResultadoUsuario.codigo_verificacion_usuario) {
                result = await Usuario.verificacionNuevoUsuario()
                    .catch(err => {
                        throw new Error(JSON.stringify({ mensaje: `Favor de Iniciar Sesion nuevamente y intentarlo de nuevo, o comunicarse con servicio al cliente.!` }));
                    });

                //Este envío de correo es con el template Verificación!!
                Usuario.enviandoCorreo({ templateId: 'd-42b7fb4fd59b48e4a293267f83c1523b', codigoVerificacion: result.data })
                    .catch(err => {
                        throw new Error(JSON.stringify({ mensaje: `Error al enviar el correo, favor de validarlo o comunicarse con servicio al cliente.` }));
                    });

                throw new Error(JSON.stringify({ mensaje: `No cuenta con código de verificación, y se le fue entregada una a su correo, favor de validar.` }));
            }

            if (ResultadoUsuario.codigo_verificacion_usuario !== input) {
                Usuario.verificacionUsuarioNuevoIntento();
                throw new Error(JSON.stringify({ mensaje: `Código de verificación incorrecto! Te restan ${3 - ResultadoUsuario.max_intentos} intentos.!` }));
            }

            //agregar un input extra e si esta activo eliminar el codigo de verificacion, que pase por default false y solo
            //en la accion de excederse del limite de 5 de inicio de sesion este lo mandará como verdaro
            if (clean) {
                Usuario.verificacionNuevoUsuario(true)
                    .catch(err => {
                        throw new Error(JSON.stringify({ mensaje: `Favor de actualizar y intentarlo de nuevo, o comunicarse con servicio al cliente.` }));
                    });
            }

            //Al tener exito de verificacion este mandar a llamar la creacion de token, si esq la borra al hacer el intento de iniciar sesion
            const { autorizacion_token, actualizacion_token } = creacionToken(ResultadoUsuario);

            res.cookie('auth-token', autorizacion_token, {
                sameSite: 'strict',
                path: '/',
                expire: new Date(new Date().getTime() + 60 * 1000),
                httpOnly: true,
                secure: process.env.NODE_ENV !== "development"
            });

            res.cookie("refresh-token", actualizacion_token, {
                expire: new Date(new Date().getTime() + 6 * 1000) //60 * 60000)
            });

            return JSON.stringify({ mensaje: `Verificación de usuario con Éxito!`, componenteInterno: { panelHerramientasCambioContrasena: true, setVerificacionUsuario: input } });
        },

        /*
          restablecerContrasena 3: Guarda una nueva contrasena dada por el usuario
         */
        async restablecerContrasena(parent, { input, usuario, contrasena }, { Models, user, res }) {
            let ResultadoUsuario, Usuario, result, borrarCodigo;
            console.log("restablecerContrasena...")

            //Agregar que sea un usuario verificado en el contexto user
            if(!user){
                //Analizar si esta funcion requiere que solo el usuario de la cuenta pueda cambiar la contraseña
                throw new Error(JSON.stringify({ mensaje: `Usuario no validado.!` }));
            }
            console.dir(user);
            
            //busqueda de usuadio
            try {
                ResultadoUsuario = await Models.Usuario.findOne({ usuario: usuario }, { 'contrasena': 1, 'max_intentos': 1, 'codigo_verificacion_usuario': 1 }).exec();
            } catch (err) {
                console.dir(err);
                throw new Error(JSON.stringify({ mensaje: `Posible error en el id brindado o Usuario no encontrado!` }));
            }

            if (!ResultadoUsuario) {
                res.clearCookie('refresh-token');
                res.clearCookie('auth-token');
                throw new Error(JSON.stringify({ mensaje: `El Usuario no se encontro, favor de Iniciar Sesion Nuevamente` }));
            }

            ResultadoUsuario.contrasenaNueva = contrasena;
            Usuario = new UsuarioClass(ResultadoUsuario);

            /*console.log("ResultadoUsuario.codigo_verificacion_usuario ", ResultadoUsuario.codigo_verificacion_usuario, " input", input);

            if (ResultadoUsuario.codigo_verificacion_usuario !== input) {
                Usuario.verificacionNuevoUsuario()
                    .catch(err => {
                        throw new Error(JSON.stringify({ mensaje: `Favor de Iniciar Sesion nuevamente y intentarlo de nuevo, o comunicarse con servicio al cliente.!` }));
                    });

                //Este envío de correo es con el template Verificación!!
                Usuario.enviandoCorreo({ templateId: 'd-42b7fb4fd59b48e4a293267f83c1523b', codigoVerificacion: result.data })
                    .catch(err => {
                        console.dir(err);
                        throw new Error(JSON.stringify({ mensaje: `Favor de validar su correo o comunicarse con servicio al cliente` }));
                    });
                throw new Error(JSON.stringify({ mensaje: `No pudimos actualizar su contraseña correctamente, le enviaremos un código de verificación a sus cuentas` }));
            }*/

            result = await Usuario.guardandoContrasena().catch(err => {
                throw new Error(JSON.stringify({ mensaje: `Favor de Iniciar Sesion nuevamente y intentarlo de nuevo, o comunicarse con servicio al cliente.` }));
            });

            Usuario.verificacionNuevoUsuario(borrarCodigo = true)
                .catch(err => {
                    throw new Error(JSON.stringify({ mensaje: `Favor de Iniciar Sesion nuevamente y intentarlo de nuevo, o comunicarse con servicio al cliente.` }));
                });

            res.clearCookie('refresh-token');
            res.clearCookie('auth-token');
            return JSON.stringify({ mensaje: `${result.mensaje}`, pagina: 'home', componenteInterno: { panelHerramientasInicioSesion: true, cerrarSesion: true  } });
        }

        //Creación para hacer un update de datos de usuario de Ubicacion_usuario y default_contacto
        //creo para que agregar un array es empujarlo así nada más...?

    }
}