import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    const { downloadLocation } = await request.json();

    if (!downloadLocation) {
        return NextResponse.json({ error: 'Download location is required' }, { status: 400 });
    }

    const accessKey = process.env.UNSPLASH_ACCESS_KEY;

    if (!accessKey) {
        return NextResponse.json({ error: 'Unsplash Access Key not configured' }, { status: 500 });
    }

    try {
        // Unsplash requiere enviar el Client-ID (Access Key) en el header Authorization
        await fetch(downloadLocation, {
            headers: {
                Authorization: `Client-ID ${accessKey}`,
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error tracking download:', error);
        return NextResponse.json({ error: 'Failed to track download' }, { status: 500 });
    }
}
