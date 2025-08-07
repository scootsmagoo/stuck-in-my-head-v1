import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const q = (req.query.q as string || '').trim()
  if (!q) return res.status(200).json({ tracks: [] })
  try {
    const tokenRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/spotify-token`)
    const { access_token } = await tokenRes.json()

    // We search tracks; to bias toward lyric text, include q as-is.
    const sp = await fetch(`https://api.spotify.com/v1/search?type=track&limit=10&q=${encodeURIComponent(q)}`, {
      headers: { Authorization: `Bearer ${access_token}` }
    })
    const j = await sp.json()
    const tracks = (j.tracks?.items || []).map((t:any) => ({
      id: t.id,
      name: t.name,
      artists: t.artists.map((a:any)=>a.name).join(', '),
      album: t.album?.name || '',
      image: t.album?.images?.[1]?.url || t.album?.images?.[0]?.url || '',
      preview_url: t.preview_url,
      external_url: t.external_urls?.spotify,
    }))
    res.status(200).json({ tracks })
  } catch (e:any) {
    res.status(500).json({ error: e?.message || 'lyrics search failed' })
  }
}
