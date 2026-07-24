import { useState, useRef, useEffect } from 'react';
import Modal from '../../components/ui/Modal';
import Field from '../../components/ui/Field';
import Button from '../../components/ui/Button';
import CategoriaChip from '../../components/ui/CategoriaChip';
import { api } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { formatCurrency, formatMiles, formatQty, parseMiles } from '../../utils/format';
import styles from './Gastos.module.css';
import { Paperclip } from "lucide-react";

const hoy = () => new Date().toISOString().split('T')[0];

export default function GastoModal({ open, onClose, obraId, categorias, gasto, onSaved, moneda = 'COP' }) {
  const editando = Boolean(gasto);
  const fileRef = useRef(null);
  const toast = useToast();

  const [form, setForm] = useState(() => ({
    descripcion: gasto?.descripcion || '',
    monto: formatQty(gasto?.monto) ?? '',
    fecha: gasto?.fecha ? gasto.fecha.split('T')[0] : hoy(),
    proveedor: gasto?.proveedor || '',
    notas: gasto?.notas || '',
    categorias: gasto?.categorias?.map((c) => c.id) || [],
    cantidad: formatQty(gasto?.cantidad) ?? '',
    unidad: gasto?.unidad || '',
    valor_unitario: formatQty(gasto?.valor_unitario) ?? ''
  }));
  const [foto, setFoto] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(gasto?.foto_url || null);
  const [borrarFoto, setBorrarFoto] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // The modal component stays mounted while hidden, so re-sync the form
  // every time it opens (or the gasto being edited changes) instead of
  // only on first mount - otherwise editing always showed a blank form.
  useEffect(() => {
    if (!open) return;
    setForm({
      descripcion: gasto?.descripcion || '',
      monto: formatQty(gasto?.monto) ?? '',
      fecha: gasto?.fecha ? gasto.fecha.split('T')[0] : hoy(),
      proveedor: gasto?.proveedor || '',
      notas: gasto?.notas || '',
      categorias: gasto?.categorias?.map((c) => c.id) || [],
      cantidad: formatQty(gasto?.cantidad) ?? '',
      unidad: gasto?.unidad || '',
      valor_unitario: formatQty(gasto?.valor_unitario) ?? ''
    });
    setFoto(null);
    setFotoPreview(gasto?.foto_url || null);
    setBorrarFoto(false);
    setError('');
  }, [open, gasto]);

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  // For plain currency fields (monto): strips everything but digits so the
  // raw value stays a clean number string, while the input displays it
  // formatted with thousand separators (e.g. "50.000").
  function updateMiles(field) {
    return (e) => setForm((f) => ({ ...f, [field]: parseMiles(e.target.value) }));
  }

  // Auto-fills monto = cantidad × valor_unitario whenever both are present.
  // The person can still type over monto by hand afterward - this only
  // pre-fills it as a convenience, it doesn't lock the field.
  function updateCalculado(field) {
    return (e) => {
      const rawValue = field === 'valor_unitario' ? parseMiles(e.target.value) : e.target.value;
      setForm((f) => {
        const next = { ...f, [field]: rawValue };
        const cantidad = parseFloat(field === 'cantidad' ? rawValue : next.cantidad);
        const valorUnitario = parseFloat(field === 'valor_unitario' ? rawValue : next.valor_unitario);
        if (cantidad > 0 && valorUnitario > 0) {
          next.monto = String(Math.round(cantidad * valorUnitario));
        }
        return next;
      });
    };
  }

  function toggleCategoria(id) {
    setForm((f) => ({
      ...f,
      categorias: f.categorias.includes(id)
        ? f.categorias.filter((c) => c !== id)
        : [...f.categorias, id]
    }));
  }

  function handleFotoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFoto(file);
    setBorrarFoto(false);
    setFotoPreview(URL.createObjectURL(file));
  }

  function quitarFoto() {
    setFoto(null);
    setFotoPreview(null);
    setBorrarFoto(true);
    if (fileRef.current) fileRef.current.value = '';
  }

  function resetAndClose() {
    setForm({ descripcion: '', monto: '', fecha: hoy(), proveedor: '', notas: '', categorias: [], cantidad: '', unidad: '', valor_unitario: '' });
    setFoto(null);
    setFotoPreview(null);
    setBorrarFoto(false);
    setError('');
    onClose();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!form.descripcion.trim() || !form.monto || !form.fecha) {
      setError('Descripción, monto y fecha son requeridos');
      return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('descripcion', form.descripcion.trim());
      fd.append('monto', form.monto);
      fd.append('fecha', form.fecha);
      fd.append('obra_id', obraId);
      fd.append('proveedor', form.proveedor.trim());
      fd.append('notas', form.notas.trim());
      fd.append('categorias', JSON.stringify(form.categorias));
      if (form.cantidad) fd.append('cantidad', form.cantidad);
      if (form.unidad) fd.append('unidad', form.unidad);
      if (form.valor_unitario) fd.append('valor_unitario', form.valor_unitario);
      if (foto) fd.append('foto', foto);
      if (editando && borrarFoto) fd.append('borrar_foto', '1');

      const saved = editando
        ? await api.put(`/api/gastos/${gasto.id}`, fd, { isForm: true })
        : await api.post('/api/gastos', fd, { isForm: true });

      onSaved(saved);
      resetAndClose();
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={resetAndClose} title={editando ? 'Editar gasto' : 'Nuevo gasto'}>
      <form className={styles.formModal} onSubmit={handleSubmit}>
        {error && <div className={styles.formError}>{error}</div>}

        <Field
          label="Descripción"
          placeholder="Ej. Bloques de concreto"
          value={form.descripcion}
          onChange={update('descripcion')}
          required
          autoFocus
        />

        <div className={styles.row2}>
          <Field
            label={`Monto (${moneda})`}
            type="text"
            inputMode="numeric"
            placeholder="0"
            value={formatMiles(form.monto)}
            onChange={updateMiles('monto')}
            required
          />
          <Field
            label="Fecha"
            type="date"
            value={form.fecha}
            onChange={update('fecha')}
            required
          />
        </div>

        {categorias?.length > 0 && (
          <div className={styles.fieldGroup}>
            <span className={styles.groupLabel}>Categorías</span>
            <div className={styles.chipRow}>
              {categorias.map((cat) => (
                <CategoriaChip
                  key={cat.id}
                  categoria={cat}
                  selected={form.categorias.includes(cat.id)}
                  onToggle={toggleCategoria}
                />
              ))}
            </div>
          </div>
        )}

        <div className={styles.fieldGroup}>
          <span className={styles.groupLabel}>
            Cantidad y valor unitario <span className={styles.optionalTag}>(opcional)</span>
          </span>
          <div className={styles.row3}>
            <Field
              type="number"
              min="0"
              step="any"
              placeholder="Cantidad"
              value={form.cantidad}
              onChange={updateCalculado('cantidad')}
            />
            <Field
              as="select"
              value={form.unidad}
              onChange={update('unidad')}
            >
              <option value="">Unidad</option>
              <option value="und">und</option>
              <option value="kg">kg</option>
              <option value="lb">lb</option>
              <option value="m">m</option>
              <option value="m2">m²</option>
              <option value="m3">m³</option>
              <option value="litro">litro</option>
              <option value="galón">galón</option>
              <option value="bulto">bulto</option>
              <option value="saco">saco</option>
              <option value="viaje">viaje</option>
              <option value="día">día</option>
              <option value="hora">hora</option>
              <option value="caja">caja</option>
            </Field>
            <Field
              type="text"
              inputMode="numeric"
              placeholder="Valor c/u"
              value={formatMiles(form.valor_unitario)}
              onChange={updateCalculado('valor_unitario')}
            />
          </div>
          {form.cantidad > 0 && form.valor_unitario > 0 && (
            <p className={styles.calcHint}>
              {form.cantidad} × {formatCurrency(form.valor_unitario, moneda)} = <strong>{formatCurrency(form.cantidad * form.valor_unitario, moneda)}</strong> (se rellenó el monto, puedes ajustarlo)
            </p>
          )}
        </div>

        <Field
          label="Proveedor"
          placeholder="Opcional"
          value={form.proveedor}
          onChange={update('proveedor')}
        />

        <div className={styles.fieldGroup}>
          <span className={styles.groupLabel}>Foto del comprobante</span>
          {fotoPreview ? (
            <div className={styles.fotoPreview}>
              <img src={fotoPreview} alt="Comprobante" />
              <button type="button" className={styles.fotoRemove} onClick={quitarFoto}>Quitar foto</button>
            </div>
          ) : (
            <label className={styles.fotoUpload}>
              <Paperclip size={18}/>
               Adjuntar foto o PDF
              <input ref={fileRef} type="file" accept="image/*,application/pdf" onChange={handleFotoChange} hidden />
            </label>
          )}
        </div>

        <Field
          as="textarea"
          label="Notas"
          placeholder="Opcional"
          value={form.notas}
          onChange={update('notas')}
        />

        <Button type="submit" fullWidth loading={loading}>
          {editando ? 'Guardar cambios' : 'Registrar gasto'}
        </Button>
      </form>
    </Modal>
  );
}
