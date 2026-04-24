import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

// 学生相关
export async function getStudents() {
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('status', 'active')
  return { data, error }
}

export async function addStudent(name: string, email: string, phone: string) {
  const { data, error } = await supabase
    .from('students')
    .insert([{ name, email, phone, credit_hours: 0 }])
  return { data, error }
}

export async function updateStudentCredits(studentId: string, creditHours: number) {
  const { data, error } = await supabase
    .from('students')
    .update({ credit_hours: creditHours })
    .eq('id', studentId)
  return { data, error }
}

// 可用时间相关
export async function getTeacherAvailability() {
  const { data, error } = await supabase
    .from('teacher_availability')
    .select('*')
    .order('day_of_week')
  return { data, error }
}

export async function addAvailability(dayOfWeek: number, startTime: string, endTime: string) {
  const { data, error } = await supabase
    .from('teacher_availability')
    .insert([{ day_of_week: dayOfWeek, start_time: startTime, end_time: endTime }])
  return { data, error }
}

export async function deleteAvailability(id: string) {
  const { data, error } = await supabase
    .from('teacher_availability')
    .delete()
    .eq('id', id)
  return { data, error }
}

// 预约相关
export async function getBookings() {
  const { data, error } = await supabase
    .from('bookings')
    .select('*, students(name, email)')
    .order('booking_time')
  return { data, error }
}

export async function bookClass(studentId: string, bookingTime: string) {
  const { data: student } = await supabase
    .from('students')
    .select('credit_hours')
    .eq('id', studentId)
    .single()

  if (!student || student.credit_hours < 1) {
    return { data: null, error: new Error('课时不足') }
  }

  const { data, error } = await supabase
    .from('bookings')
    .insert([{ student_id: studentId, booking_time: bookingTime, status: 'scheduled' }])

  if (!error) {
    await updateStudentCredits(studentId, student.credit_hours - 1)
  }

  return { data, error }
}

export async function cancelBooking(bookingId: string, studentId: string) {
  const { data: student } = await supabase
    .from('students')
    .select('credit_hours')
    .eq('id', studentId)
    .single()

  const { error } = await supabase
    .from('bookings')
    .update({ status: 'cancelled' })
    .eq('id', bookingId)

  if (!error && student) {
    await updateStudentCredits(studentId, student.credit_hours + 1)
  }

  return { error }
}

export async function completeBooking(bookingId: string) {
  const { error } = await supabase
    .from('bookings')
    .update({ status: 'completed' })
    .eq('id', bookingId)
  return { error }
}

// 订阅相关
export async function getSubscriptions(studentId: string) {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('student_id', studentId)
    .eq('active', true)
  return { data, error }
}

export async function addSubscription(studentId: string, dayOfWeek: number, time: string) {
  const { data, error } = await supabase
    .from('subscriptions')
    .insert([{ student_id: studentId, day_of_week: dayOfWeek, time, active: true }])
  return { data, error }
}

export async function removeSubscription(subscriptionId: string) {
  const { error } = await supabase
    .from('subscriptions')
    .update({ active: false })
    .eq('id', subscriptionId)
  return { error }
}
