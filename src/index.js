import { ApolloServer } from 'apollo-server-express';
import { applyMiddleware } from "graphql-middleware";
import express from 'express';
import expressJwt from 'express-jwt';
import graphqlSchema from './graphql/schema';
/* AFSS - Investigación pendiente
  -> Las dependencies de arriba general un warning 61608 junto con
      graphql-tools se analizará después al corto, quizás mediano plazo
      no traerá complicaciones. (express-jwt quizás es el usa este método)
*/
import permissions from './graphql/permisos';
import mongoose from 'mongoose';
import config from 'config';
import morgan from 'morgan';
import Models from './graphql/models';

//Conexión MongoDb
mongoose.set('debug', true);
mongoose.connect(`${config.mongoUrl}`, {
        useUnifiedTopology: true,
        useNewUrlParser: true,
        useFindAndModify: false
    }).then(mongoose => console.log("DB Conectada... (°u°)"))
    .catch(err => console.log("DB No se Conecto... (T.T)"));

//Server and env Config
const port = process.env.PORT || 3000;
const app = express();

//Http console logs
/*morgan.token("custom", "Nuevo :method request meje de :url ...(*.*) Estatus de :status " +"Con un tiempo de :total-time[2] milliseconds...");
app.use(morgan('custom'));*/

// Automated verify Token Bearer Authorization
app.use(expressJwt({
    secret: "envPassSecret",
    algorithms: ["HS256"],
    credentialsRequired: true
}));

// Apollo Server
const apolloContext = ({ req, res }) => ({
    res,
    user: req.user || null,
    Models
});

// http://localhost:3000/graphql
const server = new ApolloServer({
    schema: applyMiddleware(
        graphqlSchema,
        permissions
    ),
    graphiql: process.env.NODE_ENV != 'production' ? true : false,
    context: apolloContext
});

server.applyMiddleware({ app });
app.listen(port, () => {
    console.log(`Servidor en el puerto: ${port}...`);
});