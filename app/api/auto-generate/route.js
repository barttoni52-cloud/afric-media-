import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { createClient } from '@supabase/supabase-js';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function fetchUnsplashImage(query: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`,
      { headers: { Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}` } }
    );
    const data = await res.json();
    return data?.results?.[0]?.urls?.regular ?? null;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  const { topic, category } = await req.json();

  // 1. Génération du contenu avec Groq
  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      {
        role: 'system',
        content: `Tu es un journaliste pour A-FRIC, un média africain francophone destiné à la diaspora africaine en Europe. 
Rédige un article informatif, positif et bénéfique pour l'Afrique et sa diaspora.
Réponds UNIQUEMENT en JSON valide avec les champs: title, content, excerpt, category.`,
      },
      {
        role: 'user',
        content: `Écris un article sur: ${topic}. Catégorie: ${category || 'Actualités'}.`,
      },
    ],
    max_tokens: 2000,
  });

  const raw = completion.choices[0].message.content ?? '{}';
  const clean = raw.replace(/```json|```/g, '').trim();
  const article = JSON.parse(clean);

  // 2. Recherche image Unsplash basée sur le titre
  const imageQuery = `${article.title} Africa`;
  const image_url = await fetchUnsplashImage(imageQuery);

  // 3. Sauvegarde en base (statut 'draft' pour validation)
  const { data, error } = await supabase.from('articles').insert([
    {
      title: article.title,
      content: article.content,
      excerpt: article.excerpt,
      category: article.category || category,
      image_url,
      status: 'draft',
      created_at: new Date().toISOString(),
    },
  ]).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, article: data });
}
