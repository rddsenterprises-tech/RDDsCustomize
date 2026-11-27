import React, { useEffect, useMemo, useState } from 'react';
import CategoryPage from './CategoryPage';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { Search, ShoppingBag, Heart, UserRound, Menu, ChevronDown, ArrowUpRight, Sparkles, Truck, ShieldCheck, Headset, Plus, Minus, X } from 'lucide-react';

const categories = [
  { name: 'Personalized Gifts', sub: 'Made just for them', icon: '🎁', slug: 'personalized-gifts' },
  { name: 'Neon Signs', sub: 'Glow your style', icon: '💡', slug: 'neon-signs' },
  { name: 'LED Lighting', sub: 'Brighter ideas', icon: '🌙', slug: 'led-lighting' },
  { name: 'Wall Décor', sub: 'Transform your space', icon: '✨', slug: 'wall-decor' },
  { name: 'Photo Frames', sub: 'Keep memories close', icon: '🖼️', slug: 'photo-frames' },
  { name: 'Custom Apparel', sub: 'Wear your story', icon: '👕', slug: 'custom-apparel' },
];
const products = [];
const money = n => `Rs. ${n.toLocaleString('en-PK')}`;
const lightColors = { 'Ice Blue':'#bfefff', Blue:'#42a5ff', Pink:'#ff70c8', Purple:'#b78aff', Red:'#ff6262', Green:'#66f0a5', 'Warm White':'#fff1cf' };

function App() {
  const path = window.location.pathname.replace(/\/$/, '');
  const pageCategory = path === '/shop' ? {name:'All Products',sub:'Browse every collection',icon:'🛍️',slug:'shop'} : categories.find(c => c.slug === path.slice(1));
  if (pageCategory) return <CategoryPage category={pageCategory} />;
  return <StoreHome />;
}

