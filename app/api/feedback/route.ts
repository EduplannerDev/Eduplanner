import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
// import { sendFeedbackNotification } from '@/lib/email';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase URL or Anon Key environment variables.');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const feedbackText = formData.get('feedbackText') as string;
    const feedbackType = formData.get('feedbackType') as string;
    const userEmail = formData.get('userEmail') as string | null;
    const feedbackImage = formData.get('feedbackImage') as File | null;

    let imageUrl: string | null = null;

    if (feedbackImage) {
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('feedback-images') // Asegúrate de tener un bucket llamado 'feedback-images' en Supabase Storage
        .upload(`${Date.now()}-${feedbackImage.name}`, feedbackImage, { contentType: feedbackImage.type });

      if (uploadError) {
        console.error('Error uploading image:', uploadError);
        return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 });
      }
      imageUrl = uploadData?.path ? supabase.storage.from('feedback-images').getPublicUrl(uploadData.path).data.publicUrl : null;
    }

    const { data, error } = await supabase
      .from('feedback') // Asegúrate de tener una tabla llamada 'feedback' en tu base de datos Supabase
      .insert([{ text: feedbackText, type: feedbackType, email: userEmail, image_url: imageUrl }]);

    if (error) {
      console.error('Error inserting feedback:', error);
      return NextResponse.json({ error: 'Failed to save feedback' }, { status: 500 });
    }

    // Enviar notificación por email
    // try {
    //   await sendFeedbackNotification({
    //     feedbackText,
    //     feedbackType,
    //     userEmail: userEmail || undefined,
    //     imageUrl: imageUrl || undefined
    //   });
    //   console.log('Email notification sent successfully');
    // } catch (emailError) {
    //   console.error('Error sending email notification:', emailError);
    //   // No fallar la respuesta si el email falla, solo logear el error
    // }

    return NextResponse.json({ message: 'Feedback saved successfully', data }, { status: 200 });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}