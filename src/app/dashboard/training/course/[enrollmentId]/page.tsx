'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from '../../../session-provider';
import { useRouter } from 'next/navigation';
import { BookOpen, Award, Play, CheckCircle2, Lock, ArrowLeft, AlertCircle, ExternalLink, ChevronRight, Check, RotateCcw } from 'lucide-react';

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
      <div class="header-org">WORKFORCELY</div>
      
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

export default function CoursePlayerPage({ params }: { params: { enrollmentId: string } }) {
  const enrollmentId = params?.enrollmentId;
  const { user, triggerRefresh } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [enrollment, setEnrollment] = useState<any>(null);
  const [course, setCourse] = useState<any>(null);
  const [employee, setEmployee] = useState<any>(null);
  
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [quizError, setQuizError] = useState<string | null>(null);
  const [simulatingId, setSimulatingId] = useState<string | null>(null);

  const fetchTrainingData = useCallback(async () => {
    if (!enrollmentId) return;
    try {
      setLoading(true);
      const [empRes, trainRes] = await Promise.all([
        fetch('/api/employees'),
        fetch('/api/training')
      ]);
      const empData = await empRes.json();
      const trainData = await trainRes.json();

      const enroll = trainData.enrollments?.find((e: any) => e.id === enrollmentId);
      if (enroll) {
        setEnrollment(enroll);
        const crs = trainData.courses?.find((c: any) => c.id === enroll.courseId);
        setCourse(crs);
        const emp = empData.employees?.find((e: any) => e.id === enroll.employeeId);
        setEmployee(emp);
      } else {
        setEnrollment(null);
        setCourse(null);
      }
    } catch (err) {
      console.error('Failed to fetch training player details', err);
    } finally {
      setLoading(false);
    }
  }, [enrollmentId]);

  useEffect(() => {
    fetchTrainingData();
  }, [fetchTrainingData]);

  const handleCompleteLesson = async (moduleId: string) => {
    setSimulatingId(moduleId);
    try {
      const res = await fetch('/api/training', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'completeLesson', enrollmentId, moduleId })
      });
      const result = await res.json();
      if (result.success) {
        await fetchTrainingData();
        triggerRefresh();
        setSelectedModuleId(null);
      }
    } catch (err) {
      console.error('Failed to complete lesson', err);
    } finally {
      setSimulatingId(null);
    }
  };

  const handleRetakeCourse = async () => {
    setSimulatingId(enrollmentId);
    try {
      const res = await fetch('/api/training', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'retakeCourse', enrollmentId })
      });
      const result = await res.json();
      if (result.success) {
        setQuizAnswers({});
        setQuizError(null);
        setSelectedModuleId(null);
        await fetchTrainingData();
        triggerRefresh();
      }
    } catch (err) {
      console.error('Failed to retake course', err);
    } finally {
      setSimulatingId(null);
    }
  };

  const handleSubmitQuiz = async (quiz: any) => {
    setQuizError(null);
    const missingAnswers = quiz.questions.some((question: any) => !quizAnswers[question.id]);
    if (missingAnswers) {
      setQuizError('Please answer every quiz question before submitting.');
      return;
    }

    try {
      const res = await fetch('/api/training', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'submitQuiz', enrollmentId, answers: quizAnswers })
      });
      const result = await res.json();
      if (!result.success) {
        setQuizError(result.error || 'Quiz submission failed.');
      } else {
        setQuizError(null);
        await fetchTrainingData();
        triggerRefresh();
      }
    } catch (err) {
      setQuizError('Network error, please try again.');
    }
  };

  const handleCompleteExternal = async () => {
    setSimulatingId(enrollmentId);
    try {
      const res = await fetch('/api/training', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'updateProgress', enrollmentId, progress: 100 })
      });
      if (res.ok) {
        await fetchTrainingData();
        triggerRefresh();
      }
    } catch (err) {
      console.error('Failed to complete external course', err);
    } finally {
      setSimulatingId(null);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-primary)', color: 'var(--text-muted)' }}>
        <p style={{ fontSize: '15px' }}>Loading course content player...</p>
      </div>
    );
  }

  if (!enrollment || !course) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-primary)', padding: '24px' }}>
        <div className="card" style={{ maxWidth: '480px', width: '100%', textAlign: 'center', padding: '32px' }}>
          <AlertCircle size={48} color="var(--danger)" style={{ margin: '0 auto 16px auto' }} />
          <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '8px' }}>Enrollment Not Found</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px' }}>This enrollment session is expired, deleted, or you do not have permission to access it.</p>
          <button className="btn-primary" style={{ margin: '0 auto' }} onClick={() => router.push('/dashboard/training')}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const completedLessons = enrollment.completedLessons || [];
  const currentModule = course.modules?.find((m: any) => m.id === selectedModuleId);
  const isCourseFullyCompleted = enrollment.status === 'Completed';

  // For quiz display
  const quizReady = course.quiz && course.modules?.length === completedLessons.length;

  return (
    <div style={{ backgroundColor: 'var(--bg-secondary)', minHeight: '100vh', padding: '40px 20px' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', width: '100%' }}>
        
        {/* Navigation Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <button 
            className="btn-secondary" 
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px', fontSize: '13px' }}
            onClick={() => {
              if (selectedModuleId) {
                setSelectedModuleId(null);
              } else {
                router.push('/dashboard/training');
              }
            }}
          >
            <ArrowLeft size={16} /> 
            {selectedModuleId ? 'Back to Module List' : 'Back to Training Dashboard'}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              className="btn-secondary"
              onClick={handleRetakeCourse}
              disabled={simulatingId === enrollmentId}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '6px 12px' }}
            >
              <RotateCcw size={14} /> Retake Course
            </button>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>PROGRESS</span>
            <div style={{ width: '120px', height: '8px', backgroundColor: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${enrollment.progress}%`, height: '100%', backgroundColor: 'var(--success)', transition: 'width 0.4s ease' }}></div>
            </div>
            <strong style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{enrollment.progress}%</strong>
          </div>
        </div>

        {/* Dynamic View Panel */}
        {!selectedModuleId ? (
          /* MODULES LIST VIEW */
          <div style={{ display: 'grid', gap: '24px' }}>
            
            {/* Course Header Banner */}
            <div className="card" style={{ padding: '32px', background: 'linear-gradient(135deg, var(--bg-primary), var(--bg-tertiary))', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <span className="badge badge-applied">{course.category || 'Technical'}</span>
                <span className="badge badge-inprogress" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>{course.difficulty || 'Beginner'}</span>
                {course.external && <span className="badge badge-inprogress">External Course</span>}
              </div>
              <h2 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>{course.title}</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>{course.description}</p>
              <div style={{ display: 'flex', gap: '20px', marginTop: '20px', fontSize: '13px', color: 'var(--text-muted)' }}>
                <div><strong>Duration:</strong> {course.duration}</div>
                <div><strong>Lessons count:</strong> {course.modules?.length ?? 0} modules</div>
                {employee && <div><strong>Student:</strong> {employee.name}</div>}
              </div>
            </div>

            {/* External Course Handling */}
            {course.external ? (
              <div className="card" style={{ padding: '24px', display: 'grid', gap: '16px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <Award size={24} color="var(--primary)" />
                  <div>
                    <h4 style={{ margin: 0, fontWeight: 700 }}>External Platform Content</h4>
                    <p style={{ margin: '6px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                      This course is hosted externally on <strong>{course.provider || 'External Provider'}</strong>. Click below to go to the course materials.
                    </p>
                  </div>
                </div>

                {course.link && (
                  <a
                    href={course.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary"
                    style={{ justifySelf: 'start', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                    <ExternalLink size={16} /> Open Course on {course.provider || 'External Provider'}
                  </a>
                )}

                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px', marginTop: '8px' }}>
                  {isCourseFullyCompleted ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--success)' }}>
                      <CheckCircle2 size={24} />
                      <div>
                        <strong>You have completed this external course!</strong>
                        <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>Completion recorded in the Workforcely LMS dashboard.</p>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>Once you have finished the training on the provider's website, self-report your completion below:</p>
                      <button 
                        className="btn-primary" 
                        onClick={handleCompleteExternal} 
                        disabled={simulatingId === enrollmentId}
                        style={{ justifySelf: 'start', width: 'auto' }}
                      >
                        {simulatingId === enrollmentId ? 'Recording...' : 'Mark as Completed'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* INTERNAL TEXT BASED COURSE LESSONS */
              <div className="card" style={{ padding: '24px' }}>
                <h3 className="chart-title" style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <BookOpen size={18} color="var(--primary)" />
                  Course Modules & Learning Syllabus
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {course.modules?.map((module: any, idx: number) => {
                    const isCompleted = completedLessons.includes(module.id);
                    const isUnlocked = idx === 0 || completedLessons.includes(course.modules[idx - 1]?.id);
                    const isActive = isUnlocked && !isCompleted;

                    return (
                      <div
                        key={module.id}
                        onClick={() => {
                          if (isUnlocked) {
                            setSelectedModuleId(module.id);
                          }
                        }}
                        style={{
                          backgroundColor: 'var(--bg-primary)',
                          border: isActive 
                            ? '1px solid var(--primary)' 
                            : isCompleted 
                              ? '1px solid var(--success-light)' 
                              : '1px solid var(--border-color)',
                          borderRadius: 'var(--radius-md)',
                          padding: '16px 20px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: isUnlocked ? 'pointer' : 'not-allowed',
                          opacity: isUnlocked ? 1 : 0.6,
                          transition: 'all 0.2s ease',
                          boxShadow: isActive ? '0 0 10px rgba(99, 102, 241, 0.1)' : 'none'
                        }}
                        className={isUnlocked ? 'hover-card-raise' : ''}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <div style={{ 
                            width: '32px', 
                            height: '32px', 
                            borderRadius: '50%', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            backgroundColor: isCompleted 
                              ? 'rgba(16, 185, 129, 0.1)' 
                              : isActive 
                                ? 'rgba(99, 102, 241, 0.1)' 
                                : 'var(--bg-secondary)',
                            color: isCompleted 
                              ? 'var(--success)' 
                              : isActive 
                                ? 'var(--primary)' 
                                : 'var(--text-muted)'
                          }}>
                            {isCompleted ? (
                              <Check size={16} strokeWidth={3} />
                            ) : !isUnlocked ? (
                              <Lock size={14} />
                            ) : (
                              <span style={{ fontSize: '13px', fontWeight: 700 }}>{idx + 1}</span>
                            )}
                          </div>

                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '15px' }}>{module.title}</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>Lesson duration: {module.duration}</div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {isCompleted ? (
                            <span className="badge badge-completed">Completed</span>
                          ) : isActive ? (
                            <span className="badge badge-inprogress">Active Lesson</span>
                          ) : (
                            <span className="badge badge-absent" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-muted)' }}>Locked</span>
                          )}
                          {isUnlocked && <ChevronRight size={18} color="var(--text-muted)" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quiz Section (If modules are completed) */}
            {quizReady && course.quiz && (
              <div className="card" style={{ padding: '24px' }}>
                <h3 className="chart-title" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Award size={18} color="var(--primary)" />
                  Course Evaluation Quiz
                </h3>

                {enrollment.quizPassed ? (
                  <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.08)', border: '1px solid var(--success-light)', padding: '20px', borderRadius: 'var(--radius-md)', display: 'grid', gap: '12px' }}>
                    <h4 style={{ margin: 0, color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CheckCircle2 size={20} /> Quiz Passed Successfully!
                    </h4>
                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>
                      You scored <strong>{enrollment.quizScore}%</strong> (Passing Mark: {course.quiz.passMark}%).
                    </p>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      {enrollment.certificate && (
                        <button 
                          className="btn-primary" 
                          onClick={() => downloadCertificate(enrollment.certificate)}
                        >
                          Download Certificate
                        </button>
                      )}
                      <button className="btn-secondary" onClick={handleRetakeCourse}>
                        <RotateCcw size={14} style={{ marginRight: '6px' }} /> Retake Quiz / Reset
                      </button>
                    </div>
                  </div>
                ) : (
                  <form 
                    onSubmit={(e) => { e.preventDefault(); handleSubmitQuiz(course.quiz); }} 
                    style={{ display: 'grid', gap: '20px' }}
                  >
                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>
                      Please answer the following evaluation questions to verify your understanding. You have used <strong>{enrollment.quizAttempts ?? 0}</strong> of {course.quiz.maxAttempts} attempts.
                    </p>

                    {course.quiz.questions?.map((question: any, qIdx: number) => (
                      <div key={question.id} style={{ padding: '16px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}>
                        <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px' }}>{qIdx + 1}. {question.question}</div>
                        
                        <div style={{ display: 'grid', gap: '8px' }}>
                          {(question.type === 'true-false' ? ['True', 'False'] : question.options || []).map((option: string) => (
                            <label 
                              key={`${question.id}-${option}`} 
                              style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '10px', 
                                fontSize: '13px', 
                                padding: '10px 12px', 
                                border: '1px solid var(--border-color)', 
                                borderRadius: 'var(--radius-sm)', 
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                backgroundColor: quizAnswers[question.id] === option ? 'var(--bg-secondary)' : 'transparent'
                              }}
                            >
                              <input 
                                type="radio" 
                                name={question.id} 
                                value={option} 
                                checked={quizAnswers[question.id] === option} 
                                onChange={(e) => setQuizAnswers(prev => ({ ...prev, [question.id]: e.target.value }))} 
                                style={{ width: '16px', height: '16px' }}
                              />
                              {option}
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}

                    {quizError && <div style={{ color: 'var(--danger)', fontSize: '13px', fontWeight: 600 }}>{quizError}</div>}
                    
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button 
                        type="submit" 
                        className="btn-primary" 
                        disabled={enrollment.quizAttempts >= course.quiz.maxAttempts}
                      >
                        {enrollment.quizAttempts >= course.quiz.maxAttempts ? 'Retake Limit Reached' : 'Submit Quiz Answers'}
                      </button>

                      {enrollment.quizAttempts >= course.quiz.maxAttempts && (
                        <button type="button" className="btn-secondary" onClick={handleRetakeCourse}>
                          <RotateCcw size={14} style={{ marginRight: '6px' }} /> Reset & Retake Course
                        </button>
                      )}
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* Course Completion Banner */}
            {isCourseFullyCompleted && (
              <div className="card" style={{ padding: '32px', textAlign: 'center', border: '1px solid var(--success-light)', backgroundColor: 'rgba(16, 185, 129, 0.04)' }}>
                <Award size={48} color="var(--success)" style={{ margin: '0 auto 16px auto' }} />
                <h3 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--success)', marginBottom: '8px' }}>Course Fully Completed!</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px', maxWidth: '500px', margin: '0 auto 24px auto' }}>
                  Congratulations! You have completed all lessons and requirements. This has been recorded on your scorecard records.
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
                  {enrollment.certificate && (
                    <button className="btn-primary" onClick={() => downloadCertificate(enrollment.certificate)}>
                      Download Certificate
                    </button>
                  )}
                  <button className="btn-secondary" onClick={handleRetakeCourse}>
                    <RotateCcw size={14} style={{ marginRight: '6px' }} /> Retake Course
                  </button>
                  <button className="btn-secondary" onClick={() => router.push('/dashboard/training')}>
                    Return to Dashboard
                  </button>
                </div>
              </div>
            )}

          </div>
        ) : (
          /* MODULE CONTENT DETAIL VIEW */
          <div className="card" style={{ padding: '32px' }}>
            {currentModule ? (
              <div style={{ display: 'grid', gap: '24px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span className="badge badge-inprogress">LESSON CONTENT</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Estimated read: {currentModule.duration}</span>
                  </div>
                  <h2 style={{ fontSize: '24px', fontWeight: 800, margin: 0 }}>{currentModule.title}</h2>
                </div>

                <div 
                  className="lesson-content-body" 
                  style={{ 
                    fontSize: '15px', 
                    lineHeight: '1.8', 
                    color: 'var(--text-primary)',
                    borderTop: '1px solid var(--border-color)',
                    paddingTop: '20px'
                  }}
                  dangerouslySetInnerHTML={{ __html: markdownToHtml(currentModule.content) }}
                />

                {currentModule.videoUrl && (
                  <div style={{ marginTop: '16px' }}>
                    <iframe 
                      width="100%" 
                      height="400" 
                      src={currentModule.videoUrl} 
                      title={currentModule.title} 
                      style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)' }} 
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                      allowFullScreen
                    />
                  </div>
                )}

                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
                  <button 
                    className="btn-secondary" 
                    onClick={() => setSelectedModuleId(null)}
                  >
                    Back to Syllabus
                  </button>

                  {completedLessons.includes(currentModule.id) ? (
                    <button 
                      className="btn-secondary" 
                      style={{ color: 'var(--success)', borderColor: 'var(--success-light)' }} 
                      onClick={() => setSelectedModuleId(null)}
                    >
                      <CheckCircle2 size={16} style={{ marginRight: '6px' }} /> Already Completed
                    </button>
                  ) : (
                    <button 
                      className="btn-primary" 
                      disabled={simulatingId === currentModule.id}
                      onClick={() => handleCompleteLesson(currentModule.id)}
                    >
                      {simulatingId === currentModule.id ? 'Recording...' : 'Mark Lesson Completed'}
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                Select a lesson module from the syllabus list to begin.
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
