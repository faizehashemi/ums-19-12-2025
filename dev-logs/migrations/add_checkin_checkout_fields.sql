-- Migration: Add check-in/check-out support to reservations table
-- Description: This migration ensures the members JSONB field can store room assignments and check-in/check-out data

-- The members JSONB array should store objects with this structure:
-- {
--   "name": "string",
--   "age": number,
--   "gender": "string",
--   "relation": "string",
--   "room": "string",           -- Room number (e.g., "101")
--   "bed": "string",            -- Bed letter (e.g., "A", "B", "C")
--   "checkin_status": "string", -- "pending" or "completed"
--   "checkin_time": "timestamp",-- ISO timestamp when checked in
--   "checkout_status": "string",-- "pending" or "completed"
--   "checkout_time": "timestamp"-- ISO timestamp when checked out
-- }

-- Since JSONB is schema-less, we don't need to alter the column structure
-- But we should add a comment to document the expected structure

COMMENT ON COLUMN public.reservations.members IS
'JSONB array of group members. Each member should contain:
- name (string): Member name
- age (number): Member age
- gender (string): Member gender
- relation (string): Relation to primary guest
- room (string): Assigned room number (e.g., "101")
- bed (string): Assigned bed letter (e.g., "A", "B", "C")
- checkin_status (string): Check-in status - "pending" or "completed"
- checkin_time (timestamp): ISO timestamp of check-in
- checkout_status (string): Check-out status - "pending" or "completed"
- checkout_time (timestamp): ISO timestamp of check-out';

-- Add index on travel_details for faster date filtering
CREATE INDEX IF NOT EXISTS idx_reservations_arrival_date
ON public.reservations USING btree (((travel_details->>'arrivalDateTime')::text));

CREATE INDEX IF NOT EXISTS idx_reservations_departure_date
ON public.reservations USING btree (((travel_details->>'departureDateTime')::text));

-- Add a helper function to get check-in status for a reservation
CREATE OR REPLACE FUNCTION get_checkin_status(reservation_members JSONB)
RETURNS TEXT AS $$
DECLARE
    total_members INTEGER;
    checked_in_count INTEGER;
BEGIN
    total_members := jsonb_array_length(reservation_members);

    IF total_members = 0 THEN
        RETURN 'no_members';
    END IF;

    SELECT COUNT(*)
    INTO checked_in_count
    FROM jsonb_array_elements(reservation_members) AS member
    WHERE member->>'checkin_status' = 'completed';

    IF checked_in_count = 0 THEN
        RETURN 'pending';
    ELSIF checked_in_count = total_members THEN
        RETURN 'completed';
    ELSE
        RETURN 'partial';
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add a helper function to get checkout status for a reservation
CREATE OR REPLACE FUNCTION get_checkout_status(reservation_members JSONB)
RETURNS TEXT AS $$
DECLARE
    total_members INTEGER;
    checked_out_count INTEGER;
BEGIN
    total_members := jsonb_array_length(reservation_members);

    IF total_members = 0 THEN
        RETURN 'no_members';
    END IF;

    SELECT COUNT(*)
    INTO checked_out_count
    FROM jsonb_array_elements(reservation_members) AS member
    WHERE member->>'checkout_status' = 'completed';

    IF checked_out_count = 0 THEN
        RETURN 'pending';
    ELSIF checked_out_count = total_members THEN
        RETURN 'completed';
    ELSE
        RETURN 'partial';
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Example queries to use these functions:

-- Get all reservations with their check-in status
-- SELECT id, sh_id, get_checkin_status(members) as checkin_status
-- FROM reservations;

-- Get reservations that need check-in for a specific date
-- SELECT *
-- FROM reservations
-- WHERE travel_details->>'arrivalDateTime' LIKE '2026-01-08%'
--   AND get_checkin_status(members) != 'completed';

-- Get reservations that need check-out for a specific date
-- SELECT *
-- FROM reservations
-- WHERE travel_details->>'departureDateTime' LIKE '2026-01-20%'
--   AND get_checkout_status(members) != 'completed';
