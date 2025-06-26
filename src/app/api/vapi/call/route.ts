// File: app/api/vapi/call/route.ts (for Next.js App Router)
// OR: pages/api/vapi/call.ts (for Next.js Pages Router)

import { NextRequest, NextResponse } from 'next/server';

// IMPORTANT: Set these in your .env.local file
const VAPI_API_KEY = process.env.VAPI_API_KEY || '';
const VAPI_PHONE_NUMBER_ID = process.env.VAPI_PHONE_NUMBER_ID || ''; // Your Vapi phone number ID
const VAPI_ASSISTANT_ID = process.env.VAPI_ASSISTANT_ID || ''; // Your Vapi assistant ID

// For debugging - remove in production
console.log('VAPI_API_KEY exists:', !!VAPI_API_KEY);
console.log('VAPI_PHONE_NUMBER_ID exists:', !!VAPI_PHONE_NUMBER_ID);
console.log('VAPI_ASSISTANT_ID exists:', !!VAPI_ASSISTANT_ID);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phoneNumber, contactName } = body;

    // Check API key
    if (!VAPI_API_KEY) {
      console.error('VAPI_API_KEY is not set in environment variables');
      return NextResponse.json(
        { error: 'Configuration manquante: VAPI_API_KEY. Veuillez définir VAPI_API_KEY dans vos variables d\'environnement.' },
        { status: 500 }
      );
    }

    // Check phone number ID
    if (!VAPI_PHONE_NUMBER_ID) {
      console.error('VAPI_PHONE_NUMBER_ID is not set in environment variables');
      return NextResponse.json(
        { error: 'Configuration manquante: VAPI_PHONE_NUMBER_ID. Vous devez avoir un numéro de téléphone Vapi configuré.' },
        { status: 500 }
      );
    }

    // Check assistant ID
    if (!VAPI_ASSISTANT_ID) {
      console.error('VAPI_ASSISTANT_ID is not set in environment variables');
      return NextResponse.json(
        { error: 'Configuration manquante: VAPI_ASSISTANT_ID. Vous devez créer un assistant dans Vapi dashboard.' },
        { status: 500 }
      );
    }

    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'Numéro de téléphone requis' },
        { status: 400 }
      );
    }

    // Create the request payload matching Vapi's expected format
    const payload = {
      assistantId: VAPI_ASSISTANT_ID,
      customer: {
        number: phoneNumber,
        numberE164CheckEnabled: false,
        ...(contactName && { name: contactName })
      },
      phoneNumberId: VAPI_PHONE_NUMBER_ID
    };

    // Log the request for debugging
    console.log('Making call to:', phoneNumber);
    console.log('Using phone number ID:', VAPI_PHONE_NUMBER_ID);
    console.log('Using assistant ID:', VAPI_ASSISTANT_ID);
    console.log('Request payload:', JSON.stringify(payload, null, 2));

    // Make the API call to Vapi - using the correct endpoint
    const response = await fetch('https://api.vapi.ai/call/phone', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VAPI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const responseText = await response.text();
    console.log('Vapi API response status:', response.status);
    console.log('Vapi API response:', responseText);

    if (!response.ok) {
      // Parse error details
      let errorDetails;
      try {
        errorDetails = JSON.parse(responseText);
      } catch {
        errorDetails = { message: responseText };
      }

      console.error('Vapi API error:', errorDetails);
      
      // Provide specific error messages
      if (response.status === 401) {
        return NextResponse.json(
          { 
            error: 'Authentification échouée. Vérifiez que votre VAPI_API_KEY est correcte.',
            details: errorDetails 
          },
          { status: 401 }
        );
      } else if (response.status === 403) {
        return NextResponse.json(
          { 
            error: 'Accès refusé. Vérifiez les permissions de votre numéro de téléphone Vapi.',
            details: errorDetails,
            hint: 'Assurez-vous que votre numéro Vapi est correctement configuré avec un fournisseur (Telnyx/Twilio)'
          },
          { status: 403 }
        );
      } else if (response.status === 400) {
        return NextResponse.json(
          { 
            error: 'Requête invalide. Vérifiez vos paramètres.',
            details: errorDetails,
            hint: 'Vérifiez que VAPI_PHONE_NUMBER_ID et VAPI_ASSISTANT_ID sont valides'
          },
          { status: 400 }
        );
      } else {
        return NextResponse.json(
          { 
            error: 'Erreur lors de l\'initiation de l\'appel',
            details: errorDetails 
          },
          { status: response.status }
        );
      }
    }

    const callData = JSON.parse(responseText);

    return NextResponse.json({
      success: true,
      callId: callData.id,
      status: callData.status,
      message: 'Appel initié avec succès',
      phoneNumber: callData.phoneNumber,
      createdAt: callData.createdAt
    });

  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json(
      { 
        error: 'Erreur serveur lors de l\'initiation de l\'appel',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check call status or get assistant info
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const callId = searchParams.get('callId');
  const getAssistant = searchParams.get('getAssistant');

  if (!VAPI_API_KEY) {
    return NextResponse.json(
      { error: 'Configuration manquante: VAPI_API_KEY' },
      { status: 500 }
    );
  }

  // If getAssistant flag is set, return assistant info
  if (getAssistant === 'true') {
    if (!VAPI_ASSISTANT_ID) {
      return NextResponse.json(
        { error: 'Configuration manquante: VAPI_ASSISTANT_ID' },
        { status: 500 }
      );
    }

    try {
      const response = await fetch(`https://api.vapi.ai/assistant/${VAPI_ASSISTANT_ID}`, {
        headers: {
          'Authorization': `Bearer ${VAPI_API_KEY}`,
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error fetching assistant:', errorText);
        return NextResponse.json(
          { error: 'Erreur lors de la récupération de l\'assistant' },
          { status: response.status }
        );
      }

      const assistantData = await response.json();
      
      return NextResponse.json({
        id: assistantData.id,
        name: assistantData.name,
        firstMessage: assistantData.firstMessage,
        model: assistantData.model,
        voice: assistantData.voice,
        transcriber: assistantData.transcriber
      });

    } catch (error) {
      console.error('Server error:', error);
      return NextResponse.json(
        { error: 'Erreur serveur' },
        { status: 500 }
      );
    }
  }

  // Original call status check
  if (!callId) {
    return NextResponse.json(
      { error: 'Call ID ou getAssistant=true requis' },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(`https://api.vapi.ai/call/${callId}`, {
      headers: {
        'Authorization': `Bearer ${VAPI_API_KEY}`,
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error fetching call status:', errorText);
      return NextResponse.json(
        { error: 'Erreur lors de la récupération du statut' },
        { status: response.status }
      );
    }

    const callData = await response.json();
    
    return NextResponse.json({
      callId: callData.id,
      status: callData.status,
      duration: callData.duration,
      recordingUrl: callData.recordingUrl,
      transcript: callData.transcript,
      summary: callData.summary,
      endedReason: callData.endedReason,
      cost: callData.cost
    });

  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// PATCH endpoint to update assistant (e.g., firstMessage)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!VAPI_API_KEY) {
      return NextResponse.json(
        { error: 'Configuration manquante: VAPI_API_KEY' },
        { status: 500 }
      );
    }

    if (!VAPI_ASSISTANT_ID) {
      return NextResponse.json(
        { error: 'Configuration manquante: VAPI_ASSISTANT_ID' },
        { status: 500 }
      );
    }

    // Build update payload - only include fields that are provided
    const updatePayload: any = {};
    if (body.firstMessage !== undefined) updatePayload.firstMessage = body.firstMessage;
    if (body.name !== undefined) updatePayload.name = body.name;
    if (body.voicemailMessage !== undefined) updatePayload.voicemailMessage = body.voicemailMessage;
    if (body.endCallMessage !== undefined) updatePayload.endCallMessage = body.endCallMessage;
    if (body.model !== undefined) updatePayload.model = body.model;
    if (body.voice !== undefined) updatePayload.voice = body.voice;

    console.log('Updating assistant with:', JSON.stringify(updatePayload, null, 2));

    const response = await fetch(`https://api.vapi.ai/assistant/${VAPI_ASSISTANT_ID}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${VAPI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updatePayload)
    });

    const responseText = await response.text();
    console.log('Vapi API update response status:', response.status);
    console.log('Vapi API update response:', responseText);

    if (!response.ok) {
      let errorDetails;
      try {
        errorDetails = JSON.parse(responseText);
      } catch {
        errorDetails = { message: responseText };
      }

      console.error('Vapi API update error:', errorDetails);
      
      return NextResponse.json(
        { 
          error: 'Erreur lors de la mise à jour de l\'assistant',
          details: errorDetails 
        },
        { status: response.status }
      );
    }

    const updatedAssistant = JSON.parse(responseText);

    return NextResponse.json({
      success: true,
      message: 'Assistant mis à jour avec succès',
      assistant: {
        id: updatedAssistant.id,
        name: updatedAssistant.name,
        firstMessage: updatedAssistant.firstMessage,
        voicemailMessage: updatedAssistant.voicemailMessage,
        endCallMessage: updatedAssistant.endCallMessage
      }
    });

  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json(
      { 
        error: 'Erreur serveur lors de la mise à jour',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// For Pages Router (pages/api/vapi/call.ts), use this instead:
/*
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    // POST logic here (same as above but adapted for Pages API)
  } else if (req.method === 'GET') {
    // GET logic here (same as above but adapted for Pages API)
  } else if (req.method === 'PATCH') {
    // PATCH logic here (same as above but adapted for Pages API)
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
*/