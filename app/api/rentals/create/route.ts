import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const {
      car_id,
      owner_id,
      renter_id,
      start_datetime,
      end_datetime,
      total_amount,
      pickup_location,
      return_location,
      notes,
    } = body;

    // Validate required fields
    if (!car_id || !owner_id || !renter_id || !start_datetime || !end_datetime || !total_amount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify the authenticated user is the renter
    if (user.id !== renter_id) {
      return NextResponse.json(
        { error: 'Unauthorized - user mismatch' },
        { status: 403 }
      );
    }

    // Check if renter is verified
    const { data: profile } = await supabase
      .from('profiles')
      .select('verification_status')
      .eq('id', renter_id)
      .single();

    if (!profile || profile.verification_status !== 'verified') {
      return NextResponse.json(
        { error: 'Renter must be verified to create bookings' },
        { status: 403 }
      );
    }

    // Verify the car exists and is active
    const { data: car, error: carError } = await supabase
      .from('cars')
      .select('id, is_active, owner_id')
      .eq('id', car_id)
      .single();

    if (carError || !car) {
      return NextResponse.json({ error: 'Car not found' }, { status: 404 });
    }

    if (!car.is_active) {
      return NextResponse.json(
        { error: 'Car is not available for booking' },
        { status: 400 }
      );
    }

    // Verify owner_id matches the car's owner
    if (car.owner_id !== owner_id) {
      return NextResponse.json(
        { error: 'Owner ID does not match car owner' },
        { status: 400 }
      );
    }

    // Check for date conflicts with existing rentals
    const { data: conflictingRentals, error: conflictError } = await supabase
      .from('rentals')
      .select('id')
      .eq('car_id', car_id)
      .in('status', ['pending', 'confirmed', 'active'])
      .or(
        `and(start_datetime.lte.${end_datetime},end_datetime.gte.${start_datetime})`
      );

    if (conflictError) {
      console.error('Error checking conflicts:', conflictError);
      return NextResponse.json(
        { error: 'Failed to check date availability' },
        { status: 500 }
      );
    }

    if (conflictingRentals && conflictingRentals.length > 0) {
      return NextResponse.json(
        { error: 'Vehicle is already booked for the selected dates' },
        { status: 409 }
      );
    }

    // Validate dates
    const startDate = new Date(start_datetime);
    const endDate = new Date(end_datetime);
    const now = new Date();

    if (startDate < now) {
      return NextResponse.json(
        { error: 'Start date cannot be in the past' },
        { status: 400 }
      );
    }

    if (endDate <= startDate) {
      return NextResponse.json(
        { error: 'End date must be after start date' },
        { status: 400 }
      );
    }

    // Create the rental
    const { data: rental, error: rentalError } = await supabase
      .from('rentals')
      .insert({
        car_id,
        owner_id,
        renter_id,
        start_datetime,
        end_datetime,
        status: 'pending',
        total_amount,
        pickup_location: pickup_location || null,
        return_location: return_location || null,
        notes: notes || null,
        pickup_checklist_completed: false,
        return_checklist_completed: false,
      })
      .select()
      .single();

    if (rentalError) {
      console.error('Error creating rental:', rentalError);
      return NextResponse.json(
        { error: 'Failed to create booking' },
        { status: 500 }
      );
    }

    // TODO: Send notification to owner about new booking request
    // TODO: Send confirmation email to renter

    return NextResponse.json(
      {
        success: true,
        rental,
        message: 'Booking request created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Unexpected error in rental creation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
