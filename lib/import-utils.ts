import * as XLSX from 'xlsx';
import { CreateAlumnoData } from './alumnos';

export interface ParseResult {
    success: boolean;
    data: CreateAlumnoData[];
    errors: string[];
    warnings: string[];
}

// Mapa de cabeceras aceptadas a claves del objeto
const COLUMN_MAPPING: Record<string, keyof CreateAlumnoData> = {
    'nombre completo': 'nombre_completo',
    'nombre': 'nombre_completo',
    'alumno': 'nombre_completo',
    'numero de lista': 'numero_lista',
    'no. lista': 'numero_lista',
    'lista': 'numero_lista',
    '#': 'numero_lista',
    'notas': 'notas_generales',
    'notas generales': 'notas_generales',
    'observaciones': 'notas_generales',
    'nombre padre': 'nombre_padre',
    'padre': 'nombre_padre',
    'correo padre': 'correo_padre',
    'email padre': 'correo_padre',
    'telefono padre': 'telefono_padre',
    'celular padre': 'telefono_padre',
    'nombre madre': 'nombre_madre',
    'madre': 'nombre_madre',
    'correo madre': 'correo_madre',
    'email madre': 'correo_madre',
    'telefono madre': 'telefono_madre',
    'celular madre': 'telefono_madre',
    'foto': 'foto_url'
};

export const parseAlumnosFile = async (file: File, grupoId: string): Promise<ParseResult> => {
    return new Promise((resolve) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'binary' });

                // Asumimos que la primera hoja es la que contiene los datos
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];

                // Convertir a JSON crudo (array de arrays) para procesar cabeceras manualmente de forma flexible
                const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

                if (!jsonData || jsonData.length === 0) {
                    resolve({ success: false, data: [], errors: ['El archivo está vacío'], warnings: [] });
                    return;
                }

                const headers = (jsonData[0] as string[]).map(h => h?.toString().toLowerCase().trim());
                const rows = jsonData.slice(1);

                const parsedAlumnos: CreateAlumnoData[] = [];
                const errors: string[] = [];
                const warnings: string[] = [];

                // Identificar índices de columnas
                const columnIndices: Record<string, number> = {};
                Object.keys(COLUMN_MAPPING).forEach(key => {
                    const index = headers.findIndex(h => h === key);
                    if (index !== -1) {
                        columnIndices[COLUMN_MAPPING[key]] = index;
                    }
                });

                if (columnIndices['nombre_completo'] === undefined) {
                    resolve({
                        success: false,
                        data: [],
                        errors: ['No se encontró la columna "Nombre Completo" o similar.'],
                        warnings: []
                    });
                    return;
                }

                if (columnIndices['numero_lista'] === undefined) {
                    resolve({
                        success: false,
                        data: [],
                        errors: ['No se encontró la columna "Numero de Lista" o similar.'],
                        warnings: []
                    });
                    return;
                }

                rows.forEach((row: any, index) => {
                    // Ignorar filas vacías
                    if (!row || row.length === 0) return;

                    const nombreCompleto = row[columnIndices['nombre_completo']]?.toString().trim();

                    if (!nombreCompleto) {
                        // Si no tiene nombre, ignoramos la fila o lanzamos advertencia
                        // Optamos por ignorar si parece fila vacía, pero si tiene otros datos advertimos
                        const hasData = row.some((cell: any) => cell && cell.toString().trim() !== '');
                        if (hasData) {
                            warnings.push(`Fila ${index + 2}: Ignorada por falta de nombre.`);
                        }
                        return;
                    }

                    const alumno: CreateAlumnoData = {
                        grupo_id: grupoId,
                        nombre_completo: nombreCompleto,
                    };

                    // Mapear campos obligatorios
                    const numeroListaVal = row[columnIndices['numero_lista']];
                    if (!numeroListaVal || isNaN(parseInt(numeroListaVal))) {
                        warnings.push(`Fila ${index + 2}: Ignorada por falta de número de lista válido.`);
                        return;
                    }
                    alumno.numero_lista = parseInt(numeroListaVal);

                    if (columnIndices['notas_generales'] !== undefined) alumno.notas_generales = row[columnIndices['notas_generales']]?.toString().trim();
                    if (columnIndices['nombre_padre'] !== undefined) alumno.nombre_padre = row[columnIndices['nombre_padre']]?.toString().trim();
                    if (columnIndices['correo_padre'] !== undefined) alumno.correo_padre = row[columnIndices['correo_padre']]?.toString().trim();
                    if (columnIndices['telefono_padre'] !== undefined) alumno.telefono_padre = row[columnIndices['telefono_padre']]?.toString().trim();
                    if (columnIndices['nombre_madre'] !== undefined) alumno.nombre_madre = row[columnIndices['nombre_madre']]?.toString().trim();
                    if (columnIndices['correo_madre'] !== undefined) alumno.correo_madre = row[columnIndices['correo_madre']]?.toString().trim();
                    if (columnIndices['telefono_madre'] !== undefined) alumno.telefono_madre = row[columnIndices['telefono_madre']]?.toString().trim();
                    // if (columnIndices['foto_url'] !== undefined) alumno.foto_url = row[columnIndices['foto_url']]?.toString().trim();

                    parsedAlumnos.push(alumno);
                });

                resolve({
                    success: true,
                    data: parsedAlumnos,
                    errors,
                    warnings
                });

            } catch (error) {
                console.error("Error parsing file:", error);
                resolve({ success: false, data: [], errors: ['Error al leer el archivo. Asegúrate de que sea un Excel válido.'], warnings: [] });
            }
        };

        reader.onerror = () => {
            resolve({ success: false, data: [], errors: ['Error al leer el archivo.'], warnings: [] });
        };

        reader.readAsBinaryString(file);
    });
};

export const generateTemplate = () => {
    const headers = [
        'Numero de Lista',
        'Nombre Completo',
        'Nombre Padre',
        'Correo Padre',
        'Telefono Padre',
        'Nombre Madre',
        'Correo Madre',
        'Telefono Madre',
        'Notas Generales'
    ];

    const ws = XLSX.utils.aoa_to_sheet([headers]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Plantilla Alumnos");

    return XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
};
