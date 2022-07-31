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
        console.dir(err);
        throw new Error(err);
      }
    },
  },
  Mutation: {
    async creacionPaquete(parent, { input }, { Models }) {
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
