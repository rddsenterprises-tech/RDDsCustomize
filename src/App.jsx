import React, { useMemo, useState } from 'react';
import { Search, ShoppingBag, Heart, UserRound, Menu, ChevronDown, ArrowUpRight, Sparkles, Truck, ShieldCheck, Headset, Plus, Minus, X } from 'lucide-react';

const categories = [
  { name: 'Personalized Gifts', sub: 'Made just for them', icon: '🎁' },
  { name: 'Neon Signs', sub: 'Glow your style', icon: '💡' },
  { name: 'LED Lighting', sub: 'Brighter ideas', icon: '🌙' },
  { name: 'Wall Décor', sub: 'Transform your space', icon: '✨' },
  { name: 'Photo Gifts', sub: 'Keep memories close', icon: '🖼️' },
  { name: 'Custom Apparel', sub: 'Wear your story', icon: '👕' },
];
const products = [
  { id: 1, name: 'Islamic Acrylic Lamp', price: 2999, tag: 'Bestseller', art: '☾', tone: 'amber', category: 'LED Lighting' },
  { id: 2, name: 'Personalized Photo Frame', price: 2499, tag: 'Made for memories', art: '♡', tone: 'rose', category: 'Photo Gifts' },
  { id: 3, name: 'Dream Big Neon Sign', price: 3499, tag: 'Custom neon', art: '✦', tone: 'violet', category: 'Neon Signs' },
  { id: 4, name: 'Custom Name Cushion', price: 1999, tag: 'Personalized', art: '❦', tone: 'cream', category: 'Personalized Gifts' },
  { id: 5, name: '3D Photo Cube', price: 3199, tag: 'Unique gift', art: '▧', tone: 'gold', category: 'Photo Gifts' },
  { id: 6, name: 'Wooden Name Sign', price: 1499, tag: 'Made to order', art: 'A', tone: 'wood', category: 'Wall Décor' },
];
const money = n => `Rs. ${n.toLocaleString('en-PK')}`;

