-- Migration: Automatic Checkout and Cleaning Workflow
-- Description: Handles automatic guest checkout at departure time and room cleaning workflow

-- ============================================
-- FUNCTION: Auto-checkout guests at departure time
-- ============================================
CREATE OR REPLACE FUNCTION auto_checkout_guests()
RETURNS INTEGER AS $$
DECLARE
  reservation_record RECORD;
  member_data JSONB;
  updated_members JSONB;
  checkout_time TIMESTAMP;
  updated_count INTEGER := 0;
  room_num TEXT;
  room_uuid UUID;
BEGIN
  checkout_time := NOW();

  -- Find all reservations that have reached their departure time
  -- and have members who are checked in but not checked out
  FOR reservation_record IN
    SELECT id, members, travel_details
    FROM reservations
    WHERE status IN ('approved', 'confirmed')
      AND travel_details->>'departureDateTime' IS NOT NULL
      AND (travel_details->>'departureDateTime')::timestamp <= checkout_time
  LOOP
    -- Check if any members need checkout
    IF EXISTS (
      SELECT 1
      FROM jsonb_array_elements(reservation_record.members) AS m
      WHERE m->>'checkin_status' = 'completed'
        AND (m->>'checkout_status' IS NULL OR m->>'checkout_status' != 'completed')
    ) THEN

      -- Update all members to checked out status
      updated_members := (
        SELECT jsonb_agg(
          CASE
            WHEN member->>'checkin_status' = 'completed'
                 AND (member->>'checkout_status' IS NULL OR member->>'checkout_status' != 'completed')
            THEN member || jsonb_build_object(
              'checkout_status', 'completed',
              'checkout_time', checkout_time::text
            )
            ELSE member
          END
        )
        FROM jsonb_array_elements(reservation_record.members) AS member
      );

      -- Update the reservation
      UPDATE reservations
      SET members = updated_members
      WHERE id = reservation_record.id;

      -- Mark associated rooms as 'cleaning'
      FOR room_num IN
        SELECT DISTINCT m->>'room'
        FROM jsonb_array_elements(updated_members) AS m
        WHERE m->>'room' IS NOT NULL
      LOOP
        SELECT id INTO room_uuid
        FROM rooms
        WHERE room_number = room_num;

        IF room_uuid IS NOT NULL THEN
          UPDATE rooms
          SET
            status = 'cleaning',
            updated_at = NOW()
          WHERE id = room_uuid;
        END IF;
      END LOOP;

      updated_count := updated_count + 1;
    END IF;
  END LOOP;

  RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNCTION: Manual checkout for a specific reservation
