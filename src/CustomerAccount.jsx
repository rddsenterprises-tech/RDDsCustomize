import React, { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import { X, UserRound, PackageCheck, LogOut, RefreshCw, Ban } from 'lucide-react';

const money = value => `Rs. ${Number(value || 0).toLocaleString('en-PK')}`;

export default function CustomerAccount({ open, onClose, onSessionChange }) {
  const [session, setSession] = useState(null);
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      onSessionChange?.(data.session);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      onSessionChange?.(next);
    });
    return () => subscription.unsubscribe();
  }, [onSessionChange]);

  const loadOrders = async () => {
    if (!session?.user) return;
    setLoading(true);
    setError('');
    const { data, error: requestError } = await supabase.from('orders').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false }).limit(100);
    if (requestError) setError(requestError.message);
    else setOrders(data || []);
    setLoading(false);
  };

  useEffect(() => {
    if (open && session?.user) loadOrders();
  }, [open, session?.user?.id]);

  const submitAuth = async event => {
    event.preventDefault();
    setError('');
    setMessage('');
    if (mode === 'signup') {
      const { data, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { full_name: name.trim() } }
      });
      if (authError) setError(authError.message);
      else if (data.session) setMessage('Account created successfully. You are now signed in.');
      else setMessage('Account created. Please check your email to confirm your account, then sign in.');
    } else {
      const { error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (authError) setError(authError.message);
      else setMessage('Login successful.');
    }
  };

  const cancelOrder = async order => {
    if (!window.confirm(`Cancel order ${order.order_number}?`)) return;
    setBusyId(order.id);
    setError('');
    const { error: cancelError } = await supabase.from('orders').update({ status: 'Cancelled' }).eq('id', order.id).eq('status', 'New');
    if (cancelError) setError(cancelError.message);
    else {
      setOrders(current => current.map(item => item.id === order.id ? { ...item, status: 'Cancelled' } : item));
      setMessage(`Order ${order.order_number} cancelled.`);
    }
    setBusyId(null);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setOrders([]);
    setMessage('You have signed out.');
  };

  if (!open) return null;
  return <div className="customer-account-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="customer-account-panel" role="dialog" aria-modal="true" aria-label="Customer account">
      <header className="customer-account-head">
        <div className="customer-account-brand"><span><UserRound size={20}/></span><div><b>My Account</b><small>RDDS CUSTOMIZED</small></div></div>
        <button type="button" onClick={onClose} aria-label="Close account"><X/></button>
      </header>
      {error && <div className="customer-account-error">{error}</div>}
      {message && <div className="customer-account-message">{message}</div>}
      {!session?.user ? <div className="customer-auth-content">
        <p className="eyebrow">{mode === 'signup' ? 'JOIN RDDS CUSTOMIZED' : 'WELCOME BACK'}</p>
        <h2>{mode === 'signup' ? 'Create your account' : 'Customer login'}</h2>
        <p>Sign in to view your orders, track delivery and manage eligible cancellations.</p>
        <form onSubmit={submitAuth}>
          {mode === 'signup' && <label>Full name<input required value={name} onChange={event => setName(event.target.value)} placeholder="Your full name"/></label>}
          <label>Email address<input required type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="you@example.com"/></label>
          <label>Password<input required type="password" minLength={6} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} value={password} onChange={event => setPassword(event.target.value)} placeholder="At least 6 characters"/></label>
          <button className="btn btn-gold full" type="submit">{mode === 'signup' ? 'Create account' : 'Sign in'}</button>
        </form>
        <button className="customer-auth-switch" onClick={() => { setMode(mode === 'signup' ? 'login' : 'signup'); setError(''); setMessage(''); }}>{mode === 'signup' ? 'Already have an account? Sign in' : 'New customer? Create an account'}</button>
      </div> : <div className="customer-orders-content">
        <div className="customer-welcome"><div><p className="eyebrow">YOUR ACCOUNT</p><h2>Hello, {session.user.user_metadata?.full_name || session.user.email?.split('@')[0]}</h2><p>{session.user.email}</p></div><button type="button" onClick={signOut}><LogOut size={16}/> Sign out</button></div>
        <div className="customer-orders-title"><div><h3><PackageCheck size={19}/> My Orders</h3><p>Order updates and cancellation options.</p></div><button type="button" onClick={loadOrders} disabled={loading}><RefreshCw size={16}/></button></div>
        {loading ? <p className="customer-orders-empty">Loading your orders…</p> : orders.length === 0 ? <div className="customer-orders-empty">You have not placed any orders yet.</div> : <div className="customer-order-list">
          {orders.map(order => <article className="customer-order-card" key={order.id}>
            <div className="customer-order-top"><div><b>{order.order_number}</b><small>{new Date(order.created_at).toLocaleString('en-PK')}</small></div><strong>{money(order.total)}</strong></div>
            <div className="customer-order-status"><span className={`customer-status status-${String(order.status).toLowerCase()}`}>{order.status}</span><span>{order.payment_method === 'cod' ? 'Cash on Delivery' : order.payment_method} · {order.payment_status}</span></div>
            <div className="customer-order-items">{(order.items || []).map((item, index) => <span key={index}>{item.name} × {item.quantity || 1}</span>)}</div>
            <div className="customer-order-foot"><span>{order.city}</span>{order.status === 'New' && <button type="button" disabled={busyId === order.id} onClick={() => cancelOrder(order)}><Ban size={15}/>{busyId === order.id ? 'Cancelling…' : 'Cancel order'}</button>}</div>
          </article>)}
        </div>}
      </div>}
    </section>
  </div>;
}
