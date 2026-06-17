import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useWishlist } from '../../hooks/useWishlist';
import { fetchProfile, updateProfile, fetchAddresses, createAddress, updateAddress, deleteAddress, setDefaultAddress } from '../../services/api';
import { getImageUrl } from '../../services/apiClient';
import PriceTag from '../../components/ui/PriceTag';


export default function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [birthDate, setBirthDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Direcciones
  const [addresses, setAddresses] = useState([]);
  const [addressesLoading, setAddressesLoading] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [addressForm, setAddressForm] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    country: 'España',
    phone: '',
    isDefault: false,
  });
  const [savingAddress, setSavingAddress] = useState(false);
  const [addressMessage, setAddressMessage] = useState('');

  // Lista de deseos
  const { wishlist, loading: wishlistLoading, removeFromWishlist } = useWishlist();
  const [wishlistPage, setWishlistPage] = useState(0);
  const WISHLIST_PAGE_SIZE = 4;
  const totalWishlistPages = Math.max(1, Math.ceil(wishlist.length / WISHLIST_PAGE_SIZE));
  const paginatedWishlist = wishlist.slice(
    wishlistPage * WISHLIST_PAGE_SIZE,
    (wishlistPage + 1) * WISHLIST_PAGE_SIZE
  );

  useEffect(() => {
    if (!user) return;
    fetchProfile()
      .then(data => {
        setProfile(data);
        if (data.birthDate) {
          setBirthDate(new Date(data.birthDate).toISOString().split('T')[0]);
        }
      })
      .catch(() => {
        setProfile(user);
      })
      .finally(() => setLoading(false));

    // Cargar direcciones
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAddressesLoading(true);
    fetchAddresses()
      .then(data => setAddresses(data || []))
      .catch(() => {})
      .finally(() => setAddressesLoading(false));
  }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const result = await updateProfile(birthDate);
      setMessage('Perfil actualizado correctamente');
      if (result) setProfile(prev => ({ ...prev, ...result }));
    } catch (err) {
      setError(err.message || 'Error al actualizar el perfil');
    } finally {
      setSaving(false);
    }
  };

  // Direcciones
  const resetAddressForm = () => {
    setAddressForm({
      name: '',
      address: '',
      city: '',
      state: '',
      zip: '',
      country: 'España',
      phone: '',
      isDefault: false,
    });
    setEditingAddress(null);
    setShowAddressForm(false);
  };

  const handleEditAddress = (addr) => {
    setAddressForm({
      name: addr.name,
      address: addr.address,
      city: addr.city,
      state: addr.state,
      zip: addr.zip,
      country: addr.country,
      phone: addr.phone || '',
      isDefault: addr.isDefault,
    });
    setEditingAddress(addr._id);
    setShowAddressForm(true);
    setAddressMessage('');
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    setSavingAddress(true);
    setAddressMessage('');
    try {
      if (editingAddress) {
        const updated = await updateAddress(editingAddress, addressForm);
        setAddresses(prev => prev.map(a => a._id === editingAddress ? updated : a));
        setAddressMessage('Dirección actualizada correctamente');
      } else {
        const created = await createAddress(addressForm);
        setAddresses(prev => [...prev, created]);
        setAddressMessage('Dirección guardada correctamente');
      }
      resetAddressForm();
    } catch (err) {
      setAddressMessage(err.message || 'Error al guardar la dirección');
    } finally {
      setSavingAddress(false);
    }
  };

  const handleDeleteAddress = async (id) => {
    if (!window.confirm('¿Eliminar esta dirección?')) return;
    try {
      await deleteAddress(id);
      setAddresses(prev => prev.filter(a => a._id !== id));
    } catch (err) {
      setAddressMessage(err.message || 'Error al eliminar la dirección');
    }
  };

  const handleSetDefault = async (id) => {
    try {
      await setDefaultAddress(id);
      setAddresses(prev => prev.map(a => ({
        ...a,
        isDefault: a._id === id,
      })));
    } catch (err) {
      setAddressMessage(err.message || 'Error al establecer dirección predeterminada');
    }
  };

  if (!user) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <h1 className="text-2xl font-display text-premium-black mb-4">Inicia sesión para ver tu perfil</h1>
        <Link to="/auth" className="btn-cuero inline-block">
          Iniciar Sesión
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container-premium py-12 text-center">
        <div className="animate-spin w-8 h-8 border-2 border-cuero-500 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-premium-gray-dark">Cargando perfil...</p>
      </div>
    );
  }

  const displayUser = profile || user;

  return (
    <div className="container-premium py-12">
      <h1 className="text-3xl font-display text-premium-black mb-8">Mi Perfil</h1>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-8">
        {/* Columna izquierda: info, fecha, direcciones */}
        <div className="space-y-6">
          {/* Tarjeta de información principal */}
          <div className="border border-premium-gray p-6">
            <div className="flex items-center gap-4 mb-6">
              {displayUser.picture ? (
                <img src={displayUser.picture} alt="" className="w-16 h-16 rounded-full object-cover" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-premium-gray-light flex items-center justify-center">
                  <svg className="w-8 h-8 text-premium-gray-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              )}
              <div>
                <p className="text-lg font-display text-premium-black">{displayUser.name || 'Usuario'}</p>
                <p className="text-xs text-premium-gray-dark">{displayUser.email}</p>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-premium-gray">
                <span className="text-premium-gray-dark">Rol</span>
                <span className="text-premium-black font-medium">
                  {displayUser.role === 'ROLE_MANAGER' ? 'Administrador' : 'Cliente'}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-premium-gray">
                <span className="text-premium-gray-dark">Registrado con</span>
                <span className="text-premium-black font-medium">
                  {displayUser.provider === 'GOOGLE' ? 'Google' : 'Email'}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-premium-gray">
                <span className="text-premium-gray-dark">Miembro desde</span>
                <span className="text-premium-black font-medium">
                  {displayUser.createdAt
                    ? new Date(displayUser.createdAt).toLocaleDateString('es-ES', { year: 'numeric', month: 'long' })
                    : '—'}
                </span>
              </div>
              {displayUser.birthDate && (
                <div className="flex justify-between py-2 border-b border-premium-gray">
                  <span className="text-premium-gray-dark">Fecha de nacimiento</span>
                  <span className="text-premium-black font-medium">
                    {new Date(displayUser.birthDate).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Editar fecha de nacimiento */}
          <div className="border border-premium-gray p-6">
            <h2 className="text-sm uppercase tracking-wider text-premium-black font-medium mb-4">Fecha de nacimiento</h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <input
                  type="date"
                  value={birthDate}
                  onChange={e => setBirthDate(e.target.value)}
                  className="w-full border border-premium-gray px-4 py-3 text-sm focus:outline-none focus:border-cuero-500 transition-colors"
                  max={new Date().toISOString().split('T')[0]}
                />
                <p className="text-xs text-premium-gray-dark mt-1">
                  La usamos para enviarte un cupón de descuento en tu cumpleaños
                </p>
              </div>

              {message && (
                <p className="text-sm text-green-600">{message}</p>
              )}
              {error && (
                <p className="text-sm text-red-500">{error}</p>
              )}

              <button
                type="submit"
                disabled={saving}
                className="btn-cuero disabled:opacity-50"
              >
                {saving ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </form>
          </div>

          {/* Direcciones de envío */}
          <div className="border border-premium-gray p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm uppercase tracking-wider text-premium-black font-medium">
                Mis Direcciones
              </h2>
              {!showAddressForm && (
                <button
                  onClick={() => { resetAddressForm(); setShowAddressForm(true); }}
                  className="text-xs uppercase tracking-wider text-cuero-500 hover:text-cuero-600 transition-colors"
                >
                  + Añadir Dirección
                </button>
              )}
            </div>

            {addressMessage && (
              <p className="text-sm text-green-600 mb-4">{addressMessage}</p>
            )}

            {addressesLoading ? (
              <p className="text-sm text-premium-gray-dark">Cargando direcciones...</p>
            ) : !showAddressForm && addresses.length === 0 ? (
              <p className="text-sm text-premium-gray-dark">No tienes direcciones guardadas.</p>
            ) : null}

            {/* Lista de direcciones */}
            {!showAddressForm && addresses.length > 0 && (
              <div className="space-y-3">
                {addresses.map(addr => (
                  <div key={addr._id} className={`border p-4 ${addr.isDefault ? 'border-cuero-500 bg-cuero-50/30' : 'border-premium-gray'}`}>
                    <div className="flex items-start justify-between">
                      <div className="text-sm">
                        <p className="font-medium text-premium-black">
                          {addr.name}
                          {addr.isDefault && (
                            <span className="ml-2 text-xs text-cuero-500 font-normal">(Predeterminada)</span>
                          )}
                        </p>
                        <p className="text-premium-gray-dark">{addr.address}</p>
                        <p className="text-premium-gray-dark">{addr.city}, {addr.state} — {addr.zip}</p>
                        <p className="text-premium-gray-dark">{addr.country}</p>
                        {addr.phone && <p className="text-premium-gray-dark">Tel: {addr.phone}</p>}
                      </div>
                    </div>
                    <div className="flex gap-3 mt-3">
                      <button
                        onClick={() => handleEditAddress(addr)}
                        className="text-xs text-cuero-500 hover:text-cuero-600 transition-colors uppercase tracking-wider"
                      >
                        Editar
                      </button>
                      {!addr.isDefault && (
                        <button
                          onClick={() => handleSetDefault(addr._id)}
                          className="text-xs text-premium-gray-dark hover:text-premium-black transition-colors uppercase tracking-wider"
                        >
                          Establecer como predeterminada
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteAddress(addr._id)}
                        className="text-xs text-red-500 hover:text-red-600 transition-colors uppercase tracking-wider"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Formulario de dirección */}
            {showAddressForm && (
              <form onSubmit={handleSaveAddress} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      placeholder="Nombre de la dirección (ej: Casa, Trabajo) *"
                      value={addressForm.name}
                      onChange={e => setAddressForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full border border-premium-gray px-4 py-3 text-sm focus:outline-none focus:border-cuero-500 transition-colors"
                      required
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      placeholder="Dirección *"
                      value={addressForm.address}
                      onChange={e => setAddressForm(prev => ({ ...prev, address: e.target.value }))}
                      className="w-full border border-premium-gray px-4 py-3 text-sm focus:outline-none focus:border-cuero-500 transition-colors"
                      required
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Ciudad *"
                      value={addressForm.city}
                      onChange={e => setAddressForm(prev => ({ ...prev, city: e.target.value }))}
                      className="w-full border border-premium-gray px-4 py-3 text-sm focus:outline-none focus:border-cuero-500 transition-colors"
                      required
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Provincia *"
                      value={addressForm.state}
                      onChange={e => setAddressForm(prev => ({ ...prev, state: e.target.value }))}
                      className="w-full border border-premium-gray px-4 py-3 text-sm focus:outline-none focus:border-cuero-500 transition-colors"
                      required
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Código Postal *"
                      value={addressForm.zip}
                      onChange={e => setAddressForm(prev => ({ ...prev, zip: e.target.value }))}
                      className="w-full border border-premium-gray px-4 py-3 text-sm focus:outline-none focus:border-cuero-500 transition-colors"
                      required
                    />
                  </div>
                  <div>
                    <select
                      value={addressForm.country}
                      onChange={e => setAddressForm(prev => ({ ...prev, country: e.target.value }))}
                      className="w-full border border-premium-gray px-4 py-3 text-sm focus:outline-none focus:border-cuero-500 transition-colors"
                    >
                      <option value="España">España</option>
                      <option value="México">México</option>
                      <option value="Argentina">Argentina</option>
                      <option value="Colombia">Colombia</option>
                      <option value="Chile">Chile</option>
                      <option value="Perú">Perú</option>
                    </select>
                  </div>
                  <div>
                    <input
                      type="tel"
                      placeholder="Teléfono"
                      value={addressForm.phone}
                      onChange={e => setAddressForm(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full border border-premium-gray px-4 py-3 text-sm focus:outline-none focus:border-cuero-500 transition-colors"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isDefault"
                      checked={addressForm.isDefault}
                      onChange={e => setAddressForm(prev => ({ ...prev, isDefault: e.target.checked }))}
                      className="w-4 h-4"
                    />
                    <label htmlFor="isDefault" className="text-sm text-premium-gray-dark">
                      Establecer como dirección predeterminada
                    </label>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={savingAddress}
                    className="btn-cuero disabled:opacity-50"
                  >
                    {savingAddress ? 'Guardando...' : editingAddress ? 'Actualizar Dirección' : 'Guardar Dirección'}
                  </button>
                  <button
                    type="button"
                    onClick={resetAddressForm}
                    className="px-6 py-3 text-sm uppercase tracking-wider text-premium-gray-dark hover:text-premium-black transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            )}
          </div>

          <div className="flex gap-4">
            <Link
              to="/mis-pedidos"
              className="inline-block text-sm uppercase tracking-wider text-cuero-500 hover:text-cuero-600 transition-colors"
            >
              ← Ver Mis Pedidos
            </Link>
          </div>
        </div>

        {/* Columna derecha: Lista de Deseos */}
        <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <div className="border border-premium-gray p-6">
            <h2 className="text-sm uppercase tracking-wider text-premium-black font-medium mb-4">
              Mi Lista de Deseos {wishlist.length > 0 && `(${wishlist.length})`}
            </h2>

            {wishlistLoading ? (
              <div className="animate-pulse space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-premium-gray-light flex-shrink-0" />
                    <div className="flex-1">
                      <div className="h-3 bg-premium-gray-light w-1/2 mb-2" />
                      <div className="h-3 bg-premium-gray-light w-1/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : wishlist.length === 0 ? (
              <div className="text-center py-8">
                <svg className="w-12 h-12 mx-auto text-premium-gray mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <p className="text-sm text-premium-gray-dark mb-2">Tu lista de deseos está vacía</p>
                <Link
                  to="/shop"
                  className="text-xs text-cuero-500 hover:text-cuero-600 uppercase tracking-wider transition-colors"
                >
                  Explorar productos
                </Link>
              </div>
            ) : (
              <>
                <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                  {paginatedWishlist.map(item => {
                    const watchData = typeof item.watchId === 'object' && item.watchId !== null ? item.watchId : null;
                    const watchId = watchData?._id || item.watchId;
                    const watchName = watchData?.name || item.name || 'Producto';
                    const watchImage = watchData?.image || item.image || '';
                    const watchPrice = watchData?.price ?? item.price;
                    const watchOldPrice = watchData?.oldPrice ?? item.oldPrice;
                    return (
                    <div key={watchId} className="flex items-center gap-4 border border-premium-gray p-3">
                      <Link to={`/product/${watchId}`} className="w-16 h-16 bg-premium-gray-light flex-shrink-0 overflow-hidden">
                        <img
                          src={getImageUrl(watchImage)}
                          alt={watchName}
                          className="w-full h-full object-cover"
                        />
                      </Link>
                      <div className="flex-1 min-w-0">
                        <Link
                          to={`/product/${watchId}`}
                          className="text-sm font-medium text-premium-black hover:text-cuero-500 transition-colors block truncate"
                        >
                          {watchName}
                        </Link>
                        {watchPrice != null && (
                          <div className="mt-1">
                            <PriceTag price={watchPrice} originalPrice={watchOldPrice} size="small" />
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => removeFromWishlist(watchId)}
                        className="text-xs text-premium-gray-dark hover:text-red-500 transition-colors uppercase tracking-wider flex-shrink-0"
                        title="Quitar de favoritos"
                      >
                        ✕
                      </button>
                    </div>
                    );
                  })}
                </div>

                {/* Paginación */}
                {totalWishlistPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-4 pt-3 border-t border-premium-gray">
                    <button
                      onClick={() => setWishlistPage(p => Math.max(0, p - 1))}
                      disabled={wishlistPage === 0}
                      className="px-3 py-1.5 text-xs uppercase tracking-wider text-premium-gray-dark hover:text-premium-black transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      ← Anterior
                    </button>
                    <span className="text-xs text-premium-gray-dark">
                      {wishlistPage + 1} / {totalWishlistPages}
                    </span>
                    <button
                      onClick={() => setWishlistPage(p => Math.min(totalWishlistPages - 1, p + 1))}
                      disabled={wishlistPage >= totalWishlistPages - 1}
                      className="px-3 py-1.5 text-xs uppercase tracking-wider text-premium-gray-dark hover:text-premium-black transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      Siguiente →
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


