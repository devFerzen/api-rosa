import { Promise } from 'mongoose'
import CodigoVerificacion from './codigoVerificacion'

import bcrypt from 'bcrypt'

class Usuario {
    constructor(Usuario) {
        this.Usuario = Usuario;
        console.log(Usuario);
    }

    //Pendiente bloquear usuario
    verificacionNuevoUsuario() {
        return new Promise(async(resolved, reject) => {
            this.Usuario.max_intentos = 0;
            this.Usuario.codigo_verificacion_usuario = CodigoVerificacion.creacion();
            await this.Usuario.save()
                .catch(err => {
                    console.dir(err);
                    reject({ "mensaje": "Error en el update del usario verificación" });
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
                    reject({ mensaje: "error en el update en el usario" })
                });
            resolved({ "mensaje": "con éxito" });
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
            const result = await this.Usuario.save()
                .catch(err => {
                    reject({
                        "mensaje": "verificarCelularUsuario: no se pudo actualizar el numero_telefonico_verificado!",
                        "Error": err
                    });
                });

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
                    console.log("err**********************");
                    reject({ "mensaje": "Error en la encriptacion" });
                }
            );

            await this.Usuario.save()
                .catch(
                    err => {
                        console.dir(err);
                        reject({ "mensaje": "Error al guardar la contraseña" });
                    }
                );

            resolved({ "mensaje": "con éxito" });
        });
    }

    async enviandoCorreo() {
        return new Promise((resolved, reject) => {
            resolved({ "mensaje": "Correo enviado" });
            reject({ "mensaje": "Error al enviar el correo" });
        });
    }

}

module.exports = { Usuario };