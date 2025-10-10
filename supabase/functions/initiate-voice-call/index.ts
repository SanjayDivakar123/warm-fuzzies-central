import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const blandApiKey = Deno.env.get('BLAND_APIKEY');
    if (!blandApiKey) {
      throw new Error('BLAND_APIKEY not configured');
    }

    const { phone_number } = await req.json();
    
    if (!phone_number) {
      return new Response(
        JSON.stringify({ error: 'Phone number is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Initiating call to:', phone_number);

    // Create a unique session ID
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Initialize the voice assessment record in Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error: dbError } = await supabase
      .from('voice_assessments')
      .insert({
        session_id: sessionId,
        phone_number,
        assessment_type: 'professional_25q',
        status: 'initiated',
        score_yellow: 0,
        score_red: 0,
        score_green: 0,
        score_blue: 0,
      });

    if (dbError) {
      console.error('Database error:', dbError);
      throw dbError;
    }

    // Call Bland AI API to initiate the call
    const blandResponse = await fetch('https://api.bland.ai/v1/calls', {
      method: 'POST',
      headers: {
        'Authorization': blandApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone_number,
        task: 'You are conducting a professional RoleColorFinder assessment. Ask 25 questions about work style and team dynamics. For each question, read the question and 4 options (A, B, C, D). Wait for the user to respond with their choice. After collecting all 25 answers, thank them and end the call.',
        model: 'enhanced',
        voice: 'matt',
        webhook: `https://qbuxoetprodjxpagfkoi.supabase.co/functions/v1/voiceAssessment`,
        metadata: {
          session_id: sessionId,
        },
      }),
    });

    const blandData = await blandResponse.json();

    if (!blandResponse.ok) {
      console.error('Bland API error:', blandData);
      throw new Error(blandData.message || 'Failed to initiate call');
    }

    console.log('Call initiated successfully:', blandData);

    return new Response(
      JSON.stringify({ 
        success: true, 
        session_id: sessionId,
        call_id: blandData.call_id,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in initiate-voice-call:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
