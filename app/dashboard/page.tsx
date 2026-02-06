'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Loader2, User, TruckIcon, Lock, ArrowRight } from 'lucide-react'

type Department = {
    id: string
    name: string
    password?: string
}

export default function DashboardLogin() {
    const [departments, setDepartments] = useState<Department[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedDeptId, setSelectedDeptId] = useState('')
    const [password, setPassword] = useState('')
    const [isLoggingIn, setIsLoggingIn] = useState(false)

    // For Warehouse quick access
    const [warehouseDept, setWarehouseDept] = useState<Department | null>(null)

    useEffect(() => {
        const fetchDepts = async () => {
            const { data } = await supabase.from('departments').select('id, name, password').order('name')
            if (data) {
                setDepartments(data)
                const wh = data.find(d => d.name.toLowerCase().includes('warehouse') || d.name === 'คลังสินค้า')
                if (wh) setWarehouseDept(wh)
            }
            setLoading(false)
        }
        fetchDepts()

        // Clear previous sessions
        sessionStorage.clear()
    }, [])

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!password) return

        setIsLoggingIn(true)

        // Admin Override
        if (password === '2222') {
            // Auto login as admin
            sessionStorage.setItem('isAdmin', 'true')
            window.location.href = '/admin'
            return
        }

        if (!selectedDeptId) {
            alert('กรุณาเลือกแผนก')
            setIsLoggingIn(false)
            return
        }

        const dept = departments.find(d => d.id === selectedDeptId)

        if (dept) {
            if (dept.password === password) {
                // Login Success
                sessionStorage.setItem('isStaff', 'true')
                sessionStorage.setItem('deptId', dept.id)
                sessionStorage.setItem('deptName', dept.name)

                if (dept.name.toLowerCase().includes('warehouse') || dept.name === 'คลังสินค้า') {
                    sessionStorage.setItem('role', 'stock')
                    window.location.href = '/dashboard/warehouse'
                } else {
                    sessionStorage.setItem('role', 'manager')
                    window.location.href = '/dashboard/manager?dept_id=' + dept.id
                }
            } else {
                alert('รหัสผ่านไม่ถูกต้อง')
                setIsLoggingIn(false)
            }
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <Loader2 className="w-10 h-10 animate-spin text-gray-500" />
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-100">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
                <h1 className="text-3xl font-bold text-gray-800 mb-2 text-center">🚜 เข้าสู่ระบบอนุมัติ</h1>
                <p className="text-gray-500 text-center mb-8">กรุณาเลือกแผนกและระบุรหัสผ่าน</p>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">เลือกแผนก</label>
                        <select
                            value={selectedDeptId}
                            onChange={(e) => setSelectedDeptId(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                        >
                            <option value="">-- กรุณาเลือก --</option>
                            {/* Filter out Warehouse from general list to avoid confusion if we want specific buttons, 
                        BUT for simplicity let's keep all and maybe highlight Stock separately */}
                            {departments.map(d => (
                                <option key={d.id} value={d.id}>
                                    {d.name} {d.id === warehouseDept?.id ? '(ผจก.คลัง)' : ''}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">รหัสผ่าน</label>
                        <div className="relative">
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 pl-10"
                                placeholder="••••••"
                            />
                            <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoggingIn}
                        className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2"
                    >
                        {isLoggingIn ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" /> กำลังตรวจสอบ...
                            </>
                        ) : (
                            <>
                                เข้าสู่ระบบ <ArrowRight className="w-5 h-5" />
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-6 pt-6 border-t text-center">
                    <p className="text-sm text-gray-500 mb-4">หรือ</p>
                    <a href="/" className="text-blue-500 hover:underline text-sm font-medium">← กลับไปหน้าฟอร์มขอรถ</a>
                </div>
            </div>
        </div>
    )
}

