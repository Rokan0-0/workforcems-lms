'use client';

import { useState, useEffect } from 'react';
import { useSession, getCachedData, setCachedData } from '../session-provider';
import { BookOpen, Award, Plus, UserPlus, Play, Sparkles, Eye, CheckCircle2, Layers, HelpCircle, FileText, ArrowRight, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

const categories = ['All', 'Technical', 'Compliance', 'Soft Skills', 'Leadership', 'Other'];
const difficulties = ['All', 'Beginner', 'Intermediate', 'Advanced'];

function markdownToHtml(raw: string) {
  if (!raw) return '';
  const escaped = raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  const lines = escaped.split('\n');
  let html = '';
  let inUl = false;
  let inOl = false;

  lines.forEach((line) => {
    if (/^###\s+/.test(line)) {
      html += `<h3>${line.replace(/^###\s+/, '')}</h3>`;
    } else if (/^##\s+/.test(line)) {
      html += `<h2>${line.replace(/^##\s+/, '')}</h2>`;
    } else if (/^#\s+/.test(line)) {
      html += `<h1>${line.replace(/^#\s+/, '')}</h1>`;
    } else if (/^\d+\.\s+/.test(line)) {
      if (!inOl) {
        if (inUl) {
          html += '</ul>';
          inUl = false;
        }
        html += '<ol>';
        inOl = true;
      }
      html += `<li>${line.replace(/^\d+\.\s+/, '')}</li>`;
    } else if (/^-\s+/.test(line)) {
      if (!inUl) {
        if (inOl) {
          html += '</ol>';
          inOl = false;
        }
        html += '<ul>';
        inUl = true;
      }
      html += `<li>${line.replace(/^-\s+/, '')}</li>`;
    } else if (!line.trim()) {
      if (inUl) {
        html += '</ul>';
        inUl = false;
      }
      if (inOl) {
        html += '</ol>';
        inOl = false;
      }
      html += '<br/>';
    } else {
      if (inUl) {
        html += '</ul>';
        inUl = false;
      }
      if (inOl) {
        html += '</ol>';
        inOl = false;
      }
      html += `<p>${line}</p>`;
    }
  });

  if (inUl) html += '</ul>';
  if (inOl) html += '</ol>';

  return html
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
    .replace(/`([^`]+)`/g, '<code>$1</code>');
}

function downloadCertificate(certificate: any) {
  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Workforcely Certificate of Completion</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700;800&family=Montserrat:wght@400;600;700&display=swap');
  
  body {
    margin: 0;
    padding: 20px;
    background-color: #f1f5f9;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 90vh;
    font-family: 'Montserrat', sans-serif;
  }
  
  .certificate-container {
    width: 842px;
    height: 595px;
    background: #ffffff;
    padding: 30px;
    box-sizing: border-box;
    position: relative;
    border: 15px solid #0f172a;
    box-shadow: 0 10px 30px rgba(0,0,0,0.1);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: center;
    background-image: 
      radial-gradient(circle at 100% 150%, #fef08a 24%, #ffffff 25%),
      radial-gradient(circle at 0% -50%, #dbeafe 24%, #ffffff 25%);
  }
  
  .inner-border {
    border: 2px solid #e2e8f0;
    width: 100%;
    height: 100%;
    padding: 30px;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: center;
  }
  
  .header-org {
    font-size: 14px;
    font-weight: 700;
    letter-spacing: 4px;
    color: #475569;
    text-transform: uppercase;
    margin-top: 10px;
  }
  
  .title {
    font-family: 'Cinzel', serif;
    font-size: 38px;
    font-weight: 800;
    color: #0f172a;
    margin: 15px 0 5px 0;
    letter-spacing: 2px;
    text-align: center;
  }
  
  .subtitle {
    font-size: 14px;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 2px;
    margin-bottom: 20px;
  }
  
  .recipient-name {
    font-family: 'Cinzel', serif;
    font-size: 32px;
    font-weight: 700;
    color: #3b82f6;
    border-bottom: 2px solid #e2e8f0;
    padding-bottom: 5px;
    min-width: 350px;
    text-align: center;
    margin-bottom: 15px;
  }
  
  .course-intro {
    font-size: 13px;
    color: #64748b;
    margin-bottom: 5px;
  }
  
  .course-title {
    font-size: 20px;
    font-weight: 700;
    color: #0f172a;
    text-align: center;
    max-width: 600px;
    margin-bottom: 25px;
  }
  
  .meta-grid {
    display: flex;
    justify-content: space-between;
    width: 100%;
    padding: 0 40px;
    box-sizing: border-box;
    align-items: flex-end;
  }
  
  .meta-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    min-width: 150px;
  }
  
  .meta-value {
    font-size: 14px;
    font-weight: 600;
    color: #0f172a;
    border-bottom: 1px solid #cbd5e1;
    padding-bottom: 4px;
    width: 100%;
    text-align: center;
    margin-bottom: 4px;
  }
  
  .meta-label {
    font-size: 10px;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 1px;
  }
  
  .signature-line {
    font-family: 'Cinzel', serif;
    font-style: italic;
    font-size: 16px;
    color: #0f172a;
  }
  
  .seal {
    width: 70px;
    height: 70px;
    position: relative;
  }
  
  @media print {
    body {
      background: none;
      padding: 0;
    }
    .certificate-container {
      box-shadow: none;
      page-break-inside: avoid;
    }
  }
</style>
</head>
<body>
  <div class="certificate-container">
    <div class="inner-border">
      <div class="header-org">WORKFORCEMS</div>
      
      <div style="display: flex; flex-direction: column; align-items: center; width: 100%;">
        <div class="title">Certificate of Completion</div>
        <div class="subtitle">This certifies that</div>
        
        <div class="recipient-name">${certificate.employeeName}</div>
        
        <div class="course-intro">has successfully completed the training course</div>
        <div class="course-title">${certificate.courseName}</div>
      </div>
      
      <div class="meta-grid">
        <div class="meta-item">
          <div class="meta-value">${certificate.issueDate}</div>
          <div class="meta-label">Date Issued</div>
        </div>
        
        <div class="meta-item" style="align-self: center;">
          <div class="seal">
            <svg viewBox="0 0 100 100" width="100%" height="100%">
              <circle cx="50" cy="50" r="45" fill="#fef08a" stroke="#ca8a04" stroke-width="2" />
              <circle cx="50" cy="50" r="38" fill="none" stroke="#ca8a04" stroke-width="1" stroke-dasharray="3, 3" />
              <path d="M50,15 L58,38 L82,38 L62,52 L70,75 L50,60 L30,75 L38,52 L18,38 L42,38 Z" fill="#ca8a04" />
            </svg>
          </div>
        </div>
        
        <div class="meta-item">
          <div class="meta-value signature-line" style="font-family: 'Cinzel', serif;">Olumide Sowore</div>
          <div class="meta-label">HR Executive Director</div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${certificate.courseName.replace(/\s+/g, '_')}_certificate.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function TrainingPage() {
  const { user, refreshFlag, triggerRefresh } = useSession();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // HR Navigation Tabs: 'catalog' | 'studio' | 'ai-copilot'
  const [hrTab, setHrTab] = useState<'catalog' | 'studio' | 'ai-copilot'>('catalog');

  // Studio Step Wizard: 1 (Essentials) | 2 (Curriculum) | 3 (Quiz) | 4 (Preview)
  const [studioStep, setStudioStep] = useState<number>(1);

  // Forms State
  const [enrollForm, setEnrollForm] = useState({ employeeId: '', courseId: '' });
  const [enrollSuccess, setEnrollSuccess] = useState<string | null>(null);
  const [enrollError, setEnrollError] = useState<string | null>(null);

  const [courseBuilder, setCourseBuilder] = useState({
    title: '',
    description: '',
    category: 'Technical',
    difficulty: 'Beginner',
    duration: '',
    thumbnail: '',
    provider: '',
    link: '',
    external: false
  });

  const [builderModules, setBuilderModules] = useState<any[]>([]);
  const [builderModuleForm, setBuilderModuleForm] = useState({ title: '', content: '', duration: '', videoUrl: '' });
  const [builderQuiz, setBuilderQuiz] = useState({ title: 'Course Quiz', passMark: 70, maxAttempts: 3, questions: [] as any[] });
  const [quizQuestionForm, setQuizQuestionForm] = useState({ type: 'multiple-choice', question: '', options: '', correctAnswer: '' });
  const [builderMessage, setBuilderMessage] = useState<string | null>(null);

  // AI Co-pilot state
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiCategory, setAiCategory] = useState('Technical');
  const [aiDifficulty, setAiDifficulty] = useState('Intermediate');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiMessage, setAiMessage] = useState<string | null>(null);

  // Filter & Student LMS State
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterDifficulty, setFilterDifficulty] = useState('All');
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      const cached = getCachedData('/api/training-dashboard');
      if (cached) {
        setData(cached);
        setLoading(false);
      }
      try {
        if (!cached) {
          setLoading(true);
        }
        const [empRes, trainRes] = await Promise.all([fetch('/api/employees'), fetch('/api/training')]);
        const empData = await empRes.json();
        const trainData = await trainRes.json();
        const result = { employees: empData.employees, departments: empData.departments, courses: trainData.courses, enrollments: trainData.enrollments };
        setData(result);
        setCachedData('/api/training-dashboard', result);
        if (empData.employees?.length > 0 && trainData.courses?.length > 0) {
          setEnrollForm({ employeeId: empData.employees[0].id, courseId: trainData.courses[0].id });
        }
      } catch (err) {
        console.error('Failed to load training details', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [refreshFlag]);

  const resetBuilder = () => {
    setCourseBuilder({ title: '', description: '', category: 'Technical', difficulty: 'Beginner', duration: '', thumbnail: '', provider: '', link: '', external: false });
    setBuilderModules([]);
    setBuilderModuleForm({ title: '', content: '', duration: '', videoUrl: '' });
    setBuilderQuiz({ title: 'Course Quiz', passMark: 70, maxAttempts: 3, questions: [] });
    setQuizQuestionForm({ type: 'multiple-choice', question: '', options: '', correctAnswer: '' });
    setBuilderMessage(null);
    setStudioStep(1);
  };

  const handleEnrollSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnrollSuccess(null);
    setEnrollError(null);

    try {
      const res = await fetch('/api/training', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'enroll', employeeId: enrollForm.employeeId, courseId: enrollForm.courseId })
      });
      const result = await res.json();
      if (result.success) {
        setEnrollSuccess('Employee enrolled successfully.');
        triggerRefresh();
      } else {
        setEnrollError(result.error || 'Failed to enroll employee.');
      }
    } catch (err) {
      setEnrollError('Network error, please try again.');
    }
  };

  const handleAddModule = () => {
    if (!builderModuleForm.title || !builderModuleForm.duration) {
      setBuilderMessage('Lesson title and duration are required.');
      return;
    }
    setBuilderModules(prev => [...prev, { ...builderModuleForm, id: `mod-${Date.now()}` }]);
    setBuilderModuleForm({ title: '', content: '', duration: '', videoUrl: '' });
    setBuilderMessage(null);
  };

  const handleRemoveModule = (id: string) => {
    setBuilderModules(prev => prev.filter((module) => module.id !== id));
  };

  const handleAddQuizQuestion = () => {
    if (!quizQuestionForm.question || !quizQuestionForm.correctAnswer) {
      setBuilderMessage('Question text and correct answer are required.');
      return;
    }
    const options = quizQuestionForm.type === 'multiple-choice'
      ? quizQuestionForm.options.split(',').map((o) => o.trim()).filter(Boolean)
      : undefined;

    if (quizQuestionForm.type === 'multiple-choice' && (!options || options.length < 2)) {
      setBuilderMessage('Multiple choice questions require at least two answer options.');
      return;
    }

    setBuilderQuiz(prev => ({
      ...prev,
      questions: [...prev.questions, { id: `q-${Date.now()}`, type: quizQuestionForm.type, question: quizQuestionForm.question, options, correctAnswer: quizQuestionForm.correctAnswer }]
    }));
    setQuizQuestionForm({ type: 'multiple-choice', question: '', options: '', correctAnswer: '' });
    setBuilderMessage(null);
  };

  const handleRemoveQuizQuestion = (id: string) => {
    setBuilderQuiz(prev => ({ ...prev, questions: prev.questions.filter((q) => q.id !== id) }));
  };

  const handleCreateCourse = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setBuilderMessage(null);

    if (courseBuilder.external) {
      if (!courseBuilder.title || !courseBuilder.description || !courseBuilder.duration || !courseBuilder.provider || !courseBuilder.link) {
        setBuilderMessage('Course title, description, duration, provider, and link are required for external courses.');
        return;
      }
    } else {
      if (!courseBuilder.title || !courseBuilder.description || !courseBuilder.duration) {
        setBuilderMessage('Course title, description, and duration are required.');
        return;
      }
    }

    try {
      const res = await fetch('/api/training', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'createCourse',
          course: {
            ...courseBuilder,
            modules: courseBuilder.external ? [] : builderModules,
            quiz: (!courseBuilder.external && builderQuiz.questions.length > 0) ? builderQuiz : undefined
          }
        })
      });
      const result = await res.json();
      if (result.success) {
        setBuilderMessage('Course created successfully!');
        resetBuilder();
        setHrTab('catalog');
        triggerRefresh();
      } else {
        setBuilderMessage(result.error || 'Failed to create course.');
      }
    } catch (err) {
      setBuilderMessage('Network error, please try again.');
    }
  };

  const handleGenerateAICourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt) {
      setAiMessage('Please enter a course topic or learning goal.');
      return;
    }
    setAiGenerating(true);
    setAiMessage(null);

    try {
      const res = await fetch('/api/training', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generateAICourse',
          prompt: aiPrompt,
          category: aiCategory,
          difficulty: aiDifficulty
        })
      });
      const result = await res.json();

      if (result.success && result.course) {
        const generated = result.course;
        setCourseBuilder({
          title: generated.title || '',
          description: generated.description || '',
          category: generated.category || aiCategory,
          difficulty: generated.difficulty || aiDifficulty,
          duration: generated.duration || '3 hours',
          thumbnail: generated.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=400&auto=format&fit=crop',
          provider: '',
          link: '',
          external: false
        });

        setBuilderModules(generated.modules || []);
        if (generated.quiz) {
          setBuilderQuiz({
            title: generated.quiz.title || 'Course Quiz',
            passMark: generated.quiz.passMark || 80,
            maxAttempts: generated.quiz.maxAttempts || 3,
            questions: generated.quiz.questions || []
          });
        }
        setAiMessage('Course generated! Transferred to Course Studio for your final review & publish.');
        setHrTab('studio');
        setStudioStep(1);
      } else {
        setAiMessage(result.error || 'Failed to generate AI course.');
      }
    } catch (err) {
      setAiMessage('Network error during AI generation.');
    } finally {
      setAiGenerating(false);
    }
  };

  if (loading && !data) {
    return (
      <div style={{ padding: '32px', textAlign: 'center', fontSize: '15px', color: 'var(--text-muted)' }}>
        Loading training LMS...
      </div>
    );
  }

  const { employees, courses, enrollments } = data;
  const isAdmin = user?.role === 'HR Admin';
  const myEnrollments = enrollments.filter((e: any) => e.employeeId === user?.id).map((e: any) => ({ ...e, course: courses.find((c: any) => c.id === e.courseId) }));
  const availableCourses = courses.filter((course: any) => !enrollments.some((enrollment: any) => enrollment.courseId === course.id && enrollment.employeeId === user?.id));
  const filteredCourses = availableCourses.filter((course: any) => (filterCategory === 'All' || course.category === filterCategory) && (filterDifficulty === 'All' || course.difficulty === filterDifficulty));
  const totalEnrollments = enrollments.length;
  const completedCount = enrollments.filter((e: any) => e.status === 'Completed').length;
  const completionRate = totalEnrollments ? Math.round((completedCount / totalEnrollments) * 100) : 0;
  const quizScores = enrollments.filter((e: any) => e.quizScore !== undefined).map((e: any) => e.quizScore);
  const averageQuizScore = quizScores.length ? Math.round(quizScores.reduce((sum: number, score: number) => sum + score, 0) / quizScores.length) : 0;
  const totalCourses = courses.length;
  const enrolledCount = enrollments.length;

  return (
    <div className="page-container">
      {isAdmin ? (
        <>
          {/* HR Top Navigation Tabs */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--border-color)',
            paddingBottom: '12px',
            marginBottom: '24px',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className={`btn-secondary ${hrTab === 'catalog' ? 'btn-primary' : ''}`}
                onClick={() => setHrTab('catalog')}
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <BookOpen size={16} />
                Overview & Catalog
              </button>
              <button
                className={`btn-secondary ${hrTab === 'studio' ? 'btn-primary' : ''}`}
                onClick={() => setHrTab('studio')}
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <Layers size={16} />
                Course Creation Studio
              </button>
              <button
                className={`btn-secondary ${hrTab === 'ai-copilot' ? 'btn-primary' : ''}`}
                onClick={() => setHrTab('ai-copilot')}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', background: hrTab === 'ai-copilot' ? 'linear-gradient(135deg, #1e3a5f 0%, #14b8a6 100%)' : 'transparent', color: hrTab === 'ai-copilot' ? '#fff' : 'inherit' }}
              >
                <Sparkles size={16} />
                AI Course Co-pilot
              </button>
            </div>
            {hrTab === 'catalog' && (
              <button className="btn-primary" onClick={() => { resetBuilder(); setHrTab('studio'); }}>
                <Plus size={16} /> Create New Course
              </button>
            )}
          </div>

          {/* TAB 1: OVERVIEW & CATALOG */}
          {hrTab === 'catalog' && (
            <div style={{ display: 'grid', gap: '24px' }}>
              {/* Metrics Header */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <div className="metric-card"><strong>{totalCourses}</strong><p>Courses Available</p></div>
                <div className="metric-card"><strong>{enrolledCount}</strong><p>Total Enrollments</p></div>
                <div className="metric-card"><strong>{completionRate}%</strong><p>Completion Rate</p></div>
                <div className="metric-card"><strong>{averageQuizScore}%</strong><p>Average Quiz Score</p></div>
              </div>

              {/* Quick Enroll Card */}
              <div className="card">
                <h3 className="chart-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <UserPlus size={18} color="var(--primary)" />
                  Manual Employee Enrollment
                </h3>
                {enrollSuccess && <div style={{ color: 'var(--success)', fontSize: '13px', marginBottom: '10px' }}>{enrollSuccess}</div>}
                {enrollError && <div style={{ color: 'var(--danger)', fontSize: '13px', marginBottom: '10px' }}>{enrollError}</div>}
                <form onSubmit={handleEnrollSubmit} style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                  <div className="form-group" style={{ flex: 1, minWidth: '220px' }}>
                    <label className="form-label">Select Employee</label>
                    <select className="form-control" value={enrollForm.employeeId} onChange={(e) => setEnrollForm(prev => ({ ...prev, employeeId: e.target.value }))}>
                      {employees.map((emp: any) => <option key={emp.id} value={emp.id}>{emp.name} ({emp.email})</option>)}
                    </select>
                  </div>
                  <div className="form-group" style={{ flex: 1, minWidth: '220px' }}>
                    <label className="form-label">Select Course</label>
                    <select className="form-control" value={enrollForm.courseId} onChange={(e) => setEnrollForm(prev => ({ ...prev, courseId: e.target.value }))}>
                      {courses.map((course: any) => <option key={course.id} value={course.id}>{course.title} ({course.category})</option>)}
                    </select>
                  </div>
                  <button type="submit" className="btn-primary" style={{ height: '42px', minWidth: '160px', justifyContent: 'center' }}>
                    Enroll Employee
                  </button>
                </form>
              </div>

              {/* Course Catalog Table */}
              <div className="table-card">
                <div className="table-header-area">
                  <h3 className="chart-title">Course Catalog Directory</h3>
                </div>
                <div className="table-responsive">
                  <table className="custom-table" style={{ fontSize: '13px' }}>
                    <thead><tr><th>Title</th><th>Category</th><th>Difficulty</th><th>Duration</th><th>Lessons</th><th>Quiz Attached</th></tr></thead>
                    <tbody>{courses.map((course: any) => (
                      <tr key={course.id}>
                        <td><strong>{course.title}</strong><div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{course.description}</div></td>
                        <td><span className="badge badge-applied">{course.category || 'Other'}</span></td>
                        <td>{course.difficulty || 'Beginner'}</td>
                        <td>{course.duration}</td>
                        <td>{course.external ? 'External' : (course.modules?.length ?? 0)}</td>
                        <td>{course.quiz ? 'Yes' : 'No'}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              </div>

              {/* Employee Status Table */}
              <div className="table-card">
                <div className="table-header-area">
                  <h3 className="chart-title">Employee Training Progress & Certificates</h3>
                </div>
                <div className="table-responsive">
                  <table className="custom-table" style={{ fontSize: '13px' }}>
                    <thead><tr><th>Employee</th><th>Course</th><th>Status</th><th>Progress</th><th>Quiz Score</th><th>Certificate</th></tr></thead>
                    <tbody>{enrollments.map((enrollment: any) => {
                      const employee = employees.find((emp: any) => emp.id === enrollment.employeeId);
                      const course = courses.find((course: any) => course.id === enrollment.courseId);
                      return (
                        <tr key={enrollment.id}>
                          <td><strong>{employee?.name || 'Unknown'}</strong></td>
                          <td>{course?.title || 'Unknown Course'}</td>
                          <td><span className={`badge ${enrollment.status === 'Completed' ? 'badge-completed' : 'badge-inprogress'}`}>{enrollment.status}</span></td>
                          <td>{enrollment.progress}%</td>
                          <td>{enrollment.quizScore !== undefined ? `${enrollment.quizScore}%` : 'N/A'}</td>
                          <td>
                            {enrollment.certificate ? (
                              <button className="btn-secondary" style={{ fontSize: '11px', padding: '4px 8px' }} onClick={() => downloadCertificate(enrollment.certificate)}>
                                Download PDF/HTML
                              </button>
                            ) : (
                              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Incomplete</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}</tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: COURSE CREATION STUDIO (WIZARD) */}
          {hrTab === 'studio' && (
            <div className="card" style={{ maxWidth: '900px', margin: '0 auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                  <h2 className="chart-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Layers size={20} color="var(--primary)" />
                    Course Creation Studio
                  </h2>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0' }}>
                    Design custom training programs with rich modules, markdown text, video embeds, and evaluations.
                  </p>
                </div>
                <button className="btn-secondary" style={{ fontSize: '12px' }} onClick={resetBuilder}>Reset Form</button>
              </div>

              {/* Wizard Steps Indicator */}
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', marginBottom: '28px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
                {[
                  { step: 1, title: '1. Basic Details', icon: BookOpen },
                  { step: 2, title: '2. Curriculum & Lessons', icon: FileText },
                  { step: 3, title: '3. Quiz & Evaluation', icon: HelpCircle },
                  { step: 4, title: '4. Preview & Publish', icon: Eye }
                ].map((s) => {
                  const IconComp = s.icon;
                  const isActive = studioStep === s.step;
                  const isDone = studioStep > s.step;
                  return (
                    <button
                      key={s.step}
                      type="button"
                      onClick={() => setStudioStep(s.step)}
                      style={{
                        flex: 1,
                        padding: '10px 14px',
                        borderRadius: 'var(--radius-md)',
                        border: 'none',
                        backgroundColor: isActive ? 'var(--primary)' : isDone ? 'var(--bg-secondary)' : 'var(--bg-tertiary)',
                        color: isActive ? '#fff' : isDone ? 'var(--primary)' : 'var(--text-muted)',
                        fontWeight: isActive || isDone ? 700 : 500,
                        fontSize: '13px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        transition: 'all var(--transition-fast)'
                      }}
                    >
                      <IconComp size={15} />
                      {s.title}
                    </button>
                  );
                })}
              </div>

              {builderMessage && (
                <div style={{ color: 'var(--text)', backgroundColor: 'var(--bg-tertiary)', padding: '12px', borderRadius: 'var(--radius-md)', fontSize: '13px', marginBottom: '20px' }}>
                  {builderMessage}
                </div>
              )}

              {/* STEP 1: BASIC DETAILS */}
              {studioStep === 1 && (
                <div style={{ display: 'grid', gap: '18px' }}>
                  <div className="form-group">
                    <label className="form-label">Course Title *</label>
                    <input className="form-control" placeholder="e.g. Data Protection & Cybersecurity Essentials" value={courseBuilder.title} onChange={(e) => setCourseBuilder(prev => ({ ...prev, title: e.target.value }))} />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Description *</label>
                    <textarea className="form-control" rows={3} placeholder="Detailed course summary and key objectives..." value={courseBuilder.description} onChange={(e) => setCourseBuilder(prev => ({ ...prev, description: e.target.value }))} />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="form-group">
                      <label className="form-label">Category</label>
                      <select className="form-control" value={courseBuilder.category} onChange={(e) => setCourseBuilder(prev => ({ ...prev, category: e.target.value }))}>
                        {categories.filter((c) => c !== 'All').map((category) => <option key={category} value={category}>{category}</option>)}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Difficulty Level</label>
                      <select className="form-control" value={courseBuilder.difficulty} onChange={(e) => setCourseBuilder(prev => ({ ...prev, difficulty: e.target.value }))}>
                        {difficulties.filter((d) => d !== 'All').map((difficulty) => <option key={difficulty} value={difficulty}>{difficulty}</option>)}
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="form-group">
                      <label className="form-label">Estimated Duration *</label>
                      <input className="form-control" placeholder="e.g. 2.5 hours" value={courseBuilder.duration} onChange={(e) => setCourseBuilder(prev => ({ ...prev, duration: e.target.value }))} />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Thumbnail Image URL</label>
                      <input className="form-control" placeholder="https://images.unsplash.com/..." value={courseBuilder.thumbnail} onChange={(e) => setCourseBuilder(prev => ({ ...prev, thumbnail: e.target.value }))} />
                    </div>
                  </div>

                  <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 0' }}>
                    <input
                      type="checkbox"
                      id="studio-external"
                      checked={courseBuilder.external}
                      onChange={(e) => setCourseBuilder(prev => ({ ...prev, external: e.target.checked }))}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    <label htmlFor="studio-external" style={{ fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>
                      External Course (e.g. Coursera, Udemy)
                    </label>
                  </div>

                  {courseBuilder.external && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div className="form-group">
                        <label className="form-label">Provider Name *</label>
                        <input className="form-control" placeholder="e.g. Udemy" value={courseBuilder.provider} onChange={(e) => setCourseBuilder(prev => ({ ...prev, provider: e.target.value }))} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">External Course URL *</label>
                        <input className="form-control" placeholder="https://..." value={courseBuilder.link} onChange={(e) => setCourseBuilder(prev => ({ ...prev, link: e.target.value }))} />
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                    <button className="btn-primary" onClick={() => setStudioStep(courseBuilder.external ? 4 : 2)}>
                      Next: {courseBuilder.external ? 'Preview' : 'Curriculum'} <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: CURRICULUM & LESSONS */}
              {studioStep === 2 && (
                <div style={{ display: 'grid', gap: '20px' }}>
                  <div style={{ backgroundColor: 'var(--bg-primary)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                    <h4 style={{ margin: '0 0 12px', fontSize: '14px' }}>Add New Lesson / Module</h4>
                    <div style={{ display: 'grid', gap: '12px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                        <input className="form-control" placeholder="Lesson title (e.g. What is IP Addressing?)" value={builderModuleForm.title} onChange={(e) => setBuilderModuleForm(prev => ({ ...prev, title: e.target.value }))} />
                        <input className="form-control" placeholder="Duration (e.g. 30 min)" value={builderModuleForm.duration} onChange={(e) => setBuilderModuleForm(prev => ({ ...prev, duration: e.target.value }))} />
                      </div>
                      <textarea className="form-control" rows={4} placeholder="Lesson body text (supports Markdown: # Header, **bold**, lists)..." value={builderModuleForm.content} onChange={(e) => setBuilderModuleForm(prev => ({ ...prev, content: e.target.value }))} />
                      <input className="form-control" placeholder="Optional YouTube embed URL (e.g. https://www.youtube.com/embed/xyz)" value={builderModuleForm.videoUrl} onChange={(e) => setBuilderModuleForm(prev => ({ ...prev, videoUrl: e.target.value }))} />
                      <button type="button" className="btn-secondary" style={{ justifySelf: 'flex-start' }} onClick={handleAddModule}>
                        + Add Lesson to Curriculum
                      </button>
                    </div>
                  </div>

                  <div>
                    <h4 style={{ margin: '0 0 12px', fontSize: '14px' }}>Current Curriculum Lessons ({builderModules.length})</h4>
                    {builderModules.length === 0 ? (
                      <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                        No lessons added yet. Fill out the form above to add lessons to your course.
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gap: '10px' }}>
                        {builderModules.map((module, idx) => (
                          <div key={module.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-primary)', padding: '12px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                            <div>
                              <strong>Lesson {idx + 1}: {module.title}</strong>
                              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Duration: {module.duration} {module.videoUrl ? '• Video attached' : ''}</div>
                            </div>
                            <button type="button" className="btn-secondary" style={{ fontSize: '11px', color: 'var(--danger)' }} onClick={() => handleRemoveModule(module.id)}>Remove</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px' }}>
                    <button className="btn-secondary" onClick={() => setStudioStep(1)}><ArrowLeft size={16} /> Back</button>
                    <button className="btn-primary" onClick={() => setStudioStep(3)}>Next: Quiz & Evaluation <ArrowRight size={16} /></button>
                  </div>
                </div>
              )}

              {/* STEP 3: QUIZ & EVALUATION */}
              {studioStep === 3 && (
                <div style={{ display: 'grid', gap: '20px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="form-group">
                      <label className="form-label">Quiz Pass Mark (%)</label>
                      <input className="form-control" type="number" min={0} max={100} value={builderQuiz.passMark} onChange={(e) => setBuilderQuiz(prev => ({ ...prev, passMark: Number(e.target.value) }))} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Max Retake Attempts</label>
                      <input className="form-control" type="number" min={1} value={builderQuiz.maxAttempts} onChange={(e) => setBuilderQuiz(prev => ({ ...prev, maxAttempts: Number(e.target.value) }))} />
                    </div>
                  </div>

                  <div style={{ backgroundColor: 'var(--bg-primary)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                    <h4 style={{ margin: '0 0 12px', fontSize: '14px' }}>Add Quiz Question</h4>
                    <div style={{ display: 'grid', gap: '12px' }}>
                      <input className="form-control" placeholder="Question text..." value={quizQuestionForm.question} onChange={(e) => setQuizQuestionForm(prev => ({ ...prev, question: e.target.value }))} />
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <select className="form-control" value={quizQuestionForm.type} onChange={(e) => setQuizQuestionForm(prev => ({ ...prev, type: e.target.value }))}>
                          <option value="multiple-choice">Multiple Choice</option>
                          <option value="true-false">True / False</option>
                        </select>
                        <input className="form-control" placeholder="Exact Correct Answer" value={quizQuestionForm.correctAnswer} onChange={(e) => setQuizQuestionForm(prev => ({ ...prev, correctAnswer: e.target.value }))} />
                      </div>
                      {quizQuestionForm.type === 'multiple-choice' && (
                        <input className="form-control" placeholder="Options (comma separated, e.g. Option A, Option B, Option C)" value={quizQuestionForm.options} onChange={(e) => setQuizQuestionForm(prev => ({ ...prev, options: e.target.value }))} />
                      )}
                      <button type="button" className="btn-secondary" style={{ justifySelf: 'flex-start' }} onClick={handleAddQuizQuestion}>
                        + Add Question
                      </button>
                    </div>
                  </div>

                  <div>
                    <h4 style={{ margin: '0 0 12px', fontSize: '14px' }}>Questions List ({builderQuiz.questions.length})</h4>
                    {builderQuiz.questions.length === 0 ? (
                      <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                        No questions added. Courses without a quiz will mark completion upon completing all lessons.
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gap: '10px' }}>
                        {builderQuiz.questions.map((q, idx) => (
                          <div key={q.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-primary)', padding: '12px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                            <div>
                              <strong>Q{idx + 1}: {q.question}</strong>
                              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Type: {q.type} • Correct: {q.correctAnswer}</div>
                            </div>
                            <button type="button" className="btn-secondary" style={{ fontSize: '11px', color: 'var(--danger)' }} onClick={() => handleRemoveQuizQuestion(q.id)}>Remove</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px' }}>
                    <button className="btn-secondary" onClick={() => setStudioStep(2)}><ArrowLeft size={16} /> Back</button>
                    <button className="btn-primary" onClick={() => setStudioStep(4)}>Next: Live Preview <ArrowRight size={16} /></button>
                  </div>
                </div>
              )}

              {/* STEP 4: PREVIEW & PUBLISH */}
              {studioStep === 4 && (
                <div style={{ display: 'grid', gap: '20px' }}>
                  <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '20px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                      <div>
                        <span className="badge badge-applied">{courseBuilder.category}</span>
                        <h3 style={{ margin: '8px 0 4px' }}>{courseBuilder.title || 'Untitled Course'}</h3>
                        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>{courseBuilder.description}</p>
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        <div>Difficulty: {courseBuilder.difficulty}</div>
                        <div>Duration: {courseBuilder.duration}</div>
                      </div>
                    </div>
                  </div>

                  {!courseBuilder.external && (
                    <div>
                      <h4 style={{ margin: '0 0 10px' }}>Curriculum Preview</h4>
                      <div style={{ display: 'grid', gap: '10px' }}>
                        {builderModules.map((m, i) => (
                          <div key={m.id} style={{ padding: '12px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                            <strong>Lesson {i + 1}: {m.title}</strong> ({m.duration})
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px' }}>
                    <button className="btn-secondary" onClick={() => setStudioStep(courseBuilder.external ? 1 : 3)}><ArrowLeft size={16} /> Back</button>
                    <button className="btn-primary" onClick={() => handleCreateCourse()} style={{ background: 'var(--success)' }}>
                      <CheckCircle2 size={16} /> Publish Course Live
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: AI COURSE CO-PILOT */}
          {hrTab === 'ai-copilot' && (
            <div className="card" style={{ maxWidth: '800px', margin: '0 auto' }}>
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <div style={{ display: 'inline-flex', padding: '14px', borderRadius: '50%', backgroundColor: 'var(--accent-light)', marginBottom: '12px' }}>
                  <Sparkles size={30} color="var(--accent)" />
                </div>
                <h2 className="chart-title">AI Course Co-pilot</h2>
                <p style={{ fontSize: '14px', color: 'var(--text-muted)', maxWidth: '540px', margin: '6px auto 0' }}>
                  Describe any training topic or compliance goal, and our Gemini AI will generate a complete course with lesson modules, markdown content, and a quiz in seconds.
                </p>
              </div>

              {aiMessage && (
                <div style={{ color: 'var(--text)', backgroundColor: 'var(--bg-tertiary)', padding: '12px', borderRadius: 'var(--radius-md)', fontSize: '13px', marginBottom: '20px', textAlign: 'center' }}>
                  {aiMessage}
                </div>
              )}

              <form onSubmit={handleGenerateAICourse} style={{ display: 'grid', gap: '18px' }}>
                <div className="form-group">
                  <label className="form-label">Training Topic or Prompt *</label>
                  <textarea
                    className="form-control"
                    rows={4}
                    placeholder="e.g. Data Privacy and NDPR Regulations for SME Financial Services in Nigeria..."
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select className="form-control" value={aiCategory} onChange={(e) => setAiCategory(e.target.value)}>
                      {categories.filter((c) => c !== 'All').map((category) => <option key={category} value={category}>{category}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Difficulty Level</label>
                    <select className="form-control" value={aiDifficulty} onChange={(e) => setAiDifficulty(e.target.value)}>
                      {difficulties.filter((d) => d !== 'All').map((difficulty) => <option key={difficulty} value={difficulty}>{difficulty}</option>)}
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={aiGenerating}
                  className="btn-primary"
                  style={{
                    justifyContent: 'center',
                    padding: '14px',
                    fontSize: '15px',
                    background: 'linear-gradient(135deg, #1e3a5f 0%, #14b8a6 100%)',
                    boxShadow: '0 4px 14px rgba(20, 184, 166, 0.25)'
                  }}
                >
                  {aiGenerating ? (
                    <>Generating Course with AI...</>
                  ) : (
                    <>
                      <Sparkles size={18} /> Generate Course with AI Co-pilot
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </>
      ) : (
        /* Employee Self-Service LMS View */
        <div style={{ display: 'grid', gap: '24px' }}>
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
              <div>
                <h3 className="chart-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><BookOpen size={18} color="var(--primary)" />Available Training Courses</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Browse the course catalog, filter by category and difficulty, then enroll in any course to begin learning.</p>
              </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '16px' }}>
              <select className="form-control" style={{ width: '220px' }} value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>{categories.map((category) => (<option key={category} value={category}>{category}</option>))}</select>
              <select className="form-control" style={{ width: '220px' }} value={filterDifficulty} onChange={(e) => setFilterDifficulty(e.target.value)}>{difficulties.map((difficulty) => (<option key={difficulty} value={difficulty}>{difficulty}</option>))}</select>
            </div>

            <div style={{ display: 'grid', gap: '16px', marginTop: '20px' }}>
              {filteredCourses.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>No matching courses available.</div>
              ) : (
                filteredCourses.map((course: any) => (
                  <div key={course.id} style={{
                    backgroundColor: 'var(--bg-primary)',
                    border: course.external ? '1px solid var(--primary-light)' : '1px solid var(--border-color)',
                    boxShadow: course.external ? '0 0 12px var(--primary-light)' : 'none',
                    borderRadius: 'var(--radius-lg)',
                    display: 'grid',
                    gap: '16px',
                    padding: '20px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <h4 style={{ margin: 0 }}>{course.title}</h4>
                          <span className="badge badge-applied" style={{ fontSize: '11px' }}>{course.category}</span>
                          {course.external && (
                            <span className="badge badge-inprogress" style={{ fontSize: '11px', backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}>
                              External • {course.provider}
                            </span>
                          )}
                        </div>
                        <p style={{ margin: '8px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>{course.description}</p>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Difficulty: {course.difficulty}</span>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Duration: {course.duration}</span>
                        <button className="btn-primary" onClick={async () => {
                          if (!user) return;
                          const res = await fetch('/api/training', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'enroll', employeeId: user.id, courseId: course.id }) });
                          const result = await res.json();
                          if (result.success) {
                            triggerRefresh();
                          } else {
                            setActionMessage(result.error || 'Unable to enroll.');
                          }
                        }} style={{ justifyContent: 'center', minWidth: '180px' }}>
                          {course.external ? `Enroll Externally (${course.provider})` : 'Enroll in Course'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            {actionMessage && <div style={{ color: 'var(--success)', fontSize: '13px', marginTop: '12px' }}>{actionMessage}</div>}
          </div>

          <div className="card">
            <h3 className="chart-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Award size={18} color="var(--primary)" />Your Enrolled Courses</h3>
            {myEnrollments.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>You have no active enrollments yet. Enroll in a course from the catalog above.</div>
            ) : (
              <div style={{ display: 'grid', gap: '20px', marginTop: '20px' }}>
                {myEnrollments.map((enr: any) => {
                  const course = enr.course;
                  return (
                    <div
                      key={enr.id}
                      onClick={() => {
                        if (enr.status === 'Enrolled') {
                          fetch('/api/training', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ action: 'startTraining', enrollmentId: enr.id })
                          }).then(() => triggerRefresh());
                        }
                        router.push(`/dashboard/training/course/${enr.id}`);
                      }}
                      style={{
                        backgroundColor: 'var(--bg-primary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-lg)',
                        padding: '24px',
                        display: 'grid',
                        gap: '16px',
                        cursor: 'pointer',
                        transition: 'all var(--transition-fast)',
                      }}
                      className="hover-card-raise"
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                        <div>
                          <h4 style={{ margin: 0 }}>{course?.title}</h4>
                          <p style={{ margin: '6px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>{course?.description}</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span className={`badge ${enr.status === 'Completed' ? 'badge-completed' : enr.status === 'In Progress' ? 'badge-inprogress' : 'badge-absent'}`}>{enr.status}</span>
                          <div style={{ marginTop: '10px', fontSize: '12px', color: 'var(--text-muted)' }}>Progress: {enr.progress}%</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
