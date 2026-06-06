export default function manifest() {
  return {
    name: 'Local Voice - Kavarappattu',
    short_name: 'Local Voice',
    description: 'Community platform for Kavarappattu village',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#3b82f6',
    icons: [
      {
        src: '/icon-192x192.png?v=2',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512x512.png?v=2',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
