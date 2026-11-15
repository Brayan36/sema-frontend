import { useState, type InputHTMLAttributes } from 'react';
import Icono from './Icono';

type Props = InputHTMLAttributes<HTMLInputElement> & { etiqueta: string; error?: string; ayuda?: string; icono: 'correo' | 'candado' | 'usuario' };
export default function CampoAcceso({ etiqueta, error, ayuda, icono, id, type = 'text', ...props }: Props) {
  const [visible, setVisible] = useState(false);
  const esClave = type === 'password';
  const descripcion = [ayuda ? `${id}-ayuda` : '', error ? `${id}-error` : ''].filter(Boolean).join(' ') || undefined;
  return <div className={`ac-campo ${error ? 'ac-campo-error' : ''}`}>
    <label htmlFor={id}>{etiqueta}</label>
    <div className="ac-entrada"><Icono nombre={icono} /><input {...props} id={id} type={esClave && visible ? 'text' : type} aria-invalid={Boolean(error)} aria-describedby={descripcion} />
      {esClave && <button className="ac-ver-clave" type="button" aria-label={`${visible ? 'Ocultar' : 'Mostrar'} ${etiqueta.toLowerCase()}`} aria-pressed={visible} aria-controls={id} onClick={() => setVisible(!visible)}><Icono nombre={visible ? 'ocultar' : 'ojo'} /></button>}
    </div>
    {ayuda && <p className="ac-ayuda" id={`${id}-ayuda`}>{ayuda}</p>}
    {error && <p className="ac-error-campo" id={`${id}-error`}>{error}</p>}
  </div>;
}
