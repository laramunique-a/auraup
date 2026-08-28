import { deckService } from './deck.service'
import { cardService } from './card.service'
import { lsGet, lsSetItem, supabase } from './storage'
import type { Deck, Card } from '../types'

export const migrationService = {
  async migrateToCloud(userId: string) {
    console.log('🚀 Iniciando migração para a nuvem...')
    
    // 1. Get local data
    const localDecks = lsGet<Deck>('uply_decks')
    const localCards = lsGet<Card>('uply_cards')
    
    if (localDecks.length === 0) {
      console.log('ℹ️ Nenhum dado local para migrar.')
      return { success: true, message: 'Nenhum dado local encontrado.' }
    }

    try {
      // 2. Migrate Decks first (respecting IDs if possible, but services usually generate new ones)
      // Actually, my supabaseCreateDeck manually inserts. I might need a 'bulk' or 'bypass' mode.
      // For simplicity, we create them one by one.
      
      const idMap: Record<string, string> = {} // localId -> cloudId

      for (const d of localDecks) {
        // We use the service but we need to ensure we can keep the local ID if we want to sync cards easily.
        // However, Supabase UUIDs are better. Let's create and map.
        const newDeck = await deckService.createDeck(userId, d.name, d.description)
        idMap[d.id] = newDeck.id
      }

      // 3. Migrate Cards
      for (const c of localCards) {
        const cloudDeckId = idMap[c.deck_id]
        if (cloudDeckId) {
          await cardService.createCard(cloudDeckId, c.front, c.back, {
            front_image: c.front_image,
            back_image: c.back_image,
            front_lang: c.front_lang,
            back_lang: c.back_lang,
            front_audio: c.front_audio,
            back_audio: c.back_audio
          })
        }
      }

      // 4. Migrate Activity
      console.log('📊 Migrando histórico de atividade...')
      const activityData = JSON.parse(localStorage.getItem('uply_activity_global') || '{}')
      for (const [date, count] of Object.entries(activityData)) {
        await supabase!
          .from('activity')
          .upsert({ 
            user_id: userId, 
            date: date, 
            count: count as number 
          }, { onConflict: 'user_id,date' })
      }
      
      console.log('✅ Migração finalizada com sucesso.')
      
      // Mark as migrated so we don't show the button again
      lsSetItem('uply_migrated', true)
      
      return { success: true, count: localDecks.length }
    } catch (error: any) {
      console.error('❌ Falha na migração:', error)
      throw new Error(`Falha na migração: ${error.message}`)
    }
  },

  hasDataToMigrate() {
    return lsGet<any>('uply_decks').length > 0
  }
}
