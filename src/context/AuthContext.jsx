import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch or create profile for user
  const fetchProfile = async (currentUser) => {
    if (!currentUser) {
      setProfile(null);
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.warn('Profile fetch warning:', error.message);
      }

      if (data) {
        setProfile(data);
        return data;
      } else {
        // Fallback default profile using auth user metadata
        const fallbackProfile = {
          id: currentUser.id,
          full_name: currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'User',
          role: currentUser.user_metadata?.role || 'HR Admin',
          created_at: currentUser.created_at,
        };
        setProfile(fallbackProfile);
        return fallbackProfile;
      }
    } catch (err) {
      console.warn('Profile retrieval error:', err);
      const fallback = {
        id: currentUser.id,
        full_name: currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'User',
        role: currentUser.user_metadata?.role || 'HR Admin',
      };
      setProfile(fallback);
      return fallback;
    }
  };

  useEffect(() => {
    let mounted = true;

    // Get initial session
    const initAuth = async () => {
      try {
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        if (error) console.error('Get session error:', error);

        if (mounted) {
          setSession(initialSession);
          setUser(initialSession?.user || null);
          if (initialSession?.user) {
            await fetchProfile(initialSession.user);
          }
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initAuth();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mounted) return;
      setSession(newSession);
      setUser(newSession?.user || null);
      if (newSession?.user) {
        await fetchProfile(newSession.user);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  // Login
  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  };

  // Signup
  const signup = async (email, password, metadata = {}) => {
    const { fullName, role = 'HR Admin' } = metadata;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: role,
        },
      },
    });

    if (error) throw error;

    // Try to insert directly into profiles table if user is created
    if (data.user) {
      try {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          full_name: fullName || email.split('@')[0],
          role: role,
        });
      } catch (profileErr) {
        console.warn('Could not auto-create profile row (may require trigger or RLS):', profileErr);
      }
    }

    return data;
  };

  // Logout
  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
    setProfile(null);
    setSession(null);
  };

  // Update Profile
  const updateProfile = async ({ fullName, role }) => {
    if (!user) throw new Error('No authenticated user session found');

    // 1. Update Supabase Auth user metadata
    const { data: authData, error: authError } = await supabase.auth.updateUser({
      data: {
        full_name: fullName,
        role: role,
      },
    });
    if (authError) throw authError;

    // 2. Persist to profiles table in Supabase
    try {
      const { error: dbError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: fullName,
          role: role,
        });

      if (dbError) {
        console.warn('Profile table upsert error:', dbError.message);
        // Fallback update
        await supabase
          .from('profiles')
          .update({ full_name: fullName, role: role })
          .eq('id', user.id);
      }
    } catch (e) {
      console.warn('Profile database update warning:', e);
    }

    const updatedProfile = {
      id: user.id,
      full_name: fullName,
      role: role,
      created_at: profile?.created_at || user.created_at,
    };

    setProfile(updatedProfile);
    if (authData?.user) setUser(authData.user);
    return updatedProfile;
  };

  // Change Password
  const changePassword = async (newPassword) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) throw error;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        loading,
        login,
        signup,
        logout,
        updateProfile,
        changePassword,
        refreshProfile: () => fetchProfile(user),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

