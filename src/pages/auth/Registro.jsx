import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from './AuthLayout';
import Field from '../../components/ui/Field';
import Button from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import styles from './Auth.module.css';

export default function Registro() {
  const { registro } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ nombre: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    setLoading(true);
    try {
      await registro(form.nombre, form.email, form.password);
      navigate('/obras');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout tagline="Empieza a llevar tus obras al día.">
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.heading}>
          <h2>Crear cuenta</h2>
          <p>Tu cuenta queda como administradora de tus obras.</p>
        </div>

        {error && <div className={styles.alert} role="alert">{error}</div>}

        <Field
          label="Nombre"
          placeholder="Tu nombre completo"
          value={form.nombre}
          onChange={update('nombre')}
          required
          autoComplete="name"
        />
        <Field
          label="Correo"
          type="email"
          placeholder="tu@correo.com"
          value={form.email}
          onChange={update('email')}
          required
          autoComplete="email"
        />
        <Field
          label="Contraseña"
          type="password"
          placeholder="Mínimo 6 caracteres"
          value={form.password}
          onChange={update('password')}
          required
          autoComplete="new-password"
        />

        <Button type="submit" fullWidth loading={loading}>Crear cuenta</Button>

        <p className={styles.switch}>
          ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
