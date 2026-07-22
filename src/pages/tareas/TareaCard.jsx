// TareaCard.jsx
import { formatDate } from "../../utils/format";
import styles from "./Tareas.module.css";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const ESTADOS = [
  { value: "pendiente", label: "Pendiente" },
  { value: "en_progreso", label: "En progreso" },
  { value: "hecho", label: "Hecho" },
];

const ESTADO_BADGES = {
  pendiente: { label: "Pendiente", className: styles.pendiente },
  en_progreso: { label: "En progreso", className: styles.en_progreso },
  hecho: { label: "Hecho", className: styles.hecho },
};

function estaVencida(tarea) {
  if (!tarea.fecha_limite || tarea.estado === "hecho") return false;
  const [y, m, d] = tarea.fecha_limite.split("T")[0].split("-").map(Number);
  const limite = new Date(y, m - 1, d);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  return limite < hoy;
}

function getInitials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function TareaCard({
  tarea,
  puedeEditar,
  puedeCambiarEstado,
  onCambiarEstado,
  onEdit,
  onDelete,
  onVerHistorial,
}) {
  const vencida = estaVencida(tarea);
  const badge = ESTADO_BADGES[tarea.estado] || ESTADO_BADGES.pendiente;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: tarea.id,
    data: {
      type: "card",
      tarea,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || "transform 200ms ease, opacity 200ms ease",
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 1000 : "auto",
  };

  // Obtener la URL del avatar del asignado
  const avatarUrl = tarea.asignado_avatar_url || tarea.asignado_avatar;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        ${styles.card}
        ${tarea.estado === "hecho" ? styles.cardDone : ""}
        ${isDragging ? styles.cardDragging : ""}
      `}
      data-estado={tarea.estado}
      {...attributes}
      {...listeners}
    >
      <div className={styles.cardTop}>
        <div className={styles.dragHandle}>⋮⋮</div>
        <p className={styles.cardTitle}>{tarea.titulo}</p>
        {puedeEditar && (
          <div className={styles.cardActions}>
            <button
              onClick={() => onEdit(tarea)}
              className={styles.cardActionBtn}
              aria-label="Editar"
            >
              ✎
            </button>
            <button
              onClick={() => onDelete(tarea)}
              className={`${styles.cardActionBtn} ${styles.cardActionDanger}`}
              aria-label="Eliminar"
            >
              🗑
            </button>
          </div>
        )}
      </div>

      {tarea.descripcion && (
        <p className={styles.cardDesc}>{tarea.descripcion}</p>
      )}

      <div className={styles.cardMeta}>
        <span className={styles.cardAsignado}>
          {tarea.asignado_nombre ? (
            <>
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={tarea.asignado_nombre}
                  className={styles.avatarImg}
                  onError={(e) => {
                    // Si la imagen falla, mostrar iniciales
                    e.target.style.display = "none";
                    e.target.nextSibling.style.display = "flex";
                  }}
                />
              ) : null}
              <span 
                className={styles.avatar} 
                style={{ display: avatarUrl ? "none" : "flex" }}
              >
                {getInitials(tarea.asignado_nombre)}
              </span>
              {tarea.asignado_nombre}
            </>
          ) : (
            "Sin asignar"
          )}
        </span>
        {tarea.fecha_limite && (
          <span
            className={`${styles.cardFecha} ${vencida ? styles.cardFechaVencida : ""}`}
          >
            {vencida ? "⚠ " : ""}
            {formatDate(tarea.fecha_limite)}
          </span>
        )}
      </div>

      <div className={styles.cardFooter}>
        <span className={`${styles.estadoBadge} ${badge.className}`}>
          ● {badge.label}
        </span>
        <button
          className={styles.historialLink}
          onClick={() => onVerHistorial(tarea)}
        >
          Historial →
        </button>
      </div>
    </div>
  );
}