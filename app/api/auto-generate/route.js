import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { createClient } from '@supabase/supabase-js';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const THEMES = [
  { label: '🌱 Agriculture & Innovation', topic: "les innovations agricoles en Afrique et leur impact sur la sécurité alimentaire", category: "Agriculture" },
  { label: '💰 Économie & Croissance', topic: "la croissance économique africaine et les opportunités pour la diaspora", category: "Économie" },
  { label: '🎓 Éducation & Jeunesse', topic: "les initiatives éducatives transformant la jeunesse africaine", category: "Éducation" },
  { label: '💻 Tech & Startups', topic: "les startups technologiques africaines qui révolutionnent le continent", category: "Technologie" },
  { label: '🌍 Diaspora & Europe', topic: "l'impact positif de la diaspora africaine en Europe sur le développement du continent", category: "Diaspora" },
  { label: '🏥 Santé & Bien-être', topic: "les avancées médicales et sanitaires en Afrique", category: "Santé" },
  { label: '🎭 Culture & Arts', topic: "le rayonnement de la culture africaine en Europe et dans le monde", category: "Culture" },
  { label: '⚽ Sport & Fierté', topic: "les succès sportifs africains sur la scène internationale", category: "Sport" },
  { label: '🌿 Environnement', topic: "les initiatives africaines de protection de l'environnement et d'énergie verte", category: "Environnement" },
  { label: '🗳️ Politique & Démocratie', topic: "les avancées démocratiques et la bonne gouvernance en Afrique", category: "Politique" },
];

// ── Cherche une image Unsplash ────────────────────────────────────────────────
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

// ── GET : retourne la liste des thèmes pour l'admin ───────────────────────────
export async function GET() {
  return NextResponse.json({ themes: THEMES.map(t => t.label) });
}

// ── POST : génère des articles avec Groq + image Unsplash ─────────────────────
export async function POST(req: Request) {
  const { adminKey, themeIndex } = await req.json();

  // Vérification mot de passe admin
  if (adminKey !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  // Sélection du thème (aléatoire si non précisé)
  const idx = themeIndex !== undefined && themeIndex !== null
    ? themeIndex
    : Math.floor(Math.random() * THEMES.length);
  const theme = THEMES[idx] || THEMES[0];

  // Génération de 3 articles avec Groq
  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      {
        role: 'system',
        content: `Tu es un journaliste senior pour A-FRIC, un média africain francophone destiné à la diaspora africaine en Europe.
Tu rédiges des articles informatifs, positifs, inspirants et bénéfiques pour l'Afrique et sa diaspora.
Tu dois générer EXACTEMENT 3 articles différents sur le thème donné.
Réponds UNIQUEMENT en JSON valide, sans aucun texte avant ou après, avec ce format exact :
{"articles": [{"title": "...", "content": "...", "cat": "..."}, {"title": "...", "content": "...", "cat": "..."}, {"title": "...", "content": "...", "cat": "..."}]}`,
      },
      {
        role: 'user',
        content: `Génère 3 articles sur le thème : "${theme.topic}". Catégorie principale : ${theme.category}. Chaque article doit faire au moins 400 mots, être factuel et valoriser l'Afrique.`,
      },
    ],
    max_tokens: 4000,
  });

  const raw = completion.choices[0].message.content ?? '{}';
  const clean = raw.replace(/```json|```/g, '').trim();

  let parsed: { articles: { title: string; content: string; cat: string }[] };
  try {
    parsed = JSON.parse(clean);
  } catch {
    return NextResponse.json({ error: 'Erreur parsing JSON Groq', raw: clean }, { status: 500 });
  }

  const articlesData = parsed.articles || [];
  let saved = 0;

  for (const art of articlesData) {
    // Recherche image Unsplash basée sur le titre
    const imageQuery = `${art.title} Africa`;
    const image_url = await fetchUnsplashImage(imageQuery);

    const { error } = await supabase.from('articles').insert([{
      title: art.title,
      content: art.content,
      cat: art.cat || theme.category,
      source: 'A-FRIC IA',
      image_url,          // ← image automatique
      status: 'draft',
      type: 'auto',
      created_at: new Date().toISOString(),
    }]);

    if (!error) saved++;
  }

  return NextResponse.json({
    success: true,
    count: saved,
    theme: theme.label,
  });
}
