import { NextRequest, NextResponse } from 'next/server';

// Types for the SMS API
interface SMSRequest {
  // Pick either "MND" or "PRM" here; if you don't pass one, we'll default to "PRM"
  message_type?: 'MND' | 'PRM';
  message: string;
  recipient: string[];
  sender?: string;
  scheduled_delivery_time?: string;
  scheduled_delivery_timezone?: string;
  order_id?: string;
  returnCredits?: boolean;
  returnRemaining?: boolean;
  allowInvalidRecipients?: boolean;
  encoding?: 'gsm' | 'ucs2';
  id_landing?: number;
  campaign_name?: string;
  max_fragments?: number;
  truncate?: boolean;
  validity_period_min?: number;
  richsms_url?: string;
}

interface TokenResponse {
  user_key: string;
  access_token: string;
}

interface SMSResponse {
  result: string;
  order_id?: string;
  total_sent?: number;
  remaining_credits?: number;
  error?: string;
}

// Store credentials in environment variables
const SMS_API_EMAIL = process.env.SMS_API_EMAIL || '';
const SMS_API_PASSWORD = process.env.SMS_API_PASSWORD || '';
const SMS_API_BASE_URL = 'https://api.smsenvoi.com/API/v1.0/REST';

// Helper function to get access token
async function getAccessToken(): Promise<TokenResponse> {
  const credentials = Buffer.from(`${SMS_API_EMAIL}:${SMS_API_PASSWORD}`).toString('base64');
  
  try {
    const response = await fetch(`${SMS_API_BASE_URL}/token`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${credentials}`
      }
    });

    if (!response.ok) {
      throw new Error(`Token request failed: ${response.status}`);
    }

    const data = await response.text();
    // Parse the response format: USER_KEY;ACCESS_TOKEN
    const [user_key, access_token] = data.split(';');
    
    if (!user_key || !access_token) {
      throw new Error('Invalid token response format');
    }

    return { user_key, access_token };
  } catch (error) {
    console.error('Error getting access token:', error);
    throw error;
  }
}

// Helper function to send SMS
async function sendSMS(tokenData: TokenResponse, smsData: SMSRequest): Promise<SMSResponse> {
  try {
    // Build the payload, only including optional fields if they’re defined
    const payload: Record<string, any> = {
      message_type: smsData.message_type ?? 'PRM',
      message: smsData.message,
      recipient: smsData.recipient,
    };

    if (smsData.sender) payload.sender = smsData.sender;
    if (smsData.scheduled_delivery_time) payload.scheduled_delivery_time = smsData.scheduled_delivery_time;
    if (smsData.scheduled_delivery_timezone) payload.scheduled_delivery_timezone = smsData.scheduled_delivery_timezone;
    if (smsData.order_id) payload.order_id = smsData.order_id;
    payload.returnCredits = smsData.returnCredits ?? false;
    payload.returnRemaining = smsData.returnRemaining ?? false;
    payload.allowInvalidRecipients = smsData.allowInvalidRecipients ?? false;
    if (smsData.encoding) payload.encoding = smsData.encoding;
    if (smsData.id_landing) payload.id_landing = smsData.id_landing;
    if (smsData.campaign_name) payload.campaign_name = smsData.campaign_name;
    if (smsData.max_fragments) payload.max_fragments = smsData.max_fragments;
    if (smsData.truncate) payload.truncate = smsData.truncate;
    if (smsData.validity_period_min) payload.validity_period_min = smsData.validity_period_min;
    if (smsData.richsms_url) payload.richsms_url = smsData.richsms_url;

    const response = await fetch(`${SMS_API_BASE_URL}/sms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'user_key': tokenData.user_key,
        'Access_token': tokenData.access_token
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      // Capture the error body to make debugging easier
      const errorText = await response.text();
      throw new Error(`SMS request failed: ${response.status} — ${errorText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error sending SMS:', error);
    throw error;
  }
}

// Main API route handler
export async function POST(request: NextRequest) {
  try {
    // Validate environment variables
    if (!SMS_API_EMAIL || !SMS_API_PASSWORD) {
      return NextResponse.json(
        { error: 'SMS API credentials not configured' },
        { status: 500 }
      );
    }

    // Parse request body
    const body: SMSRequest = await request.json();

    // Validate required fields
    if (!body.message || !body.recipient || body.recipient.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: message and recipient' },
        { status: 400 }
      );
    }

    // Step 1: Get access token
    const tokenData = await getAccessToken();

    // Step 2: Send SMS
    const smsResult = await sendSMS(tokenData, body);

    // Return the result
    return NextResponse.json(smsResult, { status: 200 });
  } catch (error) {
    console.error('SMS API Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to send SMS',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Optional: GET endpoint to test the connection
export async function GET(request: NextRequest) {
  try {
    // Validate environment variables
    if (!SMS_API_EMAIL || !SMS_API_PASSWORD) {
      return NextResponse.json(
        { error: 'SMS API credentials not configured' },
        { status: 500 }
      );
    }

    // Try to get access token to verify credentials
    const tokenData = await getAccessToken();

    return NextResponse.json(
      {
        status: 'connected',
        message: 'SMS API credentials are valid',
        user_key: tokenData.user_key.substring(0, 10) + '...' // Show partial key for security
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to connect to SMS API',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
