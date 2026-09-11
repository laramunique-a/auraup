import { isLocalMode, supabase } from './storage'

const STORAGE_KEY = 'uply_economy_state'

export const profileService = {
  async addReward(userId: string, xp: number, coins: number) {
    // 1. Atualizar localStorage imediatamente (offline-first)
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      const currentEconomy = saved ? JSON.parse(saved) : { xp: 0, coins: 0, streak: 1 }
      currentEconomy.xp = (currentEconomy.xp || 0) + xp
      currentEconomy.coins = (currentEconomy.coins || 0) + coins
      localStorage.setItem(STORAGE_KEY, JSON.stringify(currentEconomy))

      const rawUser = localStorage.getItem('uply_user')
      if (rawUser) {
        const user = JSON.parse(rawUser)
        user.xp = (user.xp || 0) + xp
        user.coins = (user.coins || 0) + coins
        localStorage.setItem('uply_user', JSON.stringify(user))
      }

      window.dispatchEvent(new CustomEvent('uply_economy_sync'))
    } catch (e) {
      console.error('Erro ao sincronizar recompensa no localStorage:', e)
    }

    // 2. Se for local mode ou supabase indisponível, encerra com sucesso local
    if (isLocalMode || !supabase) return { success: true }

    try {
      const { data, error } = await supabase.rpc('add_user_reward', {
        user_id: userId,
        xp_to_add: xp,
        coins_to_add: coins
      })
      
      if (error) {
        const { data: current } = await supabase
          .from('profiles')
          .select('xp, coins')
          .eq('id', userId)
          .single()
        
        if (current) {
          await supabase
            .from('profiles')
            .update({
              xp: (current.xp || 0) + xp,
              coins: (current.coins || 0) + coins
            })
            .eq('id', userId)
        }
      }
      return data
    } catch {
      return { success: true }
    }
  },

  async updateStreak(userId: string) {
    try {
      window.dispatchEvent(new CustomEvent('uply_record_activity'))
    } catch {
      // ignore
    }

    if (isLocalMode || !supabase) return true

    try {
      const { error } = await supabase.rpc('update_user_streak', {
        user_id: userId
      })
      return !error
    } catch {
      return true
    }
  }
}
