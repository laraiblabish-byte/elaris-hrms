-- ==============================================================================
-- ELARIS SOLUTIONS - HRMS & PAYROLL MANAGEMENT SYSTEM
-- Supabase Configuration, Table Creation, Predefined Departments & RLS Setup
-- ==============================================================================
-- Instructions: Run this script in your Supabase SQL Editor (Dashboard > SQL Editor)
-- It safely creates missing tables, enhances existing tables, and configures RLS.
-- ==============================================================================

-- 1. BASE TABLE DEFINITIONS (Created safely if they do not exist)

-- A. Employees Table
CREATE TABLE IF NOT EXISTS public.employees (
  id BIGSERIAL PRIMARY KEY,
  full_name TEXT,
  name TEXT,
  email TEXT UNIQUE,
  phone TEXT,
  department TEXT,
  department_id BIGINT,
  designation TEXT,
  role_tier TEXT DEFAULT 'Mid-Level',
  salary NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- B. Departments Table
CREATE TABLE IF NOT EXISTS public."Departments Table" (
  id BIGSERIAL PRIMARY KEY,
  department_name TEXT,
  name TEXT,
  description TEXT,
  head_employee_id BIGINT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- C. Attendance Table
CREATE TABLE IF NOT EXISTS public.attendance (
  id BIGSERIAL PRIMARY KEY,
  employee_id BIGINT,
  attendance_date DATE NOT NULL DEFAULT CURRENT_DATE,
  date DATE DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'Present',
  check_in TEXT DEFAULT '09:00',
  check_out TEXT DEFAULT '17:00',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- D. Leaves Table (with two-level approval workflow)
CREATE TABLE IF NOT EXISTS public.leaves (
  id BIGSERIAL PRIMARY KEY,
  employee_id BIGINT,
  leave_type TEXT NOT NULL DEFAULT 'Annual Leave',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'Pending',
  head_approved BOOLEAN NOT NULL DEFAULT FALSE,
  final_approved BOOLEAN NOT NULL DEFAULT FALSE,
  head_action_at TIMESTAMPTZ,
  final_action_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- E. Payroll Table
CREATE TABLE IF NOT EXISTS public.payroll (
  id BIGSERIAL PRIMARY KEY,
  employee_id BIGINT,
  basic_salary NUMERIC NOT NULL DEFAULT 0,
  allowances NUMERIC NOT NULL DEFAULT 0,
  bonus NUMERIC NOT NULL DEFAULT 0,
  deductions NUMERIC NOT NULL DEFAULT 0,
  net_salary NUMERIC NOT NULL DEFAULT 0,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_status TEXT NOT NULL DEFAULT 'Pending',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- F. Payslips Table
CREATE TABLE IF NOT EXISTS public.payslips (
  id BIGSERIAL PRIMARY KEY,
  employee_id BIGINT,
  payroll_id BIGINT,
  file_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- G. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  role TEXT DEFAULT 'HR Admin',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- H. Role Benefits & Leave Policies Table
CREATE TABLE IF NOT EXISTS public.role_benefits (
  id BIGSERIAL PRIMARY KEY,
  role_key TEXT UNIQUE NOT NULL,
  role_name TEXT NOT NULL,
  annual_leaves INTEGER NOT NULL DEFAULT 20,
  sick_leaves INTEGER NOT NULL DEFAULT 10,
  casual_leaves INTEGER NOT NULL DEFAULT 6,
  emergency_leaves INTEGER NOT NULL DEFAULT 3,
  health_insurance TEXT,
  wellness_stipend TEXT,
  learning_budget TEXT,
  remote_work_policy TEXT,
  bonus_percentage TEXT,
  travel_allowance TEXT,
  equipment_stipend TEXT,
  retirement_match TEXT,
  additional_perks JSONB DEFAULT '[]'::jsonb,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. SCHEMA ENHANCEMENTS: Add missing columns if they do not exist
DO $$
BEGIN
  -- full_name on employees table
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'employees' AND column_name = 'full_name'
  ) THEN
    ALTER TABLE public.employees ADD COLUMN full_name text;
  END IF;

  -- role_tier on employees table
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'employees' AND column_name = 'role_tier'
  ) THEN
    ALTER TABLE public.employees ADD COLUMN role_tier text DEFAULT 'Mid-Level';
  END IF;

  -- head_employee_id on "Departments Table"
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'Departments Table' AND column_name = 'head_employee_id'
  ) THEN
    ALTER TABLE public."Departments Table" ADD COLUMN head_employee_id BIGINT REFERENCES public.employees(id) ON DELETE SET NULL;
  END IF;

  -- Two-level leave approval columns on leaves table
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'leaves' AND column_name = 'head_approved'
  ) THEN
    ALTER TABLE public.leaves ADD COLUMN head_approved BOOLEAN NOT NULL DEFAULT FALSE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'leaves' AND column_name = 'final_approved'
  ) THEN
    ALTER TABLE public.leaves ADD COLUMN final_approved BOOLEAN NOT NULL DEFAULT FALSE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'leaves' AND column_name = 'head_action_at'
  ) THEN
    ALTER TABLE public.leaves ADD COLUMN head_action_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'leaves' AND column_name = 'final_action_at'
  ) THEN
    ALTER TABLE public.leaves ADD COLUMN final_action_at TIMESTAMPTZ;
  END IF;
