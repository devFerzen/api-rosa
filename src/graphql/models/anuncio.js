import { Schema, model } from "mongoose";
//Pendiente validaciones y maximo de caracteres

const contactoSchema = new Schema({
    _id: false,
    contacto: { type: String, required: true },
    Tipo: {
        categoria: { type: String, required: true, enum: ['fa', 'fas', 'fab'] },
        icono: { type: String, required: true }
    }
});

const tarifaSchema = new Schema({
    _id: false,
    nombre: { type: String, default: undefined },
    precio: { type: Number, default: undefined },
    descripcion: { type: String, default: undefined }
});

const imagenSchema = new Schema({
    _id: false,
    nombre: { type: String, default: undefined },
    posicion: { type: Number, default: 0 },
    url: { type: String, default: undefined }
});

const anuncioSchema = new Schema(
  {
    _id: { type: Schema.Types.ObjectId, required: true },
    categorias: { type: [String], required: true },
    permisos: { type: [String], required: true },
    Sec_Descripcion: {
      titulo: { type: String, maxlength: 25, required: true },
      estado: { type: String, required: true },
      ciudad: { type: String, required: true },
      descripcion: { type: String, required: true },
      sexo: { type: String, required: true },
    },
    Sec_Contacto: { type: [contactoSchema], default: undefined },
    Sec_Tarifas: { type: [tarifaSchema], default: undefined },
    Sec_Imagenes: { type: [imagenSchema], default: undefined },
    Estado: {
      vivo: { type: Boolean, default: true },
      mensaje: { type: String, default: undefined },
    },
    no_corazones: { type: Number, default: 0 },
    no_vistas: { type: Number, default: 0 },
    Destacado: {
      fecha_creacion: { type: Date, default: undefined },
      fecha_vencimiento: { type: Date, default: undefined },
    },
    verificado: { type: Boolean, default: false },
    id_usuario: { type: String, required: true },
  },
  {
    timestamps: {
      createdAt: "fecha_creacion",
      updatedAt: "fecha_actualizacion",
    },
  }
);

const anuncio = model('anuncio', anuncioSchema);
export default anuncio;