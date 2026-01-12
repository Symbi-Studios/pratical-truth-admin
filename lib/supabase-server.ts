// lib/supabase.ts
import { createBrowserClient, createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// 1. FOR CLIENT COMPONENTS (Browser)
// This replaces your createSupabaseClient and generic supabase client
export const createBrowserSupabaseClient = () => {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
};

// 2. FOR SERVER COMPONENTS / ROUTE HANDLERS (Server)
// Use this inside 'async' functions on the server
export const createServerSupabaseClient = async () => {
  const cookieStore = await cookies(); // Await required in Next.js 15+

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_KEY !,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Can be ignored if middleware handles session refreshing
          }
        },
      },
    }
  );
};
