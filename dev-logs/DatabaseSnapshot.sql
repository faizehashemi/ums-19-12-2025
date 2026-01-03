-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.allocations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL,
  guest_id uuid NOT NULL,
  bed_number character varying,
  start_timestamp timestamp with time zone NOT NULL,
  end_timestamp timestamp with time zone NOT NULL,
  check_in_timestamp timestamp with time zone,
  check_out_timestamp timestamp with time zone,
  status character varying DEFAULT 'reserved'::character varying CHECK (status::text = ANY (ARRAY['reserved'::character varying, 'checked_in'::character varying, 'checked_out'::character varying, 'cancelled'::character varying, 'no_show'::character varying]::text[])),
  price_per_night numeric,
  total_price numeric,
  payment_status character varying DEFAULT 'pending'::character varying CHECK (payment_status::text = ANY (ARRAY['pending'::character varying, 'partial'::character varying, 'paid'::character varying, 'refunded'::character varying]::text[])),
  special_requests text,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  CONSTRAINT allocations_pkey PRIMARY KEY (id),
  CONSTRAINT allocations_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.rooms(id),
  CONSTRAINT allocations_guest_id_fkey FOREIGN KEY (guest_id) REFERENCES public.guests(id),
  CONSTRAINT allocations_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id),
  CONSTRAINT allocations_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id)
);
CREATE TABLE public.buildings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL,
  address text,
  total_floors integer NOT NULL DEFAULT 1,
  description text,
  status character varying DEFAULT 'active'::character varying CHECK (status::text = ANY (ARRAY['active'::character varying, 'inactive'::character varying, 'maintenance'::character varying]::text[])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  CONSTRAINT buildings_pkey PRIMARY KEY (id),
  CONSTRAINT buildings_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id),
  CONSTRAINT buildings_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id)
);
CREATE TABLE public.cleaning_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL,
  cleaned_by uuid,
  cleaned_at timestamp with time zone DEFAULT now(),
  cleaning_type character varying DEFAULT 'standard'::character varying CHECK (cleaning_type::text = ANY (ARRAY['standard'::character varying, 'deep'::character varying, 'checkout'::character varying]::text[])),
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT cleaning_logs_pkey PRIMARY KEY (id),
  CONSTRAINT cleaning_logs_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.rooms(id),
  CONSTRAINT cleaning_logs_cleaned_by_fkey FOREIGN KEY (cleaned_by) REFERENCES auth.users(id)
);
CREATE TABLE public.guests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  full_name character varying NOT NULL,
  email character varying,
  phone character varying,
  id_number character varying,
  id_type character varying,
  date_of_birth date,
  nationality character varying,
  address text,
  emergency_contact_name character varying,
  emergency_contact_phone character varying,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT guests_pkey PRIMARY KEY (id)
);
CREATE TABLE public.maintenance_tickets (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL,
  title character varying NOT NULL,
  description text,
  priority character varying DEFAULT 'medium'::character varying CHECK (priority::text = ANY (ARRAY['low'::character varying, 'medium'::character varying, 'high'::character varying, 'urgent'::character varying]::text[])),
  status character varying DEFAULT 'open'::character varying CHECK (status::text = ANY (ARRAY['open'::character varying, 'in_progress'::character varying, 'resolved'::character varying, 'closed'::character varying]::text[])),
  assigned_to uuid,
  resolved_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  CONSTRAINT maintenance_tickets_pkey PRIMARY KEY (id),
  CONSTRAINT maintenance_tickets_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES auth.users(id),
  CONSTRAINT maintenance_tickets_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id),
  CONSTRAINT maintenance_tickets_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id),
  CONSTRAINT maintenance_tickets_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.rooms(id)
);
CREATE TABLE public.mawaid_grn (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  grn_number text NOT NULL UNIQUE,
  po_id uuid,
  received_date date NOT NULL,
  received_by text,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT mawaid_grn_pkey PRIMARY KEY (id),
  CONSTRAINT mawaid_grn_po_id_fkey FOREIGN KEY (po_id) REFERENCES public.mawaid_purchase_orders(id)
);
CREATE TABLE public.mawaid_grn_lines (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  grn_id uuid,
  po_line_id uuid,
  item_id uuid,
  quantity numeric NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT mawaid_grn_lines_pkey PRIMARY KEY (id),
  CONSTRAINT mawaid_grn_lines_grn_id_fkey FOREIGN KEY (grn_id) REFERENCES public.mawaid_grn(id),
  CONSTRAINT mawaid_grn_lines_po_line_id_fkey FOREIGN KEY (po_line_id) REFERENCES public.mawaid_po_lines(id)
);
CREATE TABLE public.mawaid_ingredient_issues (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  batch_id uuid,
  item_id uuid,
  quantity_issued numeric NOT NULL,
  issued_at timestamp with time zone DEFAULT now(),
  CONSTRAINT mawaid_ingredient_issues_pkey PRIMARY KEY (id),
  CONSTRAINT mawaid_ingredient_issues_batch_id_fkey FOREIGN KEY (batch_id) REFERENCES public.mawaid_production_batches(id),
  CONSTRAINT mawaid_ingredient_issues_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.mawaid_items(id)
);
CREATE TABLE public.mawaid_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text,
  unit text NOT NULL,
  min_stock numeric DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT mawaid_items_pkey PRIMARY KEY (id)
);
CREATE TABLE public.mawaid_meal_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  site_id uuid,
  service_date date NOT NULL,
  meal_type text NOT NULL,
  planned_people integer,
  planned_thals integer,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT mawaid_meal_sessions_pkey PRIMARY KEY (id),
  CONSTRAINT mawaid_meal_sessions_site_id_fkey FOREIGN KEY (site_id) REFERENCES public.mawaid_sites(id)
);
CREATE TABLE public.mawaid_menu_plans (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  site_id uuid,
  service_date date NOT NULL,
  meal_type text NOT NULL,
  items_json jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT mawaid_menu_plans_pkey PRIMARY KEY (id),
  CONSTRAINT mawaid_menu_plans_site_id_fkey FOREIGN KEY (site_id) REFERENCES public.mawaid_sites(id)
);
CREATE TABLE public.mawaid_po_lines (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  po_id uuid,
  item_id uuid,
  quantity numeric NOT NULL,
  unit_price numeric NOT NULL,
  received_qty numeric DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT mawaid_po_lines_pkey PRIMARY KEY (id),
  CONSTRAINT mawaid_po_lines_po_id_fkey FOREIGN KEY (po_id) REFERENCES public.mawaid_purchase_orders(id),
  CONSTRAINT mawaid_po_lines_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.mawaid_items(id)
);
CREATE TABLE public.mawaid_production_batches (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  site_id uuid,
  recipe_id uuid,
  batch_number text NOT NULL UNIQUE,
  production_date date NOT NULL,
  quantity_produced numeric NOT NULL,
  status text DEFAULT 'planned'::text,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT mawaid_production_batches_pkey PRIMARY KEY (id),
  CONSTRAINT mawaid_production_batches_site_id_fkey FOREIGN KEY (site_id) REFERENCES public.mawaid_sites(id),
  CONSTRAINT mawaid_production_batches_recipe_id_fkey FOREIGN KEY (recipe_id) REFERENCES public.mawaid_recipes(id)
);
CREATE TABLE public.mawaid_purchase_orders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  po_number text NOT NULL UNIQUE,
  vendor_id uuid,
  site_id uuid,
  order_date date NOT NULL,
  expected_date date,
  status text DEFAULT 'draft'::text,
  total_amount numeric DEFAULT 0,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT mawaid_purchase_orders_pkey PRIMARY KEY (id),
  CONSTRAINT mawaid_purchase_orders_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.mawaid_vendors(id),
  CONSTRAINT mawaid_purchase_orders_site_id_fkey FOREIGN KEY (site_id) REFERENCES public.mawaid_sites(id)
);
CREATE TABLE public.mawaid_recipes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  yield_type text DEFAULT 'thal'::text,
  yield_value numeric,
  yield_unit text,
  thal_equivalent_people integer DEFAULT 8,
  steps_text text,
  version integer DEFAULT 1,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT mawaid_recipes_pkey PRIMARY KEY (id)
);
CREATE TABLE public.mawaid_serving_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  meal_session_id uuid,
  started_at timestamp with time zone,
  ended_at timestamp with time zone,
  actual_people integer,
  actual_thals integer,
  status text DEFAULT 'pending'::text,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT mawaid_serving_sessions_pkey PRIMARY KEY (id),
  CONSTRAINT mawaid_serving_sessions_meal_session_id_fkey FOREIGN KEY (meal_session_id) REFERENCES public.mawaid_meal_sessions(id)
);
CREATE TABLE public.mawaid_sites (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  city text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  building text,
  capacity_thals integer,
  CONSTRAINT mawaid_sites_pkey PRIMARY KEY (id)
);
CREATE TABLE public.mawaid_stock (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  site_id uuid,
  item_id uuid,
  quantity numeric DEFAULT 0,
  last_updated timestamp with time zone DEFAULT now(),
  CONSTRAINT mawaid_stock_pkey PRIMARY KEY (id),
  CONSTRAINT mawaid_stock_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.mawaid_items(id),
  CONSTRAINT mawaid_stock_site_id_fkey FOREIGN KEY (site_id) REFERENCES public.mawaid_sites(id)
);
CREATE TABLE public.mawaid_stock_movements (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  site_id uuid,
  item_id uuid,
  movement_type text NOT NULL,
  quantity numeric NOT NULL,
  reference_id uuid,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT mawaid_stock_movements_pkey PRIMARY KEY (id),
  CONSTRAINT mawaid_stock_movements_site_id_fkey FOREIGN KEY (site_id) REFERENCES public.mawaid_sites(id),
  CONSTRAINT mawaid_stock_movements_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.mawaid_items(id)
);
CREATE TABLE public.mawaid_thal_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  serving_session_id uuid,
  thal_number integer NOT NULL,
  logged_at timestamp with time zone DEFAULT now(),
  logged_by text,
  CONSTRAINT mawaid_thal_logs_pkey PRIMARY KEY (id),
  CONSTRAINT mawaid_thal_logs_serving_session_id_fkey FOREIGN KEY (serving_session_id) REFERENCES public.mawaid_serving_sessions(id)
);
CREATE TABLE public.mawaid_vendors (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  contact_person text,
  phone text,
  city text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  address text,
  email text,
  CONSTRAINT mawaid_vendors_pkey PRIMARY KEY (id)
);
CREATE TABLE public.member_documents (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL,
  document_type character varying NOT NULL CHECK (document_type::text = ANY (ARRAY['passport'::character varying, 'visa'::character varying, 'photo'::character varying]::text[])),
  file_url text,
  file_name character varying,
  file_size integer,
  file_type character varying,
  uploaded_at timestamp with time zone DEFAULT now(),
  CONSTRAINT member_documents_pkey PRIMARY KEY (id),
  CONSTRAINT member_documents_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.reservation_members(id)
);
CREATE TABLE public.reservation_members (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  reservation_id uuid NOT NULL,
  name character varying,
  age_category character varying CHECK (age_category::text = ANY (ARRAY['Adult'::character varying, 'Child'::character varying, 'Infant'::character varying]::text[])),
  visa_type character varying CHECK (visa_type::text = ANY (ARRAY['Umrah'::character varying, 'Iqama'::character varying, 'Tourist'::character varying, 'Visit'::character varying]::text[])),
  passport_no character varying,
  mobile_no character varying,
  email character varying,
  makkah_rate numeric,
  makkah_fee numeric,
  madina_rate numeric,
  madina_fee numeric,
  total_member_fee numeric,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT reservation_members_pkey PRIMARY KEY (id),
  CONSTRAINT reservation_members_reservation_id_fkey FOREIGN KEY (reservation_id) REFERENCES public.reservations(id)
);
CREATE TABLE public.reservations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  accommodation character varying CHECK (accommodation::text = ANY (ARRAY['Sharing'::character varying, 'Exclusive'::character varying]::text[])),
  western_toilet boolean DEFAULT false,
  makkah_days numeric,
  madina_days numeric,
  makkah_room_type character varying CHECK (makkah_room_type::text = ANY (ARRAY['Sharing'::character varying, 'Exclusive'::character varying]::text[])),
  makkah_total numeric,
  madina_total numeric,
  total_accommodation_fees numeric,
  municipal_tax numeric,
  transport_fee_per_person numeric,
  total_transport_fee numeric,
  subtotal_before_vat numeric,
  vat numeric,
  total_fee numeric,
  num_members integer,
  status character varying DEFAULT 'pending'::character varying CHECK (status::text = ANY (ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying, 'confirmed'::character varying, 'cancelled'::character varying, 'completed'::character varying]::text[])),
  member_breakdown jsonb,
  members jsonb DEFAULT '[]'::jsonb,
  travel_details jsonb DEFAULT '{}'::jsonb,
  user_id text,
  sh_id bigint,
  CONSTRAINT reservations_pkey PRIMARY KEY (id)
);
CREATE TABLE public.rooms (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  building_id uuid NOT NULL,
  room_number character varying NOT NULL,
  floor integer NOT NULL,
  bed_capacity integer NOT NULL DEFAULT 1,
  status character varying DEFAULT 'available'::character varying CHECK (status::text = ANY (ARRAY['available'::character varying, 'occupied'::character varying, 'cleaning'::character varying, 'maintenance'::character varying, 'blocked'::character varying]::text[])),
  room_type character varying,
  amenities ARRAY,
  last_cleaned_at timestamp with time zone,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  CONSTRAINT rooms_pkey PRIMARY KEY (id),
  CONSTRAINT rooms_building_id_fkey FOREIGN KEY (building_id) REFERENCES public.buildings(id),
  CONSTRAINT rooms_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id),
  CONSTRAINT rooms_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id)
);
CREATE TABLE public.transport_drivers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL UNIQUE,
  license_number text NOT NULL UNIQUE,
  license_expiry date NOT NULL,
  status text NOT NULL DEFAULT 'Active'::text CHECK (status = ANY (ARRAY['Active'::text, 'Inactive'::text, 'On Leave'::text])),
  base_location text,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT transport_drivers_pkey PRIMARY KEY (id)
);
CREATE TABLE public.transport_maintenance_tickets (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL,
  category text NOT NULL,
  severity text NOT NULL CHECK (severity = ANY (ARRAY['Low'::text, 'Medium'::text, 'High'::text, 'Critical'::text])),
  description text NOT NULL,
  reported_at timestamp with time zone DEFAULT now(),
  status text NOT NULL DEFAULT 'Open'::text CHECK (status = ANY (ARRAY['Open'::text, 'In Progress'::text, 'Resolved'::text, 'Closed'::text])),
  assigned_to text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT transport_maintenance_tickets_pkey PRIMARY KEY (id),
  CONSTRAINT transport_maintenance_tickets_vehicle_id_fkey FOREIGN KEY (vehicle_id) REFERENCES public.transport_vehicles(id)
);
CREATE TABLE public.transport_roster_assignments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  date date NOT NULL,
  shift text NOT NULL CHECK (shift = ANY (ARRAY['Morning'::text, 'Afternoon'::text, 'Evening'::text, 'Night'::text, 'Full Day'::text])),
  driver_id uuid,
  vehicle_id uuid,
  reservation_id uuid,
  journey_type text CHECK (journey_type = ANY (ARRAY['salawaat'::text, 'ziyarah'::text, 'istiqbal'::text, 'madina'::text])),
  status text NOT NULL DEFAULT 'Scheduled'::text CHECK (status = ANY (ARRAY['Scheduled'::text, 'In Progress'::text, 'Completed'::text, 'Cancelled'::text])),
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT transport_roster_assignments_pkey PRIMARY KEY (id),
  CONSTRAINT transport_roster_assignments_driver_id_fkey FOREIGN KEY (driver_id) REFERENCES public.transport_drivers(id),
  CONSTRAINT transport_roster_assignments_vehicle_id_fkey FOREIGN KEY (vehicle_id) REFERENCES public.transport_vehicles(id)
);
CREATE TABLE public.transport_routes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  journey_type text NOT NULL CHECK (journey_type = ANY (ARRAY['salawaat'::text, 'ziyarah'::text, 'istiqbal'::text, 'madina'::text])),
  direction text,
  stops_json text,
  frequency_minutes integer,
  service_start_time time without time zone,
  service_end_time time without time zone,
  active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT transport_routes_pkey PRIMARY KEY (id)
);
CREATE TABLE public.transport_runs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  reservation_id uuid,
  route_id uuid,
  journey_type text CHECK (journey_type = ANY (ARRAY['salawaat'::text, 'ziyarah'::text, 'istiqbal'::text, 'madina'::text])),
  planned_start timestamp with time zone,
  planned_end timestamp with time zone,
  driver_id uuid,
  vehicle_id uuid,
  actual_start timestamp with time zone,
  actual_end timestamp with time zone,
  passenger_count integer DEFAULT 0,
  delay_reason text,
  status text NOT NULL DEFAULT 'Planned'::text CHECK (status = ANY (ARRAY['Planned'::text, 'In Progress'::text, 'Completed'::text, 'Cancelled'::text, 'Delayed'::text])),
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT transport_runs_pkey PRIMARY KEY (id),
  CONSTRAINT transport_runs_route_id_fkey FOREIGN KEY (route_id) REFERENCES public.transport_routes(id),
  CONSTRAINT transport_runs_driver_id_fkey FOREIGN KEY (driver_id) REFERENCES public.transport_drivers(id),
  CONSTRAINT transport_runs_vehicle_id_fkey FOREIGN KEY (vehicle_id) REFERENCES public.transport_vehicles(id)
);
CREATE TABLE public.transport_vehicles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  plate text NOT NULL UNIQUE,
  type text NOT NULL,
  capacity integer NOT NULL,
  insurance_expiry date NOT NULL,
  registration_expiry date NOT NULL,
  status text NOT NULL DEFAULT 'Available'::text CHECK (status = ANY (ARRAY['Available'::text, 'In Use'::text, 'Under Maintenance'::text, 'Blocked'::text])),
  base_location text,
  odometer integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT transport_vehicles_pkey PRIMARY KEY (id)
);