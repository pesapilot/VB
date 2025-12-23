-- Wise Village Banking Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROFILES (extends Supabase auth.users)
-- ============================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  role TEXT DEFAULT 'member' CHECK (role IN ('member', 'group_admin', 'admin', 'treasurer')),
  join_date DATE DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- MEMBERS (for non-auth village members)
-- ============================================
CREATE TABLE members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  national_id TEXT,
  address TEXT,
  join_date DATE DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SAVINGS
-- ============================================
CREATE TABLE savings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL,
  deposit_date DATE NOT NULL,
  month_year TEXT NOT NULL, -- Format: '2024-01'
  status TEXT DEFAULT 'completed' CHECK (status IN ('completed', 'pending', 'late')),
  notes TEXT,
  recorded_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- LOANS
-- ============================================
CREATE TABLE loans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  principal_amount DECIMAL(12,2) NOT NULL,
  interest_rate DECIMAL(5,2) NOT NULL DEFAULT 10.00, -- percentage
  total_amount DECIMAL(12,2) NOT NULL, -- principal + interest
  disbursement_date DATE,
  due_date DATE,
  duration_months INTEGER NOT NULL DEFAULT 3,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'disbursed', 'repaying', 'completed', 'defaulted', 'rejected')),
  purpose TEXT,
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- LOAN REPAYMENTS
-- ============================================
CREATE TABLE loan_repayments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  loan_id UUID NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL,
  payment_date DATE NOT NULL,
  month_year TEXT NOT NULL,
  is_late BOOLEAN DEFAULT FALSE,
  notes TEXT,
  recorded_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SOCIAL FUND
-- ============================================
CREATE TABLE social_fund (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('contribution', 'withdrawal')),
  transaction_date DATE NOT NULL,
  month_year TEXT NOT NULL,
  purpose TEXT, -- for withdrawals
  status TEXT DEFAULT 'completed' CHECK (status IN ('completed', 'pending', 'approved', 'rejected')),
  approved_by UUID REFERENCES profiles(id),
  recorded_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PENALTIES
-- ============================================
CREATE TABLE penalties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  loan_id UUID REFERENCES loans(id) ON DELETE SET NULL,
  amount DECIMAL(12,2) NOT NULL,
  penalty_type TEXT NOT NULL CHECK (penalty_type IN ('late_deposit', 'late_repayment', 'default', 'other')),
  reason TEXT,
  penalty_date DATE NOT NULL,
  status TEXT DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'paid', 'waived')),
  paid_date DATE,
  recorded_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- GROUP SETTINGS
-- ============================================
CREATE TABLE group_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES profiles(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default settings
INSERT INTO group_settings (setting_key, setting_value, description) VALUES
  ('interest_rate', '10', 'Default loan interest rate (%)'),
  ('max_loan_multiplier', '3', 'Maximum loan = savings × this multiplier'),
  ('late_deposit_penalty', '500', 'Penalty for late savings deposit'),
  ('late_repayment_penalty_percent', '5', 'Penalty % for late loan repayment'),
  ('monthly_savings_amount', '1000', 'Required monthly savings amount'),
  ('social_fund_amount', '200', 'Required monthly social fund contribution'),
  ('loan_duration_months', '3', 'Default loan duration in months'),
  ('currency', 'KES', 'Currency code');

-- ============================================
-- AUDIT LOG
-- ============================================
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  old_data JSONB,
  new_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- NOTIFICATIONS
-- ============================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  member_id UUID REFERENCES members(id),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT CHECK (type IN ('reminder', 'alert', 'info', 'approval')),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- VIEWS FOR REPORTING
-- ============================================

-- Member Summary View
CREATE OR REPLACE VIEW member_summary AS
SELECT 
  m.id,
  m.full_name,
  m.phone,
  m.status,
  m.join_date,
  COALESCE(SUM(s.amount), 0) as total_savings,
  COALESCE((
    SELECT SUM(l.total_amount - COALESCE(paid.total_paid, 0))
    FROM loans l
    LEFT JOIN (
      SELECT loan_id, SUM(amount) as total_paid 
      FROM loan_repayments 
      GROUP BY loan_id
    ) paid ON l.id = paid.loan_id
    WHERE l.member_id = m.id AND l.status IN ('disbursed', 'repaying')
  ), 0) as outstanding_loans,
  COALESCE((
    SELECT SUM(amount) FROM penalties 
    WHERE member_id = m.id AND status = 'unpaid'
  ), 0) as unpaid_penalties,
  COALESCE((
    SELECT SUM(CASE WHEN transaction_type = 'contribution' THEN amount ELSE -amount END)
    FROM social_fund WHERE member_id = m.id AND status = 'completed'
  ), 0) as social_fund_balance
FROM members m
LEFT JOIN savings s ON m.id = s.member_id AND s.status = 'completed'
GROUP BY m.id;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings ENABLE ROW LEVEL SECURITY;
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE loan_repayments ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_fund ENABLE ROW LEVEL SECURITY;
ALTER TABLE penalties ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Policies for members (admins can do everything, members can view)
CREATE POLICY "Anyone can view members" ON members FOR SELECT USING (true);
CREATE POLICY "Admins can insert members" ON members FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'group_admin', 'treasurer'))
);
CREATE POLICY "Admins can update members" ON members FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'group_admin', 'treasurer'))
);

-- Policies for financial tables (view all, admins modify)
CREATE POLICY "Anyone can view savings" ON savings FOR SELECT USING (true);
CREATE POLICY "Admins can manage savings" ON savings FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'group_admin', 'treasurer'))
);

CREATE POLICY "Anyone can view loans" ON loans FOR SELECT USING (true);
CREATE POLICY "Admins can manage loans" ON loans FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'group_admin', 'treasurer'))
);

CREATE POLICY "Anyone can view repayments" ON loan_repayments FOR SELECT USING (true);
CREATE POLICY "Admins can manage repayments" ON loan_repayments FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'group_admin', 'treasurer'))
);

CREATE POLICY "Anyone can view social fund" ON social_fund FOR SELECT USING (true);
CREATE POLICY "Admins can manage social fund" ON social_fund FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'group_admin', 'treasurer'))
);

CREATE POLICY "Anyone can view penalties" ON penalties FOR SELECT USING (true);
CREATE POLICY "Admins can manage penalties" ON penalties FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'group_admin', 'treasurer'))
);

CREATE POLICY "Anyone can view settings" ON group_settings FOR SELECT USING (true);
CREATE POLICY "Admins can manage settings" ON group_settings FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'group_admin'))
);

CREATE POLICY "Admins can view audit log" ON audit_log FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'group_admin'))
);

CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (
  user_id = auth.uid() OR 
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'group_admin', 'treasurer'))
);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, role)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), 'member');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_members_updated_at BEFORE UPDATE ON members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_loans_updated_at BEFORE UPDATE ON loans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
