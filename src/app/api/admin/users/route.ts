import { NextRequest, NextResponse } from 'next/server';
import { isConfigured, updateSetting, getAllUsers } from '@/lib/supabase';

export async function GET() {
  if (!isConfigured) {
    return NextResponse.json({ users: [] });
  }

  try {
    const users = await getAllUsers();
    return NextResponse.json({ users });
  } catch (error) {
    console.error('Admin users GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}