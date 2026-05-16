import { NextResponse } from 'next/server';
import { isConfigured, getAllSettings } from '@/lib/supabase';

export async function GET() {
  if (!isConfigured) {
    return NextResponse.json({
      points_per_click: '1',
      daily_click_limit: '1000',
      click_cooldown_ms: '0',
      click_to_xp_rate: '100',
      maintenance_mode: 'false'
    });
  }

  try {
    const settings = await getAllSettings();

    return NextResponse.json({
      points_per_click: settings.points_per_click || '1',
      daily_click_limit: settings.daily_click_limit || '1000',
      click_cooldown_ms: settings.click_cooldown_ms || '0',
      click_to_xp_rate: settings.click_to_xp_rate || '100',
      maintenance_mode: settings.maintenance_mode || 'false'
    });
  } catch (error) {
    console.error('Settings GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}