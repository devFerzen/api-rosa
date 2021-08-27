import gql from 'graphql-tag';

const tiposSubBase = gql `
  type UbicacionUsuarioType {
    pais: String,
    estado: String,
    ciudad: String,
    ip: String
  }

  input UbicacionUsuarioInput {
    pais: String,
    estado: String,
    ciudad: String,
    ip: String
  }

  type DefaultContactosType {
    tipo: String,
    url: String
  }

  input DefaultContactosInput {
    tipo: String,
    url: String
  }

  type SecDescripcionType {
    titulo: String,
    estado: String,
    ciudad: String,
    descripcion: String
  }

  input SecDescripcionInput {
    titulo: String,
    estado: String,
    ciudad: String,
    descripcion: String
  }

  type SecContactoType {
    contacto: String,
    Tipo: TipoType
  }

  input SecContactoInput {
    contacto: String,
    Tipo: TipoInput
  }

  type TipoType {
    categoria: String,
    icono: String
  }

  input TipoInput {
    categoria: String,
    icono: String
  }

  type SecTarifasType {
    nombre: String,
    precio: String,
    descripcion: String
  }

  input SecTarifasInput {
    nombre: String,
    precio: String,
    descripcion: String
  }

  type SecImagenesType {
    nombre: String,
    url: String
  }

  input SecImagenesInput {
    nombre: String,
    url: String
  }

  type EstadoType {
    vivo: Boolean,
    mensaje: String
  }

  input EstadoInput {
    vivo: Boolean,
    mensaje: String
  }

  type DestacamentoType {
    fecha_creacion: Date,
    fecha_vencimiento: Date
  }

  input DestacamentoInput {
    fecha_creacion: Date,
    fecha_vencimiento: Date
  },

`;

module.exports = tiposSubBase;
