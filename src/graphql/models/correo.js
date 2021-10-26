import { Schema, model } from 'mongoose';

const correoSchema = new Schema(
  {
    correo: { type: String, required: true },
    asunto: { type: String, required: true },
    mensaje: { type: String, default: false },
    anuncio: { type: String, default: undefined },
    respuesta: { type: String, default: undefined },
    fecha_respuesta: { type: Date, default: undefined }
  },
  {
    timestamps: {
      createdAt: 'fecha_creacion',
      updatedAt: false
    }
  }
);

export default model('correo', correoSchema);