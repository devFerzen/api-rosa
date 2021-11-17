import gql from 'graphql-tag';

const generalQueries = gql `
    type Query {
        queryddlsByCategoria(categorias: [String]!):[DdlGeneralType!],
        queryddlsById(ids: [String]!):[DdlGeneralType!]
    }
     type Mutation {
        nuevoContactoCliente(input: ContactanosInput! ):String!,
    }
`;
module.exports = generalQueries;