import { NextRequest, NextResponse } from 'next/server';
import { isConfigured, getAllUsers } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  if (!isConfigured) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  const adminPassword = process.env.ADMIN_PASSWORD;
  const providedPassword = request.headers.get('x-admin-password');

  if (!adminPassword || providedPassword !== adminPassword) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const vaultApiUrl = process.env.VAULT_API_URL;
    const vaultApiKey = process.env.VAULT_API_KEY;

    if (!vaultApiUrl || !vaultApiKey) {
      return NextResponse.json({
        error: 'Vault API not configured in environment'
      }, { status: 500 });
    }

    const users = await getAllUsers(0, 1000);

    const xpData = users.map(user => ({
      username: user.username,
      xp_balance: user.xp_balance,
      total_clicks: user.total_clicks
    }));

    const response = await fetch(vaultApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${vaultApiKey}`
      },
      body: JSON.stringify({ users: xpData })
    });

    if (!response.ok) {
      throw new Error(`Vault API responded with ${response.status}`);
    }

    const result = await response.json();

    return NextResponse.json({
      success: true,
      message: `Sent ${xpData.length} user XP scores to Vault API`,
      response: result
    });
  } catch (error) {
    console.error('XP send error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to send XP to Vault API'
    }, { status: 500 });
  }
}