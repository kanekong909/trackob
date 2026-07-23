import { useState } from 'react';
import Modal from '../../components/ui/Modal';
import Field from '../../components/ui/Field';
import Button from '../../components/ui/Button';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import styles from './EquipoModal.module.css';

export default function EquipoModal({ open, onClose, obraId, colaboradores, onChanged }) {
  const { usuario } = useAuth();
  const toast = useToast();

  const [guardandoId, setGuardandoId] = useState(null);
  const [aQuitar, setAQuitar] = useState(null);
  const [quitando, setQuitando] = useState(false);

  const [email, setEmail] = useState('');
  const [rolInvitado, setRolInvitado] = useState('colaborador');
  const [invitando, setInvitando] = useState(false);
  const [errorInvitar, setErrorInvitar] = useState('');

  async function cambiarRol(colaborador, rol) {
    if (rol === colaborador.rol) return;
    setGuardandoId(colaborador.id);
    try {
      await api.put(`/api/obras/${obraId}/colaboradores/${colaborador.id}`, { rol });
      toast.success(`${colaborador.nombre} ahora es ${rol === 'admin' ? 'admin' : 'colaborador'}`);
      onChanged();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setGuardandoId(null);
    }
  }

  function pedirQuitar(colaborador) {
    setAQuitar(colaborador);
  }

  async function confirmarQuitar() {
    if (!aQuitar) return;
    setQuitando(true);
    try {
      await api.del(`/api/obras/${obraId}/colaboradores/${aQuitar.id}`);
      toast.success(`${aQuitar.nombre} fue removido de la obra`);
      setAQuitar(null);
      onChanged();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setQuitando(false);
    }
  }

  async function invitar(e) {
    e.preventDefault();
    setErrorInvitar('');
    if (!email.trim()) return;
    setInvitando(true);
    try {
      const r = await api.post('/api/auth/invitar', { email: email.trim(), obra_id: obraId, rol: rolInvitado });
      toast.success(`${r.usuario?.nombre || email} se agregó a la obra`);
      setEmail('');
      setRolInvitado('colaborador');
      onChanged();
    } catch (err) {
      setErrorInvitar(err.message);
    } finally {
      setInvitando(false);
    }
  }

  return (
    <>
      <Modal open={open} onClose={onClose} title="Gestionar equipo">
        <div className={styles.lista}>
          {colaboradores.map((c) => {
            const esYoMismo = Number(c.id) === Number(usuario?.id);
            return (
              <div key={c.id} className={styles.fila}>
                <span className={styles.avatar}>{c.nombre?.[0]?.toUpperCase()}</span>
                <div className={styles.info}>
                  <p className={styles.nombre}>{c.nombre}{esYoMismo && ' (tú)'}</p>
                  <p className={styles.email}>{c.email}</p>
                </div>
                <select
                  className={styles.rolSelect}
                  value={c.rol}
                  disabled={guardandoId === c.id}
                  onChange={(e) => cambiarRol(c, e.target.value)}
                >
                  <option value="colaborador">Colaborador</option>
                  <option value="admin">Admin</option>
                </select>
                <button
                  type="button"
                  className={styles.quitarBtn}
                  onClick={() => pedirQuitar(c)}
                  aria-label={`Quitar a ${c.nombre}`}
                >
                  🗑
                </button>
              </div>
            );
          })}
        </div>

        <form className={styles.invitarForm} onSubmit={invitar}>
          <p className={styles.invitarTitulo}>Agregar colaborador</p>
          {errorInvitar && <div className={styles.formError}>{errorInvitar}</div>}
          <div className={styles.invitarRow}>
            <Field
              type="email"
              placeholder="correo@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <select className={styles.rolSelect} value={rolInvitado} onChange={(e) => setRolInvitado(e.target.value)}>
              <option value="colaborador">Colaborador</option>
              <option value="admin">Admin</option>
            </select>
            <Button type="submit" loading={invitando} disabled={!email.trim()}>Agregar</Button>
          </div>
          <p className={styles.invitarHint}>La persona ya debe tener una cuenta creada en TrackOb.</p>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(aQuitar)}
        onClose={() => setAQuitar(null)}
        onConfirm={confirmarQuitar}
        title="Quitar del equipo"
        message={`¿Quitar a "${aQuitar?.nombre}" de esta obra? Deja de tener acceso a todo lo de esta obra.`}
        confirmLabel="Quitar"
        danger
        loading={quitando}
      />
    </>
  );
}