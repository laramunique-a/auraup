import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'

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
  addReward: (xpAmount: number, coinsAmount: number) => void
  recordActivity: () => void
  spendCoins: (amount: number) => boolean
  resetEconomy: () => void
}

const STORAGE_KEY = 'uply_economy_state'
const LAST_ACTIVE_KEY = 'uply_last_active_date'
const XP_PER_LEVEL = 100

const EconomyContext = createContext<EconomyContextValue | null>(null)

function getTodayString(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function getYesterdayString(): string {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function calculateLevelInfo(xp: number) {
  const safeXP = Math.max(0, xp)
  const level = Math.floor(safeXP / XP_PER_LEVEL) + 1
  const currentLevelXP = safeXP % XP_PER_LEVEL
  const xpForNextLevel = XP_PER_LEVEL - currentLevelXP
  const progressToNextLevel = Math.min(100, Math.floor((currentLevelXP / XP_PER_LEVEL) * 100))
  
  return {
    level,
    xpForNextLevel,
    progressToNextLevel,
  }
}

export function EconomyProvider({ children }: { children: ReactNode }) {
  // Inicialização com suporte a fallback de uply_user
  const [xp, setXp] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (typeof parsed.xp === 'number') return parsed.xp
      }
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
        if (typeof parsed.streak === 'number' && parsed.streak > 0) return parsed.streak
      }
      const rawUser = localStorage.getItem('uply_user')
      if (rawUser) {
        const user = JSON.parse(rawUser)
        if (typeof user.streak === 'number' && user.streak > 0) return user.streak
      }
    } catch {
      // Ignora erro
    }
    return 1 // Dia 1 de acesso como padrão mínimo de engajamento
  })

  // Registra atividade diária (streak / dias acessados)
  const recordActivity = useCallback(() => {
    try {
      const today = getTodayString()
      const yesterday = getYesterdayString()
      const lastActive = localStorage.getItem(LAST_ACTIVE_KEY)

      if (lastActive === today) {
        // Já acessou hoje, mantém o streak atual garantindo ao menos 1
        setStreak(prev => Math.max(1, prev))
        return
      }

      if (lastActive === yesterday) {
        // Acesso consecutivo! Incrementa o streak
        localStorage.setItem(LAST_ACTIVE_KEY, today)
        setStreak(prev => Math.max(1, prev + 1))
        return
      }

      // Se é o primeiro registro
      if (!lastActive) {
        localStorage.setItem(LAST_ACTIVE_KEY, today)
        setStreak(prev => Math.max(1, prev))
        return
      }

      // Se passou mais de um dia sem acesso, reinicia a ofensiva em 1
      localStorage.setItem(LAST_ACTIVE_KEY, today)
      setStreak(1)
    } catch (e) {
      console.error('Erro ao computar streak diário:', e)
    }
  }, [])

  // Ao abrir o app, registra automaticamente o dia de acesso
  useEffect(() => {
    recordActivity()
  }, [recordActivity])

  // Sincronização offline-first com localStorage
  useEffect(() => {
    try {
      const stateToSave = { xp, coins, streak }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave))
      
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

  // Ouvinte para sincronizar alterações disparadas externamente
  useEffect(() => {
    const handleSync = () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved) {
          const parsed = JSON.parse(saved)
          if (typeof parsed.xp === 'number') setXp(parsed.xp)
          if (typeof parsed.coins === 'number') setCoins(parsed.coins)
          if (typeof parsed.streak === 'number') setStreak(parsed.streak)
        }
      } catch {
        // ignore
      }
    }

    const handleRecord = () => {
      recordActivity()
    }

    window.addEventListener('uply_economy_sync', handleSync)
    window.addEventListener('uply_record_activity', handleRecord)
    return () => {
      window.removeEventListener('uply_economy_sync', handleSync)
      window.removeEventListener('uply_record_activity', handleRecord)
    }
  }, [recordActivity])

  /**
   * Adiciona XP ao jogador
   */
  const addXP = useCallback((amount: number) => {
    if (amount <= 0) return
    setXp(prev => prev + amount)
  }, [])

  /**
   * Adiciona Moedas ao jogador
   */
  const addCoins = useCallback((amount: number) => {
    if (amount <= 0) return
    setCoins(prev => prev + amount)
  }, [])

  /**
   * Adiciona Recompensa combinada (XP + Moedas) e garante atividade registrada
   */
  const addReward = useCallback((xpAmount: number, coinsAmount: number) => {
    if (xpAmount > 0) setXp(prev => prev + xpAmount)
    if (coinsAmount > 0) setCoins(prev => prev + coinsAmount)
    recordActivity()
  }, [recordActivity])

  /**
   * Tenta gastar moedas. Retorna true se houver saldo suficiente e a transação for concluída.
   */
  const spendCoins = useCallback((amount: number): boolean => {
    if (amount <= 0) return false
    if (coins < amount) return false
    
    setCoins(prev => prev - amount)
    return true
  }, [coins])

  /**
   * Reinicia o progresso da economia local
   */
  const resetEconomy = useCallback(() => {
    setXp(0)
    setCoins(0)
    setStreak(1)
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(LAST_ACTIVE_KEY)
  }, [])

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
        addReward,
        recordActivity,
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
