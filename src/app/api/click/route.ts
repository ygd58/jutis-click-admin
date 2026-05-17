import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Debug: env kontrolü
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({
      success: false,
      message: 'Missing env vars',
      debug: { hasUrl: !!supabaseUrl, hasKey: !!supabaseKey }
    }, { status: 503 });
  }

  try {
    const { username } = await request.json();
    if (!username) return NextResponse.json({ success: false, message: 'Username required' }, { status: 400 });

    const supabase = createClient(supabaseUrl, supabaseKey);

    // User bul veya oluştur
    let { data: user } = await supabase.from('users').select('*').eq('username', username.trim()).single();
    
    if (!user) {
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({ username: username.trim(), total_clicks: 0, xp_balance: 0, status: 'active' })
        .select().single();
      if (createError) return NextResponse.json({ success: false, message: createError.message }, { status: 500 });
      user = newUser;
    }

    if (user.status === 'banned') return NextResponse.json({ success: false, message: 'User is banned' }, { status: 403 });

    // Settings
    const { data: settings } = await supabase.from('game_settings').select('key, value');
    const s: Record<string, string> = {};
    settings?.forEach((r: {key: string, value: string}) => { s[r.key] = r.value; });

    if (s.maintenance_mode === 'true') return NextResponse.json({ success: false, message: 'Maintenance mode' }, { status: 503 });

    const dailyLimit = parseInt(s.daily_click_limit || '1000');
    const pointsPerClick = parseInt(s.points_per_click || '1');

    // Today clicks
    const today = new Date(); today.setHours(0,0,0,0);
    const { data: sessions } = await supabase.from('click_sessions').select('clicks').eq('user_id', user.id).gte('timestamp', today.toISOString());
    const todayClicks = sessions?.reduce((sum: number, s: {clicks: number}) => sum + s.clicks, 0) || 0;

    if (todayClicks >= dailyLimit) return NextResponse.json({ success: false, message: `Daily limit reached (${todayClicks}/${dailyLimit})` }, { status: 429 });

    // Record click
    await supabase.from('click_sessions').insert({ user_id: user.id, clicks: 1, timestamp: new Date().toISOString() });
    await supabase.from('users').update({ total_clicks: (user.total_clicks || 0) + 1 }).eq('id', user.id);

    return NextResponse.json({
      success: true,
      clicks: todayClicks + 1,
      points: (user.total_clicks || 0) + 1,
      message: 'Click recorded'
    });

  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ success: false, message: err.message || 'Unknown error' }, { status: 500 });
  }
}
