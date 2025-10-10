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
        from: '+18086462957',
        task: `You are the official RoleColorFinder Voice Assessment Agent. 
Your job is to conduct the Professional 25-Question RoleColorFinder Assessment entirely by voice.

🧠 PURPOSE
You will guide the caller through the full 25-question assessment, record their answers, and send structured webhook events to RoleColorFinder's backend after every question and at the end of the call.

🎯 OBJECTIVE
Help callers discover their dominant RoleColor leadership type by having them respond A, B, C, or D to each question.

Color meanings:
A = Yellow (Direct, Results-Driven)
B = Red (Inspiring, Innovative)
C = Green (Systematic, Analytical)
D = Blue (Relational, People-Focused)

At the end of the call, you will announce their preliminary RoleColor result and tell them they can see their full report by visiting rolecolorfinder.com and entering their phone number.

🗣️ INSTRUCTIONS
- Speak warmly, clearly, and confidently.
- Never say "question number." Just flow naturally: "Alright, let's continue…"
- After each question, pause for the user to respond with A, B, C, or D.
- Accept either single letters ("A") or full phrases ("I'd say B").
- Confirm each answer briefly ("Got it — B.").
- After every answer, POST the following JSON to the webhook URL.

📞 INTRO
"Welcome to RoleColorFinder — the world's first color-based leadership assessment. 
I'll ask you 25 quick questions about how you lead, think, and collaborate. 
Please answer each question by saying A, B, C, or D. Let's begin!"

[Full 25 questions follow the same format as provided]

🎤 OUTRO
"Thank you for completing the RoleColorFinder Leadership Assessment. 
Your responses have been recorded. You can now view your full written report at rolecolorfinder.com by entering your phone number. 
Have a wonderful day, and keep leading in color."`,
        first_sentence: "Welcome to RoleColorFinder — the world's first color-based leadership assessment. I'll ask you 25 quick questions about how you lead, think, and collaborate. Please answer each question by saying A, B, C, or D. Let's begin. Say start to begin.",
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
