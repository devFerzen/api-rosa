import gql from 'graphql-tag';

export const typeDef = gql `
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

  type SecDescripcionType {
    titulo: String,
    estado: String,
    ciudad: String,
    descripcion: String,
    sexo: String,
  }

  input SecDescripcionInput {
    titulo: String!,
    estado: String!,
    ciudad: String!,
    descripcion: String!,
    sexo: String
  }

  type SecContactoType {
    contacto: String,
    Tipo: TipoType
  }

  input SecContactoInput {
    contacto: String,
    Tipo: TipoInput
  }

  type SecTarifasType {
    nombre: String,
    precio: Int,
    descripcion: String
  }

  input SecTarifasInput {
    nombre: String,
    precio: Int,
    descripcion: String
  }

  type SecImagenesType {
    nombre: String,
    posicion: Int,
    url: String,
  }

  input SecImagenesInput {
    nombre: String,
    posicion: Int,
    url: String,
  }

  type TipoType {
    categoria: String,
    icono: String
  }

  input TipoInput {
    categoria: String,
    icono: String
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