import React, { useEffect, useRef, useState } from 'react';
import { MessageCircle, X, Send, Headset, LoaderCircle } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import './LiveChat.css';

// Keep customer chat auth separate from the site's/admin login session.
const chatUrl = import.meta.env.VITE_SUPABASE_URL;
const chatKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const chatClient = chatUrl && chatKey ? createClient(chatUrl, chatKey, {
  auth: {
    storageKey: 'rdds_customer_chat_auth',
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  }
}) : null;

export default function LiveChat() {
  const [open,setOpen]=useState(false);
  const [session,setSession]=useState(null);
  const [conversation,setConversation]=useState(null);
  const [messages,setMessages]=useState([]);
  const [draft,setDraft]=useState('');
  const [name,setName]=useState('');
  const [email,setEmail]=useState('');
  const [busy,setBusy]=useState(false);
  const [status,setStatus]=useState('Connecting to support…');
  const endRef=useRef(null);

  useEffect(()=>{
    if(!chatClient){setStatus('Chat is temporarily unavailable.');return;}
    let alive=true;
    const init=async()=>{
      const {data:{session:current}}=await chatClient.auth.getSession();
      let active=current;
      if(!active){
        const {data,error}=await chatClient.auth.signInAnonymously();
        if(error){if(alive)setStatus('Guest chat login failed: '+error.message);return;}
        active=data.session;
      }
      if(!alive)return;
      setSession(active);
      setName(active.user.user_metadata?.full_name||'');
      setEmail(active.user.email||'');
      if(active.user.app_metadata?.app_role==='admin'){setStatus('Open the admin panel to manage customer chats.');return;}
      const {data,error}=await chatClient.from('chat_conversations').select('*').eq('customer_id',active.user.id).eq('status','open').order('last_message_at',{ascending:false}).limit(1).maybeSingle();
      if(!alive)return;
      if(error){setStatus('Could not load support chat.');return;}
      if(data){setConversation(data);setStatus('We usually reply as soon as possible.');}
      else setStatus('Send us a message to start a conversation.');
    };
    init();
    return ()=>{alive=false;};
  },[]);

  useEffect(()=>{
    if(!conversation||!session||!chatClient)return;
    let alive=true;
    const load=async()=>{
      const {data,error}=await chatClient.from('chat_messages').select('*').eq('conversation_id',conversation.id).order('created_at',{ascending:true});
      if(alive&&!error)setMessages(data||[]);
    };
    load();
    const channel=chatClient.channel('customer-chat-'+conversation.id)
      .on('postgres_changes',{event:'INSERT',schema:'public',table:'chat_messages',filter:'conversation_id=eq.'+conversation.id},payload=>{
        setMessages(old=>old.some(m=>m.id===payload.new.id)?old:[...old,payload.new]);
      }).subscribe();
    return ()=>{alive=false;chatClient.removeChannel(channel);};
  },[conversation?.id,session?.user?.id]);

  useEffect(()=>{endRef.current?.scrollIntoView({behavior:'smooth'});},[messages,open]);

  const send=async e=>{
    e?.preventDefault();
    const message=draft.trim();
    if(!message||!chatClient||!session||busy)return;
    setBusy(true);
    let activeConversation=conversation;
    if(!activeConversation){
      const {data,error}=await chatClient.from('chat_conversations').insert({
        customer_id:session.user.id,
        customer_name:name.trim()||'Website visitor',
        customer_email:email.trim()||null,
        last_message:message
      }).select('*').single();
      if(error){setStatus('Could not start chat: '+error.message);setBusy(false);return;}
      activeConversation=data;
      setConversation(data);
    } else {
      const {error:updateError}=await chatClient.from('chat_conversations').update({last_message:message,last_message_at:new Date().toISOString()}).eq('id',activeConversation.id);
      if(updateError){setStatus('Could not update chat: '+updateError.message);setBusy(false);return;}
    }
    const {error}=await chatClient.from('chat_messages').insert({
      conversation_id:activeConversation.id,
      sender_id:session.user.id,
      sender_role:'customer',
      message
    });
    if(error){setStatus('Message could not be sent: '+error.message);}
    else {setDraft('');setStatus('Message sent. Our team will reply here live.');}
    setBusy(false);
  };

  return <div className="live-chat-root">
    {open&&<section className="live-chat-panel" aria-label="Customer support chat">
      <header className="live-chat-head"><span className="live-chat-avatar"><Headset size={19}/></span><div><b>RDDS Customer Care</b><small><i/> Live support</small></div><button onClick={()=>setOpen(false)} aria-label="Close chat"><X size={19}/></button></header>
      <div className="live-chat-status">{status}</div>
      {!conversation&&<div className="live-chat-identity"><label>Your name (optional)<input value={name} onChange={e=>setName(e.target.value)} placeholder="Name"/></label><label>Email (optional)<input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email address"/></label></div>}
      <div className="live-chat-messages">
        {messages.length===0&&<div className="live-chat-welcome"><Headset size={25}/><b>How can we help?</b><span>Ask about products, custom designs, orders or delivery.</span></div>}
        {messages.map(m=><div key={m.id} className={'live-chat-bubble '+(m.sender_role==='customer'?'mine':'theirs')}><span>{m.message}</span><small>{new Date(m.created_at).toLocaleTimeString('en-PK',{hour:'2-digit',minute:'2-digit'})}</small></div>)}
        <div ref={endRef}/>
      </div>
      <form className="live-chat-compose" onSubmit={send}><input value={draft} onChange={e=>setDraft(e.target.value)} placeholder="Type your message…" maxLength={2000}/><button disabled={!draft.trim()||busy||!session} aria-label="Send message">{busy?<LoaderCircle size={18} className="chat-spin"/>:<Send size={18}/>}</button></form>
      <div className="live-chat-foot">Private conversation · RDDS Customized</div>
    </section>}
    <button className={'live-chat-launch '+(open?'is-open':'')} onClick={()=>setOpen(v=>!v)} aria-label={open?'Close support chat':'Chat with us'}>{open?<X size={23}/>:<><MessageCircle size={22}/><span>Chat with us</span></>}</button>
  </div>;
}
