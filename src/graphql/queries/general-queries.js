import gql from 'graphql-tag';

const generalQueries = gql `
     type Mutation {
        nuevoContacto(input: ContactanosInput! ):String!
    }
`;
module.exports = generalQueries;