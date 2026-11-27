import React,{useEffect,useState} from 'react';
import {supabase} from '../lib/supabase';
import {ImagePlus,Trash2,Edit3,Save,RefreshCw,Plus,ArrowLeft,Eye,EyeOff} from 'lucide-react';

const categories=['Personalized Gifts','Neon Signs','LED Lighting','Wall Décor','Photo Frames','Custom Apparel'];
const money=n=>`Rs. ${Number(n||0).toLocaleString('en-PK')}`;

export default function ProductManager(){
 const empty={name:'',price:'',category:categories[0],description:'',tag:'Made to order',is_active:true};
 const [products,setProducts]=useState([]),[form,setForm]=useState(empty),[files,setFiles]=useState([]),[previews,setPreviews]=useState([]),[editing,setEditing]=useState(null),[busy,setBusy]=useState(false),[loading,setLoading]=useState(true),[message,setMessage]=useState(''),[view,setView]=useState('list');
 const load=async()=>{if(!supabase)return;setLoading(true);const {data,error}=await supabase.from('products').select('*').order('created_at',{ascending:false});if(error)setMessage(error.message);else setProducts(data||[]);setLoading(false);};
 useEffect(()=>{load();},[]);
 const choose=e=>{const selected=Array.from(e.target.files||[]);if(selected.some(f=>!['image/jpeg','image/png','image/webp'].includes(f.type))){setMessage('Only JPG, PNG and WEBP images are allowed.');return;}if(selected.some(f=>f.size>5*1024*1024)){setMessage('Each image must be 5 MB or smaller.');return;}setFiles(selected);setPreviews(selected.map(f=>URL.createObjectURL(f)));};
 const openAdd=()=>{setEditing(null);setForm(empty);setFiles([]);setPreviews([]);setMessage('');setView('form');};
 const backToList=()=>{setView('list');setEditing(null);setForm(empty);setFiles([]);setPreviews([]);};
 const save=async e=>{e.preventDefault();setBusy(true);setMessage('');try{
   let uploaded=[];for(const file of files){const ext=file.name.split('.').pop().toLowerCase();const path=`products/${crypto.randomUUID()}/${Date.now()}.${ext}`;const {error}=await supabase.storage.from('product-images').upload(path,file,{contentType:file.type,upsert:false});if(error)throw error;const {data}=supabase.storage.from('product-images').getPublicUrl(path);uploaded.push(data.publicUrl);}
   const current=editing?products.find(p=>p.id===editing):null;
   const imageUrls=[...(current?.image_urls||[]),...uploaded];const payload={name:form.name.trim(),price:Number(form.price),category:form.category,description:form.description.trim(),tag:form.tag.trim(),is_active:form.is_active,image_urls:imageUrls,image_url:uploaded[0]||current?.image_url||null};
   const result=editing?await supabase.from('products').update(payload).eq('id',editing):await supabase.from('products').insert(payload);
   if(result.error)throw result.error;await load();backToList();setMessage(editing?'Product updated successfully.':'Product added successfully.');
 }catch(err){setMessage(err.message||'Could not save product.');}finally{setBusy(false);}};
 const edit=p=>{setEditing(p.id);setForm({name:p.name,price:String(p.price),category:p.category,description:p.description||'',tag:p.tag||'',is_active:p.is_active});setFiles([]);setPreviews(p.image_urls|| (p.image_url?[p.image_url]:[]));setMessage('');setView('form');};
 const remove=async p=>{if(!confirm(`Delete ${p.name}? This cannot be undone.`))return;const {error}=await supabase.from('products').delete().eq('id',p.id);if(error)setMessage(error.message);else{setProducts(old=>old.filter(x=>x.id!==p.id));setMessage('Product deleted.');}};
 const toggle=async p=>{const {error}=await supabase.from('products').update({is_active:!p.is_active}).eq('id',p.id);if(error)setMessage(error.message);else setProducts(old=>old.map(x=>x.id===p.id?{...x,is_active:!x.is_active}:x));};
 return <section className="product-manager">
 {view==='list'?<>
  <div className="pm-heading"><div><p className="admin-eyebrow">CATALOGUE</p><h2>All products <span className="pm-total">{products.length}</span></h2><p>Manage your store catalogue. No stock or inventory tracking.</p></div><div className="pm-head-actions"><button className="pm-refresh" onClick={load}><RefreshCw size={15}/> Refresh</button><button className="admin-primary" onClick={openAdd}><Plus size={16}/> Add product</button></div></div>
  {message&&<p className="pm-message">{message}</p>}
  {loading?<div className="pm-empty">Loading products…</div>:products.length===0?<div className="pm-empty"><div className="pm-empty-icon"><ImagePlus size={25}/></div><h3>No products added yet</h3><p>Start by adding your first product to the store.</p><button className="admin-primary" onClick={openAdd}><Plus size={16}/> Add your first product</button></div>:
   <div className="pm-table-wrap"><table className="pm-table"><thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Store status</th><th>Actions</th></tr></thead><tbody>{products.map(p=><tr key={p.id}><td><div className="pm-table-product"><div className="pm-thumb">{p.image_url?<img src={p.image_url} alt=""/>:<ImagePlus size={17}/>}</div><div><b>{p.name}</b><small>{p.tag||'Made to order'}</small></div></div></td><td>{p.category}</td><td className="pm-price">{money(p.price)}</td><td><span className={p.is_active?'pm-status live':'pm-status hidden'}>{p.is_active?'Published':'Hidden'}</span></td><td><div className="pm-row-actions"><button title="Edit product" onClick={()=>edit(p)}><Edit3 size={15}/> Edit</button><button title={p.is_active?'Hide product':'Publish product'} onClick={()=>toggle(p)}>{p.is_active?<><EyeOff size={15}/> Hide</>:<><Eye size={15}/> Publish</>}</button><button className="danger" title="Delete product" onClick={()=>remove(p)}><Trash2 size={15}/></button></div></td></tr>)}</tbody></table></div>}
 </>:<>
  <div className="pm-form-top"><button className="pm-back" type="button" onClick={backToList}><ArrowLeft size={16}/> Back to products</button><div><p className="admin-eyebrow">PRODUCT CATALOGUE</p><h2>{editing?'Edit product':'Add new product'}</h2><p>Enter product details and save it to your online store.</p></div></div>
  {message&&<p className="pm-message">{message}</p>}
  <form className="pm-form pm-form-page" onSubmit={save}>
   <div className="pm-form-grid">
    <label>Product name<input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Enter product name"/></label>
    <label>Price (PKR)<input required min="0" step="1" type="number" value={form.price} onChange={e=>setForm({...form,price:e.target.value})} placeholder="e.g. 2500"/></label>
    <label>Category<select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>{categories.map(c=><option key={c}>{c}</option>)}</select></label>
    <label>Product tag<input value={form.tag} onChange={e=>setForm({...form,tag:e.target.value})} placeholder="Bestseller / Made to order"/></label>
    <label className="pm-description-field">Description<textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Describe this product..."/></label>
   </div>
   <label className="pm-upload"><ImagePlus size={22}/><span>Upload product images</span><small>JPG, PNG or WEBP · Maximum 5 MB each · Multiple images supported</small><input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={choose}/></label>
   {previews.length>0&&<div className="pm-previews">{previews.map((src,i)=><img src={src} key={i} alt={`Product preview ${i+1}`}/>)}</div>}
   <label className="pm-active"><input type="checkbox" checked={form.is_active} onChange={e=>setForm({...form,is_active:e.target.checked})}/> Publish product on website</label>
   <div className="pm-form-footer"><button className="admin-primary" disabled={busy}><Save size={16}/>{busy?'Saving product…':editing?'Update product':'Save product'}</button><button type="button" onClick={backToList}>Cancel</button></div>
  </form>
 </>}
 </section>;
}
