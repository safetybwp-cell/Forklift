
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// EmailJS Configuration
const EMAILJS_SERVICE_ID = "service_nosm7gr";
const EMAILJS_PUBLIC_KEY = "Q7ihBzmKWUYOHHmL2";
const EMAILJS_TEMPLATE_REQUEST = "template_nxjk9hg"; // For Department/Warehouse Managers
const EMAILJS_TEMPLATE_APPROVAL = "template_5w71ck9"; // For final approval to requester

serve(async (req) => {
    try {
        const supabaseClient = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        const payload = await req.json();
        console.log("Webhook Payload:", JSON.stringify(payload));

        const { type, record, old_record } = payload;
        const requestData = record;

        let emailParams: any = {};
        let templateId = "";
        let recipientEmail = "";

        // Logic: Determine who to notify (3-step workflow with EmailJS)
        if (type === "INSERT" && record.status === "pending") {
            // Step 1: New request -> Notify Department Manager
            const { data: dept } = await supabaseClient
                .from("departments")
                .select("manager_email")
                .eq("name", requestData.department)
                .single();

            if (!dept || !dept.manager_email) {
                throw new Error(`No manager email found for department: ${requestData.department}`);
            }

            recipientEmail = dept.manager_email;
            templateId = EMAILJS_TEMPLATE_REQUEST;
            emailParams = {
                to_email: recipientEmail,
                to_name: "Department Manager",
                requester_name: requestData.requester_name,
                department: requestData.department,
                objective: requestData.objective,
                start_time: new Date(requestData.start_time).toLocaleString('th-TH'),
                end_time: new Date(requestData.end_time).toLocaleString('th-TH'),
                status: "รอผู้จัดการแผนกอนุมัติ",
                link: `${Deno.env.get("SUPABASE_URL")}/functions/v1/handle-approval?requestId=${requestData.id}`,
                approve_link: `${Deno.env.get("SUPABASE_URL")}/functions/v1/handle-approval?requestId=${requestData.id}&action=approve`,
                reject_link: `${Deno.env.get("SUPABASE_URL")}/functions/v1/handle-approval?requestId=${requestData.id}&action=reject`,
            };

        } else if (type === "UPDATE" && record.status === "dept_manager_approved" && old_record.status === "pending") {
            // Step 2: Dept Manager approved -> Notify Warehouse Manager
            // (Warehouse Manager email is stored as the manager_email of the "Warehouse" department)
            const { data: dept } = await supabaseClient
                .from("departments")
                .select("manager_email")
                .or('name.ilike.%Warehouse%,name.eq.คลังสินค้า')
                .limit(1)
                .single();

            if (!dept || !dept.manager_email) {
                // Fallback hardcoded if not found in DB
                recipientEmail = "wh.mgr@example.com";
                console.warn("Warehouse department not found in DB, using fallback email.");
            } else {
                recipientEmail = dept.manager_email;
            }

            templateId = EMAILJS_TEMPLATE_REQUEST;
            emailParams = {
                to_email: recipientEmail,
                to_name: "Warehouse Manager",
                requester_name: requestData.requester_name,
                department: requestData.department,
                objective: requestData.objective,
                start_time: new Date(requestData.start_time).toLocaleString('th-TH'),
                end_time: new Date(requestData.end_time).toLocaleString('th-TH'),
                status: "ผู้จัดการแผนกอนุมัติแล้ว - รอผู้จัดการคลังอนุมัติ",
                link: `${Deno.env.get("SUPABASE_URL")}/functions/v1/handle-approval?requestId=${requestData.id}`,
                approve_link: `${Deno.env.get("SUPABASE_URL")}/functions/v1/handle-approval?requestId=${requestData.id}&action=approve`,
                reject_link: `${Deno.env.get("SUPABASE_URL")}/functions/v1/handle-approval?requestId=${requestData.id}&action=reject`,
            };

        } else if (type === "UPDATE" && record.status === "warehouse_approved" && old_record.status === "dept_manager_approved") {
            // Step 3: Warehouse Manager approved -> Send Email to Requester
            if (!requestData.requester_email) {
                throw new Error("No requester email found");
            }

            recipientEmail = requestData.requester_email;
            templateId = EMAILJS_TEMPLATE_APPROVAL;
            emailParams = {
                to_email: recipientEmail,
                to_name: requestData.requester_name,
                requester_name: requestData.requester_name,
                department: requestData.department,
                objective: requestData.objective,
                start_time: new Date(requestData.start_time).toLocaleString('th-TH'),
                end_time: new Date(requestData.end_time).toLocaleString('th-TH'),
                status: "อนุมัติครบถ้วน - กรุณาติดต่อแผนกคลังเพื่อรับรถ",
                approver_name: "Warehouse Manager",
            };

        } else {
            // No notification needed
            return new Response("No notification needed", { status: 200 });
        }

        // Send Email using EmailJS API
        const emailJsResponse = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                service_id: EMAILJS_SERVICE_ID,
                template_id: templateId,
                user_id: EMAILJS_PUBLIC_KEY,
                template_params: emailParams,
            }),
        });

        if (!emailJsResponse.ok) {
            const errorText = await emailJsResponse.text();
            console.error("EmailJS API Error:", errorText);
            await supabaseClient.from("error_logs").insert({
                message: "Failed to send email via EmailJS",
                details: { error: errorText, recipient: recipientEmail },
            });
            throw new Error("Failed to send email");
        }

        console.log(`Email sent successfully to: ${recipientEmail}`);
        return new Response(JSON.stringify({
            success: true,
            email_sent: true,
            recipient: recipientEmail
        }), {
            headers: { "Content-Type": "application/json" },
            status: 200,
        });

    } catch (error) {
        console.error("Error:", error.message);
        const supabaseClient = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );
        await supabaseClient.from("error_logs").insert({
            message: "Internal Edge Function Error",
            details: { error: error.message },
        });

        return new Response(JSON.stringify({ error: error.message }), {
            headers: { "Content-Type": "application/json" },
            status: 500,
        });
    }
});
