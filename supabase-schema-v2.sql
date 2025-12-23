-- Wise Village Banking Database Schema v2
-- Multi-Group Platform with 3-Tier Access Control
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROFILES (extends Supabase auth.users)
-- Platform-level user accounts
-- ============================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  avatar_url TEXT,
  -- Platform-level role: super_admin has full platform access, member is default
  platform_role TEXT DEFAULT 'member' CHECK (platform_role IN ('super_admin', 'member')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- GROUPS (Village Banking Groups)
-- Each group operates independently
-- ============================================
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  location TEXT,
  logo_url TEXT,
  -- Group status: pending requires super_admin approval
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended', 'closed')),
  created_by UUID NOT NULL REFERENCES profiles(id),
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- GROUP MEMBERSHIPS
-- Links users to groups with their role in that group
-- ============================================
CREATE TABLE group_memberships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  -- Role within the group
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'treasurer', 'secretary', 'member')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- ============================================
-- MEMBERS (Village group members - may not have app accounts)
-- These are the actual village banking participants
-- ============================================
CREATE TABLE members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  -- Optional link to app user account
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  national_id TEXT,
  address TEXT,
  join_date DATE DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'exited')),
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- GROUP SETTINGS
-- Each group has its own settings
-- ============================================
CREATE TABLE group_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  setting_key TEXT NOT NULL,
  setting_value TEXT NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES profiles(id),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, setting_key)
);

