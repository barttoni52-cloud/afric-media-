export async function POST(request) {
  try {
    const { title, cat } = await request.json();
    if (!title) return Response.json({ error: 'Titre requis' }, { status: 400 });

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama3-70b-8192',
        max_tokens: 1200,
        messages: [
          {
            role: 'system',
            content: 'Tu es journaliste pour A-FRIC, média africain francophone pro-Afrique pour la diaspora en Europe. Tu rédiges en français, ton positif et valorisant pour l\'Afrique.'
          },
          {
            role: 'user',
            content: `Rédige un article complet de 400-450 mots sur : "${title}" (catégorie: ${cat || 'Actualité'}). 3-4 paragraphes. Commence directement par le premier paragraphe, sans titre ni sous-titre.`
          }
        ]
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      return Response.json({ error: `Groq error: ${errText}` }, { status: 500 });
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || '';

    if (!content) {
      return Response.json({ error: 'Réponse vide de Groq' }, { status: 500 });
    }

    return Response.json({ content });

  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
