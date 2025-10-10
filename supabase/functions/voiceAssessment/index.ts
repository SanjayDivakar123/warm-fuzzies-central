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

    let body: any = {};
    try {
      body = await req.json();
    } catch (_e) {
      console.error('voiceAssessment: empty or invalid JSON body');
      body = {};
    }
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
    const rawAnswer = body.answer ?? body.choice ?? body.value ?? body.digit ?? body.selected_option ?? body.response ?? body.variables?.answer ?? body.variables?.choice ?? body.data?.answer;
    let answer = typeof rawAnswer === 'string' ? rawAnswer.trim().toUpperCase() : undefined;
    if (answer && /^[1-4]$/.test(answer)) {
      const map: Record<string,string> = { '1':'A','2':'B','3':'C','4':'D' };
      answer = map[answer];
    }

    // Validate identifiers based on event type
    const isCompletionEvent = (event === 'call_completed' || body.completed === true);
    const isQuestionEvent = (event === 'question_answered');

    // For both events, allow either session_id OR phone_number (at least one)
    if (((isQuestionEvent || isCompletionEvent) && (!session_id && !phone_number))) {
      console.error('Missing identifiers for event', { event, session_id, phone_number });
      return new Response(
        JSON.stringify({ error: 'Missing required identifiers' }),
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

      // Fetch existing assessment by session if provided, otherwise by phone (latest)
      let existing: any = null;
      if (session_id) {
        const resp = await supabase
          .from('voice_assessments')
          .select('*')
          .eq('session_id', session_id)
          .maybeSingle();
        existing = resp.data;
      }
      if (!existing && phone_number) {
        const resp2 = await supabase
          .from('voice_assessments')
          .select('*')
          .eq('phone_number', phone_number)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        existing = resp2.data;
      }
      if (!existing) {
        console.error('No existing assessment found to update scores', { session_id, phone_number });
        return new Response(
          JSON.stringify({ error: 'Assessment not found for scoring' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const scores = {
        score_yellow: existing.score_yellow || 0,
        score_red: existing.score_red || 0,
        score_green: existing.score_green || 0,
        score_blue: existing.score_blue || 0,
      };

      // Increment the correct color score
      scores[`score_${color}` as keyof typeof scores] += 1;

      // Update the existing record by id and mark in_progress
      const { error: updateErr } = await supabase
        .from('voice_assessments')
        .update({
          ...scores,
          status: 'in_progress',
        })
        .eq('id', existing.id);

      if (updateErr) {
        console.error('Update error:', updateErr);
        return new Response(
          JSON.stringify({ error: updateErr.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`Updated ${color} score for session ${session_id}`);
      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (event === 'call_completed' || body.completed === true) {
      // Retrieve the assessment record by session if available, then fallback by phone
      let assessment: any = null;
      let fetchError: any = null;

      if (session_id) {
        const resp = await supabase
          .from('voice_assessments')
          .select('*')
          .eq('session_id', session_id)
          .maybeSingle();
        assessment = resp.data;
        fetchError = resp.error;
      }

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
        .eq('id', assessment.id);

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
