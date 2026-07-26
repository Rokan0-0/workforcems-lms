import fs from 'fs';
import path from 'path';

// Define DB Types
export interface Department {
  id: string;
  name: string;
  managerId: string;
}

export interface OnboardingTask {
  id: string;
  title: string;
  completed: boolean;
  dueDate: string;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  role: 'HR Admin' | 'Employee';
  departmentId: string;
  hireDate: string;
  salary: {
    base: number;
    housing: number;
    transport: number;
  };
  contactInfo: {
    phone: string;
    address: string;
    nextOfKin: string;
  };
  profilePhoto: string;
  onboardingChecklist: OnboardingTask[];
}

export interface Attendance {
  id: string;
  employeeId: string;
  date: string; // YYYY-MM-DD
  clockIn: string; // HH:MM:SS
  clockOut: string | null; // HH:MM:SS
  status: 'Present' | 'Late' | 'Absent';
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  leaveType: 'Annual' | 'Sick' | 'Casual';
  startDate: string;
  endDate: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  reason: string;
  approvalComment?: string;
}

export interface Payroll {
  id: string;
  employeeId: string;
  month: string; // YYYY-MM
  basePay: number;
  allowanceHousing: number;
  allowanceTransport: number;
  tax: number;
  pension: number;
  overrideAmount: number;
  overrideReason?: string;
  netPay: number;
  status: 'Paid' | 'Draft';
  paymentDate?: string;
}

export interface Goal {
  id: string;
  title: string;
  weight: number; // percentage
  status: 'Not Started' | 'In Progress' | 'Completed';
}

export interface PerformanceReview {
  id: string;
  employeeId: string;
  reviewCycle: string;
  rating: number; // 1-5 scale
  goals: Goal[];
  comments: string;
  reviewerId: string;
  date: string;
}

export interface JobPosting {
  id: string;
  title: string;
  departmentId: string;
  description: string;
  status: 'Open' | 'Closed';
  createdDate: string;
  closingDate?: string;
}

export interface JobApplicant {
  id: string;
  jobId: string;
  name: string;
  email: string;
  phone?: string;
  resumeUrl: string;
  resumeText?: string;
  coverNote?: string;
  status: 'Applied' | 'Shortlisted' | 'Interview' | 'Offer' | 'Hired' | 'Rejected';
  appliedDate: string;
}

export interface TrainingModule {
  id: string;
  title: string;
  content: string;
  duration: string;
  videoUrl?: string;
}

export interface TrainingQuizQuestion {
  id: string;
  type: 'multiple-choice' | 'true-false';
  question: string;
  options?: string[];
  correctAnswer: string;
}

export interface TrainingQuiz {
  id: string;
  title: string;
  passMark: number;
  maxAttempts: number;
  questions: TrainingQuizQuestion[];
}

export interface TrainingCourse {
  id: string;
  title: string;
  description: string;
  duration: string; // e.g. "4 weeks", "6 hours"
  category?: 'Technical' | 'Compliance' | 'Soft Skills' | 'Leadership' | 'Other';
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced';
  thumbnail?: string;
  modules?: TrainingModule[];
  quiz?: TrainingQuiz;
  provider?: string;
  link?: string;
  external?: boolean;
}

export interface TrainingCertificate {
  issueDate: string;
  score: number;
  employeeName: string;
  courseName: string;
  passMark: number;
}

export interface TrainingEnrollment {
  id: string;
  courseId: string;
  employeeId: string;
  status: 'Enrolled' | 'In Progress' | 'Completed';
  progress: number; // 0 to 100
  currentLessonIndex?: number;
  completedLessons: string[];
  quizAttempts: number;
  quizScore?: number;
  quizPassed?: boolean;
  certificate?: TrainingCertificate;
}

export interface Memo {
  id: string;
  title: string;
  body: string;
  targetAudience: 'All Staff' | 'Specific Department';
  departmentId?: string;
  createdDate: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  audience: 'All Staff' | 'Specific Employee' | 'Specific Department';
  recipientId?: string;
  departmentId?: string;
  read: boolean;
  createdDate: string;
}

export interface IncidentHistoryEntry {
  status: 'Under Review' | 'Verbal Warning' | 'Written Warning' | 'Suspension' | 'Resolved' | 'Escalated';
  note: string;
  date: string;
}

export interface IncidentReport {
  id: string;
  employeeId: string;
  targetEmployeeId?: string;
  category: string;
  description: string;
  evidenceNote?: string;
  date: string;
  status: 'Under Review' | 'Verbal Warning' | 'Written Warning' | 'Suspension' | 'Resolved' | 'Escalated';
  history: IncidentHistoryEntry[];
}

export interface HMOPlan {
  id: string;
  provider: string;
  tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  monthlyCost: number;
  hospitalCount: number;
  coveredLimit: string;
}

export interface EmployeeHMOEnrollment {
  id: string;
  employeeId: string;
  planId: string;
  dependants: { name: string; relationship: 'Spouse' | 'Child'; dob: string }[];
  enrolledDate: string;
}

export interface DisciplinaryQuery {
  id: string;
  employeeId: string;
  issuedBy: string;
  title: string;
  category: 'Absence' | 'Negligence' | 'Misconduct' | 'Performance' | 'Policy Violation';
  description: string;
  issuedDate: string;
  deadlineDate: string;
  defenseText?: string;
  defenseSubmittedDate?: string;
  status: 'Pending Response' | 'Under HR Review' | 'Resolved' | 'Warning Issued' | 'Escalated';
  resolutionNote?: string;
}

export interface EWARequest {
  id: string;
  employeeId: string;
  month: string;
  earnedAmount: number;
  requestedAmount: number;
  fee: number;
  status: 'Approved' | 'Disbursed' | 'Rejected';
  requestDate: string;
}

export interface HMOClaim {
  id: string;
  employeeId: string;
  claimDate: string;
  hospitalName: string;
  diagnosis: string;
  amount: number;
  receiptUrl?: string;
  status: 'Pending HR Review' | 'Approved & Refunded' | 'Rejected';
  outcomeNote?: string;
}

export interface DatabaseSchema {
  departments: Department[];
  employees: Employee[];
  attendance: Attendance[];
  leaveRequests: LeaveRequest[];
  payroll: Payroll[];
  performanceReviews: PerformanceReview[];
  jobPostings: JobPosting[];
  jobApplicants: JobApplicant[];
  memos: Memo[];
  notifications: Notification[];
  incidentReports: IncidentReport[];
  trainingCourses: TrainingCourse[];
  trainingEnrollments: TrainingEnrollment[];
  hmoPlans: HMOPlan[];
  hmoEnrollments: EmployeeHMOEnrollment[];
  hmoClaims: HMOClaim[];
  disciplinaryQueries: DisciplinaryQuery[];
  ewaRequests: EWARequest[];
}

const DB_FILE = path.join(process.cwd(), 'db.json');

// Progressive tax calculation based on Nigerian PAYE (simplified)
export function calculateNigerianTax(grossPay: number): number {
  if (grossPay <= 50000) return grossPay * 0.05;
  if (grossPay <= 100000) return 2500 + (grossPay - 50000) * 0.10;
  if (grossPay <= 200000) return 7500 + (grossPay - 100000) * 0.15;
  return 22500 + (grossPay - 200000) * 0.20;
}

export function calculateNigerianPension(salary: { base: number; housing: number; transport: number }): number {
  // Pension Reform Act: 8% of Basic + Housing + Transport
  const monthlyGross = salary.base + salary.housing + salary.transport;
  return monthlyGross * 0.08;
}

export function calculateNigerianNHF(baseSalary: number): number {
  return baseSalary * 0.025;
}

export function calculateNigerianNSITF(grossSalary: number): number {
  return grossSalary * 0.01;
}

