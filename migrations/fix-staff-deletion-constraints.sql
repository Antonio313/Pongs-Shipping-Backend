-- Fix foreign key constraints to allow staff deletion while preserving records
-- This migration changes ON DELETE RESTRICT to ON DELETE SET NULL for staff-related foreign keys
-- Also removes NOT NULL constraints to allow NULL values when staff is deleted

-- STEP 1: Remove NOT NULL constraints from staff-related columns
ALTER TABLE Transfers ALTER COLUMN created_by DROP NOT NULL; ALTER TABLE Deliveries ALTER COLUMN delivered_by DROP NOT NULL;

ALTER TABLE Staff_Actions_Log ALTER COLUMN staff_id DROP NOT NULL;

ALTER TABLE Staff_Performance ALTER COLUMN staff_id DROP NOT NULL; ALTER TABLE PackageTracking ALTER COLUMN created_by DROP NOT NULL;

ALTER TABLE PreAlerts ALTER COLUMN confirmed_by DROP NOT NULL;

-- STEP 2: Update foreign key constraints to use ON DELETE SET NULL

-- 1. Fix Transfers table - created_by constraint
ALTER TABLE Transfers
DROP CONSTRAINT IF EXISTS transfers_created_by_fkey;

ALTER TABLE Transfers
ADD CONSTRAINT transfers_created_by_fkey
FOREIGN KEY (created_by)
REFERENCES Users(user_id)
ON DELETE SET NULL;

-- 2. Fix Deliveries table - delivered_by constraint
ALTER TABLE Deliveries
DROP CONSTRAINT IF EXISTS deliveries_delivered_by_fkey;

ALTER TABLE Deliveries
ADD CONSTRAINT deliveries_delivered_by_fkey
FOREIGN KEY (delivered_by)
REFERENCES Users(user_id)
ON DELETE SET NULL;

-- 3. Fix Staff_Actions_Log - staff_id constraint
ALTER TABLE Staff_Actions_Log
DROP CONSTRAINT IF EXISTS staff_actions_log_staff_id_fkey;

ALTER TABLE Staff_Actions_Log
ADD CONSTRAINT staff_actions_log_staff_id_fkey
FOREIGN KEY (staff_id)
REFERENCES Users(user_id)
ON DELETE SET NULL;

-- 4. Fix Staff_Performance - staff_id constraint
ALTER TABLE Staff_Performance
DROP CONSTRAINT IF EXISTS staff_performance_staff_id_fkey;

ALTER TABLE Staff_Performance
ADD CONSTRAINT staff_performance_staff_id_fkey
FOREIGN KEY (staff_id)
REFERENCES Users(user_id)
ON DELETE SET NULL;

-- 5. Fix PackageTracking - created_by constraint
ALTER TABLE PackageTracking
DROP CONSTRAINT IF EXISTS packagetracking_created_by_fkey;

ALTER TABLE PackageTracking
ADD CONSTRAINT packagetracking_created_by_fkey
FOREIGN KEY (created_by)
REFERENCES Users(user_id)
ON DELETE SET NULL;

-- 6. Fix PreAlerts - confirmed_by constraint (if exists)
ALTER TABLE PreAlerts
DROP CONSTRAINT IF EXISTS prealerts_confirmed_by_fkey;

ALTER TABLE PreAlerts
ADD CONSTRAINT prealerts_confirmed_by_fkey
FOREIGN KEY (confirmed_by)
REFERENCES Users(user_id)
ON DELETE SET NULL;

-- Verify changes
SELECT
    tc.table_name,
    kcu.column_name,
    rc.delete_rule
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.referential_constraints rc
    ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND kcu.column_name IN ('created_by', 'delivered_by', 'staff_id', 'confirmed_by')
ORDER BY tc.table_name, kcu.column_name;