END $$;

-- 2. CREATE ALIAS VIEW FOR DEPARTMENTS (Convenience alias)
CREATE OR REPLACE VIEW public.departments AS 
SELECT * FROM public."Departments Table";

-- 3. INSERT 14 PREDEFINED DEPARTMENTS (Without Duplicates)
INSERT INTO public."Departments Table" (department_name, description)
SELECT d.name, d.desc
FROM (
  VALUES
    ('HR', 'Human resources management, talent acquisition, and personnel operations'),
    ('Software Development', 'Core software engineering, architecture, and backend systems'),
    ('Web Development', 'Full-stack web application development and cloud interfaces'),
    ('Mobile App Development', 'Native iOS, Android, and cross-platform mobile solutions'),
    ('AI & Machine Learning', 'Artificial intelligence, LLM systems, computer vision, and predictive models'),
    ('UI/UX Design', 'User interface, user experience, product design, and prototyping'),
    ('Quality Assurance', 'Software testing, automation testing, and quality engineering'),
    ('Finance & Accounts', 'Financial accounting, payroll administration, budgeting, and audits'),
    ('Marketing', 'Digital marketing, SEO, content strategy, brand growth, and communications'),
    ('Sales', 'Business development, client relationships, and enterprise sales'),
    ('IT Support', 'Internal infrastructure, network security, and technical helpdesk'),
    ('Administration', 'Office operations, facility management, and executive coordination'),
    ('Customer Support', 'Client success, technical customer support, and issue resolution'),
    ('Project Management', 'Agile project delivery, scrum leadership, and sprint coordination')
) AS d(name, desc)
WHERE NOT EXISTS (
  SELECT 1 FROM public."Departments Table" dt 
  WHERE LOWER(TRIM(dt.department_name)) = LOWER(TRIM(d.name))
);

