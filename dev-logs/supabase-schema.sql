-- QuickStay Room Management System - Supabase Schema

-- ============================================
-- BUILDINGS TABLE
-- ============================================
CREATE TABLE buildings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  address TEXT,
  total_floors INTEGER NOT NULL DEFAULT 1,
  description TEXT,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Index for faster queries
CREATE INDEX idx_buildings_status ON buildings(status);
CREATE INDEX idx_buildings_created_at ON buildings(created_at);

-- ============================================
-- ROOMS TABLE
-- ============================================
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
  room_number VARCHAR(50) NOT NULL,
  floor INTEGER NOT NULL,
  bed_capacity INTEGER NOT NULL DEFAULT 1,
  status VARCHAR(50) DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'cleaning', 'maintenance', 'blocked')),
  room_type VARCHAR(100), -- e.g., 'Standard', 'Deluxe', 'Dormitory'
  amenities TEXT[], -- Array of amenities
  last_cleaned_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  UNIQUE(building_id, room_number, floor)
);

-- Indexes for faster queries
CREATE INDEX idx_rooms_building_id ON rooms(building_id);
CREATE INDEX idx_rooms_status ON rooms(status);
CREATE INDEX idx_rooms_floor ON rooms(floor);
CREATE INDEX idx_rooms_building_floor ON rooms(building_id, floor);

-- ============================================
-- GUESTS TABLE
-- ============================================
CREATE TABLE guests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  id_number VARCHAR(100), -- National ID, Passport, etc.
  id_type VARCHAR(50), -- 'passport', 'national_id', 'driver_license'
  date_of_birth DATE,
  nationality VARCHAR(100),
  address TEXT,
  emergency_contact_name VARCHAR(255),
  emergency_contact_phone VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_guests_email ON guests(email);
CREATE INDEX idx_guests_phone ON guests(phone);
CREATE INDEX idx_guests_id_number ON guests(id_number);

-- ============================================
-- ALLOCATIONS TABLE (Assignment/Booking)
-- ============================================
CREATE TABLE allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  guest_id UUID NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
  bed_number VARCHAR(10), -- e.g., 'A', 'B', 'C', '1', '2'
  start_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  end_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  check_in_timestamp TIMESTAMP WITH TIME ZONE, -- Actual check-in time
  check_out_timestamp TIMESTAMP WITH TIME ZONE, -- Actual check-out time
  status VARCHAR(50) DEFAULT 'reserved' CHECK (status IN ('reserved', 'checked_in', 'checked_out', 'cancelled', 'no_show')),
  price_per_night DECIMAL(10, 2),
  total_price DECIMAL(10, 2),
  payment_status VARCHAR(50) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partial', 'paid', 'refunded')),
  special_requests TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),

  -- Ensure end_timestamp is after start_timestamp
  CONSTRAINT valid_date_range CHECK (end_timestamp > start_timestamp),

  -- Ensure check-out is after check-in (if both are set)
  CONSTRAINT valid_checkin_checkout CHECK (
    check_out_timestamp IS NULL OR
    check_in_timestamp IS NULL OR
    check_out_timestamp > check_in_timestamp
  )
);

-- Indexes for faster queries
CREATE INDEX idx_allocations_room_id ON allocations(room_id);
CREATE INDEX idx_allocations_guest_id ON allocations(guest_id);
CREATE INDEX idx_allocations_status ON allocations(status);
CREATE INDEX idx_allocations_dates ON allocations(start_timestamp, end_timestamp);
CREATE INDEX idx_allocations_room_dates ON allocations(room_id, start_timestamp, end_timestamp);

-- ============================================
-- FUNCTION: Check for overlapping allocations
-- ============================================
CREATE OR REPLACE FUNCTION check_allocation_overlap()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if there's an overlapping allocation for the same room and bed
  IF EXISTS (
    SELECT 1 FROM allocations
    WHERE room_id = NEW.room_id
      AND bed_number = NEW.bed_number
      AND id != COALESCE(NEW.id, gen_random_uuid()) -- Exclude current record on UPDATE
      AND status NOT IN ('cancelled', 'checked_out', 'no_show') -- Only check active allocations
      AND (
        -- New allocation starts during existing allocation
        (NEW.start_timestamp >= start_timestamp AND NEW.start_timestamp < end_timestamp)
        OR
        -- New allocation ends during existing allocation
        (NEW.end_timestamp > start_timestamp AND NEW.end_timestamp <= end_timestamp)
        OR
        -- New allocation completely encompasses existing allocation
        (NEW.start_timestamp <= start_timestamp AND NEW.end_timestamp >= end_timestamp)
      )
  ) THEN
    RAISE EXCEPTION 'Allocation overlap detected: Room % bed % is already allocated for this time period', NEW.room_id, NEW.bed_number;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to prevent overlapping allocations
CREATE TRIGGER prevent_allocation_overlap
  BEFORE INSERT OR UPDATE ON allocations
  FOR EACH ROW
  EXECUTE FUNCTION check_allocation_overlap();

-- ============================================
-- MAINTENANCE TICKETS TABLE
-- ============================================
CREATE TABLE maintenance_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  priority VARCHAR(50) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  assigned_to UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Indexes
CREATE INDEX idx_maintenance_room_id ON maintenance_tickets(room_id);
CREATE INDEX idx_maintenance_status ON maintenance_tickets(status);
CREATE INDEX idx_maintenance_priority ON maintenance_tickets(priority);

