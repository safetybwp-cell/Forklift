'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Loader2, TruckIcon, User, Clock, CheckCircle } from 'lucide-react'

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

export default function ManagerDashboard() {
    const [requests, setRequests] = useState<Request[]>([])
    const [loading, setLoading] = useState(true)
    const [processingId, setProcessingId] = useState<string | null>(null)
    const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'error', message: string } | null>(null)

    useEffect(() => {
        fetchRequests()
    }, [])

    const fetchRequests = async () => {
        // Manager sees "pending" requests only (Step 1)
        const { data, error } = await supabase
            .from('requests')
            .select('*')
            .eq('status', 'pending') // Only pending requests for Step 1
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
                .update({ status: 'dept_manager_approved' })
                .eq('id', id)

            if (error) throw error

            // 2. Fetch Warehouse Manager Email
            const { data: warehouseDept } = await supabase
                .from('departments')
                .select('warehouse_manager_email')
                .eq('name', 'Warehouse')
                .single()

            // Fallback: If no specific warehouse email, try to find any dept with it or use a default
            let whEmail = warehouseDept?.warehouse_manager_email

            if (!whEmail) {
                // Try fetching from the current request's department if configured there
                const { data: currentDept } = await supabase
                    .from('departments')
                    .select('warehouse_manager_email')
                    .eq('name', req.department)
                    .single()
                whEmail = currentDept?.warehouse_manager_email
            }

            if (whEmail) {
                // 3. Send Email to Warehouse Manager
                await fetch('https://api.emailjs.com/api/v1.0/email/send', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        service_id: 'service_nosm7gr',
                        template_id: 'template_nxjk9hg', // Use Request Template (since Warehouse needs to approve too)
                        user_id: 'Q7ihBzmKWUYOHHmL2',
                        template_params: {
                            to_email: whEmail,
                            to_name: 'ผู้จัดการคลังสินค้า',
                            requester_name: req.requester_name,
                            department: req.department,
                            objective: req.objective,
                            start_time: new Date(req.start_time).toLocaleString('th-TH'),
                            end_time: new Date(req.end_time).toLocaleString('th-TH'),
                            status: 'ผ่านการอนุมัติจากผจก.แผนกแล้ว - รอคลังอนุมัติ'
                        }
                    })
                })
                console.log('✅ Email sent to Warehouse Manager')
            } else {
                console.warn('⚠️ No Warehouse Manager Email found!')
            }

            setAlertMessage({ type: 'success', message: '✅ อนุมัติเรียบร้อย (แจ้งเตือนคลังสินค้าแล้ว)' })
            setTimeout(() => setAlertMessage(null), 3000)

        } catch (error: any) {
            console.error(error)
            setAlertMessage({ type: 'error', message: '❌ ผิดพลาด: ' + error.message })
            fetchRequests()
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
            fetchRequests()
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
                    <h1 className="text-3xl font-bold text-blue-800 flex items-center gap-3">
                        <User className="w-8 h-8" />
                        ส่วนสำหรับผู้จัดการแผนก (Step 1)
                    </h1>
                    <a href="/dashboard" className="text-gray-500 hover:text-gray-700">กลับหน้าหลัก</a>
                </div>

                {requests.length === 0 ? (
                    <div className="bg-white rounded-xl p-10 text-center shadow text-gray-500">
                        <CheckCircle className="w-16 h-16 text-green-200 mx-auto mb-4" />
                        <p className="text-xl">ไม่มีคำขอที่รอดำเนินการ</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {requests.map(req => (
                            <div key={req.id} className="bg-white p-6 rounded-xl shadow-md border-l-4 border-blue-500 hover:shadow-lg transition">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-800">{req.requester_name}</h3>
                                        <p className="text-gray-500 text-sm mb-2">{req.department}</p>
                                        <p className="text-gray-700 bg-gray-100 p-2 rounded">
                                            <strong>วัตถุประสงค์:</strong> {req.objective}
                                        </p>
                                        <div className="flex gap-4 mt-3 text-sm text-gray-600">
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-4 h-4" />
                                                เริ่ม: {new Date(req.start_time).toLocaleString('th-TH')}
                                            </span>
                                            <span>
                                                ถึง: {new Date(req.end_time).toLocaleString('th-TH')}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <button
                                            onClick={() => handleApprove(req.id, req)}
                                            disabled={processingId === req.id}
                                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold shadow-sm transition"
                                        >
                                            {processingId === req.id ? 'กำลังทำรายการ...' : '✅ อนุมัติ'}
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
