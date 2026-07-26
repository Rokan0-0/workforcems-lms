-- ============================================================================
-- WORKFORCEMS ENTERPRISE DATABASE SCHEMA
-- Target Engine: PostgreSQL 13+ / Supabase / Neon / AWS RDS
-- Description: Complete Relational Schema & Seed Data for WorkforceMS
-- Modules: Core HR, AI LMS Training & Development, Digital HMO Benefits, Governance
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- Custom ENUM Types
-- ----------------------------------------------------------------------------
CREATE TYPE user_role_enum AS ENUM ('HR Admin', 'Employee');
CREATE TYPE lms_category_enum AS ENUM ('Technical', 'Compliance', 'Soft Skills', 'Leadership', 'Other');
CREATE TYPE lms_difficulty_enum AS ENUM ('Beginner', 'Intermediate', 'Advanced');
CREATE TYPE lms_status_enum AS ENUM ('Enrolled', 'In Progress', 'Completed');
CREATE TYPE hmo_tier_enum AS ENUM ('Bronze', 'Silver', 'Gold', 'Platinum');
CREATE TYPE hmo_claim_status_enum AS ENUM ('Pending HR Review', 'Approved & Refunded', 'Rejected');
CREATE TYPE query_status_enum AS ENUM ('Pending Response', 'Under HR Review', 'Resolved', 'Warning Issued', 'Escalated');
CREATE TYPE attendance_status_enum AS ENUM ('Present', 'Late', 'Absent');

