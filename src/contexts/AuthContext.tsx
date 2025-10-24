import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Session, User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (username: string, password: string) => Promise<{ error: Error | null }>;
  signIn: (username: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to convert username to email format for Supabase
const usernameToEmail = (username: string) => {
  // Clean the username and create a fake email
  const cleanUsername = username.toLowerCase().replace(/[^a-z0-9]/g, '');
  return `${cleanUsername}@local.app`;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (username: string, password: string) => {
    try {
      // Convert username to email format
      const email = usernameToEmail(username);

      const { error, data } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username,
            display_name: username
          }
        }
      });

      if (error) {
        // Check if it's an email validation error and provide a clearer message
        if (error.message.includes('email')) {
          return { error: new Error('Username already exists or invalid username') };
        }
        return { error };
      }

      // Auto sign in after signup for better UX
      if (data.user) {
        await signIn(username, password);
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signIn = async (username: string, password: string) => {
    try {
      // Convert username to email format
      const email = usernameToEmail(username);

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Provide clearer error messages
        if (error.message.includes('Invalid login credentials')) {
          return { error: new Error('Invalid username or password') };
        }
        return { error };
      }

      navigate('/');
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}