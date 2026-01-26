
import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        // Note: In a production environment, you should verify the user's session and role here.
        // For now, we will assume the route is protected by middleware or the component checks role visually.
        // Ideally: const supabaseAuth = createClient(); const {data: {user}} = await supabaseAuth.auth.getUser(); 
        // And check if user.role is admin/director.

        // Using Service Role to bypass RLS and fetch all data
        const supabase = createServiceClient();

        // 1. Fetch logs
        const { data: logs, error: logsError } = await supabase
            .from('help_chat_logs')
            .select('*')
            .order('created_at', { ascending: false });

        if (logsError) {
            console.error("Error fetching logs table:", logsError);
            return NextResponse.json({ error: logsError.message }, { status: 500 });
        }

        if (!logs || logs.length === 0) {
            return NextResponse.json([]);
        }

        // 2. Fetch profiles manually
        const userIds = [...new Set(logs.map((log: any) => log.user_id).filter(Boolean))];
        let profilesMap = new Map();

        if (userIds.length > 0) {
            const { data: profiles, error: profilesError } = await supabase
                .from('profiles')
                .select('id, full_name, email')
                .in('id', userIds);

            if (!profilesError && profiles) {
                profilesMap = new Map(profiles.map(p => [p.id, p]));
            }
        }

        // 3. Format response
        const formattedLogs = logs.map((log: any) => {
            const profile = profilesMap.get(log.user_id);
            return {
                id: log.id,
                user_id: log.user_id,
                user_name: profile?.full_name || 'Usuario',
                user_email: profile?.email || 'N/A',
                question: log.question,
                answer: log.answer,
                created_at: log.created_at,
                metadata: log.metadata
            };
        });

        return NextResponse.json(formattedLogs);
    } catch (error) {
        console.error("Critical error in /api/admin/chat-logs:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const logId = searchParams.get('id');

        if (!logId) {
            return NextResponse.json({ error: "ID is required" }, { status: 400 });
        }

        const supabase = createServiceClient();

        const { error } = await supabase
            .from('help_chat_logs')
            .delete()
            .eq('id', logId);

        if (error) {
            console.error("Error deleting chat log:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Critical error in DELETE /api/admin/chat-logs:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
