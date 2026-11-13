import { useCallback, useEffect, useState } from 'react';
import './Management.css';

const API = 'http://localhost:5000/api';

const today = () => {
  const date = new Date();
  const localDate = new Date(
    date.getTime() - date.getTimezoneOffset() * 60000
  );
  return localDate.toISOString().slice(0, 10);
};

const createBlankForm = () => ({
  SupplierID: '',
  ProductID: '',
  Quantity: '',
  PurchasePrice: '',
  PurchaseDate: today()
});

async function readResponse(response) {
  const text = await response.text();

  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { message: text || 'Unexpected server response.' };
  }
}

function getArray(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.data)) return data.data;
  return [];
}

export default function Purchases() {
  const [rows, setRows] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(createBlankForm);
  const [search, setSearch] = useState('');
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setError('');

      const [purchaseResponse, supplierResponse, productResponse] =
        await Promise.all([
          fetch(`${API}/purchases`),
          fetch(`${API}/suppliers`),
          fetch(`${API}/products`)
        ]);

      const [purchaseData, supplierData, productData] = await Promise.all([
        readResponse(purchaseResponse),
        readResponse(supplierResponse),
        readResponse(productResponse)
      ]);

      if (
        !purchaseResponse.ok ||
        !supplierResponse.ok ||
        !productResponse.ok
      ) {
        throw new Error('Could not load purchase information.');
      }

      setRows(getArray(purchaseData));
      setSuppliers(getArray(supplierData));
      setProducts(getArray(productData));
    } catch (err) {
      setError(err.message || 'Could not load purchase information.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const supplierName = (purchase) =>
    purchase.SupplierName ||
    suppliers.find(
      (supplier) =>
        Number(supplier.SupplierID) === Number(purchase.SupplierID)
    )?.SupplierName ||
    `Supplier #${purchase.SupplierID}`;

  const findProduct = (purchase) =>
    products.find(
      (product) =>
        Number(product.ProductID) === Number(purchase.ProductID)
    );

  const productName = (purchase) => {
    const product = findProduct(purchase);

    const fruit =
      purchase.FruitName ||
      product?.FruitName ||
      purchase.ProductName ||
      product?.ProductName;

    const size =
      purchase.SizeName ||
      purchase.Size ||
      product?.SizeName ||
      product?.Size;

    if (fruit && size) return `${fruit} — ${size}`;
    if (fruit) return fruit;
    if (size) return `${size} (Product #${purchase.ProductID})`;

    return `Product #${purchase.ProductID}`;
  };

  const purchaseTotal = (purchase) =>
    Number(purchase.Quantity || 0) *
    Number(purchase.PurchasePrice || 0);

  const totalUnits = rows.reduce(
    (total, purchase) => total + Number(purchase.Quantity || 0),
    0
  );

  const totalPurchaseValue = rows.reduce(
    (total, purchase) => total + purchaseTotal(purchase),
    0
  );

  const visible = rows.filter((purchase) =>
    `${purchase.PurchaseID} ${supplierName(purchase)} ${productName(purchase)} ${purchase.PurchaseDate || ''}`
      .toLowerCase()
      .includes(search.trim().toLowerCase())
  );

  async function addPurchase(event) {
    event.preventDefault();
    setMessage('');
    setError('');

    if (
      !form.SupplierID ||
      !form.ProductID ||
      !Number.isInteger(Number(form.Quantity)) ||
      Number(form.Quantity) <= 0 ||
      !Number.isFinite(Number(form.PurchasePrice)) ||
      Number(form.PurchasePrice) <= 0 ||
      !form.PurchaseDate
    ) {
      setError(
        'Select a supplier and product, enter a whole-number quantity greater than zero, a positive unit price, and a purchase date.'
      );
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(`${API}/purchases`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          SupplierID: Number(form.SupplierID),
          ProductID: Number(form.ProductID),
          Quantity: Number(form.Quantity),
          PurchasePrice: Number(form.PurchasePrice),
          PurchaseDate: form.PurchaseDate
        })
      });

      const data = await readResponse(response);

      if (!response.ok) {
        throw new Error(data.message || 'Could not record purchase.');
      }

      setForm(createBlankForm());
      setSelectedPurchase(null);
      setMessage('Purchase recorded successfully.');
      await load();
    } catch (err) {
      setError(err.message || 'Could not record purchase.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="management-page">
      <div className="management-header">
        <div>
          <p className="management-eyebrow">
            BATLOUNG FRUITS / SUPPLY CHAIN
          </p>
          <h1>Inventory Management</h1>
          <p className="management-subtitle">
            Record supplier purchases and monitor incoming stock and purchasing costs.
          </p>
        </div>

        <div className="management-total">
          <span>Total Inventory</span>
          <strong>{rows.length}</strong>
        </div>
      </div>

      {message && (
        <div className="management-alert management-alert-success">
          <span>{message}</span>
          <button type="button" onClick={() => setMessage('')}>
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <div className="management-alert management-alert-error">
          <span>{error}</span>
          <button type="button" onClick={() => setError('')}>
            Dismiss
          </button>
        </div>
      )}

      <div className="management-summary-grid">
        <div className="management-summary-card">
          <div className="management-summary-icon">📦</div>
          <div>
            <span>Recorded Inventory</span>
            <strong>{rows.length}</strong>
            <small>Inventory transactions</small>
          </div>
        </div>

        <div className="management-summary-card">
          <div className="management-summary-icon">🍎</div>
          <div>
            <span>Units Purchased</span>
            <strong>{totalUnits.toLocaleString()}</strong>
            <small>Total recorded quantity</small>
          </div>
        </div>

        <div className="management-summary-card">
          <div className="management-summary-icon">💰</div>
          <div>
            <span>Total Inventory Value</span>
            <strong>
              M {totalPurchaseValue.toLocaleString('en-LS', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}
            </strong>
            <small>Quantity × unit purchase price</small>
          </div>
        </div>
      </div>

      <section className="management-card">
        <div className="management-card-heading">
          <div>
            <p className="management-eyebrow">INCOMING STOCK</p>
            <h2>Record New Purchase</h2>
            <p>
              Select the supplier and product, then enter the quantity, unit price and date.
            </p>
          </div>
          <div className="management-heading-icon">🧾</div>
        </div>

        <form className="management-form" onSubmit={addPurchase}>
          <div className="management-form-field">
            <label htmlFor="purchase-supplier">Supplier</label>
            <select
              id="purchase-supplier"
              value={form.SupplierID}
              required
              onChange={(event) =>
                setForm({ ...form, SupplierID: event.target.value })
              }
            >
              <option value="">Select supplier</option>
              {suppliers.map((supplier) => (
                <option
                  key={supplier.SupplierID}
                  value={supplier.SupplierID}
                >
                  {supplier.SupplierName}
                </option>
              ))}
            </select>
          </div>

          <div className="management-form-field">
            <label htmlFor="purchase-product">Product</label>
            <select
              id="purchase-product"
              value={form.ProductID}
              required
              onChange={(event) =>
                setForm({ ...form, ProductID: event.target.value })
              }
            >
              <option value="">Select product</option>
              {products.map((product) => (
                <option key={product.ProductID} value={product.ProductID}>
                  {product.FruitName || product.ProductName || `Product ${product.ProductID}`}
                  {' — '}
                  {product.SizeName || product.Size || `Size ${product.BoxSizeID}`}
                </option>
              ))}
            </select>
          </div>

          <div className="management-form-field">
            <label htmlFor="purchase-quantity">Quantity</label>
            <input
              id="purchase-quantity"
              type="number"
              min="1"
              step="1"
              placeholder="Enter quantity"
              value={form.Quantity}
              required
              onChange={(event) =>
                setForm({ ...form, Quantity: event.target.value })
              }
            />
          </div>

          <div className="management-form-field">
            <label htmlFor="purchase-price">Unit Purchase Price (M)</label>
            <input
              id="purchase-price"
              type="number"
              min="0.01"
              step="0.01"
              placeholder="e.g. 350.00"
              value={form.PurchasePrice}
              required
              onChange={(event) =>
                setForm({ ...form, PurchasePrice: event.target.value })
              }
            />
          </div>

          <div className="management-form-field">
            <label htmlFor="purchase-date">Purchase Date</label>
            <input
              id="purchase-date"
              type="date"
              value={form.PurchaseDate}
              required
              onChange={(event) =>
                setForm({ ...form, PurchaseDate: event.target.value })
              }
            />
          </div>

          <button
            className="crud-btn crud-save"
            type="submit"
            disabled={saving}
          >
            {saving ? 'Recording...' : '+ Record Purchase'}
          </button>
        </form>

        {form.Quantity && form.PurchasePrice &&
          Number(form.Quantity) > 0 &&
          Number(form.PurchasePrice) > 0 && (
            <div className="purchase-estimate">
              <span>Estimated purchase total</span>
              <strong>
                M {(Number(form.Quantity) * Number(form.PurchasePrice))
                  .toLocaleString('en-LS', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
              </strong>
            </div>
          )}
      </section>

      {selectedPurchase && (
        <section className="management-card fruit-detail-card">
          <div className="management-card-heading">
            <div>
              <p className="management-eyebrow">TRANSACTION INFORMATION</p>
              <h2>Purchase Details</h2>
              <p>Full information for this purchase transaction.</p>
            </div>

            <button
              type="button"
              className="crud-btn crud-cancel"
              onClick={() => setSelectedPurchase(null)}
            >
              Close Details ✕
            </button>
          </div>

          <div className="fruit-detail-content">
            <div className="fruit-detail-icon">🧾</div>

            <div className="fruit-detail-grid">
              <div>
                <span>Purchase ID</span>
                <strong>#{selectedPurchase.PurchaseID}</strong>
              </div>
              <div>
                <span>Supplier</span>
                <strong>{supplierName(selectedPurchase)}</strong>
              </div>
              <div>
                <span>Product</span>
                <strong>{productName(selectedPurchase)}</strong>
              </div>
              <div>
                <span>Quantity</span>
                <strong>
                  {Number(selectedPurchase.Quantity).toLocaleString()}
                </strong>
              </div>
              <div>
                <span>Unit Purchase Price</span>
                <strong>
                  M {Number(selectedPurchase.PurchasePrice).toFixed(2)}
                </strong>
              </div>
              <div>
                <span>Total Purchase Value</span>
                <strong>
                  M {purchaseTotal(selectedPurchase).toLocaleString('en-LS', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </strong>
              </div>
              <div>
                <span>Purchase Date</span>
                <strong>
                  {String(selectedPurchase.PurchaseDate || '').slice(0, 10)}
                </strong>
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="management-card">
        <div className="management-card-heading">
          <div>
            <p className="management-eyebrow">PURCHASE HISTORY</p>
            <h2>All Purchases</h2>
            <p>Search and inspect your recorded supplier transactions.</p>
          </div>
          <div className="management-heading-icon">📋</div>
        </div>

        <div className="management-toolbar">
          <div className="management-form-field management-search">
            <label htmlFor="purchase-search">Search Purchases</label>
            <input
              id="purchase-search"
              type="search"
              placeholder="Search ID, supplier, product or date..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </div>

        <div className="management-table-wrapper">
          <table className="management-table">
            <thead>
              <tr>
                <th>Purchase ID</th>
                <th>Supplier</th>
                <th>Product</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Total Value</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="management-empty">
                    Loading purchases...
                  </td>
                </tr>
              ) : visible.length === 0 ? (
                <tr>
                  <td colSpan="8" className="management-empty">
                    No purchases found. Record a purchase or try another search.
                  </td>
                </tr>
              ) : (
                visible.map((purchase) => (
                  <tr key={purchase.PurchaseID}>
                    <td>
                      <strong>#{purchase.PurchaseID}</strong>
                    </td>
                    <td>{supplierName(purchase)}</td>
                    <td>{productName(purchase)}</td>
                    <td>{Number(purchase.Quantity).toLocaleString()}</td>
                    <td>
                      M {Number(purchase.PurchasePrice).toFixed(2)}
                    </td>
                    <td>
                      <strong>
                        M {purchaseTotal(purchase).toLocaleString('en-LS', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </strong>
                    </td>
                    <td>
                      {String(purchase.PurchaseDate || '').slice(0, 10)}
                    </td>
                    <td>
                      <div className="crud-actions">
                        <button
                          type="button"
                          className="crud-btn crud-view"
                          onClick={() => setSelectedPurchase(purchase)}
                        >
                          View
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
          Showing {visible.length} of {rows.length} purchase records
        </div>
      </section>
    </div>
  );
}