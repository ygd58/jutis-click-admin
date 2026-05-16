import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const isConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export async function getSetting(key: string): Promise<string | null> {
  const { data } = await supabase
    .from('game_settings')
    .select('value')
    .eq('key', key)
    .single();
  return data?.value ?? null;
}

export async function getAllSettings(): Promise<Record<string, string>> {
  const { data } = await supabase
    .from('game_settings')
    .select('key, value');

  const settings: Record<string, string> = {};
  data?.forEach((row) => {
    settings[row.key] = row.value;
  });
  return settings;
}

export async function updateSetting(key: string, value: string): Promise<boolean> {
  const { error } = await supabase
    .from('game_settings')
    .upsert({ key, value }, { onConflict: 'key' });
  return !error;
}

export async function getUser(userId: string): Promise<any> {
  const { data } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
  return data;
}

export async function getUserByUsername(username: string): Promise<any> {
  const { data } = await supabase
    .from('users')
    .select('*')
    .eq('username', username)
    .single();
  return data;
}

export async function createUser(username: string): Promise<any> {
  const { data } = await supabase
    .from('users')
    .insert({ username, total_clicks: 0, xp_balance: 0, status: 'active' })
    .select()
    .single();
  return data;
}

export async function getTodayClicks(userId: string): Promise<number> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data } = await supabase
    .from('click_sessions')
    .select('clicks')
    .eq('user_id', userId)
    .gte('timestamp', today.toISOString());

  let total = 0;
  data?.forEach((session) => {
    total += session.clicks;
  });
  return total;
}

export async function recordClicks(userId: string, clicks: number): Promise<void> {
  await supabase
    .from('click_sessions')
    .insert({ user_id: userId, clicks, timestamp: new Date().toISOString() });

  await supabase.rpc('increment_total_clicks', {
    user_id: userId,
    click_count: clicks,
  });
}

export async function swapClicksToXP(userId: string, clicks: number, xpRate: number): Promise<number> {
  const xpGained = Math.floor(clicks / xpRate);

  await supabase.rpc('decrement_clicks_and_increment_xp', {
    user_id: userId,
    clicks_to_remove: clicks,
    xp_to_add: xpGained,
  });

  await supabase
    .from('xp_transactions')
    .insert({
      user_id: userId,
      clicks_spent: clicks,
      xp_received: xpGained,
    });

  return xpGained;
}

export async function getUserTransactions(userId: string, limit = 20): Promise<any[]> {
  const { data } = await supabase
    .from('xp_transactions')
    .select('*')
    .eq('user_id', userId)
    .order('timestamp', { ascending: false })
    .limit(limit);
  return data || [];
}

export async function getAllUsers(page = 0, perPage = 20): Promise<any[]> {
  const { data } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false })
    .range(page * perPage, (page + 1) * perPage - 1);
  return data || [];
}

export async function updateUserStatus(userId: string, status: 'active' | 'banned'): Promise<void> {
  await supabase
    .from('users')
    .update({ status })
    .eq('id', userId);
}