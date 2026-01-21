'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Upload, FileDown, AlertTriangle, CheckCircle, XCircle, Loader2, FileSpreadsheet } from 'lucide-react';
import { parseAlumnosFile, generateTemplate } from '@/lib/import-utils';
import { createAlumno, CreateAlumnoData } from '@/lib/alumnos';
import { toast } from '@/hooks/use-toast';

interface ImportAlumnosDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    grupoId: string;
    onSuccess: () => void;
}

export function ImportAlumnosDialog({ open, onOpenChange, grupoId, onSuccess }: ImportAlumnosDialogProps) {
    const [step, setStep] = useState<'upload' | 'preview' | 'importing' | 'result'>('upload');
    const [parsedData, setParsedData] = useState<CreateAlumnoData[]>([]);
    const [warnings, setWarnings] = useState<string[]>([]);
    const [errors, setErrors] = useState<string[]>([]);
    const [importResults, setImportResults] = useState<{ success: number; failures: number; details: string[] }>({ success: 0, failures: 0, details: [] });

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        if (acceptedFiles.length === 0) return;

        const file = acceptedFiles[0];
        const result = await parseAlumnosFile(file, grupoId);

        if (result.success) {
            if (result.data.length === 0) {
                toast({
                    title: "Archivo vacío o inválido",
                    description: "No se encontraron alumnos válidos en el archivo.",
                    variant: "destructive"
                });
                return;
            }
            setParsedData(result.data);
            setWarnings(result.warnings);
            setStep('preview');
        } else {
            toast({
                title: "Error al leer archivo",
                description: result.errors[0] || "Ocurrió un error desconocido",
                variant: "destructive"
            });
        }
    }, [grupoId]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
            'application/vnd.ms-excel': ['.xls'],
            'text/csv': ['.csv']
        },
        maxFiles: 1
    });

    const handleDownloadTemplate = () => {
        const data = generateTemplate();
        const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'plantilla_alumnos.xlsx';
        a.click();
        window.URL.revokeObjectURL(url);
    };

    const handleImport = async () => {
        setStep('importing');
        let successCount = 0;
        let failureCount = 0;
        const details: string[] = [];

        // Process in parallel with a concurrency limit if needed, but sequential is safer for now to avoid hammering the DB
        // Or we can use Promise.all for blocks of requests.
        // Let's go with blocks of 10.

        const batchSize = 10;
        for (let i = 0; i < parsedData.length; i += batchSize) {
            const batch = parsedData.slice(i, i + batchSize);
            await Promise.all(batch.map(async (alumno) => {
                try {
                    await createAlumno(alumno);
                    successCount++;
                } catch (err) {
                    console.error(err);
                    failureCount++;
                    details.push(`Error al importar ${alumno.nombre_completo}`);
                }
            }));
        }

        setImportResults({ success: successCount, failures: failureCount, details });
        setStep('result');
        if (successCount > 0) {
            onSuccess();
        }
    };

    const handleReset = () => {
        setStep('upload');
        setParsedData([]);
        setWarnings([]);
        setErrors([]);
        setImportResults({ success: 0, failures: 0, details: [] });
    };

    const handleClose = () => {
        handleReset();
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Importar Alumnos Masivamente</DialogTitle>
                    <DialogDescription>
                        Sube un archivo Excel o CSV para agregar alumnos rápidamente a este grupo.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto py-4">
                    {step === 'upload' && (
                        <div className="space-y-6">
                            <div
                                {...getRootProps()}
                                className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors
                  ${isDragActive ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500'}
                `}
                            >
                                <input {...getInputProps()} />
                                <div className="flex flex-col items-center gap-4">
                                    <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full">
                                        <Upload className="h-8 w-8 text-gray-500 dark:text-gray-400" />
                                    </div>
                                    <div>
                                        <p className="text-lg font-medium">Arrastra tu archivo aquí o haz clic para seleccionar</p>
                                        <p className="text-sm text-gray-500 mt-1">Soporta .xlsx, .xls y .csv</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col items-center gap-2">
                                <p className="text-sm text-gray-500">¿No tienes el formato correcto?</p>
                                <Button variant="outline" onClick={handleDownloadTemplate} className="flex items-center gap-2">
                                    <FileDown className="h-4 w-4" />
                                    Descargar Plantilla
                                </Button>
                            </div>

                            <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
                                <FileSpreadsheet className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                <AlertTitle className="text-blue-800 dark:text-blue-300">Formato Recomendado</AlertTitle>
                                <AlertDescription className="text-blue-700 dark:text-blue-400">
                                    Asegúrate de que tu archivo tenga las columnas llamadas "Nombre Completo" y "Numero de Lista".
                                    Ambas son obligatorias. Opcionalmente puedes incluir "Correo Padre", "Notas Generales", etc.
                                </AlertDescription>
                            </Alert>
                        </div>
                    )}

                    {step === 'preview' && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-lg">Vista Previa ({parsedData.length} alumnos encontrados)</h3>
                                <Button variant="ghost" size="sm" onClick={handleReset}>Cambiar archivo</Button>
                            </div>

                            {warnings.length > 0 && (
                                <Alert className="bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800">
                                    <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                                    <AlertTitle>Advertencias</AlertTitle>
                                    <AlertDescription className="max-h-20 overflow-y-auto">
                                        <ul className="list-disc pl-4 text-sm">
                                            {warnings.map((w, i) => <li key={i}>{w}</li>)}
                                        </ul>
                                    </AlertDescription>
                                </Alert>
                            )}

                            <div className="border rounded-md">
                                <ScrollArea className="h-[300px]">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-[50px]">#</TableHead>
                                                <TableHead>Nombre</TableHead>
                                                <TableHead>Padre</TableHead>
                                                <TableHead>Madre</TableHead>
                                                <TableHead>Notas</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {parsedData.map((alumno, idx) => (
                                                <TableRow key={idx}>
                                                    <TableCell>{alumno.numero_lista || '-'}</TableCell>
                                                    <TableCell className="font-medium">{alumno.nombre_completo}</TableCell>
                                                    <TableCell className="text-sm text-gray-500">
                                                        {alumno.nombre_padre}
                                                        {alumno.correo_padre && <span className="block text-xs">{alumno.correo_padre}</span>}
                                                    </TableCell>
                                                    <TableCell className="text-sm text-gray-500">
                                                        {alumno.nombre_madre}
                                                        {alumno.correo_madre && <span className="block text-xs">{alumno.correo_madre}</span>}
                                                    </TableCell>
                                                    <TableCell className="text-sm text-gray-500 truncate max-w-[150px]">{alumno.notas_generales}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </ScrollArea>
                            </div>
                        </div>
                    )}

                    {step === 'importing' && (
                        <div className="flex flex-col items-center justify-center py-12 space-y-4">
                            <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
                            <h3 className="text-xl font-semibold">Importando alumnos...</h3>
                            <p className="text-gray-500 text-center">
                                Por favor espera mientras guardamos la información en la base de datos.<br />
                                Esto puede tomar unos momentos.
                            </p>
                        </div>
                    )}

                    {step === 'result' && (
                        <div className="space-y-6 text-center py-6">
                            <div className="flex justify-center">
                                {importResults.failures === 0 ? (
                                    <CheckCircle className="h-16 w-16 text-green-500" />
                                ) : importResults.success === 0 ? (
                                    <XCircle className="h-16 w-16 text-red-500" />
                                ) : (
                                    <AlertTriangle className="h-16 w-16 text-yellow-500" />
                                )}
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-2xl font-bold">
                                    {importResults.failures === 0 ? "¡Importación Exitosa!" : "Importación Completada"}
                                </h3>
                                <p className="text-lg text-gray-600">
                                    Se importaron correctamente <span className="font-bold text-green-600">{importResults.success}</span> alumnos.
                                </p>
                                {importResults.failures > 0 && (
                                    <p className="text-red-600">
                                        Fallaron {importResults.failures} registros.
                                    </p>
                                )}
                            </div>

                            {importResults.details.length > 0 && (
                                <div className="text-left bg-gray-50 p-4 rounded-md border max-h-[200px] overflow-y-auto">
                                    <p className="font-bold mb-2 text-sm text-gray-700">Detalles de errores:</p>
                                    <ul className="list-disc pl-4 text-sm text-red-600 space-y-1">
                                        {importResults.details.map((d, i) => <li key={i}>{d}</li>)}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <DialogFooter>
                    {step === 'upload' && (
                        <Button variant="outline" onClick={handleClose}>Cancelar</Button>
                    )}
                    {step === 'preview' && (
                        <div className="flex gap-2 justify-end w-full">
                            <Button variant="outline" onClick={handleReset}>Atrás</Button>
                            <Button onClick={handleImport}>Importar {parsedData.length} Alumnos</Button>
                        </div>
                    )}
                    {step === 'result' && (
                        <Button onClick={handleClose}>Cerrar</Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
