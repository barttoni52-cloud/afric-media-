import { createClient } from '@supabase/supabase-js';

const IMGS = {
  'Technologie':   'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200&q=80',
  'Économie':      'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1200&q=80',
  'Politique':     'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=1200&q=80',
  'Agriculture':   'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=1200&q=80',
  'Culture':       'https://images.unsplash.com/photo-1590656872261-3c37a5ed0a2b?w=1200&q=80',
  'Sport':         'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=1200&q=80',
  'Santé':         'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1200&q=80',
  'Éducation':     'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1200&q=80',
  'Environnement': 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200&q=80',
  'Diaspora':      'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=1200&q=80',
  'default':       'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=1200&q=80',
};

async function getArticle(id) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  const { data } = await supabase
    .from('articles')
    .select('*')
    .eq('id', id)
    .eq('status', 'published')
    .single();
  return data;
}

// ── Métadonnées Open Graph dynamiques par article ──────────────────────────
export async function generateMetadata({ params }) {
  const article = await getArticle(params.id);
  if (!article) return { title: 'A-FRIC' };

  const image = article.image_url || IMGS[article.cat] || IMGS.default;
  const excerpt = article.content?.substring(0, 160) + '...';
  const url = `https://afric-media.vercel.app/article/${params.id}`;

  return {
    title: `${article.title} · A-FRIC`,
    description: excerpt,
    metadataBase: new URL('https://afric-media.vercel.app'),
    openGraph: {
      title: article.title,
      description: excerpt,
      url,
      siteName: 'A-FRIC',
      images: [{ url: image, width: 1200, height: 630, alt: article.title }],
      locale: 'fr_FR',
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: excerpt,
      images: [image],
    },
  };
}

// ── Page article ────────────────────────────────────────────────────────────
export default async function ArticlePage({ params }) {
  const article = await getArticle(params.id);

  if (!article) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Georgia,serif' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>😔</div>
          <h1 style={{ color: '#111' }}>Article introuvable</h1>
          <a href="/" style={{ color: '#1a6b3a', textDecoration: 'none' }}>← Retour à l'accueil</a>
        </div>
      </div>
    );
  }

  const image = article.image_url || IMGS[article.cat] || IMGS.default;
  const url = `https://afric-media.vercel.app/article/${params.id}`;
  const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '';

  return (
    <div style={{ minHeight: '100vh', background: '#faf8f4', fontFamily: 'Georgia,serif' }}>
      {/* Nav */}
      <nav style={{ background: '#1a6b3a', padding: '0 1.5rem', display: 'flex', alignItems: 'center', height: 52, position: 'sticky', top: 0, zIndex: 100 }}>
        <a href="/" style={{ fontSize: 22, fontWeight: 700, color: '#fff', fontFamily: 'Georgia,serif', textDecoration: 'none' }}>
          A<span style={{ color: '#c8991a' }}>-</span>FRIC
        </a>
        <div style={{ flex: 1 }} />
        <a href="/admin" style={{ border: '1px solid rgba(255,255,255,.3)', color: '#fff', padding: '6px 14px', borderRadius: 6, textDecoration: 'none', fontSize: 12 }}>Admin</a>
      </nav>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '2rem 1.5rem' }}>
        <a href="/" style={{ background: 'none', border: 'none', color: '#1a6b3a', fontSize: 13, display: 'block', marginBottom: 24, textDecoration: 'none' }}>← Tous les articles</a>
        
        <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 2, color: '#1a6b3a', fontWeight: 700, marginBottom: 8 }}>{article.cat}</div>
        <h1 style={{ fontSize: 28, fontWeight: 700, lineHeight: 1.25, marginBottom: 12, fontFamily: 'Georgia,serif', color: '#111', margin: '0 0 12px' }}>{article.title}</h1>
        <div style={{ fontSize: 13, color: '#999', marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid #eee' }}>
          {article.source} · {fmtDate(article.created_at)}
        </div>

        <img src={image} alt={article.title} style={{ width: '100%', height: 300, objectFit: 'cover', borderRadius: 10, marginBottom: 24 }} />

        <div style={{ fontSize: 16, lineHeight: 1.85, color: '#222' }}>
          {article.content.split('\n').filter(l => l.trim()).map((p, i) => (
            <p key={i} style={{ marginBottom: 16 }}>{p}</p>
          ))}
        </div>

        {/* Boutons de partage avec l'URL de l'article */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 24, paddingTop: 24, borderTop: '1px solid #eee' }}>
          <span style={{ fontSize: 12, color: '#999', alignSelf: 'center' }}>Partager :</span>
          {[
            ['Facebook', `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '#1877f2'],
            ['WhatsApp', `https://wa.me/?text=${encodeURIComponent(article.title + ' ' + url)}`, '#25d366'],
            ['X', `https://twitter.com/intent/tweet?text=${encodeURIComponent(article.title)}&url=${encodeURIComponent(url)}`, '#000'],
            ['LinkedIn', `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '#0077b5'],
          ].map(([label, href, bg]) => (
            <a key={label} href={href} target="_blank" rel="noreferrer"
              style={{ padding: '5px 14px', borderRadius: 20, background: bg, color: '#fff', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
              {label}
            </a>
          ))}
        </div>

        <div style={{ marginTop: 24, padding: '12px 16px', background: '#f0faf4', borderRadius: 8, fontSize: 12, color: '#777' }}>
          Source : {article.source} · A-FRIC Médias africains francophones
        </div>
      </div>

      <footer style={{ background: '#111', color: 'rgba(255,255,255,.4)', textAlign: 'center', padding: '1.25rem', fontSize: 12, marginTop: 32 }}>
        © 2026 A-FRIC · Médias africains francophones · Diaspora Europe
      </footer>
    </div>
  );
}
