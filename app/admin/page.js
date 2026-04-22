'use client';
import { useState, useCallback, useRef } from 'react';
import Link from 'next/link';

const CATS = ['Technologie','Économie','Politique','Agriculture','Culture','Sport','Santé','Éducation','Environnement','Diaspora'];

export default function Admin() {
  const [authed, setAuthed] = useState(false);
  const [pw, setPw] = useState('');
  const [pwErr, setPwErr] = useState('');
  const [adminPw, setAdminPw] = useState('');
  const [tab, setTab] = useState('pending');
  const [articles, setArticles] = useState([]);
  const [subscribers, setSubscribers] = useState([]);
  const [eTitle, setETitle] = useState('');
  const [eCat, setECat] = useState('Technologie');
  const [eSource, setESource] = useState('');
  const [eContent, setEContent] = useState('');
  const [eImageUrl, setEImageUrl] = useState('');
  const [eImagePreview, setEImagePreview] = useState('');
  const [imgLoading, setImgLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [contentKey, setContentKey] = useState(0);
  const [aiLoading, setAiLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [genMsg, setGenMsg] = useState('');
  const [themes, setThemes] = useState([]);
  const [editArt, setEditArt] = useState(null);
  const [nlSubject, setNlSubject] = useState('');
  const [nlIntro, setNlIntro] = useState('');
  const [nlSelected, setNlSelected] = useState([]);
  const [nlMsg, setNlMsg] = useState('');
  const [nlPreview, setNlPreview] = useState('');
  const [toast, setToast] = useState('');
  const fileInputRef = useRef(null);
  const editFileInputRef = useRef(null);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3500); };

  const load = useCallback(async (p) => {
    const arts = await fetch('/api/articles').then(r => r.json()).catch(() => []);
    const subs = await fetch('/api/subscribers?key=' + p).then(r => r.json()).catch(() => []);
    setArticles(Array.isArray(arts) ? arts : []);
    setSubscribers(Array.isArray(subs) ? subs : []);
  }, []);

 const checkPw = async () => {
    const res = await fetch('/api/subscribers?key=' + pw);
    if (res.status === 401) { setPwErr('Mot de passe incorrect'); return; }
    setAdminPw(pw);
    setAuthed(true);
    load(pw);
    fetch('/api/auto-generate').then(r => r.json()).then(d => setThemes(d.themes || []));
  };

  const resetPassword = () => {
    window.location.href = 'mailto:barttoni52@gmail.com?subject=A-FRIC%20Admin%20-%20Récupération%20mot%20de%20passe&body=Bonjour,%0A%0AJe%20souhaite%20réinitialiser%20mon%20mot%20de%20passe%20admin%20A-FRIC.%0A%0AMon%20mot%20de%20passe%20actuel%20dans%20Vercel%20est%20dans%20Settings%20→%20Environment%20Variables%20→%20NEXT_PUBLIC_ADMIN_PASSWORD';
  };
  };

  const autoGenerate = async (themeIndex) => {
    setGenerating(true);
    setGenMsg('Groq génère des articles...');
    const r = await fetch('/api/auto-generate', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminKey: adminPw, themeIndex }),
    });
    const d = await r.json();
    if (d.success) {
      setGenMsg('✓ ' + d.count + ' articles sur "' + d.theme + '"');
      load(adminPw);
      setTab('pending');
      showToast('✓ ' + d.count + ' articles à valider !');
    } else setGenMsg('Erreur : ' + (d.error || 'inconnue'));
    setGenerating(false);
  };

  const publish = async (id) => {
    await fetch('/api/articles', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status: 'published' }) });
    load(adminPw);
    showToast('✓ Article publié !');
  };

  const reject = async (id) => {
    await fetch('/api/articles?id=' + id, { method: 'DELETE' });
    load(adminPw);
    showToast('Article supprimé');
  };

  const unpublish = async (id) => {
    await fetch('/api/articles', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status: 'draft' }) });
    load(adminPw);
    showToast('Article dépublié');
  };

  const deleteArt = async (id) => {
    if (!confirm('Supprimer ?')) return;
    await fetch('/api/articles?id=' + id, { method: 'DELETE' });
    load(adminPw);
    showToast('Supprimé');
  };

  // ── Recherche Unsplash via API serveur ─────────────────────────────────────
  const searchUnsplash = async (title, setUrl, setPreview) => {
    if (!title.trim()) { showToast('Entrez un titre d\'abord'); return; }
    setImgLoading(true);
    try {
      const query = encodeURIComponent(title + ' Africa');
      const res = await fetch(`/api/unsplash?query=${query}`);
      const data = await res.json();
      const url = data?.url;
      if (url) { setUrl(url); setPreview(url); showToast('✓ Image trouvée !'); }
      else showToast('Aucune image trouvée, essayez une URL ou téléchargez une photo');
    } catch { showToast('Erreur lors de la recherche Unsplash'); }
    setImgLoading(false);
  };

  // ── Upload image depuis téléphone/ordinateur ───────────────────────────────
  const uploadImage = async (file, setUrl, setPreview) => {
    if (!file) return;
    setUploadLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.url) {
        setUrl(data.url);
        setPreview(data.url);
        showToast('✓ Image uploadée !');
      } else {
        showToast('Erreur upload : ' + (data.error || 'inconnue'));
      }
    } catch { showToast('Erreur lors de l\'upload'); }
    setUploadLoading(false);
  };

  const saveManual = async (status) => {
    if (!eTitle.trim() || !eContent.trim()) { showToast('Titre et contenu requis'); return; }
    await fetch('/api/articles', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: eTitle, cat: eCat, source: eSource || 'A-FRIC Rédaction', content: eContent, image_url: eImageUrl || null, status })
    });
    setETitle(''); setECat('Technologie'); setESource('');
    setEContent(''); setEImageUrl(''); setEImagePreview('');
    setContentKey(k => k + 1);
    load(adminPw);
    showToast(status === 'published' ? '✓ Publié !' : '✓ Brouillon enregistré');
  };

  const aiWrite = async () => {
    if (!eTitle.trim()) { showToast('Entrez un titre'); return; }
    setAiLoading(true);
    try {
      const r = await fetch('/api/ai-write', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: eTitle, cat: eCat })
      });
      const d = await r.json();
      if (d.content && d.content.length > 0) {
        setEContent(d.content);
        setContentKey(k => k + 1);
        showToast('✓ ' + d.content.length + ' caractères générés !');
      } else showToast('Erreur : ' + (d.error || 'contenu vide'));
    } catch (err) { showToast('Erreur : ' + err.message); }
    setAiLoading(false);
  };

  const saveEdit = async (status) => {
    await fetch('/api/articles', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...editArt, status }) });
    setEditArt(null);
    load(adminPw);
    showToast('✓ Mis à jour !');
  };

  const genNewsletter = async () => {
    if (nlSelected.length === 0) { showToast('Sélectionnez des articles'); return; }
    setNlMsg('Génération...');
    const r = await fetch('/api/newsletter', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ subject: nlSubject, intro: nlIntro, articleIds: nlSelected, adminKey: adminPw }) });
    const d = await r.json();
    if (d.success) { setNlMsg('✓ Newsletter générée !'); setNlPreview(d.newsletter?.html_content || ''); }
    else setNlMsg('Erreur : ' + d.error);
  };

  // ── Bloc image réutilisable ─────────────────────────────────────────────────
  const ImageBlock = ({ imageUrl, setUrl, imagePreview, setPreview, title, fileRef }) => (
    <div style={{ marginBottom: 16 }}>
      <label style={S.lbl}>Image de l'article</label>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
        <input
          value={imageUrl}
          onChange={e => { setUrl(e.target.value); setPreview(e.target.value); }}
          placeholder="Coller une URL d'image..."
          style={{ ...S.inp, marginBottom: 0, flex: 1, minWidth: 160 }}
        />
        <button type="button" onClick={() => searchUnsplash(title, setUrl, setPreview)}
          disabled={imgLoading}
          style={{ ...S.btnO, whiteSpace: 'nowrap' }}>
          {imgLoading ? '⏳' : '🔍 Unsplash'}
        </button>
        <button type="button" onClick={() => fileRef.current?.click()}
          disabled={uploadLoading}
          style={{ ...S.btnO, whiteSpace: 'nowrap', background: '#fff' }}>
          {uploadLoading ? '⏳' : '📱 Télécharger'}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={e => e.target.files?.[0] && uploadImage(e.target.files[0], setUrl, setPreview)}
        />
      </div>
      {imagePreview && (
        <div style={{ position: 'relative' }}>
          <img src={imagePreview} alt="preview" style={{ width: '100%', maxHeight: 180, objectFit: 'cover', borderRadius: 8 }} />
          <button onClick={() => { setUrl(''); setPreview(''); }}
            style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,.5)', color: '#fff', border: 'none', borderRadius: 4, padding: '3px 8px', fontSize: 12, cursor: 'pointer' }}>✕</button>
        </div>
      )}
    </div>
  );

  const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
  const pending = articles.filter(a => a.status === 'draft');
  const published = articles.filter(a => a.status === 'published');

  if (!authed) return (
    <div style={{ minHeight: '100vh', background: '#1a6b3a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 14, padding: '2.5rem 2rem', width: 340 }}>
        <div style={{ fontSize: 26, fontWeight: 700, fontFamily: 'Georgia,serif', marginBottom: 4 }}>A<span style={{ color: '#c8991a' }}>-</span>FRIC</div>
        <div style={{ fontSize: 12, color: '#aaa', marginBottom: 28 }}>Espace Administrateur</div>
        <label style={S.lbl}>Mot de passe</label>
        <input type="password" value={pw} onChange={e => setPw(e.target.value)} onKeyDown={e => e.key === 'Enter' && checkPw()} placeholder="••••••••" style={{ ...S.inp, marginBottom: 12 }} />
        <button onClick={checkPw} style={{ ...S.btnG, width: '100%', padding: 12, fontSize: 14 }}>Connexion</button>
        {pwErr && <div style={{ fontSize: 12, color: '#b02a2a', marginTop: 8, textAlign: 'center' }}>{pwErr}</div>}
        <Link href="/" style={{ display: 'block', textAlign: 'center', marginTop: 16, fontSize: 12, color: '#aaa', textDecoration: 'none' }}>← Retour au site</Link>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f2' }}>
      <nav style={{ background: '#1a6b3a', padding: '0 1.5rem', display: 'flex', alignItems: 'center', height: 52, gap: 16 }}>
        <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'Georgia,serif', color: '#fff', flex: 1 }}>A<span style={{ color: '#c8991a' }}>-</span>FRIC <span style={{ fontSize: 12, opacity: .6, fontFamily: 'sans-serif', fontWeight: 400 }}>Admin</span></div>
        <Link href="/" style={{ color: 'rgba(255,255,255,.7)', fontSize: 12, textDecoration: 'none' }}>← Site public</Link>
        <button onClick={() => setAuthed(false)} style={{ background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.25)', color: '#fff', padding: '5px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>Déconnexion</button>
      </nav>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 20 }}>
          {[['En attente', pending.length, '#c8991a'], ['Publiés', published.length, '#1a6b3a'], ['Abonnés', subscribers.length, '#3a80d2'], ['Total', articles.length, '#555']].map(([l, n, c]) => (
            <div key={l} style={{ background: '#fff', borderRadius: 10, padding: '1rem', textAlign: 'center', border: '1px solid #eee' }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: c }}>{n}</div>
              <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>{l}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', borderBottom: '2px solid #e8e8e4', marginBottom: 20, overflowX: 'auto' }}>
          {[['pending','⏳ À valider ('+pending.length+')'],['published','✅ Publiés ('+published.length+')'],['auto','🤖 Générer'],['write','✏️ Rédiger'],['newsletter','📬 Newsletter']].map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)} style={{ padding: '10px 16px', fontSize: 13, cursor: 'pointer', border: 'none', background: 'transparent', borderBottom: tab === id ? '2px solid #1a6b3a' : '2px solid transparent', marginBottom: -2, color: tab === id ? '#1a6b3a' : '#888', fontWeight: tab === id ? 600 : 400, whiteSpace: 'nowrap' }}>{label}</button>
          ))}
        </div>

        {tab === 'pending' && (
          <div>
            {pending.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#bbb' }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>✓</div>
                <div>Aucun article en attente.</div>
                <button onClick={() => setTab('auto')} style={{ ...S.btnG, marginTop: 16 }}>🤖 Générer des articles</button>
              </div>
            ) : pending.map(a => (
              <div key={a.id} style={{ background: '#fff', border: '1px solid #eee', borderRadius: 10, padding: '1.25rem', marginBottom: 10 }}>
                {a.image_url && <img src={a.image_url} alt="" style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 7, marginBottom: 10 }} />}
                <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5, color: '#1a6b3a', fontWeight: 700, marginBottom: 4 }}>{a.cat}</div>
                <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6, color: '#111' }}>{a.title}</div>
                <div style={{ fontSize: 12, color: '#aaa', marginBottom: 10 }}>{a.source} · {fmtDate(a.created_at)} {a.type === 'auto' ? '· 🤖' : '· ✏️'}</div>
                <div style={{ fontSize: 13, color: '#666', lineHeight: 1.6 }}>{a.content.substring(0, 200)}...</div>
                <div style={{ display: 'flex', gap: 8, marginTop: 12, paddingTop: 12, borderTop: '1px solid #f5f5f3', flexWrap: 'wrap' }}>
                  <button onClick={() => publish(a.id)} style={{ ...S.btnG, fontSize: 13 }}>✓ Publier</button>
                  <button onClick={() => setEditArt({ ...a })} style={S.btnO}>Modifier</button>
                  <button onClick={() => reject(a.id)} style={{ ...S.btnO, color: '#b02a2a', borderColor: '#f5c5c5' }}>Rejeter</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'published' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {published.length === 0 && <div style={{ textAlign: 'center', padding: '3rem', color: '#bbb' }}>Aucun article publié.</div>}
            {published.map(a => (
              <div key={a.id} style={{ background: '#fff', border: '1px solid #eee', borderRadius: 10, padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: 12 }}>
                {a.image_url && <img src={a.image_url} alt="" style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} />}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 3, color: '#111' }}>{a.title}</div>
                  <div style={{ fontSize: 12, color: '#aaa' }}>{a.cat} · {a.source} · {fmtDate(a.created_at)}</div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => setEditArt({ ...a })} style={S.smBtn}>Modifier</button>
                  <button onClick={() => unpublish(a.id)} style={S.smBtn}>Dépublier</button>
                  <button onClick={() => deleteArt(a.id)} style={{ ...S.smBtn, color: '#b02a2a' }}>Suppr.</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'auto' && (
          <div style={{ background: '#fff', borderRadius: 12, padding: '1.5rem', border: '1px solid #eee' }}>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6, color: '#111' }}>Génération automatique</div>
            <div style={{ fontSize: 14, color: '#888', marginBottom: 20 }}>L'IA génère 3 articles basés sur les vraies actualités africaines. Ils arrivent en brouillon pour validation.</div>
            {themes.length === 0 && <div style={{ color: '#aaa', fontSize: 13, marginBottom: 16 }}>Chargement des thèmes...</div>}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 8, marginBottom: 16 }}>
              {themes.map((t, i) => (
                <button key={i} onClick={() => autoGenerate(i)} disabled={generating}
                  style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #eee', background: '#fafaf8', fontSize: 13, cursor: generating ? 'wait' : 'pointer', textAlign: 'left', color: '#333', opacity: generating ? .6 : 1 }}>
                  {t}
                </button>
              ))}
            </div>
            <button onClick={() => autoGenerate()} disabled={generating} style={{ ...S.btnG, padding: '12px 24px', fontSize: 14 }}>
              {generating ? '⏳ Génération en cours...' : '🎲 Thème aléatoire → 3 articles'}
            </button>
            {genMsg && <div style={{ marginTop: 16, padding: '12px 16px', background: '#f0faf4', borderRadius: 8, fontSize: 14, color: '#1a6b3a' }}>{genMsg}</div>}
          </div>
        )}

        {tab === 'write' && (
          <div style={{ background: '#fff', borderRadius: 12, padding: '1.5rem', border: '1px solid #eee' }}>
            <label style={S.lbl}>Titre *</label>
            <input value={eTitle} onChange={e => setETitle(e.target.value)} placeholder="Titre de l'article" style={S.inp} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div><label style={S.lbl}>Catégorie</label><select value={eCat} onChange={e => setECat(e.target.value)} style={S.inp}>{CATS.map(c => <option key={c}>{c}</option>)}</select></div>
              <div><label style={S.lbl}>Source</label><input value={eSource} onChange={e => setESource(e.target.value)} placeholder="RFI Afrique..." style={S.inp} /></div>
            </div>
            <ImageBlock
              imageUrl={eImageUrl} setUrl={setEImageUrl}
              imagePreview={eImagePreview} setPreview={setEImagePreview}
              title={eTitle} fileRef={fileInputRef}
            />
            <label style={S.lbl}>Contenu * {eContent.length > 0 && <span style={{ color: '#1a6b3a' }}>({eContent.length} caractères)</span>}</label>
            <textarea key={contentKey} defaultValue={eContent} onChange={e => setEContent(e.target.value)}
              placeholder="Rédigez ici ou cliquez sur ✦ Aide IA..."
              style={{ width: '100%', padding: '9px 12px', border: '1px solid #eee', borderRadius: 7, fontSize: 14, marginBottom: 12, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', color: '#111', background: '#fff', minHeight: 220, resize: 'vertical' }} />
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button onClick={() => saveManual('published')} style={S.btnG}>Publier</button>
              <button onClick={() => saveManual('draft')} style={S.btnO}>Brouillon</button>
              <button onClick={aiWrite} disabled={aiLoading} style={{ ...S.btnO, background: aiLoading ? '#999' : '#2a1a6b', color: '#fff', borderColor: '#2a1a6b', cursor: aiLoading ? 'wait' : 'pointer' }}>
                {aiLoading ? '⏳ Génération...' : '✦ Aide IA'}
              </button>
              <button onClick={() => { setETitle(''); setEContent(''); setESource(''); setEImageUrl(''); setEImagePreview(''); setContentKey(k => k + 1); }} style={S.btnO}>Effacer</button>
            </div>
          </div>
        )}

        {tab === 'newsletter' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: '#fff', borderRadius: 12, padding: '1.5rem', border: '1px solid #eee' }}>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, color: '#111' }}>Créer une newsletter</div>
              <label style={S.lbl}>Sujet</label>
              <input value={nlSubject} onChange={e => setNlSubject(e.target.value)} placeholder="A-FRIC · L'Afrique cette semaine" style={S.inp} />
              <label style={S.lbl}>Introduction</label>
              <textarea value={nlIntro} onChange={e => setNlIntro(e.target.value)} placeholder="Bonjour..." style={{ ...S.inp, minHeight: 80 }} />
              <label style={S.lbl}>Articles ({nlSelected.length} sélectionnés)</label>
              <div style={{ maxHeight: 240, overflowY: 'auto', border: '1px solid #eee', borderRadius: 8, marginBottom: 12 }}>
                {published.length === 0 && <div style={{ padding: 16, color: '#aaa', fontSize: 13 }}>Publiez d'abord des articles.</div>}
                {published.map(a => (
                  <label key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid #f5f5f3' }}>
                    <input type="checkbox" checked={nlSelected.includes(a.id)} onChange={() => setNlSelected(p => p.includes(a.id) ? p.filter(x => x !== a.id) : [...p, a.id])} />
                    <div><div style={{ fontSize: 13, fontWeight: 500, color: '#111' }}>{a.title}</div><div style={{ fontSize: 11, color: '#aaa' }}>{a.cat}</div></div>
                  </label>
                ))}
              </div>
              <button onClick={genNewsletter} style={{ ...S.btnG, width: '100%', padding: 12 }}>✉️ Générer ({subscribers.length} abonnés)</button>
              {nlMsg && <div style={{ fontSize: 13, color: '#1a6b3a', marginTop: 10, padding: '8px 12px', background: '#f0faf4', borderRadius: 6 }}>{nlMsg}</div>}
            </div>
            <div style={{ background: '#fff', borderRadius: 12, padding: '1.5rem', border: '1px solid #eee' }}>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 12, color: '#111' }}>Abonnés ({subscribers.length})</div>
              {subscribers.length === 0 ? <div style={{ color: '#aaa', fontSize: 13 }}>Aucun abonné.</div> : (
                <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                  {subscribers.map(s => (
                    <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f5f5f3' }}>
                      <div><div style={{ fontSize: 13, fontWeight: 500, color: '#111' }}>{s.name || s.email}</div>{s.name && <div style={{ fontSize: 11, color: '#aaa' }}>{s.email}</div>}</div>
                      <div style={{ fontSize: 11, color: '#ccc' }}>{fmtDate(s.subscribed_at)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {nlPreview && (
              <div style={{ gridColumn: '1/-1', background: '#fff', borderRadius: 12, padding: '1.5rem', border: '1px solid #eee' }}>
                <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 12, color: '#111' }}>Aperçu</div>
                <iframe srcDoc={nlPreview} style={{ width: '100%', height: 600, border: '1px solid #eee', borderRadius: 8 }} title="Aperçu" />
              </div>
            )}
          </div>
        )}
      </div>

      {editArt && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 200, padding: '2rem', overflowY: 'auto' }}>
          <div style={{ background: '#fff', borderRadius: 14, padding: '2rem', width: '100%', maxWidth: 660 }}>
            <div style={{ fontSize: 17, fontWeight: 600, marginBottom: 20, color: '#111' }}>Modifier l'article</div>
            <label style={S.lbl}>Titre</label>
            <input value={editArt.title} onChange={e => setEditArt({ ...editArt, title: e.target.value })} style={S.inp} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div><label style={S.lbl}>Catégorie</label><select value={editArt.cat} onChange={e => setEditArt({ ...editArt, cat: e.target.value })} style={S.inp}>{CATS.map(c => <option key={c}>{c}</option>)}</select></div>
              <div><label style={S.lbl}>Source</label><input value={editArt.source} onChange={e => setEditArt({ ...editArt, source: e.target.value })} style={S.inp} /></div>
            </div>
            <ImageBlock
              imageUrl={editArt.image_url || ''} setUrl={(url) => setEditArt(a => ({ ...a, image_url: url }))}
              imagePreview={editArt.image_url || ''} setPreview={(url) => setEditArt(a => ({ ...a, image_url: url }))}
              title={editArt.title} fileRef={editFileInputRef}
            />
            <label style={S.lbl}>Contenu</label>
            <textarea value={editArt.content} onChange={e => setEditArt({ ...editArt, content: e.target.value })} style={{ ...S.inp, minHeight: 200, resize: 'vertical' }} />
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => saveEdit('published')} style={S.btnG}>Publier</button>
              <button onClick={() => saveEdit('draft')} style={S.btnO}>Brouillon</button>
              <button onClick={() => setEditArt(null)} style={S.btnO}>Annuler</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div style={{ position: 'fixed', bottom: 24, right: 24, background: '#1a6b3a', color: '#fff', padding: '10px 20px', borderRadius: 8, fontSize: 13, zIndex: 300 }}>{toast}</div>}
    </div>
  );
}

const S = {
  lbl: { fontSize: 11, color: '#aaa', textTransform: 'uppercase', letterSpacing: .5, marginBottom: 4, display: 'block' },
  inp: { width: '100%', padding: '9px 12px', border: '1px solid #eee', borderRadius: 7, fontSize: 14, marginBottom: 12, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', color: '#111', background: '#fff' },
  btnG: { padding: '9px 20px', borderRadius: 7, cursor: 'pointer', fontSize: 13, fontWeight: 600, border: 'none', background: '#1a6b3a', color: '#fff' },
  btnO: { padding: '9px 20px', borderRadius: 7, cursor: 'pointer', fontSize: 13, border: '1px solid #eee', background: 'transparent', color: '#555' },
  smBtn: { padding: '5px 12px', fontSize: 12, borderRadius: 6, cursor: 'pointer', border: '1px solid #eee', background: 'transparent', color: '#555' },
};
