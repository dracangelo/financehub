import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// Enable detailed logging
const DEBUG = true;

function log(...args: any[]) {
  if (DEBUG) {
    console.log('[PROFILE_API]', ...args);
  }
}

// GET /api/profile - Get current user profile
export async function GET(req: NextRequest) {
  try {
    log('GET /api/profile - Starting');
    
    const supabase = await createServerSupabaseClient();
    if (!supabase) {
      log('ERROR: Failed to create Supabase client');
      return NextResponse.json({ error: "Failed to create Supabase client" }, { status: 500 });
    }

    log('Getting authenticated user...');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      log('ERROR: No authenticated user found');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    log('Authenticated user ID:', user.id);

    // Get user profile from the users table
    log('Fetching user profile from database...');
    const { data, error } = await supabase
      .from('users')
      .select(`
        id,
        username,
        full_name,
        email,
        avatar_url,
        user_role,
        theme,
        currency_code,
        timezone,
        onboarding_completed,
        phone
      `)
      .eq('id', user.id)
      .single();

    if (error) {
      log('ERROR fetching user profile:', error.message);
      return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
    }

    log('Profile fetched successfully');
    return NextResponse.json(data);
  } catch (error) {
    log('CRITICAL ERROR in GET /api/profile:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/profile - Update user profile
export async function PATCH(req: NextRequest) {
  try {
    log('PATCH /api/profile - Starting');
    
    const supabase = await createServerSupabaseClient();
    if (!supabase) {
      log('ERROR: Failed to create Supabase client');
      return NextResponse.json({ error: "Failed to create Supabase client" }, { status: 500 });
    }

    log('Getting authenticated user...');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      log('ERROR: No authenticated user found');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    log('Authenticated user ID:', user.id);

    log('Parsing request body...');
    const body = await req.json();
    log('Request body keys:', Object.keys(body));
    const { first_name, last_name, avatar_base64, ...otherFields } = body;

    // Combine first and last name into full_name
    const updates: Record<string, any> = {
      ...otherFields
    };
    log('Initial updates:', Object.keys(updates));

    // Process base64 image if provided
    if (avatar_base64) {
      log('Processing base64 image data...');
      // Validate that it's a proper base64 image
      if (avatar_base64.startsWith('data:image/')) {
        // Truncate the base64 string if it's too long (most databases have limits)
        // This is a simple approach - a better one would be to resize the image before encoding
        const maxLength = 1000000; // 1MB limit for base64 data
        if (avatar_base64.length > maxLength) {
          log('WARNING: Base64 image data too large, truncating');
          // Just store the first part of the string to avoid database issues
          updates.avatar_url = avatar_base64.substring(0, maxLength);
        } else {
          updates.avatar_url = avatar_base64;
        }
        log('Profile picture updated with base64 data');
      } else {
        log('ERROR: Invalid image data format');
        return NextResponse.json({ error: "Invalid image data format" }, { status: 400 });
      }
    }

    if (first_name || last_name) {
      log('Processing name update...');
      // Only update if at least one name field is provided
      const currentProfile = await supabase
        .from('users')
        .select('full_name')
        .eq('id', user.id)
        .single();
      
      if (currentProfile.error) {
        log('ERROR fetching current profile for name update:', currentProfile.error.message);
      }
      
      const currentFullName = currentProfile.data?.full_name || '';
      log('Current full name:', currentFullName);
      const [currentFirst, currentLast] = currentFullName.split(' ');
      
      updates.full_name = `${first_name || currentFirst || ''} ${last_name || currentLast || ''}`.trim();
      log('New full name:', updates.full_name);
    }

    // Check if we have any updates to make
    if (Object.keys(updates).length === 0) {
      log('No updates provided in request');
      return NextResponse.json({ error: "No updates provided" }, { status: 400 });
    }
    
    log('Final updates to apply:', Object.keys(updates));

    // First check if the user record exists
    log('Checking if user record exists...');
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('id', user.id)
      .single();

    if (checkError) {
      log('ERROR checking user existence:', checkError.message);
      
      // If the user doesn't exist, create a new record
      if (checkError.code === 'PGRST116') { // Record not found error
        log('User record not found, creating new record...');
        const { data: insertData, error: insertError } = await supabase
          .from('users')
          .insert({
            id: user.id,
            email: user.email,
            ...updates
          })
          .select();

        if (insertError) {
          log('ERROR creating user record:', insertError.message);
          return NextResponse.json({ error: `Failed to create profile: ${insertError.message}` }, { status: 500 });
        }

        log('User record created successfully');
        return NextResponse.json(insertData[0]);
      }
      
      return NextResponse.json({ error: `Failed to check profile: ${checkError.message}` }, { status: 500 });
    }

    // Update user profile
    log('Updating user profile...');
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', user.id)
      .select();

    if (error) {
      log('ERROR updating user profile:', error.message);
      return NextResponse.json({ error: `Failed to update profile: ${error.message}` }, { status: 500 });
    }

    log('Profile updated successfully');
    return NextResponse.json(data[0]);
  } catch (error) {
    log('CRITICAL ERROR in PATCH /api/profile:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
