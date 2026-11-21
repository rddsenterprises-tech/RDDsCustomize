import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowUpRight, ShoppingBag, Plus, Minus, X } from 'lucide-react';
import { supabase, isSupabaseConfigured } from './lib/supabase';

const fallback = [
  { id:'demo-1',name:'Islamic Acrylic Lamp',price:2999,category:'LED Lighting',description:'A warm personalised acrylic lamp for meaningful spaces.',image_url:'' },
  { id:'demo-2',name:'Personalized Photo Frame',price:2499,category:'Photo Gifts',description:'A thoughtful frame made around your favourite memory.',image_url:'' },
  { id:'demo-3',name:'Dream Big Neon Sign',price:3499,category:'Neon Signs',description:'A custom glow sign designed around your words.',image_url:'' },
  { id:'demo-4',name:'Custom Name Cushion',price:1999,category:'Personalized Gifts',description:'A soft personalised gift made just for them.',image_url:'' },
  { id:'demo-5',name:'3D Photo Cube',price:3199,category:'Photo Gifts',description:'A keepsake that puts your memories on display.',image_url:'' },
  { id:'demo-6',name:'Wooden Name Sign',price:1499,category:'Wall Décor',description:'Custom wall décor with a personal touch.',image_url:'' },
];
const money = n => `Rs. ${Number(n).toLocaleString('en-PK')}`;

