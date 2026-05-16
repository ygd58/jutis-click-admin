import { NextRequest, NextResponse } from 'next/server';
import { isConfigured, updateUserStatus } from '@/lib/supabase';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isConfigured) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  const adminPassword = process.env.ADMIN_PASSWORD;
  const providedPassword = request.headers.get('x-admin-password');

  if (!adminPassword || providedPassword !== adminPassword) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const { action } = await request.json();

    if (!id || !action) {
      return NextResponse.json({ error: 'User ID and action required' }, { status: 400 });
    }

    if (action === 'ban') {
      await updateUserStatus(id, 'banned');
    } else if (action === 'activate') {
      await updateUserStatus(id, 'active');
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: `User ${action}d successfully` });
  } catch (error) {
    console.error('Admin user PUT error:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}