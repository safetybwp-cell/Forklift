'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Loader2, TruckIcon, Clock, User, Download } from 'lucide-react'

type Request = {
    id: string
    requester_name: string
    department: string
    objective: string
    start_time: string
    end_time: string
    status: string
    vehicle_image_url: string | null
    created_at: string
}

const statusMap: { [key: string]: { label: string; color: string } } = {
    pending: { label: '⏳ รอหัวหน้าอนุมัติ', color: 'bg-yellow-100 text-yellow-800' },
    manager_approved: { label: '✅ หัวหน้าอนุมัติแล้ว (รอ Stock)', color: 'bg-blue-100 text-blue-800' },
    stock_approved: { label: '🎉 อนุมัติเรียบร้อย', color: 'bg-green-100 text-green-800' },
    rejected: { label: '❌ ปฏิเสธ', color: 'bg-red-100 text-red-800' },
}

export default function Dashboard() {
    const [requests, setRequests] = useState<Request[]>([])
    const [loading, setLoading] = useState(true)
    const [currentRole, setCurrentRole] = useState<'guest' | 'manager' | 'stock'>('manager') // Simulation
    const [processingId, setProcessingId] = useState<string | null>(null)

    useEffect(() => {
        // Security Check
        const isStaff = sessionStorage.getItem('isStaff')
        const isAdmin = sessionStorage.getItem('isAdmin') // Admin also can access

        if (!isStaff && !isAdmin) {
            alert('กรุณาเข้าสู่ระบบก่อน')
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
            nextStatus = 'manager_approved'
        } else if (currentRole === 'stock' && currentStatus === 'manager_approved') {
            nextStatus = 'stock_approved'
        } else {
            setProcessingId(null)
            return
        }

        const { error } = await supabase
            .from('requests')
            .update({ status: nextStatus })
            .eq('id', id)

        if (!error) {
            fetchRequests()

            // Send Email Notification
            const { sendEmail } = await import('@/lib/email')
            const request = requests.find(r => r.id === id)

            if (nextStatus === 'manager_approved') {
                // Notify Stock
                sendEmail({
                    to_name: 'Stock Manager',
                    status: 'Manager Approved (Waiting for Stock)',
                    approver_name: 'Manager',
                    link: window.location.origin + '/dashboard'
                }, 'approval')
            } else if (nextStatus === 'stock_approved') {
                // Notify Requester (Optional, assuming we have their email or just notify system)
                sendEmail({
                    to_name: request?.requester_name || 'User',
                    status: 'Approved by Stock (Ready to use)',
                    approver_name: 'Stock',
                    link: window.location.origin + '/dashboard'
                }, 'approval')
            }

        } else {
            alert('Error updating status')
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
            fetchRequests()
        } else {
            alert('Error updating status')
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
        <div className="min-h-screen p-6">
            <div className="max-w-7xl mx-auto">
                <div className="bg-white rounded-2xl shadow-2xl p-8">
                    <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
                        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                            <TruckIcon className="w-8 h-8" />
                            Dashboard
                        </h1>

                        <div className="flex items-center gap-4">
                            {/* Role Simulator */}
                            <select
                                value={currentRole}
                                onChange={(e) => setCurrentRole(e.target.value as any)}
                                className="px-4 py-2 border rounded-lg bg-gray-50 font-medium"
                            >
                                <option value="guest">Guest View</option>
                                <option value="manager">👤 Role: Manager</option>
                                <option value="stock">📦 Role: Stock</option>
                            </select>

                            <button
                                onClick={() => {
                                    const pwd = prompt('กรุณากรอกรหัสผ่าน Admin:')
                                    if (pwd === '2222') {
                                        sessionStorage.setItem('isAdmin', 'true')
                                        window.location.href = '/admin'
                                    } else if (pwd !== null) {
                                        alert('รหัสผ่านไม่ถูกต้อง!')
                                    }
                                }}
                                className="bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-900 flex items-center gap-2"
                            >
                                ⚙️ Admin
                            </button>

                            <button
                                onClick={handleExportCSV}
                                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
                            >
                                <Download className="w-4 h-4" />
                                Export CSV
                            </button>

                            <a href="/" className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-200">
                                + สร้างคำขอใหม่
                            </a>
                        </div>
                    </div>

                    <div className="grid gap-4">
                        {requests.length === 0 ? (
                            <p className="text-gray-500 text-center py-8">ยังไม่มีคำขอ</p>
                        ) : (
                            requests.map((req) => (
                                <div
                                    key={req.id}
                                    className="border border-gray-200 rounded-lg p-5 hover:shadow-lg transition bg-white"
                                >
                                    <div className="flex flex-col md:flex-row items-start gap-4">
                                        {req.vehicle_image_url && (
                                            <img
                                                src={req.vehicle_image_url}
                                                alt="Vehicle"
                                                className="w-full md:w-32 h-32 rounded-lg object-cover"
                                            />
                                        )}
                                        <div className="flex-1 w-full">
                                            <div className="flex flex-wrap items-start justify-between mb-2 gap-2">
                                                <div>
                                                    <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                                                        <User className="w-5 h-5" />
                                                        {req.requester_name}
                                                    </h3>
                                                    <p className="text-sm text-gray-600">{req.department}</p>
                                                </div>
                                                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${statusMap[req.status]?.color || 'bg-gray-100'}`}>
                                                    {statusMap[req.status]?.label || req.status}
                                                </span>
                                            </div>

                                            <p className="text-gray-700 mb-2">
                                                <strong>วัตถุประสงค์:</strong> {req.objective}
                                            </p>

                                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
                                                <div className="flex items-center gap-1">
                                                    <Clock className="w-4 h-4" />
                                                    <span>
                                                        {new Date(req.start_time).toLocaleString('th-TH')} →{' '}
                                                        {new Date(req.end_time).toLocaleString('th-TH')}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex gap-2 justify-end pt-2 border-t mt-2">
                                                {/* Manager Actions */}
                                                {currentRole === 'manager' && req.status === 'pending' && (
                                                    <>
                                                        <button
                                                            onClick={() => handleReject(req.id)}
                                                            disabled={processingId === req.id}
                                                            className="px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg font-medium transition"
                                                        >
                                                            ไม่อนุมัติ
                                                        </button>
                                                        <button
                                                            onClick={() => handleApprove(req.id, req.status)}
                                                            disabled={processingId === req.id}
                                                            className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition flex items-center gap-2"
                                                        >
                                                            {processingId === req.id && <Loader2 className="w-4 h-4 animate-spin" />}
                                                            อนุมัติ (Manager)
                                                        </button>
                                                    </>
                                                )}

                                                {/* Stock Actions */}
                                                {currentRole === 'stock' && req.status === 'manager_approved' && (
                                                    <>
                                                        <button
                                                            onClick={() => handleReject(req.id)}
                                                            disabled={processingId === req.id}
                                                            className="px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg font-medium transition"
                                                        >
                                                            ไม่อนุมัติ
                                                        </button>
                                                        <button
                                                            onClick={() => handleApprove(req.id, req.status)}
                                                            disabled={processingId === req.id}
                                                            className="px-4 py-2 text-white bg-green-600 hover:bg-green-700 rounded-lg font-medium transition flex items-center gap-2"
                                                        >
                                                            {processingId === req.id && <Loader2 className="w-4 h-4 animate-spin" />}
                                                            อนุมัติ (Stock)
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
