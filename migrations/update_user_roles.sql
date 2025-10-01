-- Migration: Update Users table to support new staff roles
-- Date: 2025-09-30
-- Description: Add support for roles T (Cashier), H (Package Handler), D (Transfer Personnel), F (Front Desk)

BEGIN;

-- Drop the old CHECK constraint
ALTER TABLE Users DROP CONSTRAINT IF EXISTS users_role_check;

-- Add new CHECK constraint with all roles
ALTER TABLE Users ADD CONSTRAINT users_role_check
CHECK (role IN ('C', 'A', 'S', 'T', 'H', 'D', 'F'));

-- Verify the constraint was added
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'users'::regclass AND conname = 'users_role_check';

COMMIT;

-- Test queries (optional - to verify it works)
-- These should all return TRUE:
SELECT 'C'::text IN ('C', 'A', 'S', 'T', 'H', 'D', 'F') as customer_valid;
SELECT 'A'::text IN ('C', 'A', 'S', 'T', 'H', 'D', 'F') as admin_valid;
SELECT 'S'::text IN ('C', 'A', 'S', 'T', 'H', 'D', 'F') as super_admin_valid;
SELECT 'T'::text IN ('C', 'A', 'S', 'T', 'H', 'D', 'F') as cashier_valid;
SELECT 'H'::text IN ('C', 'A', 'S', 'T', 'H', 'D', 'F') as package_handler_valid;
SELECT 'D'::text IN ('C', 'A', 'S', 'T', 'H', 'D', 'F') as transfer_personnel_valid;
SELECT 'F'::text IN ('C', 'A', 'S', 'T', 'H', 'D', 'F') as front_desk_valid;

-- Show current user roles in the database
SELECT role, COUNT(*) as user_count
FROM Users
GROUP BY role
ORDER BY role;
