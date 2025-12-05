-- leads table --
CREATE TABLE leads (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  owner_id uuid,
  stage text
);

CREATE INDEX idx_leads_tenant_id ON leads (tenant_id);
CREATE INDEX idx_leads_owner_id ON leads (owner_id);
CREATE INDEX idx_leads_stage ON leads (stage);
CREATE INDEX idx_leads_created_at ON leads (created_at);

-- applications table --
CREATE TABLE applications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  lead_id uuid NOT NULL REFERENCES leads(id)
);

CREATE INDEX idx_app_tenant_id ON applications (tenant_id);
CREATE INDEX idx_app_lead_id ON applications (lead_id);

-- tasks table --
CREATE TABLE tasks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  application_id uuid NOT NULL REFERENCES applications(id),  -- UPDATED
  type text NOT NULL CHECK (type IN ('call', 'email', 'review')),
  status text DEFAULT 'pending',
  due_at timestamptz NOT NULL CHECK (due_at >= created_at)
);

CREATE INDEX idx_tasks_tenant_id ON tasks (tenant_id);
CREATE INDEX idx_tasks_due_at ON tasks (due_at);
CREATE INDEX idx_tasks_status ON tasks (status);
