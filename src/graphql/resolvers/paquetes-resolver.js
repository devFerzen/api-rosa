module.exports = {
    Query: {
        queryPaquetes: async(_, args, { Models }) => {
            try {
                return await Models.Paquete.find({ estado: true })
            } catch (error) {
                console.dir(err)
                throw new Error(err);
            }
        }
    },
    Mutation: {
        async creacionPaquete(parent, { input }, { Models }) {
            const paquete = new Models.Paquete(input);

            let result = await paquete.save()
                .catch((err) => {
                    console.log("solicitarVerificacionAnuncio: error en el save!");
                    console.dir(err);
                });

            console.dir(result);
            return "Éxito creacionPaquete!";
        }
    }
}