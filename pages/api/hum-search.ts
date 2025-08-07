import type { NextApiRequest, NextApiResponse } from 'next'
import formidable from 'formidable'
import fs from 'fs'

export const config = { api: { bodyParser: false } }

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' })

  // Parse multipart form (audio file from MediaRecorder)
  const form = formidable({ multiples: false })
  const { fields, files } = await new Promise<{fields:any, files:any}>((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) reject(err)
      else resolve({ fields, files })
    })
  })
  const file = files.audio
  if (!file) return res.status(400).json({ error: 'No audio uploaded' })

  // Placeholder: we are not processing the audio here.
  // === HOW TO INTEGRATE ACRCLOUD ===
  // 1) Convert the uploaded file to PCM/WAV if needed.
  // 2) Send bytes or base64 to ACRCloud identify endpoint with your keys.
  // 3) Parse response; if a Spotify ID is present, enrich via Spotify lookup.
  // Docs: https://docs.acrcloud.com/reference/identify-protocols
  // =================================

  // For now, return a friendly note and do a fallback to Spotify text search using a hint, if provided.
  // You can send `hint` text in the same multipart (not required).
  const hint = (fields?.hint && String(fields.hint)) || ''
  const note = 'Hum recognition not wired yet — using your optional hint (if any) for a text search. Add ACRCloud in /pages/api/hum-search.ts.'

  if (!hint) {
    return res.status(200).json({ tracks: [], note })
  }

  try {
    const tokenRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/spotify-token`)
    const { access_token } = await tokenRes.json()
    const sp = await fetch(`https://api.spotify.com/v1/search?type=track&limit=10&q=${encodeURIComponent(hint)}`, {
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
    return res.status(200).json({ tracks, note })
  } catch (e:any) {
    return res.status(500).json({ error: e?.message || 'hum search failed' })
  } finally {
    // cleanup temp file if present
    try {
      const fp = Array.isArray(file) ? file[0].filepath : file.filepath
      if (fp) fs.unlink(fp, ()=>{})
    } catch {}
  }
}
