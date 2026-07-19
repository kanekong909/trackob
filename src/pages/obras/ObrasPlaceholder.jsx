import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';

export default function ObrasPlaceholder() {
  const { usuario, logout } = useAuth();
  return (
    <div style={{ padding: 40, fontFamily: 'var(--font-body)' }}>
      <h2>Hola, {usuario?.nombre} 👋</h2>
      <p style={{ color: 'var(--steel)', margin: '8px 0 20px' }}>
        Aquí construiremos el dashboard de obras en el siguiente paso.
      </p>
      <Button variant="outline" onClick={logout}>Cerrar sesión</Button>
    </div>
  );
}
