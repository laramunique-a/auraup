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
    if (count === 0) return 'transparent'
    if (count <= 3) return 'rgba(23, 105, 213, 0.25)'
    if (count <= 10) return 'rgba(23, 105, 213, 0.60)'
    return '#1769D5'
  }

  const monthName = viewDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })

  return (
    <div className="w-full max-w-full overflow-hidden animate-fade-in">
      <div className="flex justify-between items-center mb-3 min-w-0 gap-2">
        <div className="flex items-center gap-1.5 shrink-0">
          <button 
            type="button"
            onClick={prevMonth} 
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-all active:scale-90 cursor-pointer"
            title="Mês anterior"
            aria-label="Mês anterior"
          >
            <ChevronLeft size={15} />
          </button>
          <button 
            type="button"
            onClick={nextMonth} 
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-all active:scale-90 cursor-pointer"
            title="Próximo mês"
            aria-label="Próximo mês"
          >
            <ChevronRight size={15} />
          </button>
        </div>
        <span className="text-xs sm:text-sm font-heading font-bold text-slate-800 dark:text-white capitalize text-right truncate">
          {monthName}
        </span>
      </div>

      <div className="grid grid-cols-7 gap-1 sm:gap-1.5 mb-3 w-full min-w-0">
        {['S', 'T', 'Q', 'Q', 'S', 'S', 'D'].map((d, idx) => (
          <div key={`${d}-${idx}`} className="text-[10px] sm:text-[11px] font-heading font-bold text-slate-400 dark:text-slate-500 text-center mb-0.5 min-w-0">
            {d}
          </div>
        ))}
        {calendarData.map((day, i) => {
          const isFinished = Boolean(day && day.count > 0)
          return (
            <div
              key={day ? day.date : `empty-${i}`}
              title={day ? `${day.date}: ${day.count} cards estudados` : ''}
              style={{
                background: isFinished && day ? getColor(day.count) : undefined,
              }}
              className={`aspect-square w-full rounded-lg sm:rounded-xl border flex items-center justify-center text-[10px] sm:text-[11px] font-heading font-extrabold transition-all select-none min-w-0 ${
                day ? 'opacity-100' : 'opacity-0 pointer-events-none'
              } ${
                isFinished && day
                  ? (day.count > 10 ? 'text-white border-blue-600 shadow-xs' : 'text-blue-950 dark:text-blue-100 border-blue-300 dark:border-blue-700 shadow-2xs') 
                  : 'bg-slate-50/80 dark:bg-slate-800/60 border-slate-200/60 dark:border-slate-700/60 text-slate-400 dark:text-slate-500'
              }`}
            >
              {day ? day.dayNumber : ''}
            </div>
          )
        })}
      </div>

      <div className="flex justify-between items-center pt-2.5 border-t border-slate-100 dark:border-slate-700/60 text-[10px] sm:text-[11px] font-medium text-slate-400 dark:text-slate-500 min-w-0">
        <span>Menos</span>
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          <div className="w-3.5 h-3.5 rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" title="0 cards" />
          <div style={{ background: 'rgba(23, 105, 213, 0.25)' }} className="w-3.5 h-3.5 rounded-md border border-blue-300 dark:border-blue-700" title="1-3 cards" />
          <div style={{ background: 'rgba(23, 105, 213, 0.60)' }} className="w-3.5 h-3.5 rounded-md border border-blue-400 dark:border-blue-600" title="4-10 cards" />
          <div style={{ background: '#1769D5' }} className="w-3.5 h-3.5 rounded-md border border-blue-600" title="10+ cards" />
        </div>
        <span>Mais</span>
      </div>
    </div>
  )
}
