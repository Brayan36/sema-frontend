import { Link } from "react-router-dom";
import "./Inicio.css";

export default function Inicio() {
  return (
    <main className="sema-inicio">
      <section className="sema-portada">
        {/* Barra de navegación superior */}
        <header className="sema-encabezado">
          <Link to="/" className="sema-marca">
            <span className="sema-hoja">🌿</span>
            <span>SEMA</span>
          </Link>

          <nav className="sema-menu" aria-label="Navegación principal">
            <Link to="/" className="sema-enlace-activo">
              Inicio
            </Link>

            <Link to="/login">Plataforma</Link>

            <Link to="/acerca-de-nosotros">
              Acerca de nosotros
            </Link>
          </nav>
        </header>

        {/* Contenido de la portada */}
        <div className="sema-presentacion">
          <div className="sema-identidad">
            <span className="sema-simbolo">🌿</span>

            <div>
              <h1>SEMA</h1>
              <p>Sistema Espacial de Monitoreo Agrícola</p>
            </div>
          </div>

          <h2>
            Datos satelitales para una agricultura más
            resiliente, sostenible y global.
          </h2>

          <p className="sema-descripcion">
            Explora información sobre el clima, el suelo y los cultivos
            para tomar decisiones agrícolas mejor fundamentadas.
          </p>

          <div className="sema-acciones">
            <Link to="/login" className="sema-boton-comenzar">
              Comenzar <span aria-hidden="true">▶</span>
            </Link>

            <Link
              to="/acerca-de-nosotros"
              className="sema-boton-conocer"
            >
              Conocer más
            </Link>
          </div>
        </div>

        {/* Beneficios de la plataforma */}
        <div className="sema-beneficios">
          <div className="sema-beneficio">
            <span className="sema-beneficio-icono">🌱</span>
            <span>Monitoreo de información satelital</span>
          </div>

          <div className="sema-beneficio">
            <span className="sema-beneficio-icono">🌦️</span>
            <span>Análisis del clima y del suelo</span>
          </div>

          <div className="sema-beneficio">
            <span className="sema-beneficio-icono">🌎</span>
            <span>Decisiones agrícolas más inteligentes</span>
          </div>
        </div>
      </section>
    </main>
  );
}
