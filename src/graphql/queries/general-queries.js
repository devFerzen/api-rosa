import gql from 'graphql-tag';

export const typeDef = gql `
    extend type Query {
        queryddlsByCategoria(categorias: [String]!):[DdlGeneralType!],
        queryddlsById(ids: [String]!):[DdlGeneralType!]
    }
    extend type Mutation {
        nuevoContactoCliente(input: ContactanosInput! ):String!,
    }
`;

export const resolvers = {
    Query: {
        queryddlsByCategoria: async(_, { categorias }, { Models }) => {
            let QueryResult;
            try {
                console.log("categorias query", categorias);
                QueryResult = await Models.DdlGeneral.find({ categoria: { $in: categorias } }, {}, { sort: { 'descripcion': 1 } })
            } catch (error) {
                console.dir(error);
                throw new error("Error en la busqueda de ddls");
            }
            return QueryResult;
        },

        queryddlsById: async(_, { ids }, { Models }) => {
            try {
                return Models.DdlGeneral.find({ no_id: { $in: ids } })
            } catch (error) {
                console.dir(error);
                throw new error("Error en la busqueda de ddls");
            }
        }
    },

    Mutation: {
        /*
            nuevoContactoCliente: Guarda el correo del usuario más no se espera si pasa con error o no, si pasa por error
            se debe de poner en logs.
        */
        async nuevoContactoCliente(parent, { input }, { Models, user }) {
            let ResultadoUsuario;
            //si hay usuario agregarlo al input
            if (user !== null) {
                input.correo = `${input.correo} ${user['http://localhost:3000/graphql'].id}`;
            }

            //creacion directa
            try {
                const CorreoModel = new Models.Correo(input);
                await CorreoModel.save();
            } catch (error) {
                console.log("Error al crear el correo"); //guardar el input
                console.dir(error);
                //No tirar error solo guardar el error en un log
                return 'nuevoContactoCliente: Error al mandar el correo!';
            }

            return 'nuevoContactoCliente: Correo enviado con éxito!'
        }
    }
}