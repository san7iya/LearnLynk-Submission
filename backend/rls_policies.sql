-- Supporting Tables for RLS Policies --
CREATE TABLE IF not exists users (
  id uuid primary key,
  tenant_id uuid not null,
  role text not null
);

CREATE TABLE IF not exists teams (
  id uuid primary key,
  tenant_id uuid not null
);

CREATE TABLE IF not exists user_teams (
  user_id uuid not null,
  team_id uuid not null
);

-- 1. Enable RLS on leads --
ALTER TABLE leads enable row level security;

-- 2. Write a SELECT policy enforcing the rules above --
CREATE POLICY "Admins can see all leads belonging to their tenant" 
ON leads
for SELECT 
USING (
    auth.jwt() ->> 'role' = 'admin'
    AND tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
);

CREATE POLICY "Counselors can see leads they own"
ON leads
for SELECT
USING (
  auth.jwt() ->> 'role' = 'counselor'
  AND owner_id = (auth.jwt() ->> 'user_id')::uuid
  AND tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
);

CREATE POLICY "Counselors can see team leads"
ON leads
for SELECT
USING (
  auth.jwt() ->> 'role' = 'counselor'
  AND tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  AND owner_id IN (
    SELECT user_id
    FROM user_teams
    WHERE team_id IN (
      SELECT team_id
      FROM user_teams
      WHERE user_id = (auth.jwt() ->> 'user_id')::uuid
    )
  )
);

-- 3. Write an INSERT policy that allows counselors/admins to add leads under their tenant --
CREATE POLICY "Admins/counselors can add leads under their tenant"
ON leads
FOR INSERT
WITH CHECK (
  tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  AND (
    auth.jwt() ->> 'role' = 'admin'
    OR owner_id = (auth.jwt() ->> 'user_id')::uuid
  )
);