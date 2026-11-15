import { Link } from 'react-router-dom';
import MarcaSema from '../../features/acceso/components/MarcaSema';

export default function Header() {
  return (
    <header className="encabezado-sema">
      <Link
        to="/bienvenida"
        className="marca-sema"
        aria-label="SEMA, ir a bienvenida"
      >
        <MarcaSema pequena />
      </Link>
    </header>
  );
}