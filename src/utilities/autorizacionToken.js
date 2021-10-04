import jwt from 'jsonwebtoken';
import Models from '../graphql/models';

module.exports = (user = Models.Usuario) => {
    const autorizacion_token = jwt.sign({ "http://localhost:3000/graphql": { id: user._id } },
        "envPassSecret", { expiresIn: '15m' },
    );

    return { autorizacion_token }
}