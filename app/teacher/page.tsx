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

const DAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

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

  if (!isAuth) return null

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-blue-600 text-white p-4 shadow">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">老师控制台</h1>
          <button
            onClick={() => {
              sessionStorage.removeItem('teacher_auth')
              window.location.href = '/'
            }}
            className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded"
          >
            登出
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 开放时间管理 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">📅 开放时段</h2>

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
                  删除
                </button>
              </div>
            ))}
          </div>

          {showAddForm ? (
            <form onSubmit={handleAddAvailability} className="space-y-3">
              <div>
                <label className="block text-sm font-bold mb-1">星期</label>
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
                <label className="block text-sm font-bold mb-1">开始时间</label>
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
                <label className="block text-sm font-bold mb-1">结束时间</label>
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
                添加
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="w-full bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 rounded"
              >
                取消
              </button>
            </form>
          ) : (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded"
            >
              + 添加时段
            </button>
          )}
        </div>

        {/* 学生管理 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">👥 学生列表</h2>

          <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
            {students.map((student) => (
              <div key={student.id} className="bg-gray-50 p-2 rounded text-sm">
                <p className="font-bold">{student.name}</p>
                <p className="text-gray-600">余额: {student.credit_hours} 课时</p>
              </div>
            ))}
          </div>

          <form onSubmit={handleAddStudent} className="space-y-2">
            <input
              type="text"
              placeholder="学生名字"
              value={newStudent.name}
              onChange={(e) =>
                setNewStudent({ ...newStudent, name: e.target.value })
              }
              className="w-full border rounded px-2 py-1 text-sm"
              required
            />
            <input
              type="email"
              placeholder="邮箱"
              value={newStudent.email}
              onChange={(e) =>
                setNewStudent({ ...newStudent, email: e.target.value })
              }
              className="w-full border rounded px-2 py-1 text-sm"
              required
            />
            <input
              type="tel"
              placeholder="电话"
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
              添加学生
            </button>
          </form>
        </div>

        {/* 课表 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">📚 最近课程</h2>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className="bg-gray-50 p-3 rounded text-sm border-l-4 border-blue-500"
              >
                <p className="font-bold">{booking.students?.name || '未知学生'}</p>
                <p className="text-gray-600 text-xs">
                  {new Date(booking.booking_time).toLocaleString('zh-CN')}
                </p>
                <p className="text-xs mb-2">
                  状态:{' '}
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
                      ? '已完成'
                      : booking.status === 'cancelled'
                        ? '已取消'
                        : '待上课'}
                  </span>
                </p>
                {booking.status === 'scheduled' && (
                  <button
                    onClick={() => handleCompleteBooking(booking.id)}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-1 rounded text-xs"
                  >
                    标记完成
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