-- ----------------------------------------------------------------------------
-- 1. DEPARTMENTS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS departments (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(128) NOT NULL UNIQUE,
    manager_id VARCHAR(64),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 2. EMPLOYEES TABLE (Personnel & Authentication)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS employees (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255), -- Set by auth provider or bcrypt
    role user_role_enum NOT NULL DEFAULT 'Employee',
    department_id VARCHAR(64) REFERENCES departments(id) ON DELETE SET NULL,
    hire_date DATE NOT NULL,
    salary_base NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    salary_housing NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    salary_transport NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    phone VARCHAR(32),
    address TEXT,
    next_of_kin VARCHAR(128),
    profile_photo TEXT,
    onboarding_checklist JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add Foreign Key constraint for department manager
ALTER TABLE departments
    ADD CONSTRAINT fk_dept_manager
    FOREIGN KEY (manager_id) REFERENCES employees(id) ON DELETE SET NULL;

-- ----------------------------------------------------------------------------
-- 3. AI LMS: COURSES TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS lms_courses (
    id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    duration VARCHAR(64),
    category lms_category_enum NOT NULL DEFAULT 'Technical',
    difficulty lms_difficulty_enum NOT NULL DEFAULT 'Beginner',
    thumbnail_url TEXT,
    provider VARCHAR(128),
    link_url TEXT,
    is_external BOOLEAN DEFAULT FALSE,
    created_by VARCHAR(64) REFERENCES employees(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 4. AI LMS: COURSE MODULES (CURRICULUM)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS lms_modules (
    id VARCHAR(64) PRIMARY KEY,
    course_id VARCHAR(64) NOT NULL REFERENCES lms_courses(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT, -- Markdown supported lesson content
    duration VARCHAR(32),
    video_url TEXT, -- YouTube or MP4 embed
    order_index INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 5. AI LMS: QUIZZES & ASSESSMENT QUESTIONS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS lms_quizzes (
    id VARCHAR(64) PRIMARY KEY,
    course_id VARCHAR(64) UNIQUE NOT NULL REFERENCES lms_courses(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    pass_mark INT NOT NULL DEFAULT 70 CHECK (pass_mark >= 0 AND pass_mark <= 100),
    max_attempts INT NOT NULL DEFAULT 3,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS lms_quiz_questions (
    id VARCHAR(64) PRIMARY KEY,
    quiz_id VARCHAR(64) NOT NULL REFERENCES lms_quizzes(id) ON DELETE CASCADE,
    type VARCHAR(32) NOT NULL DEFAULT 'multiple-choice',
    question TEXT NOT NULL,
    options_json JSONB DEFAULT '[]'::jsonb, -- Array of string options
    correct_answer TEXT NOT NULL,
    order_index INT DEFAULT 0
);

-- ----------------------------------------------------------------------------
-- 6. AI LMS: ENROLLMENTS & PROGRESS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS lms_enrollments (
    id VARCHAR(64) PRIMARY KEY,
    course_id VARCHAR(64) NOT NULL REFERENCES lms_courses(id) ON DELETE CASCADE,
    employee_id VARCHAR(64) NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    status lms_status_enum NOT NULL DEFAULT 'Enrolled',
    progress INT NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    current_lesson_index INT DEFAULT 0,
    completed_lessons JSONB DEFAULT '[]'::jsonb, -- Array of completed module IDs
    quiz_attempts INT DEFAULT 0,
    quiz_score INT CHECK (quiz_score >= 0 AND quiz_score <= 100),
    quiz_passed BOOLEAN DEFAULT FALSE,
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(course_id, employee_id)
);

-- ----------------------------------------------------------------------------
-- 7. AI LMS: VERIFIED CERTIFICATES
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS lms_certificates (
    id VARCHAR(64) PRIMARY KEY,
    enrollment_id VARCHAR(64) UNIQUE NOT NULL REFERENCES lms_enrollments(id) ON DELETE CASCADE,
    employee_id VARCHAR(64) NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    course_id VARCHAR(64) NOT NULL REFERENCES lms_courses(id) ON DELETE CASCADE,
    certificate_number VARCHAR(64) NOT NULL UNIQUE,
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    score INT NOT NULL,
    pass_mark INT NOT NULL,
    signature_name VARCHAR(128) DEFAULT 'Olumide Sowore',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 8. DIGITAL HMO: PLANS & PROVIDERS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS hmo_plans (
    id VARCHAR(64) PRIMARY KEY,
    provider VARCHAR(128) NOT NULL,
    tier hmo_tier_enum NOT NULL DEFAULT 'Silver',
    monthly_cost NUMERIC(10, 2) NOT NULL,
    hospital_count INT NOT NULL DEFAULT 0,
    covered_limit VARCHAR(64) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 9. DIGITAL HMO: ENROLLMENTS & DEPENDANTS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS hmo_enrollments (
    id VARCHAR(64) PRIMARY KEY,
    employee_id VARCHAR(64) UNIQUE NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    plan_id VARCHAR(64) NOT NULL REFERENCES hmo_plans(id) ON DELETE RESTRICT,
    dependants JSONB DEFAULT '[]'::jsonb, -- Array of { name, relationship, dob }
    enrolled_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 10. DIGITAL HMO: OUT-OF-POCKET CLAIMS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS hmo_claims (
    id VARCHAR(64) PRIMARY KEY,
    employee_id VARCHAR(64) NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    claim_date DATE NOT NULL DEFAULT CURRENT_DATE,
    hospital_name VARCHAR(255) NOT NULL,
    diagnosis TEXT NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    receipt_url TEXT,
    status hmo_claim_status_enum NOT NULL DEFAULT 'Pending HR Review',
    outcome_note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 11. DISCIPLINARY & GOVERNANCE QUERIES
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS disciplinary_queries (
    id VARCHAR(64) PRIMARY KEY,
    employee_id VARCHAR(64) NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    issued_by VARCHAR(64) NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(64) NOT NULL,
    description TEXT NOT NULL,
    issued_date DATE NOT NULL DEFAULT CURRENT_DATE,
    deadline_date DATE NOT NULL,
    defense_text TEXT,
    defense_submitted_at TIMESTAMP WITH TIME ZONE,
    status query_status_enum NOT NULL DEFAULT 'Pending Response',
    resolution_note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- INDEXES FOR MAXIMUM QUERY PERFORMANCE
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_emp_dept ON employees(department_id);
CREATE INDEX IF NOT EXISTS idx_emp_role ON employees(role);
CREATE INDEX IF NOT EXISTS idx_lms_modules_course ON lms_modules(course_id, order_index);
CREATE INDEX IF NOT EXISTS idx_lms_enrollments_emp ON lms_enrollments(employee_id);
CREATE INDEX IF NOT EXISTS idx_lms_enrollments_course ON lms_enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_hmo_claims_emp ON hmo_claims(employee_id);
CREATE INDEX IF NOT EXISTS idx_queries_emp ON disciplinary_queries(employee_id);

-- ============================================================================
-- SAMPLE INITIAL SEED DATA
-- ============================================================================

-- Departments
INSERT INTO departments (id, name) VALUES
('dept-1', 'Engineering'),
('dept-2', 'Sales & Marketing'),
('dept-3', 'Finance & Risk'),
('dept-4', 'Human Resources'),
('dept-5', 'Operations')
ON CONFLICT (id) DO NOTHING;

-- HR Admin Employee (Olumide Sowore)
INSERT INTO employees (id, name, email, role, department_id, hire_date, salary_base, salary_housing, salary_transport, phone, address, profile_photo) VALUES
('emp-2', 'Olumide Sowore', 'olumide.sowore@workforcely.com', 'HR Admin', 'dept-4', '2023-03-01', 600000.00, 200000.00, 80000.00, '+234 809 333 4444', '45 Toyin Street, Ikeja, Lagos', 'https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=200&auto=format&fit=crop'),
('emp-1', 'Chioma Obi', 'chioma.obi@workforcely.com', 'HR Admin', 'dept-1', '2023-01-15', 850000.00, 250000.00, 100000.00, '+234 803 111 2222', '12 Lekki Phase 1, Lagos', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200&auto=format&fit=crop'),
('emp-3', 'Fatima Abubakar', 'fatima.abubakar@workforcely.com', 'Employee', 'dept-3', '2023-05-10', 750000.00, 220000.00, 90000.00, '+234 812 555 6666', '8 Wuse Zone 5, Abuja', 'https://images.unsplash.com/photo-1607746882042-944635dfe10e?q=80&w=200&auto=format&fit=crop')
ON CONFLICT (id) DO NOTHING;

-- HMO Plans
INSERT INTO hmo_plans (id, provider, tier, monthly_cost, hospital_count, covered_limit) VALUES
('hmo-plan-1', 'Hygeia HMO', 'Bronze', 15000.00, 450, '₦1.5M / year'),
('hmo-plan-2', 'Reliance HMO', 'Silver', 28000.00, 850, '₦3.5M / year'),
('hmo-plan-3', 'AXA Mansard HMO', 'Gold', 45000.00, 1400, '₦7.0M / year'),
('hmo-plan-4', 'Leadway Health', 'Platinum', 75000.00, 2200, 'Comprehensive Unlimited')
ON CONFLICT (id) DO NOTHING;

-- Seed Courses
INSERT INTO lms_courses (id, title, description, duration, category, difficulty, thumbnail_url, provider) VALUES
('crs-1', 'Introduction to Network Setup (Technical)', 'Master modern enterprise network infrastructure, subnetting, VPN tunnels, and router security configuration.', '4 weeks', 'Technical', 'Beginner', 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?q=80&w=400&auto=format&fit=crop', 'WorkforceMS Academy'),
('crs-2', 'Anti-Money Laundering (AML) Compliance', 'Comprehensive statutory guide covering NDLEA, NFIU, and CBN anti-financial crime guidelines.', '2 hours', 'Compliance', 'Intermediate', 'https://images.unsplash.com/photo-1450133064473-71024230f91b?q=80&w=400&auto=format&fit=crop', 'WorkforceMS Governance')
ON CONFLICT (id) DO NOTHING;

COMMIT;
