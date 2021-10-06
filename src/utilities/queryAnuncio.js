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

        if (this.hasOwnProperty('buscar_por')) {
            Result['Sec_Descripcion.titulo'] = { '$regex': `.*${this.buscar_por}*.` }
        }

        if (this.hasOwnProperty('estado')) {
            Result['Sec_Descripcion.estado'] = { '$regex': `.*${this.estado}*.` }
        }

        if (this.hasOwnProperty('ciudad')) {
            Result['Sec_Descripcion.ciudad'] = { '$regex': `.*${this.ciudad}*.` }
        }

        if (this.hasOwnProperty('sexo')) {
            Result['Sec_Descripcion.sexo'] = {
                "$in": this.sexos
            }
        }

        if (this.hasOwnProperty('verificado')) {
            Result['verificado'] = this.verificado;
        }

        if (this.hasOwnProperty('categorias')) {
            Result['categorias'] = {
                "$in": this["categorias"]
            }
        }

        return Result;
    }

}

export default QueryAnuncio;