import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowUpRight, ShoppingBag, Plus, Minus, X } from 'lucide-react';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import ProductDetail from './ProductDetail';
import CustomerAccount from './CustomerAccount';
import { UserRound } from 'lucide-react';

const fallback = [];
const money = n => `Rs. ${Number(n).toLocaleString('en-PK')}`;

export default function CategoryPage({category}) {
  const [products,setProducts] = useState([]);
  const [cart,setCart] = useState([]);
  const [authSession,setAuthSession]=useState(null);
  const [accountOpen,setAccountOpen]=useState(false);
  useEffect(()=>{
    if(!supabase)return;
    supabase.auth.getSession().then(({data})=>setAuthSession(data.session));
    const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,session)=>setAuthSession(session));
    return ()=>subscription.unsubscribe();
  },[]);
  const [loading,setLoading] = useState(true);
  const [checkout,setCheckout] = useState(false);
  const [saving,setSaving] = useState(false);
  const [notice,setNotice] = useState('');
  const [completedOrder,setCompletedOrder] = useState(null);
  const [selectedProduct,setSelectedProduct] = useState(null);
  const [customer,setCustomer] = useState({name:'',phone:'',email:'',city:'',address:'',payment:'cod',note:''});
  useEffect(()=>{
    if(authSession?.user)setCustomer(old=>({...old,name:old.name||authSession.user.user_metadata?.full_name||'',email:old.email||authSession.user.email||''}));
  },[authSession?.user?.id]);
  const startCheckout=()=>{
    if(!authSession?.user){setAccountOpen(true);setNotice('Please sign in or create an account before checkout.');return;}
    if(!cart.length)return;
    setCheckout(true);
  };
  useEffect(() => {
    let live=true;
    async function load(){
      if(isSupabaseConfigured && supabase){
        let request=supabase.from('products').select('*').eq('is_active',true).order('created_at',{ascending:false});
        if(category.slug!=='shop') request=request.eq('category',category.name);
        const {data,error}=await request;
        if(!error && live) setProducts(data||[]);
        else if(live) setProducts([]);
      } else if(live) setProducts([]);
      if(live) setLoading(false);
    }
    load(); return ()=>{live=false;};
  },[category.name]);
  const total=useMemo(()=>cart.reduce((s,p)=>s+Number(p.price),0),[cart]);
  const deliveryFee=customer.city.trim().toLowerCase()==='karachi'?300:500;
  const grandTotal=total+deliveryFee;
  const add=p=>setCart(old=>[...old,p]);
  const removeCartItem=index=>setCart(old=>old.filter((_,i)=>i!==index));
  const placeOrder=async e=>{
    e.preventDefault();
    if(!supabase){setNotice('Order database is not connected. Please try again later.');return;}
    setSaving(true);
    const items=cart.map(p=>({id:p.id,name:p.name,price:Number(p.price),quantity:1}));
    const {data,error}=await supabase.from('orders').insert({
      user_id:authSession.user.id,customer_name:customer.name.trim(),phone:customer.phone.trim(),email:customer.email.trim()||authSession.user.email||null,city:customer.city.trim(),
      delivery_address:customer.address.trim(),customer_note:customer.note.trim()||null,items,
      subtotal:total,delivery_fee:deliveryFee,total:grandTotal,payment_method:'cod',payment_status:'Unpaid'
    }).select('order_number').single();
    setSaving(false);
    if(error){setNotice('Order save nahi hua. Please dobara try karein.');return;}
    setCompletedOrder({order_number:data.order_number,created_at:new Date().toISOString(),customer:{...customer},items:cart.map(p=>({...p,quantity:1})),subtotal:total,delivery_fee:deliveryFee,total:grandTotal});
    setCart([]);
    setCheckout(false);
    setNotice(`Order ${data.order_number} saved successfully.`);
  };
  return <div className="site-shell category-page">
    <div className="announcement">PERSONALIZED WITH LOVE · DELIVERY ACROSS PAKISTAN</div>
    <header className="header"><a className="brand" href="/"><span className="brand-mark">✧</span><span><b>RDDS</b><em>Customized</em><small>Imagine it... We Customize it!</small></span></a><nav className="nav category-nav"><a href="/">Home</a><a href="/shop">All Categories</a><a href="/design-your-own">Design Your Own</a></nav><div className="category-header-actions"><button type="button" className="category-account-button" onClick={()=>setAccountOpen(true)} aria-label="Customer account"><UserRound/></button><a className="cart-button category-cart" href="#category-products"><ShoppingBag/> <span>{cart.length}</span></a></div></header>
    <main>
      {selectedProduct ? <ProductDetail product={selectedProduct} onBack={()=>setSelectedProduct(null)} cart={cart} onAdd={add} onRemove={removeCartItem} total={total} money={money} onCheckout={startCheckout}/> : <>
      <section className="category-hero"><a href="/shop"><ArrowLeft size={15}/> Back to all categories</a><p className="eyebrow">EXPLORE OUR COLLECTION</p><div className="category-hero-icon">{category.icon}</div><h1>{category.name}</h1><p>{category.sub}. Discover thoughtful designs made around your ideas.</p></section>
      <section className="section" id="category-products"><div className="section-heading"><div><p className="eyebrow">MADE TO BE YOURS</p><h2>Explore <span>{category.name}</span></h2></div><span className="muted">{products.length} products</span></div>
        {loading?<p className="empty-cart">Loading collection…</p>:products.length===0?<p className="empty-cart">New products are coming soon. Contact us to request a custom design.</p>:<div className="product-grid">{products.map(p=><article className="product-card category-product-card" key={p.id} onClick={()=>setSelectedProduct(p)}><div className="product-visual category-product-image">{p.image_url?<img src={p.image_url} alt={p.name}/>:<span className="product-art">✧</span>}<small>{p.tag||'Made to order'}</small><button className="quick-add" onClick={e=>{e.stopPropagation();add(p);}} aria-label="Add to cart"><Plus size={18}/></button></div><div className="product-info"><div><h3>{p.name}</h3><p>{money(p.price)}</p>{p.description&&<small>{p.description}</small>}</div><button className="add-button" onClick={e=>{e.stopPropagation();setSelectedProduct(p);}}>View details <Plus size={14}/></button></div></article>)}</div>}
      </section>
      {cart.length>0&&<section className="category-checkout section"><div className="dialog-head"><h2>Your cart · {cart.length} item(s)</h2><strong>{money(total)}</strong></div><div className="category-cart-items">{cart.map((p,i)=><div key={i}><span>{p.name}</span><b>{money(p.price)}</b><button onClick={()=>setCart(old=>old.filter((_,n)=>n!==i))}><Minus size={14}/></button></div>)}</div><button className="btn btn-gold" onClick={startCheckout}>Continue to checkout <ArrowUpRight size={16}/></button></section>}
      <section className="trust-strip"><div><b>Delivery Across Pakistan</b><small>Carefully packed, delivered to you</small></div><div><b>Made With Care</b><small>Quality you can feel</small></div><div><b>Personal Support</b><small>We help bring your idea to life</small></div></section>
      </>}
    </main>
    <footer id="contact"><div className="footer-main"><a className="brand" href="/"><span className="brand-mark">✧</span><span><b>RDDS</b><em>Customized</em><small>Imagine it... We Customize it!</small></span></a><p>Little details. Big feelings.<br/>Made personal, just for you.</p><div className="footer-links"><a href="/shop">Shop all categories</a><a href="/design-your-own">Design Your Own</a><a href="/about">About</a><a href="/contact">Contact</a></div></div><div className="footer-bottom"><span>© {new Date().getFullYear()} RDDS Customized. All rights reserved.</span></div></footer>
    {notice&&<div className="toast" onClick={()=>setNotice('')}>{notice}</div>}
    <CustomerAccount open={accountOpen} onClose={()=>setAccountOpen(false)} onSessionChange={setAuthSession}/>

    {completedOrder&&<div className="modal-backdrop receipt-overlay"><section className="custom-modal receipt-modal"><div className="receipt-brand"><span>✦</span><div><b>RDDS CUSTOMIZED</b><small>ORDER RECEIPT</small></div></div><div className="receipt-success">✓ Order placed successfully</div><div className="receipt-meta"><div><small>Order number</small><b>{completedOrder.order_number}</b></div><div><small>Date</small><b>{new Date(completedOrder.created_at).toLocaleString('en-PK')}</b></div></div><h3>Customer details</h3><p>{completedOrder.customer.name}<br/>{completedOrder.customer.phone}<br/>{completedOrder.customer.city}<br/>{completedOrder.customer.address}</p><h3>Order items</h3><div className="receipt-items">{completedOrder.items.map((item,i)=><div key={i}><span>{item.name} × {item.quantity}</span><b>{money(item.price*item.quantity)}</b></div>)}</div><div className="receipt-totals"><div><span>Subtotal</span><b>{money(completedOrder.subtotal)}</b></div><div><span>Delivery</span><b>{money(completedOrder.delivery_fee)}</b></div><div className="receipt-grand"><span>Total</span><b>{money(completedOrder.total)}</b></div></div><div className="receipt-payment">Payment: Cash on Delivery · Payment status: Unpaid</div>{completedOrder.customer.note&&<p>Note: {completedOrder.customer.note}</p>}<div className="receipt-actions"><button className="btn btn-blue" onClick={()=>window.print()}>Print receipt</button><button className="btn btn-gold" onClick={()=>setCompletedOrder(null)}>Continue shopping</button></div><small className="receipt-thanks">Thank you for shopping with RDDS Customized.</small></section></div>}
    {checkout&&<div className="modal-backdrop" onClick={()=>!saving&&setCheckout(false)}><form className="custom-modal checkout-modal" onSubmit={placeOrder} onClick={e=>e.stopPropagation()}><div className="dialog-head"><div><p className="eyebrow">SECURE CHECKOUT</p><h2>Delivery & payment</h2></div><button type="button" onClick={()=>setCheckout(false)}><X/></button></div><div className="checkout-summary"><span>{cart.length} item(s) · Subtotal {money(total)} · Delivery {money(deliveryFee)}</span><strong>{money(grandTotal)}</strong></div>
      <label>Full name<input required value={customer.name} onChange={e=>setCustomer({...customer,name:e.target.value})}/></label><label>Mobile / WhatsApp<input required type="tel" value={customer.phone} onChange={e=>setCustomer({...customer,phone:e.target.value})}/></label><label>Email<input type="email" value={customer.email} onChange={e=>setCustomer({...customer,email:e.target.value})}/></label><label>City<input required value={customer.city} onChange={e=>setCustomer({...customer,city:e.target.value})}/></label><label>Delivery address<textarea required value={customer.address} onChange={e=>setCustomer({...customer,address:e.target.value})}/></label><label>Order note (optional)<textarea value={customer.note} onChange={e=>setCustomer({...customer,note:e.target.value})}/></label>
      <p className="checkout-disclaimer">Karachi delivery: Rs. 300 · Outside Karachi: Rs. 500. Total includes delivery charges.</p><div className="payment-choice"><p className="eyebrow">PAYMENT METHOD</p><label className="payment-option"><input type="radio" name="payment" checked={customer.payment==='cod'} onChange={()=>setCustomer({...customer,payment:'cod'})}/><span><b>Cash on Delivery</b></span></label><p className="checkout-disclaimer">Online payment gateway will be available soon. Cash on Delivery is currently the only active method.</p></div>
      <button className="btn btn-gold full" disabled={saving}>{saving?'Saving order…':'Place order & get receipt'}</button></form></div>}
  </div>;
}
