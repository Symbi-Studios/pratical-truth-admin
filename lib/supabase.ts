import { createBrowserClient } from '@supabase/ssr';
import { createClient as createSupabaseJSClient } from '@supabase/supabase-js';

// Standard client for non-SSR/generic usage
export const supabase = createSupabaseJSClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_KEY!
);

// New replacement for createClientComponentClient
export const createSupabaseClient = () => {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_KEY!
  );
};
