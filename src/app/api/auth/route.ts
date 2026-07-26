import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  const cookieStore = cookies();
  const employeeId = cookieStore.get('session_employee_id')?.value;

  if (!employeeId) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const employees = db.getEmployees();
  const user = employees.find(e => e.id === employeeId);

  if (!user) {
    // Clear invalid session
    const response = NextResponse.json({ authenticated: false }, { status: 401 });
    response.cookies.delete('session_employee_id');
    return response;
  }

  return NextResponse.json({ authenticated: true, user });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { employeeId, action } = body;

    const cookieStore = cookies();

    if (action === 'logout') {
      const response = NextResponse.json({ success: true, message: 'Logged out successfully' });
      response.cookies.set('session_employee_id', '', { path: '/', maxAge: 0 });
      return response;
    }

    if (!employeeId) {
      return NextResponse.json({ success: false, error: 'Employee ID is required' }, { status: 400 });
    }

    const employees = db.getEmployees();
    const user = employees.find(e => e.id === employeeId);

    if (!user) {
      return NextResponse.json({ success: false, error: 'Employee not found' }, { status: 404 });
    }

    const response = NextResponse.json({ success: true, user });
    response.cookies.set('session_employee_id', employeeId, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });

    return response;
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Invalid request payload' }, { status: 400 });
  }
}
