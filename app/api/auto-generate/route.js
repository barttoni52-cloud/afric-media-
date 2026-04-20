import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const THEMES = [
  'innovations technologiques africaines 2025',
  'startups africaines qui révolutionnent leur secteur',
  'avancées scientifiques en Afrique',
  'entrepreneurs africains qui changent le monde',
  'agriculture intelligente et food tech en Afrique',
  'énergie solaire et transition énergétique Afrique',
  'fintech et inclusion financière en Afrique',
  'diaspora africaine en Europe : succès et initiatives',
  'culture africaine rayonnant sur le monde',
  'santé et médecine : percées africaines',
  'éducation et jeunesse africaine innovante',
  'sport africain : champions et compétitions',
];

export async function GET() {
  return Response.json({ themes: THEMES });
}

export async function POST(request) {
  const { adminKey, themeIndex } = await request.json();
  if (adminKey !== process.env.NEXT_PUBLIC_ADMIN_PASSWORD) return Response.json({ error: 'Non autorisé' }, { status: 401 });
  const theme = themeIndex !== undefined ? THEMES[themeIndex % THEMES.length] : THEMES[Math.floor(Math.random() * THEMES.length)];

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.GROQ_API_KEY}` },
    body: JSON.stringify({
      model: 'llama3-70b-8192', max_tokens: 3000,
      messages: [
        { role: 'system', content: 'Tu es éditeur pour A-FRIC. Tu réponds UNIQUEMENT avec du JSON valide sans markdown.' },
        { role: 'user', content: `Génère 3 articles sur : "${theme}". JSON: [{"title":"titre max 90 chars","cat":"Technologie|Économie|Agriculture|Culture|Sport|Santé|Éducation|Environnement|Diaspora|Politique","source":"RFI Afrique|Jeune Afrique|Le Monde Afrique|BBC Afrique|The Africa Report","content":"350 mots, positif, français, 3-4 paragraphes"}]` }
      ]
    })
  });

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content || '[]';
  let articles;
  try { articles = JSON.parse(text.replace(/```json|```/g, '').trim()); }
  catch { return Response.json({ error: 'Parsing échoué' }, { status: 500 }); }

  const { data: saved, error } = await supabase.from('articles').insert(
    articles.map(a => ({ title: a.title, cat: a.cat, source: a.source, content: a.content, status: 'draft', type: 'auto', created_at: new Date().toISOString() }))
  ).select();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ success: true, theme, count: saved.length, articles: saved });
}