-- ============================================
CREATE OR REPLACE FUNCTION manual_checkout_reservation(reservation_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  member_data JSONB;
  updated_members JSONB;
  checkout_time TIMESTAMP;
  room_num TEXT;
  room_uuid UUID;
BEGIN
  checkout_time := NOW();

  -- Update all members to checked out status
  UPDATE reservations
  SET members = (
    SELECT jsonb_agg(
      CASE
        WHEN member->>'checkin_status' = 'completed'
             AND (member->>'checkout_status' IS NULL OR member->>'checkout_status' != 'completed')
        THEN member || jsonb_build_object(
          'checkout_status', 'completed',
          'checkout_time', checkout_time::text
        )
        ELSE member
      END
    )
    FROM jsonb_array_elements(members) AS member
  )
  WHERE id = reservation_uuid
  RETURNING members INTO updated_members;

  -- Mark associated rooms as 'cleaning'
  FOR room_num IN
    SELECT DISTINCT m->>'room'
    FROM jsonb_array_elements(updated_members) AS m
    WHERE m->>'room' IS NOT NULL
  LOOP
    SELECT id INTO room_uuid
    FROM rooms
    WHERE room_number = room_num;

    IF room_uuid IS NOT NULL THEN
      UPDATE rooms
      SET
        status = 'cleaning',
        updated_at = NOW()
      WHERE id = room_uuid;
    END IF;
  END LOOP;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Updated room status trigger to handle cleaning
-- ============================================
DROP TRIGGER IF EXISTS sync_room_status_on_reservation_change ON reservations;
DROP FUNCTION IF EXISTS update_room_status_from_reservations();

CREATE OR REPLACE FUNCTION update_room_status_from_reservations()
RETURNS TRIGGER AS $$
DECLARE
  member JSONB;
  room_num TEXT;
  occupied_count INTEGER;
  room_capacity INTEGER;
  room_uuid UUID;
  current_status TEXT;
BEGIN
  -- Process all unique rooms from the members array
  FOR room_num IN
    SELECT DISTINCT member_data->>'room'
    FROM jsonb_array_elements(COALESCE(NEW.members, '[]'::jsonb)) AS member_data
    WHERE member_data->>'room' IS NOT NULL
  LOOP
    -- Get room UUID, capacity and current status
    SELECT id, bed_capacity, status INTO room_uuid, room_capacity, current_status
    FROM rooms
    WHERE room_number = room_num
    LIMIT 1;

    IF room_uuid IS NULL THEN
      CONTINUE; -- Skip if room not found
    END IF;

    -- Count occupied beds from ALL reservations for this room
    SELECT COUNT(*) INTO occupied_count
    FROM (
      SELECT DISTINCT
        r.id,
        member_data->>'bed' as bed
      FROM reservations r
      CROSS JOIN jsonb_array_elements(r.members) AS member_data
      WHERE member_data->>'room' = room_num
        AND member_data->>'checkin_status' = 'completed'
        AND (
          member_data->>'checkout_status' IS NULL
          OR member_data->>'checkout_status' != 'completed'
        )
        AND r.status IN ('approved', 'confirmed')
    ) AS occupied_beds;

    -- Update room status based on occupancy
    -- Don't change status if room is in 'cleaning' mode
    IF current_status != 'cleaning' THEN
      UPDATE rooms
      SET
        status = CASE
          WHEN occupied_count >= room_capacity THEN 'occupied'
          WHEN occupied_count > 0 THEN 'occupied'  -- Partially occupied is still occupied
          ELSE 'available'
        END,
        updated_at = NOW()
      WHERE room_number = room_num;
    END IF;

  END LOOP;

  -- Also handle rooms that were previously assigned but are now removed
  IF TG_OP = 'UPDATE' THEN
    FOR room_num IN
      SELECT DISTINCT member_data->>'room'
      FROM jsonb_array_elements(COALESCE(OLD.members, '[]'::jsonb)) AS member_data
      WHERE member_data->>'room' IS NOT NULL
        AND member_data->>'room' NOT IN (
          SELECT member_data2->>'room'
          FROM jsonb_array_elements(COALESCE(NEW.members, '[]'::jsonb)) AS member_data2
          WHERE member_data2->>'room' IS NOT NULL
        )
    LOOP
      -- Recalculate status for rooms that were removed
      SELECT id, bed_capacity, status INTO room_uuid, room_capacity, current_status
      FROM rooms
      WHERE room_number = room_num
      LIMIT 1;

      IF room_uuid IS NULL THEN
        CONTINUE;
      END IF;

      SELECT COUNT(*) INTO occupied_count
      FROM (
        SELECT DISTINCT
          r.id,
          member_data->>'bed' as bed
        FROM reservations r
        CROSS JOIN jsonb_array_elements(r.members) AS member_data
        WHERE member_data->>'room' = room_num
          AND member_data->>'checkin_status' = 'completed'
          AND (
            member_data->>'checkout_status' IS NULL
            OR member_data->>'checkout_status' != 'completed'
          )
          AND r.status IN ('approved', 'confirmed')
      ) AS occupied_beds;

      -- Don't change status if room is in 'cleaning' mode
      IF current_status != 'cleaning' THEN
        UPDATE rooms
        SET
          status = CASE
            WHEN occupied_count >= room_capacity THEN 'occupied'
            WHEN occupied_count > 0 THEN 'occupied'
            ELSE 'available'
          END,
          updated_at = NOW()
        WHERE room_number = room_num;
      END IF;

    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_room_status_on_reservation_change
  AFTER INSERT OR UPDATE OF members
  ON reservations
  FOR EACH ROW
  EXECUTE FUNCTION update_room_status_from_reservations();

-- ============================================
-- FUNCTION: Mark room cleaning as complete
-- ============================================
CREATE OR REPLACE FUNCTION complete_room_cleaning(room_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  occupied_count INTEGER;
  room_capacity_val INTEGER;
  room_num TEXT;
BEGIN
  -- Get room details
  SELECT room_number, bed_capacity INTO room_num, room_capacity_val
  FROM rooms
  WHERE id = room_uuid;

  IF room_num IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Count current occupancy
  SELECT COUNT(*) INTO occupied_count
  FROM (
    SELECT DISTINCT
      r.id,
      member_data->>'bed' as bed
    FROM reservations r
    CROSS JOIN jsonb_array_elements(r.members) AS member_data
    WHERE member_data->>'room' = room_num
      AND member_data->>'checkin_status' = 'completed'
      AND (
        member_data->>'checkout_status' IS NULL
        OR member_data->>'checkout_status' != 'completed'
      )
      AND r.status IN ('approved', 'confirmed')
  ) AS occupied_beds;

  -- Update room status based on occupancy
  UPDATE rooms
  SET
    status = CASE
      WHEN occupied_count >= room_capacity_val THEN 'occupied'
      WHEN occupied_count > 0 THEN 'occupied'
      ELSE 'available'
    END,
    last_cleaned_at = NOW(),
    updated_at = NOW()
  WHERE id = room_uuid;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON FUNCTION auto_checkout_guests() IS
'Automatically checks out guests whose departure time has passed. Returns count of reservations updated. Should be run periodically (e.g., every hour via cron job or pg_cron).';

COMMENT ON FUNCTION manual_checkout_reservation(UUID) IS
'Manually checkout all members of a specific reservation and mark rooms as cleaning.';

COMMENT ON FUNCTION complete_room_cleaning(UUID) IS
'Mark a room cleaning as complete and update status to available/occupied based on current occupancy.';

-- ============================================
-- SAMPLE USAGE
-- ============================================

-- Run auto-checkout manually:
-- SELECT auto_checkout_guests();

-- Manually checkout a specific reservation:
-- SELECT manual_checkout_reservation('reservation-uuid-here');

-- Mark room cleaning as complete:
-- SELECT complete_room_cleaning('room-uuid-here');

-- Setup automatic checkout with pg_cron (if available):
-- SELECT cron.schedule('auto-checkout', '0 * * * *', 'SELECT auto_checkout_guests()');
-- This runs every hour on the hour

-- View rooms that need cleaning:
-- SELECT room_number, building_id, status, updated_at
-- FROM rooms
-- WHERE status = 'cleaning'
-- ORDER BY updated_at ASC;
