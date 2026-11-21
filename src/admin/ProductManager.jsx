import React,{useEffect,useState} from 'react';
import {supabase} from '../lib/supabase';
import {ImagePlus,Trash2,Edit3,Save,RefreshCw} from 'lucide-react';

const categories=['Personalized Gifts','Neon Signs','LED Lighting','Wall Décor','Photo Frames','Custom Apparel'];
const money=n=>`Rs. ${Number(n||0).toLocaleString('en-PK')}`;

export default function ProductManager(){
 const empty={name:'',price:'',category:categories[0],description:'',tag:'Made to order',is_active:true};
 const [products,setProducts]=useState([]),[form,setForm]=useState(empty),[files,setFiles]=useState([]),[previews,setPreviews]=useState([]),[editing,setEditing]=useState(null),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 const load=async()=>{const {data,error}=await supabase.from('products').select('*').order('created_at',{ascending:false});if(error)setMessage(error.message);else setProducts(data||[]);};
 useEffect(()=>{load();},[]);
 const choose=e=>{const selected=Array.from(e.target.files||[]);if(selected.some(f=>!['image/jpeg','image/png','image/webp'].includes(f.type))){setMessage('Only JPG, PNG and WEBP images are allowed.');return;}if(selected.some(f=>f.size>5*1024*1024)){setMessage('Each image must be 5 MB or smaller.');return;}setFiles(selected);setPreviews(selected.map(f=>URL.createObjectURL(f)));};
 const reset=()=>{setForm(empty);setFiles([]);setPreviews([]);setEditing(null);};
 const save=async e=>{e.preventDefault();setBusy(true);setMessage('');try{
   let uploaded=[];for(const file of files){const ext=file.name.split('.').pop().toLowerCase();const path=`products/${crypto.randomUUID()}/${Date.now()}.${ext}`;const {error}=await supabase.storage.from('product-images').upload(path,file,{contentType:file.type,upsert:false});if(error)throw error;const {data}=supabase.storage.from('product-images').getPublicUrl(path);uploaded.push(data.publicUrl);}
   const current=editing?products.find(p=>p.id===editing):null;
   const imageUrls=[...(current?.image_urls||[]),...uploaded];const payload={name:form.name.trim(),price:Number(form.price),category:form.category,description:form.description.trim(),tag:form.tag.trim(),is_active:form.is_active,image_urls:imageUrls,image_url:uploaded[0]||current?.image_url||null};
   const result=editing?await supabase.from('products').update(payload).eq('id',editing):await supabase.from('products').insert(payload);
   if(result.error)throw result.error;await load();reset();setMessage('Product saved successfully.');
 }catch(err){setMessage(err.message||'Could not save product.');}finally{setBusy(false);}};
 const edit=p=>{setEditing(p.id);setForm({name:p.name,price:String(p.price),category:p.category,description:p.description||'',tag:p.tag||'',is_active:p.is_active});setFiles([]);setPreviews(p.image_urls|| (p.image_url?[p.image_url]:[]));};
 const remove=async p=>{if(!confirm(`Delete ${p.name}?`))return;const {error}=await supabase.from('products').delete().eq('id',p.id);if(error)setMessage(error.message);else{setProducts(old=>old.filter(x=>x.id!==p.id));setMessage('Product deleted.');}};
 const toggle=async p=>{const {error}=await supabase.from('products').update({is_active:!p.is_active}).eq('id',p.id);if(error)setMessage(error.message);else setProducts(old=>old.map(x=>x.id===p.id?{...x,is_active:!x.is_active}:x));};
 return <section className="product-manager"><div className="pm-heading"><div><p className="admin-eyebrow">CATALOGUE</p><h2>Products & categories</h2><p>Add products, upload photos from your device and control where they appear.</p></div><button onClick={load}><RefreshCw size={15}/> Refresh</button></div>
 {message&&<p className="pm-message">{message}</p>}
 <div className="pm-layout"><form className="pm-form" onSubmit={save}><h3>{editing?'Edit product':'Add a product'}</h3><label>Product name<input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label><label>Price (PKR)<input required min="0" type="number" value={form.price} onChange={e=>setForm({...form,price:e.target.value})}/></label><label>Category<select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>{categories.map(c=><option key={c}>{c}</option>)}</select></label><label>Short description<textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></label><label>Product tag<input value={form.tag} onChange={e=>setForm({...form,tag:e.target.value})} placeholder="Bestseller / Made to order"/></label>
 <label className="pm-upload"><ImagePlus size={21}/><span>Upload product images from device</span><small>JPG, PNG or WEBP · up to 5 MB each · multiple images supported</small><input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={choose}/></label>
 {previews.length>0&&<div className="pm-previews">{previews.map((src,i)=><img src={src} key={i} alt={`Product preview ${i+1}`}/>)}</div>}
 <label className="pm-active"><input type="checkbox" checked={form.is_active} onChange={e=>setForm({...form,is_active:e.target.checked})}/> Visible on store</label><div className="pm-actions"><button className="admin-primary" disabled={busy}><Save size={15}/>{busy?'Saving…':'Save product'}</button><button type="button" onClick={reset}>Clear</button></div></form>
 <div className="pm-list"><h3>Product inventory · {products.length}</h3>{products.length===0?<p>No products yet. Add your first product.</p>:products.map(p=><article key={p.id}><div className="pm-thumb">{p.image_url?<img src={p.image_url} alt=""/>:'✧'}</div><div className="pm-product-info"><b>{p.name}</b><small>{p.category} · {money(p.price)}</small><small>{p.is_active?'Visible':'Hidden'}</small></div><button title="Edit" onClick={()=>edit(p)}><Edit3 size={15}/></button><button title={p.is_active?'Hide':'Show'} onClick={()=>toggle(p)}>{p.is_active?'Hide':'Show'}</button><button title="Delete" onClick={()=>remove(p)}><Trash2 size={15}/></button></article>)}</div></div>
 </section>;
}
