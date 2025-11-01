/**
 * Admin Setup API Route
 * This route creates the admin user and applies admin policies
 * Only run this once during initial setup
 */

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { secret } = await request.json();

    // Simple security check - you can change this secret
    if (secret !== 'setup-admin-2025') {
      return NextResponse.json(
        { error: 'Invalid secret' },
        { status: 401 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Missing Supabase credentials' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const email = 'bajejosh+admin@gmail.com';
    const password = '1';

    // Check if user already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === email);

    let userId: string;

    if (existingUser) {
      console.log('User already exists:', existingUser.id);
      userId = existingUser.id;
    } else {
      // Create the auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

      if (authError) {
        return NextResponse.json(
          { error: 'Failed to create auth user', details: authError },
          { status: 500 }
        );
      }

      userId = authData.user.id;
      console.log('Created new user:', userId);
    }

    // Update the profile to admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .update({
        active_role: 'admin',
        roles: ['admin', 'renter', 'car_owner'],
        full_name: 'Admin User',
      })
      .eq('id', userId)
      .select()
      .single();

    if (profileError) {
      return NextResponse.json(
        { error: 'Failed to update profile', details: profileError },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Admin user created successfully',
      data: {
        userId,
        email,
        profile,
      },
    });
  } catch (error) {
    console.error('Setup error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error },
      { status: 500 }
    );
  }
}
