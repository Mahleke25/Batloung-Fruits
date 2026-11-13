
import { useEffect, useState } from 'react';
import './Management.css';
import './Suppliers.css';

const API_URL = 'http://localhost:5000/api/suppliers';

const provinces = [
  'Eastern Cape',
  'Free State',
  'Gauteng',
  'KwaZulu-Natal',
  'Limpopo',
  'Mpumalanga',
  'North West',
  'Northern Cape',
  'Western Cape'
];

const emptySupplier = {
  SupplierName: '',
  Province: '',
  ContactPerson: '',
  Telephone: '',
  Email: '',
  PhysicalAddress: ''
};

function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [form, setForm] = useState(emptySupplier);
  const [search, setSearch] = useState('');
  const [provinceFilter, setProvinceFilter] = useState('All');
  const [editingId, setEditingId] = useState(null);
  const [viewingSupplier, setViewingSupplier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function loadSuppliers() {
    try {
      setError('');

      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error('Failed to load suppliers.');
      }

      const data = await response.json();
      setSuppliers(Array.isArray(data) ? data : []);
    } catch {
      setError(
        'Could not load suppliers. Please check that your backend is running.'
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSuppliers();
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value
    }));
  }

  async function saveSupplier(event) {
    event.preventDefault();

    setMessage('');
    setError('');

    const payload = {
      SupplierName: form.SupplierName.trim(),
      Province: form.Province,
      ContactPerson: form.ContactPerson.trim(),
      Telephone: form.Telephone.trim(),
      Email: form.Email.trim(),
      PhysicalAddress: form.PhysicalAddress.trim()
    };

    if (
      !payload.SupplierName ||
      !payload.Province ||
      !payload.ContactPerson
    ) {
      setError(
        'Please enter the supplier name, province and contact person.'
      );
      return;
    }

    try {
      setSaving(true);

      const url = editingId
        ? `${API_URL}/${editingId}`
        : API_URL;

      const response = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message ||
            (editingId
              ? 'Failed to update supplier.'
              : 'Failed to add supplier.')
        );
      }

      setMessage(
        editingId
          ? 'Supplier updated successfully.'
          : 'Supplier added successfully.'
      );

      setForm(emptySupplier);
      setEditingId(null);

      await loadSuppliers();
    } catch (err) {
      setError(err.message || 'Could not save supplier.');
    } finally {
      setSaving(false);
    }
  }

  function startEditing(supplier) {
    setEditingId(supplier.SupplierID);

    setForm({
      SupplierName: supplier.SupplierName || '',
      Province: supplier.Province || '',
      ContactPerson: supplier.ContactPerson || '',
      Telephone: supplier.Telephone || '',
      Email: supplier.Email || '',
      PhysicalAddress: supplier.PhysicalAddress || ''
    });

    setViewingSupplier(null);
    setMessage('');
    setError('');

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function cancelEditing() {
    setEditingId(null);
    setForm(emptySupplier);
    setMessage('');
    setError('');
  }

  async function deleteSupplier(supplier) {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${supplier.SupplierName}?`
    );

    if (!confirmed) return;

    setMessage('');
    setError('');

    try {
      const response = await fetch(
        `${API_URL}/${supplier.SupplierID}`,
        { method: 'DELETE' }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message ||
            'Could not delete supplier. It may be linked to purchases.'
        );
      }

      setMessage('Supplier deleted successfully.');
      setViewingSupplier(null);

      if (editingId === supplier.SupplierID) {
        cancelEditing();
      }

      await loadSuppliers();
    } catch (err) {
      setError(err.message || 'Could not delete supplier.');
    }
  }

  const filteredSuppliers = suppliers.filter((supplier) => {
    const term = search.trim().toLowerCase();

    const matchesSearch = [
      supplier.SupplierName,
      supplier.ContactPerson,
      supplier.Telephone,
      supplier.Email,
      supplier.PhysicalAddress,
      supplier.Province
    ].some((value) =>
      String(value || '').toLowerCase().includes(term)
    );

    const matchesProvince =
      provinceFilter === 'All' ||
      supplier.Province === provinceFilter;

    return matchesSearch && matchesProvince;
  });

  return (
    <main className="suppliers-page">
      <section className="suppliers-heading">
        <div>
          <span className="suppliers-eyebrow">
            FRESH MARKET • PARTNERS
          </span>

          <h1>Supplier Management</h1>

          <p>
            Manage the trusted partners who keep our fruit market fresh.
          </p>
        </div>

        <div className="supplier-heading-icon" aria-hidden="true">
          🍊
        </div>
      </section>

      {message && (
        <div className="supplier-alert supplier-success" role="status">
          <span>✓</span> {message}
        </div>
      )}

      {error && (
        <div className="supplier-alert supplier-error" role="alert">
          <span>!</span> {error}
        </div>
      )}

      <section className="supplier-form-card">
        <div className="supplier-section-heading">
          <div>
            <span className="supplier-section-label">
              SUPPLIER DIRECTORY
            </span>

            <h2>
              {editingId ? 'Edit Supplier' : 'Add New Supplier'}
            </h2>

            <p>
              Fields marked with * are required.
            </p>
          </div>

          <div className="supplier-form-icon" aria-hidden="true">
            {editingId ? '✏️' : '🌱'}
          </div>
        </div>

        <form onSubmit={saveSupplier} className="supplier-form">
          <div className="supplier-field">
            <label htmlFor="SupplierName">Supplier name *</label>
            <input
              id="SupplierName"
              name="SupplierName"
              placeholder="Enter supplier name"
              value={form.SupplierName}
              onChange={handleChange}
              required
            />
          </div>

          <div className="supplier-field">
            <label htmlFor="Province">Province *</label>
            <select
              id="Province"
              name="Province"
              value={form.Province}
              onChange={handleChange}
              required
            >
              <option value="">Select province</option>

              {provinces.map((province) => (
                <option key={province} value={province}>
                  {province}
                </option>
              ))}
            </select>
          </div>

          <div className="supplier-field">
            <label htmlFor="ContactPerson">Contact person *</label>
            <input
              id="ContactPerson"
              name="ContactPerson"
              placeholder="Enter contact person"
              value={form.ContactPerson}
              onChange={handleChange}
              required
            />
          </div>

          <div className="supplier-field">
            <label htmlFor="Telephone">Telephone</label>
            <input
              id="Telephone"
              name="Telephone"
              type="tel"
              placeholder="Enter telephone number"
              value={form.Telephone}
              onChange={handleChange}
            />
          </div>

          <div className="supplier-field">
            <label htmlFor="Email">Email address</label>
            <input
              id="Email"
              name="Email"
              type="email"
              placeholder="supplier@example.com"
              value={form.Email}
              onChange={handleChange}
            />
          </div>

          <div className="supplier-field">
            <label htmlFor="PhysicalAddress">Physical address</label>
            <input
              id="PhysicalAddress"
              name="PhysicalAddress"
              placeholder="Enter physical address"
              value={form.PhysicalAddress}
              onChange={handleChange}
            />
          </div>

          <div className="supplier-form-actions">
            <button
              type="submit"
              className="supplier-btn supplier-btn-primary"
              disabled={saving}
            >
              {saving
                ? 'Saving...'
                : editingId
                  ? '✓ Save Changes'
                  : '+ Add Supplier'}
            </button>

            {editingId && (
              <button
                type="button"
                className="supplier-btn supplier-btn-neutral"
                onClick={cancelEditing}
                disabled={saving}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="supplier-directory">
        <div className="supplier-directory-heading">
          <div>
            <span className="supplier-section-label">
              YOUR BUSINESS NETWORK
            </span>

            <h2>Registered Suppliers</h2>

            <p>Search, view and manage your supplier records.</p>
          </div>

          <div className="supplier-count">
            <strong>{filteredSuppliers.length}</strong>
            <span>
              {filteredSuppliers.length === 1
                ? 'Supplier'
                : 'Suppliers'}
            </span>
          </div>
        </div>

        <div className="supplier-filters">
          <div className="supplier-search">
            <span aria-hidden="true">⌕</span>
            <input
              type="search"
              aria-label="Search suppliers"
              placeholder="Search name, contact, email..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <select
            aria-label="Filter suppliers by province"
            value={provinceFilter}
            onChange={(event) =>
              setProvinceFilter(event.target.value)
            }
          >
            <option value="All">All provinces</option>

            {provinces.map((province) => (
              <option key={province} value={province}>
                {province}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="supplier-empty-state">
            <span className="supplier-loading-icon">⟳</span>
            <h3>Loading suppliers...</h3>
            <p>Please wait while we retrieve your records.</p>
          </div>
        ) : filteredSuppliers.length === 0 ? (
          <div className="supplier-empty-state">
            <span className="supplier-empty-icon">🍃</span>
            <h3>No suppliers found</h3>
            <p>
              Try a different search or add a new supplier using the form
              above.
            </p>
          </div>
        ) : (
          <div className="supplier-table-wrapper">
            <table className="supplier-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Supplier</th>
                  <th>Province</th>
                  <th>Contact person</th>
                  <th>Telephone</th>
                  <th>Email</th>
                  <th>Address</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredSuppliers.map((supplier) => (
                  <tr key={supplier.SupplierID}>
                    <td>
                      <span className="supplier-id">
                        #{supplier.SupplierID}
                      </span>
                    </td>

                    <td>
                      <strong className="supplier-name">
                        {supplier.SupplierName || '—'}
                      </strong>
                    </td>

                    <td>
                      <span className="supplier-province">
                        {supplier.Province || '—'}
                      </span>
                    </td>

                    <td>{supplier.ContactPerson || '—'}</td>
                    <td>{supplier.Telephone || '—'}</td>
                    <td>{supplier.Email || '—'}</td>
                    <td>{supplier.PhysicalAddress || '—'}</td>

                    <td>
                      <div className="supplier-row-actions">
                        <button
                          type="button"
                          className="supplier-action supplier-view"
                          onClick={() => setViewingSupplier(supplier)}
                        >
                          View
                        </button>

                        <button
                          type="button"
                          className="supplier-action supplier-edit"
                          onClick={() => startEditing(supplier)}
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          className="supplier-action supplier-delete"
                          onClick={() => deleteSupplier(supplier)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="supplier-table-footer">
          Showing <strong>{filteredSuppliers.length}</strong> of{' '}
          <strong>{suppliers.length}</strong> registered suppliers
        </div>
      </section>

      {viewingSupplier && (
        <div
          className="supplier-modal-backdrop"
          onClick={() => setViewingSupplier(null)}
        >
          <section
            className="supplier-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="supplier-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="supplier-modal-header">
              <div className="supplier-modal-icon">🍊</div>

              <button
                type="button"
                className="supplier-modal-close"
                aria-label="Close supplier details"
                onClick={() => setViewingSupplier(null)}
              >
                ×
              </button>

              <span className="supplier-section-label">
                SUPPLIER PROFILE
              </span>

              <h2 id="supplier-modal-title">
                {viewingSupplier.SupplierName}
              </h2>

              <p>
                Supplier ID #{viewingSupplier.SupplierID}
              </p>
            </div>

            <div className="supplier-details-grid">
              <div className="supplier-detail">
                <span>Province</span>
                <strong>{viewingSupplier.Province || 'Not provided'}</strong>
              </div>

              <div className="supplier-detail">
                <span>Contact person</span>
                <strong>
                  {viewingSupplier.ContactPerson || 'Not provided'}
                </strong>
              </div>

              <div className="supplier-detail">
                <span>Telephone</span>
                <strong>{viewingSupplier.Telephone || 'Not provided'}</strong>
              </div>

              <div className="supplier-detail">
                <span>Email address</span>
                <strong>{viewingSupplier.Email || 'Not provided'}</strong>
              </div>

              <div className="supplier-detail supplier-detail-wide">
                <span>Physical address</span>
                <strong>
                  {viewingSupplier.PhysicalAddress || 'Not provided'}
                </strong>
              </div>
            </div>

            <div className="supplier-modal-actions">
              <button
                type="button"
                className="supplier-btn supplier-btn-primary"
                onClick={() => startEditing(viewingSupplier)}
              >
                ✏️ Edit Supplier
              </button>

              <button
                type="button"
                className="supplier-btn supplier-btn-neutral"
                onClick={() => setViewingSupplier(null)}
              >
                Close
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

export default Suppliers;
