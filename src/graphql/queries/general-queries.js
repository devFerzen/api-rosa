import gql from 'graphql-tag';

const generalQueries = gql `
     type Mutation {
        nuevoContactoCliente(input: ContactanosInput! ):String!,
        ddlsGenerales(catgoria: String!): [DdlGeneralType]
    }
`;
module.exports = generalQueries;