import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { username, clicks } = await request.json();
    if (!username || !clicks || clicks <= 0) return NextResponse.json({ success:false, message:'Username and clicks required' }, { status:400 });

    // User bul
    const { data: user } = await supabase.from('users').select('*').eq('username', username.trim()).single();
    if (!user) return NextResponse.json({ success:false, message:'User not found' }, { status:404 });
    if (user.status === 'banned') return NextResponse.json({ success:false, message:'User is banned' }, { status:403 });

    // Yeterli click var mı?
    if (user.total_clicks < clicks) return NextResponse.json({ success:false, message:`Not enough clicks (have ${user.total_clicks})` }, { status:400 });

    // XP rate
    const { data: rateSetting } = await supabase.from('game_settings').select('value').eq('key','click_to_xp_rate').single();
    const xpRate = parseInt(rateSetting?.value || '100');
    const xpGained = Math.floor(clicks / xpRate);

    if (xpGained <= 0) return NextResponse.json({ success:false, message:`Need at least ${xpRate} clicks to swap` }, { status:400 });

    // Swap yap - click azalt, XP artır
    await supabase.from('users').update({
      total_clicks: user.total_clicks - clicks,
      xp_balance: (user.xp_balance || 0) + xpGained
    }).eq('id', user.id);

    // Transaction kaydet
    await supabase.from('xp_transactions').insert({
      user_id: user.id,
      clicks_spent: clicks,
      xp_received: xpGained
    });

    return NextResponse.json({
      success: true,
      xpGained,
      newClicks: user.total_clicks - clicks,
      newXp: (user.xp_balance || 0) + xpGained,
      message: `Swapped ${clicks} clicks → ${xpGained} XP`
    });

  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ success:false, message: err.message }, { status:500 });
  }
}
