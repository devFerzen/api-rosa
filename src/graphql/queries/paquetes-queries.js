import gql from 'graphql-tag';
const paquetesQueries = gql `

    type Query {
        queryPaquetes: [PaqueteType]!
    }

    type Mutation {
        creacionPaquete(input: PaqueteInput!): String!
    }
`;
module.exports = paquetesQueries;