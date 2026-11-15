import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import MarcaSema from './MarcaSema';
import '../acceso.css';

export default function MarcoAcceso({ children, registro = false }: { children: ReactNode; registro?: boolean }) {
  return <main className="ac-pagina">
    <section className={`ac-panel ${registro ? 'ac-panel-registro' : ''}`} aria-label="Acceso a SEMA">
      <aside className="ac-paisaje" aria-label="Paisaje agrícola">
        <span className="ac-etiqueta-paisaje"><span /> OBSERVAR PARA CUIDAR</span>
        <div className="ac-relato"><span className="ac-linea" /><p>Una nueva perspectiva<br />para tu <em>tierra.</em></p><span>Información del planeta.<br />Decisiones cerca de ti.</span></div>
        <span className="ac-pie-paisaje">TIERRA · CLIMA · AGRICULTURA</span>
      </aside>
      <div className="ac-contenido">
        <header className="ac-cabecera"><Link to="/login" aria-label="SEMA, acceso"><MarcaSema /></Link></header>
        <span className="ac-modo"><span /> Vista previa de la plataforma</span>
        {children}
      </div>
    </section>
    <footer className="ac-pie">SEMA <span>·</span> Conectando el espacio con tu tierra.</footer>
  </main>;
}
