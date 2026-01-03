# Room Management System - Setup Guide

This document explains the complete room management system with Supabase integration, including buildings, rooms, and allocations with overlap prevention.

## 🎯 Features Implemented

### 1. **Building Management**
- ✅ Add, edit, and delete buildings
- ✅ Track building address, floors, and status
- ✅ Cascading delete (removes all rooms when building is deleted)

### 2. **Room Management**
- ✅ Add, edit, and delete individual rooms
- ✅ **Bulk room creation** with smart syntax
- ✅ Assign rooms to buildings and floors
- ✅ Set bed capacity per room
- ✅ Track room status (available, occupied, cleaning, maintenance, blocked)

### 3. **Allocation System**
- ✅ Time-based room/bed allocations
- ✅ **Automatic overlap prevention** (database-level trigger)
- ✅ Guest management with contact information
- ✅ Check-in/check-out tracking
- ✅ Payment status tracking

### 4. **UI Components**
- ✅ Compact and large card views (toggle between 20+ cards or detailed view)
- ✅ Building dropdown menu for quick access
- ✅ Modal-based add/edit forms
- ✅ Real-time validation

---

## 📦 Files Created

### 1. Database Schema
**File:** `supabase-schema.sql`

Contains complete Supabase schema with:
- `buildings` table
- `rooms` table
- `guests` table
- `allocations` table (with overlap prevention)
- `maintenance_tickets` table
- `cleaning_logs` table
- Triggers for automatic status updates
- Views for common queries

### 2. Components

#### BuildingModal
**File:** `src/components/accommodation/BuildingModal.jsx`

Features:
- Add/edit building information
- Delete building (with confirmation)
- Form validation
- Status management (active, inactive, maintenance)

#### RoomModal
**File:** `src/components/accommodation/RoomModal.jsx`

Features:
- **Two modes:** Single room or Bulk creation
- Bulk creation with smart syntax parser
- Real-time preview of bulk rooms
- Help guide with examples
- Form validation

#### Updated GridLayout
**File:** `src/modules/owner/accommodation/GridLayout.jsx`

Features:
- Integrated building and room modals
- Building dropdown menu in header
- State management for buildings and rooms
- CRUD operations with toast notifications

#### Tailwind Config
**File:** `tailwind.config.js`

Added custom grid columns (13-24) for compact view support.

---

## 🚀 Setup Instructions

### Step 1: Set Up Supabase Database

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the entire contents of `supabase-schema.sql`
4. Run the SQL script to create all tables, triggers, and views

### Step 2: Verify Installation

The components are already integrated. Verify by:

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to the Grid Layout page

3. You should see:
   - A "Buildings" dropdown button (secondary style)
   - An "Add Room" button (primary style)
   - Size toggle buttons (minimize/maximize icons)

### Step 3: Test the Features

#### Test Building Management:
1. Click "Buildings" dropdown
2. Click "Add Building"
3. Fill in building details
4. Save and verify it appears in the dropdown

#### Test Room Creation (Single):
1. Click "Add Room"
2. Select "Single Room" mode
3. Fill in room details
4. Click "Add Room"

#### Test Bulk Room Creation:
1. Click "Add Room"
2. Select "Bulk Create" mode
3. Try these examples:

**Example 1:** Simple range with same capacity
```
101-110(4)
```
Creates rooms 101 to 110, each with 4 beds

**Example 2:** Mixed capacities
```
101(2)-102(4)-103(6)-104(2)
```
Creates 4 rooms with different bed capacities

**Example 3:** Range with different capacities
```
201-205(4)-206-210(2)
```
Creates rooms 201-205 (4 beds each) and 206-210 (2 beds each)

**Example 4:** Alphanumeric rooms
```
A1-A10(1)
```
Creates rooms A1 to A10, each with 1 bed

---

## 🔧 Bulk Room Creation Syntax Guide

### Format Rules:
- Use **dashes (-)** to separate room specifications
- Add **capacity in brackets** like `(4)` after room number or range
- **Ranges** use format: `start-end` like `101-105`
- Default capacity is **1 bed** if not specified

### Examples:

| Input | Result |
|-------|--------|
| `101(4)-102(4)-103(2)` | 3 rooms: 101 (4 beds), 102 (4 beds), 103 (2 beds) |
| `101-105(4)` | 5 rooms: 101-105, all with 4 beds |
| `201(6)-205-210(2)` | Room 201 (6 beds), rooms 205-210 (2 beds each) |
| `A1-A5(1)` | 5 rooms: A1-A5, all with 1 bed |
| `301-303` | 3 rooms: 301-303, all with 1 bed (default) |

---

## 🗄️ Database Schema Overview

### Buildings Table
```sql
- id (UUID, primary key)
- name (varchar, required)
- address (text)
- total_floors (integer, default 1)
- status (varchar: active, inactive, maintenance)
- created_at, updated_at
```

### Rooms Table
```sql
- id (UUID, primary key)
- building_id (UUID, foreign key → buildings)
- room_number (varchar, required)
- floor (integer, required)
- bed_capacity (integer, default 1)
- status (varchar: available, occupied, cleaning, maintenance, blocked)
- room_type (varchar: Standard, Deluxe, etc.)
- last_cleaned_at (timestamp)
- UNIQUE constraint on (building_id, room_number, floor)
```

### Allocations Table
```sql
- id (UUID, primary key)
- room_id (UUID, foreign key → rooms)
- guest_id (UUID, foreign key → guests)
- bed_number (varchar: A, B, C, etc.)
- start_timestamp (timestamp, required)
- end_timestamp (timestamp, required)
- check_in_timestamp, check_out_timestamp
- status (varchar: reserved, checked_in, checked_out, cancelled, no_show)
- payment_status (varchar: pending, partial, paid, refunded)
- Trigger: Prevents overlapping allocations for same room+bed
```

