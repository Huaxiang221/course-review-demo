import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://cfgbyfmyrfjnvwhypigm.supabase.co";
const supabaseAnonKey = "sb_publishable_pY2F8k5sj4FyI5J3Wi6VPw_X5XUnlhD";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);