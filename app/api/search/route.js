export async function POST(request) {
  const { query } = await request.json();
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.GROQ_API_KEY}` },
    body: JSON.stringify({
      model: 'llama3-8b-8192', max_tokens: 2500,
      messages: [
        { role: 'system', content: 'Tu es éditeur pour A-FRIC. Tu réponds UNIQUEMENT avec du JSON valide, sans markdown.' },
        { role: 'user', content: `Génère 3 articles sur : "${query}". JSON: [{"title":"...","cat":"Technologie|Économie|Agriculture|Culture|Sport|Santé|Éducation|Environnement|Diaspora|Politique","source":"RFI Afrique|Jeune Afrique|Le Monde Afrique|BBC Afrique","content":"280 mots positif pro-Afrique français"}]` }
      ]
    })
  });
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content || '[]';
  try { return Response.json(JSON.parse(text.replace(/```json|```/g, '').trim())); }
  catch { return Response.json({ error: 'Parsing échoué' }, { status: 500 }); }
}
