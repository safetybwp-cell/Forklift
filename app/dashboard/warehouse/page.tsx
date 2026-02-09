'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Loader2, TruckIcon, Package, Clock, CheckCircle, ArrowLeft } from 'lucide-react'
import { formatThaiDateTime } from '@/lib/utils'

type Request = {
    id: string
    requester_name: string
    requester_email: string
    department: string
    objective: string
    start_time: string
    end_time: string
    status: string
    vehicle_image_url: string | null
    created_at: string
}

export default function WarehouseDashboard() {
    const [requests, setRequests] = useState<Request[]>([])
    const [loading, setLoading] = useState(true)
    const [processingId, setProcessingId] = useState<string | null>(null)
    const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'error', message: string } | null>(null)

    useEffect(() => {
        // Security Check
        const isStaff = sessionStorage.getItem('isStaff')
        const role = sessionStorage.getItem('role')
        const isAdmin = sessionStorage.getItem('isAdmin')

        if ((!isStaff || role !== 'stock') && !isAdmin) {
            alert('กรุณาเข้าสู่ระบบในฐานะผู้จัดการคลังสินค้า')
            window.location.href = '/dashboard'
            return
        }

        fetchRequests()
    }, [])

    const fetchRequests = async () => {
        // Warehouse Manager sees "dept_manager_approved" requests (Step 2)
        const { data, error } = await supabase
            .from('requests')
            .select('*')
            .eq('status', 'dept_manager_approved') // Only requests waiting for Warehouse
            .order('created_at', { ascending: false })

        if (!error && data) {
            setRequests(data)
        }
        setLoading(false)
    }

    const handleApprove = async (id: string, req: Request) => {
        setProcessingId(id)

        // Optimistic Update
        setRequests(prev => prev.filter(r => r.id !== id))

        try {
            // 1. Update DB Status
            const { error } = await supabase
                .from('requests')
                .update({ status: 'warehouse_approved' })
                .eq('id', id)

            if (error) throw error

            // 2. Send Email to Requester (Final Notification)
            if (req.requester_email) {
                await fetch('https://api.emailjs.com/api/v1.0/email/send', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        service_id: 'service_nosm7gr',
                        template_id: 'template_nxjk9hg', // Status Update Template
                        user_id: 'Q7ihBzmKWUYOHHmL2',
                        template_params: {
                            to_email: req.requester_email,
                            to_name: req.requester_name,
                            requester_name: req.requester_name,
                            department: req.department,
                            objective: req.objective,
                            start_time: formatThaiDateTime(req.start_time),
                            end_time: formatThaiDateTime(req.end_time),
                            status: '✅ อนุมัติครบถ้วน - กรุณาติดต่อรับรถ',
                            status: '✅ อนุมัติครบถ้วน - กรุณาติดต่อรับรถ',
                            approver_name: 'ผู้จัดการคลังสินค้า',
                            link: 'https://forklift-sage.vercel.app/dashboard' // Link for Requester to check status
                        }
                    })
                })
                console.log('✅ Email sent to Requester')
            } else {
                console.warn('⚠️ No Requester Email provided!')
            }

            setAlertMessage({ type: 'success', message: '✅ อนุมัติขั้นสุดท้ายเรียบร้อย (แจ้งเตือนผู้ขอแล้ว)' })
            setTimeout(() => setAlertMessage(null), 3000)

        } catch (error: any) {
            console.error(error)
            setAlertMessage({ type: 'error', message: '❌ ผิดพลาด: ' + error.message })
            // fetchRequests()
        }
        setProcessingId(null)
    }

    const handleReject = async (id: string) => {
        if (!confirm('ยืนยันไม่อนุมัติ?')) return
        setProcessingId(id)

        setRequests(prev => prev.filter(req => req.id !== id))

        const { error } = await supabase
            .from('requests')
            .update({ status: 'rejected' })
            .eq('id', id)

        if (!error) {
            setAlertMessage({ type: 'success', message: '✅ ปฏิเสธคำขอเรียบร้อย' })
            setTimeout(() => setAlertMessage(null), 3000)
        } else {
            setAlertMessage({ type: 'error', message: '❌ ผิดพลาด: ' + error.message })
            // fetchRequests()
        }
        setProcessingId(null)
    }

    if (loading) return <div className="p-10 text-center"><Loader2 className="animate-spin inline" /> กำลังโหลด...</div>

    return (
        <div className="min-h-screen p-6 bg-gray-50">
            <div className="max-w-5xl mx-auto">
                {alertMessage && (
                    <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${alertMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {alertMessage.message}
                    </div>
                )}

                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-bold text-green-800 flex items-center gap-3">
                        <Package className="w-8 h-8" />
                        อนุมัติคำขอ: ผจก.คลังสินค้า
                    </h1>
                    <a href="/dashboard" className="flex items-center gap-2 text-gray-500 hover:text-gray-700">
                        <ArrowLeft className="w-5 h-5" />
                        ออกจากระบบ
                    </a>
                </div>

                {requests.length === 0 ? (
                    <div className="bg-white rounded-xl p-10 text-center shadow text-gray-500">
                        <CheckCircle className="w-16 h-16 text-green-200 mx-auto mb-4" />
                        <p className="text-xl">ไม่มีคำขอที่รออนุมัติ</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {requests.map(req => (
                            <div key={req.id} className="bg-white p-6 rounded-xl shadow-md border-l-4 border-green-500 hover:shadow-lg transition">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-800">
                                            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mr-2">ผ่านผจก.แผนกมาแล้ว</span>
                                            {req.requester_name}
                                        </h3>
                                        <p className="text-gray-500 text-sm mb-2">{req.department}</p>
                                        <p className="text-gray-700 bg-gray-100 p-2 rounded">
                                            <strong>วัตถุประสงค์:</strong> {req.objective}
                                        </p>
                                        <div className="flex gap-4 mt-3 text-sm text-gray-600">
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-4 h-4" />
                                                เริ่ม: {formatThaiDateTime(req.start_time)}
                                            </span>
                                            <span>
                                                ถึง: {formatThaiDateTime(req.end_time)}
                                            </span>
                                        </div>
                                        {req.vehicle_image_url && (
                                            <div className="mt-2">
                                                <a href={req.vehicle_image_url} target="_blank" className="text-blue-500 text-xs underline">ดูรูปภาพรถ</a>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <button
                                            onClick={() => handleApprove(req.id, req)}
                                            disabled={processingId === req.id}
                                            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold shadow-sm transition"
                                        >
                                            {processingId === req.id ? 'กำลังทำรายการ...' : '✅ อนุมัติการใช้รถ'}
                                        </button>
                                        <button
                                            onClick={() => handleReject(req.id)}
                                            disabled={processingId === req.id}
                                            className="px-6 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 font-medium transition"
                                        >
                                            ไม่อนุมัติ
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

