import { useState } from 'react';
import fieldStyles from './Field.module.css';
import styles from './PasswordField.module.css';
import { Eye, EyeOff } from "lucide-react";

export default function PasswordField({ label, error, hint, ...rest }) {
  const [visible, setVisible] = useState(false);

  return (
    <label className={fieldStyles.field}>
      {label && <span className={fieldStyles.label}>{label}</span>}
      <div className={styles.inputWrap}>
        <input
          type={visible ? 'text' : 'password'}
          className={`${fieldStyles.input} ${styles.input} ${error ? fieldStyles.invalid : ''}`}
          {...rest}
        />
        <button
          type="button"
          className={styles.toggle}
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          tabIndex={-1}
        >
          {visible ? <EyeOff size={18}/> : <Eye size={18}/>}
        </button>
      </div>
      {hint && !error && <span className={fieldStyles.hint}>{hint}</span>}
      {error && <span className={fieldStyles.error}>{error}</span>}
    </label>
  );
}
