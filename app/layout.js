export const metadata = {
  title: 'A-FRIC · Médias africains francophones',
  description: 'Actualités africaines pour la diaspora en Europe. Politique, économie, culture, sport et bien plus.',
  metadataBase: new URL('https://afric-media.vercel.app'),

  // ── Open Graph (Facebook, WhatsApp, LinkedIn) ──────────────────────────────
  openGraph: {
    title: 'A-FRIC · Médias africains francophones',
    description: 'Actualités africaines pour la diaspora en Europe. Politique, économie, culture, sport et bien plus.',
    url: 'https://afric-media.vercel.app',
    siteName: 'A-FRIC',
    images: [
      {
        url: 'https://afric-media.vercel.app/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'A-FRIC · Médias africains francophones',
      },
    ],
    locale: 'fr_FR',
    type: 'website',
  },

  // ── Twitter / X ────────────────────────────────────────────────────────────
  twitter: {
    card: 'summary_large_image',
    title: 'A-FRIC · Médias africains francophones',
    description: 'Actualités africaines pour la diaspora en Europe.',
    images: ['https://afric-media.vercel.app/og-image.jpg'],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <head>
        {/* WhatsApp & autres plateformes lisent les balises OG standard ci-dessus */}
        <meta name="theme-color" content="#1a6b3a" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://afric-media.vercel.app" />
      </head>
      <body style={{ margin: 0, padding: 0, fontFamily: 'Georgia, serif' }}>
        {children}
      </body>
    </html>
  );
}