function StoreHome() {
  const [cart, setCart] = useState([]);
  const [catalogProducts, setCatalogProducts] = useState(products);
  useEffect(() => { if (!supabase) return; supabase.from('products').select('*').eq('is_active', true).order('created_at', {ascending:false}).then(({data,error}) => { if (!error) setCatalogProducts((data || []).map(p => ({...p, art:'✧', tone:'blue'}))); }); }, []);
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [mobileMenu, setMobileMenu] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);
  const [customName, setCustomName] = useState('');
  const [nameStyle, setNameStyle] = useState('Single Name');
  const [customText, setCustomText] = useState('');
  const [customType, setCustomType] = useState('Neon');
  const [lightColor, setLightColor] = useState('Ice Blue');
  const [toast, setToast] = useState('');
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [customer, setCustomer] = useState({name:'',phone:'',email:'',city:'',address:'',note:'',payment:'cod'});
  const visibleProducts = useMemo(() => catalogProducts.filter(p =>
    (activeCategory === 'All' || p.category === activeCategory) &&
    p.name.toLowerCase().includes(query.toLowerCase())
  ), [catalogProducts, query, activeCategory]);
  const addToCart = p => {
    setCart(old => [...old, p]);
    setToast(`${p.name} added to your cart`);
    window.setTimeout(() => setToast(''), 2400);
  };
  const removeFromCart = index => setCart(old => old.filter((_, i) => i !== index));
  const total = cart.reduce((sum, p) => sum + p.price, 0);
  const openCart = () => document.getElementById('cart-panel')?.showModal();
  const updateCustomer = (field,value) => setCustomer(old => ({...old,[field]:value}));
  const placeOrder = async (event) => {
    event.preventDefault();
    if (!isSupabaseConfigured || !supabase) {
      setToast('Order system is being connected. Please try again shortly.');
      return;
    }
    if (!cart.length) return;
    const whatsappWindow = window.open('about:blank','_blank');
    setPlacingOrder(true);
    const items = cart.map(item => ({id:item.id,name:item.name,price:item.price,quantity:1}));
    const paymentMethod = customer.payment;
    const {data,error} = await supabase.from('orders').insert({
      customer_name:customer.name.trim(), phone:customer.phone.trim(), email:customer.email.trim() || null,
      city:customer.city.trim(), delivery_address:customer.address.trim(), customer_note:customer.note.trim() || null,
      items, subtotal:total, delivery_fee:0, total,
      payment_method:paymentMethod, payment_status:paymentMethod === 'bank_transfer' ? 'Awaiting verification' : 'Unpaid'
    }).select('order_number').single();
    setPlacingOrder(false);
    if (error) { whatsappWindow?.close(); setToast('Order could not be saved. Please try again.'); return; }
    const itemLines = cart.map(item => `• ${item.name} — Rs. ${item.price.toLocaleString('en-PK')}`).join('\n');
    const paymentLabel = paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Bank Transfer (proof/details to be confirmed)';
    const message = encodeURIComponent(`New RDDS Customized order: ${data.order_number}\nName: ${customer.name}\nPhone: ${customer.phone}\nCity: ${customer.city}\nAddress: ${customer.address}\nPayment: ${paymentLabel}\nItems:\n${itemLines}\nTotal: Rs. ${total.toLocaleString('en-PK')}\nNote: ${customer.note || 'None'}`);
    if (whatsappWindow) whatsappWindow.location.href = `https://wa.me/?text=${message}`;
    setCart([]); setCheckoutOpen(false); document.getElementById('cart-panel')?.close();
    setToast(`Order ${data.order_number} saved successfully`);
  };

  return <div className="site-shell">
    <div className="announcement">PERSONALIZED WITH LOVE · DELIVERY ACROSS PAKISTAN</div>
    <header className="header">
      <a className="brand" href="#"><span className="brand-mark">✧</span><span><b>RDDS</b><em>Customized</em><small>Imagine it... We Customize it!</small></span></a>
      <button className="mobile-toggle" onClick={() => setMobileMenu(!mobileMenu)} aria-label="Toggle menu"><Menu /></button>
      <nav className={mobileMenu ? 'nav open' : 'nav'}>
        <a className="active" href="#">Home</a><div className="nav-dropdown"><a href="/shop">Shop <ChevronDown size={13}/></a><div className="nav-menu"><a href="/shop">All Products</a>{categories.map(c => <a key={c.slug} href={`/${c.slug}`}>{c.name}</a>)}</div></div>
        <a href="#hero-customizer">Design Your Own</a><a href="#about">About</a><a href="#contact">Contact</a>
      </nav>
      <div className="header-actions">
        <label className="search"><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search products..." /><Search size={18}/></label>
        <button aria-label="Account"><UserRound/></button><button aria-label="Wishlist"><Heart/></button>
        <button className="cart-button" onClick={openCart} aria-label="Open cart"><ShoppingBag/><span>{cart.length}</span></button>
      </div>
    </header>

    <main>
      <section className="hero">
        <div className="hero-copy"><p className="eyebrow">THE ART OF PERSONALIZATION</p><h1>Make every gift<br/><span>unforgettable.</span></h1>
          <p className="hero-desc">Personalized gifts, custom neon signs and décor made around your ideas.</p>
          <div className="hero-buttons"><a className="btn btn-gold" href="#shop">Explore Collection <ArrowUpRight size={17}/></a><a className="text-link" href="#hero-customizer">Create your own <ArrowUpRight size={16}/></a></div>
          <div className="hero-proof"><span>✦</span> Thoughtfully customized <i/> Made for your moments</div>
        </div>
        <div className="hero-customizer" id="hero-customizer">
          <div className="builder-top"><span className="builder-live"><i/> LIVE CUSTOMIZER</span><span className="builder-step">01 / 01</span></div>
          <div className="builder-preview"><div className="preview-orbit orbit-one"/><div className="preview-orbit orbit-two"/><div className="preview-product"><span className="preview-kicker">{customType.toUpperCase()}</span><strong style={{color:lightColors[lightColor],textShadow:`0 0 10px ${lightColors[lightColor]}, 0 0 24px ${lightColors[lightColor]}`}}>{customName.trim() || 'YOUR NAME'}</strong><small>{customText.trim() || 'YOUR IDEA STARTS HERE'}</small></div><span className="preview-caption">LIVE DESIGN PREVIEW</span></div>
          <div className="builder-fields"><div className="builder-heading"><div><p className="eyebrow">MAKE IT PERSONAL</p><h3>Bring your idea <span>to life.</span></h3></div><Sparkles size={22}/></div>
            <label>Choose material<select value={customType} onChange={e=>setCustomType(e.target.value)}><option>Neon</option><option>Acrylic</option></select></label>
            <label>Light colour<select value={lightColor} onChange={e=>setLightColor(e.target.value)}>{Object.keys(lightColors).map(color=><option key={color}>{color}</option>)}</select></label>
            <label>Name style<select value={nameStyle} onChange={e=>{setNameStyle(e.target.value);setCustomName('');}}><option>Single Name</option><option>Couple Name</option></select></label>
            <label>{nameStyle === 'Couple Name' ? 'Couple names' : 'Your name'}<input value={customName} onChange={e=>setCustomName(e.target.value)} placeholder={nameStyle === 'Couple Name' ? 'e.g. Danish & Ayesha' : 'e.g. Danish'}/></label>
            <label>Describe your design<textarea rows="2" value={customText} onChange={e=>setCustomText(e.target.value)} placeholder="Tell us your style, colour, size or idea..."/></label>
            <button className="btn btn-blue full" onClick={()=>{const msg=encodeURIComponent(`Hi RDDS Customized! I want a custom ${customType}. Light colour: ${lightColor}. Name style: ${nameStyle}. Name / wording: ${customName || 'Not provided'}. Design idea: ${customText || 'Please guide me.'}`);window.open(`https://wa.me/?text=${msg}`,'_blank');}}>Customize on WhatsApp <ArrowUpRight size={17}/></button><small className="builder-note">Your design brief opens in WhatsApp — no complicated steps.</small>
          </div>
        </div>
      </section>

      <section className="section category-section"><div className="section-heading"><div><p className="eyebrow">FIND YOUR SOMETHING SPECIAL</p><h2>Shop by <span>Category</span></h2></div><a href="/shop" className="view-link">View all categories <ArrowUpRight size={16}/></a></div>
        <div className="category-grid">{categories.map(c => <a className="category-card" key={c.slug} href={`/${c.slug}`}><span className="category-icon">{c.icon}</span><b>{c.name}</b><small>{c.sub}</small><ArrowUpRight className="category-arrow" size={17}/></a>)}</div>
      </section>

      <section className="section" id="shop"><div className="section-heading"><div><p className="eyebrow">CUSTOMER FAVOURITES</p><h2>Made to be <span>loved.</span></h2></div><span className="muted">{activeCategory === 'All' ? 'Our popular picks' : <button className="clear-filter" onClick={() => setActiveCategory('All')}>Clear: {activeCategory} ×</button>}</span></div>
        <div className="product-grid">{visibleProducts.map(p => <article className="product-card" key={p.id}><div className={`product-visual ${p.tone}`}>{p.image_url ? <img src={p.image_url} alt={p.name} style={{width:"100%",height:"100%",objectFit:"cover"}}/> : <span className="product-art">{p.art}</span>}<small>{p.tag}</small><button className="quick-add" onClick={() => addToCart(p)} aria-label={`Add ${p.name} to cart`}><Plus size={18}/></button></div><div className="product-info"><div><h3>{p.name}</h3><p>{money(p.price)}</p></div><button className="add-button" onClick={() => addToCart(p)}>Add to cart <Plus size={14}/></button></div></article>)}</div>
        {visibleProducts.length === 0 && <p className="empty-cart">No products match this search. Try another name or category.</p>}
      </section>

      <section className="section process" id="about"><div className="center-heading"><p className="eyebrow">SIMPLE. PERSONAL. SPECIAL.</p><h2>How it <span>works</span></h2></div><div className="steps"><div><b>01</b><span>✧</span><h3>Choose</h3><p>Pick the product you love.</p></div><div><b>02</b><span>✎</span><h3>Personalize</h3><p>Share your name, photo or idea.</p></div><div><b>03</b><span>♡</span><h3>Approve</h3><p>Confirm your design with us.</p></div><div><b>04</b><span>↗</span><h3>Receive</h3><p>We craft it and deliver to you.</p></div></div></section>

      <section className="trust-strip"><div><Truck/><b>Delivery Across Pakistan</b><small>Carefully packed, delivered to you</small></div><div><ShieldCheck/><b>Made With Care</b><small>Quality you can feel</small></div><div><Headset/><b>Personal Support</b><small>We help bring your idea to life</small></div></section>
    </main>

    <footer id="contact"><div className="footer-main"><a className="brand" href="#"><span className="brand-mark">✧</span><span><b>RDDS</b><em>Customized</em><small>Imagine it... We Customize it!</small></span></a><p>Little details. Big feelings.<br/>Made personal, just for you.</p><div className="footer-links"><a href="/shop">Shop</a><a href="#hero-customizer">Design Your Own</a><a href="#about">Our Process</a><a href="mailto:hello@rddscustomized.com">Email Us</a></div></div><div className="footer-bottom"><span>© {new Date().getFullYear()} RDDS Customized. All rights reserved.</span><span>Crafted around your imagination ✦</span></div></footer>

    {toast && <div className="toast">{toast}</div>}
    <dialog id="cart-panel" className="cart-dialog"><div className="dialog-head"><h2>Your Cart ({cart.length})</h2><button onClick={() => document.getElementById('cart-panel').close()}><X/></button></div>{cart.length ? <>{cart.map((p,i)=><div className="cart-line" key={`${p.id}-${i}`}><span>{p.name}</span><b>{money(p.price)}</b><button onClick={() => removeFromCart(i)}><Minus size={15}/></button></div>)}<div className="cart-total"><b>Total</b><strong>{money(total)}</strong></div><p className="cart-note">Choose your payment method and enter delivery details to place your order.</p><button className="btn btn-gold full" onClick={() => {document.getElementById('cart-panel')?.close();setCheckoutOpen(true);}}>Proceed to checkout <ArrowUpRight size={16}/></button></> : <p className="empty-cart">Your cart is waiting for something special.</p>}</dialog>
    {checkoutOpen && <div className="modal-backdrop" onClick={() => !placingOrder && setCheckoutOpen(false)}><form className="custom-modal checkout-modal" onSubmit={placeOrder} onClick={e => e.stopPropagation()}>
      <div className="dialog-head"><div><p className="eyebrow">SECURE CHECKOUT</p><h2>Delivery & payment</h2></div><button type="button" onClick={() => setCheckoutOpen(false)} disabled={placingOrder}><X/></button></div>
      <div className="checkout-summary"><span>{cart.length} item(s)</span><strong>{money(total)}</strong></div>
      <label>Full name<input required value={customer.name} onChange={e=>updateCustomer('name',e.target.value)} placeholder="Your full name"/></label>
      <label>Mobile / WhatsApp number<input required type="tel" value={customer.phone} onChange={e=>updateCustomer('phone',e.target.value)} placeholder="03XX XXXXXXX"/></label>
      <label>Email (optional)<input type="email" value={customer.email} onChange={e=>updateCustomer('email',e.target.value)} placeholder="you@example.com"/></label>
      <label>City<input required value={customer.city} onChange={e=>updateCustomer('city',e.target.value)} placeholder="Your city"/></label>
      <label>Complete delivery address<textarea required value={customer.address} onChange={e=>updateCustomer('address',e.target.value)} placeholder="House, street, area and nearby landmark"/></label>
      <label>Order note (optional)<textarea value={customer.note} onChange={e=>updateCustomer('note',e.target.value)} placeholder="Customization details or delivery instructions"/></label>
      <div className="payment-choice"><p className="eyebrow">PAYMENT METHOD</p>
        <label className={customer.payment==='cod'?'payment-option selected':'payment-option'}><input type="radio" name="payment" value="cod" checked={customer.payment==='cod'} onChange={e=>updateCustomer('payment',e.target.value)}/><span><b>Cash on Delivery</b><small>Pay when your order arrives</small></span></label>
        <label className={customer.payment==='bank_transfer'?'payment-option selected':'payment-option'}><input type="radio" name="payment" value="bank_transfer" checked={customer.payment==='bank_transfer'} onChange={e=>updateCustomer('payment',e.target.value)}/><span><b>Online Bank Transfer</b><small>Transfer details will be confirmed by our team</small></span></label>
      </div>
      <p className="checkout-disclaimer">Delivery charges, if applicable, will be confirmed by the team before order confirmation.</p>
      <button className="btn btn-gold full" disabled={placingOrder}>{placingOrder?'Saving order…':'Place order & continue to WhatsApp'} <ArrowUpRight size={16}/></button>
      {!isSupabaseConfigured && <small className="muted">Order database setup is pending. Checkout will activate after connection.</small>}
    </form></div>}
  </div>;
}
export default App;