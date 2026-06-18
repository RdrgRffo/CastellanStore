import { useState, useEffect, useMemo } from 'react';
import { createAdminProduct, updateAdminProduct, uploadProductImage, uploadGalleryImages } from '../services/api';
import { getImageUrl } from '../services/apiClient';
import { FormValidator, Validator } from '../utils/FormValidator';

const CATEGORIES = [
  { value: 'clasicos-vestir', label: 'Clásicos & Vestir' },
  { value: 'cronografos', label: 'Cronógrafos' },
  { value: 'automaticos', label: 'Automáticos' },
  { value: 'piezas-coleccion', label: 'Piezas de Colección' },
];

const TAGS = [
  { value: '', label: 'Ninguno' },
  { value: 'Bestseller', label: 'Bestseller' },
  { value: 'New', label: 'New' },
  { value: 'Oferta', label: 'Oferta' },
  { value: 'Limited', label: 'Limited' },
  { value: 'Premium', label: 'Premium' },
];

const emptyForm = {
  name: '',
  brand: 'Castellan',
  price: '',
  oldPrice: '',
  discount: '0',
  category: 'clasicos-vestir',
  description: '',
  stock: '0',
  movement: '',
  strapColor: '',
  strapMaterial: '',
  dialColor: '',
  caseMaterial: '',
  tag: '',
  image: '',
};

