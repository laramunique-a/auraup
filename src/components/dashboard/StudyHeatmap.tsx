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
    if (count === 0) return '#FFFFFF'
    if (count <= 3) return 'rgba(23, 105, 213, 0.25)'
    if (count <= 10) return 'rgba(23, 105, 213, 0.60)'
    return '#1769D5'
  }

  const monthName = viewDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })

  return (
    <div className="w-full max-w-full overflow-hidden animate-fade-in">
      <div className="flex justify-between items-center mb-4 min-w-0 gap-2">
        <div className="flex items-center gap-1.5 shrink-0">
          <button 
            onClick={prevMonth} 
            className="btn-3d-icon w-7 h-7 !rounded-lg"
            title="Mês anterior"
          >
            <ChevronLeft size={15} />
          </button>
          <button 
            onClick={nextMonth} 
            className="btn-3d-icon w-7 h-7 !rounded-lg"
            title="Próximo mês"
          >
            <ChevronRight size={15} />
          </button>
        </div>
        <span className="text-xs font-heading font-black text-aura-text-primary capitalize text-right truncate">
          {monthName}
        </span>
      </div>

      <div className="grid grid-cols-7 gap-1 sm:gap-1.5 mb-4 w-full min-w-0">
        {['S', 'T', 'Q', 'Q', 'S', 'S', 'D'].map((d, idx) => (
          <div key={`${d}-${idx}`} className="text-[10px] sm:text-[11px] font-display font-black text-aura-text-muted text-center mb-1 min-w-0">{d}</div>
        ))}
        {calendarData.map((day, i) => {
          const isFinished = day && day.count > 0
          return (
            <div
              key={day ? day.date : `empty-${i}`}
              title={day ? `${day.date}: ${day.count} cards estudados` : ''}
              style={{
                background: day ? getColor(day.count) : 'transparent',
              }}
              className={`aspect-square w-full rounded-lg sm:rounded-xl border border-aura-blue/10 flex items-center justify-center text-[10px] sm:text-[11px] font-display font-black transition-all select-none min-w-0 ${
                day ? 'opacity-100' : 'opacity-0 pointer-events-none'
              } ${
                isFinished 
                  ? (day.count > 10 ? 'text-white shadow-sm' : 'text-aura-text-primary shadow-xs') 
                  : 'text-slate-400'
              }`}
            >
              {day ? day.dayNumber : ''}
            </div>
          )
        })}
      </div>

      <div className="flex justify-between items-center pt-3 border-t border-aura-blue/10 text-[10px] sm:text-[11px] font-bold text-aura-text-muted min-w-0">
        <span>Menos</span>
        <div className="flex gap-1 sm:gap-1.5 shrink-0">
          {[0, 3, 10, 20].map(n => (
            <div 
              key={n} 
              style={{ background: getColor(n) }} 
              className="w-3.5 h-3.5 rounded-md border border-aura-blue/15"
            />
          ))}
        </div>
        <span>Mais</span>
      </div>
    </div>
  )
}
