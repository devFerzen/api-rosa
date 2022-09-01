'use extrict';

class QueryAnuncio {
    /*
       @typedef {Params} Object
       @property {String} buscar_por
       @property {String} estado
       @property {String} ciudad
       @property {String} verificado
       @property {String} [sexo]
       @property {String} [categorias]
       */
    constructor(Query) {
        Object.assign(this, Query);
    }

    queryLimpiada() {
        let Result = {};

        //Opciones por default
        Result['Estado.vivo'] = true;

        if (this.hasOwnProperty('busquedaBuscarPor')) {
            Result['Sec_Descripcion.titulo'] = { '$regex' : `.*${this.busquedaBuscarPor}*.`, '$options': 'i' }
        }

        if (this.hasOwnProperty('busquedaEstado')) {
            Result["Sec_Descripcion.estado"] = `${this.busquedaEstado} `;
        }

        if (this.hasOwnProperty('busquedaCiudad')) {
            Result["Sec_Descripcion.ciudad"] = `${this.busquedaCiudad} `;
        }

        if (this.hasOwnProperty('busquedaSexo')) {
            Result['Sec_Descripcion.sexo'] = {
                "$regex": this.busquedaSexo
            }
        }

        if (this.hasOwnProperty('busquedaVerificado')) {
            Result['verificado'] = this.verificado;
        }

        if (this.hasOwnProperty('busquedaCategorias')) {
            //afss el input mongoose manda en que dar como tipo de data... entonces se usa solo this.NombreDeLaPropiedad con sus accesos en caso de tenerlos [0].NombredeOtraProp
            Result['categorias'] = {
                "$in": this.busquedaCategorias
            }
        }

        console.log("Query Limpiada... result");
        console.dir(Result);
        return Result;
    }

}

export default QueryAnuncio;