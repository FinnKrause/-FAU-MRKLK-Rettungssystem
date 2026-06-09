import "./globals.css";

export const metadata = {
  title: "MRKLS Krisenkommunikation",
  description: "Rollenbasierte App für Bürger, Leitstelle und Drohnenkommunikation",
};

export default function RootLayout({ children }) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
