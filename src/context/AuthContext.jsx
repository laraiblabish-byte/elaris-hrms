import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { getEmployees, createEmployee } from '../utils/dbHelpers';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [currentEmployee, setCurrentEmployee] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // Match or create employee record for current user
  const fetchEmployee = async (currentUser, prof) => {
    if (!currentUser) {
      setCurrentEmployee(null);
      return null;
    }

    try {
      const email = (currentUser.email || '').toLowerCase().trim();
      const emps = await getEmployees();
      let match = emps.find((e) => (e.email || '').toLowerCase().trim() === email);

      if (!match) {
        // If no employee profile exists with this email, create one
        const empName = prof?.full_name || currentUser.user_metadata?.full_name || email.split('@')[0];
        const roleName = prof?.role || currentUser.user_metadata?.role || 'Employee';
        const isUserHR = ['HR Admin', 'HR Manager', 'Admin'].includes(roleName);
        const created = await createEmployee({
          full_name: empName,
          name: empName,
          email: email,
          department: isUserHR ? 'HR' : 'Software Development',
          designation: isUserHR ? 'HR Specialist' : 'Staff Engineer',
          role_tier: 'Mid-Level',
          salary: isUserHR ? 120000 : 90000,
        });
        if (created && created[0]) {
          match = created[0];
        }
      }

      setCurrentEmployee(match || null);
      return match;
    } catch (err) {
      console.warn('Error fetching employee record for user:', err);
      return null;
    }
  };

  // Fetch or create profile for user
  const fetchProfile = async (currentUser) => {
    if (!currentUser) {
      setProfile(null);
      setCurrentEmployee(null);
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

      let resProfile = null;
      if (data) {
        setProfile(data);
        resProfile = data;
      } else {
        // Fallback default profile using auth user metadata
        const fallbackProfile = {
          id: currentUser.id,
          full_name: currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'User',
          role: currentUser.user_metadata?.role || 'Employee',
          created_at: currentUser.created_at,
        };
        setProfile(fallbackProfile);
        resProfile = fallbackProfile;
      }

      // Concurrently fetch linked employee record
      await fetchEmployee(currentUser, resProfile);
      return resProfile;
    } catch (err) {
      console.warn('Profile retrieval error:', err);
      const fallback = {
        id: currentUser.id,
        full_name: currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'User',
        role: currentUser.user_metadata?.role || 'Employee',
      };
      setProfile(fallback);
      await fetchEmployee(currentUser, fallback);
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

  const userRole = profile?.role || user?.user_metadata?.role || 'HR Admin';
  const isSuperAdmin = userRole === 'Admin';
  const isHR = isSuperAdmin || ['HR Admin', 'HR Manager'].includes(userRole) || userRole.toLowerCase().includes('admin') || userRole.toLowerCase().includes('hr');
  const isDeptHead = isSuperAdmin || userRole === 'Department Head' || userRole.toLowerCase().includes('head');
  const isEmployee = userRole === 'Employee';

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        currentEmployee,
        role: userRole,
        isHR,
        isDeptHead,
        isEmployee,
        isSuperAdmin,
        session,
        loading,
        login,
        signup,
        logout,
        updateProfile,
        changePassword,
        refreshProfile: () => fetchProfile(user),
        refreshEmployee: () => fetchEmployee(user, profile),
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

