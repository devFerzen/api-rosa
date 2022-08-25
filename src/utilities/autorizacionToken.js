import jwt from 'jsonwebtoken';
import Models from '../graphql/models';

module.exports = (user = Models.Usuario) => {
    const autorizacion_token = jwt.sign({ "http://localhost:3080/graphql": { id: user._id } },
        "envPassSecret", { expiresIn: '1m' },
    );

    const actualizacion_token = jwt.sign({ "http://localhost:3080/graphql": { conteo_sesion: user.conteo_sesion } },
        "envPassSecret2", { expiresIn: '480m' },
    );

    return { autorizacion_token, actualizacion_token }
}