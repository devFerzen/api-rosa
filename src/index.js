import { ApolloServer } from 'apollo-server-express';
import { applyMiddleware } from "graphql-middleware";
import express from 'express'; //express-graphql or express
import expressJwt from 'express-jwt';

import graphqlSchema from './graphql/schema';
/* AFSS - Investigación pendiente
  -> Las dependencies de arriba general un warning 61608 junto con
      graphql-tools se analizará después al corto, quizás mediano plazo
      no traerá complicaciones. (express-jwt quizás es el usa este método)
*/
import cors from 'cors';
import cookieParser from "cookie-parser";
import permissions from './graphql/permisos';
import mongoose from 'mongoose';
import config from 'config';
import morgan from 'morgan';
import multer from 'multer';
import path from 'path';

import Models from './graphql/models';


//Conexión MongoDb
mongoose.set('debug', false);
mongoose.connect(`${config.mongoUrl}`, {
        useUnifiedTopology: true,
        useNewUrlParser: true,
        useFindAndModify: false
    }).then(mongoose => console.log("DB Conectada... (°u°)"))
    .catch(err => console.log("DB No se Conecto... (T.T)"));

//Server and env Config
const port = process.env.PORT || 3000;
const app = express();

const corsOption = {
    origin: 'http://localhost:8080',
    credentials: true, //credentials true afss: investigar más la apertura de credenciales con client
    maxAge: 3600
}

app.use(cors(corsOption));

//Http console logs
/*morgan.token("custom", "Nuevo :method request meje de :url ...(*.*) Estatus de :status " +"Con un tiempo de :total-time[2] milliseconds...");
app.use(morgan('custom'));*/

app.use(cookieParser());

// Automated verify Token Bearer Authorization
app.use(expressJwt({
    secret: "envPassSecret",
    algorithms: ["HS256"],
    credentialsRequired: false
}));

// Apollo Server
const apolloContext = ({ req, res }) => ({
    req,
    res,
    user: req.user || null,
    Models
});

let upload = multer({
  dest: 'uploads/',
  fileFilter: function(req, file, cb){
    console.log('file filter...', file);
    let ext = path.extname(file.originalname);

    if(ext !== '.png' && ext !== '.jpg' && ext !== '.gif' && ext !== '.jpeg') {
      return callback(new Error('Only images are allowed'))
    }
    cb(null, true);
  }
});

app.post('/upload', upload.array('filePondImages',6), (req, res, next) => {
    console.log(req.user);
    console.log("app.post/upload->req.files:",req.files);
    console.log("app.post/upload->req.body.objetoImagen:");
    console.dir(req.body);
    /*{ 
        Object explain
        fieldname: 'filePondImages',
        originalname: 'fondo.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        destination: 'C:\\Users\\aqual\\repositorioWerk\\playgroundWerk\\werkNode\\uploads\\imagenes\\anuncio',
        filename: '1619460111681-fondo.jpg',
        path: 'C:\\Users\\aqual\\repositorioWerk\\playgroundWerk\\werkNode\\uploads\\imagenes\\anuncio\\1619460111681-fondo.jpg',
        size: 5510
    }*/
    //console.log("body upload", req.body); info extra dada en metadata

    if(!req.files) {
        const error = new Error("Something went mejeWrong");
        error.httpStatusCode = 400
        return next(error)
    }

    res.send([req.files[0].filename]);
});

app.get('/load/:anuncio', (req,res,next) =>{
    console.log("app.get/load->nombre_werk",req.params.nombre_werk);
    console.log("app.get/load->req.files",req.files);
    console.log("app.get/load->req.body",req.body);

    res.send("loaded!!!");
});


/*//Silent refresh
app.use((req, res, next) => {
    const refreshToken = req.cookies['refresh-token'];

    //Si no existe el token state, busca el refresh token
    if(!req.user){
        console.log(refreshToken," llamada de regreso 489");
        //se podrá devolver el token por aquí
        res.status = 489;
        return next()
    }

    console.log("Si existe la cookie refresh token: ", refreshToken);
    return next();
});*/

const server = new ApolloServer({
    schema: applyMiddleware(
        graphqlSchema,
        permissions //AFSS: Hace que no muestre los errores y pone not authorised
    ),
    graphiql: process.env.NODE_ENV != 'production' ? true : false,
    context: apolloContext
});
server.applyMiddleware({ app, cors: corsOption }); //overriding cors made by express https://stackoverflow.com/questions/54485239/apollo-server-express-cors-issue

app.listen(port, () => {
    console.log(`Servidor en el puerto: ${port}...`);
});