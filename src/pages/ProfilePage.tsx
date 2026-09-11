import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '../components/ui/Button'
import { useToast } from '../components/ui/Toast'
import { 
  Save, Sparkles, Fingerprint, Lock, KeyRound, 
  Eye, EyeOff, ShieldCheck, LogOut, AlertCircle 
} from 'lucide-react'

const AVATARS = [
  { id: 'avatar_1', emoji: '🦊', label: 'Raposa' },
  { id: 'avatar_2', emoji: '🐨', label: 'Coala' },
  { id: 'avatar_3', emoji: '🦁', label: 'Leão' },
  { id: 'avatar_4', emoji: '🐼', label: 'Panda' },
  { id: 'avatar_5', emoji: '🦉', label: 'Coruja' },
  { id: 'avatar_6', emoji: '🦖', label: 'Dino' },
]

export function ProfilePage() {
  const { user, updateUser, changePassword, signOut } = useAuth()
  const { show } = useToast()
  const navigate = useNavigate()
  
  // Perfil
  const [nickname, setNickname] = useState(user?.nickname || user?.name || '')
  const [selectedAvatar, setSelectedAvatar] = useState(user?.avatar_id || 'avatar_1')
  const [updatingProfile, setUpdatingProfile] = useState(false)

  // Alteração de Senha
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPasswords, setShowPasswords] = useState(false)
  const [updatingPassword, setUpdatingPassword] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)

  async function handleUpdateProfile() {
    if (!nickname.trim()) {
      show('Por favor, digite um apelido ou nome.', 'error')
      return
    }
    setUpdatingProfile(true)
    try {
      updateUser({
        nickname: nickname.trim(),
        name: nickname.trim(),
        avatar_id: selectedAvatar,
      })
      show('Perfil atualizado com sucesso! ✨', 'success')
    } catch (err: any) {
      show(err.message || 'Erro ao atualizar perfil.', 'error')
    } finally {
      setUpdatingProfile(false)
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    setPasswordError(null)

    if (!currentPassword) {
      setPasswordError('Informe sua senha atual.')
      return
    }

    if (newPassword.length < 6) {
      setPasswordError('A nova senha deve ter no mínimo 6 caracteres.')
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('A nova senha e a confirmação não conferem.')
      return
    }

    setUpdatingPassword(true)
    try {
      await changePassword(currentPassword, newPassword)
      show('Senha atualizada com sucesso! 🔐', 'success')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: any) {
      setPasswordError(err.message || 'Erro ao alterar senha.')
    } finally {
      setUpdatingPassword(false)
    }
  }

  async function handleLogout() {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <div className="max-w-2xl mx-auto px-3 sm:px-6 py-4 sm:py-8 min-h-screen space-y-6">
      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Fingerprint size={20} />
            </div>
            <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-slate-900 dark:text-white">
              Meu <span className="text-blue-600 dark:text-blue-400">Perfil</span>
            </h1>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium">
            Personalize seu avatar, apelido e gerencie a segurança de acesso.
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={handleLogout}
          className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200"
        >
          <LogOut size={16} /> Sair da Conta
        </Button>
      </header>

      {/* 1. SEÇÃO: Identidade de Estudo */}
      <section className="card-3d p-6 sm:p-7 flex flex-col gap-5 rounded-2xl">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200/60 dark:border-blue-800 shrink-0 shadow-xs">
            <Sparkles size={18} />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800 dark:text-white leading-tight">Identidade de Estudo</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Como você aparece no ranking e nos cards</p>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Escolha seu Avatar
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
            {AVATARS.map(av => (
              <button
                key={av.id}
                type="button"
                onClick={() => setSelectedAvatar(av.id)}
                className={`aspect-square text-3xl flex items-center justify-center rounded-xl transition-all cursor-pointer ${
                  selectedAvatar === av.id 
                    ? 'bg-blue-50 dark:bg-blue-950/60 border-2 border-blue-600 shadow-xs scale-105' 
                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-400 hover:scale-102 shadow-xs'
                }`}
                title={av.label}
              >
                {av.emoji}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Apelido no Ranking
          </label>
          <input 
            type="text"
            value={nickname}
            onChange={e => setNickname(e.target.value)}
            placeholder="Ex: Pedro, Sarah, Aluno Pro"
            className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 font-medium text-sm text-slate-900 dark:text-white outline-none transition-all placeholder:text-slate-400"
          />
        </div>

        <Button
          variant="primary"
          size="md"
          fullWidth
          loading={updatingProfile}
          onClick={handleUpdateProfile}
          className="mt-1"
        >
          <Save size={17} /> Salvar Alterações de Perfil
        </Button>
      </section>

      {/* 2. SEÇÃO: Segurança & Alteração de Senha */}
      <section className="card-3d p-6 sm:p-7 flex flex-col gap-5 rounded-2xl">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-200/60 dark:border-indigo-800 shrink-0 shadow-xs">
            <Lock size={18} />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800 dark:text-white leading-tight">Segurança & Senha</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Altere sua senha de acesso à plataforma a qualquer momento</p>
          </div>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Senha Atual
            </label>
            <div className="relative">
              <KeyRound size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type={showPasswords ? 'text' : 'password'}
                required
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                placeholder="Digite sua senha atual"
                className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm font-medium text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-slate-400"
              />
              <button
                type="button"
                onClick={() => setShowPasswords(!showPasswords)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                tabIndex={-1}
              >
                {showPasswords ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Nova Senha (mínimo 6 caracteres)
              </label>
              <div className="relative">
                <Lock size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type={showPasswords ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Nova senha"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm font-medium text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Confirmar Nova Senha
              </label>
              <div className="relative">
                <Lock size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type={showPasswords ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Repita a nova senha"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm font-medium text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-slate-400"
                />
              </div>
            </div>
          </div>

          {passwordError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{passwordError}</span>
            </div>
          )}

          <Button
            type="submit"
            variant="secondary"
            size="md"
            fullWidth
            loading={updatingPassword}
            disabled={!currentPassword || newPassword.length < 6 || newPassword !== confirmPassword}
            className="mt-1"
          >
            <ShieldCheck size={17} /> Atualizar Minha Senha
          </Button>
        </form>
      </section>
    </div>
  )
}
