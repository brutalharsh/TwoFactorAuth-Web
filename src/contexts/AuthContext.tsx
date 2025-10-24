import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface User {
  id: string;
  username: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (username: string, password: string) => Promise<{ error: Error | null }>;
  signIn: (username: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_KEY = 'pass-guard-session';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for existing session in localStorage
    const loadSession = async () => {
      const storedSession = localStorage.getItem(SESSION_KEY);
      if (storedSession) {
        try {
          const userData = JSON.parse(storedSession);
          // Verify the user still exists in the database
          const { data, error } = await supabase
            .from('users')
            .select('id, username')
            .eq('id', userData.id)
            .single();

          if (data && !error) {
            setUser(data);
          } else {
            localStorage.removeItem(SESSION_KEY);
          }
        } catch (e) {
          localStorage.removeItem(SESSION_KEY);
        }
      }
      setLoading(false);
    };

    loadSession();
  }, []);

  const signUp = async (username: string, password: string) => {
    try {
      // Check if username already exists
      const { data: existingUsername } = await supabase
        .from('users')
        .select('id')
        .eq('username', username)
        .single();

      if (existingUsername) {
        return { error: new Error('Username already exists') };
      }

      // Store password as plain text (WARNING: INSECURE!)
      const { data, error } = await supabase
        .from('users')
        .insert([
          {
            username,
            pass: password // Storing plain text password
          }
        ])
        .select('id, username')
        .single();

      if (error) {
        return { error };
      }

      if (data) {
        // Store session
        localStorage.setItem(SESSION_KEY, JSON.stringify(data));
        setUser(data);
        navigate('/');
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signIn = async (username: string, password: string) => {
    try {
      // Find user by username
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, username, pass')
        .eq('username', username)
        .single();

      if (userError || !userData) {
        return { error: new Error('Invalid username or password') };
      }

      // Compare plain text password (WARNING: INSECURE!)
      if (userData.pass !== password) {
        return { error: new Error('Invalid username or password') };
      }

      // Remove password from user object before storing
      const { pass, ...userWithoutPassword } = userData;

      // Store session
      localStorage.setItem(SESSION_KEY, JSON.stringify(userWithoutPassword));
      setUser(userWithoutPassword);

      navigate('/');
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
    navigate('/auth');
  };

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut }}>
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