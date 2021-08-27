import {Schema, model} from 'mongoose';

let correoRegexp = /.+\@.+\..+/;
const DefaultContactoSchema = new Schema({
  _id:false,
  tipo: { type: String },
  url: { type: String }
});

const usuarioSchema = new Schema(
  {
    usuario: { type: String, maxlength: 60, unique: true, required: true, match: correoRegexp},
    contrasena: { type: String, minlenght: 8, required: true },
    numero_telefonico: { type: Number, required: true, unique: true },
    numero_telefonico_verificado: { type: Boolean, default: false },
    Ubicacion_Usuario: {
      pais: { type: String, default: 'México'},
      estado: { type: String, required: true },
      ciudad: { type: String, required: true },
      ip: { type: String }
    },
    Default_Contactos: { type: [DefaultContactoSchema], default: undefined },
    anuncios_usuario: [ {type: [String], default: undefined } ],
    terminos_condiciones: { type: Boolean, default: true },
    estado: { type: Boolean, default: true }
  },
  {
    timestamps: {
      createdAt: 'fecha_creacion',
      updatedAt: 'fecha_actualizacion'
    }
  }
);

const usuario = model('usuario', usuarioSchema);
export default usuario;
