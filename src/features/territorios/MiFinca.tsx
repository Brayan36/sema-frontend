import { useNavigate } from 'react-router-dom';
import Card from '../../components/ui/Card';
import type { BorradorFinca } from '../../types/finca';
import FormularioFinca from './components/FormularioFinca';
import './territorios.css';

type Props = { borrador: BorradorFinca | null; onSeleccionar: (datos: BorradorFinca) => void };

export default function MiFinca({ borrador, onSeleccionar }: Props) {
  const navigate = useNavigate();
  return (
    <div className="pagina territorios">
      <p className="sobre-titulo">02 / TERRITORIOS</p>
      <h1>Mi finca</h1>
      <p className="introduccion">Empieza por identificar tu terreno y su ubicación.</p>
      <Card className="tarjeta-formulario" aria-label="Datos de mi finca">
        <FormularioFinca borrador={borrador} onSeleccionar={(datos) => { onSeleccionar(datos); navigate('/mapa'); }} />
      </Card>
    </div>
  );
}
