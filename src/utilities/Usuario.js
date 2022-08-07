import { Promise } from 'mongoose'
import CodigoVerificacion from './codigoVerificacion'
import sgMail from '@sendgrid/mail'

import bcrypt from 'bcrypt'

class Usuario {
    constructor(Usuario) {
        this.Usuario = Usuario;
        console.log(Usuario);
    }

    //Manda a crear un Codigo de verificacion de Usuario y si esta loggeado solo guarda la informacion nueva
    verificacionNuevoUsuario(estaLoggeado = false) {
        return new Promise(async(resolved, reject) => {
            console.log("verificacionNuevoUsuario...", estaLoggeado);
            let codigoVerificacion;

            this.Usuario.max_intentos = 0;
            this.Usuario.codigo_verificacion_usuario = null;

            if (!estaLoggeado) {
                //Solo cuando no esta loggeado manda codigo de verificacion
                codigoVerificacion = CodigoVerificacion.creacion();
                this.Usuario.codigo_verificacion_usuario = codigoVerificacion;
            }

            await this.Usuario.save()
                .catch(err => {
                    console.log(">>>verificacionNuevoUsuario<<<");
                    console.dir(err);
                    reject({
                      mensaje: `Error al tratar de crear su código de verificación, Favor de intentar de nuevo o comunicarse al servicio al cliente!.`,
                    });
                    return;
                });

            resolved({mensaje:'Código de verificación creado con éxito!.'});
        });
    }

    verificacionUsuarioNuevoIntento() {
        this.Usuario.max_intentos = this.Usuario.max_intentos + 1;
        this.Usuario.save()
            .catch(err => {
                //console.log(">>>verificacionUsuarioNuevoIntento<<<");
                //console.dir(err);
                throw new Error({mensaje: `error al actualizar el máximo de actualizaciones.`});
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
                    console.log(">>>verificacionNuevaCelular<<<");
                    console.dir(err);
                    reject({ mensaje: "error al querer guardar el usuario." });
                    return;
                });
            resolved({ mensaje: "Favor de ingresar el código de verificación que se le fue enviado a su correo!.", "data": codigoVerificacion });
        });

    }

    verificacionCelularNuevoIntento() {
        this.Usuario.max_updates = this.Usuario.max_updates + 1;
        this.Usuario.save()
            .catch(err => {
                //console.log(">>>verificacionCelularNuevoIntento<<<");
                //console.dir(err);
                throw new Error({mensaje: `error al actualizar el máximo de actualizaciones.`});
            });
    }

    codigoCelularVerificado() {
        return new Promise(async(resolved, reject) => {
            this.Usuario.max_updates = 0;
            this.Usuario.numero_telefonico_verificado = true;
            this.Usuario.codigo_verificacion_celular = null;
            let result;

            try {
                result = await this.Usuario.save();
            } catch (err) {
                //console.log(">>>codigoCelularVerificado<<<");
                //console.dir(err);
                return reject({ mensaje: 'error al guardar el usuario.' });
            }

            resolved({ mensaje: "Verificación fue exitosa!." });
        });
    }

    usuarioBloqueado() {
        return new Promise((resolved, reject) => {});
    }

    guardandoDefaultContactos(){
        return new Promise(async(resolved, reject)=>{
            await this.Usuario.save()
            .catch(
                err => {
                    console.log(">>>guardandoDefaultContactos<<<");
                    console.dir(err);
                    return reject();
                }
            );
            resolved({mensaje: `Default Contacts actualizados exitosamente!.`});
        });
    }

    guardandoContrasena(PropiedadExtra = {}) {
        return new Promise(async(resolved, reject) => {
            //Preparando para guardar contrasena
            if (PropiedadExtra.hasOwnProperty('max_intentos')) {
                this.Usuario.max_intentos = 0;
            }
            console.log(`guardandoContrasena para ${this.Usuario.contrasenaNueva}... `);

            this.Usuario.contrasena = await bcrypt.hash(this.Usuario.contrasenaNueva, 10).catch(
                err => {
                    return reject({ mensaje: "Error al tratar de guardar la contraseña!." });
                }
            );

            await this.Usuario.save()
                .catch(
                    err => {
                        console.log(">>>guardandoContrasena<<<");
                        console.dir(err);
                        return reject({ mensaje: "error al guardar la contraseña." });
                    }
                );

            resolved();
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
                console.log(">>>enviandoCorreo<<<");
                console.dir(error);
                return reject({ mensaje: "error al enviar el correo." });
            }
            resolved({ mensaje: "Correo enviado con éxito" });
        });
    }

}

module.exports = Usuario;