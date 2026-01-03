-- QuickStay Reservation System - Database Migrations
-- Run these SQL commands in your Supabase SQL Editor

-- ========================================
-- 1. Extend reservations table with approval/rejection tracking
-- ========================================
ALTER TABLE reservations
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS approved_by UUID,
ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS rejected_by UUID,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
CREATE INDEX IF NOT EXISTS idx_reservations_created_at ON reservations(created_at DESC);

-- ========================================
-- OPTIONAL: Additional fields for future enhancements
-- (Uncomment when needed for Phase 2+)
-- ========================================

-- For Tour Operator support:
-- ALTER TABLE reservations
-- ADD COLUMN IF NOT EXISTS reservation_type TEXT DEFAULT 'individual',
-- ADD COLUMN IF NOT EXISTS tour_operator_details JSONB;

-- For Modification/Cancellation tracking:
-- ALTER TABLE reservations
-- ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP,
-- ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
-- ADD COLUMN IF NOT EXISTS modification_history JSONB DEFAULT '[]'::jsonb;

-- For Accommodation integration:
-- ALTER TABLE reservations
-- ADD COLUMN IF NOT EXISTS allocation_id UUID,
-- ADD COLUMN IF NOT EXISTS allocation_status TEXT DEFAULT 'pending';

-- ========================================
-- 2. Email Notifications Table (Optional - for email tracking)
-- ========================================
-- CREATE TABLE IF NOT EXISTS email_notifications (
--   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
--   reservation_id UUID REFERENCES reservations(id),
--   notification_type TEXT NOT NULL,
--   recipient_email TEXT NOT NULL,
--   recipient_name TEXT,
--   subject TEXT,
--   sent_at TIMESTAMP,
--   status TEXT DEFAULT 'pending',
--   error_message TEXT,
--   retry_count INTEGER DEFAULT 0,
--   created_at TIMESTAMP DEFAULT NOW()
-- );

-- CREATE INDEX IF NOT EXISTS idx_notifications_reservation ON email_notifications(reservation_id);
-- CREATE INDEX IF NOT EXISTS idx_notifications_status ON email_notifications(status);

-- ========================================
-- 3. Verification Query
-- ========================================
-- Run this to verify the migrations were successful
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'reservations'
  AND column_name IN ('approved_at', 'approved_by', 'rejected_at', 'rejected_by', 'rejection_reason')
ORDER BY column_name;