-- 4. INSERT PREDEFINED ROLE BENEFITS POLICIES (Executive, Senior, Mid-Level, Junior)
INSERT INTO public.role_benefits (
  role_key, role_name, annual_leaves, sick_leaves, casual_leaves, emergency_leaves,
  health_insurance, wellness_stipend, learning_budget, remote_work_policy,
  bonus_percentage, travel_allowance, equipment_stipend, retirement_match,
  additional_perks, description
)
VALUES
  (
    'Executive',
    'Executive & Leadership Tier',
    30,
    15,
    10,
    5,
    '$100,000 Global Premium Health Coverage (Full Employee, Spouse, Children & Parents Covered with 100% Inpatient/Outpatient/Dental/Vision)',
    '$150 / month ($1,800/yr) Premium Gym, Spa & Mental Wellness Allowance',
    '$3,000 / year Executive Leadership Coaching, Global Conferences & Certifications',
    '100% Remote / Hybrid Flexibility — Work from anywhere in the world',
    '25% - 35% of Annual Salary Executive Performance Bonus',
    'Executive Vehicle, Fuel Subsidy & Fully Reimbursed Business Travel',
    'MacBook Pro M3 Max / High-End Workstation + Dual 4K Displays ($3,500 budget)',
    '10% Company 401(k) / Provident Fund Matching',
    '["ESOP Stock Options", "First-Class Travel Lounge Access", "Annual VIP Full-Body Executive Health Checkup", "Unlimited Technical & Business Book Stipend", "Personal Executive Assistant Support"]'::jsonb,
    'Top-tier comprehensive benefit suite for C-Suite, Vice Presidents, Directors, and Department Heads.'
  ),
  (
    'Senior',
    'Senior Level Tier',
    25,
    12,
    8,
    4,
    '$50,000 Comprehensive Health Coverage (Employee + Immediate Family Covered, 90% Inpatient/Outpatient + Dental & Optical)',
    '$100 / month ($1,200/yr) Gym, Sports & Wellness Reimbursement',
    '$1,800 / year Professional Certifications, Courses (AWS, GCP, PMP) & Tech Summits',
    'Up to 12 WFH Days / Month (Flexible Hybrid Schedule)',
    '15% - 20% of Annual Salary Performance Bonus',
    '$250 / month Commute, Fuel & Client Meeting Travel Allowance',
    'MacBook Pro M3 / Dell XPS 15 + 27-inch 4K Monitor ($2,200 hardware refresh every 2 years)',
    '7% Company Provident Fund / 401(k) Matching',
    '["Annual Ergonomic Home-Office Setup Stipend ($500)", "Tech Conference Sponsorship", "Annual Health Screening", "Priority Project Selection", "Paid Certification Exam Fees"]'::jsonb,
    'Premium benefits package for Senior Engineers, Tech Leads, Senior Designers, and Team Managers.'
  ),
  (
    'Mid-Level',
    'Mid-Level Specialist Tier',
    20,
    10,
    6,
    3,
    '$25,000 Standard Health Insurance (Employee + Spouse Covered, 80% Inpatient/Outpatient)',
    '$60 / month ($720/yr) Fitness Club & Wellness Allowance',
    '$1,000 / year Online Courses & Skill Development (Coursera, Udemy, O’Reilly)',
    'Up to 6 WFH Days / Month (Standard Hybrid Schedule)',
    '10% - 12% Annual Target Performance Bonus',
    '$150 / month Public Transit & Commute Subsidy',
    'MacBook Air M3 / Lenovo ThinkPad Professional ($1,500 standard setup)',
    '5% Company Provident Fund / 401(k) Matching',
    '["High-Speed Internet Monthly Reimbursement", "Team Lunch & Learning Stipends", "Annual Preventive Health Checkup", "Flexible Core Hours"]'::jsonb,
    'Standard balanced benefits package for Software Engineers, UI/UX Designers, QA Specialists, and HR Officers.'
  ),
  (
    'Junior',
    'Junior & Entry-Level Tier',
    15,
    8,
    4,
    2,
    '$12,000 Essential Hospitalization & Basic Outpatient Health Insurance (Employee Covered)',
    '$35 / month ($420/yr) Gym & Fitness Pass Discount',
    '$500 / year Learning Subscription & Technical Bootcamps',
    'Up to 2 WFH Days / Month (Focus on in-office mentorship & peer pairing)',
    '5% - 7% Annual Performance & Learning Milestone Bonus',
    '$80 / month Shared Transit & Commute Pass',
    'Company-issued Standard Laptop (Dell Latitude / MacBook Air 13")',
    '3% Company Provident Fund / 401(k) Matching',
    '["Dedicated Senior Mentor Pairing", "Unlimited Premium Coffee & Snack Bar", "Annual Company Retreat & Sports Day", "Career Growth Acceleration Roadmap"]'::jsonb,
    'Growth-focused baseline package designed for Junior Engineers, Associates, Interns, and Trainees.'
  )
ON CONFLICT (role_key) DO UPDATE
SET
  role_name = EXCLUDED.role_name,
  annual_leaves = EXCLUDED.annual_leaves,
  sick_leaves = EXCLUDED.sick_leaves,
  casual_leaves = EXCLUDED.casual_leaves,
  emergency_leaves = EXCLUDED.emergency_leaves,
  health_insurance = EXCLUDED.health_insurance,
  wellness_stipend = EXCLUDED.wellness_stipend,
  learning_budget = EXCLUDED.learning_budget,
  remote_work_policy = EXCLUDED.remote_work_policy,
  bonus_percentage = EXCLUDED.bonus_percentage,
  travel_allowance = EXCLUDED.travel_allowance,
  equipment_stipend = EXCLUDED.equipment_stipend,
  retirement_match = EXCLUDED.retirement_match,
  additional_perks = EXCLUDED.additional_perks,
  description = EXCLUDED.description,
  updated_at = now();

-- 5. AUTOMATIC PROFILE CREATION TRIGGER ON SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'HR Admin')
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. ENABLE ROW LEVEL SECURITY (RLS) ON ALL TABLES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Departments Table" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payslips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_benefits ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- 6. PERMISSIVE RLS POLICIES (TO public: resolves all Error 42501 for all roles)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- EMPLOYEES TABLE POLICIES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated users can manage employees" ON public.employees;
DROP POLICY IF EXISTS "Allow authenticated insert on employees" ON public.employees;
DROP POLICY IF EXISTS "Allow authenticated select on employees" ON public.employees;
DROP POLICY IF EXISTS "Allow authenticated update on employees" ON public.employees;
DROP POLICY IF EXISTS "Allow authenticated delete on employees" ON public.employees;
DROP POLICY IF EXISTS "Allow public insert on employees" ON public.employees;
DROP POLICY IF EXISTS "Allow public select on employees" ON public.employees;
DROP POLICY IF EXISTS "Allow public update on employees" ON public.employees;
DROP POLICY IF EXISTS "Allow public delete on employees" ON public.employees;

