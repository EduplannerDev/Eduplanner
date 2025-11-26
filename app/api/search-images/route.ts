import { NextRequest, NextResponse } from 'next/server';

// Unsplash Access Key (gratis, 50 requests/hora)
const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY || 'demo_access_key';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get('query');
        const perPage = searchParams.get('per_page') || '6';

        if (!query) {
            return NextResponse.json(
                { error: 'Query parameter is required' },
                { status: 400 }
            );
        }

        // Buscar imágenes en Unsplash
        const response = await fetch(
            `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=landscape`,
            {
                headers: {
                    'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`,
                },
            }
        );

        if (!response.ok) {
            throw new Error('Error fetching images from Unsplash');
        }

        const data = await response.json();

        // Formatear respuesta
        const images = data.results.map((img: any) => ({
            id: img.id,
            url: img.urls.regular,
            thumb: img.urls.thumb,
            description: img.description || img.alt_description,
            photographer: img.user.name,
            photographer_url: img.user.links.html,
            download_url: img.links.download_location,
        }));

        return NextResponse.json({ images });

    } catch (error) {
        console.error('Error searching images:', error);
        return NextResponse.json(
            { error: 'Error al buscar imágenes' },
            { status: 500 }
        );
    }
}