export function calculateNigerianITF(grossSalary: number): number {
  return grossSalary * 0.01;
}

// Default Seed Data
const getSeedData = (): DatabaseSchema => {
  const departments: Department[] = [
    { id: 'dept-1', name: 'Engineering', managerId: 'emp-1' },
    { id: 'dept-2', name: 'Sales & Marketing', managerId: 'emp-4' },
    { id: 'dept-3', name: 'Finance & Risk', managerId: 'emp-3' },
    { id: 'dept-4', name: 'Human Resources', managerId: 'emp-2' },
    { id: 'dept-5', name: 'Operations', managerId: 'emp-5' },
  ];

  const employees: Employee[] = [
    {
      id: 'emp-1',
      name: 'Chioma Obi',
      email: 'chioma.obi@workforcely.com',
      role: 'HR Admin',
      departmentId: 'dept-1',
      hireDate: '2023-01-15',
      salary: { base: 850000, housing: 250000, transport: 100000 },
      contactInfo: { phone: '+234 803 111 2222', address: '12 Lekki Phase 1, Lagos', nextOfKin: 'Obinna Obi (Spouse)' },
      profilePhoto: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200&auto=format&fit=crop',
      onboardingChecklist: []
    },
    {
      id: 'emp-2',
      name: 'Olumide Sowore',
      email: 'olumide.sowore@workforcely.com',
      role: 'HR Admin',
      departmentId: 'dept-4',
      hireDate: '2023-03-01',
      salary: { base: 600000, housing: 200000, transport: 80000 },
      contactInfo: { phone: '+234 809 333 4444', address: '45 Toyin Street, Ikeja, Lagos', nextOfKin: 'Funmi Sowore (Wife)' },
      profilePhoto: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=200&auto=format&fit=crop',
      onboardingChecklist: []
    },
    {
      id: 'emp-3',
      name: 'Fatima Abubakar',
      email: 'fatima.abubakar@workforcely.com',
      role: 'Employee',
      departmentId: 'dept-3',
      hireDate: '2023-05-10',
      salary: { base: 750000, housing: 220000, transport: 90000 },
      contactInfo: { phone: '+234 812 555 6666', address: '8 Wuse Zone 5, Abuja', nextOfKin: 'Ibrahim Abubakar (Father)' },
      profilePhoto: 'https://images.unsplash.com/photo-1607746882042-944635dfe10e?q=80&w=200&auto=format&fit=crop',
      onboardingChecklist: []
    },
    {
      id: 'emp-4',
      name: 'Babajide Oyewole',
      email: 'babajide.oyewole@workforcely.com',
      role: 'Employee',
      departmentId: 'dept-2',
      hireDate: '2023-02-20',
      salary: { base: 700000, housing: 200000, transport: 90000 },
      contactInfo: { phone: '+234 805 777 8888', address: '22 Gbagada Phase 2, Lagos', nextOfKin: 'Abiodun Oyewole (Brother)' },
      profilePhoto: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=200&auto=format&fit=crop',
      onboardingChecklist: []
    },
    {
      id: 'emp-5',
      name: 'Chijioke Nwachukwu',
      email: 'chijioke.n@workforcely.com',
      role: 'Employee',
      departmentId: 'dept-5',
      hireDate: '2023-08-01',
      salary: { base: 550000, housing: 150000, transport: 80000 },
      contactInfo: { phone: '+234 806 999 0000', address: '15 Ogui Road, Enugu', nextOfKin: 'Adaeze Nwachukwu (Sister)' },
      profilePhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop',
      onboardingChecklist: []
    },
    // Engineering Department Employees
    {
      id: 'emp-6',
      name: 'Amara Eze',
      email: 'amara.eze@workforcely.com',
      role: 'Employee',
      departmentId: 'dept-1',
      hireDate: '2024-02-15',
      salary: { base: 500000, housing: 150000, transport: 80000 },
      contactInfo: { phone: '+234 813 111 3333', address: 'Surulere, Lagos', nextOfKin: 'Florence Eze (Mother)' },
      profilePhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop',
      onboardingChecklist: []
    },
    {
      id: 'emp-7',
      name: 'Emeka Okafor',
      email: 'emeka.okafor@workforcely.com',
      role: 'Employee',
      departmentId: 'dept-1',
      hireDate: '2024-03-01',
      salary: { base: 550000, housing: 160000, transport: 80000 },
      contactInfo: { phone: '+234 814 222 4444', address: 'Yaba, Lagos', nextOfKin: 'Nkechi Okafor (Sister)' },
      profilePhoto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop',
      onboardingChecklist: []
    },
    {
      id: 'emp-8',
      name: 'Uchenna Egwu',
      email: 'uchenna.egwu@workforcely.com',
      role: 'Employee',
      departmentId: 'dept-1',
      hireDate: '2024-05-15',
      salary: { base: 450000, housing: 120000, transport: 70000 },
      contactInfo: { phone: '+234 815 333 5555', address: 'Magodo, Lagos', nextOfKin: 'Peter Egwu (Father)' },
      profilePhoto: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?q=80&w=200&auto=format&fit=crop',
      onboardingChecklist: []
    },
    {
      id: 'emp-9',
      name: 'Damilola Adeleke',
      email: 'damilola.adeleke@workforcely.com',
      role: 'Employee',
      departmentId: 'dept-1',
      hireDate: '2024-09-01',
      salary: { base: 420000, housing: 120000, transport: 70000 },
      contactInfo: { phone: '+234 816 444 6666', address: 'Maryland, Lagos', nextOfKin: 'Sola Adeleke (Brother)' },
      profilePhoto: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=200&auto=format&fit=crop',
      onboardingChecklist: []
    },
    // Sales & Marketing Department
    {
      id: 'emp-10',
      name: 'Tunde Adebayo',
      email: 'tunde.adebayo@workforcely.com',
      role: 'Employee',
      departmentId: 'dept-2',
      hireDate: '2024-01-10',
      salary: { base: 350000, housing: 100000, transport: 60000 },
      contactInfo: { phone: '+234 802 555 7777', address: 'VGC, Lekki, Lagos', nextOfKin: 'Ronke Adebayo (Wife)' },
      profilePhoto: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200&auto=format&fit=crop',
      onboardingChecklist: []
    },
    {
      id: 'emp-11',
      name: 'Kelechi Iheanacho',
      email: 'kelechi.i@workforcely.com',
      role: 'Employee',
      departmentId: 'dept-2',
      hireDate: '2024-04-18',
      salary: { base: 320000, housing: 100000, transport: 60000 },
      contactInfo: { phone: '+234 803 666 8888', address: 'Festac Town, Lagos', nextOfKin: 'Joy Iheanacho (Mother)' },
      profilePhoto: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=200&auto=format&fit=crop',
      onboardingChecklist: []
    },
    {
      id: 'emp-12',
      name: 'Amina Yusuf',
      email: 'amina.yusuf@workforcely.com',
      role: 'Employee',
      departmentId: 'dept-2',
      hireDate: '2024-08-01',
      salary: { base: 330000, housing: 100000, transport: 60000 },
      contactInfo: { phone: '+234 807 777 9999', address: 'Maitama, Abuja', nextOfKin: 'Yusuf Dogara (Father)' },
      profilePhoto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop',
      onboardingChecklist: []
    },
    // Finance Department
    {
      id: 'emp-13',
      name: 'Bose Balogun',
      email: 'bose.balogun@workforcely.com',
      role: 'Employee',
      departmentId: 'dept-3',
      hireDate: '2024-02-01',
      salary: { base: 450000, housing: 130000, transport: 70000 },
      contactInfo: { phone: '+234 808 888 0000', address: 'Lulu Close, Ikeja, Lagos', nextOfKin: 'Biodun Balogun (Husband)' },
      profilePhoto: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&auto=format&fit=crop',
      onboardingChecklist: []
    },
    {
      id: 'emp-14',
      name: 'Musa Bello',
      email: 'musa.bello@workforcely.com',
      role: 'Employee',
      departmentId: 'dept-3',
      hireDate: '2024-06-20',
      salary: { base: 400000, housing: 120000, transport: 70000 },
      contactInfo: { phone: '+234 809 999 1111', address: 'Garki, Abuja', nextOfKin: 'Halima Bello (Sister)' },
      profilePhoto: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=200&auto=format&fit=crop',
      onboardingChecklist: []
    },
    // HR Department
    {
      id: 'emp-15',
      name: 'Blessing Okon',
      email: 'blessing.okon@workforcely.com',
      role: 'HR Admin',
      departmentId: 'dept-4',
      hireDate: '2024-03-10',
      salary: { base: 400000, housing: 120000, transport: 70000 },
      contactInfo: { phone: '+234 810 111 4444', address: 'Chevron, Lekki, Lagos', nextOfKin: 'Effiong Okon (Father)' },
      profilePhoto: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?q=80&w=200&auto=format&fit=crop',
      onboardingChecklist: []
    },
    {
      id: 'emp-16',
      name: 'Ngozi Nwosu',
      email: 'ngozi.nwosu@workforcely.com',
      role: 'Employee',
      departmentId: 'dept-4',
      hireDate: '2024-07-01',
      salary: { base: 300000, housing: 90000, transport: 50000 },
      contactInfo: { phone: '+234 811 222 5555', address: 'Surulere, Lagos', nextOfKin: 'Chidi Nwosu (Brother)' },
      profilePhoto: 'https://images.unsplash.com/photo-1548142813-c348350df52b?q=80&w=200&auto=format&fit=crop',
      onboardingChecklist: []
    },
    // Operations Department
    {
      id: 'emp-17',
      name: 'Yetunde Oyelade',
      email: 'yetunde.oyelade@workforcely.com',
      role: 'Employee',
      departmentId: 'dept-5',
      hireDate: '2024-01-20',
      salary: { base: 380000, housing: 110000, transport: 60000 },
      contactInfo: { phone: '+234 812 333 6666', address: 'Gbagada, Lagos', nextOfKin: 'Deji Oyelade (Husband)' },
      profilePhoto: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=200&auto=format&fit=crop',
      onboardingChecklist: []
    },
    {
      id: 'emp-18',
      name: 'Femi Alao',
      email: 'femi.alao@workforcely.com',
      role: 'Employee',
      departmentId: 'dept-5',
      hireDate: '2024-05-01',
      salary: { base: 360000, housing: 100000, transport: 60000 },
      contactInfo: { phone: '+234 813 444 7777', address: 'Shomolu, Lagos', nextOfKin: 'Joke Alao (Mother)' },
      profilePhoto: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?q=80&w=200&auto=format&fit=crop',
      onboardingChecklist: []
    },
    // Recently Hired Employees with Onboarding Checklist (uncompleted or partially completed)
    {
      id: 'emp-19',
      name: 'Taiwo Adeyemi',
      email: 'taiwo.adeyemi@workforcely.com',
      role: 'Employee',
      departmentId: 'dept-1',
      hireDate: '2026-05-15', // Recent
      salary: { base: 450000, housing: 130000, transport: 70000 },
      contactInfo: { phone: '+234 814 555 8888', address: 'Allen Avenue, Ikeja, Lagos', nextOfKin: 'Kenny Adeyemi (Twin Brother)' },
      profilePhoto: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?q=80&w=200&auto=format&fit=crop',
      onboardingChecklist: [
        { id: 'ob-1', title: 'Submit signed contract', completed: true, dueDate: '2026-05-16' },
        { id: 'ob-2', title: 'Set up work laptop and accounts', completed: true, dueDate: '2026-05-18' },
        { id: 'ob-3', title: 'Complete compliance training module 1', completed: false, dueDate: '2026-06-15' },
        { id: 'ob-4', title: '1-on-1 with manager', completed: false, dueDate: '2026-06-20' }
      ]
    },
    {
      id: 'emp-20',
      name: 'Chinedu Okeke',
      email: 'chinedu.okeke@workforcely.com',
      role: 'Employee',
      departmentId: 'dept-5',
      hireDate: '2026-06-01', // Extremely Recent
      salary: { base: 350000, housing: 100000, transport: 60000 },
      contactInfo: { phone: '+234 815 666 9999', address: 'Ajah, Lagos', nextOfKin: 'Grace Okeke (Mother)' },
      profilePhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop',
      onboardingChecklist: [
        { id: 'ob-5', title: 'Submit signed contract', completed: true, dueDate: '2026-06-02' },
        { id: 'ob-6', title: 'HR documentation & ID card capture', completed: false, dueDate: '2026-06-10' },
        { id: 'ob-7', title: 'Set up work laptop and accounts', completed: false, dueDate: '2026-06-12' }
      ]
    },
    {
      id: 'emp-21',
      name: 'Fatima Umar',
      email: 'fatima.umar@workforcely.com',
      role: 'Employee',
      departmentId: 'dept-2',
      hireDate: '2026-06-05', // Extremely Recent
      salary: { base: 310000, housing: 90000, transport: 50000 },
      contactInfo: { phone: '+234 816 777 0000', address: 'Asokoro, Abuja', nextOfKin: 'Umar Bello (Father)' },
      profilePhoto: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?q=80&w=200&auto=format&fit=crop',
      onboardingChecklist: [
        { id: 'ob-8', title: 'Submit signed contract', completed: false, dueDate: '2026-06-06' },
        { id: 'ob-9', title: 'Submit next of kin details', completed: false, dueDate: '2026-06-08' },
        { id: 'ob-10', title: 'Set up tools access', completed: false, dueDate: '2026-06-12' }
      ]
    },
    // More employees to make it 25 total
    {
      id: 'emp-22',
      name: 'Sola Soyinka',
      email: 'sola.soyinka@workforcely.com',
      role: 'Employee',
      departmentId: 'dept-1',
      hireDate: '2024-11-15',
      salary: { base: 480000, housing: 140000, transport: 70000 },
      contactInfo: { phone: '+234 817 888 1111', address: 'Bariga, Lagos', nextOfKin: 'Wole Soyinka (Father)' },
      profilePhoto: 'https://images.unsplash.com/photo-1542206395-9feb3edaa68d?q=80&w=200&auto=format&fit=crop',
      onboardingChecklist: []
    },
    {
      id: 'emp-23',
      name: 'Halima Dangana',
      email: 'halima.dangana@workforcely.com',
      role: 'Employee',
      departmentId: 'dept-3',
      hireDate: '2025-01-10',
      salary: { base: 410000, housing: 110000, transport: 70000 },
      contactInfo: { phone: '+234 818 999 2222', address: 'Maitama, Abuja', nextOfKin: 'Bature Dangana (Brother)' },
      profilePhoto: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=200&auto=format&fit=crop',
      onboardingChecklist: []
    },
    {
      id: 'emp-24',
      name: 'Chidi Nnamdi',
      email: 'chidi.nnamdi@workforcely.com',
      role: 'Employee',
      departmentId: 'dept-2',
      hireDate: '2025-03-20',
      salary: { base: 340000, housing: 100000, transport: 60000 },
      contactInfo: { phone: '+234 819 000 3333', address: 'Awolowo Way, Ikeja, Lagos', nextOfKin: 'Grace Nnamdi (Mother)' },
      profilePhoto: 'https://images.unsplash.com/photo-1500048993953-d23a436266cf?q=80&w=200&auto=format&fit=crop',
      onboardingChecklist: []
    },
    {
      id: 'emp-25',
      name: 'Nneka Anozie',
      email: 'nneka.anozie@workforcely.com',
      role: 'Employee',
      departmentId: 'dept-5',
      hireDate: '2025-06-01',
      salary: { base: 370000, housing: 110000, transport: 60000 },
      contactInfo: { phone: '+234 820 111 4444', address: 'Lekki Phase 2, Lagos', nextOfKin: 'Tony Anozie (Brother)' },
      profilePhoto: 'https://images.unsplash.com/photo-1589156280159-27698a70f29e?q=80&w=200&auto=format&fit=crop',
      onboardingChecklist: []
    }
  ];

  // Generate 1-2 months of attendance history (e.g. May and June 2026)
  // Let's seed for May 1 to June 12, 2026. Excluding weekends.
  const attendance: Attendance[] = [];
  const startDay = new Date('2026-05-01');
  const endDay = new Date('2026-06-12');
  let attId = 1;

  for (let d = new Date(startDay); d <= endDay; d.setDate(d.getDate() + 1)) {
    const dayOfWeek = d.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue; // Skip weekends

    const dateStr = d.toISOString().split('T')[0];

    // Seed attendance for employees (mostly present, some late, some absent)
    employees.forEach(emp => {
      // Don't log attendance if employee wasn't hired yet
      if (new Date(emp.hireDate) > d) return;

      const randomVal = Math.random();
      if (randomVal < 0.05) {
        // Absent (no clock in/out)
        attendance.push({
          id: `att-${attId++}`,
          employeeId: emp.id,
          date: dateStr,
          clockIn: '',
          clockOut: null,
          status: 'Absent'
        });
      } else if (randomVal < 0.20) {
        // Late (after 08:30:00)
        const hour = 8;
        const minute = Math.floor(Math.random() * 25) + 31; // 08:31 to 08:55
        const second = Math.floor(Math.random() * 60);
        const clockInStr = `0${hour}:${minute}:${second < 10 ? '0' + second : second}`;
        const clockOutStr = `17:${Math.floor(Math.random() * 15) + 1}:00`;
        attendance.push({
          id: `att-${attId++}`,
          employeeId: emp.id,
          date: dateStr,
          clockIn: clockInStr,
          clockOut: clockOutStr,
          status: 'Late'
        });
      } else {
        // Present (07:45 to 08:29)
        const hour = 7;
        const minute = Math.floor(Math.random() * 45) + 15; // 07:15 to 07:59
        const second = Math.floor(Math.random() * 60);
        const clockInStr = `0${hour}:${minute}:${second < 10 ? '0' + second : second}`;
        const clockOutStr = `17:${Math.floor(Math.random() * 15) + 5}:00`;
        attendance.push({
          id: `att-${attId++}`,
          employeeId: emp.id,
          date: dateStr,
          clockIn: clockInStr,
          clockOut: clockOutStr,
          status: 'Present'
        });
      }
    });
  }

  // Seed Leave Requests
  const leaveRequests: LeaveRequest[] = [
    { id: 'lv-1', employeeId: 'emp-3', leaveType: 'Annual', startDate: '2026-06-15', endDate: '2026-06-25', status: 'Pending', reason: 'Family vacation outside Nigeria' },
    { id: 'lv-2', employeeId: 'emp-6', leaveType: 'Sick', startDate: '2026-06-10', endDate: '2026-06-12', status: 'Approved', reason: 'Severe malaria recovery', approvalComment: 'Approved. Get well soon.' },
    { id: 'lv-3', employeeId: 'emp-10', leaveType: 'Casual', startDate: '2026-06-22', endDate: '2026-06-24', status: 'Pending', reason: 'Brother\'s wedding in Ibadan' },
    { id: 'lv-4', employeeId: 'emp-14', leaveType: 'Annual', startDate: '2026-05-10', endDate: '2026-05-15', status: 'Approved', reason: 'Annual rest', approvalComment: 'Approved by Fatima.' },
    { id: 'lv-5', employeeId: 'emp-8', leaveType: 'Casual', startDate: '2026-06-02', endDate: '2026-06-03', status: 'Rejected', reason: 'Moving to a new apartment', approvalComment: 'Cannot approve due to critical sprint release.' },
    { id: 'lv-6', employeeId: 'emp-12', leaveType: 'Sick', startDate: '2026-06-18', endDate: '2026-06-19', status: 'Pending', reason: 'Dental surgery appointment' }
  ];

  // Seed Payroll for past 2-3 months (March, April, May 2026)
  const payroll: Payroll[] = [];
  const payrollMonths = ['2026-03', '2026-04', '2026-05'];
  let payId = 1;

  payrollMonths.forEach(m => {
    employees.forEach(emp => {
      // Don't calculate payroll if not yet hired
      const hireMonth = emp.hireDate.substring(0, 7);
      if (hireMonth > m) return;

      const gross = emp.salary.base + emp.salary.housing + emp.salary.transport;
      const pension = calculateNigerianPension(emp.salary);
      const tax = calculateNigerianTax(gross);
      const netPay = gross - pension - tax;

      payroll.push({
        id: `pr-${payId++}`,
        employeeId: emp.id,
        month: m,
        basePay: emp.salary.base,
        allowanceHousing: emp.salary.housing,
        allowanceTransport: emp.salary.transport,
        tax: Number(tax.toFixed(2)),
        pension: Number(pension.toFixed(2)),
        overrideAmount: 0,
        overrideReason: '',
        netPay: Number(netPay.toFixed(2)),
        status: 'Paid',
        paymentDate: `${m}-26`
      });
    });
  });

  // Seed Performance Reviews
  const performanceReviews: PerformanceReview[] = [
    {
      id: 'rev-1',
      employeeId: 'emp-3',
      reviewCycle: 'FY 2025 Annual',
      rating: 4,
      goals: [
        { id: 'g-1', title: 'Complete audit compliance for Q3', weight: 40, status: 'Completed' },
        { id: 'g-2', title: 'Automate weekly risk report', weight: 30, status: 'Completed' },
        { id: 'g-3', title: 'Train 2 junior analysts', weight: 30, status: 'In Progress' }
      ],
      comments: 'Fatima is a stellar performer. She handles our finance compliance issues with extreme caution. Needs to work on delegation.',
      reviewerId: 'emp-2',
      date: '2026-01-15'
    },
    {
      id: 'rev-2',
      employeeId: 'emp-4',
      reviewCycle: 'FY 2025 Annual',
      rating: 5,
      goals: [
        { id: 'g-4', title: 'Launch Sales Campaign V2', weight: 50, status: 'Completed' },
        { id: 'g-5', title: 'Achieve 20% growth in SME segment', weight: 50, status: 'Completed' }
      ],
      comments: 'Outstanding leadership. Jide has completely transformed our Sales and Marketing strategy. Promoted to Senior Manager.',
      reviewerId: 'emp-2',
      date: '2026-01-18'
    },
    {
      id: 'rev-3',
      employeeId: 'emp-6',
      reviewCycle: 'FY 2025 Annual',
      rating: 3,
      goals: [
        { id: 'g-6', title: 'Refactor core API services', weight: 60, status: 'In Progress' },
        { id: 'g-7', title: 'Improve unit test coverage to 80%', weight: 40, status: 'Not Started' }
      ],
      comments: 'Amara is doing well in frontend tasks. Needs to pick up backend challenges and take ownership of code reviews.',
      reviewerId: 'emp-1',
      date: '2026-01-20'
    },
    {
      id: 'rev-4',
      employeeId: 'emp-7',
      reviewCycle: 'FY 2025 Annual',
      rating: 4,
      goals: [
        { id: 'g-8', title: 'Deploy Kubernetes cluster migration', weight: 50, status: 'Completed' },
        { id: 'g-9', title: 'Reduce server load latencies by 15%', weight: 50, status: 'Completed' }
      ],
      comments: 'Excellent work in devops. Emeka is proactive and saves us lots of money on cloud costs.',
      reviewerId: 'emp-1',
      date: '2026-01-21'
    }
  ];

  // Seed Job Postings & Applicants
  const jobPostings: JobPosting[] = [
    { id: 'job-1', title: 'Senior Backend Engineer (Node/Go)', departmentId: 'dept-1', description: 'Looking for a developer with 5+ years of experience in microservices, SQL databases, and cloud engineering. FinTech experience is a plus.', status: 'Open', createdDate: '2026-05-10' },
    { id: 'job-2', title: 'Product Marketing Executive', departmentId: 'dept-2', description: 'Responsible for driving active user growth, campaigns, and content curation for our retail fintech products in Nigeria.', status: 'Open', createdDate: '2026-05-20' },
    { id: 'job-3', title: 'HR Generalist', departmentId: 'dept-4', description: 'Manage employee relations, recruitment processes, onboarding pipelines, and support in payroll coordination.', status: 'Closed', createdDate: '2026-04-01' }
  ];

  const jobApplicants: JobApplicant[] = [
    { id: 'app-1', jobId: 'job-1', name: 'Kabir Yusuf', email: 'kabir.y@gmail.com', phone: '+234 803 222 3333', status: 'Interview', appliedDate: '2026-05-12', resumeUrl: '/resumes/kabir_yusuf.pdf', coverNote: 'Experienced backend engineer with fintech exposure.', resumeText: 'Worked on payments and microservices.' },
    { id: 'app-2', jobId: 'job-1', name: 'Olumide Balogun', email: 'olubalogun@yahoo.com', phone: '+234 803 444 5555', status: 'Applied', appliedDate: '2026-05-14', resumeUrl: '/resumes/olumide_b.pdf', coverNote: 'Skilled in Go and distributed systems.' },
    { id: 'app-3', jobId: 'job-1', name: 'Ngozi Eke', email: 'ngozi.eke@outlook.com', phone: '+234 803 666 7777', status: 'Offer', appliedDate: '2026-05-11', resumeUrl: '/resumes/ngozi_eke.pdf', coverNote: 'Strong backend experience with leadership exposure.' },
    { id: 'app-4', jobId: 'job-2', name: 'Tosin Alao', email: 'tosin.alao@gmail.com', phone: '+234 803 888 9999', status: 'Applied', appliedDate: '2026-05-22', resumeUrl: '/resumes/tosin_alao.pdf', coverNote: 'Marketing strategist with strong digital campaign experience.' },
    { id: 'app-5', jobId: 'job-2', name: 'Damilola Shittu', email: 'dami.shittu@live.com', phone: '+234 803 000 1111', status: 'Interview', appliedDate: '2026-05-23', resumeUrl: '/resumes/damilola_s.pdf', coverNote: 'Creative storyteller with fintech content experience.' },
    { id: 'app-6', jobId: 'job-3', name: 'Ebele Okafor', email: 'ebele.hr@gmail.com', phone: '+234 803 222 1111', status: 'Hired', appliedDate: '2026-04-05', resumeUrl: '/resumes/ebele_okafor.pdf', coverNote: 'HR generalist with strong onboarding and recruitment skills.' }
  ];

  const memos: Memo[] = [
    { id: 'memo-1', title: 'End of Quarter Townhall', body: 'All staff are invited to the Q2 townhall on Friday at 4pm. Attendance is required for department updates.', targetAudience: 'All Staff', createdDate: '2026-06-12' },
    { id: 'memo-2', title: 'Payroll Submission Reminder', body: 'Finance teams should submit payroll supporting documents by June 20 for the June payroll run.', targetAudience: 'Specific Department', departmentId: 'dept-3', createdDate: '2026-06-10' },
    { id: 'memo-3', title: 'Customer Service Training Launch', body: 'The Customer Service Excellence course is now live. All Sales & Marketing staff should enroll before June 30.', targetAudience: 'Specific Department', departmentId: 'dept-2', createdDate: '2026-06-09' }
  ];

  const notifications: Notification[] = [
    { id: 'note-1', title: 'Leave request approved', message: 'Your leave request for June 10-12 has been approved.', audience: 'Specific Employee', recipientId: 'emp-6', read: false, createdDate: '2026-06-09' },
    { id: 'note-2', title: 'New company memo', message: 'A new company memo has been posted: End of Quarter Townhall.', audience: 'All Staff', read: false, createdDate: '2026-06-12' },
    { id: 'note-3', title: 'Incident report updated', message: 'Your safety incident report is under review by HR.', audience: 'Specific Employee', recipientId: 'emp-8', read: false, createdDate: '2026-06-11' }
  ];

  const incidentReports: IncidentReport[] = [
    {
      id: 'ir-1',
      employeeId: 'emp-8',
      category: 'Safety',
      description: 'Slipped while moving packages in the warehouse; safety guard missing.',
      evidenceNote: 'Photo of wet floor included in report.',
      date: '2026-06-08',
      status: 'Under Review',
      history: [
        { status: 'Under Review', note: 'Report acknowledged by HR.', date: '2026-06-09' }
      ]
    },
    {
      id: 'ir-2',
      employeeId: 'emp-12',
      category: 'Behavior',
      description: 'Repeated tardiness for 3 days this week impacting the team.',
      evidenceNote: 'Attendance logs show late arrivals.',
      date: '2026-06-10',
      status: 'Written Warning',
      history: [
        { status: 'Under Review', note: 'Report reviewed with attendance team.', date: '2026-06-11' },
        { status: 'Written Warning', note: 'Employee issued written warning.', date: '2026-06-12' }
      ]
    },
    {
      id: 'ir-3',
      employeeId: 'emp-3',
      category: 'Facility',
      description: 'AC unit in the Finance office is leaking water onto electrical sockets.',
      evidenceNote: 'Maintenance informed verbally.',
      date: '2026-06-05',
      status: 'Resolved',
      history: [
        { status: 'Under Review', note: 'Maintenance scheduled to inspect the AC unit.', date: '2026-06-06' },
        { status: 'Resolved', note: 'AC compressor repaired and drainage cleared. Safety verified.', date: '2026-06-07' }
      ]
    },
    {
      id: 'ir-4',
      employeeId: 'emp-10',
      category: 'Conflict',
      description: 'Verbal altercation during client proposal meeting with team lead.',
      evidenceNote: 'Meeting minutes attached.',
      date: '2026-06-01',
      status: 'Escalated',
      history: [
        { status: 'Under Review', note: 'Initial statements taken from both parties.', date: '2026-06-02' },
        { status: 'Escalated', note: 'Escalated to Operations Director and HR Executive for review.', date: '2026-06-04' }
      ]
    }
  ];

  // Seed Training & Courses
  const trainingCourses: TrainingCourse[] = [
    {
      id: 'tr-c1',
      title: 'Introduction to Network Setup',
      description: 'Learn the fundamentals of IP addressing, static network configuration, and subnetting for modern office networks.',
      duration: '3 hours',
      category: 'Technical',
      difficulty: 'Beginner',
      thumbnail: 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=400&auto=format&fit=crop',
      modules: [
        {
          id: 'trc1-m1',
          title: 'What is an IP Address?',
          duration: '30 min',
          content: '### Understanding IP addresses\n\nAn IP address is a unique identifier assigned to each device on a network. It allows devices to communicate with one another.\n\n- IPv4 addresses are 32-bit numbers\n- IPv6 addresses are 128-bit numbers\n\n**Example IPv4 address:** `192.168.1.10`\n\n`ping 8.8.8.8` checks connectivity to a remote DNS resolver.',
          videoUrl: 'https://www.youtube.com/embed/1b3t6Mroh7s'
        },
        {
          id: 'trc1-m2',
          title: 'Configuring a Static IP',
          duration: '45 min',
          content: '### Static IP configuration\n\nA static IP does not change and is useful for servers and network devices.\n\n**Windows command line example:**\n\n```powershell\nnetsh interface ip set address name="Ethernet" static 192.168.1.120 255.255.255.0 192.168.1.1\n```\n\n**Linux terminal example:**\n\n```bash\nsudo ip addr add 192.168.1.120/24 dev eth0\nsudo ip route add default via 192.168.1.1\n```',
          videoUrl: ''
        },
        {
          id: 'trc1-m3',
          title: 'Subnetting Basics',
          duration: '40 min',
          content: '### Subnetting fundamentals\n\nSubnet masks divide a network into smaller sub-networks.\n\n- `255.255.255.0` is a /24 subnet\n- `255.255.254.0` is a /23 subnet\n\n**Example:**\n\nNetwork: `192.168.10.0/24`\nHost range: `192.168.10.1` to `192.168.10.254`\n\nA /26 network supports 62 hosts.',
          videoUrl: ''
        },
        {
          id: 'trc1-m4',
          title: 'Network Troubleshooting Commands',
          duration: '35 min',
          content: '### Common troubleshooting tools\n\nUse these commands to verify network settings and connectivity.\n\n- `ping`\n- `tracert` / `traceroute`\n- `ipconfig` / `ifconfig`\n\n**Example Windows:**\n\n```powershell\nipconfig /all\n```\n\n**Example Linux:**\n\n```bash\nifconfig -a\nroute -n\n```',
          videoUrl: ''
        }
      ],
      quiz: {
        id: 'trc1-q1',
        title: 'Network Setup Quiz',
        passMark: 70,
        maxAttempts: 3,
        questions: [
          {
            id: 'trc1-q1-1',
            type: 'multiple-choice',
            question: 'Which command shows the current IP address on a Windows machine?',
            options: ['ipconfig', 'ping', 'tracert', 'nslookup'],
            correctAnswer: 'ipconfig'
          },
          {
            id: 'trc1-q1-2',
            type: 'true-false',
            question: 'A static IP address can change automatically when the machine restarts.',
            correctAnswer: 'False'
          },
          {
            id: 'trc1-q1-3',
            type: 'multiple-choice',
            question: 'What is the subnet mask for a /24 network?',
            options: ['255.255.255.0', '255.255.0.0', '255.0.0.0', '255.255.255.252'],
            correctAnswer: '255.255.255.0'
          },
          {
            id: 'trc1-q1-4',
            type: 'true-false',
            question: 'The command `ip route add default via 192.168.1.1` sets the default gateway on Linux.',
            correctAnswer: 'True'
          },
          {
            id: 'trc1-q1-5',
            type: 'multiple-choice',
            question: 'Which address is a valid IPv4 host address?',
            options: ['192.168.10.0', '192.168.10.255', '192.168.10.10', '255.255.255.255'],
            correctAnswer: '192.168.10.10'
          }
        ]
      }
    },
    {
      id: 'tr-c2',
      title: 'Workplace Compliance & Ethics',
      description: 'Build a strong understanding of workplace ethics, data handling, and company policy obligations.',
      duration: '2.5 hours',
      category: 'Compliance',
      difficulty: 'Intermediate',
      thumbnail: 'https://images.unsplash.com/photo-1531379410502-58d7fd76d3b4?q=80&w=400&auto=format&fit=crop',
      modules: [
        {
          id: 'trc2-m1',
          title: 'Company Policy Overview',
          duration: '35 min',
          content: '### Company policy essentials\n\nThis lesson covers our core conduct expectations, reporting channels, and employee accountability.\n\n- Respect company property\n- Follow information security guidelines\n- Report suspicious activity immediately',
          videoUrl: ''
        },
        {
          id: 'trc2-m2',
          title: 'Data Handling & Privacy',
          duration: '40 min',
          content: '### Handling sensitive data\n\nEmployees must protect customer and company information.\n\n- Store documents securely\n- Use encrypted email when required\n- Never share passwords\n\n**Important:** Always verify authorization before sharing personal data.',
          videoUrl: ''
        },
        {
          id: 'trc2-m3',
          title: 'Conflict of Interest',
          duration: '40 min',
          content: '### Managing conflicts of interest\n\nA conflict occurs when personal interests could interfere with business decisions.\n\nExamples:\n\n1. Working for a competitor\n2. Accepting gifts over approved limits\n3. Hiring a family member without disclosure',
          videoUrl: ''
        },
        {
          id: 'trc2-m4',
          title: 'Ethics Reporting Process',
          duration: '35 min',
          content: '### Reporting breaches and ethics issues\n\nIf you observe policy violations, report through the approved channel.\n\n- Document what happened\n- Notify your manager or HR\n- Follow up until the issue is resolved',
          videoUrl: ''
        }
      ],
      quiz: {
        id: 'trc2-q1',
        title: 'Compliance Quiz',
        passMark: 80,
        maxAttempts: 3,
        questions: [
          {
            id: 'trc2-q1-1',
            type: 'multiple-choice',
            question: 'What should you do if you receive a request for customer data without approval?',
            options: ['Share immediately', 'Deny and report', 'Ask for a gift', 'Ignore it'],
            correctAnswer: 'Deny and report'
          },
          {
            id: 'trc2-q1-2',
            type: 'true-false',
            question: 'You may keep a client list if you leave the company, as long as you do not use it for another job.',
            correctAnswer: 'False'
          },
          {
            id: 'trc2-q1-3',
            type: 'multiple-choice',
            question: 'A conflict of interest must be reported when:',
            options: ['It affects business decisions', 'It is only personal', 'It is unrelated to work', 'It is confidential'],
            correctAnswer: 'It affects business decisions'
          },
          {
            id: 'trc2-q1-4',
            type: 'true-false',
            question: 'All employees should follow the same data privacy guidelines regardless of role.',
            correctAnswer: 'True'
          },
          {
            id: 'trc2-q1-5',
            type: 'multiple-choice',
            question: 'Which action is part of the ethics reporting process?',
            options: ['Document the issue', 'Hide the evidence', 'Confront publicly', 'Send it to personal email'],
            correctAnswer: 'Document the issue'
          }
        ]
      }
    },
    {
      id: 'tr-c3',
      title: 'Customer Service Excellence',
      description: 'Improve your customer interactions with proven communication, complaint handling, and follow-up techniques.',
      duration: '2 hours',
      category: 'Soft Skills',
      difficulty: 'Beginner',
      thumbnail: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=400&auto=format&fit=crop',
      modules: [
        {
          id: 'trc3-m1',
          title: 'Communication Foundations',
          duration: '30 min',
          content: '### Strong communication skills\n\nCustomer service starts with listening actively and responding clearly.\n\n- Use positive language\n- Mirror customer concerns\n- Confirm understanding before solving the issue',
          videoUrl: ''
        },
        {
          id: 'trc3-m2',
          title: 'Handling Complaints',
          duration: '35 min',
          content: '### Turning complaints into opportunities\n\nA good complaint process builds trust.\n\n1. Listen carefully\n2. Apologize sincerely\n3. Resolve quickly\n\n**Note:** Never blame the customer for a poor experience.',
          videoUrl: ''
        },
        {
          id: 'trc3-m3',
          title: 'Service Standards',
          duration: '30 min',
          content: '### Consistent service standards\n\nFollow standards for quick and respectful service.\n\n- Answer within two rings\n- Own the customer request\n- Follow up on outstanding issues',
          videoUrl: ''
        },
        {
          id: 'trc3-m4',
          title: 'Customer Follow-Up',
          duration: '25 min',
          content: '### Effective follow-up\n\nReliable follow-up is what keeps customers satisfied.\n\n- Confirm the resolution timeline\n- Check back once the issue is closed\n- Ask for feedback to improve service',
          videoUrl: ''
        }
      ],
      quiz: {
        id: 'trc3-q1',
        title: 'Service Excellence Quiz',
        passMark: 70,
        maxAttempts: 3,
        questions: [
          {
            id: 'trc3-q1-1',
            type: 'multiple-choice',
            question: 'What is the first step when a customer raises a complaint?',
            options: ['Offer a refund', 'Listen carefully', 'Escalate immediately', 'Ask them to wait'],
            correctAnswer: 'Listen carefully'
          },
          {
            id: 'trc3-q1-2',
            type: 'true-false',
            question: 'A prompt follow-up can improve customer trust after a service issue.',
            correctAnswer: 'True'
          },
          {
            id: 'trc3-q1-3',
            type: 'multiple-choice',
            question: 'Which phrase is best for positive customer communication?',
            options: ['That is not our problem', 'I understand how you feel', 'You should have known better', 'That cannot be done'],
            correctAnswer: 'I understand how you feel'
          },
          {
            id: 'trc3-q1-4',
            type: 'true-false',
            question: 'Service standards should vary depending on the customer’s attitude.',
            correctAnswer: 'False'
          },
          {
            id: 'trc3-q1-5',
            type: 'multiple-choice',
            question: 'After resolving an issue, you should:',
            options: ['Follow up to confirm satisfaction', 'Close the ticket immediately', 'Ignore further feedback', 'Ask for a tip'],
            correctAnswer: 'Follow up to confirm satisfaction'
          }
        ]
      }
    },
    {
      id: 'tr-c4',
      title: 'Advanced React Coding (Udemy)',
      description: 'Master React 18, state management, custom hooks, and concurrent features.',
      duration: '8 hours',
      category: 'Technical',
      difficulty: 'Advanced',
      thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=400&auto=format&fit=crop',
      provider: 'Udemy',
      link: 'https://www.udemy.com/course/advanced-react',
      external: true
    },
    {
      id: 'tr-c5',
      title: 'Strategic Leadership Mastery (Coursera)',
      description: 'Develop essential leadership skills to manage diverse teams, manage conflict, and drive company innovation.',
      duration: '12 hours',
      category: 'Leadership',
      difficulty: 'Advanced',
      thumbnail: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=400&auto=format&fit=crop',
      provider: 'Coursera',
      link: 'https://www.coursera.org/learn/strategic-leadership',
      external: true
    }
  ];

  const trainingEnrollments: TrainingEnrollment[] = [
    {
      id: 'te-1',
      courseId: 'tr-c1',
      employeeId: 'emp-3',
      status: 'Completed',
      progress: 100,
      currentLessonIndex: 4,
      completedLessons: ['trc1-m1', 'trc1-m2', 'trc1-m3', 'trc1-m4'],
      quizAttempts: 1,
      quizScore: 100,
      quizPassed: true,
      certificate: {
        issueDate: '2026-06-10',
        score: 100,
        employeeName: 'Fatima Abubakar',
        courseName: 'Introduction to Network Setup',
        passMark: 70
      }
    },
    {
      id: 'te-2',
      courseId: 'tr-c1',
      employeeId: 'emp-6',
      status: 'In Progress',
      progress: 55,
      currentLessonIndex: 2,
      completedLessons: ['trc1-m1', 'trc1-m2'],
      quizAttempts: 0,
      quizPassed: false
    },
    {
      id: 'te-3',
      courseId: 'tr-c2',
      employeeId: 'emp-11',
      status: 'In Progress',
      progress: 40,
      currentLessonIndex: 2,
      completedLessons: ['trc2-m1'],
      quizAttempts: 0,
      quizPassed: false
    },
    {
      id: 'te-4',
      courseId: 'tr-c3',
      employeeId: 'emp-8',
      status: 'In Progress',
      progress: 85,
      currentLessonIndex: 4,
      completedLessons: ['trc3-m1', 'trc3-m2', 'trc3-m3', 'trc3-m4'],
      quizAttempts: 1,
      quizScore: 60,
      quizPassed: false
    },
    {
      id: 'te-5',
      courseId: 'tr-c1',
      employeeId: 'emp-19',
      status: 'In Progress',
      progress: 20,
      currentLessonIndex: 1,
      completedLessons: [],
      quizAttempts: 0,
      quizPassed: false
    },
    {
      id: 'te-6',
      courseId: 'tr-c3',
      employeeId: 'emp-12',
      status: 'Completed',
      progress: 100,
      currentLessonIndex: 4,
      completedLessons: ['trc3-m1', 'trc3-m2', 'trc3-m3', 'trc3-m4'],
      quizAttempts: 1,
      quizScore: 85,
      quizPassed: true,
      certificate: {
        issueDate: '2026-06-12',
        score: 85,
        employeeName: 'Amina Yusuf',
        courseName: 'Customer Service Excellence',
        passMark: 70
      }
    },
    {
      id: 'te-8',
      courseId: 'tr-c5',
      employeeId: 'emp-3',
      status: 'Completed',
      progress: 100,
      completedLessons: [],
      quizAttempts: 0,
      quizPassed: true,
      certificate: {
        issueDate: '2026-06-11',
        score: 100,
        employeeName: 'Fatima Abubakar',
        courseName: 'Strategic Leadership Mastery (Coursera)',
        passMark: 70
      }
    }
  ];

  const hmoPlans: HMOPlan[] = [
    { id: 'hmo-1', provider: 'Reliance HMO', tier: 'Bronze', monthlyCost: 15000, hospitalCount: 450, coveredLimit: '₦1,200,000 / year' },
    { id: 'hmo-2', provider: 'Hygeia HMO', tier: 'Silver', monthlyCost: 25000, hospitalCount: 850, coveredLimit: '₦2,500,000 / year' },
    { id: 'hmo-3', provider: 'AXA Mansard Health', tier: 'Gold', monthlyCost: 45000, hospitalCount: 1200, coveredLimit: '₦5,000,000 / year' },
    { id: 'hmo-4', provider: 'Leadway Health', tier: 'Platinum', monthlyCost: 75000, hospitalCount: 1800, coveredLimit: '₦10,000,000 / year' }
  ];

  const hmoEnrollments: EmployeeHMOEnrollment[] = [
    {
      id: 'hmo-en-1',
      employeeId: 'emp-1',
      planId: 'hmo-3',
      dependants: [
        { name: 'Obinna Obi', relationship: 'Spouse', dob: '1988-04-12' },
        { name: 'Kamsi Obi', relationship: 'Child', dob: '2018-09-20' }
      ],
      enrolledDate: '2024-01-15'
    },
    {
      id: 'hmo-en-2',
      employeeId: 'emp-3',
      planId: 'hmo-2',
      dependants: [
        { name: 'Ibrahim Abubakar', relationship: 'Spouse', dob: '1990-11-05' }
      ],
      enrolledDate: '2024-02-01'
    }
  ];

  const disciplinaryQueries: DisciplinaryQuery[] = [
    {
      id: 'q-101',
      employeeId: 'emp-8',
      issuedBy: 'Chioma Obi (HR Admin)',
      title: 'Unauthorized Absence and Missed Client Standup',
      category: 'Absence',
      description: 'You were absent from work without prior leave approval on Monday, June 8th, causing a disruption in the deployment schedule.',
      issuedDate: '2026-06-09',
      deadlineDate: '2026-06-11T17:00:00',
      defenseText: 'I experienced a medical emergency with severe malaria on Monday morning and was admitted to the hospital clinic. I sent an email as soon as I received treatment.',
      defenseSubmittedDate: '2026-06-10',
      status: 'Under HR Review',
      resolutionNote: 'Medical report verified by HR.'
    },
    {
      id: 'q-102',
      employeeId: 'emp-12',
      issuedBy: 'Olumide Sowore (HR Executive)',
      title: 'Repeated Tardiness and Late Check-ins',
      category: 'Policy Violation',
      description: 'Attendance logs indicate check-in times after 09:15 AM on three consecutive days without manager clearance.',
      issuedDate: '2026-06-10',
      deadlineDate: '2026-06-12T17:00:00',
      status: 'Warning Issued',
      resolutionNote: 'Written Warning issued to employee folder.'
    }
  ];

  const ewaRequests: EWARequest[] = [
    {
      id: 'ewa-1',
      employeeId: 'emp-6',
      month: '2026-06',
      earnedAmount: 180000,
      requestedAmount: 50000,
      fee: 500,
      status: 'Disbursed',
      requestDate: '2026-06-12'
    }
  ];

  const hmoClaims: HMOClaim[] = [
    {
      id: 'claim-1',
      employeeId: 'emp-3',
      claimDate: '2026-06-10',
      hospitalName: 'St. Nicholas Hospital, Lagos',
      diagnosis: 'Acute Malaria & Typhoid Out-of-Pocket Emergency Treatment',
      amount: 45000,
      receiptUrl: 'st_nicholas_receipt_45k.pdf',
      status: 'Approved & Refunded',
      outcomeNote: 'Verified emergency out-of-network treatment receipt. Approved for full reimbursement.'
    },
    {
      id: 'claim-2',
      employeeId: 'emp-6',
      claimDate: '2026-06-18',
      hospitalName: 'Redington Hospital, Victoria Island',
      diagnosis: 'Dental Emergency Extraction',
      amount: 28000,
      receiptUrl: 'redington_dental_receipt.pdf',
      status: 'Pending HR Review'
    }
  ];

  return {
    departments,
    employees,
    attendance,
    leaveRequests,
    payroll,
    performanceReviews,
    jobPostings,
    jobApplicants,
    memos,
    notifications,
    incidentReports,
    trainingCourses,
    trainingEnrollments,
    hmoPlans,
    hmoEnrollments,
    hmoClaims,
    disciplinaryQueries,
    ewaRequests
  };
};

