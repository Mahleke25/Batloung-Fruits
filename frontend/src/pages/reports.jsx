import { useEffect, useState } from 'react';

const API = 'http://localhost:5000/api';

export default function Reports() {
  const [data, setData] = useState({
    fruits: [], suppliers: [], vendors: [], products: [],
    purchases: [], orders: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadReports() {
      try {
        const names = [
          'fruits', 'suppliers', 'vendors',
          'products', 'purchases', 'orders'
        ];
        const results = await Promise.all(
          names.map(async name => {
            const response = await fetch(`${API}/${name}`);
            if (!response.ok) {
              if (name === 'orders') {
                throw new Error('Reports are not available yet.');
              }
              throw new Error(`Could not load ${name}.`);
            }
            return [name, await response.json()];
          })
        );
        setData(Object.fromEntries(results));
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    loadReports();
  }, []);

  if (loading) return <div style={{ padding: 25 }}><h1>Reports</h1><p>Loading reports...</p></div>;

  const completed = data.orders.filter(o =>
    String(o.Status || '').toLowerCase() === 'completed'
  );
  const totalSales = completed.reduce(
    (sum, o) => sum + Number(o.TotalAmount ?? o.Total ?? 0), 0
  );
  const totalPurchases = data.purchases.reduce(
    (sum, p) => sum + Number(p.Quantity || 0) * Number(p.PurchasePrice || 0), 0
  );

  const cards = [
    ['Registered Fruits', data.fruits.length],
    ['Active Vendors', data.vendors.filter(v => v.Status === 'Active').length],
    ['Registered Suppliers', data.suppliers.length],
    ['Registered Products', data.products.length],
    ['Purchase Records', data.purchases.length],
    ['Completed Orders', completed.length],
    ['Completed Sales Value', `M ${totalSales.toFixed(2)}`],
    ['Purchase Value', `M ${totalPurchases.toFixed(2)}`]
  ];

  const cell = { padding: 10, borderBottom: '1px solid #ddd', textAlign: 'left' };

  return (
    <div style={{ padding: 25 }}>
      <h1>Business Reports</h1>
      <p>Summary of registered records, purchases and completed sales.</p>
      {error && <p style={{ color: '#b91c1c' }}>{error}</p>}

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
        gap: 16,
        margin: '25px 0'
      }}>
        {cards.map(([title, value]) => (
          <div key={title} style={{
            padding: 20, background: 'white',
            borderRadius: 10, border: '1px solid #eee'
          }}>
            <p style={{ color: '#666', marginTop: 0 }}>{title}</p>
            <h2 style={{ marginBottom: 0 }}>{value}</h2>
          </div>
        ))}
      </div>

      <h2>Purchase Summary</h2>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white' }}>
          <thead><tr>
            {['Purchase ID', 'Supplier ID', 'Product ID', 'Quantity', 'Unit Price', 'Line Total', 'Date'].map(h =>
              <th key={h} style={cell}>{h}</th>)}
          </tr></thead>
          <tbody>
            {data.purchases.map(p => (
              <tr key={p.PurchaseID}>
                <td style={cell}>{p.PurchaseID}</td>
                <td style={cell}>{p.SupplierID}</td>
                <td style={cell}>{p.ProductID}</td>
                <td style={cell}>{p.Quantity}</td>
                <td style={cell}>M {Number(p.PurchasePrice).toFixed(2)}</td>
                <td style={cell}>M {(Number(p.Quantity) * Number(p.PurchasePrice)).toFixed(2)}</td>
                <td style={cell}>{String(p.PurchaseDate || '').slice(0, 10)}</td>
              </tr>
            ))}
            {data.purchases.length === 0 && <tr><td style={cell} colSpan="7">No purchases recorded.</td></tr>}
          </tbody>
        </table>
      </div>

      <h2 style={{ marginTop: 30 }}>Order Summary</h2>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white' }}>
          <thead><tr>
            {['Order ID', 'Vendor ID', 'Date', 'Status', 'Total'].map(h =>
              <th key={h} style={cell}>{h}</th>)}
          </tr></thead>
          <tbody>
            {data.orders.map(o => (
              <tr key={o.OrderID}>
                <td style={cell}>{o.OrderID}</td>
                <td style={cell}>{o.VendorID}</td>
                <td style={cell}>{String(o.OrderDate || '').slice(0, 10)}</td>
                <td style={cell}>{o.Status}</td>
                <td style={cell}>M {Number(o.TotalAmount ?? o.Total ?? 0).toFixed(2)}</td>
              </tr>
            ))}
            {data.orders.length === 0 && <tr><td style={cell} colSpan="5">No orders recorded.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}