import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const notifications = db.getNotifications();
  return NextResponse.json({ notifications });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, id } = body;
    const notifications = db.getNotifications();

    if (action === 'markRead') {
      if (id) {
        const note = notifications.find(n => n.id === id);
        if (note) note.read = true;
      } else {
        notifications.forEach(n => { n.read = true; });
      }
      db.updateNotifications(notifications);
    }
    return NextResponse.json({ success: true, notifications });
  } catch (err) {
    return NextResponse.json({ success: false, error: 'Failed to update notification' }, { status: 400 });
  }
}
