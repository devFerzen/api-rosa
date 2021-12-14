//importar moment
import Models from '../graphql/models';

// crearBitacoraCreaciones: Guarda bitacora de creación de Registro, Anuncio, Inicio de Sesión
export const crearBitacoraCreaciones = (DataBitacora, conteoEn) => {
    let extraUpdate;
    switch (conteoEn) {
        case 'count_registro':
            extraUpdate = { "count_registro": 1 };
            break;
        case 'count_inicio_sesion':
            extraUpdate = { "count_inicio_sesion": 1 };
            break;
        case 'count_anuncio':
            extraUpdate = { "count_anuncio": 1 };
            break;
        default:
            break;
    }
    const activationDate = new Date();
    const hoyEs = new Date(activationDate.getUTCFullYear(),
        activationDate.getUTCMonth(),
        activationDate.getUTCDate()
    );

    Models.BitacoraCreaciones.updateOne({ "fecha_creacion": hoyEs }, {
        "$push": DataBitacora,
        "$inc": extraUpdate
    }, {
        upsert: true,
        strict: false
    }).catch(err => {
        console.log(`error en el updateOne de bitacoraCreacion... Registro`);
        console.dir(err);
    });
}

// crearVerificacionAnuncio: Guarda bitacora de verificaciones de Anuncio
export const crearVerificacionAnuncio = async(DataBitacora) => {
    let respuesta = true;

    const NuevoResultado = new Models.AnunciosEnVerificacion(DataBitacora);
    await NuevoResultado.save().catch(err => {
        console.log(`error en el save de crearVerificacionAnuncio...`);
        console.dir(err);
        respuesta = false;
    });
    return respuesta;
}

export const crearBitacoraBusquedas = () => {
    console.log("importando bitacora x");
}