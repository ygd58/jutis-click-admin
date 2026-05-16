import { NextRequest, NextResponse } from 'next/server';
import { isConfigured, getUserByUsername, getTodayClicks, getUserTransactions } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const username = request.nextUrl.searchParams.get('username');

  if (!username) {
    return NextResponse.json({ error: 'Username required' }, { status: 400 });
  }

  if (!isConfigured) {
    return NextResponse.json({
      profile: { username, total_clicks: 0, xp_balance: 0 },
      todayClicks: 0,
      transactions: []
    });
  }

  try {
    const user = await getUserByUsername(username);

    if (!user) {
      return NextResponse.json({
        profile: { username, total_clicks: 0, xp_balance: 0 },
        todayClicks: 0,
        transactions: []
      });
    }

    const todayClicks = await getTodayClicks(user.id);
    const transactions = await getUserTransactions(user.id);

    return NextResponse.json({
      profile: {
        username: user.username,
        total_clicks: user.total_clicks,
        xp_balance: user.xp_balance
      },
      todayClicks,
      transactions
    });
  } catch (error) {
    console.error('User API error:', error);
    return NextResponse.json({ error: 'Failed to fetch user data' }, { status: 500 });
  }
}