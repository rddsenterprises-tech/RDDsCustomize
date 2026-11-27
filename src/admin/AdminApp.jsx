import React, { useEffect, useMemo, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { LogOut, RefreshCw, Search, PackageCheck, Clock3, Banknote, Truck, CreditCard, ShieldCheck, Settings, ChevronDown, Boxes } from 'lucide-react';
import ProductManager from './ProductManager';

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
      <button className={activeTab==='products'?'side-link active':'side-link'} onClick={()=>setActiveTab('products')}><Boxes size={18}/> Products</button>
      <button className={activeTab==='payments'?'side-link active':'side-link'} onClick={()=>setActiveTab('payments')}><CreditCard size={18}/> Payment settings</button>
      <div className="sidebar-bottom"><div className="admin-user-avatar">A</div><div><b>Administrator</b><small>{session.user?.email}</small></div><button title="Sign out" onClick={()=>supabase.auth.signOut()}><LogOut size={17}/></button></div>
    </aside>
    <section className="admin-main">
      <header className="admin-topbar"><div><span className="topbar-breadcrumb">RDDS Customized</span><span className="breadcrumb-sep">/</span><b>{activeTab==='orders'?'Orders':activeTab==='products'?'Products':'Payment settings'}</b></div><div className="topbar-right"><span className="admin-secure"><i/> Secure session</span><button className="icon-button" onClick={loadOrders} title="Refresh orders"><RefreshCw size={17}/></button></div></header>
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
            <div className="order-controls"><label>Order status<select value={order.status} onChange={e=>updateStatus(order.id,e.target.value)}>{statuses.map(s=><option key={s}>{s}</option>)}</select></label><label>Payment status<select value={order.payment_status} onChange={e=>updatePaymentStatus(order.id,e.target.value)}><option>Unpaid</option><option>Awaiting verification</option><option>Paid</option><option>Refunded</option></select></label></div>
          </article>)}</div>}
        </section>
      </> : activeTab==='products' ? <div className="products-admin-page"><div className="page-heading"><div><p className="admin-eyebrow">STORE CATALOGUE</p><h1>Product management</h1><p>Add, edit, publish or hide products. Stock tracking is not included.</p></div></div><ProductManager /></div> : <div className="page-heading payment-page"><div><p className="admin-eyebrow">CHECKOUT CONFIGURATION</p><h1>Payment settings</h1><p>Manage the payment methods customers can use at checkout.</p></div>
        <section className="payment-method-card"><div className="payment-method-icon"><Banknote size={22}/></div><div className="payment-method-copy"><h3>Cash on Delivery</h3><p>Customers pay when their order is delivered.</p><span className="method-status enabled">Available</span></div><span className="method-toggle on">ON</span></section>
        <section className="payment-method-card"><div className="payment-method-icon"><CreditCard size={22}/></div><div className="payment-method-copy"><h3>Online payment gateway</h3><p>Gateway integration can be connected later. No online gateway is active yet.</p><span className="method-status pending">Setup pending</span></div><span className="method-toggle off">LATER</span></section>
        <div className="payment-info"><Settings size={18}/><p>For now, Cash on Delivery is the available checkout method. Online payment gateway setup will be completed separately when your provider and account details are ready.</p></div>
      </div>}
    </section>
  </main>;
}
