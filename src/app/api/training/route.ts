import { NextRequest, NextResponse } from 'next/server';
import { db, TrainingCourse, TrainingEnrollment, TrainingQuiz } from '@/lib/db';

function evaluateQuiz(course: TrainingCourse, answers: Record<string, string>) {
  const quiz = course.quiz;
  if (!quiz) {
    return { score: 0, passed: false };
  }
  const correctCount = quiz.questions.reduce((count, question) => {
    const answer = answers[question.id];
    if (answer === question.correctAnswer) {
      return count + 1;
    }
    return count;
  }, 0);

  const score = Math.round((correctCount / quiz.questions.length) * 100);
  const passed = score >= quiz.passMark;
  return { score, passed };
}

function buildCertificate(enrollment: TrainingEnrollment, course: TrainingCourse, employeeName: string) {
  return {
    issueDate: new Date().toISOString().split('T')[0],
    score: enrollment.quizScore ?? 0,
    employeeName,
    courseName: course.title,
    passMark: course.quiz?.passMark ?? 0
  };
}

export async function GET(request: NextRequest) {
  const courses = db.getTrainingCourses();
  const enrollments = db.getTrainingEnrollments();
  return NextResponse.json({ courses, enrollments });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, employeeId, courseId, enrollmentId, progress, moduleId, answers, course } = body;

    const courses = db.getTrainingCourses();
    const enrollments = db.getTrainingEnrollments();

    if (action === 'createCourse') {
      if (!course || !course.title || !course.description) {
        return NextResponse.json({ success: false, error: 'Course title and description are required' }, { status: 400 });
      }

      const newCourse: TrainingCourse = {
        id: `tr-${Date.now()}`,
        title: course.title,
        description: course.description,
        duration: course.duration || '2 hours',
        category: course.category || 'Other',
        difficulty: course.difficulty || 'Beginner',
        thumbnail: course.thumbnail || '',
        modules: course.modules || [],
        quiz: course.quiz || undefined,
        provider: course.provider || '',
        link: course.link || '',
        external: !!course.external
      };

      courses.push(newCourse);
      db.updateTrainingCourses(courses);

      return NextResponse.json({ success: true, course: newCourse });
    }

    if (action === 'generateAICourse') {
      const { prompt, category, difficulty } = body;
      if (!prompt) {
        return NextResponse.json({ success: false, error: 'Topic or prompt is required for AI course generation' }, { status: 400 });
      }

      const apiKey = process.env.GEMINI_API_KEY;

      if (apiKey) {
        try {
          const systemPrompt = `You are an expert Instructional Designer and Enterprise HR Trainer.
Create a comprehensive, structured online training course based on the provided topic/prompt.
Target Category: ${category || 'Technical'}
Target Difficulty: ${difficulty || 'Intermediate'}

Return ONLY a JSON object conforming to this exact schema (no markdown formatting code blocks):
{
  "title": "Course Title",
  "description": "2-3 sentence overview of what the course covers and target audience.",
  "category": "${category || 'Technical'}",
  "difficulty": "${difficulty || 'Intermediate'}",
  "duration": "Estimated total duration e.g. 3 hours",
  "thumbnail": "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=400&auto=format&fit=crop",
  "modules": [
    {
      "id": "mod-1",
      "title": "Lesson Title",
      "duration": "35 min",
      "content": "### Markdown Content for the lesson\n\nDetailed breakdown with bullet points, code or example scenario.\n\n- Key takeaway 1\n- Key takeaway 2",
      "videoUrl": ""
    }
  ],
  "quiz": {
    "title": "Course Assessment Quiz",
    "passMark": 80,
    "maxAttempts": 3,
    "questions": [
      {
        "id": "q-1",
        "type": "multiple-choice",
        "question": "Question text?",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correctAnswer": "Option A"
      },
      {
        "id": "q-2",
        "type": "true-false",
        "question": "True or false statement?",
        "correctAnswer": "True"
      }
    ]
  }
}`;

          const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: `${systemPrompt}\n\nTopic/Prompt: ${prompt}` }] }],
              generationConfig: { responseMimeType: 'application/json' }
            })
          });

          if (response.ok) {
            const result = await response.json();
            let text = result.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              text = text.trim().replace(/^```json\s*/, '').replace(/```\s*$/, '');
              const generated = JSON.parse(text);
              return NextResponse.json({ success: true, course: generated });
            }
          }
        } catch (err) {
          console.error('Gemini AI course generation failed, using template engine fallback:', err);
        }
      }

      // Smart Fallback Course Generator (If no API key or network error)
      const fallbackTitle = prompt.charAt(0).toUpperCase() + prompt.slice(1);
      const generated = {
        title: `${fallbackTitle}: Core Masterclass`,
        description: `Comprehensive training program covering essential strategies, compliance frameworks, and best practices for ${prompt}.`,
        category: category || 'Technical',
        difficulty: difficulty || 'Intermediate',
        duration: '3 hours',
        thumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=400&auto=format&fit=crop',
        modules: [
          {
            id: `mod-${Date.now()}-1`,
            title: `Introduction to ${fallbackTitle}`,
            duration: '35 min',
            content: `### Overview of ${fallbackTitle}\n\nIn this introductory lesson, you will explore the foundational principles of ${prompt}.\n\n- Key Concepts and Vocabulary\n- Operational Workflow Standards\n- Organizational Impact`,
            videoUrl: ''
          },
          {
            id: `mod-${Date.now()}-2`,
            title: 'Implementation & Practical Execution',
            duration: '45 min',
            content: `### Practical Scenarios\n\nLearn how to apply ${prompt} in day-to-day work scenarios.\n\n- Step 1: Planning and Risk Assessment\n- Step 2: Execution Guidelines\n- Step 3: Monitoring and Review`,
            videoUrl: ''
          },
          {
            id: `mod-${Date.now()}-3`,
            title: 'Compliance & Quality Standards',
            duration: '40 min',
            content: `### Quality & Regulatory Guidelines\n\nEnsure all activities comply with regulatory and corporate standards.\n\n- Governance principles\n- Reporting obligations\n- Continuous Improvement`,
            videoUrl: ''
          }
        ],
        quiz: {
          title: `${fallbackTitle} Knowledge Check`,
          passMark: 80,
          maxAttempts: 3,
          questions: [
            {
              id: `q-${Date.now()}-1`,
              type: 'multiple-choice',
              question: `What is the primary objective of ${prompt}?`,
              options: ['Efficiency & Quality', 'Delay Project', 'Ignore Policy', 'Increase Costs'],
              correctAnswer: 'Efficiency & Quality'
            },
            {
              id: `q-${Date.now()}-2`,
              type: 'true-false',
              question: `Compliance requirements apply to all team members undertaking ${prompt}.`,
              correctAnswer: 'True'
            }
          ]
        }
      };

      return NextResponse.json({ success: true, course: generated });
    }

    if (action === 'enroll') {
      if (!employeeId || !courseId) {
        return NextResponse.json({ success: false, error: 'Employee ID and Course ID are required' }, { status: 400 });
      }
      const exists = enrollments.find(e => e.employeeId === employeeId && e.courseId === courseId);
      if (exists) {
        return NextResponse.json({ success: false, error: 'Employee already enrolled in this course' }, { status: 400 });
      }

      const newEnrollment: TrainingEnrollment = {
        id: `te-${Date.now()}`,
        courseId,
        employeeId,
        status: 'Enrolled',
        progress: 0,
        currentLessonIndex: 0,
        completedLessons: [],
        quizAttempts: 0,
        quizPassed: false
      };
      enrollments.push(newEnrollment);
      db.updateTrainingEnrollments(enrollments);
      return NextResponse.json({ success: true, enrollment: newEnrollment });
    }

    const enrollmentIndex = enrollmentId ? enrollments.findIndex(e => e.id === enrollmentId) : -1;
    if (enrollmentId && enrollmentIndex === -1) {
      return NextResponse.json({ success: false, error: 'Enrollment not found' }, { status: 404 });
    }

    if (action === 'startTraining') {
      if (!enrollmentId) {
        return NextResponse.json({ success: false, error: 'Enrollment ID is required' }, { status: 400 });
      }
      const enrollment = enrollments[enrollmentIndex];
      if (enrollment.status === 'Enrolled') {
        enrollment.status = 'In Progress';
        enrollment.progress = Math.max(enrollment.progress, 5);
      }
      db.updateTrainingEnrollments(enrollments);
      return NextResponse.json({ success: true, enrollment });
    }

    if (action === 'completeLesson') {
      if (!enrollmentId || !moduleId) {
        return NextResponse.json({ success: false, error: 'Enrollment ID and module ID are required' }, { status: 400 });
      }
      const enrollment = enrollments[enrollmentIndex];
      const courseItem = courses.find(c => c.id === enrollment.courseId);
      if (!courseItem) {
        return NextResponse.json({ success: false, error: 'Course not found' }, { status: 404 });
      }
      const moduleCount = courseItem.modules?.length ?? 0;
      if (!enrollment.completedLessons.includes(moduleId)) {
        enrollment.completedLessons.push(moduleId);
      }
      const completedCount = enrollment.completedLessons.length;
      enrollment.currentLessonIndex = Math.min(moduleCount, completedCount);
      enrollment.progress = moduleCount > 0 ? Math.round((completedCount / moduleCount) * 100) : 0;
      if (completedCount === moduleCount && !courseItem.quiz) {
        enrollment.status = 'Completed';
        enrollment.quizPassed = true;
      } else if (completedCount > 0) {
        enrollment.status = 'In Progress';
      }
      db.updateTrainingEnrollments(enrollments);
      return NextResponse.json({ success: true, enrollment });
    }

    if (action === 'submitQuiz') {
      if (!enrollmentId || !answers) {
        return NextResponse.json({ success: false, error: 'Enrollment ID and quiz answers are required' }, { status: 400 });
      }
      const enrollment = enrollments[enrollmentIndex];
      const courseItem = courses.find(c => c.id === enrollment.courseId);
      if (!courseItem) {
        return NextResponse.json({ success: false, error: 'Course not found' }, { status: 404 });
      }
      if (!courseItem.quiz) {
        return NextResponse.json({ success: false, error: 'No quiz is attached to this course' }, { status: 400 });
      }
      if (enrollment.quizAttempts >= (courseItem.quiz.maxAttempts ?? 0)) {
        return NextResponse.json({ success: false, error: 'Maximum quiz attempts exceeded' }, { status: 400 });
      }
      const { score, passed } = evaluateQuiz(courseItem, answers);
      enrollment.quizAttempts = (enrollment.quizAttempts || 0) + 1;
      enrollment.quizScore = score;
      enrollment.quizPassed = passed;
      if (passed && (courseItem.modules?.length ?? 0) === enrollment.completedLessons.length) {
        enrollment.status = 'Completed';
        enrollment.certificate = buildCertificate(enrollment, courseItem, 'Employee');
      } else {
        enrollment.status = 'In Progress';
      }
      if (passed) {
        const employee = db.getEmployees().find(emp => emp.id === enrollment.employeeId);
        if (employee) {
          enrollment.certificate = buildCertificate(enrollment, courseItem, employee.name);
        }
      }
      db.updateTrainingEnrollments(enrollments);
      return NextResponse.json({ success: true, enrollment, score, passed });
    }

    if (action === 'updateProgress') {
      if (!enrollmentId || progress === undefined) {
        return NextResponse.json({ success: false, error: 'Enrollment ID and progress value are required' }, { status: 400 });
      }
      const enrollment = enrollments[enrollmentIndex];
      const prog = Math.min(100, Math.max(0, Number(progress)));
      enrollment.progress = prog;
      enrollment.status = prog === 100 ? 'Completed' : prog === 0 ? 'Enrolled' : 'In Progress';
      db.updateTrainingEnrollments(enrollments);
      return NextResponse.json({ success: true, enrollment });
    }

    if (action === 'resetCourse' || action === 'retakeCourse') {
      if (!enrollmentId) {
        return NextResponse.json({ success: false, error: 'Enrollment ID is required' }, { status: 400 });
      }
      const enrollment = enrollments[enrollmentIndex];
      enrollment.status = 'In Progress';
      enrollment.progress = 0;
      enrollment.currentLessonIndex = 0;
      enrollment.completedLessons = [];
      enrollment.quizAttempts = 0;
      enrollment.quizPassed = false;
      enrollment.quizScore = undefined;
      enrollment.certificate = undefined;

      db.updateTrainingEnrollments(enrollments);
      return NextResponse.json({ success: true, enrollment });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Invalid payload' }, { status: 400 });
  }
}
