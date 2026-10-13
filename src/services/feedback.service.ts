import { supabase, isLocalMode, generateId } from './storage'

export interface AttachedFeedbackImage {
  id: string
  name: string
  dataUrl: string
}

export interface FeedbackItem {
  id: string
  user_id?: string
  user_name: string
  user_email: string
  type: 'bug' | 'suggestion'
  message: string
  images: AttachedFeedbackImage[]
  status: 'pending' | 'resolved' | 'in_review'
  device_info?: string
  app_version?: string
  created_at: string
}

const LS_FEEDBACK_DB = 'uply_feedback_db'

function getLocalFeedbacks(): FeedbackItem[] {
  try {
    const raw = localStorage.getItem(LS_FEEDBACK_DB)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return []
}

function saveLocalFeedbacks(items: FeedbackItem[]): void {
  try {
    localStorage.setItem(LS_FEEDBACK_DB, JSON.stringify(items))
  } catch { /* ignore */ }
}

export const feedbackService = {
  async sendFeedback(payload: {
    user_id?: string
    user_name: string
    user_email: string
    type: 'bug' | 'suggestion'
    message: string
    images?: AttachedFeedbackImage[]
    device_info?: string
    app_version?: string
  }): Promise<{ success: boolean; id?: string; error?: string }> {
    const id = generateId()
    const now = new Date().toISOString()
    const newItem: FeedbackItem = {
      id,
      user_id: payload.user_id,
      user_name: payload.user_name || 'Usuário',
      user_email: payload.user_email || 'sem-email@auraup.com',
      type: payload.type,
      message: payload.message.trim(),
      images: payload.images || [],
      status: 'pending',
      device_info: payload.device_info || (typeof navigator !== 'undefined' ? navigator.userAgent : undefined),
      app_version: payload.app_version || '2.0.0',
      created_at: now,
    }

    // Sempre salva localmente primeiro (garantia de nunca perder)
    const localList = getLocalFeedbacks()
    localList.unshift(newItem)
    saveLocalFeedbacks(localList)

    // Se houver conexão com Supabase, tenta persistir na tabela feedback
    if (!isLocalMode && supabase) {
      try {
        const { data, error } = await supabase.from('feedback').insert({
          id,
          user_id: payload.user_id || null,
          user_name: newItem.user_name,
          user_email: newItem.user_email,
          type: newItem.type,
          message: newItem.message,
          images: newItem.images,
          status: 'pending',
        }).select('id').single()

        if (!error && data?.id) {
          return { success: true, id: data.id }
        }
      } catch (err: any) {
        console.warn('Fallback para armazenamento local de feedback:', err?.message)
      }
    }

    return { success: true, id }
  },

  async getFeedbacks(): Promise<FeedbackItem[]> {
    let list: FeedbackItem[] = []

    if (!isLocalMode && supabase) {
      try {
        const { data, error } = await supabase
          .from('feedback')
          .select('*')
          .order('created_at', { ascending: false })

        if (!error && data && data.length > 0) {
          list = data.map((item: any) => ({
            id: item.id,
            user_id: item.user_id,
            user_name: item.user_name || 'Usuário',
            user_email: item.user_email || '',
            type: item.type === 'suggestion' ? 'suggestion' : 'bug',
            message: item.message || '',
            images: Array.isArray(item.images) ? item.images : [],
            status: item.status || 'pending',
            created_at: item.created_at || new Date().toISOString(),
          }))
          return list
        }
      } catch {
        // fallback para localStorage
      }
    }

    return getLocalFeedbacks()
  },

  async updateStatus(id: string, status: 'pending' | 'resolved' | 'in_review'): Promise<boolean> {
    const local = getLocalFeedbacks()
    const idx = local.findIndex(f => f.id === id)
    if (idx !== -1) {
      local[idx].status = status
      saveLocalFeedbacks(local)
    }

    if (!isLocalMode && supabase) {
      try {
        await supabase.from('feedback').update({ status }).eq('id', id)
      } catch { /* ignore */ }
    }

    return true
  },

  async deleteFeedback(id: string): Promise<boolean> {
    const local = getLocalFeedbacks().filter(f => f.id !== id)
    saveLocalFeedbacks(local)

    if (!isLocalMode && supabase) {
      try {
        await supabase.from('feedback').delete().eq('id', id)
      } catch { /* ignore */ }
    }

    return true
  }
}
