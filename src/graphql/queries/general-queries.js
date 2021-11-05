import gql from 'graphql-tag';

const generalQueries = gql `
     type Mutation {
        nuevoContactoCliente(input: ContactanosInput! ):String!
    }
`;
module.exports = generalQueries;