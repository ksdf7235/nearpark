/**
 * Supabase 클라이언트 설정
 * 
 * 클라이언트 사이드와 서버 사이드에서 사용할 수 있는 Supabase 클라이언트를 제공합니다.
 */

import { createClient } from "@supabase/supabase-js";

// 클라이언트 사이드에서는 NEXT_PUBLIC_ 접두사가 필요
// 서버 사이드에서는 SUPABASE_URL도 사용 가능하지만, 클라이언트에서는 NEXT_PUBLIC_ 필요
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error(
    "Supabase URL이 설정되지 않았습니다.\n" +
      ".env.local에 NEXT_PUBLIC_SUPABASE_URL 또는 SUPABASE_URL을 추가하세요."
  );
}

if (!supabaseAnonKey) {
  throw new Error(
    "Supabase Anon Key가 설정되지 않았습니다.\n" +
      ".env.local에 NEXT_PUBLIC_SUPABASE_ANON_KEY를 추가하세요.\n" +
      "(Supabase Dashboard > Settings > API > anon/public 키)"
  );
}

/**
 * 클라이언트 사이드용 Supabase 클라이언트
 * RLS(Row Level Security) 정책이 적용됩니다.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