// Database class helper for thread-safe/async operations
class JsonDatabase {
  private data: DatabaseSchema | null = null;

  private read(): DatabaseSchema {
    if (this.data) return this.data;

    try {
      if (fs.existsSync(DB_FILE)) {
        const fileContent = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(fileContent);
        // Ensure missing arrays exist if loading older db.json
        if (!this.data!.hmoPlans) this.data!.hmoPlans = getSeedData().hmoPlans;
        if (!this.data!.hmoEnrollments) this.data!.hmoEnrollments = getSeedData().hmoEnrollments;
        if (!this.data!.hmoClaims) this.data!.hmoClaims = getSeedData().hmoClaims;
        if (!this.data!.disciplinaryQueries) this.data!.disciplinaryQueries = getSeedData().disciplinaryQueries;
        if (!this.data!.ewaRequests) this.data!.ewaRequests = getSeedData().ewaRequests;
        return this.data!;
      }
    } catch (err) {
      console.error('Error reading database file, using seed data instead', err);
    }

    // Initialize with seed data and save it
    const seed = getSeedData();
    this.write(seed);
    return seed;
  }

  private write(data: DatabaseSchema): void {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
      this.data = data;
    } catch (err) {
      console.error('Error writing to database file', err);
    }
  }

  // Get collections
  public getEmployees(): Employee[] {
    return this.read().employees;
  }

  public getDepartments(): Department[] {
    return this.read().departments;
  }

  public getAttendance(): Attendance[] {
    return this.read().attendance;
  }

  public getLeaveRequests(): LeaveRequest[] {
    return this.read().leaveRequests;
  }

  public getPayroll(): Payroll[] {
    return this.read().payroll;
  }

  public getPerformanceReviews(): PerformanceReview[] {
    return this.read().performanceReviews;
  }

  public getJobPostings(): JobPosting[] {
    return this.read().jobPostings;
  }

  public getJobApplicants(): JobApplicant[] {
    return this.read().jobApplicants;
  }

  public getTrainingCourses(): TrainingCourse[] {
    return this.read().trainingCourses;
  }

  public getTrainingEnrollments(): TrainingEnrollment[] {
    return this.read().trainingEnrollments;
  }

  public getHmoPlans(): HMOPlan[] {
    return this.read().hmoPlans;
  }

  public getHmoEnrollments(): EmployeeHMOEnrollment[] {
    return this.read().hmoEnrollments;
  }

  public getDisciplinaryQueries(): DisciplinaryQuery[] {
    return this.read().disciplinaryQueries;
  }

  public getEwaRequests(): EWARequest[] {
    return this.read().ewaRequests;
  }

  public updateTrainingCourses(courses: TrainingCourse[]): void {
    const db = this.read();
    db.trainingCourses = courses;
    this.write(db);
  }

  // Updates
  public updateEmployees(employees: Employee[]): void {
    const db = this.read();
    db.employees = employees;
    this.write(db);
  }

  public updateAttendance(attendance: Attendance[]): void {
    const db = this.read();
    db.attendance = attendance;
    this.write(db);
  }

  public updateLeaveRequests(leaveRequests: LeaveRequest[]): void {
    const db = this.read();
    db.leaveRequests = leaveRequests;
    this.write(db);
  }

  public updatePayroll(payroll: Payroll[]): void {
    const db = this.read();
    db.payroll = payroll;
    this.write(db);
  }

  public updatePerformanceReviews(performanceReviews: PerformanceReview[]): void {
    const db = this.read();
    db.performanceReviews = performanceReviews;
    this.write(db);
  }

  public updateJobPostings(jobPostings: JobPosting[]): void {
    const db = this.read();
    db.jobPostings = jobPostings;
    this.write(db);
  }

  public updateJobApplicants(jobApplicants: JobApplicant[]): void {
    const db = this.read();
    db.jobApplicants = jobApplicants;
    this.write(db);
  }

  public getMemos(): Memo[] {
    return this.read().memos;
  }

  public getNotifications(): Notification[] {
    return this.read().notifications;
  }

  public getIncidentReports(): IncidentReport[] {
    return this.read().incidentReports;
  }

  public updateMemos(memos: Memo[]): void {
    const db = this.read();
    db.memos = memos;
    this.write(db);
  }

  public updateNotifications(notifications: Notification[]): void {
    const db = this.read();
    db.notifications = notifications;
    this.write(db);
  }

  public updateIncidentReports(incidentReports: IncidentReport[]): void {
    const db = this.read();
    db.incidentReports = incidentReports;
    this.write(db);
  }

  public updateTrainingEnrollments(enrollments: TrainingEnrollment[]): void {
    const db = this.read();
    db.trainingEnrollments = enrollments;
    this.write(db);
  }

  public getHmoClaims(): HMOClaim[] {
    return this.read().hmoClaims || [];
  }

  public updateHmoEnrollments(enrollments: EmployeeHMOEnrollment[]): void {
    const db = this.read();
    db.hmoEnrollments = enrollments;
    this.write(db);
  }

  public updateHmoClaims(claims: HMOClaim[]): void {
    const db = this.read();
    db.hmoClaims = claims;
    this.write(db);
  }

  public updateDisciplinaryQueries(queries: DisciplinaryQuery[]): void {
    const db = this.read();
    db.disciplinaryQueries = queries;
    this.write(db);
  }

  public updateEwaRequests(requests: EWARequest[]): void {
    const db = this.read();
    db.ewaRequests = requests;
    this.write(db);
  }
}

export const db = new JsonDatabase();
