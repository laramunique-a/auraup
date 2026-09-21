import { useState, useEffect, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '../../contexts/AuthContext'
import { Button } from '../ui/Button'
import { KeyRound, Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react'

export function FirstLoginModal() {
  const { user, completeFirstPasswordChange } = useAuth()

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isMustChange = !!(user && user.must_change_password)

  useEffect(() => {
    if (!isMustChange) return
    document.body.classList.add('modal-open')
    return () => {
      document.body.classList.remove('modal-open')
    }
  }, [isMustChange])

  // Só renderiza se houver usuário autenticado e a flag must_change_password for verdadeira
  if (!isMustChange) {
    return null
  }

  const isMinLength = newPassword.length >= 6
  const isMatching = newPassword.length > 0 && newPassword === confirmPassword

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (newPassword.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('As senhas digitadas não coincidem.')
      return
    }

    setLoading(true)
    try {
      await completeFirstPasswordChange(newPassword)
    } catch (err: any) {
      setError(err.message || 'Erro ao definir nova senha.')
    } finally {
      setLoading(false)
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-md animate-fade-in">
      <div 
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 animate-pop-in relative"
        role="dialog"
        aria-modal="true"
      >
        {/* Cabeçalho */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto mb-3.5 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center border border-blue-200/80 dark:border-blue-800 shadow-xs">
            <ShieldCheck size={28} />
          </div>
          <span className="text-[11px] font-heading font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-3 py-1 rounded-md border border-blue-200/60">
            Primeiro Acesso Obrigatório
          </span>
          <h2 className="text-xl sm:text-2xl font-heading font-extrabold text-slate-900 dark:text-white mt-2 tracking-tight">
            Defina sua senha!
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
            Olá, <strong className="text-slate-800 dark:text-slate-200">{user.nickname || user.name}</strong>! Por segurança, defina uma nova senha.
          </p>
        </div>

        {/* Formulário Bloqueante */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Nova Senha (mínimo 6 caracteres)
            </label>
            <div className="relative">
              <Lock size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Digite sua nova senha"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm text-slate-800 dark:text-white outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all font-medium placeholder:text-[11px] sm:placeholder:text-xs placeholder:font-normal placeholder:text-slate-400/80"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Confirmar Nova Senha
            </label>
            <div className="relative">
              <KeyRound size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Repita sua nova senha"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm text-slate-800 dark:text-white outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all font-medium placeholder:text-[11px] sm:placeholder:text-xs placeholder:font-normal placeholder:text-slate-400/80"
              />
            </div>
          </div>

          {/* Checklist de Validação Visual */}
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5 text-xs font-medium">
            <div className={`flex items-center gap-1.5 ${isMinLength ? 'text-emerald-600 font-semibold' : 'text-slate-500'}`}>
              <CheckCircle2 size={14} className={isMinLength ? 'text-emerald-600' : 'text-slate-400'} />
              <span>Mínimo de 6 caracteres (letras e números)</span>
            </div>
            <div className={`flex items-center gap-1.5 ${isMatching ? 'text-emerald-600 font-semibold' : 'text-slate-500'}`}>
              <CheckCircle2 size={14} className={isMatching ? 'text-emerald-600' : 'text-slate-400'} />
              <span>As senhas são idênticas</span>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2 animate-shake">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            size="md"
            fullWidth
            loading={loading}
            disabled={!isMinLength || !isMatching}
            className="mt-2"
          >
            Salvar Senha e Iniciar Estudos 🚀
          </Button>
        </form>

        <p className="text-[11px] text-center text-slate-400 mt-4">
          Esta confirmação ocorre apenas uma única vez no seu primeiro acesso.
        </p>
      </div>
    </div>,
    document.body
  )
}
