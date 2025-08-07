import type { NextApiRequest, NextApiResponse } from 'next'

let cachedToken: { access_token: string, expires_at: number } | null = null

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (cachedToken && Date.now() < cachedToken.expires_at - 10_000) {
      return res.status(200).json({ access_token: cachedToken.access_token })
    }
    const clientId = process.env.SPOTIFY_CLIENT_ID!
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET!
    if (!clientId || !clientSecret) {
      return res.status(500).json({ error: 'Missing Spotify credentials' })
    }
    const body = new URLSearchParams()
    body.set('grant_type', 'client_credentials')
    const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString()
    })
    const tokenJson = await tokenRes.json()
    if (!tokenRes.ok) {
      return res.status(tokenRes.status).json(tokenJson)
    }
    cachedToken = {
      access_token: tokenJson.access_token,
      expires_at: Date.now() + tokenJson.expires_in*1000,
    }
    return res.status(200).json({ access_token: cachedToken.access_token })
  } catch (e:any) {
    return res.status(500).json({ error: e?.message || 'token failed' })
  }
}
