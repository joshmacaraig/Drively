import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { email, fullName, phoneNumber } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Check if user is authenticated and is an owner
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user exists by email (need to use auth API)
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

    const existingUser = users?.find(u => u.email === email);

    if (existingUser) {
      return NextResponse.json({
        renterId: existingUser.id,
        isNewUser: false
      });
    }

    // Create new auth user with admin API
    const { data: newUser, error: signUpError } = await supabase.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        phone_number: phoneNumber,
      }
    });

    if (signUpError || !newUser.user) {
      console.error('Error creating user:', signUpError);
      return NextResponse.json(
        { error: signUpError?.message || 'Failed to create user' },
        { status: 500 }
      );
    }

    // Wait for profile trigger to complete
    await new Promise(resolve => setTimeout(resolve, 500));

    return NextResponse.json({
      renterId: newUser.user.id,
      isNewUser: true
    });

  } catch (error) {
    console.error('Error in create-guest-renter:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