CREATE POLICY "Allow public insert on employees"
  ON public.employees FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Allow public select on employees"
  ON public.employees FOR SELECT TO public USING (true);

CREATE POLICY "Allow public update on employees"
  ON public.employees FOR UPDATE TO public USING (true) WITH CHECK (true);

CREATE POLICY "Allow public delete on employees"
  ON public.employees FOR DELETE TO public USING (true);

-- ------------------------------------------------------------------------------
-- DEPARTMENTS TABLE POLICIES (Resolves error 42501 on department operations)
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated users can manage departments" ON public."Departments Table";
DROP POLICY IF EXISTS "Allow authenticated insert on departments" ON public."Departments Table";
DROP POLICY IF EXISTS "Allow authenticated select on departments" ON public."Departments Table";
DROP POLICY IF EXISTS "Allow authenticated update on departments" ON public."Departments Table";
DROP POLICY IF EXISTS "Allow authenticated delete on departments" ON public."Departments Table";
DROP POLICY IF EXISTS "Allow public insert on departments" ON public."Departments Table";
DROP POLICY IF EXISTS "Allow public select on departments" ON public."Departments Table";
DROP POLICY IF EXISTS "Allow public update on departments" ON public."Departments Table";
DROP POLICY IF EXISTS "Allow public delete on departments" ON public."Departments Table";

CREATE POLICY "Allow public insert on departments"
  ON public."Departments Table" FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Allow public select on departments"
  ON public."Departments Table" FOR SELECT TO public USING (true);

CREATE POLICY "Allow public update on departments"
  ON public."Departments Table" FOR UPDATE TO public USING (true) WITH CHECK (true);

CREATE POLICY "Allow public delete on departments"
  ON public."Departments Table" FOR DELETE TO public USING (true);

-- ------------------------------------------------------------------------------
-- PROFILES TABLE POLICIES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated users can manage profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow authenticated insert on profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow authenticated select on profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow authenticated update on profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow public insert on profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow public select on profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow public update on profiles" ON public.profiles;

CREATE POLICY "Allow public insert on profiles"
  ON public.profiles FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Allow public select on profiles"
  ON public.profiles FOR SELECT TO public USING (true);

CREATE POLICY "Allow public update on profiles"
  ON public.profiles FOR UPDATE TO public USING (true) WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- ATTENDANCE TABLE POLICIES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated users can manage attendance" ON public.attendance;
DROP POLICY IF EXISTS "Allow authenticated insert on attendance" ON public.attendance;
DROP POLICY IF EXISTS "Allow authenticated select on attendance" ON public.attendance;
DROP POLICY IF EXISTS "Allow authenticated update on attendance" ON public.attendance;
DROP POLICY IF EXISTS "Allow authenticated delete on attendance" ON public.attendance;
DROP POLICY IF EXISTS "Allow public insert on attendance" ON public.attendance;
DROP POLICY IF EXISTS "Allow public select on attendance" ON public.attendance;
DROP POLICY IF EXISTS "Allow public update on attendance" ON public.attendance;
DROP POLICY IF EXISTS "Allow public delete on attendance" ON public.attendance;

CREATE POLICY "Allow public insert on attendance"
  ON public.attendance FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Allow public select on attendance"
  ON public.attendance FOR SELECT TO public USING (true);

CREATE POLICY "Allow public update on attendance"
  ON public.attendance FOR UPDATE TO public USING (true) WITH CHECK (true);

CREATE POLICY "Allow public delete on attendance"
  ON public.attendance FOR DELETE TO public USING (true);

-- ------------------------------------------------------------------------------
-- LEAVES TABLE POLICIES (TWO-LEVEL APPROVAL WORKFLOW)
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated users can manage leaves" ON public.leaves;
DROP POLICY IF EXISTS "Allow authenticated insert on leaves" ON public.leaves;
DROP POLICY IF EXISTS "Allow authenticated select on leaves" ON public.leaves;
DROP POLICY IF EXISTS "Allow authenticated update on leaves" ON public.leaves;
DROP POLICY IF EXISTS "Allow authenticated delete on leaves" ON public.leaves;
DROP POLICY IF EXISTS "Allow public insert on leaves" ON public.leaves;
DROP POLICY IF EXISTS "Allow public select on leaves" ON public.leaves;
DROP POLICY IF EXISTS "Allow public update on leaves" ON public.leaves;
DROP POLICY IF EXISTS "Allow public delete on leaves" ON public.leaves;

