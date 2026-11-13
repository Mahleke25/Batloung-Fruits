import { useCallback, useEffect, useState } from 'react';
import './Management.css';

const API_URL = 'http://localhost:5000/api/boxsizes';

async function readResponse(response) {
  const text = await response.text();

  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

function BoxSizes() {
  const [boxSizes, setBoxSizes] = useState([]);
  const [sizeName, setSizeName] = useState('');
  const [search, setSearch] = useState('');

  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [viewingBoxSize, setViewingBoxSize] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Load box sizes from the database.
  const loadBoxSizes = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(API_URL);
      const data = await readResponse(response);

      if (!response.ok) {
        throw new Error(data.message || 'Failed to load box sizes.');
      }

      const list = Array.isArray(data)
        ? data
        : Array.isArray(data.data)
          ? data.data
          : [];

      setBoxSizes(list);

      // Refresh the open details panel after an update.
      setViewingBoxSize((current) => {
        if (!current) return null;

        return (
          list.find(
            (item) =>
              Number(item.BoxSizeID) === Number(current.BoxSizeID)
          ) || null
        );
      });
    } catch (err) {
      setError(err.message || 'Could not load box sizes.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBoxSizes();
  }, [loadBoxSizes]);

  // Add box size.
  async function addBoxSize(event) {
    event.preventDefault();

    const name = sizeName.trim();

    setMessage('');
    setError('');

    if (!name) {
      setError('Please enter a box size.');
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ SizeName: name }),
      });

      const data = await readResponse(response);

      if (!response.ok) {
        throw new Error(data.message || 'Failed to add box size.');
      }

      setSizeName('');
      setMessage(`${name} box size added successfully.`);
      await loadBoxSizes();
    } catch (err) {
      setError(err.message || 'Could not add box size.');
    } finally {
      setSaving(false);
    }
  }

  // Start editing.
  function startEditing(boxSize) {
    setEditingId(boxSize.BoxSizeID);
    setEditingName(boxSize.SizeName || '');
    setMessage('');
    setError('');
  }

  // Cancel editing.
  function cancelEditing() {
    setEditingId(null);
    setEditingName('');
  }

  // Save edited box size.
  async function saveEdit(id) {
    const name = editingName.trim();

    setMessage('');
    setError('');

    if (!name) {
      setError('Box size cannot be empty.');
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ SizeName: name }),
      });

      const data = await readResponse(response);

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update box size.');
      }

      setEditingId(null);
      setEditingName('');
      setMessage('Box size updated successfully.');
      await loadBoxSizes();
    } catch (err) {
      setError(err.message || 'Could not update box size.');
    } finally {
      setSaving(false);
    }
  }

  // Delete box size.
  async function deleteBoxSize(boxSize) {
    const confirmed = window.confirm(
      `Are you sure you want to delete the ${boxSize.SizeName} box size?`
    );

    if (!confirmed) return;

    setMessage('');
    setError('');
    setDeletingId(boxSize.BoxSizeID);

    try {
      const response = await fetch(
        `${API_URL}/${boxSize.BoxSizeID}`,
        { method: 'DELETE' }
      );

      const data = await readResponse(response);

      if (!response.ok) {
        throw new Error(
          data.message ||
            'Could not delete this box size. It may be linked to existing products.'
        );
      }

      if (
        Number(viewingBoxSize?.BoxSizeID) ===
        Number(boxSize.BoxSizeID)
      ) {
        setViewingBoxSize(null);
      }

      if (Number(editingId) === Number(boxSize.BoxSizeID)) {
        cancelEditing();
      }

      setMessage(`${boxSize.SizeName} deleted successfully.`);
      await loadBoxSizes();
    } catch (err) {
      setError(err.message || 'Could not delete box size.');
    } finally {
      setDeletingId(null);
    }
  }

  // View box-size details.
  function viewBoxSize(boxSize) {
    setViewingBoxSize(boxSize);
    setMessage('');
    setError('');
  }

  // Search box sizes safely.
  const filteredBoxSizes = boxSizes.filter((boxSize) =>
    String(boxSize.SizeName || '')
      .toLowerCase()
      .includes(search.trim().toLowerCase())
  );

  return (
    <div className="management-page">
      <header className="management-header">
        <div>
          <p className="management-eyebrow">BATLOUNG FRUITS</p>
          <h1>Box Size Management 📦</h1>
          <p className="management-subtitle">
            Manage the box sizes available for your fruit products.
          </p>
        </div>

        <div className="management-total">
          <span>Total box sizes</span>
          <strong>{boxSizes.length}</strong>
        </div>
      </header>

      {error && (
        <div
          className="management-alert management-alert-error"
          role="alert"
        >
          <span>{error}</span>
          <button type="button" onClick={() => setError('')}>
            ✕
          </button>
        </div>
      )}

      {message && (
        <div
          className="management-alert management-alert-success"
          role="status"
        >
          <span>{message}</span>
          <button type="button" onClick={() => setMessage('')}>
            ✕
          </button>
        </div>
      )}

      {/* Add box size */}
      <section className="management-card">
        <div className="management-card-heading">
          <div>
            <h2>Add a New Box Size</h2>
            <p>Register a size for packing fruit products.</p>
          </div>
        </div>

        <form className="management-form" onSubmit={addBoxSize}>
          <div className="management-form-field">
            <label htmlFor="sizeName">Box size name</label>
            <input
              id="sizeName"
              type="text"
              placeholder="e.g. Small, Medium, Large"
              value={sizeName}
              onChange={(event) => setSizeName(event.target.value)}
              maxLength={100}
              required
            />
          </div>

          <button
            className="crud-btn crud-save"
            type="submit"
            disabled={saving}
          >
            {saving ? 'Saving...' : '+ Add Box Size'}
          </button>
        </form>
      </section>

      {/* Box-size catalogue */}
      <section className="management-card">
        <div className="management-card-heading">
          <div>
            <h2>Box Size Catalogue</h2>
            <p>View and manage your registered box sizes.</p>
          </div>
        </div>

        <div className="management-toolbar">
          <div className="management-form-field management-search">
            <label htmlFor="boxSizeSearch">Search box sizes</label>
            <input
              id="boxSizeSearch"
              type="search"
              placeholder="Search by size name..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <button
            className="crud-btn crud-cancel"
            type="button"
            onClick={() => setSearch('')}
          >
            Reset search
          </button>
        </div>

        {loading ? (
          <p className="management-empty">Loading box sizes...</p>
        ) : (
          <div className="management-table-wrapper">
            <table className="management-table">
              <thead>
                <tr>
                  <th>Box Size ID</th>
                  <th>Size Name</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredBoxSizes.map((boxSize) => {
                  const editing =
                    Number(editingId) === Number(boxSize.BoxSizeID);

                  const deleting =
                    Number(deletingId) === Number(boxSize.BoxSizeID);

                  return (
                    <tr key={boxSize.BoxSizeID}>
                      <td>#{boxSize.BoxSizeID}</td>

                      <td>
                        {editing ? (
                          <input
                            className="management-inline-input"
                            aria-label="Edit box size name"
                            value={editingName}
                            onChange={(event) =>
                              setEditingName(event.target.value)
                            }
                            onKeyDown={(event) => {
                              if (event.key === 'Enter') {
                                saveEdit(boxSize.BoxSizeID);
                              }

                              if (event.key === 'Escape') {
                                cancelEditing();
                              }
                            }}
                            autoFocus
                          />
                        ) : (
                          <strong>{boxSize.SizeName}</strong>
                        )}
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
                                  saveEdit(boxSize.BoxSizeID)
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
                                onClick={() => viewBoxSize(boxSize)}
                              >
                                👁 View
                              </button>

                              <button
                                className="crud-btn crud-edit"
                                type="button"
                                onClick={() => startEditing(boxSize)}
                              >
                                ✏️ Edit
                              </button>

                              <button
                                className="crud-btn crud-delete"
                                type="button"
                                disabled={deleting}
                                onClick={() => deleteBoxSize(boxSize)}
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

                {filteredBoxSizes.length === 0 && (
                  <tr>
                    <td colSpan="3" className="management-empty">
                      {boxSizes.length === 0
                        ? 'No box sizes have been registered yet.'
                        : 'No box sizes match your search.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="management-table-footer">
          Showing {filteredBoxSizes.length} of {boxSizes.length} box sizes
        </div>
      </section>

      {/* Box-size details */}
      {viewingBoxSize && (
        <section className="management-card">
          <div className="management-card-heading">
            <div>
              <p className="management-eyebrow">BOX SIZE INFORMATION</p>
              <h2>Details: {viewingBoxSize.SizeName}</h2>
            </div>

            <button
              className="crud-btn crud-cancel"
              type="button"
              onClick={() => setViewingBoxSize(null)}
            >
              ✕ Close
            </button>
          </div>

          <div className="fruit-detail-grid">
            <div>
              <span>Box Size ID</span>
              <strong>#{viewingBoxSize.BoxSizeID}</strong>
            </div>

            <div>
              <span>Size Name</span>
              <strong>{viewingBoxSize.SizeName}</strong>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

export default BoxSizes;