
export interface HelpChatLog {
    id: string;
    user_id: string | null;
    user_name: string;
    user_email: string;
    question: string;
    answer: string;
    created_at: string;
    metadata: any;
}

/**
 * Obtiene historial de chats de ayuda
 */
export async function getHelpChatLogs(): Promise<HelpChatLog[]> {
    try {
        const { data: logs, error } = await supabase
            .from('help_chat_logs')
            .select(`
        *,
        profiles:user_id (
          full_name,
          email
        )
      `)
            .order('created_at', { ascending: false });

        if (error) {
            throw error;
        }

        return (logs || []).map((log: any) => ({
            id: log.id,
            user_id: log.user_id,
            user_name: log.profiles?.full_name || 'Anónimo',
            user_email: log.profiles?.email || 'N/A',
            question: log.question,
            answer: log.answer,
            created_at: log.created_at,
            metadata: log.metadata
        }));
    } catch (error) {
        console.error('Error obteniendo logs de chat:', error);
        return [];
    }
}
