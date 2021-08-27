module.exports = {
  Mutation: {
    async creacionAnuncio(parent, { input, idUsuario }, { Models }){

      //Creacion Anuncio con el id del usuario creador
      const AnuncioModel = new Models.Anuncio(input);
      AnuncioModel.id_usuario = idUsuario;

      //Salvando Anuncio
      let NuevoAnuncio = await AnuncioModel.save()
      .catch(
        err => {
          console.dir(err);
          throw new Error('creacionAnuncio: Error en el salvado del anuncio!');
        }
      );

      console.dir(NuevoAnuncio);

      //Usuario Creador
      let UsuarioCreador = await Models.Usuario.findById(idUsuario, 'anuncios_usuario')
      .catch(
        err => {
          console.dir(err);
          throw new Error('creacionAnuncio: Usuario creador no encontrado!');
        }
      );

      //Salvando Id del nuevo anuncio la Creador
      UsuarioCreador.anuncios_usuario.unshift(NuevoAnuncio._id);
      await UsuarioCreador.save()
      .catch(
        err => {
          console.dir(err);
          throw new Error('creacionAnuncio: Error en la actualización del Usuario!');
        }
      );

      let categorias = NuevoAnuncio.categorias.toString();

      // Futura refactorización, pasarlo a un hook del schema Model
      const updateOne = Models.BitacoraCreaciones.updateOne(
        { "fecha_creacion": "2021-08-24" },
        {
          "$push": {
            "Creacion": {
              "id_usuario": NuevoAnuncio.id_usuario,
              "estado": NuevoAnuncio.Sec_Descripcion.estado,
              "ciudad": NuevoAnuncio.Sec_Descripcion.ciudad,
              "categorias": categorias,
              "tipo": "Creación"
            }
          },
          "$inc": { "count_creacion": 1 }
        },
        { upsert:true, strict:false }
      ).catch(err => {
        console.log("error en el updateOne de bitacoraCreacion...");
        console.dir(err);
      });

      console.log("que es esto");
      console.dir(updateOne);

      return AnuncioModel;
    },

    async updateAnuncio(parent, { input }, { Models }){
      let Anuncio = await Models.Anuncio.findByIdAndUpdate(input.id, input)
      .catch(err => {
          console.dir(err);
          throw new Error('updateAnuncio: Error al actualizar el Anuncio');
        }
      );

      console.dir(Anuncio);

      if(!Anuncio){
        throw new Error('updateAnuncio: Anuncio no encontrado');
      }

      //Refactorización en función privada (uso tmb en creacion)
      let categorias = Anuncio.categorias.toString();

      // Futura refactorización, pasarlo a un hook del schema Model
      const updateOne = Models.BitacoraCreaciones.updateOne(
        { "fecha_creacion": "2021-08-24" },
        {
          "$push": {
            "Creacion": {
              "id_usuario": Anuncio.id_usuario,
              "estado": Anuncio.Sec_Descripcion.estado,
              "ciudad": Anuncio.Sec_Descripcion.ciudad,
              "categorias": categorias,
              "tipo": "Creación"
            }
          },
          "$inc": { "count_actualizacion": 1 }
        },
        { upsert:true, strict:false }
      ).catch(err => {
        console.log("error en el updateOne de bitacoraCreacion...");
        console.dir(err);
      });

      return Anuncio;
    },

    async likeAnuncio(parent, { idAnuncio }, { Models }){
      let Anuncio = await Models.Anuncio.findById(idAnuncio)
      .catch(err => {
        console.dir(err);
        throw new Error('likeAnuncio: Error al encontrar el Anuncio');
      });

      Anuncio.no_corazones++;
      await Anuncio.save();
      return "Éxito!";
    },

    async vistaAnuncio(parent, { idAnuncio }, { Models }){
      let Anuncio = await Models.Anuncio.findById(idAnuncio)
      .catch(err => {
        console.dir(err);
        throw new Error('vistaAnuncio: Error al encontrar el Anuncio');
      });

      Anuncio.no_vistas++;
      await Anuncio.save();
      return "Éxito!";
    },

    async solicitarVerificacionAnuncio( parent, { input }, { Models }){
      let verificacion = new Models.AnunciosEnVerificacion({
        id_anuncio: input.id_anuncio,
        foto_anuncio: input.foto_anuncio
      });

      let result = verificacion.save().catch(err => {
        console.log("solicitarVerificacionAnuncio: error en el save!");
        console.dir(err);
      });

      console.dir(result);
      return "Éxito solicitarVerificacionAnuncio!";
    },

    async responderVerificacionAnuncio(parent, { input }, { Models }){
      let result = await Models.AnunciosEnVerificacion.findById(input.id_verificacion, (err, verificacion) => {
        if(err){
          console.dir(err);
          throw new Error('responderVerificacionAnuncio: Error al encontrar la verificación');
        }

        verificacion.respuesta = input.respuesta;
        verificacion.comentario = input.comentario;
        verificacion.fecha_respuesta = "2021-08-25";
        verificacion.save();
      });

      //Devuelve el antiguo objeto
      console.dir(result);
      return "Éxito Verificación!";

    }


  }
}
