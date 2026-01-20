import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface SubscriptionState {
  isSubscribed: boolean;
  tier: string;
  productId: string | null;
  subscriptionEnd: string | null;
  features: {
    unlimitedRetakes: boolean;
    progressTracking: boolean;
    allAssessments: boolean;
    aiJobMatching: boolean;
    familyMembers: number;
  };
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  subscription: SubscriptionState;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signInWithGoogle: (redirectTo?: string, hostedDomain?: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  updatePassword: (password: string) => Promise<{ error: any }>;
  refreshSubscription: () => Promise<void>;
}

const defaultSubscription: SubscriptionState = {
  isSubscribed: false,
  tier: 'free',
  productId: null,
  subscriptionEnd: null,
  features: {
    unlimitedRetakes: false,
    progressTracking: false,
    allAssessments: false,
    aiJobMatching: false,
    familyMembers: 0
  }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<SubscriptionState>(defaultSubscription);

  const checkSubscription = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('check-subscription');
      if (error) throw error;
      
      setSubscription({
        isSubscribed: data.subscribed || false,
        tier: data.tier || 'free',
        productId: data.productId || null,
        subscriptionEnd: data.subscriptionEnd || null,
        features: data.features || defaultSubscription.features
      });
    } catch (error) {
      console.error('Error checking subscription:', error);
      setSubscription(defaultSubscription);
    }
  }, []);

  const refreshSubscription = useCallback(async () => {
    await checkSubscription();
  }, [checkSubscription]);

  useEffect(() => {
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        if (session?.user) {
          setTimeout(() => checkSubscription(), 0);
        } else {
          setSubscription(defaultSubscription);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.user) {
        checkSubscription();
      }
    });

    return () => authSubscription.unsubscribe();
  }, [checkSubscription]);

  // Auto-refresh subscription every 60 seconds
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(checkSubscription, 60000);
    return () => clearInterval(interval);
  }, [user, checkSubscription]);

  const signUp = async (email: string, password: string, fullName?: string) => {
    const redirectUrl = `${window.location.origin}/`;
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { emailRedirectTo: redirectUrl, data: { full_name: fullName } },
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signInWithGoogle = async (redirectTo?: string, hostedDomain?: string) => {
    const redirectUrl = redirectTo || `${window.location.origin}/`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: redirectUrl, queryParams: hostedDomain ? { hd: hostedDomain } : undefined },
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSubscription(defaultSubscription);
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { error };
  };

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    return { error };
  };

  const value = {
    user, session, loading, subscription,
    signUp, signIn, signInWithGoogle, signOut, resetPassword, updatePassword, refreshSubscription,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};