export default function ProductFormModal({ isOpen, onClose, editingProduct, onSaved }) {
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [galleryFiles, setGalleryFiles] = useState([]);
  const [galleryPreviews, setGalleryPreviews] = useState([]);
  const [existingGallery, setExistingGallery] = useState([]);

  const validator = useMemo(() => {
    const v = new FormValidator()
      .field('name', [
        Validator.required('El nombre es obligatorio'),
        Validator.minLength(2, 'Mínimo 2 caracteres'),
        Validator.maxLength(100, 'Máximo 100 caracteres'),
      ])
      .field('brand', [Validator.required('La marca es obligatoria')])
      .field('price', [
        Validator.required('El precio es obligatorio'),
        Validator.min(0.01, 'El precio debe ser mayor que 0'),
        Validator.custom((v) => !isNaN(Number(v)), 'Introduce un precio válido'),
      ])
      .field('oldPrice', [Validator.custom((v) => !v || !isNaN(Number(v)), 'Introduce un precio válido')])
      .field('discount', [Validator.min(0, 'El descuento no puede ser negativo'), Validator.max(100, 'El descuento no puede superar el 100%')])
      .field('category', [Validator.required('La categoría es obligatoria')])
      .field('stock', [Validator.min(0, 'El stock no puede ser negativo'), Validator.custom((v) => !isNaN(Number(v)), 'Introduce un número válido')])
      .field('description', [Validator.maxLength(2000, 'Máximo 2000 caracteres')]);
    return v;
  }, []);

  useEffect(() => {
    if (editingProduct) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm({
        name: editingProduct.name || '',
        brand: editingProduct.brand || 'Castellan',
        price: editingProduct.price || '',
        oldPrice: editingProduct.oldPrice || '',
        discount: editingProduct.discount || '0',
        category: editingProduct.category || 'clasicos-vestir',
        description: editingProduct.description || '',
        stock: editingProduct.stock || '0',
        movement: editingProduct.movement || '',
        strapColor: editingProduct.strapColor || '',
        strapMaterial: editingProduct.strapMaterial || '',
        dialColor: editingProduct.dialColor || '',
        caseMaterial: editingProduct.caseMaterial || '',
        tag: editingProduct.tag || '',
        image: '',
      });
      setEditingId(editingProduct._id);
      setImageFile(null);
      setImagePreview(editingProduct.image ? getImageUrl(editingProduct.image) : '');
      setExistingGallery(editingProduct.gallery || []);
      setGalleryFiles([]);
      setGalleryPreviews([]);
    } else {
      setForm(emptyForm);
      setEditingId(null);
      setImageFile(null);
      setImagePreview('');
      setExistingGallery([]);
      setGalleryFiles([]);
      setGalleryPreviews([]);
    }
    setError('');
    validator.reset();
  }, [editingProduct, isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = (field, value) => {
    const updated = { ...form, [field]: value };
    setForm(updated);
    validator.validateField(field, value, updated);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleGalleryChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    const newPreviews = files.map((f) => URL.createObjectURL(f));
    setGalleryFiles((prev) => [...prev, ...files]);
    setGalleryPreviews((prev) => [...prev, ...newPreviews]);
  };

  const removeGalleryPreview = (index) => {
    setGalleryFiles((prev) => prev.filter((_, i) => i !== index));
    setGalleryPreviews((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const removeExistingGalleryImage = (index) => {
    setExistingGallery((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validator.validateAll(form)) return;
    setSaving(true);
    setError('');
    try {
      let imageKey = form.image || '';
      if (imageFile) {
        const formData = new FormData();
        formData.append('image', imageFile);
        const uploadResult = await uploadProductImage(formData);
        imageKey = uploadResult.image || '';
      }

      // Subir imágenes de galería nuevas si las hay
      let galleryKeys = [...existingGallery];
      if (galleryFiles.length > 0) {
        const galleryFormData = new FormData();
        galleryFiles.forEach((f) => galleryFormData.append('images', f));
        if (editingId) {
          galleryFormData.append('watchId', editingId);
        }
        const galleryResult = await uploadGalleryImages(galleryFormData);
        if (galleryResult && galleryResult.gallery) {
          galleryKeys = [...galleryKeys, ...galleryResult.gallery];
        }
      }

      const payload = {
        name: form.name,
        brand: form.brand,
        price: Number(form.price),
        oldPrice: form.oldPrice ? Number(form.oldPrice) : null,
        discount: Number(form.discount),
        category: form.category,
        description: form.description,
        stock: Number(form.stock),
        movement: form.movement,
        strapColor: form.strapColor,
        strapMaterial: form.strapMaterial,
        dialColor: form.dialColor,
        caseMaterial: form.caseMaterial,
        tag: form.tag || null,
        image: imageKey || undefined,
        gallery: galleryKeys.length > 0 ? galleryKeys : undefined,
      };

      if (editingId) {
        await updateAdminProduct(editingId, payload);
      } else {
        await createAdminProduct(payload);
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white w-full max-w-3xl max-h-[90vh] overflow-y-auto mx-4 shadow-xl">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-sm uppercase tracking-wider font-medium text-premium-black">
            {editingId ? 'Editar producto' : 'Nuevo producto'}
          </h2>
          <button onClick={onClose} className="text-premium-gray-dark hover:text-premium-black transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-xs p-3 mb-4">{error}</div>
          )}

          <form onSubmit={handleSubmit} noValidate className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-premium-gray-dark mb-1">Nombre *</label>
              <input type="text" value={form.name} onChange={(e) => handleChange('name', e.target.value)} className={validator.inputClass('name') + ' w-full'} />
              {renderError('name')}
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-premium-gray-dark mb-1">Marca</label>
              <input type="text" value={form.brand} onChange={(e) => handleChange('brand', e.target.value)} className={validator.inputClass('brand') + ' w-full'} />
              {renderError('brand')}
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-premium-gray-dark mb-1">Precio *</label>
              <input type="number" min="0" step="0.01" value={form.price} onChange={(e) => handleChange('price', e.target.value)} className={validator.inputClass('price') + ' w-full'} />
              {renderError('price')}
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-premium-gray-dark mb-1">Precio anterior</label>
              <input type="number" min="0" step="0.01" value={form.oldPrice} onChange={(e) => handleChange('oldPrice', e.target.value)} className={validator.inputClass('oldPrice') + ' w-full'} />
              {renderError('oldPrice')}
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-premium-gray-dark mb-1">Descuento %</label>
              <input type="number" min="0" max="100" value={form.discount} onChange={(e) => handleChange('discount', e.target.value)} className={validator.inputClass('discount') + ' w-full'} />
              {renderError('discount')}
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-premium-gray-dark mb-1">Categoría *</label>
              <select value={form.category} onChange={(e) => handleChange('category', e.target.value)} className={validator.inputClass('category') + ' w-full'}>
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
              {renderError('category')}
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-premium-gray-dark mb-1">Stock</label>
              <input type="number" min="0" value={form.stock} onChange={(e) => handleChange('stock', e.target.value)} className={validator.inputClass('stock') + ' w-full'} />
              {renderError('stock')}
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-premium-gray-dark mb-1">Movimiento</label>
              <input type="text" value={form.movement} onChange={(e) => setForm({ ...form, movement: e.target.value })} className="input-premium w-full" placeholder="Automático, Cuerda manual..." />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-premium-gray-dark mb-1">Tag</label>
              <select value={form.tag} onChange={(e) => setForm({ ...form, tag: e.target.value })} className="input-premium w-full">
                {TAGS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-premium-gray-dark mb-1">Color esfera</label>
              <input type="text" value={form.dialColor} onChange={(e) => setForm({ ...form, dialColor: e.target.value })} className="input-premium w-full" />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-premium-gray-dark mb-1">Material correa</label>
              <input type="text" value={form.strapMaterial} onChange={(e) => setForm({ ...form, strapMaterial: e.target.value })} className="input-premium w-full" />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-premium-gray-dark mb-1">Color correa</label>
              <input type="text" value={form.strapColor} onChange={(e) => setForm({ ...form, strapColor: e.target.value })} className="input-premium w-full" />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-premium-gray-dark mb-1">Material caja</label>
              <input type="text" value={form.caseMaterial} onChange={(e) => setForm({ ...form, caseMaterial: e.target.value })} className="input-premium w-full" />
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block text-xs uppercase tracking-wider text-premium-gray-dark mb-1">Imagen del producto</label>
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleImageChange} className="w-full text-sm text-premium-gray-dark file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-xs file:font-medium file:bg-cuero-50 file:text-cuero-700 hover:file:bg-cuero-100 transition-colors" />
                  <p className="text-xs text-premium-gray-dark mt-1">La imagen se convertirá a WebP (800px) y se subirá a MinIO automáticamente</p>
                </div>
                {imagePreview && (
                  <div className="w-20 h-20 border border-gray-200 rounded overflow-hidden flex-shrink-0">
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block text-xs uppercase tracking-wider text-premium-gray-dark mb-1">O URL de imagen</label>
              <input type="text" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} className="input-premium w-full" placeholder="http://localhost:9000/castellan-images/... (si no usas archivo)" />
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block text-xs uppercase tracking-wider text-premium-gray-dark mb-1">Galería de imágenes</label>
              <input
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleGalleryChange}
                className="w-full text-sm text-premium-gray-dark file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-xs file:font-medium file:bg-cuero-50 file:text-cuero-700 hover:file:bg-cuero-100 transition-colors"
              />
              <p className="text-xs text-premium-gray-dark mt-1">Selecciona varias imágenes para la galería del producto (máx. 10)</p>
              {(existingGallery.length > 0 || galleryPreviews.length > 0) && (
                <div className="flex flex-wrap gap-3 mt-3">
                  {existingGallery.map((key, idx) => (
                    <div key={`existing-${idx}`} className="relative w-20 h-20 border border-gray-200 rounded overflow-hidden group">
                      <img src={getImageUrl(key)} alt={`Galería ${idx + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeExistingGalleryImage(idx)}
                        className="absolute top-0.5 right-0.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                  {galleryPreviews.map((preview, idx) => (
                    <div key={`new-${idx}`} className="relative w-20 h-20 border border-green-300 rounded overflow-hidden group">
                      <img src={preview} alt={`Nueva ${idx + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeGalleryPreview(idx)}
                        className="absolute top-0.5 right-0.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block text-xs uppercase tracking-wider text-premium-gray-dark mb-1">Descripción</label>
              <textarea value={form.description} onChange={(e) => handleChange('description', e.target.value)} className={validator.inputClass('description') + ' w-full'} rows={3} />
              {renderError('description')}
            </div>
            <div className="sm:col-span-2 lg:col-span-3 flex gap-3 pt-2">
              <button type="submit" disabled={saving} className="btn-primary text-xs">
                {saving ? 'Guardando...' : editingId ? 'Actualizar producto' : 'Crear producto'}
              </button>
              <button type="button" onClick={onClose} className="btn-secondary text-xs">Cancelar</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
