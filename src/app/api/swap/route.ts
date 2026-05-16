import { NextRequest, NextResponse } from 'next/server';
import { isConfigured, getUserByUsername, swapClicksToXP, getSetting, getTodayClicks } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  if (!isConfigured) {
    return NextResponse.json({
      success: false,
      message: 'Database not configured'
    }, { status: 503 });
  }

  try {
    const { username, clicks } = await request.json();

    if (!username || !clicks || clicks <= 0) {
      return NextResponse.json({
        success: false,
        message: 'Username and clicks amount required'
      }, { status: 400 });
    }

    const user = await getUserByUsername(username.trim());

    if (!user) {
      return NextResponse.json({
        success: false,
        message: 'User not found'
      }, { status: 404 });
    }

    if (user.status === 'banned') {
      return NextResponse.json({
        success: false,
        message: 'User is banned'
      }, { status: 403 });
    }

    const todayClicks = await getTodayClicks(user.id);

    if (todayClicks < clicks) {
      return NextResponse.json({
        success: false,
        message: `Not enough clicks (have ${todayClicks})`
      }, { status: 400 });
    }

    const xpRate = parseInt(await getSetting('click_to_xp_rate') || '100', 10);
    const xpGained = await swapClicksToXP(user.id, clicks, xpRate);

    return NextResponse.json({
      success: true,
      xpGained,
      remainingClicks: todayClicks - clicks,
      message: `Swapped ${clicks} clicks for ${xpGained} XP`
    });

  } catch (error) {
    console.error('Swap API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}