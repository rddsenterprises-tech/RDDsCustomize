import React, { useEffect, useMemo, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import ProductManager from './ProductManager';
import { LogOut, RefreshCw, Search, PackageCheck, Clock3, Banknote, Truck } from 'lucide-react';

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

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({data}) => setSession(data.session));
    const {data:{subscription}} = supabase.auth.onAuthStateChange((_event,next) => setSession(next));
    return () => subscription.unsubscribe();
  }, []);

  const loadOrders = async () => {
    if (!supabase || !session) return;
    setLoading(true); setError('');
    const {data,error:err} = await supabase.from('orders').select('*').order('created_at',{ascending:false}).limit(300);
    if (err) setError(err.message); else setOrders(data || []);
    setLoading(false);
  };
  useEffect(() => { loadOrders(); }, [session]);

  const login = async e => {
    e.preventDefault(); setError('');
    const {error:err} = await supabase.auth.signInWithPassword({email,password});
    if (err) setError(err.message);
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
    [o.order_number,o.customer_name,o.phone].join(' ').toLowerCase().includes(query.toLowerCase())
  ),[orders,filter,query]);
  const stats = [
    ['Total orders',orders.length,PackageCheck],['New orders',orders.filter(o=>o.status==='New').length,Clock3],
    ['Processing',orders.filter(o=>o.status==='Processing').length,RefreshCw],['COD orders',orders.filter(o=>o.payment_method==='cod').length,Banknote]
  ];

  if (!isSupabaseConfigured) return <main className="admin-wrap"><section className="admin-login"><div className="admin-brand">RDDS <i>Customized</i></div><h1>Admin setup required</h1><p>Supabase project URL aur publishable key Vercel environment variables mein add karne ke baad admin login active hoga.</p><code>VITE_SUPABASE_URL</code><code>VITE_SUPABASE_PUBLISHABLE_KEY</code><a href="/">← Back to store</a></section></main>;
  const previewMode = !session;

  return <main className="admin-wrap"><header className="admin-top"><div><div className="admin-brand">RDDS <i>Customized</i></div><small>STORE CONTROL CENTER</small></div><div className="admin-top-actions"><button onClick={loadOrders}><RefreshCw size={16}/> Refresh</button><button onClick={()=>supabase.auth.signOut()}><LogOut size={16}/> Sign out</button></div></header>
    <section className="admin-content">{previewMode && <div className="pm-message">Exploration mode: login is temporarily bypassed. Data loading and changes remain disabled until admin security is configured.</div>}<div className="admin-title"><div><p className="admin-eyebrow">OVERVIEW</p><h1>Orders</h1><p>Customer orders received from the online store.</p></div><span className="admin-live"><i/> Connected</span></div>
    <div className="admin-stats">{stats.map(([label,value,Icon])=><article key={label}><Icon/><small>{label}</small><strong>{value}</strong></article>)}</div>
    <div className="admin-orders-head"><h2>Order management</h2><div><label className="admin-search"><Search size={16}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search order, customer, phone"/></label><select value={filter} onChange={e=>setFilter(e.target.value)}><option>All</option>{statuses.map(s=><option key={s}>{s}</option>)}</select></div></div>
    {error && <p className="admin-error">{error}</p>}{loading ? <p>Loading orders…</p> : visible.length===0 ? <div className="admin-empty"><PackageCheck size={30}/><h3>No orders yet</h3><p>New customer orders will appear here automatically.</p></div> :
    <div className="admin-order-list">{visible.map(order=><article className="admin-order" key={order.id}><div className="order-main"><div><b>{order.order_number}</b><small>{new Date(order.created_at).toLocaleString()}</small></div><strong>{money(order.total)}</strong></div><div className="order-customer"><b>{order.customer_name}</b><span>{order.phone}</span><span>{order.city}</span></div><div className="order-items">{(order.items||[]).map((item,i)=><span key={i}>{item.name} × {item.quantity}</span>)}</div><div className="order-meta"><span><Banknote size={15}/> {order.payment_method==='cod'?'Cash on Delivery':'Online Bank Transfer'} · {order.payment_status}</span><span><Truck size={15}/> {order.delivery_address}</span></div><div className="order-bottom"><label>Order status<select value={order.status} onChange={e=>updateStatus(order.id,e.target.value)}>{statuses.map(s=><option key={s}>{s}</option>)}</select></label><label>Payment status<select value={order.payment_status} onChange={e=>updatePaymentStatus(order.id,e.target.value)}><option>Unpaid</option><option>Awaiting verification</option><option>Paid</option><option>Refunded</option></select></label>{order.customer_note && <small>Note: {order.customer_note}</small>}</div></article>)}</div>}<ProductManager preview={previewMode} /></section></main>;
}