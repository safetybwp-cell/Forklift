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
    const [warehouseEmail, setWarehouseEmail] = useState('')
    const [warehouseId, setWarehouseId] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isSavingWh, setIsSavingWh] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editForm, setEditForm] = useState({ name: '', manager_email: '' })

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

            // Find Warehouse department to pre-fill the special config section
            const wh = data.find(d => d.name.toLowerCase().includes('warehouse') || d.name === 'คลังสินค้า')
            if (wh) {
                setWarehouseEmail(wh.manager_email)
                setWarehouseId(wh.id)
            }
        }
        setLoading(false)
    }

    const handleSaveWarehouse = async () => {
        setIsSavingWh(true)
        if (warehouseId) {
            // Update existing
            const { error } = await supabase.from('departments').update({ manager_email: warehouseEmail }).eq('id', warehouseId)
            if (!error) alert('บันทึก Email ผจก.คลัง เรียบร้อย!')
            else alert('Error: ' + error.message)
        } else {
            // Create new if not exists
            const { error } = await supabase.from('departments').insert({ name: 'Warehouse', manager_email: warehouseEmail })
            if (!error) {
                alert('สร้างแผนก Warehouse และบันทึก Email เรียบร้อย!')
                fetchDepartments()
            }
            else alert('Error: ' + error.message)
        }
        setIsSavingWh(false)
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

    const handleUpdate = async (id: string) => {
        const { error } = await supabase
            .from('departments')
            .update({
                name: editForm.name,
                manager_email: editForm.manager_email
            })
            .eq('id', id)

        if (!error) {
            setEditingId(null)
            fetchDepartments()
        } else {
            alert('แก้ไขไม่สำเร็จ: ' + error.message)
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

    const startEdit = (dept: Department) => {
        setEditingId(dept.id)
        setEditForm({
            name: dept.name,
            manager_email: dept.manager_email
        })
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
                    <h1 className="text-3xl font-bold text-gray-800">🛠️ Admin: จัดการข้อมูลแผนก & Email</h1>
                    <a href="/dashboard" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
                        <ArrowLeft className="w-5 h-5" />
                        กลับ Dashboard
                    </a>
                </div>

                {/* Warehouse Manager Email Config (Special Section) */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl shadow-sm p-6 mb-8">
                    <h2 className="text-xl font-semibold mb-2 text-blue-800 flex items-center gap-2">
                        🏭 Email ผจก.คลังสินค้า (สำหรับอนุมัติ Step 2)
                    </h2>
                    <p className="text-sm text-blue-600 mb-4">
                        ระบุ Email ของผู้จัดการคลังสินค้าที่จะเป็นผู้อนุมัติลำดับที่ 2 ของทุกคำขอ
                        (ระบบจะบันทึกลงในแผนก "Warehouse" โดยอัตโนมัติ)
                    </p>
                    <div className="flex gap-4 items-end">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-blue-800 mb-1">Email ผจก.คลัง</label>
                            <input
                                type="email"
                                value={warehouseEmail}
                                placeholder="warehouse.manager@company.com"
                                className="w-full px-4 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                onChange={(e) => setWarehouseEmail(e.target.value)}
                            />
                        </div>
                        <button
                            onClick={handleSaveWarehouse}
                            disabled={isSavingWh}
                            className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                            {isSavingWh ? 'กำลังบันทึก...' : 'บันทึก'}
                        </button>
                    </div>
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
                                placeholder="เช่น IT"
                            />
                        </div>
                        <div className="flex-1 w-full">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email ผจก.แผนก</label>
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
                    <p className="text-xs text-gray-500 mt-2">* สำหรับ "ผจก.คลัง" ให้แก้ไข Email ของแผนกที่ชื่อ <strong>Warehouse</strong> หรือ <strong>คลังสินค้า</strong></p>
                </div>

                {/* Departments List */}
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-100 border-b">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-gray-600">ชื่อแผนก</th>
                                <th className="px-6 py-4 font-semibold text-gray-600">Email ผจก.แผนก</th>
                                <th className="px-6 py-4 font-semibold text-gray-600 text-right">จัดการ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {departments.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                                        ยังไม่มีข้อมูล
                                    </td>
                                </tr>
                            ) : (
                                departments.map((dept) => (
                                    <tr key={dept.id} className="hover:bg-gray-50">
                                        {editingId === dept.id ? (
                                            <>
                                                <td className="px-6 py-4">
                                                    <input
                                                        className="w-full border rounded px-2 py-1"
                                                        value={editForm.name}
                                                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                                    />
                                                </td>
                                                <td className="px-6 py-4">
                                                    <input
                                                        className="w-full border rounded px-2 py-1"
                                                        value={editForm.manager_email}
                                                        onChange={(e) => setEditForm({ ...editForm, manager_email: e.target.value })}
                                                    />
                                                </td>
                                                <td className="px-6 py-4 text-right flex justify-end gap-2">
                                                    <button onClick={() => handleUpdate(dept.id)} className="text-green-600 font-bold">บันทึก</button>
                                                    <button onClick={() => setEditingId(null)} className="text-gray-500">ยกเลิก</button>
                                                </td>
                                            </>
                                        ) : (
                                            <>
                                                <td className="px-6 py-4 text-gray-800 font-medium">{dept.name}</td>
                                                <td className="px-6 py-4 text-gray-600 font-mono text-sm">{dept.manager_email}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        onClick={() => startEdit(dept)}
                                                        className="text-blue-600 hover:text-blue-800 mr-3"
                                                    >
                                                        แก้ไข
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(dept.id)}
                                                        className="text-red-500 hover:text-red-700"
                                                    >
                                                        <Trash2 className="w-5 h-5 inline" />
                                                    </button>
                                                </td>
                                            </>
                                        )}
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
