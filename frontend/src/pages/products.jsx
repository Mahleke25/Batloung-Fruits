import { useCallback, useEffect, useState } from 'react';
import './Management.css';

const API = 'http://localhost:5000/api';

const blank = {
  FruitID: '',
  BoxSizeID: '',
  SellingPrice: '',
  Status: 'Active'
};

async function readResponse(response) {
  const text = await response.text();

  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { message: text || 'Unexpected server response.' };
  }
}

function Products() {
  const [rows, setRows] = useState([]);
  const [fruits, setFruits] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('All');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const load = useCallback(async () => {
    try {
      setError('');

      const [productResponse, fruitResponse, sizeResponse] =
        await Promise.all([
          fetch(`${API}/products`),
          fetch(`${API}/fruits`),
          fetch(`${API}/boxsizes`)
        ]);

      const [productData, fruitData, sizeData] = await Promise.all([
        readResponse(productResponse),
        readResponse(fruitResponse),
        readResponse(sizeResponse)
      ]);

      if (
        !productResponse.ok ||
        !fruitResponse.ok ||
        !sizeResponse.ok
      ) {
        throw new Error('Could not load product information.');
      }

      setRows(Array.isArray(productData) ? productData : productData.data || []);
      setFruits(Array.isArray(fruitData) ? fruitData : fruitData.data || []);
      setSizes(Array.isArray(sizeData) ? sizeData : sizeData.data || []);
    } catch (err) {
      setError(err.message || 'Could not load product information.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const fruitName = (product) =>
    product.FruitName ||
    fruits.find(
      (fruit) => Number(fruit.FruitID) === Number(product.FruitID)
    )?.FruitName ||
    `Fruit #${product.FruitID}`;

  const sizeName = (product) =>
    product.SizeName ||
    product.Size ||
    sizes.find(
      (size) => Number(size.BoxSizeID) === Number(product.BoxSizeID)
    )?.SizeName ||
    `Size #${product.BoxSizeID}`;

  function resetForm() {
    setForm(blank);
    setEditing(null);
  }

  async function save(event) {
    event.preventDefault();
    setMessage('');
    setError('');

    if (
      !form.FruitID ||
      !form.BoxSizeID ||
      !Number.isFinite(Number(form.SellingPrice)) ||
      Number(form.SellingPrice) <= 0
    ) {
      setError(
        'Select a fruit and box size, and enter a price greater than zero.'
      );
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(
        `${API}/products${editing ? `/${editing}` : ''}`,
        {
          method: editing ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            FruitID: Number(form.FruitID),
            BoxSizeID: Number(form.BoxSizeID),
            SellingPrice: Number(form.SellingPrice),
            Status: form.Status
          })
        }
      );

      const data = await readResponse(response);

      if (!response.ok) {
        throw new Error(data.message || 'Could not save product.');
      }

      setMessage(editing ? 'Product updated successfully.' : 'Product added successfully.');
      resetForm();
      setSelectedProduct(null);
      await load();
    } catch (err) {
      setError(err.message || 'Could not save product.');
    } finally {
      setSaving(false);
    }
  }

  function edit(product) {
    setEditing(product.ProductID);
    setSelectedProduct(null);
    setMessage('');
    setError('');

    setForm({
      FruitID: String(product.FruitID ?? ''),
      BoxSizeID: String(product.BoxSizeID ?? ''),
      SellingPrice: String(product.SellingPrice ?? ''),
      Status: product.Status || 'Active'
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function remove(product) {
    if (!window.confirm(`Delete ${fruitName(product)} - ${sizeName(product)}?`)) {
      return;
    }

    setMessage('');
    setError('');
    setDeleting(product.ProductID);

    try {
      const response = await fetch(
        `${API}/products/${product.ProductID}`,
        { method: 'DELETE' }
      );

      const data = await readResponse(response);

      if (!response.ok) {
        throw new Error(data.message || 'Could not delete product.');
      }

      setMessage('Product deleted successfully.');

      if (
        selectedProduct &&
        selectedProduct.ProductID === product.ProductID
      ) {
        setSelectedProduct(null);
      }

      if (editing === product.ProductID) {
        resetForm();
      }

      await load();
    } catch (err) {
      setError(err.message || 'Could not delete product.');
    } finally {
      setDeleting(null);
    }
  }

  const visible = rows.filter((product) => {
    const query = search.trim().toLowerCase();
    const matchesSearch =
      `${product.ProductID} ${fruitName(product)} ${sizeName(product)}`
        .toLowerCase()
        .includes(query);

    const matchesStatus =
      status === 'All' ||
      String(product.Status || '').toLowerCase() === status.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  const activeCount = rows.filter(
    (product) => String(product.Status).toLowerCase() === 'active'
  ).length;

  return (
    <div className="management-page">
      <div className="management-header">
        <div>
          <p className="management-eyebrow">BATLOUNG FRUITS / INVENTORY</p>
          <h1>Product Management</h1>
          <p className="management-subtitle">
            Manage fruit products, box sizes, selling prices and product status.
          </p>
        </div>

        <div className="management-total">
          <span>Total Products</span>
          <strong>{rows.length}</strong>
        </div>
      </div>

      {message && (
        <div className="management-alert management-alert-success">
          <span>{message}</span>
          <button type="button" onClick={() => setMessage('')}>Dismiss</button>
        </div>
      )}

      {error && (
        <div className="management-alert management-alert-error">
          <span>{error}</span>
          <button type="button" onClick={() => setError('')}>Dismiss</button>
        </div>
      )}

      <section className="management-card">
        <div className="management-card-heading">
          <div>
            <p className="management-eyebrow">
              {editing ? 'UPDATE PRODUCT' : 'PRODUCT SETUP'}
            </p>
            <h2>{editing ? 'Edit Product' : 'Add New Product'}</h2>
            <p>
              Choose the fruit and box size, then set the selling price.
            </p>
          </div>
          <div className="management-heading-icon">📦</div>
        </div>

        <form className="management-form" onSubmit={save}>
          <div className="management-form-field">
            <label htmlFor="product-fruit">Fruit</label>
            <select
              id="product-fruit"
              value={form.FruitID}
              required
              onChange={(event) =>
                setForm({ ...form, FruitID: event.target.value })
              }
            >
              <option value="">Select fruit</option>
              {fruits.map((fruit) => (
                <option key={fruit.FruitID} value={fruit.FruitID}>
                  {fruit.FruitName}
                </option>
              ))}
            </select>
          </div>

          <div className="management-form-field">
            <label htmlFor="product-size">Box Size</label>
            <select
              id="product-size"
              value={form.BoxSizeID}
              required
              onChange={(event) =>
                setForm({ ...form, BoxSizeID: event.target.value })
              }
            >
              <option value="">Select box size</option>
              {sizes.map((size) => (
                <option key={size.BoxSizeID} value={size.BoxSizeID}>
                  {size.SizeName}
                </option>
              ))}
            </select>
          </div>

          <div className="management-form-field">
            <label htmlFor="product-price">Selling Price (M)</label>
            <input
              id="product-price"
              type="number"
              min="0.01"
              step="0.01"
              placeholder="e.g. 550.00"
              value={form.SellingPrice}
              required
              onChange={(event) =>
                setForm({ ...form, SellingPrice: event.target.value })
              }
            />
          </div>

          <div className="management-form-field">
            <label htmlFor="product-status">Status</label>
            <select
              id="product-status"
              value={form.Status}
              onChange={(event) =>
                setForm({ ...form, Status: event.target.value })
              }
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <button className="crud-btn crud-save" type="submit" disabled={saving}>
            {saving ? 'Saving...' : editing ? 'Save Changes' : '+ Add Product'}
          </button>

          {editing && (
            <button
              className="crud-btn crud-cancel"
              type="button"
              onClick={resetForm}
              disabled={saving}
            >
              Cancel
            </button>
          )}
        </form>
      </section>

      {selectedProduct && (
        <section className="management-card fruit-detail-card">
          <div className="management-card-heading">
            <div>
              <p className="management-eyebrow">PRODUCT INFORMATION</p>
              <h2>Product Details</h2>
              <p>Full information about the selected product.</p>
            </div>

            <button
              className="crud-btn crud-cancel"
              type="button"
              onClick={() => setSelectedProduct(null)}
            >
              Close Details ✕
            </button>
          </div>

          <div className="fruit-detail-content">
            <div className="fruit-detail-icon">🍎</div>

            <div className="fruit-detail-grid">
              <div>
                <span>Product ID</span>
                <strong>#{selectedProduct.ProductID}</strong>
              </div>
              <div>
                <span>Fruit Name</span>
                <strong>{fruitName(selectedProduct)}</strong>
              </div>
              <div>
                <span>Box Size</span>
                <strong>{sizeName(selectedProduct)}</strong>
              </div>
              <div>
                <span>Selling Price</span>
                <strong>
                  M {Number(selectedProduct.SellingPrice).toFixed(2)}
                </strong>
              </div>
              <div>
                <span>Status</span>
                <strong>{selectedProduct.Status || 'Not specified'}</strong>
              </div>
              <div>
                <span>Availability</span>
                <strong>
                  {String(selectedProduct.Status).toLowerCase() === 'active'
                    ? 'Available'
                    : 'Not available'}
                </strong>
              </div>
            </div>
          </div>

          <p className="fruit-detail-note">
            Use the Edit action in the product table to update this product's
            information.
          </p>
        </section>
      )}

      <section className="management-card">
        <div className="management-card-heading">
          <div>
            <p className="management-eyebrow">INVENTORY CATALOGUE</p>
            <h2>All Products</h2>
            <p>
              {rows.length} total products · {activeCount} active
            </p>
          </div>
          <div className="management-heading-icon">🛒</div>
        </div>

        <div className="management-toolbar">
          <div className="management-form-field management-search">
            <label htmlFor="product-search">Search Products</label>
            <input
              id="product-search"
              type="search"
              placeholder="Search by product ID, fruit or box size..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <div className="management-form-field">
            <label htmlFor="product-filter">Filter by Status</label>
            <select
              id="product-filter"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div className="management-table-wrapper">
          <table className="management-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Fruit</th>
                <th>Box Size</th>
                <th>Selling Price</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="management-empty">
                    Loading products...
                  </td>
                </tr>
              ) : visible.length === 0 ? (
                <tr>
                  <td colSpan="6" className="management-empty">
                    No products found. Try another search or filter.
                  </td>
                </tr>
              ) : (
                visible.map((product) => (
                  <tr key={product.ProductID}>
                    <td><strong>#{product.ProductID}</strong></td>
                    <td><strong>{fruitName(product)}</strong></td>
                    <td>{sizeName(product)}</td>
                    <td>
                      <strong>
                        M {Number(product.SellingPrice).toFixed(2)}
                      </strong>
                    </td>
                    <td>
                      <span
                        className={`status-badge ${
                          String(product.Status).toLowerCase() === 'active'
                            ? 'status-active'
                            : 'status-inactive'
                        }`}
                      >
                        {product.Status || 'Unknown'}
                      </span>
                    </td>
                    <td>
                      <div className="crud-actions">
                        <button
                          className="crud-btn crud-view"
                          type="button"
                          onClick={() => setSelectedProduct(product)}
                        >
                          View
                        </button>

                        <button
                          className="crud-btn crud-edit"
                          type="button"
                          onClick={() => edit(product)}
                        >
                          Edit
                        </button>

                        <button
                          className="crud-btn crud-delete"
                          type="button"
                          disabled={deleting === product.ProductID}
                          onClick={() => remove(product)}
                        >
                          {deleting === product.ProductID
                            ? 'Deleting...'
                            : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="management-table-footer">
          Showing {visible.length} of {rows.length} products
        </div>
      </section>
    </div>
  );
}

export default Products;