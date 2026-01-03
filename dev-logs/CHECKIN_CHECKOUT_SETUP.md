# Check-in/Check-out System Setup Guide

## Overview
This guide explains how to set up the database schema to support the check-in/check-out functionality with room assignments.

## Database Schema Changes

### Current Schema
The `reservations` table already has these fields:
- `members` (JSONB) - Stores array of member objects
- `travel_details` (JSONB) - Stores travel information

### Required Structure

#### Members JSONB Array
Each member object in the `members` array should contain:

```json
{
  "name": "Ahmed Khan",
  "age": 35,
  "gender": "Male",
  "relation": "Self",
  "room": "101",              // Assigned room number
  "bed": "A",                 // Assigned bed letter (A, B, C, etc.)
  "checkin_status": "completed",  // "pending" or "completed"
  "checkin_time": "2026-01-08T10:30:00Z",  // ISO timestamp
  "checkout_status": "pending",    // "pending" or "completed"
  "checkout_time": null           // ISO timestamp or null
}
```

#### Travel Details JSONB Object
```json
{
  "arrivalDateTime": "2026-01-08T05:20",
  "departureDateTime": "2026-01-20T04:10",
  "airline": "SAUDIA",
  "flightNo": "SV773",
  // ... other travel fields
}
```

## Migration Steps

### Option 1: Using Supabase Dashboard

1. **Open Supabase Dashboard**
   - Go to your project dashboard
   - Navigate to SQL Editor

2. **Run Migration Script**
   - Copy the contents of `/dev-logs/migrations/add_checkin_checkout_fields.sql`
   - Paste into SQL Editor
   - Click "Run"

3. **Verify**
   - Go to Table Editor
   - Check that indexes are created
   - Check that comment is added to `members` column

### Option 2: Using Supabase CLI

```bash
# Navigate to your project directory
cd QuickStay-Frontend

# Create a new migration
supabase migration new add_checkin_checkout_fields

# Copy the SQL content to the generated migration file

# Apply migration
supabase db push
```

### Option 3: Manual SQL Execution

Connect to your PostgreSQL database and run:

```sql
-- Add indexes for faster date filtering
CREATE INDEX IF NOT EXISTS idx_reservations_arrival_date
ON public.reservations USING btree (((travel_details->>'arrivalDateTime')::text));

CREATE INDEX IF NOT EXISTS idx_reservations_departure_date
ON public.reservations USING btree (((travel_details->>'departureDateTime')::text));

-- Add helper functions
-- (See full SQL in /dev-logs/migrations/add_checkin_checkout_fields.sql)
```

## Updating Existing Data

If you have existing reservations that need to be updated with the new structure:

### Add Missing Fields to Members

```sql
-- Add room assignment fields to existing members
UPDATE reservations
SET members = (
  SELECT jsonb_agg(
    member ||
    jsonb_build_object(
      'room', NULL,
      'bed', NULL,
      'checkin_status', 'pending',
      'checkin_time', NULL,
      'checkout_status', 'pending',
      'checkout_time', NULL
    )
  )
  FROM jsonb_array_elements(members) AS member
)
WHERE members IS NOT NULL AND members != '[]'::jsonb;
```

### Verify Data Structure

```sql
-- Check member structure for a specific reservation
SELECT
  id,
  sh_id,
  jsonb_pretty(members) as member_details
FROM reservations
WHERE id = 'your-reservation-id';

-- Count reservations by check-in status
SELECT
  get_checkin_status(members) as status,
  COUNT(*) as count
FROM reservations
WHERE members IS NOT NULL
GROUP BY get_checkin_status(members);
```

## Testing the Setup

### 1. Test Room Assignment

```sql
-- Simulate room assignment for a reservation
UPDATE reservations
SET members = jsonb_set(
  members,
  '{0, room}',
  '"101"'::jsonb
)
WHERE sh_id = 12345;

UPDATE reservations
SET members = jsonb_set(
  members,
  '{0, bed}',
  '"A"'::jsonb
)
WHERE sh_id = 12345;
```

### 2. Test Check-in

```sql
-- Simulate check-in for all members
UPDATE reservations
SET members = (
  SELECT jsonb_agg(
    member ||
    jsonb_build_object(
      'checkin_status', 'completed',
      'checkin_time', now()::text
    )
  )
  FROM jsonb_array_elements(members) AS member
)
WHERE sh_id = 12345;
```

### 3. Query Check-in Status

```sql
-- Get all pending check-ins for today
SELECT
  id,
  sh_id,
  travel_details->>'arrivalDateTime' as arrival,
  get_checkin_status(members) as checkin_status
FROM reservations
WHERE travel_details->>'arrivalDateTime' LIKE '2026-01-08%'
  AND get_checkin_status(members) != 'completed'
  AND status IN ('approved', 'confirmed');
```

## Frontend Integration

The frontend code in `CheckinsCheckouts.jsx` and `RoomAllocationModal.jsx` already handles:

1. ✅ Fetching reservations with `travel_details` and `members`
2. ✅ Filtering by arrival/departure date
3. ✅ Room assignment through grid interface
4. ✅ Updating member objects with room/bed assignments
5. ✅ Marking check-in/check-out as completed with timestamps

## Rollback (If Needed)

If you need to rollback the changes:

```sql
-- Remove indexes
DROP INDEX IF EXISTS idx_reservations_arrival_date;
DROP INDEX IF EXISTS idx_reservations_departure_date;

-- Remove helper functions
DROP FUNCTION IF EXISTS get_checkin_status(JSONB);
DROP FUNCTION IF EXISTS get_checkout_status(JSONB);

-- Remove comment
COMMENT ON COLUMN public.reservations.members IS NULL;
```

## Troubleshooting

### Issue: Can't see reservations in check-in list

**Check:**
1. Reservation status is 'approved' or 'confirmed'
2. `travel_details.arrivalDateTime` matches selected date
3. Members array is not empty
4. Date format is correct (YYYY-MM-DD)

```sql
SELECT
  id,
  sh_id,
  status,
  travel_details->>'arrivalDateTime' as arrival,
  jsonb_array_length(members) as member_count
FROM reservations
WHERE travel_details->>'arrivalDateTime' LIKE '2026-01-08%';
```

### Issue: Room assignments not saving

**Check:**
1. Members array structure is correct
2. Room and bed fields are being set properly
3. No database constraints blocking the update

```sql
-- Check current member structure
SELECT jsonb_pretty(members)
FROM reservations
WHERE id = 'problem-reservation-id';
```

### Issue: Check-in status not updating

**Check:**
1. All members have `checkin_status` field
2. Values are exactly 'completed' or 'pending' (case-sensitive)
3. Helper function is working

```sql
-- Test helper function
SELECT get_checkin_status('[
  {"name": "Test", "checkin_status": "completed"},
  {"name": "Test2", "checkin_status": "pending"}
]'::jsonb);
```

## Best Practices

1. **Always backup** before running migrations
2. **Test on development** database first
3. **Validate data** after migration
4. **Monitor performance** of new indexes
5. **Document changes** in your migration files

## Support

For issues or questions:
- Check the SQL migration file: `/dev-logs/migrations/add_checkin_checkout_fields.sql`
- Review the component code: `/src/modules/owner/accommodation/CheckinsCheckouts.jsx`
- Check Room Allocation Modal: `/src/modules/owner/accommodation/components/RoomAllocationModal.jsx`
