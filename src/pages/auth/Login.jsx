import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from './AuthLayout';
import Field from '../../components/ui/Field';
import Button from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import styles from './Auth.module.css';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/obras');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout>
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.heading}>
          <h2>Iniciar sesión</h2>
          <p>Entra para ver tus obras y gastos.</p>
        </div>

        {error && <div className={styles.alert} role="alert">{error}</div>}

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
          placeholder="••••••••"
          value={form.password}
          onChange={update('password')}
          required
          autoComplete="current-password"
        />

        <Button type="submit" fullWidth loading={loading}>Entrar</Button>

        <p className={styles.switch}>
          ¿No tienes cuenta? <Link to="/registro">Regístrate</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
