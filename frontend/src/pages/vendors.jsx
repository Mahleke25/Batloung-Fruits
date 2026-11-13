import { useEffect, useState } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap
} from 'react-leaflet';
import L from 'leaflet';

import 'leaflet/dist/leaflet.css';
import './Management.css';
import './Vendors.css';

const API = 'http://localhost:5000/api/vendors';

const blank = {
  VendorName: '',
  BusinessName: '',
  Telephone: '',
  Location: '',
  RegistrationDate: new Date().toISOString().slice(0, 10),
  Status: 'Active'
};

// Custom map markers
const userIcon = L.divIcon({
  className: 'custom-map-marker',
  html: '<div class="map-marker-user">You</div>',
  iconSize: [42, 42],
  iconAnchor: [21, 21]
});

const vendorIcon = L.divIcon({
  className: 'custom-map-marker',
  html: '<div class="map-marker-vendor">V</div>',
  iconSize: [38, 38],
  iconAnchor: [19, 19]
});

// Fit the map around the complete route
function FitRoute({ positions }) {
  const map = useMap();

  useEffect(() => {
    if (positions.length === 2) {
      map.fitBounds(positions, { padding: [45, 45] });
    }
  }, [map, positions]);

  return null;
}

// Get the current browser location
function getCurrentLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Your browser does not support location services.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      position => {
        resolve([
          position.coords.latitude,
          position.coords.longitude
        ]);
      },
      error => {
        if (error.code === 1) {
          reject(new Error('Location permission was denied. Please allow location access in your browser.'));
        } else if (error.code === 2) {
          reject(new Error('Your current location could not be determined.'));
        } else {
          reject(new Error('Location request timed out. Please try again.'));
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 60000
      }
    );
  });
}

// Find a vendor's coordinates from the saved address
async function findVendorCoordinates(location) {
  const address = `${location}, Maseru, Lesotho`;

  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(address)}`
  );

  if (!response.ok) {
    throw new Error('Could not search for the vendor location. Please try again.');
  }

  const results = await response.json();

  if (!results.length) {
    throw new Error(
      `Could not find "${location}". Please enter a more specific vendor address.`
    );
  }

  return [
    Number(results[0].lat),
    Number(results[0].lon)
  ];
}

// Get driving distance, duration and route
async function getDrivingRoute(start, end) {
  const url =
    `https://router.project-osrm.org/route/v1/driving/` +
    `${start[1]},${start[0]};${end[1]},${end[0]}` +
    '?overview=full&geometries=geojson';

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('Could not calculate the driving route.');
  }

  const data = await response.json();

  if (data.code !== 'Ok' || !data.routes?.length) {
    throw new Error('No driving route was found for this vendor.');
  }

  const route = data.routes[0];

  return {
    distance: route.distance / 1000,
    duration: route.duration / 60,
    positions: route.geometry.coordinates.map(
      coordinate => [coordinate[1], coordinate[0]]
    )
  };
}

