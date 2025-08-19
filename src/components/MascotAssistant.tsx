// components/MascotAssistant.tsx
'use client'

import { useEffect, useRef, useState } from 'react'

export type MascotAssistantProps = {
  personaKey?: string
  brandName?: string
  position?: 'bottom-right' | 'bottom-left'
  accentClass?: string // Tailwind class e.g. 'bg-gray-900'
  initialMessage?: string
}

type Message = { id: string; role: 'user' | 'assistant'; content: string }

export default function MascotAssistant({
  personaKey = 'default',
  brandName,
  position = 'bottom-right',
  accentClass = 'bg-gray-900',
  initialMessage = 'How can I help?'
}: MascotAssistantProps) {
  const [open, setOpen] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const panelRef = useRef<HTMLDivElement | null>(null)
  const btnSide = position === 'bottom-left' ? 'left-6' : 'right-6'

  useEffect(() => {
    const cid = window.localStorage.getItem('mascot:conversationId')
    if (cid) setConversationId(cid)
  }, [])

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{ id: crypto.randomUUID(), role: 'assistant', content: initialMessage }])
    }
  }, [open, messages.length, initialMessage])

  async function sendMessage() {
    const text = input.trim()
    if (!text) return

    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: text }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/mascot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          personaKey,
          conversationId,
          brand: { name: brandName }
        })
      })

      if (!res.ok) throw new Error('Request failed')
      const data = await res.json()

      if (data.conversationId && data.conversationId !== conversationId) {
        setConversationId(data.conversationId)
        window.localStorage.setItem('mascot:conversationId', data.conversationId)
      }

      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: String(data.reply || 'Okay.')
      }
      setMessages(prev => [...prev, assistantMsg])
    } catch {
      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Sorry — something went wrong. Please try again.'
      }
      setMessages(prev => [...prev, assistantMsg])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!open) return
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        // setOpen(false) // enable if you want outside-click to close
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  return (
    <div className="fixed bottom-6 z-50 select-none">
      {/* Floating Button */}
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls="mascot-panel"
        onClick={() => setOpen(o => !o)}
        className={`group ${btnSide} absolute inline-flex items-center justify-center rounded-full ${accentClass} text-white shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black h-14 w-14`}
      >
        <span className="sr-only">Open Mascot assistant</span>
        <span className="text-lg font-semibold">M</span>
      </button>

      {/* Panel */}
      {open && (
        <div
          id="mascot-panel"
          role="dialog"
          aria-label="Mascot assistant"
          ref={panelRef}
          className={`absolute ${btnSide} bottom-20 w-[360px] max-h-[70vh] bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden`}
        >
          {/* Header */}
          <div className={`px-4 py-3 ${accentClass} text-white`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">M</div>
                <div>
                  <div className="text-sm font-semibold leading-tight">Mascot Assistant</div>
                  <div className="text-xs opacity-90 leading-tight">Persona: {personaKey}</div>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-white/90 hover:text-white focus:outline-none"
                aria-label="Close"
              >
                ×
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="px-4 py-3 space-y-3 overflow-y-auto" style={{ maxHeight: '50vh' }}>
            {messages.map(m => (
              <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={
                    'rounded-2xl px-3 py-2 text-sm max-w-[80%] ' +
                    (m.role === 'user' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900')
                  }
                >
                  {m.content}
                </div>
              </div>
            ))}
            {loading && <div className="text-xs text-gray-500">Thinking…</div>}
          </div>

          {/* Input */}
          <div className="p-3 border-t border-gray-200">
            <form
              onSubmit={e => {
                e.preventDefault()
                sendMessage()
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Type your message"
                className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                aria-label="Your message"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading}
                className={`px-3 py-2 rounded-xl text-sm text-white ${accentClass} disabled:opacity-50`}
              >
                Send
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
