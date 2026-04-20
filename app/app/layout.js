export const metadata = {
  title: 'A-FRIC · Médias africains francophones',
  description: 'Actualités africaines pour la diaspora en Europe',
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body style={{ margin: 0, padding: 0, fontFamily: 'Georgia, serif' }}>
        {children}
      </body>
    </html>
  );
}
