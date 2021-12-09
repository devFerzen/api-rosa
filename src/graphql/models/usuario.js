import { Schema, model } from 'mongoose';

let correoRegexp = /.+\@.+\..+/;

const DefaultContactoSchema = new Schema({
    _id: false,
    Tipo: {
        categoria: { type: String, default: undefined },
        icono: { type: String, default: undefined }
    },
    contacto: { type: String }
});

const usuarioSchema = new Schema({
    usuario: { type: String, maxlength: 60, unique: true, required: true, match: correoRegexp },
    contrasena: { type: String, minlenght: 8, required: true },
    numero_telefonico: { type: Number, required: true, unique: true },
    numero_telefonico_verificado: { type: Boolean, default: false },
    Ubicacion_Usuario: {
        pais: { type: String, default: 'México' },
        estado: { type: String },
        ciudad: { type: String },
        ip: { type: String }
    },
    Default_Contactos: { type: [DefaultContactoSchema] },
    anuncios_usuario: [{ type: Schema.Types.ObjectId, ref: 'anuncio' }],
    terminos_condiciones: { type: Boolean, default: true },
    max_intentos: { type: Number, default: 0 },
    max_updates: { type: Number, default: 0 },
    codigo_verificacion_celular: { type: String, default: undefined },
    codigo_verificacion_usuario: { type: String, default: undefined },
    estado: { type: Boolean, default: true },
    conteo_sesion: { type: Number, default: 0 }
}, {
    timestamps: {
        createdAt: 'fecha_creacion',
        updatedAt: 'fecha_actualizacion'
    }
});

usuarioSchema.post('save', function(error, doc, next) {
    if (error.name === 'MongoError' && error.code === 11000) {
        next(new Error('There was a duplicate key error'));
    } else {
        next(error);
    }
});


const usuario = model('usuario', usuarioSchema);
export default usuario;