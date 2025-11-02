/**
 * Admin API for approving/denying user verifications
 */

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    // Check if user is authenticated and is admin
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('active_role')
      .eq('id', user.id)
      .single();

    if (profile?.active_role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
    }

    const body = await request.json();
    const { status, admin_notes, approve_as_role } = body;

    // Validate status
    if (!['verified', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be "verified" or "rejected"' },
        { status: 400 }
      );
    }

    // Get the user profile (new verification system uses profiles table directly)
    const { data: userProfile, error: profileFetchError } = await supabase
      .from('profiles')
      .select('id, full_name, roles, active_role, verification_status')
      .eq('id', id)
      .single();

    if (profileFetchError || !userProfile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    // Build update object
    const updateData: any = {
      verification_status: status,
      updated_at: new Date().toISOString(),
    };

    // If approved, update the user's roles
    if (status === 'verified' && approve_as_role) {
      const userRoles = userProfile.roles || ['renter'];

      // Add the new role if not already present
      const newRoles = userRoles.includes(approve_as_role)
        ? userRoles
        : [...userRoles, approve_as_role];

      updateData.roles = newRoles;
      updateData.active_role = approve_as_role;
    }

    // Update the profile
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update verification', details: updateError },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Verification ${status} successfully`,
      data: updatedProfile,
    });
  } catch (error: any) {
    console.error('Error processing verification:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
