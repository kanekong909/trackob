import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import styles from './ChatThread.module.css';

const POLL_MS = 4000;

function formatHora(iso) {
  return new Date(iso).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
}
function formatFechaCorta(iso) {
  return new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
}

export default function ChatThread({ obraId, novedadId = null, compact = false, placeholder = 'Escribe un mensaje…' }) {
  const { usuario } = useAuth();
  const toast = useToast();
  const [mensajes, setMensajes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const scrollRef = useRef(null);
  const cantidadPrevia = useRef(0);

  const cargar = useCallback(({ silencioso = false } = {}) => {
    if (!silencioso) setLoading(true);
    const params = new URLSearchParams({ obra_id: obraId });
    if (novedadId) params.set('novedad_id', novedadId);
    return api.get(`/api/chat?${params.toString()}`)
      .then((data) => { setMensajes(data); setError(''); })
      .catch((err) => { if (!silencioso) setError(err.message); })
      .finally(() => { if (!silencioso) setLoading(false); });
  }, [obraId, novedadId]);

  useEffect(() => { cargar(); }, [cargar]);

  useEffect(() => {
    const interval = setInterval(() => cargar({ silencioso: true }), POLL_MS);
    return () => clearInterval(interval);
  }, [cargar]);

  // Sigue el chat hacia abajo solo cuando llegan mensajes nuevos, no en
  // cada poll silencioso que no trajo nada distinto.
  useEffect(() => {
    if (mensajes.length > cantidadPrevia.current && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
    cantidadPrevia.current = mensajes.length;
  }, [mensajes]);

  async function enviar(e) {
    e.preventDefault();
    if (!texto.trim() || enviando) return;
    setEnviando(true);
    try {
      await api.post('/api/chat', { obra_id: obraId, novedad_id: novedadId || undefined, mensaje: texto.trim() });
      setTexto('');
      await cargar({ silencioso: true });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className={`${styles.wrap} ${compact ? styles.compact : ''}`}>
      <div className={styles.mensajes} ref={scrollRef}>
        {loading && <p className={styles.state}>Cargando mensajes…</p>}
        {!loading && error && <p className={styles.stateError}>{error}</p>}
        {!loading && !error && mensajes.length === 0 && (
          <p className={styles.empty}>Todavía no hay mensajes. Sé el primero en escribir.</p>
        )}
        {!loading && !error && mensajes.map((m) => {
          const esMio = Number(m.usuario_id) === Number(usuario?.id);
          return (
            <div key={m.id} className={`${styles.bubbleRow} ${esMio ? styles.bubbleRowMio : ''}`}>
              <div className={`${styles.bubble} ${esMio ? styles.bubbleMio : ''}`}>
                {!esMio && <span className={styles.autor}>{m.usuario_nombre}</span>}
                <p className={styles.texto}>{m.mensaje}</p>
                <span className={styles.hora}>{formatFechaCorta(m.creado_en)} · {formatHora(m.creado_en)}</span>
              </div>
            </div>
          );
        })}
      </div>
      <form className={styles.inputRow} onSubmit={enviar}>
        <input
          type="text"
          className={styles.input}
          placeholder={placeholder}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
        />
        <button type="submit" className={styles.sendBtn} disabled={!texto.trim() || enviando} aria-label="Enviar">➤</button>
      </form>
    </div>
  );
}
