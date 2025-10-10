import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    console.log('Received webhook:', JSON.stringify(body, null, 2));

    // Normalize incoming payloads (supports Bland completion payloads)
    const event = body.event ?? (body.completed ? 'call_completed' : undefined);
    const session_id = body.session_id 
      ?? body.metadata?.session_id 
      ?? body.variables?.metadata?.session_id 
      ?? body.variables?.session_id;
    const phone_number = body.phone_number 
      ?? body.variables?.phone_number 
      ?? body.to 
      ?? body.variables?.to;
    const answer = body.answer;

    if (!session_id || !phone_number) {
      console.error('Missing identifiers, derived values:', { session_id, phone_number });
      return new Response(
        JSON.stringify({ error: 'Missing session_id or phone_number' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (event === 'question_answered') {
      // Map answer to color
      const colorMap: Record<string, string> = {
        'A': 'yellow',
        'B': 'red',
        'C': 'green',
        'D': 'blue',
      };

      const color = colorMap[answer];
      if (!color) {
        console.error('Invalid answer received:', answer);
        return new Response(
          JSON.stringify({ error: 'Invalid answer value' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Fetch existing record or prepare new one
      const { data: existing } = await supabase
        .from('voice_assessments')
        .select('*')
        .eq('session_id', session_id)
        .maybeSingle();

      const scores = {
        score_yellow: existing?.score_yellow || 0,
        score_red: existing?.score_red || 0,
        score_green: existing?.score_green || 0,
        score_blue: existing?.score_blue || 0,
      };

      // Increment the correct color score
      scores[`score_${color}` as keyof typeof scores] += 1;

      // Upsert the record
      const { error: upsertError } = await supabase
        .from('voice_assessments')
        .upsert({
          session_id,
          phone_number,
          assessment_type: 'professional_25q',
          ...scores,
          status: 'in_progress',
        }, {
          onConflict: 'session_id',
        });

      if (upsertError) {
        console.error('Upsert error:', upsertError);
        return new Response(
          JSON.stringify({ error: upsertError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`Updated ${color} score for session ${session_id}`);
      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (event === 'call_completed' || body.completed === true) {
      // Retrieve the assessment record by session first, then fallback by phone
      let { data: assessment, error: fetchError } = await supabase
        .from('voice_assessments')
        .select('*')
        .eq('session_id', session_id)
        .maybeSingle();

      if ((!assessment || fetchError) && phone_number) {
        const { data: fallback, error: fallbackError } = await supabase
          .from('voice_assessments')
          .select('*')
          .eq('phone_number', phone_number)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (fallback) assessment = fallback;
        if (!assessment) fetchError = fallbackError ?? fetchError;
      }

      if (!assessment) {
        console.error('Assessment not found for session or phone:', { session_id, phone_number, fetchError });
        return new Response(
          JSON.stringify({ error: 'Assessment not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Determine dominant color
      const scores = {
        yellow: assessment.score_yellow,
        red: assessment.score_red,
        green: assessment.score_green,
        blue: assessment.score_blue,
      };

      const dominantColor = Object.entries(scores).reduce((a, b) => 
        scores[a[0] as keyof typeof scores] > scores[b[0] as keyof typeof scores] ? a : b
      )[0];

      // Update record with dominant color and complete status
      const { error: updateError } = await supabase
        .from('voice_assessments')
        .update({
          dominant_color: dominantColor,
          status: 'complete',
        })
        .eq('session_id', session_id);

      if (updateError) {
        console.error('Update error:', updateError);
        return new Response(
          JSON.stringify({ error: updateError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`Call completed for session ${session_id}, dominant color: ${dominantColor}`);
      return new Response(
        JSON.stringify({ success: true, dominant_color: dominantColor }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else {
      return new Response(
        JSON.stringify({ error: 'Unknown event type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Error in voiceAssessment function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
