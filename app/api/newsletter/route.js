import { supabase } from '../../lib/supabase';

export async function POST(request) {
  const { subject, intro, articleIds, adminKey } = await request.json();
  if (adminKey !== process.env.NEXT_PUBLIC_ADMIN_PASSWORD) return Response.json({ error: 'Non autorisé' }, { status: 401 });
  const { data: articles } = await supabase.from('articles').select('*').in('id', articleIds || []);
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.GROQ_API_KEY}` },
    body: JSON.stringify({
      model: 'llama3-70b-8192', max_tokens: 2000,
      messages: [
        { role: 'system', content: 'Tu crées des newsletters HTML pour A-FRIC. Tu réponds UNIQUEMENT avec le HTML complet.' },
        { role: 'user', content: `Newsletter HTML : intro="${intro || 'Voici vos actualités africaines.'}", articles:\n${(articles||[]).map((a,i)=>`${i+1}. ${a.title} (${a.cat}): ${a.content.substring(0,200)}`).join('\n')}\nStyle: fond blanc, vert #1a6b3a, max-width 600px, footer "A-FRIC · Médias africains francophones"` }
      ]
    })
  });
  const aiData = await res.json();
  const htmlContent = aiData.choices?.[0]?.message?.content || '';
  const { data: newsletter } = await supabase.from('newsletters').insert([{ subject: subject || 'A-FRIC Newsletter', html_content: htmlContent, article_ids: articleIds || [], created_at: new Date().toISOString(), sent: false }]).select();
  return Response.json({ success: true, newsletter: newsletter?.[0] });
}

export async function GET(request) {
  const adminKey = new URL(request.url).searchParams.get('key');
  if (adminKey !== process.env.NEXT_PUBLIC_ADMIN_PASSWORD) return Response.json({ error: 'Non autorisé' }, { status: 401 });
  const { data } = await supabase.from('newsletters').select('*').order('created_at', { ascending: false });
  return Response.json(data || []);
}