-- ============================================
-- SAVINGS
-- ============================================
CREATE TABLE savings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL,
  deposit_date DATE NOT NULL,
  month_year TEXT NOT NULL,
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
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  principal_amount DECIMAL(12,2) NOT NULL,
  interest_rate DECIMAL(5,2) NOT NULL DEFAULT 10.00,
  total_amount DECIMAL(12,2) NOT NULL,
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
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
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
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('contribution', 'withdrawal')),
  transaction_date DATE NOT NULL,
  month_year TEXT NOT NULL,
  purpose TEXT,
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
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
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
-- AUDIT LOG
-- ============================================
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
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
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  member_id UUID REFERENCES members(id),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT CHECK (type IN ('reminder', 'alert', 'info', 'approval', 'group_request')),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- GROUP CREATION REQUESTS
-- For tracking group approval workflow
-- ============================================
CREATE TABLE group_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL REFERENCES profiles(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Check if user is super admin
CREATE OR REPLACE FUNCTION is_super_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = user_id AND platform_role = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is admin of a specific group
CREATE OR REPLACE FUNCTION is_group_admin(user_id UUID, grp_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM group_memberships 
    WHERE group_memberships.user_id = is_group_admin.user_id 
    AND group_id = grp_id 
    AND role = 'admin'
    AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user can manage a group (admin or treasurer)
CREATE OR REPLACE FUNCTION can_manage_group(user_id UUID, grp_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN is_super_admin(user_id) OR EXISTS (
    SELECT 1 FROM group_memberships 
    WHERE group_memberships.user_id = can_manage_group.user_id 
    AND group_id = grp_id 
    AND role IN ('admin', 'treasurer')
    AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is member of a group
CREATE OR REPLACE FUNCTION is_group_member(user_id UUID, grp_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN is_super_admin(user_id) OR EXISTS (
    SELECT 1 FROM group_memberships 
    WHERE group_memberships.user_id = is_group_member.user_id 
    AND group_id = grp_id 
    AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings ENABLE ROW LEVEL SECURITY;
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE loan_repayments ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_fund ENABLE ROW LEVEL SECURITY;
ALTER TABLE penalties ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_requests ENABLE ROW LEVEL SECURITY;

-- PROFILES policies
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Super admins can update any profile" ON profiles FOR UPDATE USING (is_super_admin(auth.uid()));

-- GROUPS policies
CREATE POLICY "Anyone can view active groups" ON groups FOR SELECT USING (
  status = 'active' OR 
  created_by = auth.uid() OR 
  is_super_admin(auth.uid()) OR
  is_group_member(auth.uid(), id)
);
CREATE POLICY "Authenticated users can create groups" ON groups FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Group admins can update their groups" ON groups FOR UPDATE USING (
  is_super_admin(auth.uid()) OR is_group_admin(auth.uid(), id)
);
CREATE POLICY "Super admins can delete groups" ON groups FOR DELETE USING (is_super_admin(auth.uid()));

-- GROUP MEMBERSHIPS policies
CREATE POLICY "Members can view group memberships" ON group_memberships FOR SELECT USING (
  is_super_admin(auth.uid()) OR is_group_member(auth.uid(), group_id)
);
CREATE POLICY "Group admins can manage memberships" ON group_memberships FOR ALL USING (
  is_super_admin(auth.uid()) OR is_group_admin(auth.uid(), group_id)
);

-- MEMBERS policies
CREATE POLICY "Group members can view members" ON members FOR SELECT USING (
  is_super_admin(auth.uid()) OR is_group_member(auth.uid(), group_id)
);
CREATE POLICY "Group managers can manage members" ON members FOR ALL USING (
  is_super_admin(auth.uid()) OR can_manage_group(auth.uid(), group_id)
);

-- GROUP SETTINGS policies
CREATE POLICY "Group members can view settings" ON group_settings FOR SELECT USING (
  is_super_admin(auth.uid()) OR is_group_member(auth.uid(), group_id)
);
CREATE POLICY "Group admins can manage settings" ON group_settings FOR ALL USING (
  is_super_admin(auth.uid()) OR is_group_admin(auth.uid(), group_id)
);

-- SAVINGS policies
CREATE POLICY "Group members can view savings" ON savings FOR SELECT USING (
  is_super_admin(auth.uid()) OR is_group_member(auth.uid(), group_id)
);
CREATE POLICY "Group managers can manage savings" ON savings FOR ALL USING (
  is_super_admin(auth.uid()) OR can_manage_group(auth.uid(), group_id)
);

-- LOANS policies
CREATE POLICY "Group members can view loans" ON loans FOR SELECT USING (
  is_super_admin(auth.uid()) OR is_group_member(auth.uid(), group_id)
);
CREATE POLICY "Group managers can manage loans" ON loans FOR ALL USING (
  is_super_admin(auth.uid()) OR can_manage_group(auth.uid(), group_id)
);

-- LOAN REPAYMENTS policies
CREATE POLICY "Group members can view repayments" ON loan_repayments FOR SELECT USING (
  is_super_admin(auth.uid()) OR is_group_member(auth.uid(), group_id)
);
CREATE POLICY "Group managers can manage repayments" ON loan_repayments FOR ALL USING (
  is_super_admin(auth.uid()) OR can_manage_group(auth.uid(), group_id)
);

-- SOCIAL FUND policies
CREATE POLICY "Group members can view social fund" ON social_fund FOR SELECT USING (
  is_super_admin(auth.uid()) OR is_group_member(auth.uid(), group_id)
);
CREATE POLICY "Group managers can manage social fund" ON social_fund FOR ALL USING (
  is_super_admin(auth.uid()) OR can_manage_group(auth.uid(), group_id)
);

-- PENALTIES policies
CREATE POLICY "Group members can view penalties" ON penalties FOR SELECT USING (
  is_super_admin(auth.uid()) OR is_group_member(auth.uid(), group_id)
);
CREATE POLICY "Group managers can manage penalties" ON penalties FOR ALL USING (
  is_super_admin(auth.uid()) OR can_manage_group(auth.uid(), group_id)
);

-- AUDIT LOG policies
CREATE POLICY "Group admins can view audit log" ON audit_log FOR SELECT USING (
  is_super_admin(auth.uid()) OR 
  (group_id IS NOT NULL AND is_group_admin(auth.uid(), group_id))
);
CREATE POLICY "System can insert audit log" ON audit_log FOR INSERT WITH CHECK (true);

-- NOTIFICATIONS policies
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (
  user_id = auth.uid() OR 
  is_super_admin(auth.uid()) OR
  (group_id IS NOT NULL AND is_group_admin(auth.uid(), group_id))
);
CREATE POLICY "System can manage notifications" ON notifications FOR ALL USING (
  is_super_admin(auth.uid()) OR
  (group_id IS NOT NULL AND can_manage_group(auth.uid(), group_id))
);

-- GROUP REQUESTS policies
CREATE POLICY "Users can view own requests" ON group_requests FOR SELECT USING (
  requested_by = auth.uid() OR is_super_admin(auth.uid())
);
CREATE POLICY "Users can create requests" ON group_requests FOR INSERT WITH CHECK (
  requested_by = auth.uid()
);
CREATE POLICY "Super admins can manage requests" ON group_requests FOR UPDATE USING (
  is_super_admin(auth.uid())
);

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, email, platform_role)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)), 
    NEW.email,
    'member'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Auto-add creator as group admin when group is created
CREATE OR REPLACE FUNCTION handle_new_group()
RETURNS TRIGGER AS $$
BEGIN
  -- Add creator as group admin
  INSERT INTO group_memberships (group_id, user_id, role, status)
  VALUES (NEW.id, NEW.created_by, 'admin', 'active');
  
  -- Create default settings for the group
  INSERT INTO group_settings (group_id, setting_key, setting_value, description) VALUES
    (NEW.id, 'interest_rate', '10', 'Default loan interest rate (%)'),
    (NEW.id, 'max_loan_multiplier', '3', 'Maximum loan = savings × this multiplier'),
    (NEW.id, 'late_deposit_penalty', '500', 'Penalty for late savings deposit'),
    (NEW.id, 'late_repayment_penalty_percent', '5', 'Penalty % for late loan repayment'),
    (NEW.id, 'monthly_savings_amount', '1000', 'Required monthly savings amount'),
    (NEW.id, 'social_fund_amount', '200', 'Required monthly social fund contribution'),
    (NEW.id, 'loan_duration_months', '3', 'Default loan duration in months'),
    (NEW.id, 'currency', 'KES', 'Currency code');
  
  -- Create approval request
  INSERT INTO group_requests (group_id, requested_by, status)
  VALUES (NEW.id, NEW.created_by, 'pending');
  
  -- Notify super admins
  INSERT INTO notifications (user_id, title, message, type)
  SELECT id, 'New Group Request', 'A new group "' || NEW.name || '" is awaiting approval.', 'group_request'
  FROM profiles WHERE platform_role = 'super_admin';
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_group_created
  AFTER INSERT ON groups
  FOR EACH ROW EXECUTE FUNCTION handle_new_group();

-- Auto-approve group when super admin approves
CREATE OR REPLACE FUNCTION handle_group_approval()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' AND OLD.status = 'pending' THEN
    UPDATE groups SET 
      status = 'active',
      approved_by = NEW.reviewed_by,
      approved_at = NOW()
    WHERE id = NEW.group_id;
    
    -- Notify group creator
    INSERT INTO notifications (user_id, group_id, title, message, type)
    VALUES (
      (SELECT created_by FROM groups WHERE id = NEW.group_id),
      NEW.group_id,
      'Group Approved',
      'Your group has been approved and is now active!',
      'info'
    );
  ELSIF NEW.status = 'rejected' AND OLD.status = 'pending' THEN
    UPDATE groups SET status = 'suspended' WHERE id = NEW.group_id;
    
    -- Notify group creator
    INSERT INTO notifications (user_id, group_id, title, message, type)
    VALUES (
      (SELECT created_by FROM groups WHERE id = NEW.group_id),
      NEW.group_id,
      'Group Request Rejected',
      COALESCE('Your group request was rejected. Reason: ' || NEW.admin_notes, 'Your group request was rejected.'),
      'alert'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_group_request_update
  AFTER UPDATE ON group_requests
  FOR EACH ROW EXECUTE FUNCTION handle_group_approval();

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

CREATE TRIGGER update_groups_updated_at BEFORE UPDATE ON groups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_members_updated_at BEFORE UPDATE ON members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_loans_updated_at BEFORE UPDATE ON loans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- VIEWS
-- ============================================

-- Member Summary View (group-scoped)
CREATE OR REPLACE VIEW member_summary AS
SELECT 
  m.id,
  m.group_id,
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

-- User's groups view
CREATE OR REPLACE VIEW my_groups AS
SELECT 
  g.*,
  gm.role as my_role,
  gm.joined_at,
  (SELECT COUNT(*) FROM members WHERE group_id = g.id AND status = 'active') as member_count
FROM groups g
JOIN group_memberships gm ON g.id = gm.group_id
WHERE gm.user_id = auth.uid() AND gm.status = 'active' AND g.status = 'active';

-- ============================================
-- SEED DATA (Optional - for first super admin)
-- ============================================
-- After running this schema, manually update the first user to be super_admin:
-- UPDATE profiles SET platform_role = 'super_admin' WHERE email = 'your-admin@email.com';
