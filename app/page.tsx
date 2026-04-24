'use client'

import { useState } from 'react'

export default function Home() {
  const [mode, setMode] = useState<'login' | null>(null)
  const [password, setPassword] = useState('')
  const [isTeacher, setIsTeacher] = useState(false)
  const [error, setError] = useState('')

  const TEACHER_PASSWORD = 'teacher123'

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (isTeacher) {
      if (password === TEACHER_PASSWORD) {
        sessionStorage.setItem('teacher_auth', 'true')
        window.location.href = '/teacher'
      } else {
        setError('Password incorrect')
      }
    } else {
      if (password) {
        sessionStorage.setItem('student_id', password)
        window.location.href = '/student'
      } else {
        setError('Please enter Student ID')
      }
    }
  }

  if (mode === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full">
          <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">Class Booking System</h1>

          <div className="space-y-4">
            <button
              onClick={() => {
                setMode('login')
                setIsTeacher(true)
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition"
            >
              Teacher Login
            </button>

            <button
              onClick={() => {
                setMode('login')
                setIsTeacher(false)
              }}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition"
            >
              Student Login
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
          {isTeacher ? 'Teacher Login' : 'Student Login'}
        </h2>

        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-gray-700 font-bold mb-2">
              {isTeacher ? 'Password' : 'Student ID'}
            </label>
            <input
              type={isTeacher ? 'password' : 'text'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isTeacher ? 'Enter teacher password' : 'Enter your student ID'}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg transition"
          >
            Login
          </button>
        </form>

        <button
          onClick={() => {
            setMode(null)
            setPassword('')
            setError('')
          }}
          className="w-full mt-4 text-gray-600 hover:text-gray-800 py-2"
        >
          Back
        </button>
      </div>
    </div>
  )
}
