import type { NextApiRequest, NextApiResponse } from 'next'
import formidable from 'formidable'
import fs from 'fs'
import crypto from 'crypto'
import FormData from 'form-data'
import { Readable } from 'stream'

export const config = { api: { bodyParser: false } }

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' })

  const form = formidable({ multiples: false })
  const { fields, files } = await new Promise<{ fields: any, files: any }>((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) reject(err)
      else resolve({ fields, files })
    })
  })

  const file = files.audio
  const fp = Array.isArray(file) ? file[0].filepath : file.filepath
  if (!fp) return res.status(400).json({ error: 'No audio uploaded' })

  const host = process.env.ACRCLOUD_HOST!
  const accessKey = process.env.ACRCLOUD_ACCESS_KEY!
  const accessSecret = process.env.ACRCLOUD_ACCESS_SECRET!

  if (!host || !accessKey || !accessSecret) {
    return res.status(500).json({ error: 'Missing ACRCloud credentials' })
  }

  const data = fs.readFileSync(fp)
  const sampleBytes = data.slice(0, 10 * 1024 * 1024) // 10MB max

  const httpMethod = 'POST'
  const httpURI = '/v1/identify'
  const dataType = 'audio'
  const signatureVersion = '1'
  const timestamp = Math.floor(Date.now() / 1000).toString()

  const stringToSign = [
    httpMethod,
    httpURI,
    accessKey,
    dataType,
    signatureVersion,
    timestamp
  ].join('\n')

  const signature = crypto.createHmac('sha1', accessSecret)
    .update(Buffer.from(stringToSign, 'utf-8'))
    .digest('base64')

  const formData = new FormData()
  formData.append('access_key', accessKey)
  formData.append('sample', Readable.from(sampleBytes), {
    filename: 'hum.webm',
    contentType: 'audio/webm'
  })
  formData.append('timestamp', timestamp)
  formData.append('signature', signature)
  formData.append('data_type', dataType)
  formData.append('signature_version', signatureVersion)

  try {
    const acrRes = await fetch(`https://${host}/v1/identify`, {
      method: 'POST',
      headers: formData.getHeaders(),
      body: formData as any
    })

    const acrJson = await acrRes.json()

    const metadata = acrJson.metadata?.music?.[0]
    if (!metadata) {
      retu
