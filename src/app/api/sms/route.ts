// app/api/sms/route.ts
import { NextRequest, NextResponse } from 'next/server';

// Add the edge runtime directive at the top of the file
export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    // 1) Get JSON body from client request
    const { destinataires, message, expediteur, date } = await request.json();

    // 2) Get SMS Factor token from environment
    const token = process.env.SMS_FACTOR_TOKEN;

    if (!token) {
      console.error('Missing SMS_FACTOR_TOKEN environment variable');
      return NextResponse.json({
        success: false,
        message: 'Server configuration error - missing API token'
      }, { status: 500 });
    }

    // 3) Convert destinataires to SMS Factor format
    // destinataires can be a string (single number) or array of numbers
    const recipients = Array.isArray(destinataires) ? destinataires : [destinataires];
    
    // Create GSM recipients array with unique IDs
    const gsmRecipients = recipients.map((number, index) => {
      // Clean the number - remove spaces and ensure it doesn't have + prefix
      const cleanNumber = number.toString().replace(/\s+/g, '').replace(/^\+/, '');
      
      return {
        gsmsmsid: (100 + index).toString(), // Unique ID for each recipient
        value: cleanNumber
      };
    });

    // 4) Prepare SMS Factor request body
    const requestBody = {
      sms: {
        message: {
          text: message,
          pushtype: "alert",
          sender: expediteur || "SMS", // Default sender if not provided
          delay: date || "", // Empty string for immediate sending
          unicode: 0 // 0 for normal text, 1 for unicode
        },
        recipients: {
          gsm: gsmRecipients
        }
      }
    };

    console.log('SMS Factor Request:', JSON.stringify(requestBody, null, 2));

    // 5) Call SMS Factor API
    const apiRes = await fetch('https://api.smsfactor.com/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    // 6) Read response
    const responseText = await apiRes.text();
    console.log('Raw API Response:', responseText);
    
    let result;
    try {
      result = JSON.parse(responseText);
    } catch {
      console.error('Failed to parse response:', responseText);
      return NextResponse.json({
        success: false,
        errors: 'Invalid response from SMS API',
        rawResponse: responseText
      }, { status: 500 });
    }

    console.log('Parsed Response:', result);

    // 7) Handle SMS Factor response
    // SMS Factor typically returns status codes like:
    // 1 = Success
    // -1 = Authentication error
    // -2 = Missing mandatory parameter
    // etc.
    
    if (apiRes.ok && (result.status === 1 || result.status === '1' || result.success)) {
      return NextResponse.json({
        success: true,
        id: result.ticket || result.message_id || Date.now().toString(),
        data: result,
        recipients: gsmRecipients
      }, { status: 200 });
    } else {
      // Handle error response
      const errorMessage = result.message || result.error || 'SMS sending failed';
      console.error('SMS Factor Error:', errorMessage, 'Status:', result.status);
      
      // Common SMS Factor error codes
      const errorCodes: Record<string, string> = {
        '-1': 'Authentication failed - check API token',
        '-2': 'Missing mandatory parameter',
        '-3': 'Insufficient credits',
        '-4': 'Invalid phone number',
        '-5': 'Invalid sender',
        '-6': 'Message too long',
        '-7': 'Invalid unicode parameter',
        '-8': 'Invalid delay format',
        '-9': 'Delay too far in the future'
      };
      
      const knownError = errorCodes[result.status] || errorMessage;
      
      return NextResponse.json({
        success: false,
        errors: knownError,
        data: result,
        debug: {
          status: result.status,
          recipients: gsmRecipients,
          httpStatus: apiRes.status
        }
      }, { status: 400 });
    }

  } catch (error) {
    console.error('SMS API error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}