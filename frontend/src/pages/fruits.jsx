import { useCallback, useEffect, useState } from 'react';
import { getProducts } from '../services/api';
import './Management.css';

const API_URL = 'http://localhost:5000/api/fruits';

// Safely read JSON responses, including error responses.
async function readResponse(response) {
  const text = await response.text();

  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

function Fruits() {
  const [fruits, setFruits] = useState([]);
  const [fruitName, setFruitName] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');

  const [viewingFruit, setViewingFruit] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingStatusId, setChangingStatusId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Load fruits from the backend.
  const loadFruits = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(API_URL);
      const data = await readResponse(response);

      if (!response.ok) {
        throw new Error(data.message || 'Unable to load fruits.');
      }

      // Support APIs that return either an array or { data: [...] }.
      const fruitList = Array.isArray(data)
        ? data
        : Array.isArray(data.data)
          ? data.data
          : [];

      setFruits(fruitList);
    } catch (err) {
      setError(err.message || 'Unable to load fruits.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFruits();
  }, [loadFruits]);

  // Search and filter.
  const filteredFruits = fruits.filter((fruit) => {
    const matchesSearch = String(fruit.FruitName || '')
      .toLowerCase()
      .includes(search.trim().toLowerCase());

    const matchesStatus =
      statusFilter === 'All' ||
      String(fruit.Status || '').toLowerCase() ===
        statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  // Add a new fruit.
  async function handleAddFruit(event) {
    event.preventDefault();

    if (!fruitName.trim()) {
      setError('Please enter a fruit name.');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          FruitName: fruitName.trim(),
          Status: 'Active',
        }),
      });

      const result = await readResponse(response);

      if (!response.ok) {
        throw new Error(result.message || 'Unable to add fruit.');
      }

      setFruitName('');
      setSuccess('Fruit added successfully!');
      await loadFruits();
    } catch (err) {
      setError(err.message || 'Unable to add fruit.');
    } finally {
      setSaving(false);
    }
  }

  // Start editing.
  function startEditing(fruit) {
    setEditingId(fruit.FruitID);
    setEditingName(fruit.FruitName || '');
    setError('');
    setSuccess('');
  }

  // Cancel editing.
  function cancelEditing() {
    setEditingId(null);
    setEditingName('');
  }

  // Save edited fruit name.
  async function handleUpdateFruit(id) {
    if (!editingName.trim()) {
      setError('Fruit name cannot be empty.');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          FruitName: editingName.trim(),
        }),
      });

      const result = await readResponse(response);

      if (!response.ok) {
        throw new Error(result.message || 'Unable to update fruit.');
      }

      cancelEditing();
      setSuccess('Fruit updated successfully!');
      await loadFruits();
    } catch (err) {
      setError(err.message || 'Unable to update fruit.');
    } finally {
      setSaving(false);
    }
  }

  // Activate or deactivate a fruit.
  async function handleToggleStatus(fruit) {
    if (changingStatusId !== null) return;

    const isActive =
      String(fruit.Status || '').trim().toLowerCase() === 'active';

    const newStatus = isActive ? 'Inactive' : 'Active';
    const fruitId = fruit.FruitID;

    setChangingStatusId(fruitId);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${API_URL}/${fruitId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          Status: newStatus,
        }),
      });

      const result = await readResponse(response);

      if (!response.ok) {
        throw new Error(result.message || 'Unable to change fruit status.');
      }

      // Update the displayed list immediately.
      setFruits((currentFruits) =>
        currentFruits.map((item) =>
          Number(item.FruitID) === Number(fruitId)
            ? { ...item, Status: newStatus }
            : item
        )
      );

      // Update the open details panel if it shows this fruit.
      setViewingFruit((currentFruit) =>
        currentFruit &&
        Number(currentFruit.FruitID) === Number(fruitId)
          ? { ...currentFruit, Status: newStatus }
          : currentFruit
      );

      setSuccess(
        `${fruit.FruitName} ${newStatus === 'Active' ? 'activated' : 'deactivated'} successfully!`
      );

      // Reload to confirm the database's saved state.
      await loadFruits();
    } catch (err) {
      setError(
        `${err.message || 'Unable to change fruit status.'} Check that your backend PUT route updates the Status column.`
      );
    } finally {
      setChangingStatusId(null);
    }
  }

  // Delete a fruit.
  async function handleDeleteFruit(fruit) {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${fruit.FruitName}?`
    );

    if (!confirmed) return;

    setDeletingId(fruit.FruitID);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${API_URL}/${fruit.FruitID}`, {
        method: 'DELETE',
      });

      const result = await readResponse(response);

      if (!response.ok) {
        throw new Error(result.message || 'Unable to delete fruit.');
      }

      if (
        Number(viewingFruit?.FruitID) === Number(fruit.FruitID)
      ) {
        setViewingFruit(null);
        setRelatedProducts([]);
      }

      setSuccess(`${fruit.FruitName} deleted successfully!`);
      await loadFruits();
    } catch (err) {
      setError(err.message || 'Unable to delete fruit.');
    } finally {
      setDeletingId(null);
    }
  }

  // View fruit details and associated products.
  async function handleViewFruit(fruit) {
    setViewingFruit(fruit);
    setRelatedProducts([]);
    setLoadingProducts(true);
    setError('');

    try {
      const response = await getProducts();

      // Support services returning an array or { data: [...] }.
      const products = Array.isArray(response)
        ? response
        : Array.isArray(response?.data)
          ? response.data
          : [];

      const matchingProducts = products.filter(
        (product) =>
          Number(product.FruitID) === Number(fruit.FruitID)
      );

      setRelatedProducts(matchingProducts);
    } catch (err) {
      setError(
        'Fruit details loaded, but related products could not be retrieved. Check the products API.'
      );
      setRelatedProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  }

  return (
    <div className="management-page">
      <header className="management-header">
        <div>
          <p className="management-eyebrow">BATLOUNG FRUITS</p>
          <h1>Fruit Management 🍎</h1>
          <p className="management-subtitle">
            Manage fruit types, names and availability.
          </p>
        </div>

        <div className="management-total">
          <span>Total fruits</span>
          <strong>{fruits.length}</strong>
        </div>
      </header>

      {error && (
        <div
          className="management-alert management-alert-error"
          role="alert"
        >
          <span>{error}</span>
          <button
            type="button"
            aria-label="Dismiss error"
            onClick={() => setError('')}
          >
            ✕
          </button>
        </div>
      )}

      {success && (
        <div
          className="management-alert management-alert-success"
          role="status"
        >
          <span>{success}</span>
          <button
            type="button"
            aria-label="Dismiss success message"
            onClick={() => setSuccess('')}
          >
            ✕
          </button>
        </div>
      )}

      {/* Add fruit */}
      <section className="management-card">
        <div className="management-card-heading">
          <div>
            <h2>Add a New Fruit</h2>
            <p>Register another fruit in your catalogue.</p>
          </div>
        </div>

        <form className="management-form" onSubmit={handleAddFruit}>
          <div className="management-form-field">
            <label htmlFor="fruitName">Fruit name</label>
            <input
              id="fruitName"
              type="text"
              placeholder="e.g. Pineapple"
              value={fruitName}
              onChange={(event) => setFruitName(event.target.value)}
              maxLength={100}
              required
            />
          </div>

          <button
            className="crud-btn crud-save"
            type="submit"
            disabled={saving}
          >
            {saving ? 'Saving...' : '+ Add Fruit'}
          </button>
        </form>
      </section>

      {/* Fruit catalogue */}
      <section className="management-card">
        <div className="management-card-heading">
          <div>
            <h2>Fruit Catalogue</h2>
            <p>Search, view and manage your registered fruits.</p>
          </div>
        </div>

        <div className="management-toolbar">
          <div className="management-form-field management-search">
            <label htmlFor="fruitSearch">Search fruits</label>
            <input
              id="fruitSearch"
              type="search"
              placeholder="Search by fruit name..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <div className="management-form-field">
            <label htmlFor="statusFilter">Filter by status</label>
            <select
              id="statusFilter"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="All">All statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <button
            className="crud-btn crud-cancel"
            type="button"
            onClick={() => {
              setSearch('');
              setStatusFilter('All');
            }}
          >
            Reset filters
          </button>
        </div>

        {loading ? (
          <p className="management-empty">Loading fruits...</p>
        ) : (
          <div className="management-table-wrapper">
            <table className="management-table">
              <thead>
                <tr>
                  <th>Fruit ID</th>
                  <th>Fruit Name</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredFruits.map((fruit) => {
                  const active =
                    String(fruit.Status || '').trim().toLowerCase() ===
                    'active';

                  const changing =
                    Number(changingStatusId) === Number(fruit.FruitID);

                  const deleting =
                    Number(deletingId) === Number(fruit.FruitID);

                  const editing =
                    Number(editingId) === Number(fruit.FruitID);

                  return (
                    <tr key={fruit.FruitID}>
                      <td>#{fruit.FruitID}</td>

                      <td>
                        {editing ? (
                          <input
                            className="management-inline-input"
                            aria-label="Edit fruit name"
                            value={editingName}
                            onChange={(event) =>
                              setEditingName(event.target.value)
                            }
                            onKeyDown={(event) => {
                              if (event.key === 'Enter') {
                                handleUpdateFruit(fruit.FruitID);
                              }
                              if (event.key === 'Escape') {
                                cancelEditing();
                              }
                            }}
                          />
                        ) : (
                          <strong>{fruit.FruitName}</strong>
                        )}
                      </td>

                      <td>
                        <span
                          className={`status-badge ${
                            active
                              ? 'status-active'
                              : 'status-inactive'
                          }`}
                        >
                          {fruit.Status || 'Unknown'}
                        </span>
                      </td>

                      <td>
                        <div className="crud-actions">
                          {editing ? (
                            <>
                              <button
                                className="crud-btn crud-save"
                                type="button"
                                disabled={saving}
                                onClick={() =>
                                  handleUpdateFruit(fruit.FruitID)
                                }
                              >
                                {saving ? 'Saving...' : 'Save'}
                              </button>

                              <button
                                className="crud-btn crud-cancel"
                                type="button"
                                disabled={saving}
                                onClick={cancelEditing}
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                className="crud-btn crud-view"
                                type="button"
                                onClick={() => handleViewFruit(fruit)}
                              >
                                👁 View
                              </button>

                              <button
                                className="crud-btn crud-edit"
                                type="button"
                                onClick={() => startEditing(fruit)}
                              >
                                ✏️ Edit
                              </button>

                              <button
                                className={`crud-btn ${
                                  active ? 'crud-activate' : 'crud-save'
                                }`}
                                type="button"
                                disabled={changing || deleting}
                                onClick={() => handleToggleStatus(fruit)}
                              >
                                {changing
                                  ? 'Updating...'
                                  : active
                                    ? 'Deactivate'
                                    : 'Activate'}
                              </button>

                              <button
                                className="crud-btn crud-delete"
                                type="button"
                                disabled={deleting || changing}
                                onClick={() => handleDeleteFruit(fruit)}
                              >
                                {deleting ? 'Deleting...' : '🗑 Delete'}
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredFruits.length === 0 && (
                  <tr>
                    <td colSpan="4" className="management-empty">
                      {fruits.length === 0
                        ? 'No fruits have been registered yet.'
                        : 'No fruits match your search or status filter.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="management-table-footer">
          Showing {filteredFruits.length} of {fruits.length} fruits
        </div>
      </section>

      {/* Fruit details */}
      {viewingFruit && (
        <section className="management-card fruit-detail-card">
          <div className="management-card-heading">
            <div>
              <p className="management-eyebrow">FRUIT INFORMATION</p>
              <h2>Details: {viewingFruit.FruitName}</h2>
            </div>

            <button
              className="crud-btn crud-cancel"
              type="button"
              onClick={() => {
                setViewingFruit(null);
                setRelatedProducts([]);
              }}
            >
              ✕ Close
            </button>
          </div>

          <div className="fruit-detail-grid">
            <div>
              <span>Fruit ID</span>
              <strong>#{viewingFruit.FruitID}</strong>
            </div>

            <div>
              <span>Fruit Name</span>
              <strong>{viewingFruit.FruitName}</strong>
            </div>

            <div>
              <span>Status</span>
              <strong>{viewingFruit.Status}</strong>
            </div>

            <div>
              <span>Related Products</span>
              <strong>
                {loadingProducts ? 'Loading...' : relatedProducts.length}
              </strong>
            </div>
          </div>

          <h3>Products using this fruit</h3>

          {loadingProducts ? (
            <p className="management-empty">
              Loading related products...
            </p>
          ) : relatedProducts.length === 0 ? (
            <p className="management-empty">
              No related products found for this fruit.
            </p>
          ) : (
            <div className="management-table-wrapper">
              <table className="management-table">
                <thead>
                  <tr>
                    <th>Product ID</th>
                    <th>Product Name</th>
                    <th>Selling Price</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {relatedProducts.map((product) => (
                    <tr key={product.ProductID}>
                      <td>#{product.ProductID}</td>
                      <td>
                        {product.ProductName ||
                          product.FruitName ||
                          viewingFruit.FruitName}
                        {product.SizeName
                          ? ` - ${product.SizeName}`
                          : ''}
                      </td>
                      <td>
                        {product.SellingPrice != null
                          ? `M ${Number(product.SellingPrice).toFixed(2)}`
                          : 'Not set'}
                      </td>
                      <td>{product.Status || 'Unknown'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

export default Fruits;