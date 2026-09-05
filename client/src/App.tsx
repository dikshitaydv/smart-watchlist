import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import type { Session } from '@supabase/supabase-js';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  if (loading) return <p>Loading...</p>;

  if (!session) return <Auth />;

  return (
    <div>
      <div
        style={{
          padding: '14px 24px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontFamily: 'var(--font-sans)',
          fontSize: 14,
        }}
      >
        <span style={{ fontFamily: 'var(--font-serif)', fontSize: 17, fontWeight: 600 }}>
          Market Wire
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, color: 'var(--ink-muted)' }}>
          <span>{session.user.email}</span>
          <button
            onClick={() => supabase.auth.signOut()}
            style={{
              background: 'transparent',
              border: '1px solid var(--border)',
              borderRadius: 5,
              padding: '6px 12px',
              color: 'var(--ink-muted)',
              cursor: 'pointer',
            }}
          >
            Log out
          </button>
        </div>
      </div>
      <Dashboard />
    </div>
  );
}

export default App;