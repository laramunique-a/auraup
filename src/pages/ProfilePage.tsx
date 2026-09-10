import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '../components/ui/Button'
import { useToast } from '../components/ui/Toast'
import { Save, Sparkles, Fingerprint } from 'lucide-react'

const AVATARS = [
  { id: 'avatar_1', emoji: '🦊', label: 'Raposa' },
  { id: 'avatar_2', emoji: '🐨', label: 'Coala' },
  { id: 'avatar_3', emoji: '🦁', label: 'Leão' },
  { id: 'avatar_4', emoji: '🐼', label: 'Panda' },
  { id: 'avatar_5', emoji: '🦉', label: 'Coruja' },
  { id: 'avatar_6', emoji: '🦖', label: 'Dino' },
]

export function ProfilePage() {
  const { user, updateUser } = useAuth()
  const { show } = useToast()
  
  const [nickname, setNickname] = useState(user?.nickname || user?.name || '')
  const [selectedAvatar, setSelectedAvatar] = useState(user?.avatar_id || 'avatar_1')
  const [updating, setUpdating] = useState(false)

  async function handleUpdateProfile() {
    if (!nickname.trim()) {
      show('Por favor, digite um apelido ou nome.', 'error')
      return
    }
    setUpdating(true)
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
      setUpdating(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 min-h-screen">
      <header className="mb-8 text-center sm:text-left">
        <div className="flex items-center justify-center sm:justify-start gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
            <Fingerprint size={20} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-sans font-extrabold text-slate-900 dark:text-white">
            Meu <span className="text-blue-600 dark:text-blue-400">Perfil</span>
          </h1>
        </div>
        <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium">
          Personalize seu avatar e apelido no AuraUP. ✨
        </p>
      </header>

      <section className="card-3d p-6 sm:p-7 flex flex-col gap-6 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200/60 dark:border-blue-800 shrink-0 shadow-xs">
            <Sparkles size={20} />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-white">Identidade de Estudo</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Como você aparece no ranking e nos cards</p>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2.5">
            Escolha seu Avatar
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
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
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            Apelido no Ranking
          </label>
          <input 
            type="text"
            value={nickname}
            onChange={e => setNickname(e.target.value)}
            placeholder="Ex: Pedro, Sarah, Aluno Pro"
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 font-medium text-sm text-slate-900 dark:text-white outline-none transition-all placeholder:text-slate-400"
          />
        </div>

        <Button
          variant="primary"
          size="md"
          fullWidth
          loading={updating}
          onClick={handleUpdateProfile}
          className="mt-1"
        >
          <Save size={18} /> Salvar Perfil
        </Button>
      </section>
    </div>
  )
}
