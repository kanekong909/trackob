import { useEffect, useRef, useState } from 'react';
import { formatDate } from '../../utils/format';
import styles from './FotoLightbox.module.css';

export default function FotoLightbox({ fotos, index, onClose, onIndexChange, onVerDetalles }) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const arrastrando = useRef(null);
  const touchStartX = useRef(null);

  const foto = fotos[index];

  // Resetear el zoom/paneo cada vez que cambia la foto mostrada
  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [index]);

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') ir(1);
      if (e.key === 'ArrowLeft') ir(-1);
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, fotos.length]);

  if (!foto) return null;

  function ir(delta) {
    const siguiente = index + delta;
    if (siguiente >= 0 && siguiente < fotos.length) onIndexChange(siguiente);
  }

  function toggleZoom(e) {
    if (zoom === 1) {
      setZoom(2.2);
    } else {
      setZoom(1);
      setPan({ x: 0, y: 0 });
    }
  }

  function onPointerDown(e) {
    if (zoom === 1) return;
    arrastrando.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  }
  function onPointerMove(e) {
    if (!arrastrando.current) return;
    setPan({ x: e.clientX - arrastrando.current.x, y: e.clientY - arrastrando.current.y });
  }
  function onPointerUp() {
    arrastrando.current = null;
  }

  function onWheel(e) {
    e.preventDefault();
    setZoom((z) => Math.min(3, Math.max(1, z - e.deltaY * 0.002)));
  }

  function onTouchStart(e) {
    if (zoom > 1) return; // si está en zoom, el gesto es para hacer pan, no swipe
    touchStartX.current = e.touches[0].clientX;
  }
  function onTouchEnd(e) {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (delta > 60) ir(-1);
    else if (delta < -60) ir(1);
    touchStartX.current = null;
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.topBar} onClick={(e) => e.stopPropagation()}>
        <span className={styles.counter}>{index + 1} / {fotos.length}</span>
        <div className={styles.topActions}>
          <button className={styles.iconBtn} onClick={() => onVerDetalles(foto)} aria-label="Ver detalles">ℹ Detalles</button>
          <button className={styles.iconBtn} onClick={onClose} aria-label="Cerrar">✕</button>
        </div>
      </div>

      <div
        className={styles.imageWrap}
        onClick={(e) => e.stopPropagation()}
        onDoubleClick={toggleZoom}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        onWheel={onWheel}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <img
          src={foto.foto_url}
          alt={foto.etapa || 'Avance de obra'}
          className={styles.image}
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            cursor: zoom > 1 ? 'grab' : 'zoom-in'
          }}
          draggable={false}
        />
      </div>

      {index > 0 && (
        <button className={`${styles.navBtn} ${styles.navPrev}`} onClick={(e) => { e.stopPropagation(); ir(-1); }} aria-label="Anterior">‹</button>
      )}
      {index < fotos.length - 1 && (
        <button className={`${styles.navBtn} ${styles.navNext}`} onClick={(e) => { e.stopPropagation(); ir(1); }} aria-label="Siguiente">›</button>
      )}

      <div className={styles.bottomBar} onClick={(e) => e.stopPropagation()}>
        {foto.etapa && <span className={styles.etapaBadge}>{foto.etapa}</span>}
        <span className={styles.fecha}>{formatDate(foto.fecha)}</span>
        <span className={styles.zoomHint}>Doble clic o rueda para zoom</span>
      </div>
    </div>
  );
}
