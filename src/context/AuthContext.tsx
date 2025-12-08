
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Session } from '@supabase/supabase-js';
import { SystemUser, UserRole } from '../types';

interface AuthContextType {
  session: Session | null;
  user: SystemUser | null;
  loading: boolean;
  signIn: (email: string, password?: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  hasRole: (roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<SystemUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // --- BYPASS LOGIN FOR DEMO ---
    // Automatically set a Super Admin user
    const mockUser: SystemUser = {
      id: 'bypass-admin-01',
      email: 'admin@fleetops.com',
      name: 'Super Admin',
      role: 'super_admin',
      status: 'Active'
    };
    
    setUser(mockUser);
    setLoading(false); // Stop loading immediately
    
    // Original Supabase Logic (Commented Out for now)
    /*
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) fetchProfile(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setUser(null);
        setLoading(false);
      }
    });
    return () => subscription.unsubscribe();
    */
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('system_users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (data) {
        setUser(data);
      } else {
        setUser({ 
            id: userId, 
            email: session?.user?.email || '', 
            name: 'User', 
            role: 'manager', 
            status: 'Active' 
        });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password?: string) => {
    // Bypass login logic
    return { error: null };
  };

  const signOut = async () => {
    // Bypass logout logic
    // await supabase.auth.signOut();
    // setUser(null);
    // setSession(null);
    console.log("Logout disabled.");
  };

  const hasRole = (roles: UserRole[]) => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, signIn, signOut, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
