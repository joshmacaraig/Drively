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
    if (!['approved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be "approved" or "rejected"' },
        { status: 400 }
      );
    }

    // Get the verification document
    const { data: verification, error: verificationError } = await supabase
      .from('verification_documents')
      .select('*, user:profiles!user_id(id, full_name, roles, active_role)')
      .eq('id', id)
      .single();

    if (verificationError || !verification) {
      return NextResponse.json(
        { error: 'Verification not found' },
        { status: 404 }
      );
    }

    // Update the verification document
    const { data: updatedVerification, error: updateError } = await supabase
      .from('verification_documents')
      .update({
        status,
        admin_notes,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update verification', details: updateError },
        { status: 500 }
      );
    }

    // If approved, update the user's roles and verification status
    if (status === 'approved' && approve_as_role) {
      const userRoles = verification.user.roles || ['renter'];

      // Add the new role if not already present
      const newRoles = userRoles.includes(approve_as_role)
        ? userRoles
        : [...userRoles, approve_as_role];

      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          roles: newRoles,
          active_role: approve_as_role,
          verification_status: 'verified', // Update verification status for legacy compatibility
        })
        .eq('id', verification.user_id);

      if (profileError) {
        console.error('Failed to update user roles:', profileError);
        // Don't fail the whole operation, just log it
      }
    } else if (status === 'rejected') {
      // If rejected, update verification status to rejected
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          verification_status: 'rejected',
        })
        .eq('id', verification.user_id);

      if (profileError) {
        console.error('Failed to update verification status:', profileError);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Verification ${status} successfully`,
      data: updatedVerification,
    });
  } catch (error: any) {
    console.error('Error processing verification:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
