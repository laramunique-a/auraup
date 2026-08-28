import { supabase } from './storage'

export const profileService = {
  async addReward(userId: string, xp: number, coins: number) {
    if (!supabase) return null
    const { data, error } = await supabase.rpc('add_user_reward', {
      user_id: userId,
      xp_to_add: xp,
      coins_to_add: coins
    })
    
    if (error) {
      // Fallback se a RPC não existir ainda (vamos criar abaixo)
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
  },

  async updateStreak(userId: string) {
    if (!supabase) return false
    const { error } = await supabase.rpc('update_user_streak', {
      user_id: userId
    })
    return !error
  }
}
