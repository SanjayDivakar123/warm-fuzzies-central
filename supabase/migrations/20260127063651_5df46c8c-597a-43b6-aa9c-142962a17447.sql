-- Add new admin roles to company_user_role enum
ALTER TYPE company_user_role ADD VALUE IF NOT EXISTS 'hr';
ALTER TYPE company_user_role ADD VALUE IF NOT EXISTS 'partner';