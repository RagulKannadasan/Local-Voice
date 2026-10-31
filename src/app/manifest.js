export default function manifest() {
  return {
    name: 'Kavarappattu',
    short_name: 'Kavarappattu',
    description: 'Community platform for Kavarappattu village',
    start_url: '/',
    display: 'standalone',
    background_color: '#0B0B0C',
    theme_color: '#F5A524',
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
