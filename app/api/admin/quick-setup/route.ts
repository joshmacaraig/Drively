/**
 * Quick Admin Setup - All in One
 * This endpoint creates the admin user directly without requiring migration
 * It will work even if the RLS policies aren't set up yet
 */

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { secret } = await request.json();

    // Simple security check
    if (secret !== 'setup-admin-2025') {
      return NextResponse.json(
        { error: 'Invalid secret' },
        { status: 401 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!supabaseUrl || !supabaseServiceKey || supabaseServiceKey === 'your-service-role-key') {
      return NextResponse.json(
        {
          error: 'Missing or invalid Supabase credentials',
          message: 'Please update SUPABASE_SERVICE_ROLE_KEY in your .env.local file with your actual service role key from Supabase Dashboard → Settings → API'
        },
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

    console.log('Step 1: Checking if user exists...');

    // Check if user already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === email);

    let userId: string;

    if (existingUser) {
      console.log('User already exists:', existingUser.id);
      userId = existingUser.id;

      return NextResponse.json({
        success: true,
        message: 'User already exists. Updating to admin role...',
        userId,
        step: 'updating_profile'
      });
    } else {
      console.log('Step 2: Creating new auth user...');

      // Create the auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: 'Admin User',
        }
      });

      if (authError) {
        console.error('Auth error:', authError);
        return NextResponse.json(
          { error: 'Failed to create auth user', details: authError.message },
          { status: 500 }
        );
      }

      userId = authData.user.id;
      console.log('Created new user:', userId);

      // Wait a bit for the profile trigger to create the profile
      await new Promise(resolve => setTimeout(resolve, 2000));

      console.log('Step 3: Updating profile to admin role...');

      // Update the profile to admin - using service role bypasses RLS
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
        console.error('Profile error:', profileError);
        return NextResponse.json(
          { error: 'Failed to update profile', details: profileError.message },
          { status: 500 }
        );
      }

      console.log('Profile updated successfully:', profile);

      return NextResponse.json({
        success: true,
        message: 'Admin user created successfully! You can now login.',
        data: {
          userId,
          email,
          profile,
        },
        credentials: {
          email: 'bajejosh+admin@gmail.com',
          password: '1'
        }
      });
    }
  } catch (error: any) {
    console.error('Setup error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
