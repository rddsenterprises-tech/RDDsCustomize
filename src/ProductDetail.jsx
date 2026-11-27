import React, {useState} from 'react';
import {ArrowLeft, ShoppingBag, Plus, Minus, X, ShieldCheck, Truck, RotateCcw} from 'lucide-react';

export default function ProductDetail({product,onBack,cart,onAdd,onRemove,total,money,onCheckout}) {
  const [activeImage,setActiveImage]=useState(0);
  const images=[...(product.image_urls||[]),...(product.image_url?[product.image_url]:[])].filter((url,i,all)=>url&&all.indexOf(url)===i);
  const [quantity,setQuantity]=useState(1);
  const add=()=>{for(let i=0;i<quantity;i++)onAdd(product);};
  return <main className="product-detail-page">
    <div className="product-detail-top"><button className="product-back" onClick={onBack}><ArrowLeft size={16}/> Back to collection</button><span>RDDS CUSTOMIZED <i>/</i> PRODUCT DETAILS</span></div>
    <div className="product-detail-layout">
      <section className="product-detail-main">
        <div className="product-detail-gallery">
          <div className="product-detail-image">{images[activeImage]?<img src={images[activeImage]} alt={product.name}/>:<div className="product-detail-placeholder">✧</div>}<span className="detail-tag">{product.tag||'Made to order'}</span></div>
          {images.length>1&&<div className="product-detail-thumbs">{images.map((url,i)=><button key={url} className={activeImage===i?'active':''} onClick={()=>setActiveImage(i)}><img src={url} alt={product.name+' view '+(i+1)}/></button>)}</div>}
        </div>
        <div className="product-detail-copy"><p className="eyebrow">MADE TO BE YOURS</p><h1>{product.name}</h1><div className="detail-price">{money(product.price)}</div><p className="detail-description">{product.description||'A thoughtfully customized piece, created to make your moments and spaces more personal.'}</p>
          <div className="detail-benefits"><span><ShieldCheck/> Quality checked</span><span><Truck/> Delivery across Pakistan</span><span><RotateCcw/> Made with care</span></div>
          <div className="detail-buy-row"><div className="detail-quantity"><button onClick={()=>setQuantity(q=>Math.max(1,q-1))}><Minus size={15}/></button><b>{quantity}</b><button onClick={()=>setQuantity(q=>q+1)}><Plus size={15}/></button></div><button className="btn btn-blue detail-add" onClick={add}>Add to cart <ShoppingBag size={17}/></button></div>
          <p className="detail-custom-note">Need a name, photo or special design? Add your customization instructions during checkout.</p>
        </div>
      </section>
      <aside className="detail-cart-panel"><div className="detail-cart-heading"><div><p className="eyebrow">YOUR SELECTION</p><h2>Shopping cart</h2></div><span>{cart.length} items</span></div>
        {cart.length? <div className="detail-cart-list">{cart.map((item,i)=><div className="detail-cart-item" key={item.id+'-'+i}><div className="detail-cart-thumb">{item.image_url?<img src={item.image_url} alt=""/>:<span>✧</span>}</div><div className="detail-cart-item-copy"><b>{item.name}</b><small>{money(item.price)}</small></div><button aria-label="Remove item" onClick={()=>onRemove(i)}><X size={15}/></button></div>)}</div>:<div className="detail-cart-empty"><ShoppingBag/><p>Your cart is empty</p><small>Choose a product to get started.</small></div>}
        <div className="detail-cart-total"><span>Subtotal</span><b>{money(total)}</b></div><button className="btn btn-gold detail-checkout" disabled={!cart.length} onClick={onCheckout}>Proceed to checkout <ShoppingBag size={16}/></button><small className="detail-cart-foot">Secure checkout · Cash on Delivery</small>
      </aside>
    </div>
  </main>;
}
