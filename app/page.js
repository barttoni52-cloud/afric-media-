'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

const CATS = ['Tous','Technologie','Économie','Politique','Agriculture','Culture','Sport','Santé','Éducation','Environnement','Diaspora'];

const IMGS = {
  'Technologie':   'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&q=80',
  'Économie':      'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80',
  'Politique':     'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=800&q=80',
  'Agriculture':   'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800&q=80',
  'Culture':       'https://images.unsplash.com/photo-1590656872261-3c37a5ed0a2b?w=800&q=80',
  'Sport':         'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800&q=80',
  'Santé':         'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&q=80',
  'Éducation':     'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&q=80',
  'Environnement': 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80',
  'Diaspora':      'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=800&q=80',
  'default':       'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=800&q=80',
};

const img = (cat) => IMGS[cat] || IMGS.default;
const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '';

function ShareRow({ title }) {
  const url = encodeURIComponent('https://afric-media.vercel.app');
  const txt = encodeURIComponent(title);
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 24 }}>
      <span style={{ fontSize: 12, color: '#999', alignSelf: 'center' }}>Partager :</span>
      {[
        ['Facebook', `https://www.facebook.com/sharer/sharer.php?u=${url}`, '#1877f2'],
        ['WhatsApp', `https://wa.me/?text=${txt}%20${url}`, '#25d366'],
        ['X', `https://twitter.com/intent/tweet?text=${txt}&url=${url}`, '#000'],
        ['LinkedIn', `https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '#0077b5'],
      ].map(([label, href, bg]) => (
        <a key={label} href={href} target="_blank" rel="noreferrer"
          style={{ padding: '5px 14px', borderRadius: 20, background: bg, color: '#fff', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
          {label}
        </a>
      ))}
      <button onClick={() => { navigator.clipboard.writeText('https://afric-media.vercel.app'); alert('Lien copié !'); }}
        style={{ padding: '5px 14px', borderRadius: 20, background: '#eee', color: '#555', fontSize: 12, border: 'none', cursor: 'pointer' }}>
        Copier
      </button>
    </div>
  );
}

export default function Home() {
  const [articles, setArticles] = useState([]);
  const [filter, setFilter] = useState('Tous');
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [nlMsg, setNlMsg] = useState('');

  useEffect(() => {
    fetch('/api/articles?status=published')
      .then(r => r.json())
      .then(d => { setArticles(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = filter === 'Tous' ? articles : articles.filter(a => a.cat === filter);

  const subscribe = async () => {
    if (!email.includes('@')) { setNlMsg('Email invalide.'); return; }
    setNlMsg('...');
    const r = await fetch('/api/subscribers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, name }) });
    const d = await r.json();
    setNlMsg(d.message || d.error || 'Inscription réussie !');
    if (d.success || d.message) { setEmail(''); setName(''); }
  };

  if (selected) return (
    <div style={{ minHeight: '100vh', background: '#faf8f4' }}>
      <nav style={N}>
        <div style={LOGO}>A<span style={{ color: '#c8991a' }}>-</span>FRIC</div>
        <div style={{ flex: 1 }} />
        <Link href="/admin" style={ABTN}>Admin</Link>
      </nav>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '2rem 1.5rem' }}>
        <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: '#1a6b3a', cursor: 'pointer', fontSize: 13, padding: 0, marginBottom: 24, display: 'block' }}>← Tous les articles</button>
        <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 2, color: '#1a6b3a', fontWeight: 700, marginBottom: 8 }}>{selected.cat}</div>
        <h1 style={{ fontSize: 28, fontWeight: 700, lineHeight: 1.25, marginBottom: 12, fontFamily: 'Georgia,serif', color: '#111' }}>{selected.title}</h1>
        <div style={{ fontSize: 13, color: '#999', marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid #eee' }}>
          {selected.source} · {fmtDate(selected.created_at)}
        </div>
        <img src={img(selected.cat)} alt="" style={{ width: '100%', height: 300, objectFit: 'cover', borderRadius: 10, marginBottom: 24 }} />
        <div style={{ fontSize: 16, lineHeight: 1.85, color: '#222' }}>
          {selected.content.split('\n').filter(l => l.trim()).map((p, i) => <p key={i} style={{ marginBottom: 16 }}>{p}</p>)}
        </div>
        <ShareRow title={selected.title} />
        <div style={{ marginTop: 24, padding: '12px 16px', background: '#f0faf4', borderRadius: 8, fontSize: 12, color: '#777' }}>
          Source : {selected.source} · A-FRIC Médias africains francophones
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#faf8f4' }}>
      <nav style={N}>
        <div style={LOGO}>A<span style={{ color: '#c8991a' }}>-</span>FRIC</div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,.6)', flex: 1, paddingLeft: 16 }}>Médias africains · Diaspora Europe</div>
        <Link href="/admin" style={ABTN}>Admin</Link>
      </nav>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '1.5rem' }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
          {CATS.map(c => (
            <button key={c} onClick={() => setFilter(c)} style={{
              padding: '5px 14px', borderRadius: 20, border: '1px solid', fontSize: 12, cursor: 'pointer',
              borderColor: filter === c ? '#1a6b3a' : '#ddd',
              background: filter === c ? '#1a6b3a' : '#fff',
              color: filter === c ? '#fff' : '#666',
            }}>{c}</button>
          ))}
        </div>

        {loading && <div style={{ textAlign: 'center', padding: '4rem', color: '#bbb' }}>Chargement...</div>}
        {!loading && filtered.length === 0 && <div style={{ textAlign: 'center', padding: '4rem', color: '#bbb' }}>Aucun article publié.</div>}

        {!loading && filtered.length > 0 && (
          <>
            <div onClick={() => setSelected(filtered[0])} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', background: '#fff', borderRadius: 12, border: '1px solid #eee', overflow: 'hidden', marginBottom: 20, cursor: 'pointer' }}>
              <img src={img(filtered[0].cat)} alt="" style={{ width: '100%', height: '100%', minHeight: 260, objectFit: 'cover' }} />
              <div style={{ padding: '2rem' }}>
                <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 2, color: '#1a6b3a', fontWeight: 700, marginBottom: 8 }}>{filtered[0].cat}</div>
                <h2 style={{ fontSize: 20, fontWeight: 700, fontFamily: 'Georgia,serif', lineHeight: 1.3, marginBottom: 10, color: '#111' }}>{filtered[0].title}</h2>
                <div style={{ fontSize: 12, color: '#999', marginBottom: 12 }}>{filtered[0].source} · {fmtDate(filtered[0].created_at)}</div>
                <p style={{ fontSize: 14, color: '#555', lineHeight: 1.7 }}>{filtered[0].content.substring(0, 180)}…</p>
                <span style={{ display: 'inline-block', marginTop: 12, fontSize: 13, color: '#1a6b3a', fontWeight: 600 }}>Lire →</span>
              </div>
            </div>

            <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 2, color: '#ccc', marginBottom: 12 }}>Derniers articles</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 12, marginBottom: 40 }}>
              {filtered.slice(1).map(a => (
                <div key={a.id} onClick={() => setSelected(a)} style={{ background: '#fff', border: '1px solid #eee', borderRadius: 10, overflow: 'hidden', cursor: 'pointer' }}>
                  <img src={img(a.cat)} alt="" style={{ width: '100%', height: 150, objectFit: 'cover' }} />
                  <div style={{ padding: '1rem' }}>
                    <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5, color: '#1a6b3a', fontWeight: 700, marginBottom: 6 }}>{a.cat}</div>
                    <h3 style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.4, marginBottom: 6, fontFamily: 'Georgia,serif', color: '#111' }}>{a.title}</h3>
                    <div style={{ fontSize: 11, color: '#bbb' }}>{a.source} · {fmtDate(a.created_at)}</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <div style={{ background: '#1a6b3a', borderRadius: 14, padding: '2.5rem 2rem', color: '#fff', textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', opacity: .6, marginBottom: 8 }}>Newsletter gratuite</div>
          <h2 style={{ fontSize: 22, fontWeight: 700, fontFamily: 'Georgia,serif', marginBottom: 8 }}>L'Afrique dans votre boîte mail</h2>
          <p style={{ fontSize: 14, opacity: .8, marginBottom: 20, maxWidth: 440, margin: '0 auto 20px' }}>
            Chaque semaine, les meilleures actualités africaines pour la diaspora en Europe.
          </p>
          <div style={{ display: 'flex', gap: 8, maxWidth: 480, margin: '0 auto', flexWrap: 'wrap', justifyContent: 'center' }}>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Prénom"
              style={{ flex: '1 1 120px', padding: '10px 14px', borderRadius: 8, border: 'none', fontSize: 14, outline: 'none' }} />
            <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Votre email"
              onKeyDown={e => e.key === 'Enter' && subscribe()}
              style={{ flex: '2 1 200px', padding: '10px 14px', borderRadius: 8, border: 'none', fontSize: 14, outline: 'none' }} />
            <button onClick={subscribe} style={{ padding: '10px 22px', borderRadius: 8, background: '#c8991a', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>
              S'inscrire
            </button>
          </div>
          {nlMsg && <div style={{ marginTop: 12, fontSize: 13, opacity: .9 }}>{nlMsg}</div>}
          <div style={{ fontSize: 11, opacity: .4, marginTop: 12 }}>Gratuit · Sans spam · Désinscription en 1 clic</div>
        </div>
      </div>

      <footer style={{ background: '#111', color: 'rgba(255,255,255,.4)', textAlign: 'center', padding: '1.25rem', fontSize: 12 }}>
        © 2026 A-FRIC · Médias africains francophones · Diaspora Europe
      </footer>
    </div>
  );
}

const N = { background: '#1a6b3a', padding: '0 1.5rem', display: 'flex', alignItems: 'center', height: 52, position: 'sticky', top: 0, zIndex: 100 };
const LOGO = { fontSize: 22, fontWeight: 700, color: '#fff', fontFamily: 'Georgia,serif' };
const ABTN = { border: '1px solid rgba(255,255,255,.3)', color: '#fff', padding: '6px 14px', borderRadius: 6, textDecoration: 'none', fontSize: 12 };
