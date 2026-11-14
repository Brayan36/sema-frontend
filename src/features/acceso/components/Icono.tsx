type Nombre = 'correo' | 'candado' | 'ojo' | 'ocultar' | 'usuario' | 'flecha' | 'inicio' | 'mapa' | 'analisis' | 'rotacion' | 'alertas' | 'informes' | 'salir' | 'campana' | 'check';
const trazos: Record<Nombre, React.ReactNode> = {
  correo: <><rect x="3" y="5" width="18" height="14" rx="3" /><path d="m4 7 8 6 8-6" /></>,
  candado: <><rect x="5" y="10" width="14" height="11" rx="3" /><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3" /></>,
  ojo: <><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></>,
  ocultar: <><path d="m3 3 18 18M10 5a12 12 0 0 1 12 7 18 18 0 0 1-4 5M6 6a18 18 0 0 0-4 6s4 7 10 7a12 12 0 0 0 4-1M10 10a3 3 0 0 0 4 4" /></>,
  usuario: <><circle cx="12" cy="8" r="4" /><path d="M4 22v-3a8 8 0 0 1 16 0v3" /></>,
  flecha: <path d="M4 12h16m-6-6 6 6-6 6" />,
  inicio: <><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Z" /><path d="M9 21v-8h6v8" /></>,
  mapa: <><path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3ZM9 3v15m6-12v15" /><circle cx="16" cy="9" r="2" /></>,
  analisis: <><path d="M4 3v18h17M8 16v-5m5 5V6m5 10v-8" /></>,
  rotacion: <><path d="M20 9a8 8 0 0 0-14-5L3 7m0-5v5h5M4 15a8 8 0 0 0 14 5l3-3m0 5v-5h-5" /></>,
  alertas: <><path d="m10 4-8 14a2 2 0 0 0 2 3h16a2 2 0 0 0 2-3L14 4a2 2 0 0 0-4 0Z" /><path d="M12 9v5m0 3v.1" /></>,
  informes: <><path d="M14 2H5v20h14V7Z" /><path d="M14 2v5h5M8 12h8m-8 4h6" /></>,
  salir: <><path d="M9 3H3v18h6m0-9h13m-5-5 5 5-5 5" /></>,
  campana: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></>,
  check: <path d="m5 12 4 4L19 6" />,
};

export default function Icono({ nombre, className = '' }: { nombre: Nombre; className?: string }) {
  return <svg className={className} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{trazos[nombre]}</svg>;
}
