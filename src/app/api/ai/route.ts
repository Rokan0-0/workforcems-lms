import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';

function calculateDays(start: string, end: string): number {
  const s = new Date(start);
  const e = new Date(end);
  if (isNaN(s.getTime()) || isNaN(e.getTime())) return 0;
  const diffTime = Math.abs(e.getTime() - s.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
}

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();
    if (!query) {
      return NextResponse.json({ reply: 'Please ask a question.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const normalized = query.toLowerCase().trim();

    const cookieStore = cookies();
    const sessionEmployeeId = cookieStore.get('session_employee_id')?.value;

    const employees = db.getEmployees();
    const departments = db.getDepartments();
    const leaves = db.getLeaveRequests();
    const attendance = db.getAttendance();
    const payroll = db.getPayroll();
    const reviews = db.getPerformanceReviews();
    const postings = db.getJobPostings();
    const applicants = db.getJobApplicants();
    const courses = db.getTrainingCourses();
    const enrollments = db.getTrainingEnrollments();

    const currentEmployee = sessionEmployeeId ? employees.find(e => e.id === sessionEmployeeId) : null;
    const isEmployee = currentEmployee && currentEmployee.role === 'Employee';

    // Scoped DB collections for Gemini fallback context if user is an Employee
    const scopedEmployees = isEmployee ? employees.filter(e => e.id === sessionEmployeeId) : employees;
    const scopedDepartments = isEmployee ? departments.filter(d => d.id === currentEmployee.departmentId) : departments;
    const scopedLeaves = isEmployee ? leaves.filter(l => l.employeeId === sessionEmployeeId) : leaves;
    const scopedAttendance = isEmployee ? attendance.filter(a => a.employeeId === sessionEmployeeId) : attendance;
    const scopedPayroll = isEmployee ? payroll.filter(p => p.employeeId === sessionEmployeeId) : payroll;
    const scopedReviews = isEmployee ? reviews.filter(r => r.employeeId === sessionEmployeeId) : reviews;
    const scopedPostings = isEmployee ? [] : postings;
    const scopedApplicants = isEmployee ? [] : applicants;
    const scopedEnrollments = isEmployee ? enrollments.filter(e => e.employeeId === sessionEmployeeId) : enrollments;
    const scopedCourses = isEmployee ? courses.filter(c => enrollments.some(e => e.employeeId === sessionEmployeeId && e.courseId === c.id)) : courses;

    // ===================================================
    // RULE-BASED ENGINE FOR EMPLOYEES (Scoped to self)
    // ===================================================
    if (isEmployee) {
      // 1. Leave balance query
      if (normalized.includes('leave') && (normalized.includes('left') || normalized.includes('balance') || normalized.includes('days') || normalized.includes('time off'))) {
        const empLeaves = leaves.filter(l => l.employeeId === sessionEmployeeId);
        let annualUsed = 0;
        let sickUsed = 0;
        let casualUsed = 0;

        empLeaves.forEach(l => {
          if (l.status === 'Approved') {
            const days = calculateDays(l.startDate, l.endDate);
            if (l.leaveType === 'Annual') annualUsed += days;
            if (l.leaveType === 'Sick') sickUsed += days;
            if (l.leaveType === 'Casual') casualUsed += days;
          }
        });

        return NextResponse.json({
          reply: `Here is your current leave balance breakdown:`,
          widget: {
            type: 'summary',
            data: {
              'Annual Leave Remaining': `${Math.max(0, 20 - annualUsed)} days (Allocated: 20, Used: ${annualUsed})`,
              'Sick Leave Remaining': `${Math.max(0, 10 - sickUsed)} days (Allocated: 10, Used: ${sickUsed})`,
              'Casual Leave Remaining': `${Math.max(0, 5 - casualUsed)} days (Allocated: 5, Used: ${casualUsed})`
            }
          }
        });
      }

      // 2. Training/Onboarding deadline query
      if (normalized.includes('training') || normalized.includes('deadline') || normalized.includes('onboarding') || normalized.includes('task') || normalized.includes('course')) {
        const onboardingTasks = currentEmployee?.onboardingChecklist || [];
        const nextOnboarding = onboardingTasks
          .filter(t => !t.completed)
          .sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0];

        const myEnrollments = enrollments.filter(e => e.employeeId === sessionEmployeeId && e.status !== 'Completed');
        const activeCourses = myEnrollments.map(e => courses.find(c => c.id === e.courseId)).filter(Boolean);

        const summaryData: any = {};
        if (nextOnboarding) {
          summaryData['Next Onboarding Task'] = `${nextOnboarding.title} (Due: ${nextOnboarding.dueDate})`;
        }
        if (activeCourses.length > 0) {
          summaryData['Active Enrolled Courses'] = activeCourses.map(c => c?.title).join(', ');
        }
        
        if (Object.keys(summaryData).length === 0) {
          return NextResponse.json({
            reply: 'You have completed all onboarding tasks and have no active training enrollments.',
            widget: null
          });
        }

        return NextResponse.json({
          reply: `Here is your training deadline and onboarding summary:`,
          widget: {
            type: 'summary',
            data: summaryData
          }
        });
      }

      // 3. Last payslip query
      if (normalized.includes('payslip') || normalized.includes('payroll') || normalized.includes('salary') || normalized.includes('last pay') || normalized.includes('income')) {
        const myPayroll = payroll
          .filter(p => p.employeeId === sessionEmployeeId && p.status === 'Paid')
          .sort((a, b) => b.month.localeCompare(a.month))[0];

        if (!myPayroll) {
          return NextResponse.json({
            reply: 'No processed payslips found in your records.',
            widget: null
          });
        }

        return NextResponse.json({
          reply: `Here is a summary of your latest processed payslip for **${myPayroll.month}**:`,
          widget: {
            type: 'summary',
            data: {
              'Month': myPayroll.month,
              'Basic Base Salary': `₦${myPayroll.basePay.toLocaleString()}`,
              'Allowances': `₦${(myPayroll.allowanceHousing + myPayroll.allowanceTransport).toLocaleString()}`,
              'PAYE Income Tax': `₦${myPayroll.tax.toLocaleString()}`,
              'Pension Deduction': `₦${myPayroll.pension.toLocaleString()}`,
              'Manual Override/Adjustment': myPayroll.overrideAmount !== 0 ? `₦${myPayroll.overrideAmount.toLocaleString()} (${myPayroll.overrideReason || 'N/A'})` : '₦0',
              'Net Amount Paid': `₦${myPayroll.netPay.toLocaleString()}`
            }
          }
        });
      }
    }

    // Context current date: June 14, 2026
    const baseDate = new Date('2026-06-14');

    // ===================================================
    // RULE-BASED ENGINE (Matches demo suggestions instantly)
    // ===================================================

    // 1. Who is on leave next week?
    if (normalized.includes('leave') && (normalized.includes('next week') || normalized.includes('week'))) {
      const nextWeekStart = new Date('2026-06-15');
      const nextWeekEnd = new Date('2026-06-21');

      const nextWeekLeaves = leaves.filter(l => {
        const start = new Date(l.startDate);
        const end = new Date(l.endDate);
        return start <= nextWeekEnd && end >= nextWeekStart;
      });

      if (nextWeekLeaves.length === 0) {
        return NextResponse.json({
          reply: 'There are no employees scheduled for leave next week (June 15 - June 21, 2026).',
          widget: null
        });
      }

      const rows = nextWeekLeaves.map(l => {
        const emp = employees.find(e => e.id === l.employeeId);
        const dept = departments.find(d => d.id === emp?.departmentId);
        return {
          employee: emp?.name || 'Unknown',
          department: dept?.name || 'Unknown',
          dates: `${l.startDate} to ${l.endDate}`,
          type: l.leaveType,
          status: l.status,
          reason: l.reason
        };
      });

      return NextResponse.json({
        reply: `Here are the leave requests matching next week (June 15 - June 21, 2026):`,
        widget: {
          type: 'table',
          headers: ['Employee', 'Department', 'Dates', 'Type', 'Status', 'Reason'],
          rows
        }
      });
    }

    // 2. Who is due for a performance review?
    if (normalized.includes('performance review') || normalized.includes('due for review') || normalized.includes('needs review') || normalized.includes('employees due')) {
      const sixMonthsAgo = new Date('2025-12-14');

      const dueEmployees = employees.filter(emp => {
        const empReviews = reviews.filter(r => r.employeeId === emp.id);
        if (empReviews.length === 0) return true;
        const latestReview = empReviews.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
        const lastReviewDate = new Date(latestReview.date);
        return lastReviewDate < sixMonthsAgo;
      });

      const rows = dueEmployees.map(emp => {
        const dept = departments.find(d => d.id === emp.departmentId);
        const empReviews = reviews.filter(r => r.employeeId === emp.id);
        const lastDate = empReviews.length > 0 
          ? empReviews.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].date 
          : 'Never';

        return {
          name: emp.name,
          department: dept?.name || 'Unknown',
          role: emp.role,
          hireDate: emp.hireDate,
          lastReview: lastDate
        };
      });

      return NextResponse.json({
        reply: `There are ${dueEmployees.length} employees due for a performance review (either have never been reviewed, or last review was over 6 months ago):`,
        widget: {
          type: 'table',
          headers: ['Employee', 'Department', 'Role', 'Hire Date', 'Last Review'],
          rows
        }
      });
    }

    // 3. What is our total payroll cost?
    if (normalized.includes('payroll cost') || normalized.includes('total payroll') || normalized.includes('payroll cost this month')) {
      const targetMonth = '2026-05';
      const monthPayroll = payroll.filter(p => p.month === targetMonth);

      if (monthPayroll.length === 0) {
        return NextResponse.json({
          reply: `No payroll records found for ${targetMonth}.`,
          widget: null
        });
      }

      let totalBase = 0, totalHousing = 0, totalTransport = 0, totalTax = 0, totalPension = 0, totalNet = 0;

      monthPayroll.forEach(p => {
        totalBase += p.basePay;
        totalHousing += p.allowanceHousing;
        totalTransport += p.allowanceTransport;
        totalTax += p.tax;
        totalPension += p.pension;
        totalNet += p.netPay;
      });

      const totalGross = totalBase + totalHousing + totalTransport;

      return NextResponse.json({
        reply: `For **May 2026**, the total payroll breakdown is:`,
        widget: {
          type: 'summary',
          data: {
            'Gross Pay': `₦${totalGross.toLocaleString()}`,
            'Net Pay': `₦${totalNet.toLocaleString()}`,
            'PAYE Tax': `₦${totalTax.toLocaleString()}`,
            'Pension Contribution': `₦${totalPension.toLocaleString()}`,
            'Total Employees Paid': monthPayroll.length.toString()
          }
        }
      });
    }

    // 4. Which department has the highest attendance rate?
    if (normalized.includes('attendance rate') || normalized.includes('attendance trends') || normalized.includes('highest attendance')) {
      const deptRates: { [key: string]: { present: number, late: number, absent: number, total: number } } = {};

      departments.forEach(d => {
        deptRates[d.id] = { present: 0, late: 0, absent: 0, total: 0 };
      });

      attendance.forEach(att => {
        const emp = employees.find(e => e.id === att.employeeId);
        if (emp && deptRates[emp.departmentId]) {
          deptRates[emp.departmentId].total++;
          if (att.status === 'Present') deptRates[emp.departmentId].present++;
          if (att.status === 'Late') deptRates[emp.departmentId].late++;
          if (att.status === 'Absent') deptRates[emp.departmentId].absent++;
        }
      });

      const rows = departments.map(d => {
        const stats = deptRates[d.id];
        const presentLate = stats.present + stats.late;
        const rate = stats.total > 0 ? (presentLate / stats.total) * 100 : 0;
        return {
          department: d.name,
          present: stats.present,
          late: stats.late,
          absent: stats.absent,
          totalDays: stats.total,
          rate: `${rate.toFixed(1)}%`,
          numericRate: rate
        };
      }).sort((a, b) => b.numericRate - a.numericRate);

      const winner = rows[0];

      return NextResponse.json({
        reply: `The department with the highest attendance rate is **${winner.department}** at **${winner.rate}**. Here is the breakdown:`,
        widget: {
          type: 'table',
          headers: ['Department', 'Present Days', 'Late Days', 'Absent Days', 'Total Logs', 'Attendance Rate'],
          rows: rows.map(r => ({
            department: r.department,
            present: r.present,
            late: r.late,
            absent: r.absent,
            totalDays: r.totalDays,
            rate: r.rate
          }))
        }
      });
    }

    // 5. Query single employee detail
    const matchedEmployee = employees.find(emp => normalized.includes(emp.name.toLowerCase()) || emp.name.toLowerCase().split(' ').some(part => part.length > 3 && normalized.includes(part)));
    if (matchedEmployee) {
      const dept = departments.find(d => d.id === matchedEmployee.departmentId);
      const activeLeaves = leaves.filter(l => l.employeeId === matchedEmployee.id && l.status === 'Approved');
      const gross = matchedEmployee.salary.base + matchedEmployee.salary.housing + matchedEmployee.salary.transport;

      return NextResponse.json({
        reply: `I found details for **${matchedEmployee.name}**:`,
        widget: {
          type: 'summary',
          data: {
            'Role': matchedEmployee.role,
            'Department': dept?.name || 'Unknown',
            'Email': matchedEmployee.email,
            'Phone': matchedEmployee.contactInfo.phone,
            'Hire Date': matchedEmployee.hireDate,
            'Gross Salary': `₦${gross.toLocaleString()}/month`,
            'Approved Leaves': activeLeaves.length.toString()
          }
        }
      });
    }

    // ===================================================
    // FALLBACK TO LIVE GEMINI API (If Custom Query & Key Exists)
    // ===================================================
    if (apiKey) {
      const databaseJSON = {
        departments: scopedDepartments,
        employees: scopedEmployees,
        attendance: scopedAttendance,
        leaveRequests: scopedLeaves,
        payroll: scopedPayroll,
        performanceReviews: scopedReviews,
        jobPostings: scopedPostings,
        jobApplicants: scopedApplicants,
        trainingCourses: scopedCourses,
        trainingEnrollments: scopedEnrollments
      };

      const systemPrompt = `You are the AI HR Specialist Assistant for the company "Workforcely Demo Co" (a Nigerian retail/fintech hybrid).
You have access to the complete current database of the company.
Your goal is to answer the user's natural language query using the provided database.
Current date context is Sunday, June 14, 2026. Use this date for any calculations (such as "next week", "this month", "past 3 months").

Database:
${JSON.stringify(databaseJSON, null, 2)}

Instructions:
1. Formulate a helpful, detailed, conversational response to the user's query in Markdown.
2. If the user's query requests listing data, statistics, or reports, formulate a "widget" object that contains the structured data.
3. The widget can be of type "table" or "summary".
   - If type is "table", provide "headers" (array of strings) and "rows" (array of objects where keys match columns). Keep table columns clear and simple.
   - If type is "summary", provide a "data" object containing key-value pairs of statistics/KPIs.
   - If no structured table or stats are needed (e.g., general conversation), set "widget" to null.
4. You MUST respond in JSON format conforming to this schema:
{
  "reply": "string (Markdown format)",
  "widget": null | {
    "type": "table",
    "headers": ["header1", "header2"],
    "rows": [
      { "header1": "value1", "header2": "value2" }
    ]
  } | {
    "type": "summary",
    "data": {
      "Label": "Value"
    }
  }
}
5. Do not include any JSON markdown wrapping (e.g. \`\`\`json). Just return the raw JSON object.
`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `${systemPrompt}\n\nUser Query: ${query}`
                }
              ]
            }
          ],
          generationConfig: {
            responseMimeType: 'application/json'
          }
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error('Gemini API error response:', errText);
        throw new Error(`Gemini API returned status ${response.status}`);
      }

      const result = await response.json();
      let text = result.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!text) {
        throw new Error('Gemini API returned empty text');
      }

      // Strip code block wrappers if present
      text = text.trim();
      if (text.startsWith('```')) {
        text = text.replace(/^```json\s*/, '').replace(/```\s*$/, '');
      }

      const parsedData = JSON.parse(text);
      return NextResponse.json(parsedData);
    }

    // Default Fallback Response (No API Key & No Rule Matched)
    return NextResponse.json({
      reply: `I'm not sure how to answer that specific query. I can execute live queries over the database for these questions:
1. "Who is on leave next week?"
2. "Show me employees due for a performance review"
3. "What's our total payroll cost this month?"
4. "Which department has the highest attendance rate?"
5. Search an employee by name (e.g. "Tell me about Chioma Obi")`,
      widget: null
    });

  } catch (error: any) {
    console.error('AI Route error:', error);
    return NextResponse.json({
      reply: `Sorry, I encountered an error when trying to query the AI Model: ${error.message}. Please verify the API key and try again.`,
      widget: null
    }, { status: 500 });
  }
}
