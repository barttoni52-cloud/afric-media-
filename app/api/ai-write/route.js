export async function POST(request) {
  const { title, cat } = await request.json();
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.GROQ_API_KEY}` },
    body: JSON.stringify({
      model: 'llama3-70b-8192', max_tokens: 1200,
      messages: [
        { role: 'system', content: 'Tu es journaliste pour A-FRIC, média africain francophone pro-Afrique pour la diaspora en Europe. Tu rédiges en français, ton positif et valorisant.' },
        { role: 'user', content: `Rédige un article de 450 mots sur : "${title}" (catégorie: ${cat}). 3-4 paragraphes, commence directement, sans titre.` }
      ]
    })
  });
  const data = await res.json();
  return Response.json({ content: data.choices?.[0]?.message?.content || '' });
}
