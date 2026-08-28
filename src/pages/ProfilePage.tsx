import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../services/storage'
import { Button } from '../components/ui/Button'
import { useToast } from '../components/ui/Toast'
import { Save, Sparkles, ShieldCheck, Fingerprint, Lock } from 'lucide-react'

const AVATARS = [
  { id: 'avatar_1', emoji: '🦊', label: 'Raposa' },
  { id: 'avatar_2', emoji: '🐨', label: 'Coala' },
  { id: 'avatar_3', emoji: '🦁', label: 'Leão' },
  { id: 'avatar_4', emoji: '🐼', label: 'Panda' },
  { id: 'avatar_5', emoji: '🦉', label: 'Coruja' },
  { id: 'avatar_6', emoji: '🦖', label: 'Dino' },
]

export function ProfilePage() {
  const { user } = useAuth()
  const { show } = useToast()
  
  const [nickname, setNickname] = useState(user?.nickname || '')
  const [selectedAvatar, setSelectedAvatar] = useState(user?.avatar_id || 'avatar_1')
  const [updating, setUpdating] = useState(false)
  
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [changingPass, setChangingPass] = useState(false)

  async function handleUpdateProfile() {
    if (!nickname.trim()) return
    setUpdating(true)
    try {
      if (supabase) {
        const { error } = await supabase
          .from('profiles')
          .update({ 
            nickname: nickname.trim(),
            avatar_id: selectedAvatar,
            updated_at: new Date().toISOString()
          })
          .eq('id', user?.id)
        
        if (error) {
          if (error.code === '23505') throw new Error('Este apelido já está em uso.')
          throw error
        }
      }

      const rawUser = localStorage.getItem('uply_user')
      if (rawUser) {
        const u = JSON.parse(rawUser)
        u.nickname = nickname.trim()
        u.avatar_id = selectedAvatar
        localStorage.setItem('uply_user', JSON.stringify(u))
      }

      show('Perfil atualizado com sucesso! ✨', 'success')
      setTimeout(() => window.location.reload(), 1000)
    } catch (err: any) {
      show(err.message || 'Erro ao atualizar perfil.', 'error')
    } finally {
      setUpdating(false)
    }
  }

  async function handleChangePassword() {
    if (!newPassword || newPassword.length < 6) {
      show('A senha deve ter pelo menos 6 caracteres.', 'error')
      return
    }
    if (newPassword !== confirmPassword) {
      show('As senhas não coincidem.', 'error')
      return
    }

    setChangingPass(true)
    try {
      if (supabase) {
        const { error } = await supabase.auth.updateUser({ password: newPassword })
        if (error) throw error
      }
      show('Senha alterada com sucesso! 🔒', 'success')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: any) {
      show(err.message || 'Erro ao alterar senha.', 'error')
    } finally {
      setChangingPass(false)
    }
  }

  const isAdmin = user?.role === 'admin'

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 min-h-screen">
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-glow-primary">
            <Fingerprint size={20} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-heading text-slate-900 dark:text-slate-100">
            Meu <span className="text-[#2563eb]">Perfil</span>
          </h1>
        </div>
        <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm font-label">
          {isAdmin 
            ? 'Gerencie sua segurança e preferências administrativas.' 
            : 'Personalize sua jornada e gerencie sua identidade no Aura English App. ✨'}
        </p>
      </header>

      <div className={`grid ${isAdmin ? 'grid-cols-1 max-w-2xl mx-auto' : 'grid-cols-1 lg:grid-cols-2'} gap-8 items-start`}>
        
        {/* Identidade Aluno */}
        {!isAdmin && (
          <section className="glass-panel p-6 sm:p-8 flex flex-col gap-6 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200/60 shrink-0">
                <Sparkles size={20} />
              </div>
              <h2 className="text-lg font-heading text-slate-900">Identidade do Aluno</h2>
            </div>

            <div>
              <label className="block text-xs font-label font-semibold uppercase tracking-wider text-slate-500 mb-3">
                Escolha seu Avatar
              </label>
              <div className="grid grid-cols-3 gap-3">
                {AVATARS.map(av => (
                  <button
                    key={av.id}
                    onClick={() => setSelectedAvatar(av.id)}
                    className={`aspect-square text-3xl flex items-center justify-center rounded-2xl transition-all cursor-pointer ${
                      selectedAvatar === av.id 
                        ? 'bg-blue-50/80 border-2 border-blue-600 shadow-soft-sm scale-105' 
                        : 'bg-slate-100/60 border border-slate-900/5 hover:bg-white hover:scale-102'
                    }`}
                  >
                    {av.emoji}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-label font-semibold uppercase tracking-wider text-slate-500 mb-2">
                Seu Apelido Exclusivo
              </label>
              <input 
                value={nickname}
                onChange={e => setNickname(e.target.value.replace(/\s/g, '').toLowerCase())}
                placeholder="Ex: mestre_ingles"
                maxLength={15}
                className="input-gamified rounded-xl text-sm font-label"
              />
              <p className="text-xs font-label text-slate-500 mt-2">
                Seu nickname será visível no Ranking Global e das Ligas.
              </p>
            </div>

            <Button
              variant="primary"
              size="md"
              loading={updating}
              onClick={handleUpdateProfile}
              className="btn-primary-glass w-full font-label text-sm py-3 mt-2 rounded-xl"
            >
              <Save size={16} /> Salvar Perfil
            </Button>
          </section>
        )}

        {/* Segurança */}
        <section className="glass-panel p-6 sm:p-8 flex flex-col gap-6 rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200/60 shrink-0">
              <ShieldCheck size={20} />
            </div>
            <h2 className="text-lg font-heading text-slate-900">Segurança da Conta</h2>
          </div>

          <div className="flex flex-col gap-4 font-label">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                Nova Senha
              </label>
              <input 
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="No mínimo 6 caracteres"
                className="input-gamified rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                Confirmar Nova Senha
              </label>
              <input 
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Repita a nova senha"
                className="input-gamified rounded-xl text-sm"
              />
            </div>

            <Button
              variant="primary"
              size="md"
              loading={changingPass}
              onClick={handleChangePassword}
              className="btn-primary-glass w-full font-label text-sm py-3 mt-2 rounded-xl"
            >
              <Lock size={16} /> Alterar Senha
            </Button>
          </div>
        </section>

      </div>
    </div>
  )
}