function App() {
  const [cart, setCart] = useState([]);
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [mobileMenu, setMobileMenu] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customText, setCustomText] = useState('');
  const [customType, setCustomType] = useState('Neon Sign');
  const [toast, setToast] = useState('');
  const visibleProducts = useMemo(() => products.filter(p =>
    (activeCategory === 'All' || p.category === activeCategory) &&
    p.name.toLowerCase().includes(query.toLowerCase())
  ), [query, activeCategory]);
  const addToCart = p => {
    setCart(old => [...old, p]);
    setToast(`${p.name} added to your cart`);
    window.setTimeout(() => setToast(''), 2400);
  };
  const removeFromCart = index => setCart(old => old.filter((_, i) => i !== index));
  const total = cart.reduce((sum, p) => sum + p.price, 0);
  const openCart = () => document.getElementById('cart-panel')?.showModal();

  return <div className="site-shell">
    <div className="announcement">PERSONALIZED WITH LOVE · DELIVERY ACROSS PAKISTAN</div>
    <header className="header">
      <a className="brand" href="#"><span className="brand-mark">✧</span><span><b>RDDS</b><em>Customized</em><small>Imagine it... We Customize it!</small></span></a>
      <button className="mobile-toggle" onClick={() => setMobileMenu(!mobileMenu)} aria-label="Toggle menu"><Menu /></button>
      <nav className={mobileMenu ? 'nav open' : 'nav'}>
        <a className="active" href="#">Home</a><a href="#shop">Shop <ChevronDown size={13}/></a>
        <a href="#custom">Design Your Own</a><a href="#about">About</a><a href="#contact">Contact</a>
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
          <div className="hero-buttons"><a className="btn btn-gold" href="#shop">Explore Collection <ArrowUpRight size={17}/></a><a className="text-link" href="#custom">Create your own <ArrowUpRight size={16}/></a></div>
          <div className="hero-proof"><span>✦</span> Thoughtfully customized <i/> Made for your moments</div>
        </div>
        <div className="hero-art"><div className="glow glow-one"/><div className="hero-product product-mug"><span>YOUR<br/>NAME<br/>HERE</span></div><div className="hero-product product-neon"><strong>Good<br/>Vibes</strong></div><div className="hero-product product-frame">♡<small>YOUR MEMORY</small></div><div className="hero-caption">YOUR IDEA. OUR CRAFT.</div></div>
      </section>

      <section className="section category-section"><div className="section-heading"><div><p className="eyebrow">FIND YOUR SOMETHING SPECIAL</p><h2>Shop by <span>Category</span></h2></div><a href="#shop" className="view-link">View all categories <ArrowUpRight size={16}/></a></div>
        <div className="category-grid">{categories.map(c => <button className={activeCategory === c.name ? 'category-card selected' : 'category-card'} key={c.name} onClick={() => {setActiveCategory(activeCategory === c.name ? 'All' : c.name); document.getElementById('shop').scrollIntoView({behavior:'smooth'});}}><span className="category-icon">{c.icon}</span><b>{c.name}</b><small>{c.sub}</small><ArrowUpRight className="category-arrow" size={17}/></button>)}</div>
      </section>

      <section className="section" id="shop"><div className="section-heading"><div><p className="eyebrow">CUSTOMER FAVOURITES</p><h2>Made to be <span>loved.</span></h2></div><span className="muted">{activeCategory === 'All' ? 'Our popular picks' : <button className="clear-filter" onClick={() => setActiveCategory('All')}>Clear: {activeCategory} ×</button>}</span></div>
        <div className="product-grid">{visibleProducts.map(p => <article className="product-card" key={p.id}><div className={`product-visual ${p.tone}`}><span className="product-art">{p.art}</span><small>{p.tag}</small><button className="quick-add" onClick={() => addToCart(p)} aria-label={`Add ${p.name} to cart`}><Plus size={18}/></button></div><div className="product-info"><div><h3>{p.name}</h3><p>{money(p.price)}</p></div><button className="add-button" onClick={() => addToCart(p)}>Add to cart <Plus size={14}/></button></div></article>)}</div>
        {visibleProducts.length === 0 && <p className="empty-cart">No products match this search. Try another name or category.</p>}
      </section>

      <section className="custom-banner" id="custom"><div className="custom-symbol"><Sparkles size={42}/></div><div><p className="eyebrow">YOUR IMAGINATION, MADE REAL</p><h2>Design something <span>uniquely yours.</span></h2><p>Choose a product, share your idea and let us bring it to life.</p></div><button className="btn btn-gold" onClick={() => setCustomOpen(true)}>Start designing <ArrowUpRight size={17}/></button></section>

      <section className="section process" id="about"><div className="center-heading"><p className="eyebrow">SIMPLE. PERSONAL. SPECIAL.</p><h2>How it <span>works</span></h2></div><div className="steps"><div><b>01</b><span>✧</span><h3>Choose</h3><p>Pick the product you love.</p></div><div><b>02</b><span>✎</span><h3>Personalize</h3><p>Share your name, photo or idea.</p></div><div><b>03</b><span>♡</span><h3>Approve</h3><p>Confirm your design with us.</p></div><div><b>04</b><span>↗</span><h3>Receive</h3><p>We craft it and deliver to you.</p></div></div></section>

      <section className="trust-strip"><div><Truck/><b>Delivery Across Pakistan</b><small>Carefully packed, delivered to you</small></div><div><ShieldCheck/><b>Made With Care</b><small>Quality you can feel</small></div><div><Headset/><b>Personal Support</b><small>We help bring your idea to life</small></div></section>
    </main>

    <footer id="contact"><div className="footer-main"><a className="brand" href="#"><span className="brand-mark">✧</span><span><b>RDDS</b><em>Customized</em><small>Imagine it... We Customize it!</small></span></a><p>Little details. Big feelings.<br/>Made personal, just for you.</p><div className="footer-links"><a href="#shop">Shop</a><a href="#custom">Design Your Own</a><a href="#about">Our Process</a><a href="mailto:hello@rddscustomized.com">Email Us</a></div></div><div className="footer-bottom"><span>© {new Date().getFullYear()} RDDS Customized. All rights reserved.</span><span>Crafted around your imagination ✦</span></div></footer>

    {toast && <div className="toast">{toast}</div>}
    <dialog id="cart-panel" className="cart-dialog"><div className="dialog-head"><h2>Your Cart ({cart.length})</h2><button onClick={() => document.getElementById('cart-panel').close()}><X/></button></div>{cart.length ? <>{cart.map((p,i)=><div className="cart-line" key={`${p.id}-${i}`}><span>{p.name}</span><b>{money(p.price)}</b><button onClick={() => removeFromCart(i)}><Minus size={15}/></button></div>)}<div className="cart-total"><b>Total</b><strong>{money(total)}</strong></div><p className="cart-note">Checkout and order confirmation will be connected in the next development phase.</p></> : <p className="empty-cart">Your cart is waiting for something special.</p>}</dialog>
    {customOpen && <div className="modal-backdrop" onClick={() => setCustomOpen(false)}><div className="custom-modal" onClick={e => e.stopPropagation()}><div className="dialog-head"><div><p className="eyebrow">LET'S MAKE IT YOURS</p><h2>Start your custom order</h2></div><button onClick={() => setCustomOpen(false)}><X/></button></div><label>What would you like to customize?<select value={customType} onChange={e => setCustomType(e.target.value)}><option>Neon Sign</option><option>Personalized Gift</option><option>Photo Frame</option><option>LED Décor</option><option>Wall Décor</option></select></label><label>Your name<input value={customName} onChange={e => setCustomName(e.target.value)} placeholder="Enter your name"/></label><label>Tell us your idea<textarea value={customText} onChange={e => setCustomText(e.target.value)} placeholder="Describe your design, colours, size or message..."/></label><button className="btn btn-gold full" onClick={() => {const msg = encodeURIComponent(`Hi RDDS Customized! I want a custom ${customType}. Name: ${customName || 'Not provided'}. Idea: ${customText || 'Please guide me.'}`); window.open(`https://wa.me/?text=${msg}`, '_blank'); setCustomOpen(false);}}>Send design request on WhatsApp <ArrowUpRight size={16}/></button><small className="muted">This opens WhatsApp with your design brief ready to send.</small></div></div>}
  </div>;
}
export default App;