import { Link } from 'react-router-dom';
import MarcaSema from '../../features/acceso/components/MarcaSema';

type HeaderProps = {
  onSalir: () => void;
  demostracion: boolean;
};

export default function Header({
  onSalir,
  demostracion,
}: HeaderProps) {
  return (
    <header className="encabezado-sema">
      <Link
        to="/bienvenido"
        className="marca-sema"
        aria-label="SEMA, ir a bienvenida"
      >
        <MarcaSema pequena />
      </Link>

      <div className="encabezado-acciones">
        {demostracion && (
          <span className="indicador-demostracion">
            Modo demostración
          </span>
        )}

        <button
          type="button"
          onClick={onSalir}
          className="boton-salir"
        >
          Cerrar sesión
        </button>
      </div>
    </header>
  );
}