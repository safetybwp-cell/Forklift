'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Loader2, Trash2, Plus, ArrowLeft } from 'lucide-react'

type Department = {
    id: string
    name: string
    manager_email: string
}

export default function AdminPage() {
    const [departments, setDepartments] = useState<Department[]>([])
    const [loading, setLoading] = useState(true)
    const [newDept, setNewDept] = useState({ name: '', manager_email: '' })
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        // Security Check
        const isAdmin = sessionStorage.getItem('isAdmin')
        if (!isAdmin) {
            alert('กรุณาเข้าสู่ระบบผ่านหน้า Dashboard')
            window.location.href = '/dashboard'
            return
        }

        fetchDepartments()
    }, [])

    const fetchDepartments = async () => {
        const { data, error } = await supabase
            .from('departments')
            .select('*')
            .order('name', { ascending: true })

        if (!error && data) {
            setDepartments(data)
        }
        setLoading(false)
    }

    const handleDelete = async (id: string) => {
        if (!confirm('ยืนยันการลบแผนกนี้?')) return

        const { error } = await supabase
            .from('departments')
            .delete()
            .eq('id', id)

        if (!error) {
            fetchDepartments()
        } else {
            alert('ลบไม่สำเร็จ: ' + error.message)
        }
    }

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)

        const { error } = await supabase
            .from('departments')
            .insert({
                name: newDept.name,
                manager_email: newDept.manager_email
            })

        setIsSubmitting(false)

        if (!error) {
            setNewDept({ name: '', manager_email: '' })
            fetchDepartments()
        } else {
            alert('เพิ่มไม่สำเร็จ: ' + error.message)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-gray-500" />
            </div>
        )
    }

    return (
        <div className="min-h-screen p-6 bg-gray-50">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">🛠️ Admin: จัดการแผนก</h1>
                    <a href="/dashboard" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
                        <ArrowLeft className="w-5 h-5" />
                        กลับ Dashboard
                    </a>
                </div>

                {/* Add New Department Card */}
                <div className="bg-white rounded-xl shadow-md p-6 mb-8">
                    <h2 className="text-xl font-semibold mb-4 text-gray-700 flex items-center gap-2">
                        <Plus className="w-5 h-5" /> เพิ่มแผนกใหม่
                    </h2>
                    <form onSubmit={handleAdd} className="flex flex-col md:flex-row gap-4 items-end">
                        <div className="flex-1 w-full">
                            <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อแผนก</label>
                            <input
                                type="text"
                                required
                                value={newDept.name}
                                onChange={(e) => setNewDept({ ...newDept, name: e.target.value })}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                                placeholder="เช่น IT, HR"
                            />
                        </div>
                        <div className="flex-1 w-full">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email หัวหน้าแผนก (รับ Alert)</label>
                            <input
                                type="email"
                                required
                                value={newDept.manager_email}
                                onChange={(e) => setNewDept({ ...newDept, manager_email: e.target.value })}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                                placeholder="manager@company.com"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full md:w-auto px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                        >
                            {isSubmitting ? '...' : 'เพิ่ม'}
                        </button>
                    </form>
                </div>

                {/* Departments List */}
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-100 border-b">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-gray-600">ชื่อแผนก</th>
                                <th className="px-6 py-4 font-semibold text-gray-600">Email หัวหน้า</th>
                                <th className="px-6 py-4 font-semibold text-gray-600 text-right">จัดการ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {departments.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                                        ยังไม่มีข้อมูล (กรุณารัน SQL เพื่อเพิ่มข้อมูลเริ่มต้น หรือกดเพิ่มเอง)
                                    </td>
                                </tr>
                            ) : (
                                departments.map((dept) => (
                                    <tr key={dept.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 text-gray-800 font-medium">{dept.name}</td>
                                        <td className="px-6 py-4 text-gray-600 font-mono text-sm">{dept.manager_email}</td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleDelete(dept.id)}
                                                className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50 transition"
                                                title="ลบ"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
