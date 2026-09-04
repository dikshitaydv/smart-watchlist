import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import type { Session } from '@supabase/supabase-js';
import Auth from './components/Auth';

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
    <div style={{ padding: 40, fontFamily: 'sans-serif' }}>
      <h1>Welcome, {session.user.email}</h1>
      <button onClick={() => supabase.auth.signOut()}>Log Out</button>
    </div>
  );
}

export default App;