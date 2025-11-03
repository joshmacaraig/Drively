-- Migration: Delete all records except admin user
-- This script will delete all data from the database while preserving the admin user account

-- Start transaction
BEGIN;

-- Get admin user IDs (users with 'admin' role)
-- We'll store them in a temporary table for reference
CREATE TEMP TABLE admin_users AS
SELECT id FROM profiles WHERE 'admin' = ANY(roles);

-- Display admin users that will be preserved
DO $$
DECLARE
    admin_count INTEGER;
    admin_list TEXT;
BEGIN
    SELECT COUNT(*), STRING_AGG(full_name || ' (' || id || ')', ', ')
    INTO admin_count, admin_list
    FROM profiles
    WHERE id IN (SELECT id FROM admin_users);

    RAISE NOTICE 'Preserving % admin user(s): %', admin_count, admin_list;
END $$;

-- 1. Delete reminders (except those belonging to admin users)
DELETE FROM reminders WHERE user_id NOT IN (SELECT id FROM admin_users);
RAISE NOTICE 'Deleted reminders (except admin)';

-- 2. Delete rental checklists (for non-admin rentals)
DELETE FROM rental_checklists
WHERE rental_id IN (
    SELECT id FROM rentals
    WHERE renter_id NOT IN (SELECT id FROM admin_users)
    OR owner_id NOT IN (SELECT id FROM admin_users)
);
RAISE NOTICE 'Deleted rental checklists';

-- 3. Delete rentals (except those involving admin users)
DELETE FROM rentals
WHERE renter_id NOT IN (SELECT id FROM admin_users)
AND owner_id NOT IN (SELECT id FROM admin_users);
RAISE NOTICE 'Deleted rentals';

-- 4. Delete maintenance records (for non-admin cars)
DELETE FROM maintenance_records
WHERE car_id IN (
    SELECT id FROM cars
    WHERE owner_id NOT IN (SELECT id FROM admin_users)
);
RAISE NOTICE 'Deleted maintenance records';

-- 5. Delete car pricing rules (for non-admin cars)
DELETE FROM car_pricing_rules
WHERE car_id IN (
    SELECT id FROM cars
    WHERE owner_id NOT IN (SELECT id FROM admin_users)
);
RAISE NOTICE 'Deleted car pricing rules';

-- 6. Delete car images (for non-admin cars)
DELETE FROM car_images
WHERE car_id IN (
    SELECT id FROM cars
    WHERE owner_id NOT IN (SELECT id FROM admin_users)
);
RAISE NOTICE 'Deleted car images';

-- 7. Delete cars (except those owned by admin)
DELETE FROM cars WHERE owner_id NOT IN (SELECT id FROM admin_users);
RAISE NOTICE 'Deleted cars';

-- 8. Delete verification documents (except for admin users)
DELETE FROM verification_documents WHERE user_id NOT IN (SELECT id FROM admin_users);
RAISE NOTICE 'Deleted verification documents';

-- 9. Delete profiles (except admin users)
DELETE FROM profiles WHERE id NOT IN (SELECT id FROM admin_users);
RAISE NOTICE 'Deleted non-admin profiles';

-- 10. Delete auth.users (except admin users)
-- This will cascade delete profiles due to ON DELETE CASCADE
DELETE FROM auth.users WHERE id NOT IN (SELECT id FROM admin_users);
RAISE NOTICE 'Deleted non-admin auth users';

-- Display final counts
DO $$
DECLARE
    profile_count INTEGER;
    car_count INTEGER;
    rental_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO profile_count FROM profiles;
    SELECT COUNT(*) INTO car_count FROM cars;
    SELECT COUNT(*) INTO rental_count FROM rentals;

    RAISE NOTICE '====================================';
    RAISE NOTICE 'Cleanup Complete!';
    RAISE NOTICE 'Remaining records:';
    RAISE NOTICE '  - Profiles: %', profile_count;
    RAISE NOTICE '  - Cars: %', car_count;
    RAISE NOTICE '  - Rentals: %', rental_count;
    RAISE NOTICE '====================================';
END $$;

-- Clean up temporary table
DROP TABLE admin_users;

-- Commit transaction
COMMIT;
