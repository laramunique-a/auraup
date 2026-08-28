import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { Button } from '../components/ui/Button'
import { Mail, Lock, User, Sparkles } from 'lucide-react'

export function AuthPage() {
  const [tab, setTab] = useState<'login' | 'signup'>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { signIn, signUp } = useAuth()
  const { setTheme } = useTheme()
  const navigate = useNavigate()

  // Força o modo claro no carregamento da tela de login
  useEffect(() => {
    setTheme('light')
    document.documentElement.classList.remove('dark')
    document.documentElement.setAttribute('data-theme', 'light')
  }, [setTheme])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      if (tab === 'login') {
        await signIn(email, password)
      } else {
        await signUp(email, password, name)
      }
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Algo deu errado.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#f8fafc] text-[#0f172a] relative overflow-hidden">
      {/* Elementos de Fundo Espaciais Suaves */}
      <div 
        style={{
          position: 'absolute', top: '-10%', right: '-10%', width: '50vw', height: '50vw',
          background: 'radial-gradient(circle, rgba(37, 99, 235, 0.08) 0%, transparent 70%)',
          filter: 'blur(100px)', zIndex: 0
        }} 
      />
      <div 
        style={{
          position: 'absolute', bottom: '-10%', left: '-10%', width: '40vw', height: '40vw',
          background: 'radial-gradient(circle, rgba(234, 88, 12, 0.06) 0%, transparent 70%)',
          filter: 'blur(80px)', zIndex: 0
        }} 
      />

      <div className="w-full max-w-[420px] relative z-10 animate-fade-in">
        {/* Logo Oficial Completo Aura English Sem Fundo */}
        <div className="text-center mb-8 flex flex-col items-center">
          <img 
            src="/logo-login.png" 
            alt="Aura English App" 
            className="h-36 w-auto mb-2 object-contain" 
          />
          <p className="text-[#2563eb] text-base font-label font-bold tracking-wider lowercase">
            expand yourself ✨
          </p>
        </div>

        {/* Card do Formulário (Glassmorphism Light Clean) */}
        <div className="glass-panel p-8 sm:p-10 shadow-glass border border-slate-900/5 rounded-[2rem]">
          {/* Abas Entrar / Cadastrar */}
          <div className="grid grid-cols-2 bg-slate-100/80 p-1.5 rounded-full mb-8 border border-slate-900/5">
            {(['login', 'signup'] as const).map(t => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(null) }}
                className={`py-2.5 rounded-full font-label font-semibold text-xs transition-all duration-200 cursor-pointer ${
                  tab === t 
                    ? 'bg-white text-[#2563eb] shadow-soft-sm' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {t === 'login' ? 'Entrar' : 'Cadastrar'}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {tab === 'signup' && (
              <div>
                <label className="block text-xs font-label font-semibold uppercase tracking-wider text-slate-500 mb-2">
                  Seu Nome
                </label>
                <div className="relative">
                  <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Como deseja ser chamado?"
                    className="input-gamified pl-11 rounded-xl"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-label font-semibold uppercase tracking-wider text-slate-500 mb-2">
                E-mail
              </label>
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Seu melhor e-mail"
                  className="input-gamified pl-11 rounded-xl"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-label font-semibold uppercase tracking-wider text-slate-500 mb-2">
                Senha
              </label>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Sua senha secreta"
                  className="input-gamified pl-11 rounded-xl"
                />
              </div>
            </div>

            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-600 px-4 py-3 rounded-xl text-xs font-label font-semibold">
                {error}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              className="btn-primary-glass w-full font-label text-sm font-semibold py-3.5 mt-2 rounded-xl"
            >
              {tab === 'login' ? 'COMEÇAR A ESTUDAR' : 'CRIAR MINHA CONTA'}
            </Button>
          </form>
        </div>

        {/* Footer info */}
        <p className="text-center mt-8 text-xs font-label font-medium text-slate-400 flex items-center justify-center gap-1.5">
          <Sparkles size={14} className="text-[#2563eb]" />
          Feito para quem ama aprender
        </p>
      </div>
    </div>
  )
}
