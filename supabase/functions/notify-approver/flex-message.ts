export const createApprovalFlexMessage = (request: any, approverName: string) => {
    return {
        type: "flex",
        altText: "มีคำขอใช้รถ Forklift ใหม่",
        contents: {
            type: "bubble",
            header: {
                type: "box",
                layout: "vertical",
                contents: [
                    {
                        type: "text",
                        text: "คำขอใช้รถ Forklift",
                        weight: "bold",
                        color: "#1DB446",
                        size: "sm"
                    },
                    {
                        type: "text",
                        text: "รอการอนุมัติ",
                        weight: "bold",
                        size: "xl",
                        margin: "md"
                    }
                ]
            },
            hero: request.vehicle_image_url ? {
                type: "image",
                url: request.vehicle_image_url,
                size: "full",
                aspectRatio: "20:13",
                aspectMode: "cover"
            } : undefined,
            body: {
                type: "box",
                layout: "vertical",
                contents: [
                    {
                        type: "box",
                        layout: "vertical",
                        margin: "lg",
                        spacing: "sm",
                        contents: [
                            {
                                type: "box",
                                layout: "baseline",
                                spacing: "sm",
                                contents: [
                                    {
                                        type: "text",
                                        text: "ผู้ขอ",
                                        color: "#aaaaaa",
                                        size: "sm",
                                        flex: 2
                                    },
                                    {
                                        type: "text",
                                        text: request.requester_name,
                                        wrap: true,
                                        color: "#666666",
                                        size: "sm",
                                        flex: 5
                                    }
                                ]
                            },
                            {
                                type: "box",
                                layout: "baseline",
                                spacing: "sm",
                                contents: [
                                    {
                                        type: "text",
                                        text: "แผนก",
                                        color: "#aaaaaa",
                                        size: "sm",
                                        flex: 2
                                    },
                                    {
                                        type: "text",
                                        text: request.department,
                                        wrap: true,
                                        color: "#666666",
                                        size: "sm",
                                        flex: 5
                                    }
                                ]
                            },
                            {
                                type: "box",
                                layout: "baseline",
                                spacing: "sm",
                                contents: [
                                    {
                                        type: "text",
                                        text: "เหตุผล",
                                        color: "#aaaaaa",
                                        size: "sm",
                                        flex: 2
                                    },
                                    {
                                        type: "text",
                                        text: request.objective,
                                        wrap: true,
                                        color: "#666666",
                                        size: "sm",
                                        flex: 5
                                    }
                                ]
                            },
                            {
                                type: "box",
                                layout: "baseline",
                                spacing: "sm",
                                contents: [
                                    {
                                        type: "text",
                                        text: "เวลา",
                                        color: "#aaaaaa",
                                        size: "sm",
                                        flex: 2
                                    },
                                    {
                                        type: "text",
                                        text: `${new Date(request.start_time).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} - ${new Date(request.end_time).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}`,
                                        wrap: true,
                                        color: "#666666",
                                        size: "sm",
                                        flex: 5
                                    }
                                ]
                            }
                        ]
                    }
                ]
            },
            footer: {
                type: "box",
                layout: "vertical",
                spacing: "sm",
                contents: [
                    {
                        type: "button",
                        style: "primary",
                        height: "sm",
                        action: {
                            type: "uri",
                            label: "อนุมัติ (Approve)",
                            uri: `${Deno.env.get("SUPABASE_URL")}/functions/v1/handle-approval?requestId=${request.id}&action=approve`
                        },
                        color: "#1DB446"
                    },
                    {
                        type: "button",
                        style: "secondary",
                        height: "sm",
                        action: {
                            type: "uri",
                            label: "ปฏิเสธ (Reject)",
                            uri: `${Deno.env.get("SUPABASE_URL")}/functions/v1/handle-approval?requestId=${request.id}&action=reject`
                        },
                        color: "#E53935"
                    }
                ],
                flex: 0
            }
        }
    };
};