export default function CategoryPage({category}) {
  const [products,setProducts] = useState([]);
  const [cart,setCart] = useState([]);
  const [loading,setLoading] = useState(true);
  const [checkout,setCheckout] = useState(false);
  const [saving,setSaving] = useState(false);
  const [notice,setNotice] = useState('');
  const [customer,setCustomer] = useState({name:'',phone:'',city:'',address:'',payment:'cod',note:''});
  useEffect(() => {
    let live=true;
    async function load(){
      if(isSupabaseConfigured && supabase){
        const {data,error}=await supabase.from('products').select('*').eq('category',category.name).eq('is_active',true).order('created_at',{ascending:false});
        if(!error && live) setProducts(data||[]);
        else if(live) setProducts(fallback.filter(p=>p.category===category.name));
      } else if(live) setProducts(fallback.filter(p=>p.category===category.name));
      if(live) setLoading(false);
    }
    load(); return ()=>{live=false;};
  },[category.name]);
  const total=useMemo(()=>cart.reduce((s,p)=>s+Number(p.price),0),[cart]);
  const add=p=>setCart(old=>[...old,p]);
  const placeOrder=async e=>{
    e.preventDefault();
    if(!supabase){setNotice('Order database is not connected yet. Please contact us on WhatsApp.');return;}
    const tab=window.open('about:blank','_blank');setSaving(true);
    const items=cart.map(p=>({id:p.id,name:p.name,price:Number(p.price),quantity:1}));
    const {data,error}=await supabase.from('orders').insert({
      customer_name:customer.name.trim(),phone:customer.phone.trim(),city:customer.city.trim(),
      delivery_address:customer.address.trim(),customer_note:customer.note.trim()||null,items,
      subtotal:total,delivery_fee:0,total,payment_method:customer.payment,
      payment_status:customer.payment==='cod'?'Unpaid':'Awaiting verification'
    }).select('order_number').single();
    setSaving(false);
    if(error){tab?.close();setNotice('Order save nahi hua. Please dobara try karein.');return;}
    const lines=cart.map(p=>`• ${p.name} — Rs. ${Number(p.price).toLocaleString('en-PK')}`).join('\n');
    const message=encodeURIComponent(`RDDS Customized order ${data.order_number}\nName: ${customer.name}\nPhone: ${customer.phone}\nCity: ${customer.city}\nAddress: ${customer.address}\nPayment: ${customer.payment==='cod'?'Cash on Delivery':'Online Bank Transfer'}\nItems:\n${lines}\nTotal: Rs. ${total}\nNote: ${customer.note||'None'}`);
    if(tab) tab.location.href=`https://wa.me/?text=${message}`;
    setCart([]);setCheckout(false);setNotice(`Order ${data.order_number} saved successfully.`);
  };
  return <div className="site-shell category-page">
    <div className="announcement">PERSONALIZED WITH LOVE · DELIVERY ACROSS PAKISTAN</div>
    <header className="header"><a className="brand" href="/"><span className="brand-mark">✧</span><span><b>RDDS</b><em>Customized</em><small>Imagine it... We Customize it!</small></span></a><nav className="nav category-nav"><a href="/">Home</a><a href="/shop">All Categories</a><a href="/#custom">Design Your Own</a></nav><a className="cart-button category-cart" href="#category-products"><ShoppingBag/> <span>{cart.length}</span></a></header>
    <main>
      <section className="category-hero"><a href="/shop"><ArrowLeft size={15}/> Back to all categories</a><p className="eyebrow">EXPLORE OUR COLLECTION</p><div className="category-hero-icon">{category.icon}</div><h1>{category.name}</h1><p>{category.sub}. Discover thoughtful designs made around your ideas.</p></section>
      <section className="section" id="category-products"><div className="section-heading"><div><p className="eyebrow">MADE TO BE YOURS</p><h2>Explore <span>{category.name}</span></h2></div><span className="muted">{products.length} products</span></div>
        {loading?<p className="empty-cart">Loading collection…</p>:products.length===0?<p className="empty-cart">New products are coming soon. Contact us to request a custom design.</p>:<div className="product-grid">{products.map(p=><article className="product-card" key={p.id}><div className="product-visual category-product-image">{p.image_url?<img src={p.image_url} alt={p.name}/>:<span className="product-art">✧</span>}<small>{p.tag||'Made to order'}</small><button className="quick-add" onClick={()=>add(p)} aria-label="Add to cart"><Plus size={18}/></button></div><div className="product-info"><div><h3>{p.name}</h3><p>{money(p.price)}</p>{p.description&&<small>{p.description}</small>}</div><button className="add-button" onClick={()=>add(p)}>Add to cart <Plus size={14}/></button></div></article>)}</div>}
      </section>
      {cart.length>0&&<section className="category-checkout section"><div className="dialog-head"><h2>Your cart · {cart.length} item(s)</h2><strong>{money(total)}</strong></div><div className="category-cart-items">{cart.map((p,i)=><div key={i}><span>{p.name}</span><b>{money(p.price)}</b><button onClick={()=>setCart(old=>old.filter((_,n)=>n!==i))}><Minus size={14}/></button></div>)}</div><button className="btn btn-gold" onClick={()=>setCheckout(true)}>Continue to checkout <ArrowUpRight size={16}/></button></section>}
      <section className="trust-strip"><div><b>Delivery Across Pakistan</b><small>Carefully packed, delivered to you</small></div><div><b>Made With Care</b><small>Quality you can feel</small></div><div><b>Personal Support</b><small>We help bring your idea to life</small></div></section>
    </main>
    <footer id="contact"><div className="footer-main"><a className="brand" href="/"><span className="brand-mark">✧</span><span><b>RDDS</b><em>Customized</em><small>Imagine it... We Customize it!</small></span></a><p>Little details. Big feelings.<br/>Made personal, just for you.</p><div className="footer-links"><a href="/shop">Shop all categories</a><a href="/#custom">Design Your Own</a></div></div><div className="footer-bottom"><span>© {new Date().getFullYear()} RDDS Customized. All rights reserved.</span></div></footer>
    {notice&&<div className="toast" onClick={()=>setNotice('')}>{notice}</div>}
    {checkout&&<div className="modal-backdrop" onClick={()=>!saving&&setCheckout(false)}><form className="custom-modal checkout-modal" onSubmit={placeOrder} onClick={e=>e.stopPropagation()}><div className="dialog-head"><div><p className="eyebrow">SECURE CHECKOUT</p><h2>Delivery & payment</h2></div><button type="button" onClick={()=>setCheckout(false)}><X/></button></div><div className="checkout-summary"><span>{cart.length} item(s)</span><strong>{money(total)}</strong></div>
      <label>Full name<input required value={customer.name} onChange={e=>setCustomer({...customer,name:e.target.value})}/></label><label>Mobile / WhatsApp<input required type="tel" value={customer.phone} onChange={e=>setCustomer({...customer,phone:e.target.value})}/></label><label>City<input required value={customer.city} onChange={e=>setCustomer({...customer,city:e.target.value})}/></label><label>Delivery address<textarea required value={customer.address} onChange={e=>setCustomer({...customer,address:e.target.value})}/></label><label>Order note (optional)<textarea value={customer.note} onChange={e=>setCustomer({...customer,note:e.target.value})}/></label>
      <div className="payment-choice"><p className="eyebrow">PAYMENT METHOD</p><label className="payment-option"><input type="radio" name="payment" checked={customer.payment==='cod'} onChange={()=>setCustomer({...customer,payment:'cod'})}/><span><b>Cash on Delivery</b></span></label><label className="payment-option"><input type="radio" name="payment" checked={customer.payment==='bank_transfer'} onChange={()=>setCustomer({...customer,payment:'bank_transfer'})}/><span><b>Online Bank Transfer</b></span></label></div>
      <button className="btn btn-gold full" disabled={saving}>{saving?'Saving order…':'Place order & continue to WhatsApp'}</button></form></div>}
  </div>;
}
