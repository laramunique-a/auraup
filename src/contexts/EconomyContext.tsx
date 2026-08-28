import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

export interface EconomyState {
  xp: number
  coins: number
  streak: number
  level: number
  xpForNextLevel: number
  progressToNextLevel: number
}

export interface EconomyContextValue extends EconomyState {
  addXP: (amount: number) => void
  addCoins: (amount: number) => void
  spendCoins: (amount: number) => boolean
  resetEconomy: () => void
}

const STORAGE_KEY = 'uply_economy_state'
const XP_PER_LEVEL = 100

const EconomyContext = createContext<EconomyContextValue | null>(null)

function calculateLevelInfo(xp: number) {
  const level = Math.floor(xp / XP_PER_LEVEL) + 1
  const currentLevelXP = xp % XP_PER_LEVEL
  const xpForNextLevel = XP_PER_LEVEL - currentLevelXP
  const progressToNextLevel = Math.min(100, Math.floor((currentLevelXP / XP_PER_LEVEL) * 100))
  
  return {
    level,
    xpForNextLevel,
    progressToNextLevel,
  }
}

export function EconomyProvider({ children }: { children: ReactNode }) {
  const [xp, setXp] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (typeof parsed.xp === 'number') return parsed.xp
      }
      // Se tiver usuário logado no localStorage, tentar resgatar de lá
      const rawUser = localStorage.getItem('uply_user')
      if (rawUser) {
        const user = JSON.parse(rawUser)
        if (typeof user.xp === 'number') return user.xp
      }
    } catch {
      // Ignora erro e usa padrão 0
    }
    return 0
  })

  const [coins, setCoins] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (typeof parsed.coins === 'number') return parsed.coins
      }
      const rawUser = localStorage.getItem('uply_user')
      if (rawUser) {
        const user = JSON.parse(rawUser)
        if (typeof user.coins === 'number') return user.coins
      }
    } catch {
      // Ignora erro e usa padrão 0
    }
    return 0
  })

  const [streak, setStreak] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (typeof parsed.streak === 'number') return parsed.streak
      }
      const rawUser = localStorage.getItem('uply_user')
      if (rawUser) {
        const user = JSON.parse(rawUser)
        if (typeof user.streak === 'number') return user.streak
      }
    } catch {
      // Ignora erro e usa padrão 0
    }
    return 0
  })

  // Sincronização offline-first com localStorage
  useEffect(() => {
    try {
      const stateToSave = { xp, coins, streak }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave))
      
      // Sincronizar também no registro do usuário local se existir
      const rawUser = localStorage.getItem('uply_user')
      if (rawUser) {
        const userObj = JSON.parse(rawUser)
        userObj.xp = xp
        userObj.coins = coins
        userObj.streak = streak
        localStorage.setItem('uply_user', JSON.stringify(userObj))
      }
    } catch (err) {
      console.error('Erro ao sincronizar economia no localStorage:', err)
    }
  }, [xp, coins, streak])

  /**
   * Adiciona XP ao jogador
   */
  function addXP(amount: number) {
    if (amount <= 0) return
    setXp(prev => prev + amount)
  }

  /**
   * Adiciona Moedas ao jogador
   */
  function addCoins(amount: number) {
    if (amount <= 0) return
    setCoins(prev => prev + amount)
  }

  /**
   * Tenta gastar moedas. Retorna true se houver saldo suficiente e a transação for concluída.
   */
  function spendCoins(amount: number): boolean {
    if (amount <= 0) return false
    if (coins < amount) return false
    
    setCoins(prev => prev - amount)
    return true
  }

  /**
   * Reinicia o progresso da economia local
   */
  function resetEconomy() {
    setXp(0)
    setCoins(0)
    setStreak(0)
    localStorage.removeItem(STORAGE_KEY)
  }

  const { level, xpForNextLevel, progressToNextLevel } = calculateLevelInfo(xp)

  return (
    <EconomyContext.Provider
      value={{
        xp,
        coins,
        streak,
        level,
        xpForNextLevel,
        progressToNextLevel,
        addXP,
        addCoins,
        spendCoins,
        resetEconomy,
      }}
    >
      {children}
    </EconomyContext.Provider>
  )
}

/**
 * Custom Hook para consumir o estado e os métodos da Economia Virtual
 */
export function useEconomy(): EconomyContextValue {
  const context = useContext(EconomyContext)
  if (!context) {
    throw new Error('useEconomy deve ser usado dentro de um EconomyProvider')
  }
  return context
}
