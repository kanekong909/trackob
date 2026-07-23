import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import styles from './ChatThread.module.css';

const POLL_MS = 4000;
const ESCRIBIENDO_POLL_MS = 2500;
const ESCRIBIENDO_THROTTLE_MS = 2000;
const LONG_PRESS_MS = 450;

function formatHora(iso) {
  return new Date(iso).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
}
function formatFechaCorta(iso) {
  return new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
}

export default function ChatThread({ obraId, novedadId = null, compact = false, placeholder = 'Escribe un mensaje…', onMensajesCargados }) {
  const { usuario } = useAuth();
  const toast = useToast();
  const [mensajes, setMensajes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [escribiendo, setEscribiendo] = useState([]);
  const [editandoId, setEditandoId] = useState(null);
  const [textoEdicion, setTextoEdicion] = useState('');
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);

  const scrollRef = useRef(null);
  const cantidadPrevia = useRef(0);
  const ultimoAvisoEscribiendo = useRef(0);
  const pressTimer = useRef(null);

  const cargar = useCallback(({ silencioso = false } = {}) => {
    if (!silencioso) setLoading(true);
    const params = new URLSearchParams({ obra_id: obraId });
    if (novedadId) params.set('novedad_id', novedadId);
    return api.get(`/api/chat?${params.toString()}`)
      .then((data) => {
        setMensajes(data);
        setError('');
        onMensajesCargados?.(data.length);
      })
      .catch((err) => { if (!silencioso) setError(err.message); })
      .finally(() => { if (!silencioso) setLoading(false); });
  }, [obraId, novedadId]);

  useEffect(() => { cargar(); }, [cargar]);

  useEffect(() => {
    const interval = setInterval(() => cargar({ silencioso: true }), POLL_MS);
    return () => clearInterval(interval);
  }, [cargar]);

  // Quién está escribiendo ahora mismo (excluyéndome a mí, eso lo filtra el backend)
  useEffect(() => {
    const params = new URLSearchParams({ obra_id: obraId });
    if (novedadId) params.set('novedad_id', novedadId);
    function chequear() {
      api.get(`/api/chat/escribiendo?${params.toString()}`)
        .then((r) => setEscribiendo(r.usuarios || []))
        .catch(() => {});
    }
    chequear();
    const interval = setInterval(chequear, ESCRIBIENDO_POLL_MS);
    return () => clearInterval(interval);
  }, [obraId, novedadId]);

  // Sigue el chat hacia abajo solo cuando llegan mensajes nuevos, no en
  // cada poll silencioso que no trajo nada distinto.
  useEffect(() => {
    if (mensajes.length > cantidadPrevia.current && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
    cantidadPrevia.current = mensajes.length;
  }, [mensajes]);

  function avisarEscribiendo() {
    const ahora = Date.now();
    if (ahora - ultimoAvisoEscribiendo.current < ESCRIBIENDO_THROTTLE_MS) return;
    ultimoAvisoEscribiendo.current = ahora;
    api.post('/api/chat/escribiendo', { obra_id: obraId, novedad_id: novedadId || undefined }).catch(() => {});
  }

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

  // Editar con "presión larga" sobre un mensaje propio (mouse o touch)
  function iniciarPress(m, esMio) {
    if (!esMio) return;
    pressTimer.current = setTimeout(() => {
      setEditandoId(m.id);
      setTextoEdicion(m.mensaje);
    }, LONG_PRESS_MS);
  }
  function cancelarPress() {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  }

  async function guardarEdicion(id) {
    if (!textoEdicion.trim()) return;
    setGuardandoEdicion(true);
    try {
      await api.put(`/api/chat/${id}`, { mensaje: textoEdicion.trim() });
      setEditandoId(null);
      await cargar({ silencioso: true });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setGuardandoEdicion(false);
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
          const enEdicion = editandoId === m.id;
          return (
            <div key={m.id} className={`${styles.bubbleRow} ${esMio ? styles.bubbleRowMio : ''}`}>
              <div
                className={`${styles.bubble} ${esMio ? styles.bubbleMio : ''} ${esMio ? styles.editable : ''}`}
                onPointerDown={() => iniciarPress(m, esMio)}
                onPointerUp={cancelarPress}
                onPointerLeave={cancelarPress}
                onContextMenu={(e) => { if (esMio) e.preventDefault(); }}
              >
                {!esMio && <span className={styles.autor}>{m.usuario_nombre}</span>}

                {enEdicion ? (
                  <div className={styles.edicionBox} onPointerDown={(e) => e.stopPropagation()}>
                    <textarea
                      className={styles.edicionInput}
                      value={textoEdicion}
                      onChange={(e) => setTextoEdicion(e.target.value)}
                      autoFocus
                    />
                    <div className={styles.edicionAcciones}>
                      <button type="button" onClick={() => setEditandoId(null)}>Cancelar</button>
                      <button type="button" onClick={() => guardarEdicion(m.id)} disabled={guardandoEdicion}>Guardar</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className={styles.texto}>{m.mensaje}</p>
                    <span className={styles.hora}>
                      {formatFechaCorta(m.creado_en)} · {formatHora(m.creado_en)}
                      {m.editado_en && <em className={styles.editadoTag}> · editado</em>}
                    </span>
                  </>
                )}
              </div>
            </div>
          );
        })}

        {escribiendo.length > 0 && (
          <div className={styles.escribiendoRow}>
            <span className={styles.escribiendoTexto}>
              {escribiendo.length === 1 ? `${escribiendo[0]} está escribiendo` : 'Varias personas están escribiendo'}
            </span>
            <span className={styles.escribiendoDots}><span /><span /><span /></span>
          </div>
        )}
      </div>

      <form className={styles.inputRow} onSubmit={enviar}>
        <input
          type="text"
          className={styles.input}
          placeholder={placeholder}
          value={texto}
          onChange={(e) => { setTexto(e.target.value); avisarEscribiendo(); }}
        />
        <button type="submit" className={styles.sendBtn} disabled={!texto.trim() || enviando} aria-label="Enviar">➤</button>
      </form>
    </div>
  );
}