import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './use-auth'

export interface AppNotification {
    id: string
    title: string
    message: string
    type: 'info' | 'success' | 'warning' | 'error' | 'action_required'
    link?: string
    read: boolean
    created_at: string
}

export function useInAppNotifications() {
    const { user } = useAuth()
    const [notifications, setNotifications] = useState<AppNotification[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [loading, setLoading] = useState(true)

    const fetchNotifications = useCallback(async () => {
        if (!user) return

        try {
            const { data, error } = await supabase
                .from('app_notifications')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(20) // Limit to last 20 for performance

            if (error) {
                console.error('Error fetching notifications:', error)
                return
            }

            setNotifications(data || [])
            setUnreadCount((data || []).filter(n => !n.read).length)
        } finally {
            setLoading(false)
        }
    }, [user])

    // Subscribe to changes
    useEffect(() => {
        if (!user) return

        fetchNotifications()

        const channel = supabase
            .channel('app_notifications_changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'app_notifications',
                    filter: `user_id=eq.${user.id}`,
                },
                () => {
                    fetchNotifications()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [user, fetchNotifications])

    const markAsRead = async (notificationId: string) => {
        try {
            // Optimistic update
            setNotifications(prev =>
                prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
            )
            setUnreadCount(prev => Math.max(0, prev - 1))

            const { error } = await supabase
                .from('app_notifications')
                .update({ read: true, updated_at: new Date().toISOString() })
                .eq('id', notificationId)

            if (error) throw error
        } catch (error) {
            console.error('Error marking notification as read:', error)
            fetchNotifications() // Revert on error
        }
    }

    const markAllAsRead = async () => {
        try {
            // Optimistic update
            setNotifications(prev => prev.map(n => ({ ...n, read: true })))
            setUnreadCount(0)

            const { error } = await supabase
                .from('app_notifications')
                .update({ read: true, updated_at: new Date().toISOString() })
                .eq('user_id', user!.id)
                .eq('read', false)

            if (error) throw error
        } catch (error) {
            console.error('Error marking all as read:', error)
            fetchNotifications() // Revert on error
        }
    }

    return {
        notifications,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead,
        refresh: fetchNotifications
    }
}
