import { useState, type FormEvent } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '../components/ui/Button'
import { Mail, Lock, Eye, EyeOff, AlertCircle, ShieldCheck, Sparkles } from 'lucide-react'

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
      setError(err.message || 'Falha ao realizar login.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 h-[100dvh] w-full flex flex-col items-center justify-center p-3 sm:p-4 bg-slate-50 text-slate-900 overflow-hidden touch-none overscroll-none z-50">
      {/* Elementos visuais decorativos suaves */}
      <div 
        className="absolute -top-40 -right-40 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(37, 99, 235, 0.08) 0%, transparent 70%)' }}
      />
      <div 
        className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(245, 158, 11, 0.08) 0%, transparent 70%)' }}
      />

      <div className="w-full max-w-[400px] relative z-10 my-auto animate-fade-in flex flex-col justify-center max-h-full">
        {/* Logo Hero AuraUP com Animação Flutuante */}
        <div className="text-center mb-2.5 flex flex-col items-center relative shrink-0">
          {/* Brilho radial suave pulsante ao fundo */}
          <div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-44 h-44 rounded-full pointer-events-none blur-xl opacity-60 animate-pulse"
            style={{ background: 'radial-gradient(circle, rgba(37, 99, 235, 0.20) 0%, rgba(245, 158, 11, 0.15) 50%, transparent 75%)' }}
          />

          {/* Logo Ilustrada com Efeito de Flutuação e Interatividade */}
          <div className="relative group select-none">
            <img 
              src="/logo-login.png" 
              alt="AuraUP — learn. play. level up." 
              className="w-28 sm:w-34 h-auto object-contain mx-auto drop-shadow-sm animate-float-smooth transition-transform duration-500 group-hover:scale-105" 
            />
          </div>

          {/* Badge Informativa bem próxima da logo */}
          <div className="mt-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/95 border border-slate-200 text-slate-600 text-[11px] font-heading font-semibold shadow-2xs">
              <Sparkles size={11} className="text-amber-500 animate-pulse" />
              Acesso Exclusivo à Plataforma
            </span>
          </div>
        </div>

        {/* Card do Formulário de Acesso Compacto e Sem Rolagem */}
        <div className="card-3d p-4.5 sm:p-6 bg-white border border-slate-200 rounded-xl shadow-xs space-y-3 shrink-0">
          <div className="border-b border-slate-100 pb-2">
            <h1 className="text-base sm:text-xl font-heading font-extrabold text-slate-800 tracking-tight leading-tight">
              Entre na sua Conta
            </h1>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              Digite seu e-mail e senha para acessar seus baralhos e estudos.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-2.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                E-mail
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="seu.email@auraup.com"
                  className="w-full pl-9 pr-3.5 py-2 rounded-lg border border-slate-300 bg-white text-xs sm:text-sm text-slate-800 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all font-medium placeholder:text-slate-400 shadow-2xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Senha
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Sua senha de acesso"
                  className="w-full pl-9 pr-9 py-2 rounded-lg border border-slate-300 bg-white text-xs sm:text-sm text-slate-800 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all font-medium placeholder:text-slate-400 shadow-2xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2 animate-shake">
                <AlertCircle size={15} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="sm"
              fullWidth
              loading={loading}
              className="mt-1 h-9 text-xs sm:text-sm"
            >
              Acessar Plataforma 🚀
            </Button>
          </form>

          {/* Aviso sobre cadastro fechado */}
          <div className="p-2 px-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start gap-2">
            <ShieldCheck size={14} className="text-blue-600 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-snug text-slate-500 font-normal">
              <strong className="text-slate-700 font-semibold">Cadastro Centralizado: </strong>
              realizado exclusivamente pelo administrador. Caso ainda não tenha acesso, solicite à coordenação.
            </div>
          </div>
        </div>

        {/* Rodapé */}
        <p className="text-center mt-2 text-[11px] font-medium text-slate-400 flex items-center justify-center gap-1.5 shrink-0">
          <Sparkles size={12} className="text-blue-600" />
          AuraUP — Learn. Play. Level Up.
        </p>
      </div>
    </div>
  )
}