-- ============================================
-- CLEANING LOGS TABLE
-- ============================================
CREATE TABLE cleaning_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  cleaned_by UUID REFERENCES auth.users(id),
  cleaned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  cleaning_type VARCHAR(50) DEFAULT 'standard' CHECK (cleaning_type IN ('standard', 'deep', 'checkout')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index
CREATE INDEX idx_cleaning_logs_room_id ON cleaning_logs(room_id);
CREATE INDEX idx_cleaning_logs_cleaned_at ON cleaning_logs(cleaned_at);

-- ============================================
-- FUNCTION: Update room status based on allocations
-- ============================================
CREATE OR REPLACE FUNCTION update_room_status()
RETURNS TRIGGER AS $$
DECLARE
  occupied_beds INTEGER;
  total_beds INTEGER;
BEGIN
  -- Get total bed capacity for the room
  SELECT bed_capacity INTO total_beds
  FROM rooms
  WHERE id = COALESCE(NEW.room_id, OLD.room_id);

  -- Count currently occupied beds (active allocations)
  SELECT COUNT(*) INTO occupied_beds
  FROM allocations
  WHERE room_id = COALESCE(NEW.room_id, OLD.room_id)
    AND status IN ('reserved', 'checked_in')
    AND start_timestamp <= NOW()
    AND end_timestamp > NOW();

  -- Update room status
  UPDATE rooms
  SET
    status = CASE
      WHEN occupied_beds >= total_beds THEN 'occupied'
      ELSE 'available'
    END,
    updated_at = NOW()
  WHERE id = COALESCE(NEW.room_id, OLD.room_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update room status when allocations change
CREATE TRIGGER auto_update_room_status
  AFTER INSERT OR UPDATE OR DELETE ON allocations
  FOR EACH ROW
  EXECUTE FUNCTION update_room_status();

-- ============================================
-- FUNCTION: Update timestamps
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all relevant tables
CREATE TRIGGER update_buildings_updated_at BEFORE UPDATE ON buildings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rooms_updated_at BEFORE UPDATE ON rooms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_guests_updated_at BEFORE UPDATE ON guests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_allocations_updated_at BEFORE UPDATE ON allocations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_maintenance_updated_at BEFORE UPDATE ON maintenance_tickets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS) - Enable if using auth
-- ============================================
-- Uncomment these if you want to enable RLS

-- ALTER TABLE buildings ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE allocations ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE maintenance_tickets ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE cleaning_logs ENABLE ROW LEVEL SECURITY;

-- Example RLS Policies (customize based on your needs)
-- CREATE POLICY "Users can view all buildings" ON buildings FOR SELECT USING (true);
-- CREATE POLICY "Authenticated users can insert buildings" ON buildings FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ============================================
-- VIEWS FOR COMMON QUERIES
-- ============================================

-- View: Room occupancy overview
CREATE OR REPLACE VIEW room_occupancy_overview AS
SELECT
  r.id as room_id,
  r.room_number,
  r.floor,
  r.bed_capacity,
  b.name as building_name,
  b.id as building_id,
  r.status as room_status,
  COUNT(a.id) FILTER (WHERE a.status IN ('reserved', 'checked_in') AND a.start_timestamp <= NOW() AND a.end_timestamp > NOW()) as occupied_beds,
  r.bed_capacity - COUNT(a.id) FILTER (WHERE a.status IN ('reserved', 'checked_in') AND a.start_timestamp <= NOW() AND a.end_timestamp > NOW()) as available_beds,
  r.last_cleaned_at
FROM rooms r
LEFT JOIN buildings b ON r.building_id = b.id
LEFT JOIN allocations a ON r.id = a.room_id
GROUP BY r.id, r.room_number, r.floor, r.bed_capacity, b.name, b.id, r.status, r.last_cleaned_at;

-- View: Current allocations with guest and room details
CREATE OR REPLACE VIEW current_allocations_detail AS
SELECT
  a.id as allocation_id,
  a.bed_number,
  a.start_timestamp,
  a.end_timestamp,
  a.check_in_timestamp,
  a.check_out_timestamp,
  a.status as allocation_status,
  a.payment_status,
  g.full_name as guest_name,
  g.phone as guest_phone,
  g.email as guest_email,
  r.room_number,
  r.floor,
  r.status as room_status,
  b.name as building_name
FROM allocations a
JOIN guests g ON a.guest_id = g.id
JOIN rooms r ON a.room_id = r.id
JOIN buildings b ON r.building_id = b.id
WHERE a.status IN ('reserved', 'checked_in')
  AND a.end_timestamp > NOW()
ORDER BY a.start_timestamp;

-- ============================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================

-- Insert sample building
-- INSERT INTO buildings (name, address, total_floors, status)
-- VALUES ('Building A', '123 Main St', 3, 'active');

-- Insert sample rooms (you can use bulk insert)
-- INSERT INTO rooms (building_id, room_number, floor, bed_capacity, status)
-- SELECT
--   (SELECT id FROM buildings WHERE name = 'Building A'),
--   unnest(ARRAY['101', '102', '103', '104', '105']),
--   1,
--   4,
--   'available';

COMMENT ON TABLE buildings IS 'Stores building/property information';
COMMENT ON TABLE rooms IS 'Stores room information with bed capacity';
COMMENT ON TABLE guests IS 'Stores guest/tenant information';
COMMENT ON TABLE allocations IS 'Stores room/bed allocations with time windows to prevent overlapping bookings';
COMMENT ON TABLE maintenance_tickets IS 'Tracks maintenance issues for rooms';
COMMENT ON TABLE cleaning_logs IS 'Logs cleaning activities for rooms';
