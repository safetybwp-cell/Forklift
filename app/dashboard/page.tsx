'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Loader2, TruckIcon, Clock, User, Download } from 'lucide-react'

type Request = {
    id: string
    requester_name: string
    requester_email: string // Added
    department: string
    objective: string
    start_time: string
    end_time: string
    status: string
    vehicle_image_url: string | null
    created_at: string
}

const statusMap: { [key: string]: { label: string; color: string } } = {
    pending: { label: '⏳ รอผจก.แผนกอนุมัติ', color: 'bg-yellow-100 text-yellow-800' },
    dept_manager_approved: { label: '📋 รอผจก.คลังอนุมัติ', color: 'bg-blue-100 text-blue-800' },
    warehouse_approved: { label: '🎉 อนุมัติครบถ้วน', color: 'bg-green-100 text-green-800' },
    rejected: { label: '❌ ปฏิเสธ', color: 'bg-red-100 text-red-800' },
}

export default function Dashboard() {
    const [requests, setRequests] = useState<Request[]>([])
    const [loading, setLoading] = useState(true)
    const [currentRole, setCurrentRole] = useState<'guest' | 'manager' | 'stock'>('manager') // Simulation
    const [processingId, setProcessingId] = useState<string | null>(null)
    const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('pending')
    const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'error', message: string } | null>(null)

    useEffect(() => {
        // Security Check
        const isStaff = sessionStorage.getItem('isStaff')
        const isAdmin = sessionStorage.getItem('isAdmin') // Admin also can access

        if (!isStaff && !isAdmin) {
            window.alert('กรุณาเข้าสู่ระบบก่อน')
            window.location.href = '/'
            return
        }

        fetchRequests()
    }, [])

    const fetchRequests = async () => {
        const { data, error } = await supabase
            .from('requests')
            .select('*')
            .order('created_at', { ascending: false })

        if (!error && data) {
            setRequests(data)
        }
        setLoading(false)
    }

    const handleApprove = async (id: string, currentStatus: string) => {
        setProcessingId(id)
        let nextStatus = ''

        if (currentRole === 'manager' && currentStatus === 'pending') {
            nextStatus = 'dept_manager_approved'
        } else if (currentRole === 'stock' && currentStatus === 'dept_manager_approved') {
            nextStatus = 'warehouse_approved'
        } else {
            setProcessingId(null)
            return
        }

        const { error } = await supabase
            .from('requests')
            .update({ status: nextStatus })
            .eq('id', id)

        if (!error) {
            // Show success alert
            setAlertMessage({ type: 'success', message: '✅ อนุมัติสำเร็จ! ระบบได้ส่งอีเมลแจ้งผู้เกี่ยวข้องแล้ว' })

            // Auto-hide alert after 3 seconds
            setTimeout(() => setAlertMessage(null), 3000)

            // Optimistically update local state to remove the item immediately
            setRequests(prev => prev.map(r => r.id === id ? { ...r, status: nextStatus } : r))

            // Refresh data in background
            // fetchRequests()

            // All email notifications are handled by Edge Function (notify-approver)
            // Backend automatically sends emails based on status changes
            console.log(`Status updated to: ${nextStatus}. Email will be sent by backend.`)

        } else {
            setAlertMessage({ type: 'error', message: '❌ เกิดข้อผิดพลาด: ' + error.message })
            setTimeout(() => setAlertMessage(null), 3000)
        }
        setProcessingId(null)
    }

    const handleReject = async (id: string) => {
        if (!confirm('ยืนยันการปฏิเสธคำขอ?')) return

        setProcessingId(id)
        const { error } = await supabase
            .from('requests')
            .update({ status: 'rejected' })
            .eq('id', id)

        if (!error) {
            setAlertMessage({ type: 'success', message: '✅ ปฏิเสธคำขอเรียบร้อย' })
            setTimeout(() => setAlertMessage(null), 3000)

            // Optimistically update local state
            setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'rejected' } : r))

            // fetchRequests()
        } else {
            setAlertMessage({ type: 'error', message: '❌ เกิดข้อผิดพลาด: ' + error.message })
            setTimeout(() => setAlertMessage(null), 3000)
        }
        setProcessingId(null)
    }

    const handleExportCSV = () => {
        const headers = ['ID,Requester,Department,Objective,Start Time,End Time,Status,Created At,Image URL']
        const csvContent = requests.map(req => {
            return [
                req.id,
                `"${req.requester_name}"`, // Quote strings to handle commas
                req.department,
                `"${req.objective}"`,
                new Date(req.start_time).toLocaleString('th-TH'),
                new Date(req.end_time).toLocaleString('th-TH'),
                req.status,
                new Date(req.created_at).toLocaleString('th-TH'),
                req.vehicle_image_url || ''
            ].join(',')
        })

        const csvString = [headers, ...csvContent].join('\n')
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.setAttribute('href', url)
        link.setAttribute('download', `forklift_requests_${new Date().toISOString().split('T')[0]}.csv`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-gray-500" />
            </div>
        )
    }

    return (
        <div className="min-h-screen p-6 bg-gray-100 flex items-center justify-center">
            <div className="max-w-4xl w-full">
                <h1 className="text-4xl font-bold text-center text-gray-800 mb-10">
                    🚜 Dashboard ระบบอนุมัติ
                </h1>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Department Manager Card */}
                    <a href="/dashboard/manager" className="bg-white p-8 rounded-2xl shadow-xl hover:shadow-2xl transition transform hover:-translate-y-1 group">
                        <div className="flex flex-col items-center text-center">
                            <div className="bg-blue-100 p-4 rounded-full mb-6 group-hover:bg-blue-200 transition">
                                <User className="w-12 h-12 text-blue-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-800 mb-2">สำหรับผู้จัดการแผนก</h2>
                            <p className="text-gray-500">
                                (Step 1) อนุมัติคำขอจากพนักงานในแผนก
                            </p>
                            <span className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-full font-bold group-hover:bg-blue-700 transition">
                                เข้าสู่ระบบ
                            </span>
                        </div>
                    </a>

                    {/* Warehouse Manager Card */}
                    <a href="/dashboard/warehouse" className="bg-white p-8 rounded-2xl shadow-xl hover:shadow-2xl transition transform hover:-translate-y-1 group">
                        <div className="flex flex-col items-center text-center">
                            <div className="bg-green-100 p-4 rounded-full mb-6 group-hover:bg-green-200 transition">
                                <TruckIcon className="w-12 h-12 text-green-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-800 mb-2">สำหรับผู้จัดการคลัง</h2>
                            <p className="text-gray-500">
                                (Step 2) ตรวจสอบและอนุมัติการจ่ายรถ
                            </p>
                            <span className="mt-6 px-6 py-2 bg-green-600 text-white rounded-full font-bold group-hover:bg-green-700 transition">
                                เข้าสู่ระบบ
                            </span>
                        </div>
                    </a>
                </div>

                <div className="mt-12 text-center">
                    <button
                        onClick={() => {
                            const pwd = prompt('รหัสผ่าน Admin:')
                            if (pwd === '2222') window.location.href = '/admin'
                        }}
                        className="text-gray-500 hover:text-gray-800 underline"
                    >
                        ⚙️ เข้าสู่ระบบผู้ดูแลระบบ (Admin)
                    </button>
                    <div className="mt-4">
                        <a href="/" className="text-blue-500 hover:underline">← กลับหน้าแบบฟอร์ม</a>
                    </div>
                </div>
            </div>
        </div>
    )
}
