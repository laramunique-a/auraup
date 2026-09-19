import { useState, type FormEvent } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Mail, Lock, Eye, EyeOff, AlertCircle, ShieldCheck, Sparkles, ArrowRight, Loader2 } from 'lucide-react'

export function AuthPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const from = (location.state as any)?.from?.pathname || '/'

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      await signIn(email, password)
      navigate(from, { replace: true })
    } catch (err: any) {
      setError(err.message || 'Falha ao realizar login. Verifique seus dados.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[100dvh] w-full flex flex-col items-center justify-between p-4 sm:p-6 bg-slate-900 text-slate-100 relative overflow-hidden selection:bg-blue-500 selection:text-white">
      {/* Luzes de Fundo (Aura Glow Effect) */}
      <div 
        className="absolute -top-32 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full pointer-events-none blur-[120px] opacity-40"
        style={{ background: 'radial-gradient(circle, rgba(37, 99, 235, 0.4) 0%, rgba(99, 102, 241, 0.2) 50%, transparent 70%)' }}
      />
      <div 
        className="absolute -bottom-32 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full pointer-events-none blur-[120px] opacity-30"
        style={{ background: 'radial-gradient(circle, rgba(245, 158, 11, 0.3) 0%, transparent 70%)' }}
      />

      {/* Espaçador Superior */}
      <div className="w-full flex-1 max-h-8" />

      {/* Container Principal Centralizado */}
      <div className="w-full max-w-[390px] relative z-10 mx-auto animate-fade-in flex flex-col items-center my-auto">
        
        {/* Logo AuraUP em Destaque com Sombra Suave */}
        <div className="text-center mb-5 flex flex-col items-center select-none group">
          <img 
            src="/logo-login.png" 
            alt="AuraUP — Learn. Play. Level Up." 
            className="h-24 sm:h-28 w-auto object-contain drop-shadow-[0_10px_25px_rgba(37,99,235,0.3)] transition-transform duration-500 group-hover:scale-105" 
          />
        </div>

        {/* Card do Formulário Estilo Glassmorphism Premium */}
        <div className="w-full bg-slate-800/90 backdrop-blur-xl border border-slate-700/80 rounded-2xl sm:rounded-3xl p-6 sm:p-7 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.5)]">
          <div className="mb-5 text-center">
            <h1 className="text-xl sm:text-2xl font-heading font-extrabold text-white tracking-tight">
              Entre na sua Conta
            </h1>
            <p className="text-xs text-slate-400 font-medium mt-1">
              Acesse para continuar evoluindo seus baralhos
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Campo E-mail */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                E-mail
              </label>
              <div className="relative group">
                <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-400 transition-colors" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="seu.email@auraup.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-700 bg-slate-900/60 text-sm text-white placeholder:text-slate-500 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                />
              </div>
            </div>

            {/* Campo Senha */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Senha
              </label>
              <div className="relative group">
                <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-400 transition-colors" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Sua senha de acesso"
                  className="w-full pl-10 pr-11 py-3 rounded-xl border border-slate-700 bg-slate-900/60 text-sm text-white placeholder:text-slate-500 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1 cursor-pointer transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Mensagem de Erro */}
            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold flex items-center gap-2.5 animate-shake">
                <AlertCircle size={16} className="shrink-0 text-rose-500" />
                <span>{error}</span>
              </div>
            )}

            {/* Botão Principal de Login */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-[0.98] text-white font-heading font-bold text-sm shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Acessando...</span>
                </>
              ) : (
                <>
                  <span>Acessar Plataforma</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Aviso sobre cadastro fechado */}
          <div className="mt-4 p-3 rounded-xl bg-slate-900/50 border border-slate-700/60 text-xs text-slate-400 flex items-start gap-2.5">
            <ShieldCheck size={16} className="text-blue-400 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed text-slate-400">
              <strong className="text-slate-200 font-semibold">Acesso Restrito: </strong>
              cadastro gerido pela coordenação. Caso não tenha conta, solicite ao administrador.
            </p>
          </div>
        </div>
      </div>

      {/* Rodapé Elegante */}
      <footer className="w-full py-3 text-center text-xs font-medium text-slate-500 flex items-center justify-center gap-1.5 relative z-10 shrink-0">
        <Sparkles size={13} className="text-amber-400 animate-pulse" />
        <span>AuraUP — Learn. Play. Level Up.</span>
      </footer>
    </div>
  )
}

