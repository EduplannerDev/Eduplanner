"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    FileText,
    Search,
    Download,
    ArrowUpDown,
    BookOpen,
    User
} from 'lucide-react'
import { getUserReports, type UserReport } from '@/lib/admin-stats'
import * as XLSX from 'xlsx'

export function AdminReports() {
    const [reports, setReports] = useState<UserReport[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [roleFilter, setRoleFilter] = useState('all')
    const [sortConfig, setSortConfig] = useState<{ key: keyof UserReport; direction: 'asc' | 'desc' } | null>(null)

    useEffect(() => {
        loadReports()
    }, [])

    const loadReports = async () => {
        try {
            setLoading(true)
            const data = await getUserReports()
            setReports(data)
        } catch (error) {
            console.error('Error loading reports:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSort = (key: keyof UserReport) => {
        let direction: 'asc' | 'desc' = 'asc'
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc'
        }
        setSortConfig({ key, direction })
    }

    const filteredReports = reports
        .filter(report => {
            const matchesSearch =
                report.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                report.email.toLowerCase().includes(searchTerm.toLowerCase())
            const matchesRole = roleFilter === 'all' || report.role === roleFilter
            return matchesSearch && matchesRole
        })
        .sort((a, b) => {
            if (!sortConfig) return 0
            const aValue = a[sortConfig.key]
            const bValue = b[sortConfig.key]

            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
            return 0
        })

    const exportToExcel = () => {
        const worksheet = XLSX.utils.json_to_sheet(filteredReports.map(r => ({
            Nombre: r.full_name,
            Email: r.email,
            Rol: r.role,
            'Total Planeaciones': r.total_planeaciones,
            'Total Exámenes': r.total_examenes,
            'Última Actividad': new Date(r.last_active).toLocaleDateString('es-MX')
        })))
        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, worksheet, "Reporte de Usuarios")
        XLSX.writeFile(workbook, "reporte_usuarios_eduplanner.xlsx")
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Cargando reportes...</p>
                </div>
            </div>
        )
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Reportes de Actividad
                        </CardTitle>
                        <CardDescription>
                            Desglose de actividad por usuario (planeaciones y exámenes)
                        </CardDescription>
                    </div>
                    <Button onClick={exportToExcel} variant="outline" className="flex gap-2">
                        <Download className="h-4 w-4" />
                        Exportar Excel
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex gap-4 mb-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar por nombre o email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-8"
                        />
                    </div>
                    <Select value={roleFilter} onValueChange={setRoleFilter}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Filtrar por rol" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos los roles</SelectItem>
                            <SelectItem value="profesor">Profesor</SelectItem>
                            <SelectItem value="director">Director</SelectItem>
                            <SelectItem value="administrador">Administrador</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[250px]">
                                    <Button variant="ghost" onClick={() => handleSort('full_name')} className="flex items-center gap-1 p-0 h-auto font-semibold">
                                        Usuario
                                        <ArrowUpDown className="h-3 w-3" />
                                    </Button>
                                </TableHead>
                                <TableHead>
                                    <Button variant="ghost" onClick={() => handleSort('role')} className="flex items-center gap-1 p-0 h-auto font-semibold">
                                        Rol
                                        <ArrowUpDown className="h-3 w-3" />
                                    </Button>
                                </TableHead>
                                <TableHead className="text-center">
                                    <Button variant="ghost" onClick={() => handleSort('total_planeaciones')} className="flex items-center gap-1 p-0 h-auto font-semibold mx-auto">
                                        <BookOpen className="h-3 w-3 mr-1" />
                                        Planeaciones
                                        <ArrowUpDown className="h-3 w-3" />
                                    </Button>
                                </TableHead>
                                <TableHead className="text-center">
                                    <Button variant="ghost" onClick={() => handleSort('total_examenes')} className="flex items-center gap-1 p-0 h-auto font-semibold mx-auto">
                                        <FileText className="h-3 w-3 mr-1" />
                                        Exámenes
                                        <ArrowUpDown className="h-3 w-3" />
                                    </Button>
                                </TableHead>
                                <TableHead className="text-right">
                                    <Button variant="ghost" onClick={() => handleSort('last_active')} className="flex items-center gap-1 p-0 h-auto font-semibold ml-auto">
                                        Última Actividad
                                        <ArrowUpDown className="h-3 w-3" />
                                    </Button>
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredReports.map((report) => (
                                <TableRow key={report.id}>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium">{report.full_name}</span>
                                            <span className="text-xs text-muted-foreground">{report.email}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={
                                            report.role === 'administrador' ? 'destructive' :
                                                report.role === 'director' ? 'default' : 'secondary'
                                        }>
                                            {report.role}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-center font-medium">
                                        {report.total_planeaciones}
                                    </TableCell>
                                    <TableCell className="text-center font-medium">
                                        {report.total_examenes}
                                    </TableCell>
                                    <TableCell className="text-right text-sm text-muted-foreground">
                                        {new Date(report.last_active).toLocaleDateString('es-MX', {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric'
                                        })}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {filteredReports.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">
                                        No se encontraron resultados.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
                <div className="mt-4 text-sm text-muted-foreground text-right">
                    Total de usuarios: {filteredReports.length}
                </div>
            </CardContent>
        </Card>
    )
}
