# Migration Guide

## How to Run Migrations

### Option 1: Supabase Dashboard (Recommended)

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Click **SQL Editor** in the left sidebar
4. Run each migration file **in order**:

#### Run these migrations in this exact order:

1. **005_create_maintenance_table.sql** (or **005_create_maintenance_table_clean.sql** if you had errors)
   - Creates the maintenance_records table
   - Adds RLS policies for maintenance tracking

2. **006_create_car_reference_tables.sql**
   - Creates car_makes, car_models, car_colors tables
   - Adds RLS policies for admin management

3. **007_seed_philippine_car_data.sql**
   - Seeds 15 popular Philippine car brands
   - Seeds 100+ car models
   - Seeds 18 common car colors

4. **008_update_rentals_to_datetime.sql**
   - Updates rentals table to use datetime fields instead of separate date and time
   - Adds booking conflict detection function
   - Migrates existing data automatically

### Option 2: Supabase CLI

```bash
cd "C:\Users\XIAOMI\Desktop\ClaudeProject\Drively App"
supabase db push
```

## What Each Migration Does

### 005_create_maintenance_table.sql
Creates the maintenance tracking system:
- Table for storing maintenance records
- Tracks routine maintenance, repairs, inspections
- Records costs, service providers, mileage
- Schedules next maintenance dates

### 006_create_car_reference_tables.sql
Creates reference data tables:
- **car_makes**: Toyota, Honda, Mazda, etc.
- **car_models**: Vios, Civic, CX-5, etc. (linked to makes)
- **car_colors**: White, Black, Silver, etc.
- Admin-only editing (car owners can only select)

### 007_seed_philippine_car_data.sql
Populates the reference tables with:
- 15 popular car brands in the Philippines
- 100+ models across all brands
- 18 common car colors

### 008_update_rentals_to_datetime.sql
Updates the booking system:
- Converts separate date/time fields to single datetime fields
- Adds automatic conflict detection function
- Prevents overlapping bookings for the same car
- Migrates existing data (defaults to 9 AM start, 6 PM end if times are missing)

## After Running Migrations

Once migrations are complete, you'll have:

✅ Dropdowns for Make, Model, and Color in car forms
✅ Cascading selection (select make → models appear)
✅ Maintenance tracking system
✅ All Philippine car data pre-loaded
✅ Date & time picker for bookings (US format: MM/DD/YYYY, h:mm AM/PM)
✅ Automatic booking conflict detection
✅ Multiple bookings allowed per car (as long as they don't overlap)

## Troubleshooting

### Error: "relation already exists"
- Tables already exist
- You can skip that migration or run with `IF NOT EXISTS` (already included)

### Error: "column does not exist"
- Run migrations in order (005, 006, 007)
- Check that earlier migrations completed successfully

### Error: "function does not exist"
- The function is created in each migration file
- Try running the migration again

## Verify Migrations Worked

Run this query in SQL Editor to check:

```sql
-- Check makes
SELECT COUNT(*) as makes_count FROM car_makes;
-- Should return: 15

-- Check models
SELECT COUNT(*) as models_count FROM car_models;
-- Should return: 100+

-- Check colors
SELECT COUNT(*) as colors_count FROM car_colors;
-- Should return: 18

-- Check maintenance table exists
SELECT COUNT(*) FROM maintenance_records;
-- Should return: 0 (empty at first)
```

## Next Steps

After migrations:
1. **Test Car Listing**
   - Go to "List a New Car" page
   - You'll see dropdown menus for Make, Model, Color
   - Select Toyota → Vios will appear in models

2. **Test Maintenance Tracking**
   - Go to "Maintenance" from the dashboard
   - Add a maintenance record for your cars
   - Track routine service, repairs, and inspections

3. **Test Booking System**
   - Go to "Rentals" → "Add Manual Booking"
   - Select a car and use the calendar to pick date & time
   - The system will show dates in US format (MM/DD/YYYY, h:mm AM/PM)
   - Try creating overlapping bookings - you'll see a conflict warning
   - You can create multiple bookings for the same car as long as they don't overlap
