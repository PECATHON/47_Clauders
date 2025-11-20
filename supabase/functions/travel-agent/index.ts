import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

interface AmadeusTokenResponse {
  access_token: string;
  expires_in: number;
}

interface AmadeusFlightOffer {
  id: string;
  price: {
    total: string;
    currency: string;
  };
  itineraries: Array<{
    duration: string;
    segments: Array<{
      departure: {
        iataCode: string;
        at: string;
      };
      arrival: {
        iataCode: string;
        at: string;
      };
      carrierCode: string;
      number: string;
      aircraft: {
        code: string;
      };
    }>;
  }>;
}

async function getAmadeusToken(): Promise<string> {
  const clientId = Deno.env.get('AMADEUS_API_KEY');
  const clientSecret = Deno.env.get('AMADEUS_API_SECRET');
  
  if (!clientId || !clientSecret) {
    throw new Error('Amadeus credentials not configured');
  }

  const response = await fetch('https://test.api.amadeus.com/v1/security/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `grant_type=client_credentials&client_id=${clientId}&client_secret=${clientSecret}`,
  });

  if (!response.ok) {
    throw new Error('Failed to get Amadeus access token');
  }

  const data: AmadeusTokenResponse = await response.json();
  return data.access_token;
}

async function searchAmadeusFlights(
  origin: string,
  destination: string,
  date: string,
  adults: number = 1
): Promise<AmadeusFlightOffer[]> {
  const token = await getAmadeusToken();
  
  const url = new URL('https://test.api.amadeus.com/v2/shopping/flight-offers');
  url.searchParams.append('originLocationCode', origin);
  url.searchParams.append('destinationLocationCode', destination);
  url.searchParams.append('departureDate', date);
  url.searchParams.append('adults', adults.toString());
  url.searchParams.append('max', '5');

  const response = await fetch(url.toString(), {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to search flights');
  }

  const data = await response.json();
  return data.data || [];
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Message {
  role: string;
  content: string;
  agent_type?: string;
}

interface AgentContext {
  conversationId: string;
  messages: Message[];
  currentAgent?: string;
  interruptedAgent?: string;
  partialResults?: any;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, conversationId, interrupt = false } = await req.json();
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get conversation history
    const { data: messages } = await supabaseClient
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    // Determine intent and route to appropriate agent
    const intent = await detectIntent(message);
    console.log('Detected intent:', intent);

    // Create user message
    await supabaseClient.from('messages').insert({
      conversation_id: conversationId,
      role: 'user',
      content: message,
    });

    // Route to appropriate agent(s)
    let response: string;
    let agentType: string;

    if (intent.includes('both') || (intent.includes('flight') && intent.includes('hotel'))) {
      agentType = 'coordinator';
      response = await coordinatorAgent(message, messages || [], conversationId, supabaseClient);
    } else if (intent.includes('flight')) {
      agentType = 'flight';
      response = await flightAgent(message, messages || [], conversationId, supabaseClient);
    } else if (intent.includes('hotel')) {
      agentType = 'hotel';
      response = await hotelAgent(message, messages || [], conversationId, supabaseClient);
    } else {
      agentType = 'coordinator';
      response = await coordinatorAgent(message, messages || [], conversationId, supabaseClient);
    }

    // Save assistant response
    await supabaseClient.from('messages').insert({
      conversation_id: conversationId,
      role: 'assistant',
      content: response,
      agent_type: agentType,
      agent_status: 'completed',
    });

    return new Response(
      JSON.stringify({ response, agent: agentType }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in travel-agent function:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Unknown error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function detectIntent(message: string): Promise<string[]> {
  const lowerMessage = message.toLowerCase();
  const intents: string[] = [];

  if (lowerMessage.includes('flight') || lowerMessage.includes('fly') || lowerMessage.includes('airline')) {
    intents.push('flight');
  }
  if (lowerMessage.includes('hotel') || lowerMessage.includes('accommodation') || lowerMessage.includes('stay')) {
    intents.push('hotel');
  }
  if (intents.length === 0) {
    intents.push('general');
  }

  return intents;
}

async function coordinatorAgent(
  message: string,
  history: Message[],
  conversationId: string,
  supabase: any
): Promise<string> {
  console.log('Coordinator agent processing request...');
  
  // Update status to thinking
  await supabase.from('messages').insert({
    conversation_id: conversationId,
    role: 'agent',
    content: 'Analyzing your request...',
    agent_type: 'coordinator',
    agent_status: 'thinking',
  });

  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) {
    throw new Error('LOVABLE_API_KEY not configured');
  }

  const systemPrompt = `You are a Travel Planning Coordinator. Be brief and direct.

Format rules:
- Keep responses under 100 words when possible
- Use **bold** for key details only
- Use bullet points for options
- Use ## for section headings
- Get straight to the point

Provide clear, actionable advice without extra explanations.`;

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: systemPrompt },
        ...history.map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: message },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('AI API error:', response.status, errorText);
    throw new Error('Failed to get response from AI');
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function flightAgent(
  message: string,
  history: Message[],
  conversationId: string,
  supabase: any
): Promise<string> {
  console.log('Flight agent processing request...');
  
  // Update status to searching
  await supabase.from('messages').insert({
    conversation_id: conversationId,
    role: 'agent',
    content: 'Searching for flights...',
    agent_type: 'flight',
    agent_status: 'searching',
  });

  // Try to extract flight search parameters from the message
  const originMatch = message.match(/from\s+([a-zA-Z\s]+?)(?:\s+to|\s+for)/i);
  const destMatch = message.match(/to\s+([a-zA-Z\s]+?)(?:\s+on|\s+for|$)/i);
  const dateMatch = message.match(/(?:on|for)\s+([0-9]{1,2}(?:st|nd|rd|th)?\s+[a-zA-Z]+|[0-9]{4}-[0-9]{2}-[0-9]{2}|tomorrow|today)/i);

  let amadeusResults = null;
  
  // If we can extract flight parameters, try Amadeus API
  if (originMatch && destMatch) {
    try {
      const origin = originMatch[1].trim().toUpperCase().slice(0, 3);
      const destination = destMatch[1].trim().toUpperCase().slice(0, 3);
      
      // Parse date or use tomorrow as default
      let searchDate = new Date();
      searchDate.setDate(searchDate.getDate() + 1);
      const dateStr = searchDate.toISOString().split('T')[0];
      
      console.log(`Searching Amadeus: ${origin} -> ${destination} on ${dateStr}`);
      const flights = await searchAmadeusFlights(origin, destination, dateStr);
      
      if (flights.length > 0) {
        amadeusResults = flights.slice(0, 3).map(flight => {
          const segment = flight.itineraries[0].segments[0];
          const stops = flight.itineraries[0].segments.length - 1;
          
          return `**${segment.carrierCode} ${segment.number}**
- **${flight.price.currency} ${flight.price.total}** | ${flight.itineraries[0].duration.replace('PT', '').toLowerCase()} | ${stops === 0 ? 'Direct' : `${stops} stop(s)`}`;
        }).join('\n\n');
      }
    } catch (error) {
      console.error('Amadeus API error:', error);
      // Fall back to AI if Amadeus fails
    }
  }

  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) {
    throw new Error('LOVABLE_API_KEY not configured');
  }

  const systemPrompt = amadeusResults 
    ? `You are a Flight Search Specialist. Here are real-time flight results from Amadeus:

${amadeusResults}

Present these results in a clear, brief format. Add any relevant travel tips or recommendations.`
    : `You are a Flight Search Specialist. Be brief and focused.

Format:
## Flights: [Origin] → [Destination]

**Option 1** - [Airline]
- **$XXX** | Xh Xm | Direct/1 stop

Keep responses under 150 words. List 2-3 best options with only essential details: price, duration, stops. Skip verbose descriptions.`;

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: systemPrompt },
        ...history.map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: message },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('AI API error:', response.status, errorText);
    throw new Error('Failed to get response from AI');
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function hotelAgent(
  message: string,
  history: Message[],
  conversationId: string,
  supabase: any
): Promise<string> {
  console.log('Hotel agent processing request...');
  
  // Update status to searching
  await supabase.from('messages').insert({
    conversation_id: conversationId,
    role: 'agent',
    content: 'Searching for hotels...',
    agent_type: 'hotel',
    agent_status: 'searching',
  });

  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) {
    throw new Error('LOVABLE_API_KEY not configured');
  }

  const systemPrompt = `You are a Hotel Search Specialist. Be brief and direct.

Format:
## Hotels in [Location]

**[Hotel]** ⭐⭐⭐⭐
- **$XXX/night** | [Area]
- WiFi, Pool, Gym

Keep responses under 150 words. List 2-3 best options with only essential info: price, location, key amenities. No lengthy descriptions.`;

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: systemPrompt },
        ...history.map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: message },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('AI API error:', response.status, errorText);
    throw new Error('Failed to get response from AI');
  }

  const data = await response.json();
  return data.choices[0].message.content;
}