import { Link } from 'react-router-dom';

export default function Header({ onSalir, demostracion }: { onSalir: () => void; demostracion: boolean }) {
  return (
    <header className="encabezado-sema">
      <Link to="/bienvenido" className="marca-sema" aria-label="SEMA, bienvenida">
        <span className="marca-simbolo" aria-hidden="true">S</span>
        <span>SEMA<small>Territorio y agricultura</small></span>
      </Link>
      <div className="acciones-cabecera"><span className="etiqueta-base">{demostracion ? 'Demostración · sin sesión real' : 'SEMA'}</span><button className="boton-salir" type="button" onClick={onSalir}>{demostracion ? 'Salir de la demostración' : 'Cerrar sesión'}</button></div>
    </header>
  );
}
