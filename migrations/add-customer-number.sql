-- Migration: Add customer_number column to users table
-- Date: 2025-10-05
-- Description: Adds a unique customer_number field (format: Letter + 5 digits, e.g., A00001)
--              and updates existing customer addresses to use customer_number instead of user_id

-- Step 1: Add the customer_number column
ALTER TABLE users
ADD COLUMN customer_number VARCHAR(6) UNIQUE;

-- Step 2: Create an index on customer_number for faster lookups
CREATE INDEX idx_users_customer_number ON users(customer_number);

-- Step 3: Populate existing customers with customer numbers
-- This generates customer numbers sequentially for all existing customers
DO $$
DECLARE
    customer_record RECORD;
    current_letter CHAR(1) := 'A';
    current_number INT := 1;
    new_customer_number VARCHAR(6);
    new_address TEXT;
BEGIN
    -- Loop through all customers ordered by user_id
    FOR customer_record IN
        SELECT user_id, branch, address
        FROM users
        WHERE role = 'C'
        ORDER BY user_id ASC
    LOOP
        -- Generate customer number
        new_customer_number := current_letter || LPAD(current_number::TEXT, 5, '0');

        -- Update the customer_number
        UPDATE users
        SET customer_number = new_customer_number
        WHERE user_id = customer_record.user_id;

        -- Update the address to use customer_number instead of user_id
        -- Parse the existing address and replace the PSC line
        IF customer_record.address IS NOT NULL THEN
            new_address := REGEXP_REPLACE(
                customer_record.address,
                'PSC ' || customer_record.branch || ' \d+',
                'PSC ' || customer_record.branch || ' ' || new_customer_number
            );

            -- If the pattern didn't match (maybe it's a different format), try a different pattern
            IF new_address = customer_record.address THEN
                -- Reconstruct the full address with customer_number
                new_address := '3132 NW 43rd Street, PSC ' || customer_record.branch || ' ' || new_customer_number || ', Lauderdale Lakes, Florida 33309';
            END IF;

            UPDATE users
            SET address = new_address
            WHERE user_id = customer_record.user_id;
        END IF;

        -- Increment counter
        current_number := current_number + 1;

        -- Roll over to next letter if we exceed 99999
        IF current_number > 99999 THEN
            current_number := 1;
            current_letter := CHR(ASCII(current_letter) + 1);

            -- Safety check: don't exceed Z
            IF current_letter > 'Z' THEN
                RAISE EXCEPTION 'Customer number limit exceeded (Z99999)';
            END IF;
        END IF;
    END LOOP;

    RAISE NOTICE 'Successfully populated % customers with customer numbers', (SELECT COUNT(*) FROM users WHERE role = 'C');
END $$;

-- Step 4: Add a comment to the column
COMMENT ON COLUMN users.customer_number IS 'Unique customer identifier (format: Letter + 5 digits, e.g., A00001-Z99999)';

-- Step 5: Make customer_number NOT NULL for customers (optional - uncomment if you want to enforce this)
-- ALTER TABLE users
-- ADD CONSTRAINT customer_number_required CHECK (role != 'C' OR customer_number IS NOT NULL);

-- Verification: Check the results
SELECT
    user_id,
    customer_number,
    first_name,
    last_name,
    branch,
    address
FROM users
WHERE role = 'C'
ORDER BY customer_number
LIMIT 10;
