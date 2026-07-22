// TareaColumn.jsx
import { useDroppable } from "@dnd-kit/core";
import styles from "./Tareas.module.css";
import { 
  SortableContext, 
  verticalListSortingStrategy,
  arrayMove 
} from "@dnd-kit/sortable";

export default function TareaColumn({
  estado,
  titulo,
  count,
  items,
  children
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: estado,
    data: {
      type: 'column',
      estado
    }
  });

  return (
    <section
      ref={setNodeRef}
      className={`${styles.column} ${isOver ? styles.columnOver : ""}`}
      data-column={estado}
    >
      <h4 className={styles.columnTitle}>
        {titulo}
        <span className={styles.count}>{count}</span>
      </h4>

      <SortableContext
        items={items}
        strategy={verticalListSortingStrategy}
      >
        <div className={styles.columnList}>
          {children}
        </div>
      </SortableContext>
    </section>
  );
}