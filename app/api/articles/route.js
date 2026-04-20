import { supabase } from '../../lib/supabase';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  let q = supabase.from('articles').select('*').order('created_at', { ascending: false });
  if (status) q = q.eq('status', status);
  const { data, error } = await q;
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}

export async function POST(request) {
  const body = await request.json();
  const { data, error } = await supabase.from('articles').insert([{
    title: body.title, cat: body.cat || 'Actualité', source: body.source || 'A-FRIC',
    content: body.content, status: body.status || 'draft', type: body.type || 'manual',
    created_at: new Date().toISOString(),
  }]).select();
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data[0], { status: 201 });
}

export async function PUT(request) {
  const { id, ...fields } = await request.json();
  const { data, error } = await supabase.from('articles').update({ ...fields, updated_at: new Date().toISOString() }).eq('id', id).select();
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data[0]);
}

export async function DELETE(request) {
  const id = new URL(request.url).searchParams.get('id');
  const { error } = await supabase.from('articles').delete().eq('id', id);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ success: true });
}
