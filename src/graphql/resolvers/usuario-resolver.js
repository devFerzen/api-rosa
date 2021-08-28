import bcrypt from 'bcrypt';
import creacionToken from '../../utilities/autorizacionToken'
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

            const UsuarioLoggeado = await Models.Usuario.findOne({ usuario: correo, estado: true })
                .catch(err => { throw new Error('Error en la búsqueda!') });
            if (!UsuarioLoggeado) {
                throw new Error('Usuario no existe!');
            }

            let comparacionContrasenas = await bcrypt.compare(contrasena, UsuarioLoggeado.contrasena);

            if (!comparacionContrasenas) {
                throw new Error('Contraseña Incorrecta');
            }

            console.dir(UsuarioLoggeado);

            const { autorizacion_token } = creacionToken(UsuarioLoggeado);
            UsuarioLoggeado.token = autorizacion_token;

            //tener acceso al res object e incertar una cookie

            //Ver el auth de vuemaster para ver si guardar en cookie esta bien

            return UsuarioLoggeado;
        },
        async registroUsuario(parent, { input }, { Models }) {
            console.dir(input);

            input.contrasena = await bcrypt.hash(input.contrasena, 10).catch(
                err => {
                    throw new Error('Error en la encriptacion');
                    console.dir(err);
                }
            );
            const NuevoUsuario = new Models.Usuario(input);
            await NuevoUsuario.save().catch(
                err => {
                    console.dir(err);
                    throw new Error('Error en la creación del Usuario');
                }
            );

            const { autorizacion_token } = creacionToken(NuevoUsuario);
            NuevoUsuario.token = autorizacion_token;
            return NuevoUsuario;
        },
    }
}