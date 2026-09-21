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
 *   O plano gratuito permite 200 envios/mês (suficiente para feedbacks).
 *
 * PASSO 2 — Conectar seu Gmail
 *   • No painel, vá em: Email Services → Add New Service
 *   • Escolha Gmail
 *   • Clique em "Connect Account" → faça login com auraenglish7@gmail.com
 *   • Dê o nome "AuraUP" ao serviço e clique em "Create Service"
 *   • Anote o SERVICE_ID gerado (ex: service_abc1234)
 *
 * PASSO 3 — Criar o Template de e-mail
 *   • Vá em: Email Templates → Create New Template
 *   • Preencha os campos:
 *       To Email  → auraenglish7@gmail.com
 *       From Name → {{from_name}}
 *       Reply To  → {{from_email}}
 *       Subject   → [AuraUP] {{type}} — {{from_name}}
 *   • No corpo (Body), cole:
 *
 *       Novo feedback recebido pelo AuraUP:
 *
 *       Tipo: {{type}}
 *       Usuário: {{from_name}}
 *       E-mail: {{from_email}}
 *
 *       --- Mensagem ---
 *       {{message}}
 *
 *       --- Imagem ---
 *       {{image_url}}
 *
 *   • Clique em Save e anote o TEMPLATE_ID (ex: template_xyz5678)
 *
 * PASSO 4 — Pegar sua Public Key
 *   • Clique no seu nome (canto superior direito) → Account → aba "API Keys"
 *   • Copie a Public Key (ex: user_AbCdEfGhIjKlMnOpQ)
 *
 * PASSO 5 — Instalar o SDK
 *   No terminal, dentro da pasta do projeto:
 *     npm install @emailjs/browser
 *
 * PASSO 6 — Preencher as constantes abaixo
 *   Substitua os valores 'YOUR_*' pelos IDs reais que você anotou nos passos anteriores:
 *     EMAILJS_SERVICE_ID  → SERVICE_ID do passo 2
 *     EMAILJS_TEMPLATE_ID → TEMPLATE_ID do passo 3
 *     EMAILJS_PUBLIC_KEY  → Public Key do passo 4
 *
 * PASSO 7 — Ativar o código de envio
 *   Na função handleSend() abaixo, localize o bloco comentado com:
 *     "Descomente após instalar o SDK"
 *   Remova os comentários (//) e delete a linha com throw new Error(...)
 *
 * PASSO 8 — Testar antes de fazer deploy
 *   • Rode o app localmente (npm run dev)
 *   • Abra o menu Ajuda & Feedback
 *   • Escreva uma mensagem e clique em Enviar
 *   • Verifique o Gmail de auraenglish7@gmail.com
 *   • No painel do EmailJS → Email Logs, você vê todos os envios com status
 *
 * ⚠️  SEGURANÇA: A Public Key é exposta no front-end (comportamento intencional
 *   do EmailJS — ela só autoriza ENVIO, não leitura). Para evitar spam, ative as
 *   "Allowed Origins" no painel do EmailJS com o domínio da Vercel:
 *   https://seu-app.vercel.app
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useState, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { X, Send, Bug, Lightbulb, Image as ImageIcon, Trash2, Loader2, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

// ─── EmailJS Config ───────────────────────────────────────────────────────────
// Preencha com seus dados reais após seguir o passo a passo acima (Passos 2, 3 e 4)
const EMAILJS_SERVICE_ID  = 'YOUR_SERVICE_ID'   // Passo 2 — ex: 'service_abc1234'
const EMAILJS_TEMPLATE_ID = 'YOUR_TEMPLATE_ID'  // Passo 3 — ex: 'template_xyz5678'
const EMAILJS_PUBLIC_KEY  = 'YOUR_PUBLIC_KEY'    // Passo 4 — ex: 'user_AbCdEfGhIjKlMnOpQ'
const ADMIN_EMAIL         = 'auraenglish7@gmail.com'

const EMAIL_CONFIGURED =
  EMAILJS_SERVICE_ID  !== 'YOUR_SERVICE_ID' &&
  EMAILJS_TEMPLATE_ID !== 'YOUR_TEMPLATE_ID' &&
  EMAILJS_PUBLIC_KEY  !== 'YOUR_PUBLIC_KEY'

// ─── Tipos ───────────────────────────────────────────────────────────────────
type FeedbackType = 'bug' | 'suggestion'
type SendStatus   = 'idle' | 'sending' | 'success' | 'error'

interface HelpModalProps {
  open: boolean
  onClose: () => void
}

// ─────────────────────────────────────────────────────────────────────────────
export function HelpModal({ open, onClose }: HelpModalProps) {
  const { user } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [type,      setType]      = useState<FeedbackType>('bug')
  const [message,   setMessage]   = useState('')
  const [imageB64,  setImageB64]  = useState<string | null>(null)
  const [imageName, setImageName] = useState<string | null>(null)
  const [status,    setStatus]    = useState<SendStatus>('idle')
  const [errorMsg,  setErrorMsg]  = useState('')

  const reset = useCallback(() => {
    setType('bug')
    setMessage('')
    setImageB64(null)
    setImageName(null)
    setStatus('idle')
    setErrorMsg('')
  }, [])

  function handleClose() {
    if (status === 'sending') return
    reset()
    onClose()
  }

  // ── Leitura da imagem como Base64 ──────────────────────────────────────────
  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 3 * 1024 * 1024) {
      setErrorMsg('Imagem muito grande. Máximo: 3 MB.')
      return
    }

    setErrorMsg('')
    setImageName(file.name)

    const reader = new FileReader()
    reader.onload = () => setImageB64(reader.result as string)
    reader.readAsDataURL(file)
  }

  function removeImage() {
    setImageB64(null)
    setImageName(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // ── Envio ──────────────────────────────────────────────────────────────────
  async function handleSend() {
    if (!message.trim()) {
      setErrorMsg('Escreva sua mensagem antes de enviar.')
      return
    }
    setErrorMsg('')
    setStatus('sending')

    const fromName  = user?.nickname || user?.name || 'Usuário'
    const fromEmail = user?.email || 'sem-email@auraup.com'
    const typeLabel = type === 'bug' ? '🐛 Bug' : '💡 Sugestão'

    try {
      if (EMAIL_CONFIGURED) {
        // ── Envio via EmailJS SDK (Passo 7) ───────────────────────────────
        // Após instalar o SDK (Passo 5), descomente as linhas abaixo e
        // delete a linha com throw new Error(...)
        //
        // const emailjs = (await import('@emailjs/browser')).default
        // await emailjs.send(
        //   EMAILJS_SERVICE_ID,
        //   EMAILJS_TEMPLATE_ID,
        //   {
        //     from_name:  fromName,
        //     from_email: fromEmail,
        //     type:       typeLabel,
        //     message:    message.trim(),
        //     image_url:  imageB64 || '(sem imagem)',
        //   },
        //   EMAILJS_PUBLIC_KEY,
        // )
        throw new Error('SDK do EmailJS não instalado. Siga o Passo 5 e 7 nos comentários do HelpModal.tsx.')
      } else {
        // ── Fallback: mailto (abre o cliente de e-mail do sistema) ─────────
        // Usado enquanto o EmailJS não estiver configurado.
        const subject = encodeURIComponent(`[AuraUP] ${typeLabel} — ${fromName}`)
        const body    = encodeURIComponent(
          `Tipo: ${typeLabel}\nUsuário: ${fromName} <${fromEmail}>\n\n${message.trim()}` +
          (imageB64 ? '\n\n[Imagem anexada — disponível apenas via EmailJS]' : '')
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
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 sm:py-4 shrink-0 border-b border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800">
          <h2 className="text-base sm:text-lg font-heading font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="text-lg">🆘</span> Ajuda &amp; Feedback
          </h2>
          <button
            onClick={handleClose}
            aria-label="Fechar"
            disabled={status === 'sending'}
            className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center justify-center transition-all cursor-pointer shrink-0 active:scale-90 disabled:opacity-50"
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Body ────────────────────────────────────────────────────────── */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 overscroll-contain custom-scrollbar flex flex-col gap-5">

          {/* Tela de sucesso */}
          {status === 'success' ? (
            <div className="flex flex-col items-center justify-center gap-4 py-10 text-center">
              <CheckCircle2 size={52} className="text-emerald-500" />
              <div>
                <p className="font-heading font-bold text-slate-900 dark:text-white text-base">Mensagem enviada!</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Obrigado pelo seu feedback. Isso nos ajuda a melhorar o AuraUP! 🚀
                </p>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="mt-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-heading font-bold text-sm transition-all active:scale-95 cursor-pointer"
              >
                Fechar
              </button>
            </div>
          ) : (
            <>
              {/* Tipo de feedback */}
              <div>
                <label className="block text-xs font-heading font-semibold text-slate-600 dark:text-slate-400 mb-2 uppercase tracking-wide">
                  Tipo
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setType('bug')}
                    className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-heading font-bold transition-all cursor-pointer active:scale-95 ${
                      type === 'bug'
                        ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-300 dark:border-rose-700 text-rose-700 dark:text-rose-300'
                        : 'bg-slate-50 dark:bg-slate-700/60 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    <Bug size={14} /> Reportar Bug
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('suggestion')}
                    className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-heading font-bold transition-all cursor-pointer active:scale-95 ${
                      type === 'suggestion'
                        ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300'
                        : 'bg-slate-50 dark:bg-slate-700/60 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    <Lightbulb size={14} /> Sugestão
                  </button>
                </div>
              </div>

              {/* Mensagem */}
              <div>
                <label
                  htmlFor="help-message"
                  className="block text-xs font-heading font-semibold text-slate-600 dark:text-slate-400 mb-2 uppercase tracking-wide"
                >
                  Mensagem
                </label>
                <textarea
                  id="help-message"
                  rows={5}
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder={
                    type === 'bug'
                      ? 'Descreva o problema encontrado e como reproduzi-lo...'
                      : 'Descreva sua ideia ou sugestão de melhoria...'
                  }
                  disabled={status === 'sending'}
                  className="w-full resize-none text-sm px-3.5 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/60 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-all disabled:opacity-60 font-sans leading-relaxed"
                />
              </div>

              {/* Upload de imagem */}
              <div>
                <label className="block text-xs font-heading font-semibold text-slate-600 dark:text-slate-400 mb-2 uppercase tracking-wide">
                  Imagem (opcional)
                </label>

                {imageB64 ? (
                  <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/60">
                    <img
                      src={imageB64}
                      alt="Preview"
                      className="w-14 h-14 object-cover rounded-lg border border-slate-200 dark:border-slate-600 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">{imageName}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Imagem selecionada</p>
                    </div>
                    <button
                      type="button"
                      onClick={removeImage}
                      className="w-7 h-7 rounded-lg bg-rose-100 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center hover:bg-rose-200 transition-colors cursor-pointer shrink-0"
                      aria-label="Remover imagem"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={status === 'sending'}
                    className="w-full flex flex-col items-center justify-center gap-2 px-4 py-5 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-600 text-slate-400 dark:text-slate-500 hover:border-blue-400 hover:text-blue-500 dark:hover:border-blue-500 dark:hover:text-blue-400 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ImageIcon size={22} />
                    <span className="text-xs font-heading font-semibold">Clique para adicionar uma imagem</span>
                    <span className="text-[11px]">PNG, JPG ou WEBP — máx. 3 MB</span>
                  </button>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={handleImageChange}
                />
              </div>

              {/* Aviso: EmailJS não configurado */}
              {!EMAIL_CONFIGURED && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                  <strong>⚠️ E-mail direto não configurado.</strong> O botão "Enviar" abrirá seu cliente de e-mail como alternativa.
                  Para ativar o envio direto, siga os 8 passos nos comentários do arquivo <code className="font-mono bg-amber-100 dark:bg-amber-900/50 px-1 py-0.5 rounded">HelpModal.tsx</code>.
                </div>
              )}

              {/* Mensagem de erro */}
              {errorMsg && (
                <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1.5">
                  ⚠️ {errorMsg}
                </p>
              )}
            </>
          )}
        </div>

        {/* ── Footer ──────────────────────────────────────────────────────── */}
        {status !== 'success' && (
          <div
            className="shrink-0 px-4 sm:px-6 py-3 sm:py-3.5 border-t border-slate-100 dark:border-slate-700 bg-slate-50/90 dark:bg-slate-800/95 backdrop-blur-xs flex items-center justify-between gap-2.5"
            style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 12px)' }}
          >
            <span className="text-[11px] text-slate-400 dark:text-slate-500 font-sans">
              Enviando como <strong>{user?.nickname || user?.name}</strong>
            </span>

            <button
              type="button"
              id="help-send-btn"
              onClick={handleSend}
              disabled={status === 'sending' || !message.trim()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white disabled:text-slate-400 font-heading font-bold text-xs transition-all active:scale-95 cursor-pointer disabled:cursor-not-allowed"
            >
              {status === 'sending' ? (
                <><Loader2 size={14} className="animate-spin" /> Enviando...</>
              ) : (
                <><Send size={14} /> Enviar</>
              )}
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
