import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { getStudyDayKey } from '../../lib/sm2'

interface StudyHeatmapProps {
  activity: Record<string, number>
}

export function StudyHeatmap({ activity }: StudyHeatmapProps) {
  const [viewDate, setViewDate] = useState(new Date())

  const calendarData = useMemo(() => {
    const year = viewDate.getFullYear()
    const month = viewDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    
    let startOffset = firstDay.getDay() - 1 
    if (startOffset === -1) startOffset = 6 

    const days = []
    for (let i = 0; i < startOffset; i++) days.push(null)
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const dateStr = getStudyDayKey(new Date(year, month, d))
      days.push({ dayNumber: d, date: dateStr, count: activity[dateStr] || 0 })
    }
    return days
  }, [viewDate, activity])

  const nextMonth = () => setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
  const prevMonth = () => setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))

  const getColor = (count: number) => {
    if (count === 0) return 'var(--bg-surface)'
    if (count <= 3) return 'rgba(var(--accent-rgb), 0.25)'
    if (count <= 10) return 'rgba(var(--accent-rgb), 0.55)'
    return 'var(--accent)'
  }

  const monthName = viewDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })

  return (
    <div style={{
      background: 'transparent',
      padding: '0',
      width: '100%',
      animation: 'fadeIn 0.5s ease',
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '1rem' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <button 
            onClick={prevMonth} 
            style={{ 
              background: 'var(--bg-surface)', border: '1px solid var(--border)', 
              borderRadius: '8px', padding: '4px 6px', cursor: 'pointer', color: 'var(--text-secondary)',
              display: 'flex', alignItems: 'center'
            }}
          >
            <ChevronLeft size={16} />
          </button>
          <button 
            onClick={nextMonth} 
            style={{ 
              background: 'var(--bg-surface)', border: '1px solid var(--border)', 
              borderRadius: '8px', padding: '4px 6px', cursor: 'pointer', color: 'var(--text-secondary)',
              display: 'flex', alignItems: 'center'
            }}
          >
            <ChevronRight size={16} />
          </button>
        </div>
        <span style={{ 
          fontSize: '0.8125rem', fontWeight: 800, color: 'var(--text-primary)', 
          textTransform: 'capitalize', textAlign: 'right'
        }}>
          {monthName}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '1rem' }}>
        {['S', 'T', 'Q', 'Q', 'S', 'S', 'D'].map((d, idx) => (
          <div key={`${d}-${idx}`} style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textAlign: 'center', marginBottom: '4px' }}>{d}</div>
        ))}
        {calendarData.map((day, i) => {
          const isFinished = day && day.count > 0
          return (
            <div
              key={day ? day.date : `empty-${i}`}
              title={day ? `${day.date}: ${day.count} cards estudados` : ''}
              style={{
                aspectRatio: '1/1',
                width: '100%',
                borderRadius: '8px',
                background: day ? getColor(day.count) : 'transparent',
                border: day ? '1px solid var(--border)' : 'none',
                opacity: day ? 1 : 0,
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.6875rem',
                fontWeight: 800,
                color: isFinished 
                  ? (day.count > 10 ? '#ffffff' : 'var(--text-primary)') 
                  : 'rgba(71, 85, 105, 0.65)',
                userSelect: 'none',
                boxShadow: isFinished ? '0 2px 4px rgba(0, 0, 0, 0.05)' : 'none'
              }}
            >
              {day ? day.dayNumber : ''}
            </div>
          )
        })}
      </div>

      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        paddingTop: '0.75rem',
        borderTop: '1px solid var(--border)'
      }}>
        <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)' }}>Menos</span>
        <div style={{ display: 'flex', gap: '4px' }}>
          {[0, 3, 10, 20].map(n => (
            <div 
              key={n} 
              style={{ 
                width: '12px', 
                height: '12px', 
                borderRadius: '3px', 
                background: getColor(n),
                border: '1px solid var(--border)'
              }} 
            />
          ))}
        </div>
        <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)' }}>Mais</span>
      </div>
    </div>
  )
}
