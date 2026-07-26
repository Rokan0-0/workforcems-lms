import { NextRequest, NextResponse } from 'next/server';
import { db, EmployeeHMOEnrollment, EWARequest, HMOClaim } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const hmoPlans = db.getHmoPlans();
  const hmoEnrollments = db.getHmoEnrollments();
  const hmoClaims = db.getHmoClaims();
  const ewaRequests = db.getEwaRequests();
  return NextResponse.json({ hmoPlans, hmoEnrollments, hmoClaims, ewaRequests });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, employeeId, planId, dependants, amount, hospitalName, diagnosis, receiptUrl, claimId, status, outcomeNote } = body;

    const hmoEnrollments = db.getHmoEnrollments();
    const hmoClaims = db.getHmoClaims();
    const ewaRequests = db.getEwaRequests();

    if (action === 'enrollHmo') {
      if (!employeeId || !planId) {
        return NextResponse.json({ success: false, error: 'Employee ID and Plan ID are required' }, { status: 400 });
      }

      const existingIdx = hmoEnrollments.findIndex(e => e.employeeId === employeeId);
      const newEnrollment: EmployeeHMOEnrollment = {
        id: existingIdx >= 0 ? hmoEnrollments[existingIdx].id : `hmo-en-${Date.now()}`,
        employeeId,
        planId,
        dependants: dependants || [],
        enrolledDate: new Date().toISOString().split('T')[0]
      };

      if (existingIdx >= 0) {
        hmoEnrollments[existingIdx] = newEnrollment;
      } else {
        hmoEnrollments.push(newEnrollment);
      }

      db.updateHmoEnrollments(hmoEnrollments);
      return NextResponse.json({ success: true, enrollment: newEnrollment });
    }

    if (action === 'submitClaim') {
      if (!employeeId || !hospitalName || !amount || !diagnosis) {
        return NextResponse.json({ success: false, error: 'Employee ID, hospital name, diagnosis and amount are required' }, { status: 400 });
      }

      const newClaim: HMOClaim = {
        id: `claim-${Date.now()}`,
        employeeId,
        claimDate: new Date().toISOString().split('T')[0],
        hospitalName,
        diagnosis,
        amount: Number(amount),
        receiptUrl: receiptUrl || 'medical_receipt.pdf',
        status: 'Pending HR Review'
      };

      hmoClaims.push(newClaim);
      db.updateHmoClaims(hmoClaims);
      return NextResponse.json({ success: true, claim: newClaim });
    }

    if (action === 'updateClaimStatus') {
      if (!claimId || !status) {
        return NextResponse.json({ success: false, error: 'Claim ID and status are required' }, { status: 400 });
      }

      const claimIdx = hmoClaims.findIndex(c => c.id === claimId);
      if (claimIdx === -1) {
        return NextResponse.json({ success: false, error: 'Claim not found' }, { status: 404 });
      }

      hmoClaims[claimIdx].status = status;
      if (outcomeNote) hmoClaims[claimIdx].outcomeNote = outcomeNote;

      db.updateHmoClaims(hmoClaims);
      return NextResponse.json({ success: true, claim: hmoClaims[claimIdx] });
    }

    if (action === 'requestEwa') {
      if (!employeeId || !amount) {
        return NextResponse.json({ success: false, error: 'Employee ID and requested amount are required' }, { status: 400 });
      }

      const employee = db.getEmployees().find(e => e.id === employeeId);
      if (!employee) {
        return NextResponse.json({ success: false, error: 'Employee not found' }, { status: 404 });
      }

      const gross = employee.salary.base + employee.salary.housing + employee.salary.transport;
      const maxEarned = Math.round(gross * 0.5);
      const reqAmt = Number(amount);

      if (reqAmt > maxEarned * 0.5) {
        return NextResponse.json({
          success: false,
          error: `Requested amount exceeds max available EWA limit (₦${(maxEarned * 0.5).toLocaleString()})`
        }, { status: 400 });
      }

      const newRequest: EWARequest = {
        id: `ewa-${Date.now()}`,
        employeeId,
        month: new Date().toISOString().substring(0, 7),
        earnedAmount: maxEarned,
        requestedAmount: reqAmt,
        fee: 500,
        status: 'Disbursed',
        requestDate: new Date().toISOString().split('T')[0]
      };

      ewaRequests.push(newRequest);
      db.updateEwaRequests(ewaRequests);
      return NextResponse.json({ success: true, ewaRequest: newRequest });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ success: false, error: 'Server error processing request' }, { status: 500 });
  }
}
