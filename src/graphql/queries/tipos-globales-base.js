import gql from 'graphql-tag';
const tiposBase = gql `
  scalar Date

  type UsuarioType {
    token: String!,
    usuario: String,
    contrasena: String,
    numero_telefonico: String,
    numero_telefonico_verificado: Boolean,
    Ubicacion_Usuario: UbicacionUsuarioType,
    Default_Contactos: DefaultContactosType,
    anuncios_usuario: [String],
    terminos_condiciones: Boolean,
    estado: Boolean
  }

  input UsuarioInput {
    usuario: String!,
    contrasena: String!,
    numero_telefonico: String!,
    numero_telefonico_verificado: Boolean,
    Ubicacion_Usuario: UbicacionUsuarioInput,
    Default_Contactos: DefaultContactosInput,
    anuncios_usuario: [String],
    terminos_condiciones: Boolean,
    estado: Boolean
  }

  type AnuncioType {
    categorias: [String],
    permisos: [String],
    Sec_Descripcion: SecDescripcionType,
    Sec_Contacto: [SecContactoType],
    Sec_Tarifas: [SecTarifasType],
    Sec_Imagenes: [SecImagenesType],
    Estado: EstadoType,
    no_corazones: Int,
    no_vistas: Int,
    Destacado: DestacamentoType,
    verificado: Boolean,
    id_usuario: String,
    fecha_creacion: Date,
    fecha_actualizacion: Date
  }

  input AnuncioInput {
    id: String,
    categorias: [String],
    permisos: [String],
    Sec_Descripcion: SecDescripcionInput,
    Sec_Contacto: [SecContactoInput],
    Sec_Tarifas: [SecTarifasInput],
    Sec_Imagenes: [SecImagenesInput],
    Estado: EstadoInput,
    no_corazones: Int,
    no_vistas: Int,
    Destacado: DestacamentoInput,
    verificado: Boolean,
    id_usuario: String
  }

  input VerificacionInput {
    id_verificacion: String,
    id_anuncio: String,
    foto_anuncio: String,
    respuesta: Boolean,
    comentario: String,
    fecha_respuesta: Date
  }
`;
module.exports = tiposBase;
