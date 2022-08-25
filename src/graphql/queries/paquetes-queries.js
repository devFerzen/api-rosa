import gql from "graphql-tag";

export const typeDef = gql`
  extend type Query {
    queryPaquetes: [PaqueteType]!
  }

  extend type Mutation {
    creacionPaquete(input: PaqueteInput!): String!
  }
`;

export const resolvers = {
  Query: {
    queryPaquetes: async (_, args, { Models }) => {
      try {
        return await Models.Paquete.find({ estado: true });
      } catch (error) {
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
  },
  Mutation: {

    //Analizar permiso de ejecutivo
    async creacionPaquete(parent, { input }, { Models }) {
      console.log(`creacionPaquete... input:`);
      console.dir(input);
      
      const paquete = new Models.Paquete(input);

      let result = await paquete.save().catch((err) => {
        throw new Error(
          JSON.stringify({ mensaje: `Error en la creación del paquete.` })
        );
      });

      console.dir(result);
      return JSON.stringify({
        componenteInterno: {
          activationAlert: {
            type: "success",
            message: `Paquete creado exitosamente!.`,
          },
        },
      });
    },
  },
};
