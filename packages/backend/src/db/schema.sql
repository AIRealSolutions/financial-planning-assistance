-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enum types
CREATE TYPE user_role AS ENUM ('super_admin', 'advisor', 'associate_advisor', 'admin_staff', 'marketing_manager', 'client');
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended');
CREATE TYPE client_status AS ENUM ('prospect', 'active', 'dormant', 'lost', 'closed');
CREATE TYPE interaction_type AS ENUM ('call', 'email', 'meeting', 'note', 'document');
CREATE TYPE meeting_type AS ENUM ('review', 'planning', 'prospecting', 'onboarding', 'rebalancing', 'general');
CREATE TYPE meeting_status AS ENUM ('scheduled', 'completed', 'cancelled', 'no_show', 'rescheduled');
CREATE TYPE plan_type AS ENUM ('retirement', 'education', 'general', 'estate', 'tax');
CREATE TYPE plan_status AS ENUM ('draft', 'presented', 'active', 'completed', 'archived');
CREATE TYPE campaign_type AS ENUM ('email', 'sms', 'content', 'event', 'webinar');
CREATE TYPE campaign_status AS ENUM ('draft', 'scheduled', 'active', 'completed', 'paused', 'failed');
CREATE TYPE document_type AS ENUM ('agreement', 'disclosure', 'plan', 'report', 'financial_statement', 'correspondence', 'other');
CREATE TYPE document_status AS ENUM ('draft', 'final', 'signed', 'archived');
CREATE TYPE task_status AS ENUM ('open', 'in_progress', 'completed', 'cancelled');
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');

-- Organizations (multi-tenancy support)
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(2),
  zip_code VARCHAR(10),
  website VARCHAR(255),
  logo_url VARCHAR(500),
  subscription_tier VARCHAR(50) DEFAULT 'professional',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(name, email)
);

-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(20),
  title VARCHAR(100),
  role user_role NOT NULL DEFAULT 'advisor',
  status user_status NOT NULL DEFAULT 'active',
  avatar_url VARCHAR(500),
  bio TEXT,
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  two_factor_secret VARCHAR(255),
  last_login TIMESTAMP,
  password_reset_token VARCHAR(255),
  password_reset_expires TIMESTAMP,
  email_verified BOOLEAN DEFAULT FALSE,
  email_verification_token VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(organization_id, email)
);

CREATE INDEX idx_users_org ON users(organization_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);

-- Clients
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  advisor_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  email VARCHAR(255),
  phone VARCHAR(20),
  full_name VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  date_of_birth DATE,
  gender VARCHAR(20),
  marital_status VARCHAR(50),
  occupation VARCHAR(100),
  household_income DECIMAL(12, 2),
  net_worth DECIMAL(15, 2),
  risk_profile VARCHAR(50),
  investment_experience VARCHAR(50),
  status client_status NOT NULL DEFAULT 'prospect',
  notes TEXT,
  tags TEXT[], -- Array of tags for segmentation
  source_of_introduction VARCHAR(255),
  last_contact_at TIMESTAMP,
  next_review_date DATE,
  annual_fee DECIMAL(10, 2),
  fee_type VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_clients_org_advisor ON clients(organization_id, advisor_id);
CREATE INDEX idx_clients_status ON clients(status);
CREATE INDEX idx_clients_tags ON clients USING GIN(tags);

-- Contact Information (spouse, emergency contacts, etc.)
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  relationship VARCHAR(100),
  email VARCHAR(255),
  phone VARCHAR(20),
  type VARCHAR(50), -- spouse, emergency, beneficiary, etc.
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_contacts_client ON contacts(client_id);

-- Portfolios
CREATE TABLE portfolios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  advisor_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  account_number VARCHAR(50),
  account_type VARCHAR(100), -- Brokerage, IRA, 401k, etc.
  total_value DECIMAL(15, 2) DEFAULT 0,
  cash_position DECIMAL(15, 2) DEFAULT 0,
  performance_ytd DECIMAL(8, 4),
  performance_1y DECIMAL(8, 4),
  performance_3y DECIMAL(8, 4),
  performance_5y DECIMAL(8, 4),
  risk_score DECIMAL(5, 2),
  benchmark VARCHAR(100),
  custodian VARCHAR(100),
  inception_date DATE,
  last_rebalance_date DATE,
  rebalance_frequency VARCHAR(50),
  status VARCHAR(50) DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_portfolios_client ON portfolios(client_id);
CREATE INDEX idx_portfolios_advisor ON portfolios(advisor_id);

-- Asset Allocation
CREATE TABLE asset_allocations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
  asset_class VARCHAR(100),
  target_percentage DECIMAL(5, 2),
  current_percentage DECIMAL(5, 2),
  current_value DECIMAL(15, 2),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_allocations_portfolio ON asset_allocations(portfolio_id);

-- Financial Plans
CREATE TABLE financial_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  advisor_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  plan_type plan_type NOT NULL,
  title VARCHAR(255),
  description TEXT,
  status plan_status NOT NULL DEFAULT 'draft',
  created_by UUID NOT NULL REFERENCES users(id),
  presented_date TIMESTAMP,
  accepted_date TIMESTAMP,
  review_frequency VARCHAR(50), -- annually, quarterly, etc.
  next_review_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_plans_client ON financial_plans(client_id);
CREATE INDEX idx_plans_status ON financial_plans(status);