CREATE POLICY "Allow public insert on leaves"
  ON public.leaves FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Allow public select on leaves"
  ON public.leaves FOR SELECT TO public USING (true);

CREATE POLICY "Allow public update on leaves"
  ON public.leaves FOR UPDATE TO public USING (true) WITH CHECK (true);

CREATE POLICY "Allow public delete on leaves"
  ON public.leaves FOR DELETE TO public USING (true);

-- ------------------------------------------------------------------------------
-- PAYROLL TABLE POLICIES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated users can manage payroll" ON public.payroll;
DROP POLICY IF EXISTS "Allow authenticated insert on payroll" ON public.payroll;
DROP POLICY IF EXISTS "Allow authenticated select on payroll" ON public.payroll;
DROP POLICY IF EXISTS "Allow authenticated update on payroll" ON public.payroll;
DROP POLICY IF EXISTS "Allow authenticated delete on payroll" ON public.payroll;
DROP POLICY IF EXISTS "Allow public insert on payroll" ON public.payroll;
DROP POLICY IF EXISTS "Allow public select on payroll" ON public.payroll;
DROP POLICY IF EXISTS "Allow public update on payroll" ON public.payroll;
DROP POLICY IF EXISTS "Allow public delete on payroll" ON public.payroll;

CREATE POLICY "Allow public insert on payroll"
  ON public.payroll FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Allow public select on payroll"
  ON public.payroll FOR SELECT TO public USING (true);

CREATE POLICY "Allow public update on payroll"
  ON public.payroll FOR UPDATE TO public USING (true) WITH CHECK (true);

CREATE POLICY "Allow public delete on payroll"
  ON public.payroll FOR DELETE TO public USING (true);

-- ------------------------------------------------------------------------------
-- PAYSLIPS TABLE POLICIES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated users can manage payslips" ON public.payslips;
DROP POLICY IF EXISTS "Allow authenticated insert on payslips" ON public.payslips;
DROP POLICY IF EXISTS "Allow authenticated select on payslips" ON public.payslips;
DROP POLICY IF EXISTS "Allow authenticated update on payslips" ON public.payslips;
DROP POLICY IF EXISTS "Allow authenticated delete on payslips" ON public.payslips;
DROP POLICY IF EXISTS "Allow public insert on payslips" ON public.payslips;
DROP POLICY IF EXISTS "Allow public select on payslips" ON public.payslips;
DROP POLICY IF EXISTS "Allow public update on payslips" ON public.payslips;
DROP POLICY IF EXISTS "Allow public delete on payslips" ON public.payslips;

CREATE POLICY "Allow public insert on payslips"
  ON public.payslips FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Allow public select on payslips"
  ON public.payslips FOR SELECT TO public USING (true);

CREATE POLICY "Allow public update on payslips"
  ON public.payslips FOR UPDATE TO public USING (true) WITH CHECK (true);

CREATE POLICY "Allow public delete on payslips"
  ON public.payslips FOR DELETE TO public USING (true);

-- ------------------------------------------------------------------------------
-- ROLE BENEFITS TABLE POLICIES (Role-based leave quotas and benefits)
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated users can manage role_benefits" ON public.role_benefits;
DROP POLICY IF EXISTS "Allow authenticated insert on role_benefits" ON public.role_benefits;
DROP POLICY IF EXISTS "Allow authenticated select on role_benefits" ON public.role_benefits;
DROP POLICY IF EXISTS "Allow authenticated update on role_benefits" ON public.role_benefits;
DROP POLICY IF EXISTS "Allow authenticated delete on role_benefits" ON public.role_benefits;
DROP POLICY IF EXISTS "Allow public insert on role_benefits" ON public.role_benefits;
DROP POLICY IF EXISTS "Allow public select on role_benefits" ON public.role_benefits;
DROP POLICY IF EXISTS "Allow public update on role_benefits" ON public.role_benefits;
DROP POLICY IF EXISTS "Allow public delete on role_benefits" ON public.role_benefits;

CREATE POLICY "Allow public insert on role_benefits"
  ON public.role_benefits FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Allow public select on role_benefits"
  ON public.role_benefits FOR SELECT TO public USING (true);

CREATE POLICY "Allow public update on role_benefits"
  ON public.role_benefits FOR UPDATE TO public USING (true) WITH CHECK (true);

CREATE POLICY "Allow public delete on role_benefits"
  ON public.role_benefits FOR DELETE TO public USING (true);
