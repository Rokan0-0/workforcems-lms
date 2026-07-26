import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const employees = db.getEmployees();
  const departments = db.getDepartments();
  return NextResponse.json({ employees, departments });
}