-- Plan Goals
CREATE TABLE plan_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_id UUID NOT NULL REFERENCES financial_plans(id) ON DELETE CASCADE,
  goal_name VARCHAR(255) NOT NULL,
  description TEXT,
  target_amount DECIMAL(15, 2),
  target_date DATE,
  priority VARCHAR(50),
  status VARCHAR(50) DEFAULT 'pending',
  progress_percentage DECIMAL(5, 2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_goals_plan ON plan_goals(plan_id);

-- Interactions/Activities
CREATE TABLE interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  advisor_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  type interaction_type NOT NULL,
  content TEXT,
  duration_minutes INTEGER,
  outcome VARCHAR(255),
  follow_up_required BOOLEAN DEFAULT FALSE,
  follow_up_date DATE,
  tags TEXT[],
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_interactions_client ON interactions(client_id);
CREATE INDEX idx_interactions_advisor ON interactions(advisor_id);
CREATE INDEX idx_interactions_type ON interactions(type);
CREATE INDEX idx_interactions_created ON interactions(created_at);

-- Meetings/Events
CREATE TABLE meetings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  advisor_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  type meeting_type NOT NULL,
  status meeting_status NOT NULL DEFAULT 'scheduled',
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  duration_minutes INTEGER,
  location VARCHAR(500),
  video_link VARCHAR(500),
  is_virtual BOOLEAN DEFAULT FALSE,
  timezone VARCHAR(100),
  calendar_event_id VARCHAR(500),
  notes TEXT,
  attendees TEXT[], -- JSON array of attendee info
  completed_at TIMESTAMP,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_meetings_advisor ON meetings(advisor_id);
CREATE INDEX idx_meetings_client ON meetings(client_id);
CREATE INDEX idx_meetings_time ON meetings(start_time);
CREATE INDEX idx_meetings_status ON meetings(status);

-- Meeting Notes
CREATE TABLE meeting_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_ai_generated BOOLEAN DEFAULT FALSE,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Meeting Action Items
CREATE TABLE meeting_action_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  description VARCHAR(500) NOT NULL,
  assigned_to UUID REFERENCES users(id),
  due_date DATE,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Campaigns
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  advisor_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  campaign_type campaign_type NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  segment_id UUID REFERENCES client_segments(id),
  template_id UUID,
  status campaign_status NOT NULL DEFAULT 'draft',
  subject_line VARCHAR(500),
  content TEXT,
  send_date TIMESTAMP,
  scheduled_at TIMESTAMP,
  sent_at TIMESTAMP,
  total_recipients INTEGER,
  total_sent INTEGER,
  open_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  conversion_count INTEGER DEFAULT 0,
  unsubscribe_count INTEGER DEFAULT 0,
  bounce_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_campaigns_org ON campaigns(organization_id);
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_created ON campaigns(created_at);

-- Client Segments
CREATE TABLE client_segments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  advisor_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  criteria JSONB,
  client_count INTEGER DEFAULT 0,
  is_dynamic BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_segments_org ON client_segments(organization_id);

-- Campaign Recipients (tracking)
CREATE TABLE campaign_recipients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  email VARCHAR(255),
  status VARCHAR(50),
  sent_at TIMESTAMP,
  opened_at TIMESTAMP,
  clicked_at TIMESTAMP,
  bounced_at TIMESTAMP,
  unsubscribed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_recipients_campaign ON campaign_recipients(campaign_id);
CREATE INDEX idx_recipients_client ON campaign_recipients(client_id);

-- Documents
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  advisor_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  document_type document_type NOT NULL,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  file_url VARCHAR(1000),
  file_size BIGINT,
  file_type VARCHAR(50),
  status document_status NOT NULL DEFAULT 'draft',
  is_signed BOOLEAN DEFAULT FALSE,
  signed_by UUID REFERENCES users(id),
  signed_at TIMESTAMP,
  signature_status VARCHAR(50),
  expires_at DATE,
  version INTEGER DEFAULT 1,
  parent_document_id UUID REFERENCES documents(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_documents_client ON documents(client_id);
CREATE INDEX idx_documents_status ON documents(status);

-- Administrative Tasks
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  assigned_to UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  priority task_priority NOT NULL DEFAULT 'medium',
  status task_status NOT NULL DEFAULT 'open',
  due_date DATE,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);

-- Audit Logs
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  resource_type VARCHAR(100),
  resource_id UUID,
  action VARCHAR(50),
  changes JSONB,
  ip_address VARCHAR(50),
  user_agent VARCHAR(500),
  timestamp TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_org ON audit_logs(organization_id);
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_timestamp ON audit_logs(timestamp);

-- Add the segment_id constraint after client_segments table exists
ALTER TABLE campaigns ADD CONSTRAINT fk_campaign_segment
  FOREIGN KEY (segment_id) REFERENCES client_segments(id) ON DELETE SET NULL;

-- Session/Token Management
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(500) NOT NULL,
  refresh_token VARCHAR(500),
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(token)
);

CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_organizations_timestamp BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_users_timestamp BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_clients_timestamp BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_contacts_timestamp BEFORE UPDATE ON contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_portfolios_timestamp BEFORE UPDATE ON portfolios
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_allocations_timestamp BEFORE UPDATE ON asset_allocations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_plans_timestamp BEFORE UPDATE ON financial_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_goals_timestamp BEFORE UPDATE ON plan_goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_interactions_timestamp BEFORE UPDATE ON interactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_meetings_timestamp BEFORE UPDATE ON meetings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_meeting_notes_timestamp BEFORE UPDATE ON meeting_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_campaigns_timestamp BEFORE UPDATE ON campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_segments_timestamp BEFORE UPDATE ON client_segments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_documents_timestamp BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_tasks_timestamp BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
