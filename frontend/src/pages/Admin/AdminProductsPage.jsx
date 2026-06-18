import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { fetchAdminProducts, updateProductStock, deleteAdminProduct } from '../../services/api';
import { getImageUrl } from '../../services/apiClient';
import AdminTable from '../../components/ui/AdminTable';
import AdminModal from '../../components/ui/AdminModal';
import ProductFormModal from '../../components/ProductFormModal';

const CATEGORIES = [
  { value: 'clasicos-vestir', label: 'Clásicos & Vestir' },
  { value: 'cronografos', label: 'Cronógrafos' },
  { value: 'automaticos', label: 'Automáticos' },
  { value: 'piezas-coleccion', label: 'Piezas de Colección' },
];

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [editingStock, setEditingStock] = useState(null);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // Estado del modal de detalle
  const [selectedProduct, setSelectedProduct] = useState(null);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await fetchAdminProducts(search, page, 20);
      setProducts(result.data || []);
      setTotalPages(result.totalPages || 0);
      setTotalItems(result.totalItems || 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadProducts();
  }, [loadProducts]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(0);
    loadProducts();
  };

  const openNewModal = () => {
    setEditingProduct(null);
    setShowModal(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este producto?')) return;
    setError('');
    setSuccessMsg('');
    try {
      await deleteAdminProduct(id);
      setSuccessMsg('Producto eliminado correctamente');
      loadProducts();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleStockSave = async (id) => {
    if (editingStock === null || editingStock.id !== id) return;
    setSaving(true);
    setError('');
    setSuccessMsg('');
    try {
      await updateProductStock(id, editingStock.stock);
      setSuccessMsg('Stock actualizado correctamente');
      setEditingStock(null);
      loadProducts();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const startEditing = (product) => {
    setEditingStock({ id: product._id, stock: product.stock });
  };

  const handleModalSaved = () => {
    setSuccessMsg(editingProduct ? 'Producto actualizado correctamente' : 'Producto creado correctamente');
    loadProducts();
  };

  const columns = [
    { key: 'name', label: 'Producto', sortable: true },
    { key: 'mpn', label: 'MPN', sortable: true },
    { key: 'sku', label: 'SKU', sortable: true },
    { key: 'category', label: 'Categoría', sortable: true },
    { key: 'price', label: 'Precio', sortable: true, align: 'right' },
    { key: 'stock', label: 'Stock', sortable: true, align: 'center' },
    { key: 'status', label: 'Estado', sortable: true, align: 'center' },
    { key: 'actions', label: 'Acciones', align: 'center' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-display uppercase tracking-wider">Productos</h1>
        </div>
        <button onClick={openNewModal} className="btn-primary text-xs">
          + Nuevo producto
        </button>
      </div>

      {/* Búsqueda */}
      <form onSubmit={handleSearch} className="flex gap-3 mb-6">
        <input
          type="text"
          placeholder="Buscar por nombre, MPN, SKU, marca..."
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

      {/* Alerta de stock bajo */}
      {!loading && products.filter(p => p.stock > 0 && p.stock < 5).length > 0 && (
        <div className="bg-amber-50 border border-amber-200 text-amber-700 text-sm p-3 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <span>
            <strong>{products.filter(p => p.stock > 0 && p.stock < 5).length} productos</strong> tienen stock bajo (menos de 5 unidades).
            Revisa la columna de stock para más detalles.
          </span>
        </div>
      )}

      {/* Mensajes */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 mb-4">{error}</div>
      )}
      {successMsg && (
        <div className="bg-green-50 border border-green-200 text-green-600 text-sm p-3 mb-4">{successMsg}</div>
      )}

      {/* Modal de creación/edición */}
      <ProductFormModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        editingProduct={editingProduct}
        onSaved={handleModalSaved}
      />

      {/* Tabla */}
      <AdminTable
        columns={columns}
        data={products}
        loading={loading}
        emptyMessage="No se encontraron productos"
        totalItems={totalItems}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        onRowClick={(product) => setSelectedProduct(product)}
      >
        {(sortedData) => sortedData.map((product) => (
          <tr key={product._id} className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer">
            <td className="px-5 py-4">
              <div className="flex items-center gap-3">
                {product.image && (
                  <img src={getImageUrl(product.image)} alt="" className="w-12 h-12 object-cover rounded" />
                )}
                <Link
                  to={`/product/${product._id}`}
                  className="font-medium text-premium-black hover:text-cuero-500 transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  {product.name}
                </Link>
              </div>
            </td>
            <td className="px-5 py-4 text-premium-gray-dark font-mono">{product.mpn || '-'}</td>
            <td className="px-5 py-4 text-premium-gray-dark font-mono">{product.sku || '-'}</td>
            <td className="px-5 py-4 text-premium-gray-dark capitalize">
              {CATEGORIES.find(c => c.value === product.category)?.label || product.category}
            </td>
            <td className="px-5 py-4 text-right">{product.price} €</td>
            <td className="px-5 py-4 text-center">
              {editingStock?.id === product._id ? (
                <div className="flex items-center justify-center gap-2">
                  <input
                    type="number" min="0"
                    value={editingStock.stock}
                    onChange={(e) => setEditingStock({ ...editingStock, stock: Number(e.target.value) })}
                    className="w-20 text-center border border-gray-300 px-2 py-1 text-sm"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <button onClick={(e) => { e.stopPropagation(); handleStockSave(product._id); }} disabled={saving} className="text-green-600 hover:text-green-700 disabled:opacity-50">
                    {saving ? '...' : '✓'}
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); setEditingStock(null); }} className="text-red-500 hover:text-red-600">✕</button>
                </div>
              ) : (
                <span className={product.stock <= 0 ? 'text-red-500 font-medium' : ''}>
                  {product.stock <= 0 ? 'Sin stock' : product.stock}
                </span>
              )}
            </td>
            <td className="px-5 py-4 text-center">
              <span className={`inline-block px-2 py-0.5 text-xs rounded-full ${
                product.status === 'IN_STOCK' ? 'bg-green-50 text-green-700' :
                product.status === 'OUT_OF_STOCK' ? 'bg-red-50 text-red-700' : 'bg-gray-50 text-gray-500'
              }`}>
                {product.status === 'IN_STOCK' ? 'En stock' : product.status === 'OUT_OF_STOCK' ? 'Sin stock' : 'Discontinuado'}
              </span>
            </td>
            <td className="px-5 py-4 text-center">
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); startEditing(product); }}
                  className="px-3 py-1.5 text-xs font-medium rounded bg-cuero-50 text-cuero-700 border border-cuero-200 hover:bg-cuero-100 transition-colors uppercase tracking-wider"
                >
                  Stock
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); openEditModal(product); }}
                  className="px-3 py-1.5 text-xs font-medium rounded bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors uppercase tracking-wider"
                >
                  Editar
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(product._id); }}
                  className="px-3 py-1.5 text-xs font-medium rounded bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors uppercase tracking-wider"
                >
                  Eliminar
                </button>
              </div>
            </td>
          </tr>
        ))}
      </AdminTable>

      {/* Modal de detalle de producto */}
      <AdminModal
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        title={selectedProduct?.name || 'Detalle de Producto'}
        badge={{
          label: selectedProduct?.status === 'IN_STOCK' ? 'En stock' : selectedProduct?.status === 'OUT_OF_STOCK' ? 'Sin stock' : 'Discontinuado',
          className: selectedProduct?.status === 'IN_STOCK' ? 'bg-green-50 text-green-700' : selectedProduct?.status === 'OUT_OF_STOCK' ? 'bg-red-50 text-red-700' : 'bg-gray-50 text-gray-500',
        }}
      >
        {selectedProduct && (
          <>
            {/* Imagen y datos básicos */}
            <div className="flex gap-6">
              {selectedProduct.image && (
                <div className="flex-shrink-0">
                  <img src={getImageUrl(selectedProduct.image)} alt={selectedProduct.name} className="w-32 h-32 object-cover rounded" />
                </div>
              )}
              <div className="flex-1 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-premium-gray-dark text-xs">Nombre</span>
                  <p className="font-medium">{selectedProduct.name}</p>
                </div>
                <div>
                  <span className="text-premium-gray-dark text-xs">Marca</span>
                  <p className="font-medium">{selectedProduct.brand || '-'}</p>
                </div>
                <div>
                  <span className="text-premium-gray-dark text-xs">MPN</span>
                  <p className="font-medium font-mono">{selectedProduct.mpn || '-'}</p>
                </div>
                <div>
                  <span className="text-premium-gray-dark text-xs">SKU</span>
                  <p className="font-medium font-mono">{selectedProduct.sku || '-'}</p>
                </div>
                <div>
                  <span className="text-premium-gray-dark text-xs">Categoría</span>
                  <p className="font-medium capitalize">{CATEGORIES.find(c => c.value === selectedProduct.category)?.label || selectedProduct.category}</p>
                </div>
                <div>
                  <span className="text-premium-gray-dark text-xs">Tag</span>
                  <p className="font-medium">{selectedProduct.tag || '-'}</p>
                </div>
              </div>
            </div>

            {/* Precios y stock */}
            <div>
              <h3 className="text-xs uppercase tracking-wider font-medium text-premium-gray-dark mb-3">Precios y Stock</h3>
              <div className="bg-gray-50 p-4 grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-premium-gray-dark text-xs">Precio</span>
                  <p className="font-medium">{selectedProduct.price} €</p>
                </div>
                <div>
                  <span className="text-premium-gray-dark text-xs">Precio anterior</span>
                  <p className="font-medium">{selectedProduct.oldPrice ? `${selectedProduct.oldPrice} €` : '-'}</p>
                </div>
                <div>
                  <span className="text-premium-gray-dark text-xs">Stock</span>
                  <p className={`font-medium ${selectedProduct.stock === 0 ? 'text-red-600' : ''}`}>{selectedProduct.stock} unidades</p>
                </div>
              </div>
            </div>

            {/* Especificaciones */}
            <div>
              <h3 className="text-xs uppercase tracking-wider font-medium text-premium-gray-dark mb-3">Especificaciones</h3>
              <div className="bg-gray-50 p-4 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-premium-gray-dark text-xs">Movimiento</span>
                  <p className="font-medium">{selectedProduct.movement || '-'}</p>
                </div>
                <div>
                  <span className="text-premium-gray-dark text-xs">Material de la caja</span>
                  <p className="font-medium">{selectedProduct.caseMaterial || '-'}</p>
                </div>
                <div>
                  <span className="text-premium-gray-dark text-xs">Color de la esfera</span>
                  <p className="font-medium">{selectedProduct.dialColor || '-'}</p>
                </div>
                <div>
                  <span className="text-premium-gray-dark text-xs">Material de la correa</span>
                  <p className="font-medium">{selectedProduct.strapMaterial || '-'}</p>
                </div>
                <div>
                  <span className="text-premium-gray-dark text-xs">Color de la correa</span>
                  <p className="font-medium">{selectedProduct.strapColor || '-'}</p>
                </div>
              </div>
            </div>

            {/* Descripción */}
            {selectedProduct.description && (
              <div>
                <h3 className="text-xs uppercase tracking-wider font-medium text-premium-gray-dark mb-3">Descripción</h3>
                <div className="bg-gray-50 p-4 text-sm">
                  <p className="text-premium-black whitespace-pre-line">{selectedProduct.description}</p>
                </div>
              </div>
            )}

            {/* ID */}
            <div className="text-xs text-premium-gray-dark text-right">
              ID: {selectedProduct._id}
            </div>
          </>
        )}
      </AdminModal>
    </div>
  );
}
