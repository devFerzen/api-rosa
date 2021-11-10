module.exports = {

    Mutation: {
        /*
            nuevoContactoCliente: Guarda el correo del usuario más no se espera si pasa con error o no, si pasa por error
            se debe de poner en logs.
        */
        async nuevoContactoCliente(parent, { input }, { Models, user }) {
            let ResultadoUsuario;
            //si hay usuario agregarlo al input
            if (user !== null) {
                input.correo = user['http://localhost:3000/graphql'].id;
            }

            //creacion directa
            try {
                const CorreoModel = new Models.Correo(input);
                await CorreoModel.save();
            } catch (error) {
                console.log("Error al crear el correo"); //guardar el input
                console.dir(error);
                //No tirar error solo guardar el error en un log
                return 'nuevoContactoCliente: Error al mandar el correo!';
            }

            return 'nuevoContactoCliente: Correo enviado con éxito!'
        },

        async ddlsGenerales(parent, params, { Models }) {

        }
    }
}