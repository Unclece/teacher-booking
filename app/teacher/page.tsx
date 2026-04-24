'use client'

import { useEffect, useState } from 'react'
import {
  getTeacherAvailability,
  addAvailability,
  deleteAvailability,
  getStudents,
  addStudent,
  getBookings,
  completeBooking,
} from '@/lib/supabase'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export default function TeacherDashboard() {
  const [isAuth, setIsAuth] = useState(false)
  const [availability, setAvailability] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [bookings, setBookings] = useState<any[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [newAvail, setNewAvail] = useState({
    day: 0,
    start: '18:30',
    end: '20:30',
  })
  const [newStudent, setNewStudent] = useState({
    name: '',
    email: '',
    phone: '',
  })

  useEffect(() => {
    const auth = sessionStorage.getItem('teacher_auth')
    if (!auth) {
      window.location.href = '/'
    } else {
      setIsAuth(true)
      loadData()
    }
  }, [])

  const loadData = async () => {
    const [availRes, studRes, bookRes] = await Promise.all([
      getTeacherAvailability(),
      getStudents(),
      getBookings(),
    ])
    setAvailability(availRes.data || [])
    setStudents(studRes.data || [])
    setBookings(bookRes.data || [])
  }

  const handleAddAvailability = async (e: React.FormEvent) => {
    e.preventDefault()
    await addAvailability(newAvail.day, newAvail.start, newAvail.end)
    setNewAvail({ day: 0, start: '18:30', end: '20:30' })
    setShowAddForm(false)
    await new Promise(resolve => setTimeout(resolve, 300))
    loadData()
  }

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault()
    await addStudent(newStudent.name, newStudent.email, newStudent.phone)
    setNewStudent({ name: '', email: '', phone: '' })
    loadData()
  }

  const handleDeleteAvailability = async (id: string) => {
    await deleteAvailability(id)
    loadData()
  }

  const handleCompleteBooking = async (bookingId: string) => {
    await completeBooking(bookingId)
    loadData()
  }

  const generateWeekView = () => {
    const today = new Date()
    const currentDay = today.getDay()
    const diffToMonday = (currentDay === 0 ? -6 : 1) - currentDay
    const mondayDate = new Date(today)
    mondayDate.setDate(today.getDate() + diffToMonday)

    const week = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(mondayDate)
      date.setDate(mondayDate.getDate() + i)
      week.push({
        dayOfWeek: (i + 1) % 7,
        date: date,
        dayName: DAYS[(i + 1) % 7],
        dateStr: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      })
    }
    return week
  }

  if (!isAuth) return null

  const week = generateWeekView()

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-blue-600 text-white p-4 shadow">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Teacher Dashboard</h1>
          <button
            onClick={() => {
              sessionStorage.removeItem('teacher_auth')
              window.location.href = '/'
            }}
            className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        {/* Week View Calendar */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">📅 This Week's Schedule</h2>
          <div className="grid grid-cols-7 gap-2">
            {week.map((day) => {
              const dayAvailability = availability.filter(
                (a) => a.day_of_week === day.dayOfWeek
              )
              const isOpen = dayAvailability.length > 0

              return (
                <div key={day.dayOfWeek} className="border rounded-lg overflow-hidden">
                  <div
                    className={`p-3 text-center font-bold text-white ${
                      isOpen ? 'bg-green-600' : 'bg-gray-400'
                    }`}
                  >
                    <div className="text-sm">{day.dayName}</div>
                    <div className="text-xs">{day.dateStr}</div>
                  </div>
                  <div className="p-2 min-h-24 bg-gray-50">
                    {isOpen ? (
                      <div className="text-xs space-y-1">
                        {dayAvailability.map((avail, idx) => (
                          <div
                            key={idx}
                            className="bg-green-100 border border-green-400 rounded p-1 text-green-900"
                          >
                            {avail.start_time}-{avail.end_time}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-gray-500 flex items-center justify-center h-full">
                        Closed
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Cards Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Open Hours Management */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">📅 Open Hours</h2>

          <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
            {availability.map((avail) => (
              <div
                key={avail.id}
                className="flex justify-between items-center bg-gray-50 p-2 rounded text-sm"
              >
                <span>
                  {DAYS[avail.day_of_week]} {avail.start_time}-{avail.end_time}
                </span>
                <button
                  onClick={() => handleDeleteAvailability(avail.id)}
                  className="text-red-500 hover:text-red-700 font-bold"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>

          {showAddForm ? (
            <form onSubmit={handleAddAvailability} className="space-y-3">
              <div>
                <label className="block text-sm font-bold mb-1">Day of Week</label>
                <select
                  value={newAvail.day}
                  onChange={(e) =>
                    setNewAvail({ ...newAvail, day: parseInt(e.target.value) })
                  }
                  className="w-full border rounded px-2 py-1"
                >
                  {DAYS.map((day, idx) => (
                    <option key={idx} value={idx}>
                      {day}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold mb-1">Start Time</label>
                <input
                  type="time"
                  value={newAvail.start}
                  onChange={(e) =>
                    setNewAvail({ ...newAvail, start: e.target.value })
                  }
                  className="w-full border rounded px-2 py-1"
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-1">End Time</label>
                <input
                  type="time"
                  value={newAvail.end}
                  onChange={(e) =>
                    setNewAvail({ ...newAvail, end: e.target.value })
                  }
                  className="w-full border rounded px-2 py-1"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="w-full bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 rounded"
              >
                Cancel
              </button>
            </form>
          ) : (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded"
            >
              + Add Time Slot
            </button>
          )}
        </div>

        {/* Student Management */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">👥 Student List</h2>

          <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
            {students.map((student) => (
              <div key={student.id} className="bg-gray-50 p-2 rounded text-sm">
                <p className="font-bold">{student.name}</p>
                <p className="text-gray-600">Balance: {student.credit_hours} credit hours</p>
              </div>
            ))}
          </div>

          <form onSubmit={handleAddStudent} className="space-y-2">
            <input
              type="text"
              placeholder="Student Name"
              value={newStudent.name}
              onChange={(e) =>
                setNewStudent({ ...newStudent, name: e.target.value })
              }
              className="w-full border rounded px-2 py-1 text-sm"
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={newStudent.email}
              onChange={(e) =>
                setNewStudent({ ...newStudent, email: e.target.value })
              }
              className="w-full border rounded px-2 py-1 text-sm"
              required
            />
            <input
              type="tel"
              placeholder="Phone"
              value={newStudent.phone}
              onChange={(e) =>
                setNewStudent({ ...newStudent, phone: e.target.value })
              }
              className="w-full border rounded px-2 py-1 text-sm"
            />
            <button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded text-sm"
            >
              Add Student
            </button>
          </form>
        </div>

        {/* Class Schedule */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">📚 Recent Classes</h2>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className="bg-gray-50 p-3 rounded text-sm border-l-4 border-blue-500"
              >
                <p className="font-bold">{booking.students?.name || 'Unknown Student'}</p>
                <p className="text-gray-600 text-xs">
                  {new Date(booking.booking_time).toLocaleString('zh-CN')}
                </p>
                <p className="text-xs mb-2">
                  Status:{' '}
                  <span
                    className={
                      booking.status === 'completed'
                        ? 'text-green-600'
                        : booking.status === 'cancelled'
                          ? 'text-red-600'
                          : 'text-blue-600'
                    }
                  >
                    {booking.status === 'completed'
                      ? 'Completed'
                      : booking.status === 'cancelled'
                        ? 'Cancelled'
                        : 'Scheduled'}
                  </span>
                </p>
                {booking.status === 'scheduled' && (
                  <button
                    onClick={() => handleCompleteBooking(booking.id)}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-1 rounded text-xs"
                  >
                    Mark Complete
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
        </div>
      </main>
    </div>
  )
}
