/**
 * HelpModal — Modal de Ajuda / Feedback
 * ============================================================
 * Permite ao usuário reportar bugs ou enviar sugestões com texto e imagem.
 * O envio cai diretamente no e-mail do administrador via EmailJS (sem backend).
 *
 * ─── PASSO A PASSO: CONFIGURAR EMAILJS ───────────────────────────────────────
 *
 * PASSO 1 — Criar conta gratuita
 *   Acesse https://www.emailjs.com/ e crie sua conta.
 *   O plano gratuito permite 200 envios/mês.
 *
 * PASSO 2 — Conectar seu Gmail
 *   • Email Services → Add New Service → Gmail
 *   • Connect Account → login com auraenglish7@gmail.com
 *   • Nome: "AuraUP" → Create Service
 *   • Anote o SERVICE_ID (ex: service_abc1234)
 *
 * PASSO 3 — Criar o Template
 *   • Email Templates → Create New Template
 *   • To Email  → auraenglish7@gmail.com
 *   • From Name → {{from_name}}
 *   • Reply To  → {{from_email}}
 *   • Subject   → [AuraUP] {{type}} — {{from_name}}
 *   • Body:
 *       Tipo: {{type}}
 *       Usuário: {{from_name}} <{{from_email}}>
 *       --- Mensagem ---
 *       {{message}}
 *       --- Imagem ---
 *       {{image_url}}
 *   • Save → anote o TEMPLATE_ID (ex: template_xyz5678)
 *
 * PASSO 4 — Public Key
 *   Account → API Keys → copie a Public Key
 *
 * PASSO 5 — Instalar SDK
 *   npm install @emailjs/browser
 *
 * PASSO 6 — Preencher as constantes abaixo com seus IDs reais
 *
 * PASSO 7 — Ativar o código de envio
 *   Na função handleSend(), descomente o bloco "emailjs.send"
 *   e delete a linha com throw new Error(...)
 *
 * PASSO 8 — Ativar Allowed Origins no painel EmailJS
 *   Coloque o domínio da Vercel para evitar spam.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useState, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { X, Send, Bug, Lightbulb, Image as ImageIcon, Trash2, Loader2, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

// ─── EmailJS Config — preencha com seus IDs reais (Passos 2, 3 e 4) ──────────
const EMAILJS_SERVICE_ID  = 'YOUR_SERVICE_ID'   // ex: 'service_abc1234'
const EMAILJS_TEMPLATE_ID = 'YOUR_TEMPLATE_ID'  // ex: 'template_xyz5678'
const EMAILJS_PUBLIC_KEY  = 'YOUR_PUBLIC_KEY'    // ex: 'user_AbCdEfGhIjKlMnOpQ'
const ADMIN_EMAIL         = 'auraenglish7@gmail.com'

const EMAIL_CONFIGURED =
  EMAILJS_SERVICE_ID  !== 'YOUR_SERVICE_ID' &&
  EMAILJS_TEMPLATE_ID !== 'YOUR_TEMPLATE_ID' &&
  EMAILJS_PUBLIC_KEY  !== 'YOUR_PUBLIC_KEY'

const MAX_IMAGES = 4
const MAX_FILE_SIZE = 3 * 1024 * 1024 // 3 MB

interface AttachedImage {
  id: string
  name: string
  dataUrl: string
}

type FeedbackType = 'bug' | 'suggestion'
type SendStatus   = 'idle' | 'sending' | 'success' | 'error'

interface HelpModalProps {
  open: boolean
  onClose: () => void
}

export function HelpModal({ open, onClose }: HelpModalProps) {
  const { user } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [type,     setType]     = useState<FeedbackType>('bug')
  const [message,  setMessage]  = useState('')
  const [images,   setImages]   = useState<AttachedImage[]>([])
  const [status,   setStatus]   = useState<SendStatus>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const reset = useCallback(() => {
    setType('bug')
    setMessage('')
    setImages([])
    setStatus('idle')
    setErrorMsg('')
  }, [])

  function handleClose() {
    if (status === 'sending') return
    reset()
    onClose()
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0) return

    const remainingSlots = MAX_IMAGES - images.length
    if (remainingSlots <= 0) {
      setErrorMsg(`Limite máximo de ${MAX_IMAGES} imagens atingido.`)
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    const selectedFiles = Array.from(files).slice(0, remainingSlots)
    if (files.length > remainingSlots) {
      setErrorMsg(`Você pode anexar no máximo ${MAX_IMAGES} imagens no total.`)
    } else {
      setErrorMsg('')
    }

    for (const file of selectedFiles) {
      if (file.size > MAX_FILE_SIZE) {
        setErrorMsg(`"${file.name}" excede o tamanho máximo de 3 MB.`)
        continue
      }
      const reader = new FileReader()
      reader.onload = () => {
        const dataUrl = reader.result as string
        setImages(prev => {
          if (prev.length >= MAX_IMAGES) return prev
          return [
            ...prev,
            {
              id: Math.random().toString(36).substring(2, 9),
              name: file.name,
              dataUrl,
            },
          ]
        })
      }
      reader.readAsDataURL(file)
    }

    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function removeImage(id: string) {
    setImages(prev => prev.filter(img => img.id !== id))
    setErrorMsg('')
  }

  async function handleSend() {
    if (!message.trim()) { setErrorMsg('Escreva sua mensagem antes de enviar.'); return }
    setErrorMsg('')
    setStatus('sending')

    const fromName  = user?.nickname || user?.name || 'Usuário'
    const fromEmail = user?.email || 'sem-email@auraup.com'
    const typeLabel = type === 'bug' ? '🐛 Bug' : '💡 Sugestão'

    try {
      if (EMAIL_CONFIGURED) {
        // ── Passo 7: descomente após instalar o SDK (Passo 5) ─────────────
        // const emailjs = (await import('@emailjs/browser')).default
        // await emailjs.send(
        //   EMAILJS_SERVICE_ID,
        //   EMAILJS_TEMPLATE_ID,
        //   {
        //     from_name: fromName,
        //     from_email: fromEmail,
        //     type: typeLabel,
        //     message: message.trim(),
        //     images_count: images.length,
        //     image_urls: images.map(img => img.dataUrl).join('\n\n') || '(sem imagem)',
        //   },
        //   EMAILJS_PUBLIC_KEY,
        // )
        throw new Error('SDK do EmailJS não instalado. Siga o Passo 5 nos comentários do HelpModal.tsx.')
      } else {
        // Fallback mailto — usado enquanto EmailJS não estiver configurado
        const subject = encodeURIComponent(`[AuraUP] ${typeLabel} — ${fromName}`)
        const body    = encodeURIComponent(
          `Tipo: ${typeLabel}\nUsuário: ${fromName} <${fromEmail}>\n\n${message.trim()}` +
          (images.length > 0 ? `\n\n[${images.length} imagem(ns) anexada(s) — visualização disponível via EmailJS]` : '')
        )
        window.open(`mailto:${ADMIN_EMAIL}?subject=${subject}&body=${body}`, '_blank')
        setStatus('success')
        return
      }
      setStatus('success')
    } catch (err: any) {
      setErrorMsg(err?.message || 'Falha ao enviar. Tente novamente.')
      setStatus('error')
    }
  }

  if (!open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/75 backdrop-blur-xs animate-fade-in"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-label="Ajuda e Feedback"
    >
      <div
        onClick={e => e.stopPropagation()}
        className="w-full max-w-[480px] max-h-[92dvh] sm:max-h-[85vh] my-0 sm:my-auto flex flex-col rounded-t-3xl sm:rounded-2xl overflow-hidden shadow-2xl animate-pop-in border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 sm:py-4 shrink-0 border-b border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800">
          <h2 className="text-base sm:text-lg font-heading font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="text-lg">🆘</span> Ajuda &amp; Feedback
          </h2>
          <button onClick={handleClose} aria-label="Fechar" disabled={status === 'sending'}
            className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center justify-center transition-all cursor-pointer shrink-0 active:scale-90 disabled:opacity-50">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 overscroll-contain custom-scrollbar flex flex-col gap-5">
          {status === 'success' ? (
            <div className="flex flex-col items-center justify-center gap-4 py-10 text-center">
              <CheckCircle2 size={52} className="text-emerald-500" />
              <div>
                <p className="font-heading font-bold text-slate-900 dark:text-white text-base">Mensagem enviada!</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Obrigado pelo feedback. Isso nos ajuda a melhorar o AuraUP! 🚀</p>
              </div>
              <button type="button" onClick={handleClose}
                className="mt-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-heading font-bold text-sm transition-all active:scale-95 cursor-pointer">
                Fechar
              </button>
            </div>
          ) : (
            <>
              {/* Tipo */}
              <div>
                <label className="block text-xs font-heading font-semibold text-slate-600 dark:text-slate-400 mb-2 uppercase tracking-wide">Tipo</label>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setType('bug')}
                    className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-heading font-bold transition-all cursor-pointer active:scale-95 ${
                    type === 'bug'
                      ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-300 dark:border-rose-700 text-rose-700 dark:text-rose-300'
                      : 'bg-slate-50 dark:bg-slate-700/60 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}>
                    <Bug size={14} /> Reportar Bug
                  </button>
                  <button type="button" onClick={() => setType('suggestion')}
                    className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-heading font-bold transition-all cursor-pointer active:scale-95 ${
                    type === 'suggestion'
                      ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300'
                      : 'bg-slate-50 dark:bg-slate-700/60 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}>
                    <Lightbulb size={14} /> Sugestão
                  </button>
                </div>
              </div>

              {/* Mensagem */}
              <div>
                <label htmlFor="help-message" className="block text-xs font-heading font-semibold text-slate-600 dark:text-slate-400 mb-2 uppercase tracking-wide">Mensagem</label>
                <textarea id="help-message" rows={4} value={message} onChange={e => setMessage(e.target.value)}
                  placeholder={type === 'bug' ? 'Descreva o problema e como reproduzi-lo...' : 'Descreva sua sugestão de melhoria...'}
                  disabled={status === 'sending'}
                  className="w-full resize-none text-sm px-3.5 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/60 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-all disabled:opacity-60 font-sans leading-relaxed"
                />
              </div>

              {/* Imagens */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-heading font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                    Imagens (opcional)
                  </label>
                  <span className="text-[11px] font-heading font-medium text-slate-400 dark:text-slate-500">
                    {images.length}/{MAX_IMAGES}
                  </span>
                </div>

                {images.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                    {images.map(img => (
                      <div key={img.id} className="flex items-center gap-2.5 p-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/60">
                        <img src={img.dataUrl} alt="Preview" className="w-11 h-11 object-cover rounded-lg border border-slate-200 dark:border-slate-600 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">{img.name}</p>
                          <p className="text-[10px] text-emerald-600 dark:text-emerald-400">Anexada</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeImage(img.id)}
                          aria-label={`Remover imagem ${img.name}`}
                          className="w-7 h-7 rounded-lg bg-rose-100 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center hover:bg-rose-200 dark:hover:bg-rose-900 transition-colors cursor-pointer shrink-0"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {images.length < MAX_IMAGES && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={status === 'sending'}
                    className={`w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-600 text-slate-400 dark:text-slate-400 hover:border-blue-400 hover:text-blue-500 dark:hover:border-blue-500 dark:hover:text-blue-400 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                      images.length > 0 ? 'py-2.5 px-3 text-xs font-heading font-semibold' : 'flex-col py-4 px-4 gap-1.5'
                    }`}
                  >
                    <ImageIcon size={images.length > 0 ? 16 : 20} />
                    <span className="text-xs font-heading font-semibold">
                      {images.length > 0 ? '+ Adicionar mais imagens' : 'Clique para adicionar imagens'}
                    </span>
                    {images.length === 0 && (
                      <span className="text-[11px] text-slate-400 dark:text-slate-500">
                        PNG, JPG ou WEBP — até {MAX_IMAGES} imagens (máx. 3 MB cada)
                      </span>
                    )}
                  </button>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={handleImageChange}
                />
              </div>

              {!EMAIL_CONFIGURED && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                  <strong>⚠️ E-mail direto não configurado.</strong> O botão "Enviar" abrirá seu cliente de e-mail como alternativa.
                  Configure o EmailJS seguindo os comentários no arquivo <code className="font-mono bg-amber-100 dark:bg-amber-900/50 px-1 py-0.5 rounded">HelpModal.tsx</code>.
                </div>
              )}

              {errorMsg && (
                <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold">⚠️ {errorMsg}</p>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {status !== 'success' && (
          <div className="shrink-0 px-4 sm:px-6 py-3 sm:py-3.5 border-t border-slate-100 dark:border-slate-700 bg-slate-50/90 dark:bg-slate-800/95 backdrop-blur-xs flex items-center justify-between gap-2.5"
            style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 12px)' }}>
            <span className="text-[11px] text-slate-400 dark:text-slate-500 font-sans">
              Enviando como <strong>{user?.nickname || user?.name}</strong>
            </span>
            <button type="button" id="help-send-btn" onClick={handleSend}
              disabled={status === 'sending' || !message.trim()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white disabled:text-slate-400 font-heading font-bold text-xs transition-all active:scale-95 cursor-pointer disabled:cursor-not-allowed">
              {status === 'sending'
                ? <><Loader2 size={14} className="animate-spin" /> Enviando...</>
                : <><Send size={14} /> Enviar</>}
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}