export default function Vendors() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('All');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  // Map modal states
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [mapLoading, setMapLoading] = useState(false);
  const [mapError, setMapError] = useState('');
  const [mapInfo, setMapInfo] = useState(null);

  async function load() {
    try {
      const response = await fetch(API);

      if (!response.ok) {
        throw new Error('Could not load vendors.');
      }

      setRows(await response.json());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  // Load the map whenever a vendor is selected
  useEffect(() => {
    if (!selectedVendor) return;

    let cancelled = false;

    async function prepareMap() {
      setMapLoading(true);
      setMapError('');
      setMapInfo(null);

      try {
        const [currentLocation, vendorLocation] = await Promise.all([
          getCurrentLocation(),
          findVendorCoordinates(selectedVendor.Location)
        ]);

        if (cancelled) return;

        const route = await getDrivingRoute(
          currentLocation,
          vendorLocation
        );

        if (cancelled) return;

        setMapInfo({
          currentLocation,
          vendorLocation,
          ...route
        });
      } catch (e) {
        if (!cancelled) {
          setMapError(e.message);
        }
      } finally {
        if (!cancelled) {
          setMapLoading(false);
        }
      }
    }

    prepareMap();

    return () => {
      cancelled = true;
    };
  }, [selectedVendor]);

  function change(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  }

  async function save(e) {
    e.preventDefault();
    setError('');
    setMessage('');

    try {
      const response = await fetch(
        editing ? `${API}/${editing}` : API,
        {
          method: editing ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form)
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Could not save vendor.');
      }

      setForm(blank);
      setEditing(null);
      setMessage(editing ? 'Vendor updated.' : 'Vendor added.');
      await load();
    } catch (e) {
      setError(e.message);
    }
  }

  function edit(vendor) {
    setEditing(vendor.VendorID);

    setForm({
      VendorName: vendor.VendorName || '',
      BusinessName: vendor.BusinessName || '',
      Telephone: vendor.Telephone || '',
      Location: vendor.Location || '',
      RegistrationDate: String(vendor.RegistrationDate || '').slice(0, 10),
      Status: vendor.Status || 'Active'
    });

    setMessage('');
    setError('');
  }

  async function remove(vendor) {
    if (!window.confirm(`Delete vendor ${vendor.VendorName}?`)) return;

    try {
      const response = await fetch(
        `${API}/${vendor.VendorID}`,
        { method: 'DELETE' }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Could not delete vendor.');
      }

      setMessage('Vendor deleted.');
      await load();
    } catch (e) {
      setError(e.message);
    }
  }

  function cancelEdit() {
    setEditing(null);
    setForm(blank);
  }

  function closeMap() {
    setSelectedVendor(null);
    setMapInfo(null);
    setMapError('');
  }

  const visible = rows.filter(vendor => {
    const text = [
      vendor.VendorName,
      vendor.BusinessName,
      vendor.Telephone,
      vendor.Location
    ].join(' ').toLowerCase();

    return (
      text.includes(search.toLowerCase()) &&
      (status === 'All' || vendor.Status === status)
    );
  });

  const activeCount = rows.filter(v => v.Status === 'Active').length;

  return (
    <div className="management-page vendors-page">

      {/* Page heading */}
      <div className="management-header">
        <div>
          <p className="management-eyebrow">FRESH MARKET / DISTRIBUTION</p>
          <h1>Vendor Management</h1>
          <p className="management-subtitle">
            Register vendors, manage their details and view their locations.
          </p>
        </div>

        <div className="management-total">
          <span>Total Vendors</span>
          <strong>{rows.length}</strong>
        </div>
      </div>

      {/* Summary */}
      <div className="vendor-summary">
        <div className="vendor-summary-card">
          <span className="vendor-summary-icon">👥</span>
          <div>
            <span>Total Vendors</span>
            <strong>{rows.length}</strong>
          </div>
        </div>

        <div className="vendor-summary-card">
          <span className="vendor-summary-icon">🟢</span>
          <div>
            <span>Active Vendors</span>
            <strong>{activeCount}</strong>
          </div>
        </div>

        <div className="vendor-summary-card">
          <span className="vendor-summary-icon">📍</span>
          <div>
            <span>Locations Registered</span>
            <strong>{rows.filter(v => v.Location).length}</strong>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {message && (
        <div className="management-alert management-alert-success">
          {message}
          <button onClick={() => setMessage('')}>Dismiss</button>
        </div>
      )}

      {error && (
        <div className="management-alert management-alert-error">
          {error}
          <button onClick={() => setError('')}>Dismiss</button>
        </div>
      )}

      {/* Add / Edit form */}
      <section className="management-card">
        <div className="management-card-heading">
          <div>
            <p className="management-eyebrow">VENDOR DETAILS</p>
            <h2>{editing ? 'Edit Vendor' : 'Register New Vendor'}</h2>
            <p>Enter the vendor's business and location information.</p>
          </div>

          <div className="management-heading-icon">🏪</div>
        </div>

        <form className="vendor-form" onSubmit={save}>
          <div className="management-form-field">
            <label>Vendor Name</label>
            <input
              name="VendorName"
              placeholder="Enter vendor name"
              value={form.VendorName}
              onChange={change}
              required
            />
          </div>

          <div className="management-form-field">
            <label>Business Name</label>
            <input
              name="BusinessName"
              placeholder="Enter business name"
              value={form.BusinessName}
              onChange={change}
              required
            />
          </div>

          <div className="management-form-field">
            <label>Telephone</label>
            <input
              name="Telephone"
              placeholder="e.g. 58123456"
              value={form.Telephone}
              onChange={change}
            />
          </div>

          <div className="management-form-field">
            <label>Location / Address</label>
            <input
              name="Location"
              placeholder="e.g. Pioneer Road, Maseru"
              value={form.Location}
              onChange={change}
              required
            />
          </div>

          <div className="management-form-field">
            <label>Registration Date</label>
            <input
              type="date"
              name="RegistrationDate"
              value={form.RegistrationDate}
              onChange={change}
              required
            />
          </div>

          <div className="management-form-field">
            <label>Status</label>
            <select
              name="Status"
              value={form.Status}
              onChange={change}
            >
              <option>Active</option>
              <option>Inactive</option>
            </select>
          </div>

          <div className="vendor-form-actions">
            <button className="vendor-primary-btn" type="submit">
              {editing ? 'Save Changes' : '+ Add Vendor'}
            </button>

            {editing && (
              <button
                className="crud-btn crud-cancel"
                type="button"
                onClick={cancelEdit}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      {/* Search and filters */}
      <section className="management-card">
        <div className="management-card-heading">
          <div>
            <p className="management-eyebrow">DIRECTORY</p>
            <h2>Registered Vendors</h2>
            <p>Search vendors or open their locations on the map.</p>
          </div>
        </div>

        <div className="management-toolbar">
          <div className="management-form-field management-search">
            <label>Search Vendors</label>
            <input
              placeholder="Search by name, business, telephone or location..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div className="management-form-field">
            <label>Filter by Status</label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value)}
            >
              <option>All</option>
              <option>Active</option>
              <option>Inactive</option>
            </select>
          </div>
        </div>

        {loading ? (
          <p>Loading vendors...</p>
        ) : (
          <div className="management-table-wrapper">
            <table className="management-table vendor-table">
              <thead>
                <tr>
                  {[
                    'ID',
                    'Vendor',
                    'Business',
                    'Telephone',
                    'Location',
                    'Registration Date',
                    'Status',
                    'Actions'
                  ].map(heading => (
                    <th key={heading}>{heading}</th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {visible.map(vendor => (
                  <tr key={vendor.VendorID}>
                    <td>{vendor.VendorID}</td>

                    <td><strong>{vendor.VendorName}</strong></td>

                    <td>{vendor.BusinessName}</td>

                    <td>{vendor.Telephone}</td>

                    <td>
                      <span className="vendor-location-text">
                        📍 {vendor.Location}
                      </span>
                    </td>

                    <td>
                      {String(vendor.RegistrationDate || '').slice(0, 10)}
                    </td>

                    <td>
                      <span className={`status-badge ${
                        vendor.Status === 'Active'
                          ? 'status-active'
                          : 'status-inactive'
                      }`}>
                        {vendor.Status}
                      </span>
                    </td>

                    <td>
                      <div className="crud-actions">
                        <button
                          className="crud-btn crud-view"
                          onClick={() => setSelectedVendor(vendor)}
                        >
                          📍 View Map
                        </button>

                        <button
                          className="crud-btn crud-edit"
                          onClick={() => edit(vendor)}
                        >
                          Edit
                        </button>

                        <button
                          className="crud-btn crud-delete"
                          onClick={() => remove(vendor)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {visible.length === 0 && (
                  <tr>
                    <td colSpan="8" className="management-empty">
                      No vendors found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="management-table-footer">
          Showing {visible.length} of {rows.length} vendors.
        </div>
      </section>

      {/* Vendor map modal */}
      {selectedVendor && (
        <div
          className="vendor-modal-overlay"
          onMouseDown={e => {
            if (e.target === e.currentTarget) closeMap();
          }}
        >
          <section
            className="vendor-map-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="vendor-map-title"
          >
            <div className="vendor-modal-header">
              <div>
                <p className="management-eyebrow">VENDOR LOCATION</p>
                <h2 id="vendor-map-title">
                  {selectedVendor.VendorName}
                </h2>
                <p>{selectedVendor.BusinessName}</p>
              </div>

              <button
                className="vendor-modal-close"
                onClick={closeMap}
                aria-label="Close map"
              >
                ×
              </button>
            </div>

            <div className="vendor-modal-address">
              <span>📍</span>
              <div>
                <strong>Destination</strong>
                <p>{selectedVendor.Location}, Maseru, Lesotho</p>
              </div>
            </div>

            {mapLoading && (
              <div className="vendor-map-message">
                <div className="vendor-map-spinner"></div>
                <strong>Finding locations and calculating your route...</strong>
                <p>Please allow location access when your browser asks.</p>
              </div>
            )}

            {mapError && (
              <div className="vendor-map-error">
                <strong>Unable to display the route</strong>
                <p>{mapError}</p>
                <button
                  className="vendor-primary-btn"
                  onClick={() => {
                    const vendor = selectedVendor;
                    setSelectedVendor(null);
                    setTimeout(() => setSelectedVendor(vendor), 0);
                  }}
                >
                  Try Again
                </button>
              </div>
            )}

            {mapInfo && (
              <>
                <div className="vendor-route-summary">
                  <div>
                    <span>🚗 Driving distance</span>
                    <strong>{mapInfo.distance.toFixed(2)} km</strong>
                  </div>

                  <div>
                    <span>⏱ Estimated driving time</span>
                    <strong>
                      {Math.floor(mapInfo.duration / 60) > 0
                        ? `${Math.floor(mapInfo.duration / 60)} hr `
                        : ''}
                      {Math.round(mapInfo.duration % 60)} min
                    </strong>
                  </div>
                </div>

                <div className="vendor-map-container">
                  <MapContainer
                    key={selectedVendor.VendorID}
                    center={mapInfo.currentLocation}
                    zoom={13}
                    scrollWheelZoom
                    className="vendor-leaflet-map"
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    <FitRoute
                      positions={[
                        mapInfo.currentLocation,
                        mapInfo.vendorLocation
                      ]}
                    />

                    <Marker
                      position={mapInfo.currentLocation}
                      icon={userIcon}
                    >
                      <Popup>Your current location</Popup>
                    </Marker>

                    <Marker
                      position={mapInfo.vendorLocation}
                      icon={vendorIcon}
                    >
                      <Popup>
                        <strong>{selectedVendor.VendorName}</strong>
                        <br />
                        {selectedVendor.Location}
                      </Popup>
                    </Marker>

                    <Polyline
                      positions={mapInfo.positions}
                      pathOptions={{
                        color: '#16834a',
                        weight: 6,
                        opacity: 0.85
                      }}
                    />
                  </MapContainer>
                </div>

                <p className="vendor-map-disclaimer">
                  Travel time is an estimate based on the driving route.
                  Actual time may vary with traffic and road conditions.
                </p>
              </>
            )}

            <div className="vendor-modal-footer">
              <span>Map data © OpenStreetMap contributors</span>
              <button
                className="crud-btn crud-cancel"
                onClick={closeMap}
              >
                Close Map
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}