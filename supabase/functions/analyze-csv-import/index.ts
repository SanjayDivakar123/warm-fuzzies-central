import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CSVAnalysisRequest {
  csvContent: string;
  sampleRows: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { csvContent, sampleRows = 5 }: CSVAnalysisRequest = await req.json();

    if (!csvContent) {
      return new Response(
        JSON.stringify({ error: 'CSV content is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse CSV to get headers and sample data
    const lines = csvContent.trim().split('\n');
    if (lines.length < 2) {
      return new Response(
        JSON.stringify({ error: 'CSV must have at least a header row and one data row' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Simple CSV parsing (handles basic cases)
    const parseCSVLine = (line: string): string[] => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };

    const headers = parseCSVLine(lines[0]);
    const dataRows = lines.slice(1, Math.min(lines.length, sampleRows + 1)).map(parseCSVLine);
    const totalRows = lines.length - 1;

    // Build sample data for AI analysis
    const sampleData = dataRows.map(row => {
      const obj: Record<string, string> = {};
      headers.forEach((header, idx) => {
        obj[header] = row[idx] || '';
      });
      return obj;
    });

    // Use Perplexity to analyze the CSV structure
    const PERPLEXITY_API_KEY = Deno.env.get('PERPLEXITY_API_KEY');
    if (!PERPLEXITY_API_KEY) {
      // Fallback: Try to detect columns without AI
      return new Response(
        JSON.stringify({
          headers,
          sampleData,
          totalRows,
          mapping: detectColumnsManually(headers, sampleData),
          aiAnalyzed: false
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const prompt = `Analyze this CSV data and identify which columns contain:
1. Email addresses (required)
2. Full names or first name + last name
3. Job roles/titles
4. Any other relevant employee information

CSV Headers: ${JSON.stringify(headers)}

Sample Data (first ${sampleData.length} rows):
${JSON.stringify(sampleData, null, 2)}

Respond ONLY with a valid JSON object in this exact format (no markdown, no explanation):
{
  "emailColumn": "exact header name for email column or null",
  "fullNameColumn": "exact header name for full name column or null",
  "firstNameColumn": "exact header name for first name column or null",
  "lastNameColumn": "exact header name for last name column or null",
  "jobRoleColumn": "exact header name for job/role/title column or null",
  "confidence": "high/medium/low",
  "notes": "brief explanation of mapping decisions"
}`;

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          {
            role: 'system',
            content: 'You are a data analyst. Analyze CSV column headers and sample data to identify email, name, and job role columns. Respond ONLY with valid JSON, no markdown formatting.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      console.error('Perplexity API error:', await response.text());
      // Fallback to manual detection
      return new Response(
        JSON.stringify({
          headers,
          sampleData,
          totalRows,
          mapping: detectColumnsManually(headers, sampleData),
          aiAnalyzed: false
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content || '';
    
    // Parse AI response
    let mapping;
    try {
      // Try to extract JSON from the response (handle potential markdown wrapping)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        mapping = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      mapping = detectColumnsManually(headers, sampleData);
    }

    return new Response(
      JSON.stringify({
        headers,
        sampleData,
        totalRows,
        mapping,
        aiAnalyzed: true
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error analyzing CSV:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to analyze CSV' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function detectColumnsManually(headers: string[], sampleData: Record<string, string>[]): any {
  const lowerHeaders = headers.map(h => h.toLowerCase());
  
  // Email detection
  let emailColumn = null;
  const emailPatterns = ['email', 'e-mail', 'mail', 'email address', 'emailaddress'];
  for (const pattern of emailPatterns) {
    const idx = lowerHeaders.findIndex(h => h.includes(pattern));
    if (idx >= 0) {
      emailColumn = headers[idx];
      break;
    }
  }
  // Fallback: check sample data for email patterns
  if (!emailColumn && sampleData.length > 0) {
    for (const header of headers) {
      const value = sampleData[0][header];
      if (value && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        emailColumn = header;
        break;
      }
    }
  }

  // Full name detection
  let fullNameColumn = null;
  const namePatterns = ['full name', 'fullname', 'name', 'employee name', 'display name'];
  for (const pattern of namePatterns) {
    const idx = lowerHeaders.findIndex(h => h === pattern || h.includes(pattern));
    if (idx >= 0) {
      fullNameColumn = headers[idx];
      break;
    }
  }

  // First name detection
  let firstNameColumn = null;
  const firstNamePatterns = ['first name', 'firstname', 'first', 'given name'];
  for (const pattern of firstNamePatterns) {
    const idx = lowerHeaders.findIndex(h => h === pattern || h.includes(pattern));
    if (idx >= 0) {
      firstNameColumn = headers[idx];
      break;
    }
  }

  // Last name detection
  let lastNameColumn = null;
  const lastNamePatterns = ['last name', 'lastname', 'last', 'surname', 'family name'];
  for (const pattern of lastNamePatterns) {
    const idx = lowerHeaders.findIndex(h => h === pattern || h.includes(pattern));
    if (idx >= 0) {
      lastNameColumn = headers[idx];
      break;
    }
  }

  // Job role detection
  let jobRoleColumn = null;
  const rolePatterns = ['role', 'job', 'title', 'position', 'job title', 'job role', 'department'];
  for (const pattern of rolePatterns) {
    const idx = lowerHeaders.findIndex(h => h === pattern || h.includes(pattern));
    if (idx >= 0) {
      jobRoleColumn = headers[idx];
      break;
    }
  }

  return {
    emailColumn,
    fullNameColumn,
    firstNameColumn,
    lastNameColumn,
    jobRoleColumn,
    confidence: emailColumn ? 'medium' : 'low',
    notes: 'Detected using pattern matching (AI unavailable)'
  };
}
