import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'iKids Portal',
    short_name: 'iKids',
    description: 'iKids ESL Management Portal for Parents and Teachers',
    start_url: '/',
    display: 'standalone',
    background_color: '#FFF9F0',
    theme_color: '#FF6B6B',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  }
}


