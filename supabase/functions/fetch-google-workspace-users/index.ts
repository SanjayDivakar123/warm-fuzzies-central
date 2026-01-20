import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { accessToken, domain } = await req.json();

    if (!accessToken) {
      return new Response(
        JSON.stringify({ error: 'Access token is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Fetching Google Workspace users for domain:', domain);

    // Build the URL for the Google Admin Directory API
    let apiUrl = 'https://admin.googleapis.com/admin/directory/v1/users';
    const params = new URLSearchParams({
      maxResults: '500',
      orderBy: 'email',
    });

    // If domain is specified, filter by domain
    if (domain) {
      params.set('domain', domain);
    } else {
      // customer=my_customer gets all users in the organization
      params.set('customer', 'my_customer');
    }

    apiUrl += '?' + params.toString();

    console.log('Calling Google Admin API:', apiUrl);

    // Call the Google Admin Directory API
    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google API error:', response.status, errorText);
      
      // Parse common error messages
      if (response.status === 403) {
        return new Response(
          JSON.stringify({ 
            error: 'Access denied. Make sure you are a Google Workspace admin and have enabled the Admin SDK API in your Google Cloud Console.',
            details: errorText
          }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 401) {
        return new Response(
          JSON.stringify({ 
            error: 'Authentication expired. Please sign in again with Google.',
            details: errorText
          }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ 
          error: `Failed to fetch users from Google Workspace: ${response.status}`,
          details: errorText
        }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    
    console.log(`Successfully fetched ${data.users?.length || 0} users from Google Workspace`);

    // Transform the response to include only needed fields
    const users = (data.users || []).map((user: any) => ({
      id: user.id,
      primaryEmail: user.primaryEmail,
      name: {
        fullName: user.name?.fullName || `${user.name?.givenName || ''} ${user.name?.familyName || ''}`.trim(),
        givenName: user.name?.givenName,
        familyName: user.name?.familyName,
      },
      orgUnitPath: user.orgUnitPath,
      isAdmin: user.isAdmin || false,
      suspended: user.suspended || false,
    }));

    return new Response(
      JSON.stringify({ users }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in fetch-google-workspace-users:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'An unexpected error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
