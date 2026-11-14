export default function Loading({ mensaje = 'Cargando información…' }: { mensaje?: string }) {
  return <p className="mensaje-estado" role="status">{mensaje}</p>;
}
