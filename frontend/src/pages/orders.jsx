import { useEffect, useState } from 'react';

const API = 'http://localhost:5000/api';
const blank = { VendorID: '', ProductID: '', Quantity: '1' };

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(blank);
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function load() {
    try {
      const [o, v, p] = await Promise.all([
        fetch(`${API}/orders`),
        fetch(`${API}/vendors`),
        fetch(`${API}/products`)
      ]);
      if (!o.ok || !v.ok || !p.ok) {
        throw new Error('Orders API is unavailable or order data could not be loaded.');
      }
      setOrders(await o.json());
      setVendors(await v.json());
      setProducts(await p.json());
    } catch (e) { setError(e.message); }
  }

  useEffect(() => { load(); }, []);

  async function createOrder(e) {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!form.VendorID || !form.ProductID || Number(form.Quantity) < 1) {
      setError('Select a vendor and product, and enter a quantity of at least 1.');
      return;
    }

    try {
      const r = await fetch(`${API}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          VendorID: Number(form.VendorID),
          ProductID: Number(form.ProductID),
          Quantity: Number(form.Quantity)
        })
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.message || 'Could not create order.');
      setForm(blank);
      setMessage('Order submitted successfully.');
      await load();
    } catch (e) { setError(e.message); }
  }

  async function updateStatus(order, status) {
    try {
      const r = await fetch(`${API}/orders/${order.OrderID}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Status: status })
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.message || 'Could not update order status.');
      setMessage(`Order status changed to ${status}.`);
      await load();
    } catch (e) { setError(e.message); }
  }

  const vendorName = o => o.VendorName || vendors.find(v => Number(v.VendorID) === Number(o.VendorID))?.VendorName || `Vendor #${o.VendorID}`;
  const visible = orders.filter(o =>
    `${o.OrderID} ${vendorName(o)} ${o.Status || ''}`
      .toLowerCase().includes(search.toLowerCase())
  );
  const field = { padding: 10, minWidth: 180 };
  const cell = { padding: 10, borderBottom: '1px solid #ddd' };

  return (
    <div style={{ padding: 25 }}>
      <h1>Order Management</h1>
      <p>Create and track orders from registered vendors.</p>
      {message && <p style={{ color: 'green' }}>{message}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <form onSubmit={createOrder} style={{ display: 'flex', flexWrap: 'wrap', gap: 10, padding: 18, background: 'white' }}>
        <select style={field} required value={form.VendorID} onChange={e => setForm({ ...form, VendorID: e.target.value })}>
          <option value="">Select vendor</option>
          {vendors.filter(v => v.Status === 'Active').map(v =>
            <option key={v.VendorID} value={v.VendorID}>{v.VendorName} — {v.BusinessName}</option>
          )}
        </select>
        <select style={field} required value={form.ProductID} onChange={e => setForm({ ...form, ProductID: e.target.value })}>
          <option value="">Select product</option>
          {products.filter(p => p.Status === 'Active').map(p =>
            <option key={p.ProductID} value={p.ProductID}>
              {p.FruitName || p.ProductName || `Product ${p.ProductID}`} — M {Number(p.SellingPrice).toFixed(2)}
            </option>
          )}
        </select>
        <input style={field} type="number" min="1" step="1" required value={form.Quantity}
          onChange={e => setForm({ ...form, Quantity: e.target.value })} />
        <button type="submit">Create Order</button>
      </form>

      <input style={{ ...field, margin: '20px 0' }} placeholder="Search orders..." value={search} onChange={e => setSearch(e.target.value)} />

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white' }}>
          <thead><tr>{['Order ID','Vendor','Order Date','Total','Status','Actions'].map(x => <th key={x} style={cell}>{x}</th>)}</tr></thead>
          <tbody>
            {visible.map(o => <tr key={o.OrderID}>
              <td style={cell}>{o.OrderID}</td>
              <td style={cell}>{vendorName(o)}</td>
              <td style={cell}>{String(o.OrderDate || '').slice(0, 10)}</td>
              <td style={cell}>M {Number(o.TotalAmount ?? o.Total ?? 0).toFixed(2)}</td>
              <td style={cell}>{o.Status || 'Pending'}</td>
              <td style={cell}>
                {o.Status !== 'Completed' && o.Status !== 'Cancelled' && <>
                  <button onClick={() => updateStatus(o, 'Completed')}>Complete</button>
                  <button style={{ marginLeft: 5 }} onClick={() => updateStatus(o, 'Cancelled')}>Cancel</button>
                </>}
              </td>
            </tr>)}
            {visible.length === 0 && <tr><td style={cell} colSpan="6">No orders found.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}