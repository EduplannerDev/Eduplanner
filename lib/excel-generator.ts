import * as XLSX from 'xlsx';

export interface ResultadoEvaluacion {
  indicador: string;
  cumple: string;
  observaciones: string;
}

export function exportarListaCotejoExcel(
  titulo: string,
  resultados: ResultadoEvaluacion[],
  nombreArchivo?: string
) {
  try {
    // Crear un nuevo libro de trabajo
    const workbook = XLSX.utils.book_new();

    // Preparar los datos para la hoja de cálculo
    const datosHoja = [
      // Encabezados
      ['#', 'Indicador de Logro', 'Sí', 'No', 'Observaciones'],
      // Datos
      ...resultados.map((resultado, index) => [
        index + 1,
        resultado.indicador,
        resultado.cumple === 'Sí' ? '✓' : '',
        resultado.cumple === 'No' ? '✓' : '',
        resultado.observaciones
      ])
    ];

    // Crear la hoja de trabajo
    const worksheet = XLSX.utils.aoa_to_sheet(datosHoja);

    // Configurar el ancho de las columnas
    const columnWidths = [
      { wch: 5 },   // # (número)
      { wch: 45 },  // Indicador de Logro
      { wch: 6 },   // Sí
      { wch: 6 },   // No
      { wch: 30 }   // Observaciones
    ];
    worksheet['!cols'] = columnWidths;

    // Aplicar estilos a los encabezados
    const headerStyle = {
      font: { bold: true, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "8B5CF6" } },
      alignment: { horizontal: "center", vertical: "center" }
    };

    // Aplicar estilos a las celdas de encabezado
    ['A1', 'B1', 'C1', 'D1', 'E1'].forEach(cell => {
      if (worksheet[cell]) {
        worksheet[cell].s = headerStyle;
      }
    });

    // Aplicar estilos a las celdas de datos
    for (let i = 2; i <= resultados.length + 1; i++) {
      // Centrar la columna de números
      if (worksheet[`A${i}`]) {
        worksheet[`A${i}`].s = { alignment: { horizontal: "center" } };
      }
      
      // Centrar y estilizar la columna de "Sí"
      if (worksheet[`C${i}`]) {
        worksheet[`C${i}`].s = { 
          alignment: { horizontal: "center" },
          font: { size: 14, bold: true }
        };
        
        // Aplicar color verde si tiene checkmark
        if (worksheet[`C${i}`].v === '✓') {
          worksheet[`C${i}`].s = {
            ...worksheet[`C${i}`].s,
            fill: { fgColor: { rgb: "D4EDDA" } },
            font: { color: { rgb: "155724" }, size: 14, bold: true }
          };
        }
      }
      
      // Centrar y estilizar la columna de "No"
      if (worksheet[`D${i}`]) {
        worksheet[`D${i}`].s = { 
          alignment: { horizontal: "center" },
          font: { size: 14, bold: true }
        };
        
        // Aplicar color rojo si tiene checkmark
        if (worksheet[`D${i}`].v === '✓') {
          worksheet[`D${i}`].s = {
            ...worksheet[`D${i}`].s,
            fill: { fgColor: { rgb: "F8D7DA" } },
            font: { color: { rgb: "721C24" }, size: 14, bold: true }
          };
        }
      }
    }

    // Agregar la hoja al libro
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Lista de Cotejo');

    // Crear una segunda hoja con resumen
    const totalIndicadores = resultados.length;
    const cumplidos = resultados.filter(r => r.cumple.toLowerCase() === 'sí').length;
    const noCumplidos = resultados.filter(r => r.cumple.toLowerCase() === 'no').length;
    const sinEvaluar = resultados.filter(r => r.cumple.toLowerCase() === 'sin evaluar').length;
    const porcentajeCumplimiento = totalIndicadores > 0 ? ((cumplidos / totalIndicadores) * 100).toFixed(1) : '0';

    const datosResumen = [
      ['RESUMEN DE EVALUACIÓN'],
      [''],
      ['Instrumento:', titulo],
      ['Fecha de evaluación:', new Date().toLocaleDateString('es-ES')],
      [''],
      ['ESTADÍSTICAS'],
      ['Total de indicadores:', totalIndicadores],
      ['Indicadores cumplidos:', cumplidos],
      ['Indicadores no cumplidos:', noCumplidos],
      ['Indicadores sin evaluar:', sinEvaluar],
      ['Porcentaje de cumplimiento:', `${porcentajeCumplimiento}%`],
      [''],
      ['OBSERVACIONES GENERALES'],
      [''],
      ...resultados
        .filter(r => r.observaciones && r.observaciones.trim() !== '')
        .map(r => [`• ${r.indicador}:`, r.observaciones])
    ];

    const worksheetResumen = XLSX.utils.aoa_to_sheet(datosResumen);
    
    // Configurar ancho de columnas para el resumen
    worksheetResumen['!cols'] = [
      { wch: 25 },  // Etiquetas
      { wch: 50 }   // Valores
    ];

    // Aplicar estilos al resumen
    if (worksheetResumen['A1']) {
      worksheetResumen['A1'].s = {
        font: { bold: true, size: 14 },
        alignment: { horizontal: "center" }
      };
    }

    if (worksheetResumen['A6']) {
      worksheetResumen['A6'].s = {
        font: { bold: true },
        fill: { fgColor: { rgb: "E9ECEF" } }
      };
    }

    if (worksheetResumen['A13']) {
      worksheetResumen['A13'].s = {
        font: { bold: true },
        fill: { fgColor: { rgb: "E9ECEF" } }
      };
    }

    XLSX.utils.book_append_sheet(workbook, worksheetResumen, 'Resumen');

    // Generar el nombre del archivo
    const nombreFinal = nombreArchivo || 
      `lista_cotejo_${titulo.replace(/\s+/g, '_').toLowerCase()}_${Date.now()}.xlsx`;

    // Escribir el archivo
    XLSX.writeFile(workbook, nombreFinal);

    return {
      success: true,
      filename: nombreFinal,
      stats: {
        total: totalIndicadores,
        cumplidos,
        noCumplidos,
        sinEvaluar,
        porcentajeCumplimiento: parseFloat(porcentajeCumplimiento)
      }
    };

  } catch (error) {
    console.error('Error generando archivo Excel:', error);
    throw new Error('No se pudo generar el archivo Excel');
  }
}

export function exportarListaCotejoCSV(
  titulo: string,
  resultados: ResultadoEvaluacion[],
  nombreArchivo?: string
) {
  try {
    // Crear el contenido CSV
    const encabezados = ['#', 'Indicador de Logro', 'Cumple', 'Observaciones'];
    const filas = resultados.map((resultado, index) => [
      index + 1,
      `"${resultado.indicador.replace(/"/g, '""')}"`,
      resultado.cumple,
      `"${resultado.observaciones.replace(/"/g, '""')}"`
    ]);

    const contenidoCSV = [
      encabezados.join(','),
      ...filas.map(fila => fila.join(','))
    ].join('\n');

    // Crear y descargar el archivo
    const blob = new Blob(['\ufeff' + contenidoCSV], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    const nombreFinal = nombreArchivo || 
      `lista_cotejo_${titulo.replace(/\s+/g, '_').toLowerCase()}_${Date.now()}.csv`;
    
    link.setAttribute('href', url);
    link.setAttribute('download', nombreFinal);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    return {
      success: true,
      filename: nombreFinal
    };

  } catch (error) {
    console.error('Error generando archivo CSV:', error);
    throw new Error('No se pudo generar el archivo CSV');
  }
}