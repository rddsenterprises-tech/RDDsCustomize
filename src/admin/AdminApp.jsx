import React, { useEffect, useMemo, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { LogOut, RefreshCw, Search, PackageCheck, Clock3, Banknote, Truck, CreditCard, ShieldCheck, Settings, ChevronDown, Boxes, FileText, Download, MessageCircle } from 'lucide-react';
import ProductManager from './ProductManager';
import AdminLiveChats from './AdminLiveChats';
import AdminVisitors from './AdminVisitors';

const money = n => `Rs. ${Number(n || 0).toLocaleString('en-PK')}`;
const statuses = ['New','Confirmed','Processing','Dispatched','Completed','Cancelled'];

export default function AdminApp() {
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('All');
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState('orders');
  const [receiptOrder, setReceiptOrder] = useState(null);
  const [reportFrom, setReportFrom] = useState('');
  const [reportTo, setReportTo] = useState('');
  const [reportCity, setReportCity] = useState('All');
  const [reportStatus, setReportStatus] = useState('All');

  useEffect(() => {
    if (!supabase) return;
    const acceptSession = async next => {
      if (next && next.user?.app_metadata?.app_role !== 'admin') {
        setSession(null);
        setError('This account is not authorized for the admin panel.');
        await supabase.auth.signOut();
        return;
      }
      setSession(next);
    };
    supabase.auth.getSession().then(({data}) => acceptSession(data.session));
    const {data:{subscription}} = supabase.auth.onAuthStateChange((_event,next) => {
      if (!next || next.user?.app_metadata?.app_role === 'admin') setSession(next);
      else {
        setSession(null);
        setError('This account is not authorized for the admin panel.');
        supabase.auth.signOut();
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const loadOrders = async () => {
    if (!supabase || !session) return;
    setLoading(true); setError('');
    const {data,error:err} = await supabase.from('orders').select('*').order('created_at',{ascending:false}).limit(500);
    if (err) setError(err.message); else setOrders(data || []);
    setLoading(false);
  };
  useEffect(() => { if (session) loadOrders(); }, [session]);

  const login = async e => {
    e.preventDefault(); setError('');
    if (!supabase) return setError('Supabase connection is not configured yet.');
    const {data,error:err} = await supabase.auth.signInWithPassword({email,password});
    if (err) setError(err.message);
    else if (data.user?.app_metadata?.app_role !== 'admin') {
      setError('This account is not authorized for the admin panel.');
      await supabase.auth.signOut();
    }
  };
  const updatePaymentStatus = async (id,payment_status) => {
    const {error:err} = await supabase.from('orders').update({payment_status}).eq('id',id);
    if (err) setError(err.message); else setOrders(old => old.map(o => o.id === id ? {...o,payment_status} : o));
  };
  const updateStatus = async (id,status) => {
    const {error:err} = await supabase.from('orders').update({status}).eq('id',id);
    if (err) setError(err.message); else setOrders(old => old.map(o => o.id === id ? {...o,status} : o));
  };
  const visible = useMemo(() => orders.filter(o =>
    (filter === 'All' || o.status === filter) &&
    [o.order_number,o.customer_name,o.phone,o.city].join(' ').toLowerCase().includes(query.toLowerCase())
  ),[orders,filter,query]);
  const reportCities = useMemo(() => ['All', ...new Set(orders.map(o => (o.city || '').trim()).filter(Boolean).sort())],[orders]);
  const reportOrders = useMemo(() => orders.filter(o => {
    const d = new Date(o.created_at);
    const fromOK = !reportFrom || d >= new Date(reportFrom + 'T00:00:00');
    const toOK = !reportTo || d <= new Date(reportTo + 'T23:59:59');
    return fromOK && toOK && (reportCity === 'All' || o.city === reportCity) && (reportStatus === 'All' || o.status === reportStatus);
  }),[orders,reportFrom,reportTo,reportCity,reportStatus]);
  const reportTotal = reportOrders.reduce((sum,o)=>sum+Number(o.total||0),0);
  const reportDelivery = reportOrders.reduce((sum,o)=>sum+Number(o.delivery_fee||0),0);
  const printReceipt = () => {
    const receipt = document.querySelector('.admin-receipt-modal');
    if (!receipt) return;
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) {
      window.print();
      return;
    }
    printWindow.document.open();
    printWindow.document.write(`<!doctype html><html><head><title>Order Receipt</title><style>
      @page{size:A4;margin:14mm}
      *{box-sizing:border-box}
      body{margin:0;background:#fff;color:#172331;font-family:Arial,sans-serif}
      .receipt-modal{width:100%;max-width:720px;margin:0 auto;padding:0;color:#172331}
      .receipt-brand{display:flex;align-items:center;gap:12px;border-bottom:2px solid #d8e7f2;padding-bottom:16px}
      .receipt-brand>span{font-size:34px;color:#178bd0}
      .receipt-brand div{display:grid;gap:4px}
      .receipt-brand b{font-size:18px;letter-spacing:1.5px;color:#102c42}
      .receipt-brand small{font-size:10px;letter-spacing:2px;color:#648096}
      .receipt-meta{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:16px 0;padding:13px;background:#f2f7fa}
      .receipt-meta div{display:grid;gap:5px}.receipt-meta small{font-size:10px;color:#607789}.receipt-meta b{font-size:13px;color:#15364e}
      h3{font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#547187;margin:18px 0 8px}
      p{font-size:12px;line-height:1.7;color:#263b4a;overflow-wrap:anywhere}
      .receipt-items>div,.receipt-totals>div{display:flex;justify-content:space-between;gap:12px;padding:9px 0;border-bottom:1px solid #e7edf1;font-size:12px;color:#263b4a}
      .receipt-items b,.receipt-totals b{color:#132f43;white-space:nowrap}
      .receipt-totals{margin-top:12px}.receipt-grand{border-top:2px solid #183d56;font-size:15px!important;font-weight:800}
      .receipt-grand b{color:#087fc1;font-size:17px}
      .receipt-payment{margin-top:15px;padding:12px;background:#eef6fb;border-left:3px solid #168bd0;color:#234b64;font-size:11px;line-height:1.7}
      .receipt-actions{display:none!important}
    </style></head><body>${receipt.outerHTML}</body></html>`);
    printWindow.document.close();
    window.setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 350);
  };

  const exportReport = () => {
    const headers = ['Order Number','Date','Customer','Phone','City','Status','Payment Method','Payment Status','Subtotal','Delivery Fee','Total'];
    const rows = reportOrders.map(o => [o.order_number,new Date(o.created_at).toLocaleString('en-PK'),o.customer_name,o.phone,o.city,o.status,o.payment_method,o.payment_status,o.subtotal,o.delivery_fee,o.total]);
    const csv = [headers,...rows].map(row => row.map(v => '"' + String(v ?? '').replace(/"/g,'""') + '"').join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8;'}));
    const link = document.createElement('a'); link.href = url; link.download = 'rdds-customized-orders-report.csv'; link.click(); URL.revokeObjectURL(url);
  };
  const stats = [
    ['Total orders',orders.length,PackageCheck],
    ['New orders',orders.filter(o=>o.status==='New').length,Clock3],
    ['In progress',orders.filter(o=>['Confirmed','Processing','Dispatched'].includes(o.status)).length,Truck],
    ['COD orders',orders.filter(o=>o.payment_method==='cod').length,Banknote]
  ];

  if (!session) return <main className="admin-login-page">
    <form className="admin-login-card" onSubmit={login}>
      <div className="admin-logo-mark">✦</div>
      <p className="admin-eyebrow">RDDS CUSTOMIZED · CONTROL PANEL</p>
      <h1>Welcome back</h1>
      <p className="login-subtitle">Sign in to manage customer orders and payments.</p>
      {!isSupabaseConfigured && <div className="admin-alert">Supabase connection is not configured. Add the project environment variables in Vercel to enable admin login.</div>}
      {error && <div className="admin-error">{error}</div>}
      <label>Email address<input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="Admin email"/></label>
      <label>Password<input type="password" required value={password} onChange={e=>setPassword(e.target.value)} placeholder="Your password"/></label>
      <button className="admin-primary" disabled={!isSupabaseConfigured}>Sign in to Admin <ShieldCheck size={17}/></button>
      <small className="login-footnote">Authorized administrators only</small>
    </form>
  </main>;

  return <main className="admin-wrap">
    <aside className="admin-sidebar">
      <a className="admin-brand" href="/"><span className="admin-brand-icon">✦</span><span>RDDS <b>Customized</b><small>ADMINISTRATION</small></span></a>
      <p className="sidebar-label">WORKSPACE</p>
      <button className={activeTab==='orders'?'side-link active':'side-link'} onClick={()=>setActiveTab('orders')}><PackageCheck size={18}/> Orders <span>{orders.filter(o=>o.status==='New').length}</span></button>
      <button className={activeTab==='reports'?'side-link active':'side-link'} onClick={()=>setActiveTab('reports')}><FileText size={18}/> Reports</button>
      <button className={activeTab==='chats'?'side-link active':'side-link'} onClick={()=>setActiveTab('chats')}><MessageCircle size={18}/> Live Chats</button>
      <button className={activeTab==='visitors'?'side-link active':'side-link'} onClick={()=>setActiveTab('visitors')}><span aria-hidden="true">◎</span> Live Visitors</button>
      <button className={activeTab==='products'?'side-link active':'side-link'} onClick={()=>setActiveTab('products')}><Boxes size={18}/> Products</button>
      <button className={activeTab==='payments'?'side-link active':'side-link'} onClick={()=>setActiveTab('payments')}><CreditCard size={18}/> Payment settings</button>
      <div className="sidebar-bottom"><div className="admin-user-avatar">A</div><div><b>Administrator</b><small>{session.user?.email}</small></div><button title="Sign out" onClick={()=>supabase.auth.signOut()}><LogOut size={17}/></button></div>
    </aside>
    <section className="admin-main">
      <header className="admin-topbar"><div><span className="topbar-breadcrumb">RDDS Customized</span><span className="breadcrumb-sep">/</span><b>{activeTab==='orders'?'Orders':activeTab==='products'?'Products':activeTab==='reports'?'Reports':activeTab==='chats'?'Live Chats':activeTab==='visitors'?'Live Visitors':'Payment settings'}</b></div><div className="topbar-right"><span className="admin-secure"><i/> Secure session</span><button className="icon-button" onClick={loadOrders} title="Refresh orders"><RefreshCw size={17}/></button></div></header>
      {error && <div className="admin-error page-error">{error}</div>}
      {activeTab==='orders' ? <>
        <div className="page-heading"><div><p className="admin-eyebrow">STORE OVERVIEW</p><h1>Order management</h1><p>View customer orders, update fulfilment and track payments.</p></div><button className="refresh-button" onClick={loadOrders}><RefreshCw size={16}/> Refresh orders</button></div>
        <div className="admin-stats">{stats.map(([label,value,Icon])=><article key={label}><span className="stat-icon"><Icon size={19}/></span><div><small>{label}</small><strong>{value}</strong></div></article>)}</div>
        <section className="orders-panel"><div className="orders-panel-head"><div><h2>Received orders</h2><p>All orders submitted by customers through the website.</p></div><span className="order-count">{visible.length} orders</span></div>
          <div className="order-toolbar"><label className="admin-search"><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search order, customer, phone or city"/></label><label className="filter-select"><span>Status:</span><select value={filter} onChange={e=>setFilter(e.target.value)}><option>All</option>{statuses.map(s=><option key={s}>{s}</option>)}</select><ChevronDown size={15}/></label></div>
          {loading ? <div className="admin-empty">Loading orders…</div> : visible.length===0 ? <div className="admin-empty"><PackageCheck size={34}/><h3>No orders found</h3><p>New customer orders will show here when they are placed.</p></div> :
          <div className="admin-order-list">{visible.map(order=><article className="admin-order" key={order.id}>
            <div className="order-card-head"><div><b>{order.order_number || 'Order'}</b><small>{new Date(order.created_at).toLocaleString('en-PK')}</small></div><strong>{money(order.total)}</strong></div>
            <div className="order-customer"><b>{order.customer_name}</b><span>{order.phone}</span><span>{order.city}</span></div>
            <div className="order-items">{(order.items||[]).map((item,i)=><span key={i}>{item.name} × {item.quantity}</span>)}</div>
            <div className="order-details"><span><Banknote size={15}/> {order.payment_method==='cod'?'Cash on Delivery':'Online payment'} · {order.payment_status}</span><span><Truck size={15}/> {order.delivery_address}</span></div>
            {order.customer_note && <p className="customer-note">Customer note: {order.customer_note}</p>}
            <div className="order-controls"><button className="refresh-button" onClick={()=>setReceiptOrder(order)}>Receipt / Print</button><label>Order status<select value={order.status} onChange={e=>updateStatus(order.id,e.target.value)}>{statuses.map(s=><option key={s}>{s}</option>)}</select></label><label>Payment status<select value={order.payment_status} onChange={e=>updatePaymentStatus(order.id,e.target.value)}><option>Unpaid</option><option>Awaiting verification</option><option>Paid</option><option>Refunded</option></select></label></div>
          </article>)}</div>}
        </section>
      </> : activeTab==='chats' ? <AdminLiveChats session={session}/> : activeTab==='visitors' ? <AdminVisitors/> : activeTab==='reports' ? <div className="reports-page">
        <div className="page-heading"><div><p className="admin-eyebrow">ORDER ANALYTICS</p><h1>Received orders report</h1><p>Filter received orders by date, city and order status. Print a receipt for each order.</p></div><button className="refresh-button" onClick={exportReport}><Download size={16}/> Export CSV</button></div>
        <section className="report-filters"><label>From date<input type="date" value={reportFrom} onChange={e=>setReportFrom(e.target.value)}/></label><label>To date<input type="date" value={reportTo} onChange={e=>setReportTo(e.target.value)}/></label><label>City<select value={reportCity} onChange={e=>setReportCity(e.target.value)}>{reportCities.map(city=><option key={city}>{city}</option>)}</select></label><label>Order status<select value={reportStatus} onChange={e=>setReportStatus(e.target.value)}><option>All</option>{statuses.map(st=><option key={st}>{st}</option>)}</select></label><button className="refresh-button" onClick={()=>{setReportFrom('');setReportTo('');setReportCity('All');setReportStatus('All')}}>Clear filters</button></section>
        <div className="report-summary"><article><small>Matching orders</small><strong>{reportOrders.length}</strong></article><article><small>Order value</small><strong>{money(reportTotal)}</strong></article><article><small>Delivery charges</small><strong>{money(reportDelivery)}</strong></article></div>
        <section className="orders-panel report-orders"><div className="orders-panel-head"><div><h2>Report details</h2><p>{reportOrders.length} orders match the selected filters.</p></div></div>{reportOrders.length===0?<div className="admin-empty"><FileText size={32}/><h3>No matching orders</h3><p>Try changing the report filters.</p></div>:<div className="report-table-wrap"><table className="report-table"><thead><tr><th>Order / Date</th><th>Customer</th><th>City</th><th>Status</th><th>Total</th><th>Receipt</th></tr></thead><tbody>{reportOrders.map(order=><tr key={order.id}><td><b>{order.order_number}</b><small>{new Date(order.created_at).toLocaleDateString('en-PK')}</small></td><td>{order.customer_name}<small>{order.phone}</small></td><td>{order.city}</td><td>{order.status}</td><td><b>{money(order.total)}</b></td><td><button className="refresh-button" onClick={()=>setReceiptOrder(order)}><FileText size={14}/> Print receipt</button></td></tr>)}</tbody></table></div>}</section>
      </div> : activeTab==='products' ? <div className="products-admin-page"><div className="page-heading"><div><p className="admin-eyebrow">STORE CATALOGUE</p><h1>Product management</h1><p>Add, edit, publish or hide products. Stock tracking is not included.</p></div></div><ProductManager /></div> : <div className="page-heading payment-page"><div><p className="admin-eyebrow">CHECKOUT CONFIGURATION</p><h1>Payment settings</h1><p>Manage the payment methods customers can use at checkout.</p></div>
        <section className="payment-method-card"><div className="payment-method-icon"><Banknote size={22}/></div><div className="payment-method-copy"><h3>Cash on Delivery</h3><p>Customers pay when their order is delivered.</p><span className="method-status enabled">Available</span></div><span className="method-toggle on">ON</span></section>
        <section className="payment-method-card"><div className="payment-method-icon"><CreditCard size={22}/></div><div className="payment-method-copy"><h3>Online payment gateway</h3><p>Gateway integration can be connected later. No online gateway is active yet.</p><span className="method-status pending">Setup pending</span></div><span className="method-toggle off">LATER</span></section>
        <div className="payment-info"><Settings size={18}/><p>For now, Cash on Delivery is the available checkout method. Online payment gateway setup will be completed separately when your provider and account details are ready.</p></div>
      </div>}
    </section>

    {receiptOrder && <div className="receipt-overlay admin-receipt-overlay"><section className="receipt-modal admin-receipt-modal"><div className="receipt-brand"><span>✦</span><div><b>RDDS CUSTOMIZED</b><small>ORDER RECEIPT</small></div></div><div className="receipt-meta"><div><small>Order number</small><b>{receiptOrder.order_number}</b></div><div><small>Order date</small><b>{new Date(receiptOrder.created_at).toLocaleString('en-PK')}</b></div></div><h3>Customer details</h3><p>{receiptOrder.customer_name}<br/>{receiptOrder.phone}<br/>{receiptOrder.email||''}<br/>{receiptOrder.city}<br/>{receiptOrder.delivery_address}</p><h3>Order items</h3><div className="receipt-items">{(receiptOrder.items||[]).map((item,i)=><div key={i}><span>{item.name} × {item.quantity||1}</span><b>{money(Number(item.price)*(item.quantity||1))}</b></div>)}</div><div className="receipt-totals"><div><span>Subtotal</span><b>{money(receiptOrder.subtotal)}</b></div><div><span>Delivery</span><b>{money(receiptOrder.delivery_fee)}</b></div><div className="receipt-grand"><span>Total</span><b>{money(receiptOrder.total)}</b></div></div><div className="receipt-payment">Payment: {receiptOrder.payment_method==='cod'?'Cash on Delivery':'Online payment'} · {receiptOrder.payment_status}<br/>Order status: {receiptOrder.status}</div>{receiptOrder.customer_note&&<p>Customer note: {receiptOrder.customer_note}</p>}<div className="receipt-actions"><button className="admin-primary" onClick={printReceipt}>Print receipt</button><button className="refresh-button" onClick={()=>setReceiptOrder(null)}>Close</button></div></section></div>}
  </main>;
}
