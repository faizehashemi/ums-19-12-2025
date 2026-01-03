-- Fix the status check constraint to allow 'approved' and 'rejected' values
-- Run this in your Supabase SQL Editor

-- First, drop the existing constraint
ALTER TABLE reservations
DROP CONSTRAINT IF EXISTS reservations_status_check;

-- Add the updated constraint with all valid status values
ALTER TABLE reservations
ADD CONSTRAINT reservations_status_check
CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled'));

-- Verify the constraint was updated
SELECT conname, pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'reservations'::regclass
AND conname = 'reservations_status_check';
