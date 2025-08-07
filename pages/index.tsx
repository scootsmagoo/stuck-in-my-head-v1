import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Mic, Music2, Search, Sparkles } from 'lucide-react'

type Track = {
  id: string
  name: string
  artists: string
  album: string
  image: string
  preview_url?: string | null
  external_url?: string
}

export default function Home() {
  const [tab, setTab] = useState<'hum'|'lyrics'>('hum')
  const [query, setQuery] = useState('')
  const [tracks, setTracks] = useState<Track[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<BlobPart[]>([])
  const [recording, setRecording] = useState(false)

  useEffect(() => { setTracks([]); setError(null); }, [tab])

  async function searchLyrics(e?: React.FormEvent) {
    e?.preventDefault()
    if (!query.trim()) return
    setLoading(true); setError(null)
    try {
      const res = await fetch(`/api/lyrics-search?q=${encodeURIComponent(query.trim())}`)
      const data = await res.json()
      setTracks(data.tracks || [])
    } catch (err:any) {
      setError(err?.message || 'Search failed')
    } finally {
      setLoading(false)
    }
  }

  async function startRecording() {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream)
      chunksRef.current = []
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      mr.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        setLoading(true)
        try {
          const form = new FormData()
          form.append('audio', blob, 'hum.webm')
          const res = await fetch('/api/hum-search', { method: 'POST', body: form })
          const data = await res.json()
          setTracks(data.tracks || [])
          if (data.note) setError(data.note) // show placeholder note
        } catch (e:any) {
          setError(e?.message || 'Hum search failed')
        } finally {
          setLoading(false)
        }
      }
      mediaRecorderRef.current = mr
      mr.start()
      setRecording(true)
    } catch (e:any) {
      setError(e?.message || 'Mic access denied')
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop()
    setRecording(false)
  }

  return (
    <main className="min-h-screen p-6 md:p-10">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-6 md:p-8"
        >
          <div className="flex items-center gap-3">
            <Music2 className="w-8 h-8" />
            <h1 className="text-3xl md:text-4xl font-bold">Stuck in My Head</h1>
            <Sparkles className="w-5 h-5 opacity-70" />
          </div>

          <div className="mt-6 grid grid-cols-2 gap-2 bg-white/10 rounded-full p-1 w-max">
            <button
              onClick={() => setTab('hum')}
              className={`px-4 py-2 rounded-full transition ${tab==='hum' ? 'glass' : 'text-white/80'}`}
              aria-pressed={tab==='hum'}
            >Hum</button>
            <button
              onClick={() => setTab('lyrics')}
              className={`px-4 py-2 rounded-full transition ${tab==='lyrics' ? 'glass' : 'text-white/80'}`}
              aria-pressed={tab==='lyrics'}
            >Lyrics</button>
          </div>

          {tab === 'lyrics' && (
            <form onSubmit={searchLyrics} className="mt-6 flex gap-2">
              <label className="sr-only" htmlFor="q">Search lyrics</label>
              <input
                id="q"
                value={query}
                onChange={(e)=>setQuery(e.target.value)}
                placeholder="Type a lyric… e.g., 'blue jean baby'"
                className="flex-1 rounded-lg px-4 py-3 bg-black/30 border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/40"
              />
              <button className="glass rounded-lg px-4 py-3 flex items-center gap-2">
                <Search className="w-5 h-5" /> Search
              </button>
            </form>
          )}

          {tab === 'hum' && (
            <div className="mt-6 flex flex-col items-center gap-4">
              <p className="text-white/90 text-center">Press and hum a few seconds. We’ll try to guess.</p>
              <button
                onMouseDown={startRecording}
                onMouseUp={stopRecording}
                onTouchStart={startRecording}
                onTouchEnd={stopRecording}
                className={`rounded-full p-6 md:p-8 ${recording ? 'bg-pink-500' : 'glass'}`}
                aria-pressed={recording}
                aria-label={recording ? 'Recording… release to stop' : 'Hold to record'}
              >
                <Mic className="w-10 h-10" />
              </button>
              <p className="text-xs text-white/70">(Hold the mic to record; release to stop.)</p>
            </div>
          )}

          {loading && <p className="mt-6 text-white/90">Searching…</p>}
          {error && <p className="mt-2 text-pink-200">{error}</p>}

          <div className="mt-6 grid gap-4">
            {tracks.map(t => (
              <div key={t.id} className="glass rounded-xl p-4 flex items-center gap-4">
                <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-white/10">
                  {t.image && <Image src={t.image} alt="" fill sizes="64px" />}
                </div>
                <div className="flex-1">
                  <div className="font-semibold">{t.name}</div>
                  <div className="text-sm text-white/80">{t.artists} — {t.album}</div>
                  {t.preview_url && (
                    <audio className="mt-2 w-full" controls preload="none" src={t.preview_url} />
                  )}
                </div>
                {t.external_url && (
                  <a target="_blank" rel="noreferrer" href={t.external_url} className="glass px-3 py-2 rounded-lg">
                    Open
                  </a>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </main>
  )
}
