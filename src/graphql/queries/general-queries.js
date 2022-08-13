/**
 * Los queries podran controlar los errores pero no el resultado,
 * este siempre debera de regresar su tipo de returno. (Si es un string este puede ser Json.stringify(del objeto Result del front end))
 */

import gql from "graphql-tag";

export const typeDef = gql`
  extend type Query {
    queryddlsByCategoria(categorias: [String]!): [DdlGeneralType!]
    queryddlsById(ids: [String]!): [DdlGeneralType!]
  }
  extend type Mutation {
    nuevoContactoCliente(input: ContactanosInput!): String!
  }
`;

export const resolvers = {
  Query: {
    queryddlsByCategoria: async (_, { categorias }, { Models }) => {
      let QueryResult;
      try {
        console.log("categorias query", categorias);
        return await Models.DdlGeneral.find(
          { categoria: { $in: categorias } },
          {},
          { sort: { descripcion: 1 } }
        );
      } catch (error) {
        console.log("queryddlsByCategoria... en error");
        console.dir(error);

        return JSON.stringify({
          componenteInterno: {
            activationAlert: {
              type: "error",
              message: `Error en la busqueda de ddls`,
            },
          },
        });
      }
    },

    queryddlsById: async (_, { ids }, { Models }) => {
      try {
        return await Models.DdlGeneral.find({ no_id: { $in: ids } });
      } catch (error) {
        console.dir(error);
        console.log("queryddlsById... en error");
        console.dir(error);

        return JSON.stringify({
          componenteInterno: {
            activationAlert: {
              type: "error",
              message: `Error en la busqueda de ddls`,
            },
          },
        });
      }
    },
  },

  Mutation: {
    /*
            nuevoContactoCliente: Guarda el correo del usuario más no se espera si pasa con error o no, si pasa por error
            se debe de poner en logs.
        */
    async nuevoContactoCliente(parent, { input }, { Models, user }) {
      
      //Es un usuario registrado...
      if (user !== null) {
        console.dir(input);
        input.correo = `${input.correo} / ${user.id}`;
      }

      console.log("nuevoContactoCliente... ");
      console.dir(input)
      //creacion directa
      try {
        const CorreoModel = new Models.Correo(input);
        await CorreoModel.save();

      } catch (error) {
        console.log("nuevoContactoCliente... en error"); //guardar el input
        console.dir(error)

        return JSON.stringify({
          componenteInterno: {
            activationAlert: {
              type: "error",
              message: `Error al tratar de mandar el correo, favor de validarlo e intentarlo de nuevo!.`,
            },
          },
        });
      }

      return JSON.stringify({
        componenteInterno: {
          panelHerramientasBusqueda: true, //Analizar, este debe que estar en el front-end
          activationAlert: {
            type: "success",
            message: `Correo enviado con éxito!.`,
          },
        },
      });
    },
  },
};
