"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Crown, Calendar, CreditCard, User, Mail, Activity } from 'lucide-react'
import { getProUsers, type ProUser } from '@/lib/admin-stats'

export function AdminProUsers() {
    const [proUsers, setProUsers] = useState<ProUser[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadProUsers()
    }, [])

    const loadProUsers = async () => {
        try {
            setLoading(true)
            const users = await getProUsers()
            setProUsers(users)
        } catch (error) {
            console.error('Error cargando usuarios PRO:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Cargando usuarios PRO...</p>
                </div>
            </div>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Crown className="h-5 w-5 text-yellow-500" />
                    Usuarios PRO
                </CardTitle>
                <CardDescription>
                    Listado de usuarios con suscripción activa o reciente
                </CardDescription>
            </CardHeader>
            <CardContent>
                {proUsers.length === 0 ? (
                    <div className="text-center py-8">
                        <Crown className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">
                            No hay usuarios PRO registrados.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="border-b border-border">
                                    <th className="text-left py-3 px-4 font-semibold text-sm">Usuario</th>
                                    <th className="text-left py-3 px-4 font-semibold text-sm">Email</th>
                                    <th className="text-center py-3 px-4 font-semibold text-sm">Estado</th>
                                    <th className="text-center py-3 px-4 font-semibold text-sm">Vencimiento</th>
                                    <th className="text-center py-3 px-4 font-semibold text-sm">Registro</th>
                                    <th className="text-center py-3 px-4 font-semibold text-sm">Última Actividad</th>
                                    <th className="text-right py-3 px-4 font-semibold text-sm">Stripe ID</th>
                                </tr>
                            </thead>
                            <tbody>
                                {proUsers.map((user) => (
                                    <tr key={user.id} className="border-b border-border hover:bg-muted/50">
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-2">
                                                <User className="h-4 w-4 text-muted-foreground" />
                                                <span className="font-medium">{user.full_name}</span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-2">
                                                <Mail className="h-3 w-3 text-muted-foreground" />
                                                <span className="text-sm text-muted-foreground">{user.email}</span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            <Badge
                                                variant={user.subscription_status === 'active' ? 'default' : 'secondary'}
                                                className={user.subscription_status === 'active' ? 'bg-green-500 hover:bg-green-600' : ''}
                                            >
                                                {user.subscription_status}
                                            </Badge>
                                        </td>
                                        <td className="py-3 px-4 text-center text-sm">
                                            <div className="flex items-center justify-center gap-1">
                                                <Calendar className="h-3 w-3 text-muted-foreground" />
                                                {user.subscription_end_date
                                                    ? new Date(user.subscription_end_date).toLocaleDateString('es-MX')
                                                    : '-'}
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-center text-sm">
                                            {new Date(user.created_at).toLocaleDateString('es-MX')}
                                        </td>
                                        <td className="py-3 px-4 text-center text-sm">
                                            <div className="flex items-center justify-center gap-1">
                                                <Activity className="h-3 w-3 text-muted-foreground" />
                                                {user.last_active
                                                    ? new Date(user.last_active).toLocaleDateString('es-MX')
                                                    : '-'}
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            {user.stripe_customer_id && (
                                                <div className="flex items-center justify-end gap-1" title={user.stripe_customer_id}>
                                                    <CreditCard className="h-3 w-3 text-muted-foreground" />
                                                    <span className="text-xs font-mono text-muted-foreground">
                                                        {user.stripe_customer_id.substring(0, 8)}...
                                                    </span>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
