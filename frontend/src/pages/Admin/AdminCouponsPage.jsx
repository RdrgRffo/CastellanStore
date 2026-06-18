import { useState, useEffect, useCallback, useMemo } from 'react';
import { fetchAdminCoupons, createAdminCoupon, updateAdminCoupon, deleteAdminCoupon } from '../../services/api';
import AdminTable from '../../components/ui/AdminTable';
import AdminModal from '../../components/ui/AdminModal';
import { FormValidator, Validator } from '../../utils/FormValidator';

const COUPON_TYPES = [
  { value: 'percentage', label: 'Porcentaje' },
  { value: 'fixed', label: 'Monto fijo' },
];

const emptyForm = {
  code: '',
  type: 'percentage',
  discount: '',
  minAmount: '',
  maxUses: '',
  expiresAt: '',
};

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  // Estado del modal de detalle
  const [selectedCoupon, setSelectedCoupon] = useState(null);

  const validator = useMemo(() => {
    const v = new FormValidator()
      .field('code', [
        Validator.required('El código es obligatorio'),
        Validator.minLength(3, 'Mínimo 3 caracteres'),
        Validator.maxLength(20, 'Máximo 20 caracteres'),
        Validator.pattern(/^[A-Za-z0-9_-]+$/, 'Solo letras, números, guiones y guiones bajos'),
      ])
      .field('discount', [
        Validator.required('El descuento es obligatorio'),
        Validator.min(0.01, 'El descuento debe ser mayor que 0'),
        Validator.custom((v) => !isNaN(Number(v)), 'Introduce un descuento válido'),
      ])
      .field('minAmount', [
        Validator.custom((v) => !v || !isNaN(Number(v)), 'Introduce un monto válido'),
        Validator.min(0, 'El monto mínimo no puede ser negativo'),
      ])
      .field('maxUses', [
        Validator.custom((v) => !v || !isNaN(Number(v)), 'Introduce un número válido'),
        Validator.min(0, 'Los usos no pueden ser negativos'),
      ]);
    return v;
  }, []);

  const loadCoupons = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await fetchAdminCoupons(search, page, 20);
      setCoupons(result.coupons || []);
      setTotalPages(result.totalPages || 0);
      setTotalItems(result.total || 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadCoupons();
  }, [loadCoupons]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(0);
    loadCoupons();
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
    validator.reset();
  };

  const openEdit = (coupon) => {
    setForm({
      code: coupon.code,
      type: coupon.type,
      discount: coupon.discount,
      minAmount: coupon.minAmount || '',
      maxUses: coupon.maxUses || '',
      expiresAt: coupon.expiresAt ? coupon.expiresAt.slice(0, 10) : '',
    });
    setEditingId(coupon._id);
    setShowForm(true);
    validator.reset();
  };

  const handleChange = (field, value) => {
    const updated = { ...form, [field]: value };
    setForm(updated);
    validator.validateField(field, value, updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validator.validateAll(form)) return;
    setSaving(true);
    setError('');
    setSuccessMsg('');
    try {
      const payload = {
        code: form.code,
        type: form.type,
        discount: Number(form.discount),
        minAmount: form.minAmount ? Number(form.minAmount) : 0,
        maxUses: form.maxUses ? Number(form.maxUses) : null,
        expiresAt: form.expiresAt || null,
      };
      if (editingId) {
        await updateAdminCoupon(editingId, payload);
        setSuccessMsg('Cupón actualizado correctamente');
      } else {
        await createAdminCoupon(payload);
        setSuccessMsg('Cupón creado correctamente');
      }
      resetForm();
      loadCoupons();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este cupón?')) return;
    setError('');
    setSuccessMsg('');
    try {
      await deleteAdminCoupon(id);
      setSuccessMsg('Cupón eliminado correctamente');
      loadCoupons();
    } catch (err) {
      setError(err.message);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('es-ES');
  };

  const renderError = (field) => {
    const err = validator.error(field);
    if (!err) return null;
    return (
      <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
        <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        {err}
      </p>
    );
  };

  const columns = [
    { key: 'code', label: 'Código', sortable: true },
    { key: 'type', label: 'Tipo', sortable: true },
    { key: 'discount', label: 'Descuento', sortable: true, align: 'right' },
    { key: 'minAmount', label: 'Mínimo', sortable: true, align: 'right' },
    { key: 'expiresAt', label: 'Expira', sortable: true, align: 'center' },
    { key: 'active', label: 'Activo', sortable: true, align: 'center' },
    { key: 'actions', label: 'Acciones', align: 'center' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-display uppercase tracking-wider">Cupones</h1>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="btn-primary text-xs"
        >
          + Nuevo cupón
        </button>
      </div>

      {/* Búsqueda */}
      <form onSubmit={handleSearch} className="flex gap-3 mb-6">
        <input
          type="text"
          placeholder="Buscar por código..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-premium flex-1"
        />
        <button type="submit" className="btn-primary text-xs">Buscar</button>
        {search && (
          <button
            type="button"
            onClick={() => { setSearch(''); setPage(0); }}
            className="btn-secondary text-xs"
          >
            Limpiar
          </button>
        )}
      </form>

      {/* Mensajes */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-xs p-3 mb-4">{error}</div>
      )}
      {successMsg && (
        <div className="bg-green-50 border border-green-200 text-green-600 text-xs p-3 mb-4">{successMsg}</div>
      )}

      {/* Formulario de creación/edición */}
      {showForm && (
        <div className="bg-white border border-gray-200 p-6 mb-6">
          <h2 className="text-sm uppercase tracking-wider font-medium text-premium-black mb-4">
            {editingId ? 'Editar cupón' : 'Nuevo cupón'}
          </h2>
          <form onSubmit={handleSubmit} noValidate className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-premium-gray-dark mb-1">Código *</label>
              <input
                type="text"
                value={form.code}
                onChange={(e) => handleChange('code', e.target.value)}
                className={validator.inputClass('code') + ' w-full'}
                placeholder="Ej: VERANO20"
                disabled={!!editingId}
              />
              {renderError('code')}
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-premium-gray-dark mb-1">Tipo *</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="input-premium w-full"
              >
                {COUPON_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-premium-gray-dark mb-1">Descuento *</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.discount}
                onChange={(e) => handleChange('discount', e.target.value)}
                className={validator.inputClass('discount') + ' w-full'}
                placeholder={form.type === 'percentage' ? 'Ej: 15' : 'Ej: 10'}
              />
              {renderError('discount')}
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-premium-gray-dark mb-1">Monto mínimo</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.minAmount}
                onChange={(e) => handleChange('minAmount', e.target.value)}
                className={validator.inputClass('minAmount') + ' w-full'}
                placeholder="0 = sin mínimo"
              />
              {renderError('minAmount')}
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-premium-gray-dark mb-1">Usos máximos</label>
              <input
                type="number"
                min="0"
                value={form.maxUses}
                onChange={(e) => handleChange('maxUses', e.target.value)}
                className={validator.inputClass('maxUses') + ' w-full'}
                placeholder="Vacío = ilimitado"
              />
              {renderError('maxUses')}
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-premium-gray-dark mb-1">Fecha de expiración</label>
              <input
                type="date"
                value={form.expiresAt}
                onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                className="input-premium w-full"
              />
            </div>
            <div className="sm:col-span-2 lg:col-span-3 flex gap-3 pt-2">
              <button type="submit" disabled={saving} className="btn-primary text-xs">
                {saving ? 'Guardando...' : editingId ? 'Actualizar cupón' : 'Crear cupón'}
              </button>
              <button type="button" onClick={resetForm} className="btn-secondary text-xs">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tabla */}
      <AdminTable
        columns={columns}
        data={coupons}
        loading={loading}
        emptyMessage="No se encontraron cupones"
        totalItems={totalItems}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        onRowClick={(coupon) => setSelectedCoupon(coupon)}
      >
        {(sortedData) => sortedData.map((coupon) => (
          <tr key={coupon._id} className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer">
            <td className="px-5 py-4 font-mono font-medium text-premium-black">{coupon.code}</td>
            <td className="px-5 py-4 text-premium-gray-dark capitalize">
              {coupon.type === 'percentage' ? 'Porcentaje' : 'Monto fijo'}
            </td>
            <td className="px-5 py-4 text-right">
              {coupon.type === 'percentage' ? `${coupon.discount}%` : `${coupon.discount} €`}
            </td>
            <td className="px-5 py-4 text-right">{coupon.minAmount ? `${coupon.minAmount} €` : '—'}</td>
            <td className="px-5 py-4 text-center text-premium-gray-dark">{formatDate(coupon.expiresAt)}</td>
            <td className="px-5 py-4 text-center">
              <span className={`inline-block px-2 py-0.5 text-xs rounded-full ${
                coupon.active ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              }`}>
                {coupon.active ? 'Sí' : 'No'}
              </span>
            </td>
            <td className="px-5 py-4 text-center">
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); openEdit(coupon); }}
                  className="px-3 py-1.5 text-xs font-medium rounded bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors uppercase tracking-wider"
                >
                  Editar
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(coupon._id); }}
                  className="px-3 py-1.5 text-xs font-medium rounded bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors uppercase tracking-wider"
                >
                  Eliminar
                </button>
              </div>
            </td>
          </tr>
        ))}
      </AdminTable>

      {/* Modal de detalle de cupón */}
      <AdminModal
        isOpen={!!selectedCoupon}
        onClose={() => setSelectedCoupon(null)}
        title={`Cupón: ${selectedCoupon?.code || ''}`}
        badge={{
          label: selectedCoupon?.active ? 'Activo' : 'Inactivo',
          className: selectedCoupon?.active ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700',
        }}
      >
        {selectedCoupon && (
          <>
            {/* Información del cupón */}
            <div>
              <h3 className="text-xs uppercase tracking-wider font-medium text-premium-gray-dark mb-3">Información del Cupón</h3>
              <div className="bg-gray-50 p-4 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-premium-gray-dark text-xs">Código</span>
                  <p className="font-medium font-mono">{selectedCoupon.code}</p>
                </div>
                <div>
                  <span className="text-premium-gray-dark text-xs">Tipo</span>
                  <p className="font-medium capitalize">{selectedCoupon.type === 'percentage' ? 'Porcentaje' : 'Monto fijo'}</p>
                </div>
                <div>
                  <span className="text-premium-gray-dark text-xs">Descuento</span>
                  <p className="font-medium">
                    {selectedCoupon.type === 'percentage' ? `${selectedCoupon.discount}%` : `${selectedCoupon.discount} €`}
                  </p>
                </div>
                <div>
                  <span className="text-premium-gray-dark text-xs">Monto mínimo</span>
                  <p className="font-medium">{selectedCoupon.minAmount ? `${selectedCoupon.minAmount} €` : 'Sin mínimo'}</p>
                </div>
                <div>
                  <span className="text-premium-gray-dark text-xs">Usos máximos</span>
                  <p className="font-medium">{selectedCoupon.maxUses || 'Ilimitados'}</p>
                </div>
                <div>
                  <span className="text-premium-gray-dark text-xs">Usos actuales</span>
                  <p className="font-medium">{selectedCoupon.usedCount || 0}</p>
                </div>
                <div>
                  <span className="text-premium-gray-dark text-xs">Fecha de expiración</span>
                  <p className="font-medium">{formatDate(selectedCoupon.expiresAt) || 'Sin expiración'}</p>
                </div>
                <div>
                  <span className="text-premium-gray-dark text-xs">Estado</span>
                  <p className={`font-medium ${selectedCoupon.active ? 'text-green-600' : 'text-red-600'}`}>
                    {selectedCoupon.active ? 'Activo' : 'Inactivo'}
                  </p>
                </div>
              </div>
            </div>

            {/* ID */}
            <div className="text-xs text-premium-gray-dark text-right">
              ID: {selectedCoupon._id}
            </div>
          </>
        )}
      </AdminModal>
    </div>
  );
}
