'use client'

import { useEffect, useState } from 'react'
import {
  supabase,
  getTeacherAvailability,
  getSubscriptions,
  addSubscription,
  removeSubscription,
  bookClass,
  cancelBooking,
} from '@/lib/supabase'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export default function StudentDashboard() {
  const [studentId, setStudentId] = useState('')
  const [studentInfo, setStudentInfo] = useState<any>(null)
  const [availability, setAvailability] = useState<any[]>([])
  const [subscriptions, setSubscriptions] = useState<any[]>([])
  const [userBookings, setUserBookings] = useState<any[]>([])
  const [selectedTime, setSelectedTime] = useState('')
  const [selectedDay, setSelectedDay] = useState(0)

  useEffect(() => {
    const id = sessionStorage.getItem('student_id')
    if (!id) {
      window.location.href = '/'
    } else {
      setStudentId(id)
      loadData(id)
    }
  }, [])

  const loadData = async (id: string) => {
    // 获取学生信息
    const { data: student } = await supabase
      .from('students')
      .select('*')
      .eq('id', id)
      .single()
    setStudentInfo(student)

    // 获取老师开放时间
    const { data: avail } = await supabase
      .from('teacher_availability')
      .select('*')
      .order('day_of_week')
    setAvailability(avail || [])

    // 获取学生订阅
    const { data: subs } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('student_id', id)
      .eq('active', true)
    setSubscriptions(subs || [])

    // 获取学生的预约
    const { data: bookings } = await supabase
      .from('bookings')
      .select('*')
      .eq('student_id', id)
      .order('booking_time', { ascending: false })
    setUserBookings(bookings || [])
  }

  const handleBookClass = async () => {
    if (!selectedTime) {
      alert('Please select a time')
      return
    }

    const now = new Date()
    const selectedDate = new Date(now)
    const daysDiff = selectedDay - now.getDay()
    if (daysDiff < 0) {
      selectedDate.setDate(selectedDate.getDate() + 7 + daysDiff)
    } else if (daysDiff > 0) {
      selectedDate.setDate(selectedDate.getDate() + daysDiff)
    }

    const [hours, minutes] = selectedTime.split(':')
    selectedDate.setHours(parseInt(hours), parseInt(minutes), 0)

    const { error } = await bookClass(studentId, selectedDate.toISOString())
    if (error) {
      alert('Booking failed: ' + error.message)
    } else {
      alert('Booking successful!')
      setSelectedTime('')
      loadData(studentId)
    }
  }

  const handleCancelBooking = async (bookingId: string) => {
    if (confirm('Are you sure you want to cancel this class?')) {
      await cancelBooking(bookingId, studentId)
      loadData(studentId)
    }
  }

  const handleToggleSubscription = async (day: number, time: string) => {
    const existing = subscriptions.find((s) => s.day_of_week === day && s.time === time)
    if (existing) {
      await removeSubscription(existing.id)
    } else {
      await addSubscription(studentId, day, time)
    }
    loadData(studentId)
  }

  if (!studentInfo) return null

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-green-600 text-white p-4 shadow">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">{studentInfo.name}</h1>
            <p className="text-sm">Balance: {studentInfo.credit_hours} credit hours</p>
          </div>
          <button
            onClick={() => {
              sessionStorage.removeItem('student_id')
              window.location.href = '/'
            }}
            className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Book Class */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">📅 Book Class</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold mb-2">Select Day</label>
              <select
                value={selectedDay}
                onChange={(e) => {
                  setSelectedDay(parseInt(e.target.value))
                  setSelectedTime('')
                }}
                className="w-full border rounded px-3 py-2"
              >
                {DAYS.map((day, idx) => (
                  <option key={idx} value={idx}>
                    {day}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold mb-2">Select Time</label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {availability
                  .filter((a) => a.day_of_week === selectedDay)
                  .flatMap((a) => {
                    const times = []
                    const [startH, startM] = a.start_time.split(':')
                    const [endH, endM] = a.end_time.split(':')
                    let current = new Date()
                    current.setHours(parseInt(startH), parseInt(startM), 0)
                    const end = new Date()
                    end.setHours(parseInt(endH), parseInt(endM), 0)

                    while (current < end) {
                      times.push(current.toTimeString().slice(0, 5))
                      current = new Date(current.getTime() + 25 * 60000)
                    }
                    return times
                  })
                  .map((time) => (
                    <button
                      key={time}
                      onClick={() => setSelectedTime(time)}
                      className={`w-full py-2 rounded border-2 transition ${
                        selectedTime === time
                          ? 'bg-green-500 text-white border-green-600'
                          : 'bg-gray-50 border-gray-300 hover:border-green-400'
                      }`}
                    >
                      {time}
                    </button>
                  ))}
              </div>
            </div>

            <button
              onClick={handleBookClass}
              disabled={!selectedTime || studentInfo.credit_hours < 1}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-3 rounded"
            >
              Confirm Booking (Use 1 credit hour)
            </button>
          </div>

          {/* Recurring Classes */}
          <div className="mt-6 border-t pt-4">
            <h3 className="font-bold mb-3">🔄 Recurring Classes</h3>
            <div className="space-y-2 text-sm">
              {availability.map((avail) => {
                const [startH, startM] = avail.start_time.split(':')
                const [endH, endM] = avail.end_time.split(':')
                let times = []
                let current = new Date()
                current.setHours(parseInt(startH), parseInt(startM), 0)
                const end = new Date()
                end.setHours(parseInt(endH), parseInt(endM), 0)

                while (current < end) {
                  times.push(current.toTimeString().slice(0, 5))
                  current = new Date(current.getTime() + 25 * 60000)
                }

                return times.map((time) => {
                  const isSub = subscriptions.some(
                    (s) => s.day_of_week === avail.day_of_week && s.time === time
                  )
                  return (
                    <button
                      key={`${avail.day_of_week}-${time}`}
                      onClick={() =>
                        handleToggleSubscription(avail.day_of_week, time)
                      }
                      className={`w-full py-2 rounded border transition text-sm ${
                        isSub
                          ? 'bg-blue-100 border-blue-500 text-blue-900'
                          : 'bg-gray-50 border-gray-300 hover:border-blue-400'
                      }`}
                    >
                      {isSub ? '✓ ' : ''}
                      {DAYS[avail.day_of_week]} {time}
                    </button>
                  )
                })
              })}
            </div>
          </div>
        </div>

        {/* My Classes */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">📚 My Classes</h2>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {userBookings.length === 0 ? (
              <p className="text-gray-500">No classes booked</p>
            ) : (
              userBookings.map((booking) => (
                <div
                  key={booking.id}
                  className={`p-3 rounded border-l-4 ${
                    booking.status === 'completed'
                      ? 'bg-green-50 border-green-500'
                      : booking.status === 'cancelled'
                        ? 'bg-red-50 border-red-500'
                        : 'bg-blue-50 border-blue-500'
                  }`}
                >
                  <p className="font-bold">
                    {new Date(booking.booking_time).toLocaleString('zh-CN')}
                  </p>
                  <p className="text-sm text-gray-600">
                    Status:{' '}
                    <span className="font-bold">
                      {booking.status === 'completed'
                        ? 'Completed'
                        : booking.status === 'cancelled'
                          ? 'Cancelled'
                          : 'Scheduled'}
                    </span>
                  </p>
                  {booking.status === 'scheduled' && (
                    <button
                      onClick={() => handleCancelBooking(booking.id)}
                      className="mt-2 w-full bg-red-500 hover:bg-red-600 text-white py-1 rounded text-sm"
                    >
                      Cancel Class
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
