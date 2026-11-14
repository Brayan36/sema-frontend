import { Link } from 'react-router-dom';

export default function Header() {
  return (
    <header className="encabezado-sema">
      <Link to="/mi-finca" className="marca-sema" aria-label="SEMA, Mi finca">
        <span className="marca-simbolo" aria-hidden="true">S</span>
        <span>SEMA<small>Territorio y agricultura</small></span>
      </Link>
      <span className="etiqueta-base">Prototipo en desarrollo</span>
    </header>
  );
}
