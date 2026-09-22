// Doctor ke schedule entry aur average consultation time se
// automatic time-slots banata hai. Jaise agar 10:00-13:00 hai aur
// averageConsultationTime 15 min hai, to slots: 10:00, 10:15, 10:30...12:45
export function generateSlots(scheduleEntry, averageConsultationTime, dateStr) {
  if (!scheduleEntry || !scheduleEntry.isWorking || !scheduleEntry.startTime || !scheduleEntry.endTime) {
    return []
  }

  const slots = []
  const [startHour, startMin] = scheduleEntry.startTime.split(':').map(Number)
  const [endHour, endMin] = scheduleEntry.endTime.split(':').map(Number)

  let current = startHour * 60 + startMin // sab kuch "minutes since midnight" mein convert kiya, hisaab aasan ho jaata hai
  const end = endHour * 60 + endMin

  while (current + averageConsultationTime <= end) {
    const hours = Math.floor(current / 60)
    const minutes = current % 60
    const timeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
    slots.push(timeStr)
    current += averageConsultationTime
  }

  // Agar selected date AAJ ki hai, to jo slots already beet chuke hain unhe hata do
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  if (dateStr === todayStr) {
    const nowMinutes = today.getHours() * 60 + today.getMinutes()
    return slots.filter((slot) => {
      const [h, m] = slot.split(':').map(Number)
      return h * 60 + m > nowMinutes
    })
  }

  return slots
}

// Date string (jaise "2026-09-20") se din ka naam nikalta hai (jaise "sunday")
export function getDayName(dateStr) {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  const date = new Date(dateStr + 'T00:00:00')
  return days[date.getDay()]
}