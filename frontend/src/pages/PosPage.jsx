import { useNavigate } from 'react-router-dom';
import PosScreen from '../components/pos/PosScreen';

/**
 * PosPage — Página independiente del Punto de Venta.
 * Monta PosScreen directamente y al presionar "Volver"
 * navega al historial de ventas (/ventas).
 */
export default function PosPage() {
  const navigate = useNavigate();

  const handleVolver = () => {
    navigate('/ventas');
  };

  return <PosScreen onVolver={handleVolver} />;
}
