// app/api/sms/route.ts
import { NextRequest, NextResponse } from 'next/server';

// Add the edge runtime directive at the top of the file
export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    // 1) On récupère le corps JSON de l'appel client
    const { destinataires, message, expediteur, date } = await request.json();

    // 2) Prépare les paramètres form-urlencoded
    const params = new URLSearchParams({
      key: process.env.SPOT_HIT_KEY!,        // à définir dans .env
      destinataires,
      message,
      expediteur,
      date: date || '',                      // si pas de date fournie, envoi immédiat
    });

    // Add debugging logs here, right after params is defined
    console.log('API Key available:', Boolean(process.env.SPOT_HIT_KEY));
    console.log('Request params:', Object.fromEntries(params));

    // 3) Appel à l'API Spot-Hit
    const apiRes = await fetch('https://www.spot-hit.fr/api/envoyer/sms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    });

    // 4) Lecture de la réponse
    const result = await apiRes.json();

    // 5) Retourne le même format ou une erreur
    if (result.resultat) {
      return NextResponse.json({
        success: true,
        id: result.id,
      }, { status: 200 });
    } else {
      return NextResponse.json({
        success: false,
        errors: result.erreurs,
      }, { status: 400 });
    }

  } catch (error) {
    // Also fix the error handling here to capture the actual error
    console.error('SMS API error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}