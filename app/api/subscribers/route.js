import { supabase } from '../../lib/supabase';

export async function POST(request) {
  const { email, name } = await request.json();
  if (!email || !email.includes('@')) return Response.json({ error: 'Email invalide' }, { status: 400 });
  const { data: existing } = await supabase.from('subscribers').select('id').eq('email', email).single();
  if (existing) return Response.json({ message: 'Vous êtes déjà inscrit !' });
  const { error } = await supabase.from('subscribers').insert([{ email, name: name || '', subscribed_at: new Date().toISOString(), active: true }]);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ success: true, message: 'Inscription réussie !' }, { status: 201 });
}

export async function GET(request) {
  const adminKey = new URL(request.url).searchParams.get('key');
  if (adminKey !== process.env.NEXT_PUBLIC_ADMIN_PASSWORD) return Response.json({ error: 'Non autorisé' }, { status: 401 });
  const { data, error } = await supabase.from('subscribers').select('*').eq('active', true).order('subscribed_at', { ascending: false });
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}
