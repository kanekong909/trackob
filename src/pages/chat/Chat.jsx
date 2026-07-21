import { useParams } from 'react-router-dom';
import ChatThread from './ChatThread';
import styles from './Chat.module.css';

export default function Chat() {
  const { id: obraId } = useParams();

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Chat de la obra</h1>
        <p className={styles.subtitle}>Todo lo que se escribe aquí queda guardado, con fecha y quién lo dijo</p>
      </header>

      <ChatThread obraId={obraId} placeholder="Escribe algo para el equipo…" />
    </div>
  );
}
