export const config = {
  runtime: 'edge',
}

export default async function handler(req) {
  if (req.method !== 'GET') {
    return new Response('Method Not Allowed', { status: 405 })
  }

  const { searchParams } = new URL(req.url)
  const text = searchParams.get('text') || ''
  const lang = searchParams.get('lang') || 'en-US'

  const clean = text.replace(/<[^>]*>/g, ' ').replace(/[()\[\]{}_]/g, ' ').trim()
  if (!clean) {
    return new Response('Missing text', { status: 400 })
  }

  // Google Translate TTS endpoint (same as AwesomeTTS en-US)
  const googleTtsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${encodeURIComponent(lang)}&client=tw-ob&q=${encodeURIComponent(clean.slice(0, 200))}`

  try {
    const upstream = await fetch(googleTtsUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'audio/mpeg,audio/*;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    })

    if (!upstream.ok) {
      return new Response(`TTS upstream failed with status ${upstream.status}`, { status: 502 })
    }

    const audioBuffer = await upstream.arrayBuffer()

    return new Response(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=86400, s-maxage=604800, immutable',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (err) {
    return new Response(err?.message || 'Internal TTS Error', { status: 500 })
  }
}
