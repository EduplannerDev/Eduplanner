"use client"

import { useState } from "react"
import { Bell, Check, CheckCheck, Info, AlertTriangle, AlertCircle, X, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { useInAppNotifications, AppNotification } from "@/hooks/use-in-app-notifications"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

export interface NotificationsPopoverProps {
    onNavigate?: (section: string, params?: Record<string, string>) => void
}

export function NotificationsPopover({ onNavigate }: NotificationsPopoverProps) {
    const [open, setOpen] = useState(false)
    const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification, deleteAllRead } = useInAppNotifications()
    const router = useRouter()

    const getIcon = (type: AppNotification['type']) => {
        switch (type) {
            case 'success': return <Check className="h-4 w-4 text-green-500" />
            case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />
            case 'error': return <AlertCircle className="h-4 w-4 text-red-500" />
            case 'action_required': return <Bell className="h-4 w-4 text-blue-500" />
            default: return <Info className="h-4 w-4 text-gray-500" />
        }
    }

    const handleNotificationClick = (notification: AppNotification) => {
        if (!notification.read) {
            markAsRead(notification.id)
        }

        if (notification.link) {
            setOpen(false)

            // Intentar navegación interna por estado si es un link relativo a la app
            if (onNavigate && (notification.link.startsWith('/?') || notification.link.startsWith('/dashboard?') || notification.link.startsWith('/'))) {
                try {
                    // Normalizar link para parsing
                    const urlStr = notification.link.startsWith('http') ? notification.link : `http://dummy.com${notification.link.startsWith('/') ? '' : '/'}${notification.link}`
                    const url = new URL(urlStr)
                    const section = url.searchParams.get('section')

                    if (section) {
                        const params: Record<string, string> = {}
                        url.searchParams.forEach((value, key) => {
                            if (key !== 'section') params[key] = value
                        })
                        onNavigate(section, params)
                        return // Navegación exitosa via estado
                    }
                } catch (e) {
                    console.error("Error parsing link for internal navigation", e)
                }
            }

            // Fallback a navegación normal
            router.push(notification.link)
        }
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-10 w-10">
                    <Bell className="h-6 w-6 text-gray-600 dark:text-gray-300" />
                    {unreadCount > 0 && (
                        <span className="absolute top-2 right-2 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600 border-2 border-background" />
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
                <div className="flex items-center justify-between p-4 border-b">
                    <h4 className="font-semibold text-sm">Notificaciones</h4>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto px-2 text-xs text-muted-foreground hover:text-primary"
                            onClick={() => markAllAsRead()}
                        >
                            <CheckCheck className="mr-1 h-3 w-3" />
                            Marcar leídas
                        </Button>
                    )}
                    {notifications.some(n => n.read) && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto px-2 text-xs text-muted-foreground hover:text-destructive"
                            onClick={() => deleteAllRead()}
                        >
                            <Trash2 className="mr-1 h-3 w-3" />
                            Limpiar leídas
                        </Button>
                    )}
                </div>
                <ScrollArea className="h-[300px]">
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
                            <Bell className="h-8 w-8 mb-2 opacity-20" />
                            <p className="text-sm">No tienes notificaciones</p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={cn(
                                        "p-4 cursor-pointer hover:bg-muted/50 transition-colors relative group",
                                        !notification.read && "bg-blue-50/50 dark:bg-blue-900/10"
                                    )}
                                    onClick={() => handleNotificationClick(notification)}
                                >
                                    <div className="flex gap-3 items-start">
                                        <div className="mt-1 flex-shrink-0">
                                            {getIcon(notification.type)}
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <p className={cn("text-sm font-medium leading-none", !notification.read && "text-blue-700 dark:text-blue-300")}>
                                                {notification.title}
                                            </p>
                                            <p className="text-xs text-muted-foreground line-clamp-2">
                                                {notification.message}
                                            </p>
                                            <p className="text-[10px] text-muted-foreground pt-1">
                                                {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: es })}
                                            </p>
                                        </div>
                                        {!notification.read && (
                                            <div className="flex-shrink-0 self-center">
                                                <div className="h-2 w-2 rounded-full bg-blue-600" />
                                            </div>
                                        )}
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity absolute right-2 top-2"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            deleteNotification(notification.id)
                                        }}
                                    >
                                        <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </PopoverContent>
        </Popover >
    )
}
