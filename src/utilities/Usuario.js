import { Promise } from 'mongoose'
import CodigoVerificacion from './codigoVerificacion'
import sgMail from '@sendgrid/mail'

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
            let codigoVerificacion = CodigoVerificacion.creacion();

            this.Usuario.max_intentos = 0;
            this.Usuario.codigo_verificacion_usuario = null;
            if (!estaLoggeado) {
                this.Usuario.codigo_verificacion_usuario = codigoVerificacion;
            }

            await this.Usuario.save()
                .catch(err => {
                    console.dir(err);
                    return reject({ "mensaje": "Error en el update del usario verificación" });
                });

            resolved({ "mensaje": "código de verificación de Usuario fue creado con éxtio", "data": codigoVerificacion });
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
            let codigoVerificacion = CodigoVerificacion.creacion();

            this.Usuario.max_updates = 0;
            this.Usuario.codigo_verificacion_celular = codigoVerificacion;
            this.Usuario.numero_telefonico_verificado = false;
            //Este tipo de funciones devuelven el objeto, como hacer para que no lo haga y tal vez pueda ser más rápida
            await this.Usuario.save()
                .catch(err => {
                    console.dir(err);
                    reject({ mensaje: "verificacionNuevaCelular: Favor de intentar nuevamente o contactar a servicio al cliente!" });
                    return;
                });
            resolved({ "mensaje": "código de verificación de Usuario fue creado con éxtio", "data": codigoVerificacion });
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

    async enviandoCorreo(CorreoTemplate) {
        return new Promise(async(resolved, reject) => {
            try {
                console.dir("enviandoCorreo...");
                sgMail.setApiKey(process.env.SENDGRID_API_KEY);

                const msg = {
                    to: 'alanferzen.ss@gmail.com',
                    from: process.env.MY_SECRET_EMAIL,
                    subject: 'Sending with Twilio SendGrid is Fun',
                    templateId: CorreoTemplate.templateId,
                    dynamicTemplateData: {
                        mensaje: 'Meje variables!!',
                        codigoVerificacion: CorreoTemplate.codigoVerificacion
                    }
                };

                await sgMail.send(msg);
            } catch (error) {
                console.dir("   en error");
                console.log(error);
                return reject({ "mensaje": "enviandoCorreo: Error al enviar el correo, favor de validarlo o comunicarse con servicio al cliente!" });
            }
            resolved({ "mensaje": "Correo enviado" });
        });
    }

}

module.exports = { Usuario };