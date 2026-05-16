import { NextRequest, NextResponse } from 'next/server';
import { isConfigured, getUserByUsername, createUser, getSetting, getTodayClicks, recordClicks } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  if (!isConfigured) {
    return NextResponse.json({
      success: false,
      message: 'Database not configured'
    }, { status: 503 });
  }

  try {
    const { username } = await request.json();

    if (!username || username.trim().length === 0) {
      return NextResponse.json({
        success: false,
        message: 'Username required'
      }, { status: 400 });
    }

    const trimmedUsername = username.trim().slice(0, 30);

    let user = await getUserByUsername(trimmedUsername);

    if (!user) {
      user = await createUser(trimmedUsername);
    }

    if (user.status === 'banned') {
      return NextResponse.json({
        success: false,
        message: 'User is banned'
      }, { status: 403 });
    }

    const maintenanceMode = await getSetting('maintenance_mode');
    if (maintenanceMode === 'true') {
      return NextResponse.json({
        success: false,
        message: 'Game is under maintenance'
      }, { status: 503 });
    }

    const dailyLimit = parseInt(await getSetting('daily_click_limit') || '1000', 10);
    const cooldownMs = parseInt(await getSetting('click_cooldown_ms') || '0', 10);
    const pointsPerClick = parseInt(await getSetting('points_per_click') || '1', 10);

    const todayClicks = await getTodayClicks(user.id);

    if (todayClicks >= dailyLimit) {
      return NextResponse.json({
        success: false,
        message: `Daily limit reached (${todayClicks}/${dailyLimit})`
      }, { status: 429 });
    }

    const lastClickKey = `last_click_${user.id}`;
    const now = Date.now();

    if (cooldownMs > 0) {
      const lastClick = parseInt(request.headers.get(lastClickKey) || '0', 10);
      if (now - lastClick < cooldownMs) {
        return NextResponse.json({
          success: false,
          message: `Please wait ${cooldownMs}ms between clicks`
        }, { status: 429 });
      }
    }

    await recordClicks(user.id, 1);

    return NextResponse.json({
      success: true,
      clicks: todayClicks + 1,
      points: (todayClicks + 1) * pointsPerClick,
      message: 'Click recorded'
    });

  } catch (error) {
    console.error('Click API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}