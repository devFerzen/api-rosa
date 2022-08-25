import { Schema, model } from 'mongoose';

const PaqueteSchema = new Schema({
  clave: { type: String, required: true },
  tipo: {
    type: String,
    enum: ["actualizacion", "paquete_dias"],
    required: true,
  },
  nombre: { type: String, required: true },
  descripcion: { type: String, required: true },
  precio: { type: Number, required: true },
  descuento: { type: Number, required: true },
  periodo_por: { type: Number, required: true },
  estado: { type: Boolean, default: true },
});

const paquete = model('paquete', PaqueteSchema);
export default paquete;