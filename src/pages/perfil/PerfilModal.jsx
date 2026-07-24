import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from '../../components/ui/Modal';
import Field from '../../components/ui/Field';
import PasswordField from '../../components/ui/PasswordField';
import Button from '../../components/ui/Button';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { cloudinaryThumb } from '../../utils/format';
import styles from './PerfilModal.module.css';

export default function PerfilModal({ open, onClose }) {
  const { usuario, setUsuario, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const fileRef = useRef(null);

  const [nombre, setNombre] = useState('');
  const [fotoUrl, setFotoUrl] = useState(null);
  const [guardandoNombre, setGuardandoNombre] = useState(false);
  const [subiendoFoto, setSubiendoFoto] = useState(false);

  const [passActual, setPassActual] = useState('');
  const [passNueva, setPassNueva] = useState('');
  const [passConfirmar, setPassConfirmar] = useState('');
  const [errorPass, setErrorPass] = useState('');
  const [guardandoPass, setGuardandoPass] = useState(false);

  const [logoUrl, setLogoUrl] = useState(null);
  const [subiendoLogo, setSubiendoLogo] = useState(false);
  const logoFileRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    api.get('/api/auth/perfil').then((p) => {
      setNombre(p.nombre || '');
      setFotoUrl(p.fondo_url || null);
      setLogoUrl(p.logo_empresa_url || null);
    }).catch(() => {});
    setPassActual(''); setPassNueva(''); setPassConfirmar(''); setErrorPass('');
  }, [open]);

  const nombreCambiado = nombre.trim() && nombre.trim() !== usuario?.nombre;

  async function guardarNombre() {
    if (!nombre.trim()) return;
    setGuardandoNombre(true);
    try {
      await api.put('/api/auth/perfil', { nombre: nombre.trim() });
      setUsuario((u) => ({ ...u, nombre: nombre.trim() }));
      toast.success('Nombre actualizado');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setGuardandoNombre(false);
    }
  }

  async function subirFoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSubiendoFoto(true);
    try {
      const fd = new FormData();
      fd.append('foto', file);
      const { url } = await api.post('/api/auth/fondo-upload', fd, { isForm: true });
      setFotoUrl(url);
      setUsuario((u) => ({ ...u, fondo_url: url }));
      toast.success('Foto de perfil actualizada');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubiendoFoto(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function quitarFoto() {
    setSubiendoFoto(true);
    try {
      await api.put('/api/auth/fondo', { fondo_url: null });
      setFotoUrl(null);
      setUsuario((u) => ({ ...u, fondo_url: null }));
      toast.success('Foto de perfil eliminada');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubiendoFoto(false);
    }
  }

  async function subirLogo(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSubiendoLogo(true);
    try {
      const fd = new FormData();
      fd.append('foto', file);
      const { url } = await api.post('/api/auth/logo-empresa-upload', fd, { isForm: true });
      setLogoUrl(url);
      setUsuario((u) => ({ ...u, logo_empresa_url: url }));
      toast.success('Logo actualizado');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubiendoLogo(false);
      if (logoFileRef.current) logoFileRef.current.value = '';
    }
  }

  async function quitarLogo() {
    setSubiendoLogo(true);
    try {
      await api.put('/api/auth/logo-empresa', { logo_url: null });
      setLogoUrl(null);
      setUsuario((u) => ({ ...u, logo_empresa_url: null }));
      toast.success('Logo eliminado');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubiendoLogo(false);
    }
  }

  async function cambiarPassword(e) {
    e.preventDefault();
    setErrorPass('');
    if (passNueva.length < 6) {
      setErrorPass('La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (passNueva !== passConfirmar) {
      setErrorPass('Las contraseñas nuevas no coinciden');
      return;
    }
    setGuardandoPass(true);
    try {
      await api.put('/api/auth/password', { password_actual: passActual, password_nueva: passNueva });
      toast.success('Contraseña actualizada');
      setPassActual(''); setPassNueva(''); setPassConfirmar('');
    } catch (err) {
      setErrorPass(err.message);
    } finally {
      setGuardandoPass(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Mi perfil">
      <div className={styles.wrap}>

        <section className={styles.section}>
          <h4 className={styles.sectionTitle}>Datos básicos</h4>
          <Field label="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} />
          <div className={styles.readonlyRow}>
            <span>{usuario?.email}</span>
            <span className={styles.rolBadge}>{usuario?.rol}</span>
          </div>
          {nombreCambiado && (
            <Button onClick={guardarNombre} loading={guardandoNombre} size="sm">Guardar nombre</Button>
          )}
        </section>

        <section className={styles.section}>
          <h4 className={styles.sectionTitle}>Foto de perfil</h4>
          <div className={styles.fotoRow}>
            {fotoUrl ? (
              <img src={cloudinaryThumb(fotoUrl, 200)} alt="Foto de perfil" className={styles.avatarPreview} />
            ) : (
              <div className={styles.avatarVacio}>{usuario?.nombre?.[0]?.toUpperCase()}</div>
            )}
            <div className={styles.fotoAcciones}>
              <label className={styles.uploadBtn}>
                {subiendoFoto ? 'Subiendo…' : (fotoUrl ? 'Cambiar foto' : 'Subir foto')}
                <input ref={fileRef} type="file" accept="image/*" onChange={subirFoto} disabled={subiendoFoto} hidden />
              </label>
              {fotoUrl && (
                <button type="button" className={styles.quitarBtn} onClick={quitarFoto} disabled={subiendoFoto}>
                  Quitar
                </button>
              )}
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h4 className={styles.sectionTitle}>Logo de empresa</h4>
          <p className={styles.hint}>
            Si administras obras, este logo se muestra a todo tu equipo dentro de cada obra que creaste — útil si varias empresas usan la app.
          </p>
          <div className={styles.fotoRow}>
            {logoUrl ? (
              <img src={cloudinaryThumb(logoUrl, 200)} alt="Logo de empresa" className={styles.logoPreview} />
            ) : (
              <div className={styles.logoVacio}>Sin logo</div>
            )}
            <div className={styles.fotoAcciones}>
              <label className={styles.uploadBtn}>
                {subiendoLogo ? 'Subiendo…' : (logoUrl ? 'Cambiar logo' : 'Subir logo')}
                <input ref={logoFileRef} type="file" accept="image/*" onChange={subirLogo} disabled={subiendoLogo} hidden />
              </label>
              {logoUrl && (
                <button type="button" className={styles.quitarBtn} onClick={quitarLogo} disabled={subiendoLogo}>
                  Quitar
                </button>
              )}
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h4 className={styles.sectionTitle}>Cambiar contraseña</h4>
          <form className={styles.passForm} onSubmit={cambiarPassword}>
            {errorPass && <div className={styles.formError}>{errorPass}</div>}
            <PasswordField
              label="Contraseña actual"
              value={passActual}
              onChange={(e) => setPassActual(e.target.value)}
              autoComplete="current-password"
              required
            />
            <PasswordField
              label="Contraseña nueva"
              placeholder="Mínimo 6 caracteres"
              value={passNueva}
              onChange={(e) => setPassNueva(e.target.value)}
              autoComplete="new-password"
              required
            />
            <PasswordField
              label="Confirmar contraseña nueva"
              value={passConfirmar}
              onChange={(e) => setPassConfirmar(e.target.value)}
              autoComplete="new-password"
              required
            />
            <Button type="submit" loading={guardandoPass}>Actualizar contraseña</Button>
          </form>
        </section>

        <section className={styles.section}>
          <Button
            variant="outline"
            fullWidth
            onClick={() => { onClose(); navigate('/planes'); }}
          >
            Ver planes y facturación
          </Button>
        </section>

        {usuario?.rol === 'superadmin' && (
          <section className={styles.section}>
            <Button
              variant="outline"
              fullWidth
              onClick={() => { onClose(); navigate('/superadmin'); }}
            >
              Panel de superadmin
            </Button>
          </section>
        )}

        <section className={styles.section}>
          <Button
            variant="outline"
            fullWidth
            onClick={() => { onClose(); logout(); }}
          >
            Cerrar sesión
          </Button>
        </section>

      </div>
    </Modal>
  );
}
