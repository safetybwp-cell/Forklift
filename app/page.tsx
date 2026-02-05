'use client'

import { useState, useRef, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Camera, Loader2, CheckCircle } from 'lucide-react'

export default function RequestForm() {
    const [formData, setFormData] = useState({
        requesterName: '',
        requesterEmail: '', // New field
        department: '', // Now stores ID or Name? Let's verify requirements. 
        // Plan said: "Send email to specific department manager".
        // So we should pick the selected dept object to get email.
        objective: '',
        startTime: '',
        endTime: '',
    })
    // Store full dept objects
    const [deptList, setDeptList] = useState<{ name: string, manager_email: string }[]>([])

    const [imageFile, setImageFile] = useState<File | null>(null)
    const [imagePreview, setImagePreview] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [success, setSuccess] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // const departments = ['Production', 'Warehouse', 'Logistics', 'Maintenance', 'QC'] // REMOVING HARDCODED

    useEffect(() => {
        const fetchDepts = async () => {
            const { data } = await supabase.from('departments').select('name, manager_email')
            if (data) setDeptList(data)
        }
        fetchDepts()
    }, [])

    const handleImageCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setImageFile(file)
            const reader = new FileReader()
            reader.onloadend = () => {
                setImagePreview(reader.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)

        try {
            let imageUrl = null

            // Upload image if exists
            if (imageFile) {
                const fileName = `${Date.now()}_${imageFile.name}`
                const { data, error } = await supabase.storage
                    .from('vehicle-images')
                    .upload(fileName, imageFile)

                if (error) throw error

                const { data: { publicUrl } } = supabase.storage
                    .from('vehicle-images')
                    .getPublicUrl(fileName)

                imageUrl = publicUrl
            }

            // Get department manager email
            const { data: deptData } = await supabase
                .from('departments')
                .select('manager_email')
                .eq('name', formData.department)
                .single()

            if (!deptData?.manager_email) {
                throw new Error('ไม่พบอีเมลผู้จัดการแผนก กรุณาติดต่อ Admin')
            }

            // Insert request
            const { error } = await supabase.from('requests').insert({
                requester_name: formData.requesterName,
                requester_email: formData.requesterEmail,
                department: formData.department,
                objective: formData.objective,
                start_time: formData.startTime,
                end_time: formData.endTime,
                vehicle_image_url: imageUrl,
            })

            if (error) throw error

            // Send email directly using EmailJS (ส่งจาก Frontend เหมือนตัวอย่าง)
            try {
                await fetch('https://api.emailjs.com/api/v1.0/email/send', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        service_id: 'service_nosm7gr',
                        template_id: 'template_5w71ck9',
                        user_id: 'Q7ihBzmKWUYOHHmL2',
                        template_params: {
                            to_email: deptData.manager_email,
                            to_name: 'ผู้จัดการแผนก',
                            requester_name: formData.requesterName,
                            department: formData.department,
                            objective: formData.objective,
                            start_time: new Date(formData.startTime).toLocaleString('th-TH'),
                            end_time: new Date(formData.endTime).toLocaleString('th-TH'),
                            status: 'รอผู้จัดการแผนกอนุมัติ',
                            approval_link: 'https://forklift-brown.vercel.app/approve.html'
                        }
                    })
                })

                // Confirmation email removed as per user request (only final approval email needed)

                console.log('✅ ส่งอีเมลแจ้งเตือนสำเร็จ (ผจก. + ผู้ขอ)')
            } catch (emailError) {
                console.error('⚠️ ส่งอีเมลไม่สำเร็จ แต่บันทึกข้อมูลสำเร็จแล้ว:', emailError)
                // ไม่ throw error เพราะข้อมูลบันทึกสำเร็จแล้ว
            }

            setSuccess(true)
            setTimeout(() => {
                setFormData({
                    requesterName: '',
                    requesterEmail: '',
                    department: '',
                    objective: '',
                    startTime: '',
                    endTime: '',
                })
                setImageFile(null)
                setImagePreview(null)
                setSuccess(false)
            }, 3000)
        } catch (error: any) {
            alert('เกิดข้อผิดพลาด: ' + error.message)
        } finally {
            setIsSubmitting(false)
        }
    }

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center animate-bounce">
                    <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">ส่งคำขอสำเร็จ!</h2>
                    <p className="text-gray-600">รอการอนุมัติจากหัวหน้า...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full">
                <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
                    🚜 แบบฟอร์มขอใช้รถ Forklift (V2)
                </h1>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Name */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            ชื่อผู้ขอ <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.requesterName}
                            onChange={(e) => setFormData({ ...formData, requesterName: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="กรอกชื่อ-นามสกุล"
                        />
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            อีเมลผู้ขอ (สำหรับรับแจ้งเตือนเมื่ออนุมัติ) <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="email"
                            required
                            value={formData.requesterEmail}
                            onChange={(e) => setFormData({ ...formData, requesterEmail: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="example@company.com"
                        />
                    </div>

                    {/* Department */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            แผนก <span className="text-red-500">*</span>
                        </label>
                        <select
                            required
                            value={formData.department}
                            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        >
                            <option value="">-- เลือกแผนก --</option>
                            {deptList.map((dept) => (
                                <option key={dept.name} value={dept.name}>{dept.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Objective */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            วัตถุประสงค์ <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            required
                            value={formData.objective}
                            onChange={(e) => setFormData({ ...formData, objective: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="ระบุวัตถุประสงค์..."
                            rows={3}
                        />
                    </div>

                    {/* Time */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                เวลาเริ่ม <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="datetime-local"
                                required
                                value={formData.startTime}
                                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                เวลาคืนรถ <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="datetime-local"
                                required
                                value={formData.endTime}
                                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* Image Upload */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            ถ่ายรูปสภาพรถก่อนใช้งาน
                        </label>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={handleImageCapture}
                            className="hidden"
                        />
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full py-3 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg hover:bg-gray-200 transition flex items-center justify-center gap-2"
                        >
                            <Camera className="w-5 h-5" />
                            {imagePreview ? 'เปลี่ยนรูป' : 'ถ่ายรูป / เลือกรูป'}
                        </button>
                        {imagePreview && (
                            <img src={imagePreview} alt="Preview" className="mt-3 rounded-lg w-full h-48 object-cover" />
                        )}
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-4 bg-primary text-white font-bold rounded-lg hover:bg-green-600 transition disabled:bg-gray-400 flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                กำลังส่งคำขอ...
                            </>
                        ) : (
                            '✅ ส่งคำขอ'
                        )}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <a
                        href="/approve.html"
                        className="text-primary hover:underline font-medium inline-block"
                    >
                        🔐 เข้าสู่ระบบอนุมัติคำขอ (สำหรับผู้จัดการ)
                    </a>
                    <span className="mx-3 text-gray-400">|</span>
                    <a
                        href="/admin.html"
                        className="text-purple-600 hover:underline font-medium inline-block"
                    >
                        ⚙️ Admin (จัดการแผนก)
                    </a>
                </div>
            </div>
        </div>
    )
}
