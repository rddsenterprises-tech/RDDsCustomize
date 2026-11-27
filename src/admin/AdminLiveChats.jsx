import React, { useCallback, useEffect, useRef, useState } from 'react';
import { MessageCircle, Send, RefreshCw, UserRound, Circle, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

const stamp=value=>new Date(value).toLocaleString('en-PK',{dateStyle:'medium',timeStyle:'short'});
export default function AdminLiveChats({session}) {
  const [conversations,setConversations]=useState([]);
  const [selected,setSelected]=useState(null);
  const [messages,setMessages]=useState([]);
  const [draft,setDraft]=useState('');
  const [loading,setLoading]=useState(false);
  const [sending,setSending]=useState(false);
  const [error,setError]=useState('');
  const endRef=useRef(null);

  const loadConversations=useCallback(async()=>{
    if(!supabase)return;
    setLoading(true);setError('');
    const {data,error:err}=await supabase.from('chat_conversations').select('*').order('last_message_at',{ascending:false}).limit(200);
    if(err)setError(err.message);else setConversations(data||[]);
    setLoading(false);
  },[]);

  useEffect(()=>{
    loadConversations();
    const channel=supabase.channel('admin-chat-inbox')
      .on('postgres_changes',{event:'*',schema:'public',table:'chat_conversations'},()=>loadConversations())
      .on('postgres_changes',{event:'INSERT',schema:'public',table:'chat_messages'},()=>loadConversations())
      .subscribe();
    return ()=>{supabase.removeChannel(channel);};
  },[loadConversations]);

  useEffect(()=>{
    if(!selected)return;
    let alive=true;
    const load=async()=>{
      const {data,error:err}=await supabase.from('chat_messages').select('*').eq('conversation_id',selected.id).order('created_at',{ascending:true});
      if(alive){if(err)setError(err.message);else setMessages(data||[]);}
    };
    load();
    const channel=supabase.channel('admin-chat-'+selected.id)
      .on('postgres_changes',{event:'INSERT',schema:'public',table:'chat_messages',filter:'conversation_id=eq.'+selected.id},payload=>{
        setMessages(old=>old.some(m=>m.id===payload.new.id)?old:[...old,payload.new]);
        loadConversations();
      }).subscribe();
    return ()=>{alive=false;supabase.removeChannel(channel);};
  },[selected?.id,loadConversations]);

  useEffect(()=>{endRef.current?.scrollIntoView({behavior:'smooth'});},[messages]);

  const reply=async e=>{
    e.preventDefault();const message=draft.trim();
    if(!message||!selected||!session?.user||sending)return;
    setSending(true);setError('');
    const {error:err}=await supabase.from('chat_messages').insert({
      conversation_id:selected.id,sender_id:session.user.id,sender_role:'admin',message
    });
    if(err)setError(err.message);
    else{
      await supabase.from('chat_conversations').update({last_message:message,last_message_at:new Date().toISOString(),status:'open'}).eq('id',selected.id);
      setDraft('');loadConversations();
    }
    setSending(false);
  };

  const closeConversation=async()=>{
    if(!selected)return;
    const {error:err}=await supabase.from('chat_conversations').update({status:'closed'}).eq('id',selected.id);
    if(err){setError(err.message);return;}
    setSelected(null);setMessages([]);loadConversations();
  };

  return <div className="admin-live-chats">
    <div className="page-heading"><div><p className="admin-eyebrow">CUSTOMER SUPPORT</p><h1>Live Chats</h1><p>Reply to customer messages in real time from your admin panel.</p></div><button className="refresh-button" onClick={loadConversations}><RefreshCw size={15}/> Refresh chats</button></div>
    {error&&<div className="admin-error page-error">{error}</div>}
    <div className="chat-admin-layout">
      <aside className="chat-inbox"><div className="chat-inbox-head"><div><b>Conversations</b><small>{conversations.length} total</small></div><MessageCircle size={19}/></div>
        {loading&&conversations.length===0?<p className="chat-inbox-empty">Loading conversations…</p>:conversations.length===0?<div className="chat-inbox-empty"><MessageCircle size={30}/><b>No customer messages yet</b><span>New website chats will appear here.</span></div>:conversations.map(c=><button key={c.id} className={'chat-conversation '+(selected?.id===c.id?'active':'')} onClick={()=>{setSelected(c);setMessages([]);}}>
          <span className="chat-person-icon"><UserRound size={17}/></span><span className="chat-conversation-copy"><b>{c.customer_name||'Website visitor'}</b><small>{c.last_message||'New conversation'}</small><em>{stamp(c.last_message_at)}</em></span><span className={'chat-state '+(c.status==='open'?'open':'closed')}>{c.status==='open'?<Circle size={7} fill="currentColor"/>:<CheckCircle2 size={12}/>}</span>
        </button>)}
      </aside>
      <section className="chat-thread">
        {!selected?<div className="chat-thread-empty"><MessageCircle size={36}/><b>Select a conversation</b><span>Choose a customer from the list to view messages and reply.</span></div>:<>
          <header className="chat-thread-head"><div className="chat-person-icon"><UserRound size={18}/></div><div><b>{selected.customer_name||'Website visitor'}</b><small>{selected.customer_email||'Guest customer'} · Started {stamp(selected.created_at)}</small></div><button className="refresh-button" onClick={closeConversation} disabled={selected.status==='closed'}>{selected.status==='closed'?'Closed':'Close chat'}</button></header>
          <div className="chat-thread-messages">{messages.map(m=><article key={m.id} className={'chat-admin-message '+(m.sender_role==='admin'?'from-admin':'from-customer')}><span>{m.message}</span><small>{m.sender_role==='admin'?'You':'Customer'} · {stamp(m.created_at)}</small></article>)}<div ref={endRef}/></div>
          <form className="chat-admin-compose" onSubmit={reply}><input value={draft} onChange={e=>setDraft(e.target.value)} placeholder={selected.status==='closed'?'This conversation is closed':'Write a reply…'} maxLength={2000} disabled={selected.status==='closed'}/><button disabled={!draft.trim()||sending||selected.status==='closed'}><Send size={17}/>{sending?'Sending':'Reply'}</button></form>
        </>}
      </section>
    </div>
  </div>;
}
