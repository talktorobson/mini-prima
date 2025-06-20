// Supabase client configuration for D'Avila Reis Legal Practice Management System
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { supabaseConfig } from '@/lib/env';

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(
  supabaseConfig.url,
  supabaseConfig.anonKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      // Session timeout configuration for security
      storageKey: 'supabase.auth.token',
      storage: {
        getItem: (key: string) => {
          // Custom storage logic with expiration check
          const item = localStorage.getItem(key);
          if (!item) return null;
          
          try {
            const parsed = JSON.parse(item);
            const now = Date.now();
            
            // Check for session expiration (24 hours = 86400000 ms)
            if (parsed.expires_at && now > parsed.expires_at * 1000) {
              localStorage.removeItem(key);
              return null;
            }
            
            return item;
          } catch {
            return item;
          }
        },
        setItem: (key: string, value: string) => {
          localStorage.setItem(key, value);
        },
        removeItem: (key: string) => {
          localStorage.removeItem(key);
        }
      },
      // Additional security configuration
      flowType: 'pkce',
      debug: process.env.NODE_ENV === 'development'
    },
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    },
    global: {
      headers: {
        'X-Client-Info': 'mini-prima@1.0.0'
      }
    }
  }
);