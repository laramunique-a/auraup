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
    <div className="fixed inset-0 h-[100dvh] w-screen flex flex-col items-center justify-between p-4 bg-[#F4F8FC] text-slate-900 overflow-hidden touch-none overscroll-none select-none z-50">
      {/* Elementos visuais decorativos suaves no fundo claro */}
      <div 
        className="absolute -top-24 left-1/2 -translate-x-1/2 w-[450px] h-[450px] rounded-full pointer-events-none blur-[90px] opacity-60"
        style={{ background: 'radial-gradient(circle, rgba(37, 99, 235, 0.10) 0%, rgba(245, 158, 11, 0.06) 50%, transparent 75%)' }}
      />

      {/* Espaçador Superior para ajuste vertical proporcional */}
      <div className="w-full flex-1 max-h-6" />

      {/* Container Principal Centralizado (Trava de largura e altura) */}
      <div className="w-full max-w-[360px] sm:max-w-[380px] relative z-10 mx-auto animate-fade-in flex flex-col items-center my-auto shrink-0">
        
        {/* Logo AuraUP Limpa */}
        <div className="text-center mb-3 flex flex-col items-center select-none">
          <img 
            src="/logo-login.png" 
            alt="AuraUP — Learn. Play. Level Up." 
            className="h-20 sm:h-24 w-auto object-contain drop-shadow-xs" 
          />
        </div>

        {/* Card Claro do Formulário de Acesso */}
        <div className="w-full bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-[0_10px_35px_-5px_rgba(16,59,143,0.07)] space-y-3.5">
          <div className="text-center pb-0.5">
            <h1 className="text-lg sm:text-xl font-heading font-extrabold text-slate-800 tracking-tight">
              Entre na sua Conta
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Digite seu e-mail e senha para acessar seus estudos
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Campo E-mail */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                E-mail
              </label>
              <div className="relative flex items-center rounded-xl border border-slate-200 bg-slate-50/80 focus-within:bg-white focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100 transition-all shadow-2xs">
                <Mail size={16} className="absolute left-3.5 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="seu.email@auraup.com"
                  className="w-full pl-9 pr-3.5 py-2.5 text-xs sm:text-sm text-slate-800 font-medium placeholder:text-slate-400 bg-transparent outline-none rounded-xl"
                />
              </div>
            </div>

            {/* Campo Senha */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Senha
              </label>
              <div className="relative flex items-center rounded-xl border border-slate-200 bg-slate-50/80 focus-within:bg-white focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100 transition-all shadow-2xs">
                <Lock size={16} className="absolute left-3.5 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Sua senha de acesso"
                  className="w-full pl-9 pr-10 py-2.5 text-xs sm:text-sm text-slate-800 font-medium placeholder:text-slate-400 bg-transparent outline-none rounded-xl"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Mensagem de Erro */}
            {error && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2 animate-shake">
                <AlertCircle size={15} className="shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            {/* Botão Principal de Login */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-heading font-bold text-xs sm:text-sm shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Acessando...</span>
                </>
              ) : (
                <>
                  <span>Acessar Plataforma</span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>

          {/* Aviso sobre cadastro fechado */}
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 flex items-start gap-2">
            <ShieldCheck size={15} className="text-blue-600 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-snug text-slate-500 font-normal">
              <strong className="text-slate-700 font-semibold">Acesso Restrito: </strong>
              cadastro gerido pela coordenação. Dúvidas? Fale com o administrador.
            </p>
          </div>
        </div>
      </div>

      {/* Rodapé Claro Limpo */}
      <footer className="w-full py-2 text-center text-xs font-medium text-slate-400 flex items-center justify-center gap-1.5 relative z-10 shrink-0">
        <Sparkles size={12} className="text-amber-500 animate-pulse" />
        <span>AuraUP — Learn. Play. Level Up.</span>
      </footer>
    </div>
  )
}


