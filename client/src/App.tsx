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
      <div style={{ background: '#0a0a0a', minHeight: '100vh' }}>
      <div style={{ padding: 12, borderBottom: '1px solid #222', display: 'flex', justifyContent: 'space-between', color: '#fff', background: '#0a0a0a' }}>
      <span>Logged in as {session.user.email}</span>
      <button onClick={() => supabase.auth.signOut()}>Log Out</button>
      </div>
      <Dashboard />
    </div>
    );
}

export default App;