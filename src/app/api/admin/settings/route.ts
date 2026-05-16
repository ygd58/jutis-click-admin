import { NextRequest, NextResponse } from 'next/server';
import { isConfigured, updateSetting } from '@/lib/supabase';

export async function PUT(request: NextRequest) {
  if (!isConfigured) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  const adminPassword = process.env.ADMIN_PASSWORD;
  const providedPassword = request.headers.get('x-admin-password');

  if (!adminPassword || providedPassword !== adminPassword) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { key, value } = await request.json();

    const allowedKeys = [
      'points_per_click',
      'daily_click_limit',
      'click_cooldown_ms',
      'click_to_xp_rate',
      'maintenance_mode'
    ];

    if (!key || !allowedKeys.includes(key)) {
      return NextResponse.json({
        error: 'Invalid setting key',
        allowedKeys
      }, { status: 400 });
    }

    await updateSetting(key, String(value));

    return NextResponse.json({ success: true, message: 'Setting updated' });
  } catch (error) {
    console.error('Admin settings PUT error:', error);
    return NextResponse.json({ error: 'Failed to update setting' }, { status: 500 });
  }
}