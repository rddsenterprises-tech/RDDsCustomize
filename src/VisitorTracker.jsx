import { useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const tracker = url && key ? createClient(url, key, {
  auth: { storageKey: 'rdds-customized-visitor-tracker', persistSession: true, autoRefreshToken: true, detectSessionInUrl: false }
}) : null;

const uuid = () => globalThis.crypto?.randomUUID?.() || 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
  const r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 3 | 8)).toString(16);
});
const deviceType = () => /tablet|ipad/i.test(navigator.userAgent) ? 'tablet' : /mobile|android|iphone/i.test(navigator.userAgent) ? 'mobile' : 'desktop';
const browserName = () => /Edg\//.test(navigator.userAgent) ? 'Edge' : /Chrome\//.test(navigator.userAgent) ? 'Chrome' : /Firefox\//.test(navigator.userAgent) ? 'Firefox' : /Safari\//.test(navigator.userAgent) ? 'Safari' : 'Other';

export default function VisitorTracker() {
  useEffect(() => {
    if (!tracker) return;
    let stopped = false;
    const track = async () => {
      try {
        let { data: { session } } = await tracker.auth.getSession();
        if (!session) {
          const result = await tracker.auth.signInAnonymously();
          if (result.error) throw result.error;
          session = result.data.session;
        }
        if (stopped || !session?.user) return;
        let sessionId = sessionStorage.getItem('rdds_customized_visit_id');
        if (!sessionId) { sessionId = uuid(); sessionStorage.setItem('rdds_customized_visit_id', sessionId); }
        const { error } = await tracker.from('visitor_sessions').upsert({
          id: sessionId, visitor_id: session.user.id, last_seen_at: new Date().toISOString(),
          page_url: window.location.pathname + window.location.search, page_title: document.title,
          referrer: document.referrer || null, device_type: deviceType(), browser_name: browserName()
        }, { onConflict: 'id' });
        if (error) throw error;
      } catch (error) {
        console.warn('RDDS Customized visitor tracking unavailable:', error.message);
      }
    };
    track();
    const timer = window.setInterval(track, 25000);
    return () => { stopped = true; window.clearInterval(timer); };
  }, []);
  return null;
}
