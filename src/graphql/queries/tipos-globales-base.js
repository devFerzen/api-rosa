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
    Default_Contactos: SecContactoType,
    anuncios_usuario: [String],
    terminos_condiciones: Boolean,
    max_updates: Int,
    max_intentos: Int,
    codigo_verificacion_celular: String!,
    codigo_verificacion_usuario: String!,
    estado: Boolean
  }

  input UsuarioInput {
    usuario: String!,
    contrasena: String!,
    numero_telefonico: String!,
    numero_telefonico_verificado: Boolean,
    Ubicacion_Usuario: UbicacionUsuarioInput,
    Default_Contactos: SecContactoInput,
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

  type PaqueteType {
    clave: String,
    tipo: String,
    nombre: String,
    descripcion: String,
    precio: Int,
    periodo_por: Int,
    estado: Boolean
  }

  input PaqueteInput {
    clave: String,
    tipo: String,
    nombre: String,
    descripcion: String,
    precio: Int,
    periodo_por: Int,
    estado: Boolean
  }

  input QueryAnuncioInput {
    buscar_por: String,
    categorias: [String],
    estado: String,
    ciudad: String,
    verificado: Boolean,
    sexo: [String]
  }
`;
module.exports = tiposBase;
