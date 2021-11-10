import { Promise } from 'mongoose'
import CodigoVerificacion from './codigoVerificacion'

import bcrypt from 'bcrypt'

class Usuario {
    constructor(Usuario) {
        this.Usuario = Usuario;
        console.log(Usuario);
    }

    //Pendiente bloquear usuario
    verificacionNuevoUsuario(estaLoggeado = false) {
        return new Promise(async(resolved, reject) => {
            console.log("verificacionNuevoUsuario...", estaLoggeado);

            this.Usuario.max_intentos = 0;
            this.Usuario.codigo_verificacion_usuario = null;
            if (!estaLoggeado) {
                this.Usuario.codigo_verificacion_usuario = CodigoVerificacion.creacion();
            }

            await this.Usuario.save()
                .catch(err => {
                    console.dir(err);
                    return reject({ "mensaje": "Error en el update del usario verificación" });
                });

            resolved({ "mensaje": "código de verificación de Usuario fue creado con éxtio" });
        });
    }

    verificacionUsuarioNuevoIntento() {
        this.Usuario.max_intentos = this.Usuario.max_intentos + 1;
        this.Usuario.save()
            .catch(err => {
                console.dir(err);
                throw new Error(`Usuario verificacionUsuarioNuevoIntento: error en el update de max updates del usario ${id_usuario}`);
            });
    }

    verificacionNuevaCelular() {
        return new Promise(async(resolved, reject) => {
            this.Usuario.max_updates = 0;
            this.Usuario.codigo_verificacion_celular = CodigoVerificacion.creacion();
            this.Usuario.numero_telefonico_verificado = false;
            //Este tipo de funciones devuelven el objeto, como hacer para que no lo haga y tal vez pueda ser más rápida
            await this.Usuario.save()
                .catch(err => {
                    console.dir(err);
                    reject({ mensaje: "verificacionNuevaCelular: Favor de intentar nuevamente o contactar a servicio al cliente!" });
                    return;
                });
            resolved({ mensaje: "con éxito" });
        });

    }

    verificacionCelularNuevoIntento() {
        this.Usuario.max_updates = this.Usuario.max_updates + 1;
        this.Usuario.save()
            .catch(err => {
                console.dir(err);
                throw new Error(`Usuario verificacionCelularNuevoIntento: error en el update de max updates del usario ${id_usuario}`);
            });
    }

    verificarCelularUsuario() {
        return new Promise(async(resolved, reject) => {
            this.Usuario.max_updates = 0;
            this.Usuario.numero_telefonico_verificado = true;
            this.Usuario.codigo_verificacion_celular = null;
            let result;

            try {
                result = await this.Usuario.save();
            } catch (error) {
                return reject({ "mensaje": error.mensaje });
            }

            resolved({ "mensaje": "Usuario celular verificado con éxito!" });
        });
    }

    usuarioBloqueado() {
        return new Promise((resolved, reject) => {});
    }

    guardandoContrasena(PropiedadExtra = {}) {
        return new Promise(async(resolved, reject) => {
            //Preparando para guardar contrasena
            if (PropiedadExtra.hasOwnProperty('max_intentos')) {
                this.Usuario.max_intentos = 0;
            }
            console.log(`guardandoContrasena... ${this.Usuario.contrasenaNueva}`);

            this.Usuario.contrasena = await bcrypt.hash(this.Usuario.contrasenaNueva, 10).catch(
                err => {
                    return reject({ "mensaje": "Error en la encriptacion" });
                }
            );

            await this.Usuario.save()
                .catch(
                    err => {
                        console.log("err**********************");
                        console.dir(err);
                        return reject({ "mensaje": "Error al guardar la contraseña" });
                    }
                );

            resolved({ "mensaje": "con éxito" });
        });
    }

    //Descripción de funcion
    //Esta llamada que sea await para enviar otro error al front indicando que hubo un error al enviar, ekiz si no es await
    //pq ya esta en un clousre de error
    //Se esta testeando que si en su llamada ya termino con un error throw su catch ya no surtirá efecto
    //tal vez si tengra que hacer un await ahí (Creo que no como quiera pasa el throw porque esta en el ciclo de nodejs)...
    async enviandoCorreo() {
        return new Promise(async(resolved, reject) => {
            //Esto no debe de aparecer porque la función temrino en un throw new Error
            await setTimeout(() => {
                reject({ "mensaje": "enviandoCorreo: Error al enviar el correo, favor de validarlo o comunicarse con servicio al cliente!" });
            }, 2000);
            resolved({ "mensaje": "Correo enviado" });
        });
    }

}

module.exports = { Usuario };