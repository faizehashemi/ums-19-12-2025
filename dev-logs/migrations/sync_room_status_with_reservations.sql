-- Migration: Sync room status with reservations check-in/check-out system
-- Description: Updates room occupancy based on reservation member assignments

-- ============================================
-- FUNCTION: Update room status from reservation members
-- ============================================
CREATE OR REPLACE FUNCTION update_room_status_from_reservations()
RETURNS TRIGGER AS $$
DECLARE
  member JSONB;
  room_num TEXT;
  occupied_count INTEGER;
  room_capacity INTEGER;
  room_uuid UUID;
BEGIN
  -- Process all unique rooms from the members array
  FOR room_num IN
    SELECT DISTINCT member_data->>'room'
    FROM jsonb_array_elements(COALESCE(NEW.members, '[]'::jsonb)) AS member_data
    WHERE member_data->>'room' IS NOT NULL
  LOOP
    -- Get room UUID and capacity
    SELECT id, bed_capacity INTO room_uuid, room_capacity
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
    UPDATE rooms
    SET
      status = CASE
        WHEN occupied_count >= room_capacity THEN 'occupied'
        WHEN occupied_count > 0 THEN 'occupied'  -- Partially occupied is still occupied
        ELSE 'available'
      END,
      updated_at = NOW()
    WHERE room_number = room_num;

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
      SELECT id, bed_capacity INTO room_uuid, room_capacity
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

      UPDATE rooms
      SET
        status = CASE
          WHEN occupied_count >= room_capacity THEN 'occupied'
          WHEN occupied_count > 0 THEN 'occupied'
          ELSE 'available'
        END,
        updated_at = NOW()
      WHERE room_number = room_num;

    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS sync_room_status_on_reservation_change ON reservations;

-- Create trigger to update room status when reservation members change
CREATE TRIGGER sync_room_status_on_reservation_change
  AFTER INSERT OR UPDATE OF members
  ON reservations
  FOR EACH ROW
  EXECUTE FUNCTION update_room_status_from_reservations();

-- ============================================
-- UPDATED VIEW: Room occupancy with reservation tracking
-- ============================================
DROP VIEW IF EXISTS room_occupancy_overview;

CREATE OR REPLACE VIEW room_occupancy_overview AS
SELECT
  r.id as room_id,
  r.room_number,
  r.floor,
  r.bed_capacity,
  b.name as building_name,
  b.id as building_id,
  r.status as room_status,
  COALESCE(occupied_data.occupied_beds, 0) as occupied_beds,
  r.bed_capacity - COALESCE(occupied_data.occupied_beds, 0) as available_beds,
  r.last_cleaned_at,
  occupied_data.guest_names
FROM rooms r
LEFT JOIN buildings b ON r.building_id = b.id
LEFT JOIN LATERAL (
  SELECT
    COUNT(DISTINCT member_data->>'bed') as occupied_beds,
    array_agg(DISTINCT member_data->>'name') as guest_names
  FROM reservations res
  CROSS JOIN jsonb_array_elements(res.members) AS member_data
  WHERE member_data->>'room' = r.room_number
    AND member_data->>'checkin_status' = 'completed'
    AND (
      member_data->>'checkout_status' IS NULL
      OR member_data->>'checkout_status' != 'completed'
    )
    AND res.status IN ('approved', 'confirmed')
) occupied_data ON true;

-- ============================================
-- HELPER FUNCTION: Get room occupancy for a specific room
-- ============================================
CREATE OR REPLACE FUNCTION get_room_occupancy(room_number_param TEXT)
RETURNS TABLE (
  room_number TEXT,
  bed_capacity INTEGER,
  occupied_beds BIGINT,
  available_beds INTEGER,
  occupant_names TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.room_number,
    r.bed_capacity,
    COUNT(DISTINCT member_data->>'bed') as occupied_beds,
    r.bed_capacity - COUNT(DISTINCT member_data->>'bed')::INTEGER as available_beds,
    array_agg(DISTINCT member_data->>'name')::TEXT[] as occupant_names
  FROM rooms r
  LEFT JOIN reservations res ON true
  LEFT JOIN LATERAL jsonb_array_elements(res.members) AS member_data ON
    member_data->>'room' = r.room_number
    AND member_data->>'checkin_status' = 'completed'
    AND (
      member_data->>'checkout_status' IS NULL
      OR member_data->>'checkout_status' != 'completed'
    )
    AND res.status IN ('approved', 'confirmed')
  WHERE r.room_number = room_number_param
  GROUP BY r.room_number, r.bed_capacity;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNCTION: Force recalculate all room statuses
-- ============================================
CREATE OR REPLACE FUNCTION recalculate_all_room_statuses()
RETURNS INTEGER AS $$
DECLARE
  room_record RECORD;
  occupied_count INTEGER;
  updated_count INTEGER := 0;
BEGIN
  -- Loop through all rooms
  FOR room_record IN SELECT id, room_number, bed_capacity FROM rooms
  LOOP
    -- Count occupied beds for this room
    SELECT COUNT(*) INTO occupied_count
    FROM (
      SELECT DISTINCT
        r.id,
        member_data->>'bed' as bed
      FROM reservations r
      CROSS JOIN jsonb_array_elements(r.members) AS member_data
      WHERE member_data->>'room' = room_record.room_number
        AND member_data->>'checkin_status' = 'completed'
        AND (
          member_data->>'checkout_status' IS NULL
          OR member_data->>'checkout_status' != 'completed'
        )
        AND r.status IN ('approved', 'confirmed')
    ) AS occupied_beds;

    -- Update room status
    UPDATE rooms
    SET
      status = CASE
        WHEN occupied_count >= room_record.bed_capacity THEN 'occupied'
        WHEN occupied_count > 0 THEN 'occupied'
        ELSE 'available'
      END,
      updated_at = NOW()
    WHERE id = room_record.id
      AND status != CASE  -- Only update if status actually changed
        WHEN occupied_count >= room_record.bed_capacity THEN 'occupied'
        WHEN occupied_count > 0 THEN 'occupied'
        ELSE 'available'
      END;

    IF FOUND THEN
      updated_count := updated_count + 1;
    END IF;

  END LOOP;

  RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Run initial status recalculation
-- ============================================
-- Uncomment to run on migration:
-- SELECT recalculate_all_room_statuses();

-- ============================================
-- SAMPLE QUERIES
-- ============================================

-- Get all rooms with their current occupancy
-- SELECT * FROM room_occupancy_overview ORDER BY building_name, floor, room_number;

-- Get occupancy for a specific room
-- SELECT * FROM get_room_occupancy('101');

-- Find available rooms with at least 2 beds
-- SELECT room_number, building_name, available_beds
-- FROM room_occupancy_overview
-- WHERE available_beds >= 2
-- ORDER BY building_name, floor, room_number;

-- Find all occupied rooms
-- SELECT room_number, building_name, occupied_beds, bed_capacity, guest_names
-- FROM room_occupancy_overview
-- WHERE occupied_beds > 0
-- ORDER BY building_name, floor, room_number;

-- Manually recalculate all room statuses (run when needed)
-- SELECT recalculate_all_room_statuses();

COMMENT ON FUNCTION update_room_status_from_reservations() IS
'Automatically updates room status when reservation members are assigned or checked in/out';

COMMENT ON FUNCTION get_room_occupancy(TEXT) IS
'Returns detailed occupancy information for a specific room number';

COMMENT ON FUNCTION recalculate_all_room_statuses() IS
'Force recalculates status for all rooms based on current check-in data. Returns count of updated rooms.';