### Key Features:

1. **Overlap Prevention Trigger:**
   - Automatically checks for date/time conflicts
   - Prevents double-booking same bed
   - Only checks active allocations (not cancelled/checked-out)

2. **Auto Room Status Update:**
   - Automatically updates room status based on allocations
   - Changes to "occupied" when beds are full
   - Changes to "available" when beds become free

3. **Cascading Deletes:**
   - Deleting a building deletes all its rooms
   - Deleting a room deletes all its allocations

---

## 🔌 Supabase Integration (Next Steps)

To connect to Supabase, you'll need to:

### 1. Install Supabase Client
```bash
npm install @supabase/supabase-js
```

### 2. Create Supabase Config
Create `src/lib/supabase.js`:
```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

### 3. Add Environment Variables
Create `.env` file:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Replace Mock Data with API Calls

Replace the mock data functions in GridLayout.jsx:

```javascript
// Replace mockBuildings with:
const [buildingsList, setBuildingsList] = useState([]);

useEffect(() => {
  fetchBuildings();
}, []);

const fetchBuildings = async () => {
  const { data, error } = await supabase
    .from('buildings')
    .select('*')
    .order('name');

  if (error) {
    showToast('Error fetching buildings', 'error');
  } else {
    setBuildingsList(data);
  }
};

const fetchRooms = async () => {
  const { data, error } = await supabase
    .from('rooms')
    .select(`
      *,
      building:buildings(name)
    `)
    .order('room_number');

  if (error) {
    showToast('Error fetching rooms', 'error');
  } else {
    setRoomsList(data.map(room => ({
      ...room,
      building: room.building.name,
      number: room.room_number,
      totalBeds: room.bed_capacity,
      occupiedBeds: 0 // Calculate from allocations
    })));
  }
};

const handleSaveBuilding = async (buildingData) => {
  if (buildingData.id) {
    // Update
    const { error } = await supabase
      .from('buildings')
      .update(buildingData)
      .eq('id', buildingData.id);

    if (error) {
      showToast('Error updating building', 'error');
    } else {
      await fetchBuildings();
      showToast('Building updated successfully', 'success');
    }
  } else {
    // Insert
    const { error } = await supabase
      .from('buildings')
      .insert([buildingData]);

    if (error) {
      showToast('Error adding building', 'error');
    } else {
      await fetchBuildings();
      showToast('Building added successfully', 'success');
    }
  }
};
```

---

## 📊 Viewing Data

### Using Supabase Dashboard:
1. Go to **Table Editor** in Supabase
2. View and edit data in:
   - `buildings`
   - `rooms`
   - `guests`
   - `allocations`

### Using SQL Views:
```sql
-- View room occupancy
SELECT * FROM room_occupancy_overview;

-- View current allocations
SELECT * FROM current_allocations_detail;
```

---

## 🛡️ Allocation Overlap Prevention

The system automatically prevents double-booking:

### Example:
```sql
-- This will succeed:
INSERT INTO allocations (room_id, bed_number, start_timestamp, end_timestamp, ...)
VALUES ('room-1', 'A', '2025-01-01 14:00', '2025-01-03 12:00', ...);

-- This will FAIL with error (overlaps above):
INSERT INTO allocations (room_id, bed_number, start_timestamp, end_timestamp, ...)
VALUES ('room-1', 'A', '2025-01-02 14:00', '2025-01-04 12:00', ...);

-- This will succeed (different bed):
INSERT INTO allocations (room_id, bed_number, start_timestamp, end_timestamp, ...)
VALUES ('room-1', 'B', '2025-01-02 14:00', '2025-01-04 12:00', ...);
```

---

## 🎨 UI Features

### Card Size Toggle:
- **Compact:** Fits 20-24 cards per row on large screens
  - Shows only: room number, status badge (single letter), bed count
  - Perfect for overview of many rooms

- **Large:** Detailed view with 3-5 cards per row
  - Shows: full status, guest count, cleaning time, action buttons
  - Perfect for detailed management

### Building Dropdown:
- Quick access to all buildings
- Click to edit any building
- Add new building option at top

---

## 🔍 Testing Checklist

- [ ] Create a building
- [ ] Edit a building
- [ ] Create a single room
- [ ] Create bulk rooms with various syntaxes
- [ ] Edit a room
- [ ] Delete a room
- [ ] Delete a building (verify rooms are deleted too)
- [ ] Toggle between compact and large card views
- [ ] Filter rooms by building, floor, status
- [ ] Search rooms by number or building name

---

## 📝 Notes

- All database operations currently use **mock data**
- Replace with Supabase API calls following the integration guide above
- The overlap prevention trigger is **database-level**, so it works even if data is inserted via SQL
- Guest management UI is not included but the database schema is ready
- Allocation/booking UI is not included but can be built using the same modal pattern

---

## 🚨 Important Reminders

1. **Never modify the overlap prevention trigger** unless you understand the implications
2. **Always use transactions** when creating multiple allocations
3. **Validate dates** on the frontend before sending to database
4. **Handle timezone conversions** properly for timestamps
5. **Enable RLS (Row Level Security)** in Supabase for production

---

## 💡 Next Steps

1. Implement Supabase API integration
2. Add guest management UI
3. Create allocation/booking interface
4. Add calendar view for allocations
5. Implement reporting and analytics
6. Add payment tracking features

---

## 🆘 Support

For issues or questions:
1. Check the Supabase documentation: https://supabase.com/docs
2. Review the SQL schema comments
3. Test the bulk room syntax using the help guide in the modal

---

**Created:** 2026-01-01
**Version:** 1.0
**Author:** Claude Code
