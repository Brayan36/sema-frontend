import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import MarcoAcceso from './components/MarcoAcceso';
import CampoAcceso from './components/CampoAcceso';
import Icono from './components/Icono';

import { validarRegistro } from './validaciones';

import type { DatosRegistro, ErroresAcceso } from './types';

import useTituloAcceso from './useTituloAcceso';

const vacio: DatosRegistro = {
  nombre: '',
  correo: '',
  contrasena: '',
  confirmacion: '',
};

export default function RegistroUsuario() {
  useTituloAcceso('Crea tu cuenta');

  const [datos, setDatos] = useState(vacio);
  const [errores, setErrores] = useState<ErroresAcceso>({});
  const [listo, setListo] = useState(false);

  const formulario = useRef<HTMLFormElement>(null);

  function cambiar(campo: keyof DatosRegistro, valor: string) {
    setDatos((prev) => ({
      ...prev,
      [campo]: valor,
    }));

    setErrores((prev) => ({
      ...prev,
      [campo]: undefined,
      ...(campo === 'contrasena'
        ? { confirmacion: undefined }
        : {}),
    }));

    setListo(false);
  }

  return (
    <MarcoAcceso registro>
      <div className="ac-titulo">
        <p className="ac-antetitulo">
          CULTIVA NUEVAS POSIBILIDADES
        </p>

        <h1>Crea tu cuenta</h1>

        <p>
          El primer paso para conocer mejor tu tierra.
        </p>
      </div>

      <form
        ref={formulario}
        className="ac-formulario"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();

          const nuevos = validarRegistro(datos);

          setErrores(nuevos);

          if (Object.keys(nuevos).length) {
            requestAnimationFrame(() =>
              formulario.current
                ?.querySelector<HTMLInputElement>(
                  '[aria-invalid="true"]'
                )
                ?.focus()
            );
            return;
          }

          setDatos((prev) => ({
            ...prev,
            contrasena: '',
            confirmacion: '',
          }));

          setListo(true);
        }}
      >
        <CampoAcceso
          id="registro-nombre"
          etiqueta="Nombre completo"
          icono="usuario"
          autoComplete="name"
          maxLength={100}
          placeholder="¿Cómo te llamas?"
          value={datos.nombre}
          onChange={(e) =>
            cambiar('nombre', e.target.value)
          }
          error={errores.nombre}
          required
        />

        <CampoAcceso
          id="registro-correo"
          etiqueta="Correo electrónico"
          icono="correo"
          type="email"
          autoComplete="username"
          maxLength={254}
          placeholder="tu@correo.com"
          value={datos.correo}
          onChange={(e) =>
            cambiar('correo', e.target.value)
          }
          error={errores.correo}
          required
        />

        <CampoAcceso
          id="registro-clave"
          etiqueta="Contraseña"
          icono="candado"
          type="password"
          autoComplete="new-password"
          maxLength={128}
          placeholder="Crea una contraseña"
          ayuda="Usa al menos 8 caracteres."
          value={datos.contrasena}
          onChange={(e) =>
            cambiar('contrasena', e.target.value)
          }
          error={errores.contrasena}
          required
        />

        <CampoAcceso
          id="registro-confirmacion"
          etiqueta="Confirmar contraseña"
          icono="candado"
          type="password"
          autoComplete="new-password"
          maxLength={128}
          placeholder="Repite tu contraseña"
          value={datos.confirmacion}
          onChange={(e) =>
            cambiar('confirmacion', e.target.value)
          }
          error={errores.confirmacion}
          required
        />

        {listo && (
          <p className="ac-mensaje" role="status">
            Los campos se validaron. Todavía no se creó
            ninguna cuenta: el registro estará disponible
            cuando se habilite el servicio.
          </p>
        )}

        <button
          className="ac-primario"
          type="submit"
        >
          Crear cuenta
          <Icono nombre="flecha" />
        </button>
      </form>

      <p className="ac-alternativa">
        ¿Ya tienes cuenta?{' '}
        <Link to="/login">
          Inicia sesión
        </Link>
      </p>

      {/* Enlace para regresar a la portada principal */}
      <p className="ac-alternativa">
        <Link to="/">
          ← Volver al inicio
        </Link>
      </p>
    </MarcoAcceso>
  );
}