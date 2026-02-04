
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
    const url = new URL(req.url);
    const requestId = url.searchParams.get("requestId");
    const action = url.searchParams.get("action"); // 'approve' or 'reject'

    if (!requestId || !action) {
        return new Response("Missing parameters", { status: 400 });
    }

    const supabaseClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    try {
        // 1. Get current status logic
        const { data: request, error: fetchError } = await supabaseClient
            .from("requests")
            .select("status")
            .eq("id", requestId)
            .single();

        if (fetchError || !request) {
            return new Response("Request not found", { status: 404 });
        }

        let newStatus = request.status;

        if (action === "reject") {
            newStatus = "rejected";
        } else if (action === "approve") {
            if (request.status === "pending") {
                // Department Manager approval
                newStatus = "dept_manager_approved";
            } else if (request.status === "dept_manager_approved") {
                // Warehouse Manager approval (final step)
                newStatus = "warehouse_approved";
            } else {
                return new Response("Request already processed or invalid state", { status: 400 });
            }
        }

        // 2. Update status
        const { error: updateError } = await supabaseClient
            .from("requests")
            .update({ status: newStatus })
            .eq("id", requestId);

        if (updateError) {
            throw updateError;
        }

        // 3. Log the approval action
        const approverRole = request.status === "pending" ? "dept_manager" : "warehouse_manager";
        await supabaseClient.from("approval_logs").insert({
            request_id: requestId,
            approver_role: approverRole,
            action: action,
            old_status: request.status,
            new_status: newStatus,
            remarks: `${action === 'approve' ? 'Approved' : 'Rejected'} via email link`
        });

        // 4. Return nice HTML page
        const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Approval Status</title>
        <style>
          body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; background-color: #f0f2f5; margin: 0; }
          .card { background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center; max-width: 90%; width: 400px; }
          .icon { font-size: 64px; margin-bottom: 20px; }
          .success { color: #1DB446; }
          .error { color: #E53935; }
          h1 { margin: 0 0 10px; color: #333; }
          p { color: #666; margin: 0; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="icon ${action === 'approve' ? 'success' : 'error'}">
            ${action === 'approve' ? '✓' : '✕'}
          </div>
          <h1>${action === 'approve' ? 'อนุมัติเรียบร้อย' : 'ปฏิเสธคำขอ'}</h1>
          <p>ระบบได้บันทึกสถานะของคุณแล้ว</p>
          <p style="margin-top: 10px; font-size: 0.9em; color: #999;">สถานะล่าสุด: ${newStatus}</p>
        </div>
      </body>
      </html>
    `;

        return new Response(html, {
            headers: { "Content-Type": "text/html" },
            status: 200,
        });

    } catch (error) {
        console.error("Error processing approval:", error);
        return new Response(`Error: ${error.message}`, { status: 500 });
    }
});
