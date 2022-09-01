import gql from 'graphql-tag';

export const typeDef = gql `
  scalar Date

  type UsuarioType {
    id: ID!,
    token: String,
    usuario: String,
    contrasena: String,
    numero_telefonico: String,
    numero_telefonico_verificado: Boolean,
    Ubicacion_Usuario: UbicacionUsuarioType,
    Default_Contactos: SecContactoType,
    anuncios_usuario: [AnuncioType],
    terminos_condiciones: Boolean,
    max_updates: Int,
    max_intentos: Int,
    codigo_verificacion_celular: String,
    codigo_verificacion_usuario: String,
    estado: Boolean
  }

  input UsuarioInput {
    usuario: String,
    contrasena: String,
    numero_telefonico: String,
    numero_telefonico_verificado: Boolean,
    Ubicacion_Usuario: UbicacionUsuarioInput,
    Default_Contactos: SecContactoInput,
    anuncios_usuario: [String],
    terminos_condiciones: Boolean,
    estado: Boolean
  }

  type AnuncioType {
    id: ID!,
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
    id: ID!,
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

  input AnuncioNewInput {
    id: ID,
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
    id_usuario: String,
  }

  input VerificacionInput {
    id_verificacion: String,
    id_anuncio: String,
    id_usuario: String,
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
    descuento: Int,
    periodo_por: Int,
    estado: Boolean
  }

  input PaqueteInput {
    clave: String,
    tipo: String,
    nombre: String,
    descripcion: String,
    precio: Int,
    descuento: Int,
    periodo_por: Int,
    estado: Boolean
  }

  type DdlGeneralType {
    no_id: ID!,
    descripcion: String,
    icono_icono: String,
    icono_categoria: String,
    categoria: String,
    estado: Boolean,
    no_estado: String
  }

  input DdlGeneralInput {
    no_id: ID!,
    descripcion: String,
    icono_icono: String,
    icono_categoria: String,
    categoria: String,
    estado: Boolean
  }

  input QueryAnuncioInput {
    busquedaBuscarPor: String,
    busquedaCategorias: [String],
    busquedaEstado: String,
    busquedaCiudad: String,
    busquedaVerificado: Boolean,
    busquedaSexo: String
  }

  input ContactanosInput {
    correo: String,
    asunto: String,
    mensaje: String!,
    anuncio: String,
    respuesta: String,
    fecha_respuesta: Date
  }
`;