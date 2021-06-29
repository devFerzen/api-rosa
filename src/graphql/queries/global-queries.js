import gql from 'graphql-tag';
const globalQueries = gql `

type Sesion {
  token: String!
}
`;
module.exports = globalQueries;
