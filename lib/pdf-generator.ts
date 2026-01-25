// import html2pdf from 'html2pdf.js'; // Importación dinámica para evitar errores SSR

// Función para limpiar contenido markdown
function cleanMarkdown(text: string): string {
  if (!text) return '';

  return text
    .replace(/\*\*(.*?)\*\*/g, '$1') // Remover negritas
    .replace(/\*(.*?)\*/g, '$1')     // Remover cursivas
    .replace(/#{1,6}\s*/g, '')       // Remover encabezados
    .replace(/^[-*+]\s+/gm, '')     // Remover viñetas
    .replace(/^\d+\.\s+/gm, '')     // Remover números de lista
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remover enlaces
    .replace(/`([^`]+)`/g, '$1')     // Remover código inline
    .replace(/\n{3,}/g, '\n\n')      // Normalizar saltos de línea
    .trim();
}

// Función para convertir markdown a HTML básico
function convertMarkdownToHtml(markdown: string): string {
  if (!markdown) return '';

  let html = markdown;

  // Convertir encabezados
  html = html.replace(/^### (.*$)/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gm, '<h1>$1</h1>');

  // Convertir texto en negrita
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  // Convertir texto en cursiva
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

  // Convertir listas no ordenadas
  html = html.replace(/^\s*[-*+]\s+(.*)$/gm, '<li>$1</li>');
  html = html.replace(/((<li>[\s\S]*?<\/li>\s*)+)/g, '<ul>$1</ul>');

  // Convertir listas ordenadas
  html = html.replace(/^\s*\d+\.\s+(.*)$/gm, '<li>$1</li>');

  // Convertir párrafos
  const paragraphs = html.split(/\n\s*\n/);
  html = paragraphs.map(paragraph => {
    const trimmed = paragraph.trim();
    if (!trimmed) return '';

    // No envolver en <p> si ya tiene tags de bloque
    if (trimmed.match(/^<(h[1-6]|ul|ol|li)/)) {
      return trimmed;
    }

    return `<p>${trimmed}</p>`;
  }).filter(p => p).join('');

  return html;
}

function markdownToHtml(text: string): string {
  if (!text) return ""

  // Procesar línea por línea preservando saltos de línea
  const lines = text.split('\n')
  const processedLines: string[] = []

  let inList = false
  let currentParagraph: string[] = []

  const flushParagraph = () => {
    if (currentParagraph.length > 0) {
      const paragraphText = currentParagraph.join(' ').trim()
      if (paragraphText) {
        // Aplicar formato de texto
        const formattedText = paragraphText
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          .replace(/__(.*?)__/g, '<strong>$1</strong>')
          .replace(/\*(.*?)\*/g, '<em>$1</em>')
          .replace(/_(.*?)_/g, '<em>$1</em>')
        processedLines.push('<p style="word-break: break-word; overflow-wrap: break-word; white-space: normal; margin-bottom: 8px; line-height: 1.4; text-align: justify;">' + formattedText + '</p>')
      }
      currentParagraph = []
    }
  }

  for (const line of lines) {
    const trimmedLine = line.trim()

    // Líneas vacías terminan párrafos y crean espacios
    if (!trimmedLine) {
      flushParagraph()
      if (inList) {
        processedLines.push('</ul>')
        inList = false
      }
      continue
    }

    // Títulos
    if (trimmedLine.match(/^### /)) {
      flushParagraph()
      if (inList) {
        processedLines.push('</ul>')
        inList = false
      }
      const title = trimmedLine.replace(/^### (.*)/, '<h3>$1</h3>')
      processedLines.push(title)
    } else if (trimmedLine.match(/^## /)) {
      flushParagraph()
      if (inList) {
        processedLines.push('</ul>')
        inList = false
      }
      const title = trimmedLine.replace(/^## (.*)/, '<h2>$1</h2>')
      processedLines.push(title)
    } else if (trimmedLine.match(/^# /)) {
      flushParagraph()
      if (inList) {
        processedLines.push('</ul>')
        inList = false
      }
      const title = trimmedLine.replace(/^# (.*)/, '<h1>$1</h1>')
      processedLines.push(title)
    }
    // Listas
    else if (trimmedLine.match(/^[\*\-] /) || trimmedLine.match(/^\d+\. /)) {
      flushParagraph()
      if (!inList) {
        processedLines.push('<ul>')
        inList = true
      }
      let listItem = trimmedLine.replace(/^[\*\-] (.*)/, '<li>$1</li>')
      listItem = listItem.replace(/^\d+\. (.*)/, '<li>$1</li>')
      processedLines.push(listItem)
    }
    // Párrafos normales - agrupar líneas consecutivas con <br>
    else {
      if (inList) {
        processedLines.push('</ul>')
        inList = false
      }
      if (trimmedLine) {
        currentParagraph.push(trimmedLine)
      }
    }
  }

  // Procesar párrafo final
  flushParagraph()

  // Cerrar lista si quedó abierta
  if (inList) {
    processedLines.push('</ul>')
  }

  return processedLines.join('\n')
}

// Función para procesar contenido de examen y separar hoja de respuestas
function processExamContent(content: string): { examContent: string; answerSheet: string | null; isStructured: boolean } {
  if (!content) {
    return { examContent: '', answerSheet: null, isStructured: false };
  }

  // Verificar si el contenido ya está estructurado (contiene separadores específicos)
  const hasAnswerSheetSeparator = content.includes('--- HOJA DE RESPUESTAS ---') ||
    content.includes('HOJA DE RESPUESTAS') ||
    content.includes('Answer Sheet') ||
    content.includes('Respuestas:');

  if (hasAnswerSheetSeparator) {
    // Dividir el contenido en examen y hoja de respuestas
    const parts = content.split(/(?:--- HOJA DE RESPUESTAS ---|HOJA DE RESPUESTAS|Answer Sheet|Respuestas:)/i);

    if (parts.length >= 2) {
      const examContent = parts[0].trim();
      const answerSheet = parts.slice(1).join('\n').trim();

      return {
        examContent: examContent || content,
        answerSheet: answerSheet || null,
        isStructured: true
      };
    }
  }

  // Si no hay estructura clara, devolver todo como contenido del examen
  return {
    examContent: content,
    answerSheet: null,
    isStructured: false
  };
}

// Función para crear HTML estructurado para PDF
function createPDFHtml(content: string, title: string, isAnswerSheet: boolean = false): string {
  const styles = `
    <style>
      body {
        font-family: 'Arial', 'Helvetica', sans-serif;
        line-height: 1.5;
        margin: 20px;
        color: #000;
        font-size: 13px;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        text-rendering: optimizeLegibility;
        max-width: 100%;
        overflow-x: hidden;
      }
      .header {
        text-align: center;
        margin-bottom: 20px;
        border-bottom: 2px solid #333;
        padding-bottom: 15px;
      }
      .title {
        font-size: 22px;
        font-weight: bold;
        margin-bottom: 10px;
        color: #000;
      }
      .subtitle {
        font-size: 12px;
        color: #666;
        margin-bottom: 5px;
      }
      .content {
        margin-top: 15px;
        margin-bottom: 30px;
        overflow: visible;
        word-wrap: break-word;
        overflow-wrap: break-word;
        white-space: normal;
      }
      h1, h2, h3 {
        color: #000;
        font-weight: bold;
        margin-top: 20px;
        margin-bottom: 10px;
        display: block;
        clear: both;
        page-break-after: avoid;
      }
      h1 { 
        font-size: 18px; 
        margin-top: 25px; 
        border-bottom: 1px solid #ccc;
        padding-bottom: 5px;
      }
      h2 { 
        font-size: 16px; 
        margin-top: 20px; 
        color: #333;
      }
      h3 { 
        font-size: 14px; 
        margin-top: 15px; 
        color: #555;
      }
      p {
        margin-bottom: 12px;
        margin-top: 8px;
        text-align: justify;
        line-height: 1.6;
        display: block;
        clear: both;
        word-wrap: break-word;
        overflow-wrap: break-word;
        white-space: normal;
        max-width: 100%;
        font-size: 13px;
        orphans: 3;
        widows: 3;
      }
      ul, ol {
        margin-bottom: 10px;
        margin-top: 5px;
        padding-left: 25px;
      }
      li {
        margin-bottom: 5px;
        line-height: 1.4;
        font-size: 12px;
      }
      strong {
        font-weight: bold;
        color: #000;
      }
      em {
        font-style: italic;
      }
      @media print {
        body { 
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
      }
    </style>
  `;

  const header = `
    <div class="header">
      <div class="title">${title}</div>
      <div class="subtitle">${isAnswerSheet ? 'Hoja de Respuestas - EduPlanner' : 'EduPlanner'}</div>
      <div class="subtitle">Generado el ${new Date().toLocaleDateString('es-MX')}</div>
    </div>
  `;

  const footer = ``;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      ${styles}
    </head>
    <body>
      ${header}
      <div class="content">
        ${content}
      </div>
      ${footer}
    </body>
    </html>
  `;
}

// Función principal para generar PDF desde HTML
async function generatePDFFromHTML(content: string, title: string, filename: string, isAnswerSheet: boolean = false): Promise<void> {
  // Verificar que estamos en el cliente (browser)
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    console.error('generatePDFFromHTML solo puede ejecutarse en el cliente');
    return;
  }

  try {
    // Intentar primero con Puppeteer (alta calidad)
    const htmlContent = createPDFHtml(content, title, isAnswerSheet);

    const options = {
      format: 'A4',
      orientation: 'portrait',
      margin: {
        top: '15mm',
        right: '15mm',
        bottom: '15mm',
        left: '15mm'
      }
    };

    // Llamar a la API de Puppeteer
    const response = await fetch('/api/generate-pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        html: htmlContent,
        filename: filename,
        options: options
      })
    });

    if (!response.ok) {
      throw new Error(`Puppeteer API failed: ${response.statusText}`);
    }

    // Descargar el PDF
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    console.log('PDF generado exitosamente con Puppeteer');
  } catch (error) {
    console.error('Error generando PDF con Puppeteer:', error);
    throw error;
  }
}

export async function generateExamPDF(examen: any): Promise<void> {
  let examContent: string;
  let answerSheet: string | null = null;
  let isStructured = false;

  // Verificar si el contenido es un objeto JSON con la estructura esperada
  if (typeof examen.content === 'object' && examen.content !== null) {
    if (examen.content.examen_contenido && examen.content.hoja_de_respuestas) {
      examContent = examen.content.examen_contenido;
      answerSheet = examen.content.hoja_de_respuestas;
      isStructured = true;
    } else {
      // Si es un objeto pero no tiene la estructura esperada, convertir a string
      examContent = JSON.stringify(examen.content, null, 2);
    }
  } else {
    // Si es string, usar la función processExamContent original
    const processed = processExamContent(examen.content);
    examContent = processed.examContent;
    answerSheet = processed.answerSheet;
    isStructured = processed.isStructured;
  }



  // Generar PDF del examen
  const examTitle = cleanMarkdown(examen.title || 'Examen');
  const examFilename = `${examTitle.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_')}_Examen.pdf`;

  // Convertir markdown a HTML
  const htmlContent = markdownToHtml(examContent);

  // Agregar información de la materia al contenido si existe
  let fullContent = htmlContent;
  if (examen.subject) {
    fullContent = `<p><strong>Materia:</strong> ${cleanMarkdown(examen.subject)}</p>${htmlContent}`;
  }

  await generatePDFFromHTML(fullContent, examTitle, examFilename, false);


}

export async function generateAnswerSheetPDF(examen: any, answerSheet: string): Promise<void> {
  const answerTitle = `${cleanMarkdown(examen.title || 'Examen')} - Hoja de Respuestas`;
  const answerFilename = `${cleanMarkdown(examen.title || 'Examen').replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_')}_Respuestas.pdf`;

  // Convertir markdown a HTML
  const htmlAnswerSheet = markdownToHtml(answerSheet);

  // Agregar información de la materia al contenido si existe
  let fullContent = htmlAnswerSheet;
  if (examen.subject) {
    fullContent = `<p><strong>Materia:</strong> ${cleanMarkdown(examen.subject)}</p>${htmlAnswerSheet}`;
  }

  await generatePDFFromHTML(fullContent, answerTitle, answerFilename, true);
}

// Función para generar PDF usando Puppeteer (servidor)
async function generatePDFWithPuppeteer(htmlContent: string, filename: string, options: any = {}): Promise<void> {
  try {
    const response = await fetch('/api/generate-pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        html: htmlContent,
        filename,
        options
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Error del servidor: ${errorData.error || 'Error desconocido'}`);
    }

    // Obtener el PDF como blob
    const pdfBlob = await response.blob();

    // Crear URL para descarga
    const url = window.URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    console.log('PDF generado exitosamente con Puppeteer');
  } catch (error) {
    console.error('Error generando PDF con Puppeteer:', error);
    throw error; // Re-lanzar el error para que el fallback pueda manejarlo
  }
}

// Función para generar rúbrica PDF usando Puppeteer
async function generateRubricaPDFPuppeteer(rubrica: any): Promise<void> {
  if (typeof window === 'undefined') return;

  const { titulo, contenido } = rubrica;
  const { criterios, pda_origen } = contenido;

  // Los niveles correctos según el componente
  const niveles = ['Sobresaliente', 'Logrado', 'En Proceso', 'Requiere Apoyo'];

  // Crear tabla HTML para la rúbrica con estilos optimizados para PDF
  const tableRows = criterios.map((criterio: any) => `
    <tr>
      <td style="border: 1px solid #333; padding: 8px; font-weight: bold; background-color: #f8f9fa; vertical-align: top; width: 20%; font-size: 10px;">
        ${criterio.criterio}
        ${criterio.pda_origen ? `<br><small style="color: #666; font-weight: normal; font-size: 8px;">PDA: ${criterio.pda_origen}</small>` : ''}
      </td>
      <td style="border: 1px solid #333; padding: 8px; background-color: #d4edda; vertical-align: top; width: 20%; font-size: 9px;">
        <strong style="font-size: 10px;">Sobresaliente</strong><br>
        ${criterio.descriptores?.['Sobresaliente'] || 'No definido'}
      </td>
      <td style="border: 1px solid #333; padding: 8px; background-color: #d1ecf1; vertical-align: top; width: 20%; font-size: 9px;">
        <strong style="font-size: 10px;">Logrado</strong><br>
        ${criterio.descriptores?.['Logrado'] || 'No definido'}
      </td>
      <td style="border: 1px solid #333; padding: 8px; background-color: #fff3cd; vertical-align: top; width: 20%; font-size: 9px;">
        <strong style="font-size: 10px;">En Proceso</strong><br>
        ${criterio.descriptores?.['En Proceso'] || 'No definido'}
      </td>
      <td style="border: 1px solid #333; padding: 8px; background-color: #f8d7da; vertical-align: top; width: 20%; font-size: 9px;">
        <strong style="font-size: 10px;">Requiere Apoyo</strong><br>
        ${criterio.descriptores?.['Requiere Apoyo'] || 'No definido'}
      </td>
    </tr>
  `).join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${titulo}</title>
      <style>
        @page {
          size: A4 landscape;
          margin: 10mm;
        }
        body {
          font-family: 'Arial', sans-serif;
          margin: 0;
          padding: 0;
          color: #333;
          line-height: 1.4;
        }
        .header {
          text-align: center;
          margin-bottom: 15px;
        }
        h1 {
          color: #6f42c1;
          margin-bottom: 5px;
          font-size: 18px;
          margin-top: 0;
        }
        p {
          margin: 5px 0;
          font-size: 12px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 15px;
          font-size: 9px;
        }
        th {
          background-color: #6f42c1 !important;
          color: white !important;
          border: 1px solid #333;
          padding: 8px;
          text-align: center;
          font-size: 10px;
          font-weight: bold;
        }
        .footer {
          margin-top: 15px;
          padding: 10px;
          background-color: #f8f9fa;
          border-left: 4px solid #6f42c1;
          font-size: 10px;
        }
        .footer h3 {
          margin-top: 0;
          color: #6f42c1;
          font-size: 12px;
        }
        .footer p {
          margin: 3px 0;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${titulo}</h1>
        <p>Rúbrica Analítica</p>
        ${pda_origen ? `<p>PDA de Origen: ${pda_origen}</p>` : ''}
      </div>
      
      <table>
        <thead>
          <tr>
            <th>Criterio de Evaluación</th>
            <th>Sobresaliente</th>
            <th>Logrado</th>
            <th>En Proceso</th>
            <th>Requiere Apoyo</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
      
      <div class="footer">
        <h3>Información Adicional</h3>
        <p><strong>Total de criterios:</strong> ${criterios.length}</p>
        <p><strong>Fecha de creación:</strong> ${new Date().toLocaleDateString('es-ES')}</p>
        <p><strong>Tipo de instrumento:</strong> Rúbrica Analítica</p>
      </div>
    </body>
    </html>
  `;

  const filename = `rubrica_${titulo.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;

  const options = {
    format: 'A4',
    orientation: 'landscape',
    margin: {
      top: '15mm',
      right: '15mm',
      bottom: '15mm',
      left: '15mm'
    }
  };

  try {
    await generatePDFWithPuppeteer(htmlContent, filename, options);
  } catch (error) {
    console.warn('Puppeteer falló, usando fallback html2canvas:', error);
    // Fallback a html2canvas
    const content = `
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #333; margin-bottom: 10px;">${titulo}</h1>
        <p style="color: #666; font-style: italic;">Rúbrica Analítica</p>
        ${pda_origen ? `<p style="color: #666; font-size: 14px;">PDA de Origen: ${pda_origen}</p>` : ''}
      </div>
      
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 11px;">
        <thead>
          <tr style="background-color: #6f42c1; color: white;">
            <th style="border: 1px solid #ddd; padding: 10px; text-align: center;">Criterio de Evaluación</th>
            <th style="border: 1px solid #ddd; padding: 10px; text-align: center;">Sobresaliente</th>
            <th style="border: 1px solid #ddd; padding: 10px; text-align: center;">Logrado</th>
            <th style="border: 1px solid #ddd; padding: 10px; text-align: center;">En Proceso</th>
            <th style="border: 1px solid #ddd; padding: 10px; text-align: center;">Requiere Apoyo</th>
          </tr>
        </thead>
        <tbody>
          ${criterios.map((criterio: any) => `
            <tr>
              <td style="border: 1px solid #ddd; padding: 12px; font-weight: bold; background-color: #f8f9fa; vertical-align: top; width: 20%;">
                ${criterio.criterio}
                ${criterio.pda_origen ? `<br><small style="color: #666; font-weight: normal;">PDA: ${criterio.pda_origen}</small>` : ''}
              </td>
              <td style="border: 1px solid #ddd; padding: 12px; background-color: #d4edda; vertical-align: top; width: 20%;">
                <strong>Sobresaliente</strong><br>
                ${criterio.descriptores?.['Sobresaliente'] || 'No definido'}
              </td>
              <td style="border: 1px solid #ddd; padding: 12px; background-color: #d1ecf1; vertical-align: top; width: 20%;">
                <strong>Logrado</strong><br>
                ${criterio.descriptores?.['Logrado'] || 'No definido'}
              </td>
              <td style="border: 1px solid #ddd; padding: 12px; background-color: #fff3cd; vertical-align: top; width: 20%;">
                <strong>En Proceso</strong><br>
                ${criterio.descriptores?.['En Proceso'] || 'No definido'}
              </td>
              <td style="border: 1px solid #ddd; padding: 12px; background-color: #f8d7da; vertical-align: top; width: 20%;">
                <strong>Requiere Apoyo</strong><br>
                ${criterio.descriptores?.['Requiere Apoyo'] || 'No definido'}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div style="margin-top: 30px; padding: 15px; background-color: #f8f9fa; border-left: 4px solid #6f42c1;">
        <h3 style="margin-top: 0; color: #6f42c1;">Información Adicional</h3>
        <p><strong>Total de criterios:</strong> ${criterios.length}</p>
        <p><strong>Fecha de creación:</strong> ${new Date().toLocaleDateString('es-ES')}</p>
        <p style="margin-bottom: 0;"><strong>Tipo de instrumento:</strong> Rúbrica Analítica</p>
      </div>
    `;
    generateRubricaPDFLandscape(content, titulo, filename);
  }
}

// Función para generar lista de cotejo PDF con Puppeteer (alta calidad)
async function generateListaCotejoPDFPuppeteer(instrumento: any): Promise<void> {
  try {
    const { contenido, titulo } = instrumento;

    // Verificar si el contenido es de la nueva estructura (con indicadores) o la antigua (con criterios)
    const indicadores = contenido?.indicadores || contenido?.criterios || []
    const tituloInstrumento = contenido?.titulo_instrumento || titulo || "Lista de Cotejo"

    if (!contenido || indicadores.length === 0) {
      throw new Error('Datos de lista de cotejo inválidos');
    }

    // Crear tabla HTML para la lista de cotejo con estilos optimizados para PDF
    const tableRows = indicadores.map((indicador: any, index: number) => `
      <tr class="criterio-row">
        <td style="text-align: center; width: 8%; font-weight: bold; font-size: 10px;">
          ${index + 1}
        </td>
        <td style="width: 50%; font-size: 9px;">
          <strong>${indicador.indicador || indicador.criterio || 'Indicador ' + (index + 1)}</strong>
          ${indicador.descripcion ? `<br><span style="font-size: 8px; color: #666;">${indicador.descripcion}</span>` : ''}
          ${(indicador.criterio_origen || indicador.pda_origen) ? `<br><small style="color: #8B5CF6; font-weight: bold; font-size: 8px;">Origen: ${indicador.criterio_origen || indicador.pda_origen}</small>` : ''}
        </td>
        <td style="text-align: center; width: 10%;">
          <div style="width: 12px; height: 12px; border: 1.5px solid #333; margin: 0 auto;"></div>
        </td>
        <td style="text-align: center; width: 10%;">
          <div style="width: 12px; height: 12px; border: 1.5px solid #333; margin: 0 auto;"></div>
        </td>
        <td style="width: 22%; font-size: 8px;">
          <div style="min-height: 15px; margin-bottom: 2px;"></div>
          <div style="min-height: 15px;"></div>
        </td>
      </tr>
    `).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${tituloInstrumento}</title>
        <style>
          @page {
            size: A4 landscape;
            margin: 10mm;
          }
          * {
            box-sizing: border-box;
          }
          body {
            font-family: 'Arial', sans-serif;
            margin: 0;
            padding: 0;
            color: #333;
            line-height: 1.3;
            font-size: 9px;
          }
          .header {
            text-align: center;
            margin-bottom: 15px;
          }
          .header h1 {
            color: #333;
            margin: 0 0 5px 0;
            font-size: 16px;
          }
          .header p {
            color: #666;
            font-style: italic;
            margin: 0;
            font-size: 11px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 10px;
            font-size: 9px;
          }
          th {
            background-color: #8B5CF6 !important;
            color: white !important;
            border: 1px solid #333;
            padding: 6px;
            text-align: center;
            font-size: 10px;
            font-weight: bold;
          }
          td {
            border: 1px solid #333;
            padding: 6px;
            vertical-align: top;
          }
          .footer {
            margin-top: 15px;
            padding: 8px;
            background-color: #f8f9fa;
            border-left: 4px solid #8B5CF6;
            font-size: 9px;
          }
          .footer h3 {
            margin: 0 0 5px 0;
            color: #8B5CF6;
            font-size: 11px;
          }
          .footer p {
            margin: 2px 0;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${tituloInstrumento}</h1>
          <p>Lista de Cotejo</p>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Indicador de Logro</th>
              <th>Sí</th>
              <th>No</th>
              <th>Observaciones</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
        
        <div class="footer">
          <h3>Información Adicional</h3>
          <p><strong>Total de indicadores:</strong> ${indicadores.length}</p>
          <p><strong>Fecha de creación:</strong> ${new Date().toLocaleDateString('es-ES')}</p>
          <p><strong>Tipo de instrumento:</strong> Lista de Cotejo</p>
        </div>
      </body>
      </html>
    `;

    const filename = `lista_cotejo_${tituloInstrumento.replace(/\s+/g, '_').toLowerCase()}_${Date.now()}.pdf`;

    const options = {
      format: 'A4',
      orientation: 'landscape',
      margin: {
        top: '10mm',
        right: '10mm',
        bottom: '10mm',
        left: '10mm'
      }
    };

    try {
      await generatePDFWithPuppeteer(htmlContent, filename, options);
    } catch (error) {
      console.warn('Puppeteer falló, usando fallback html2canvas:', error);
      // Fallback a html2canvas
      const content = `
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 10px;">
          <thead>
            <tr style="background-color: #8B5CF6; color: white;">
              <th style="border: 1px solid #333; padding: 8px; text-align: center;">#</th>
              <th style="border: 1px solid #333; padding: 8px; text-align: center;">Indicador de Logro</th>
              <th style="border: 1px solid #333; padding: 8px; text-align: center;">Sí</th>
              <th style="border: 1px solid #333; padding: 8px; text-align: center;">No</th>
              <th style="border: 1px solid #333; padding: 8px; text-align: center;">Observaciones</th>
            </tr>
          </thead>
          <tbody>
            ${indicadores.map((indicador: any, index: number) => `
              <tr class="criterio-row">
                <td style="border: 1px solid #333; padding: 8px; text-align: center; width: 8%; font-weight: bold;">
                  ${index + 1}
                </td>
                <td style="border: 1px solid #333; padding: 8px; width: 50%;">
                  <strong>${indicador.indicador || indicador.criterio || 'Indicador ' + (index + 1)}</strong>
                  ${indicador.descripcion ? `<br><span style="font-size: 9px; color: #666;">${indicador.descripcion}</span>` : ''}
                  ${(indicador.criterio_origen || indicador.pda_origen) ? `<br><small style="color: #8B5CF6; font-weight: bold; font-size: 9px;">Origen: ${indicador.criterio_origen || indicador.pda_origen}</small>` : ''}
                </td>
                <td style="border: 1px solid #333; padding: 8px; text-align: center; width: 10%;">
                  <div style="width: 14px; height: 14px; border: 1.5px solid #333; margin: 0 auto;"></div>
                </td>
                <td style="border: 1px solid #333; padding: 8px; text-align: center; width: 10%;">
                  <div style="width: 14px; height: 14px; border: 1.5px solid #333; margin: 0 auto;"></div>
                </td>
                <td style="border: 1px solid #333; padding: 8px; width: 22%;">
                  <div style="min-height: 15px; margin-bottom: 2px;"></div>
                  <div style="min-height: 15px;"></div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div style="margin-top: 20px; padding: 12px; background-color: #f8f9fa; border-left: 4px solid #8B5CF6;">
          <h3 style="margin-top: 0; color: #8B5CF6; font-size: 12px;">Información Adicional</h3>
          <p style="font-size: 10px;"><strong>Total de indicadores:</strong> ${indicadores.length}</p>
          <p style="font-size: 10px;"><strong>Fecha de creación:</strong> ${new Date().toLocaleDateString('es-ES')}</p>
          <p style="margin-bottom: 0; font-size: 10px;"><strong>Tipo de instrumento:</strong> Lista de Cotejo</p>
        </div>
      `;
      await generateListaCotejoPDFLandscape(content, tituloInstrumento, filename);
    }
  } catch (error) {
    console.error('Error generando PDF de lista de cotejo:', error);
    throw error;
  }
}

export async function generatePlaneacionPDF(planeacion: any): Promise<void> {
  try {
    // Usar solo Puppeteer (alta calidad)
    await generatePlaneacionPDFPuppeteer(planeacion);
    console.log('PDF de planeación generado exitosamente con Puppeteer');
  } catch (error) {
    console.error('Error generando PDF de planeación:', error);
    throw error;
  }
}

// Función Puppeteer para planeaciones
async function generatePlaneacionPDFPuppeteer(planeacion: any): Promise<void> {
  // Crear contenido HTML para Puppeteer
  let htmlContent = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 40px; border-bottom: 3px solid #8B5CF6; padding-bottom: 20px;">
        <h1 style="color: #8B5CF6; margin-bottom: 10px; font-size: 28px;">PLANEACIÓN DIDÁCTICA</h1>
        <h2 style="color: #333; margin: 0; font-size: 20px;">${planeacion.titulo}</h2>
      </div>
      
      <div style="margin-bottom: 30px; background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
        <h3 style="color: #8B5CF6; margin-top: 0; margin-bottom: 15px;">INFORMACIÓN GENERAL</h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
          <p><strong>Materia:</strong> ${planeacion.materia || "No especificada"}</p>
          <p><strong>Grado:</strong> ${planeacion.grado || "No especificado"}</p>
          <p><strong>Duración:</strong> ${planeacion.duracion || "No especificada"}</p>
          <p><strong>Estado:</strong> ${planeacion.estado.charAt(0).toUpperCase() + planeacion.estado.slice(1)}</p>
        </div>
      </div>`;

  if (planeacion.objetivo) {
    htmlContent += `
      <div style="margin-bottom: 30px;">
        <h3 style="color: #8B5CF6; margin-bottom: 15px;">OBJETIVO DE APRENDIZAJE</h3>
        <div style="background-color: #fff; padding: 15px; border-left: 4px solid #8B5CF6; border-radius: 4px;">
          ${planeacion.objetivo}
        </div>
      </div>`;
  }

  htmlContent += `
      <div style="margin-bottom: 30px;">
        <h3 style="color: #8B5CF6; margin-bottom: 20px; border-bottom: 2px solid #8B5CF6; padding-bottom: 8px;">DESARROLLO DE LA CLASE</h3>
        <div style="line-height: 1.8; color: #444; font-size: 14px;">
          ${planeacion.contenido || ''}
        </div>
      </div>
      
      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e9ecef; text-align: center; color: #666; font-size: 12px;">
        <p>Fecha de creación: ${new Date(planeacion.created_at).toLocaleDateString("es-MX")}</p>
      </div>
    </div>`;

  const title = planeacion.titulo;
  const filename = `${title.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_')}_Planeacion.pdf`;

  const options = {
    format: 'A4',
    orientation: 'portrait',
    margin: {
      top: '20mm',
      right: '15mm',
      bottom: '20mm',
      left: '15mm'
    }
  };

  await generatePDFWithPuppeteer(htmlContent, filename, options);
}

export async function generateProyectoPDF(proyecto: any): Promise<void> {
  try {
    // Usar solo Puppeteer (alta calidad)
    await generateProyectoPDFPuppeteer(proyecto);
    console.log('PDF de proyecto generado exitosamente con Puppeteer');
  } catch (error) {
    console.error('Error generando PDF de proyecto:', error);
    throw error;
  }
}

// Función Puppeteer para proyectos
async function generateProyectoPDFPuppeteer(proyecto: any): Promise<void> {
  let htmlContent = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 40px; border-bottom: 3px solid #8B5CF6; padding-bottom: 20px;">
        <h1 style="color: #8B5CF6; margin-bottom: 10px; font-size: 28px;">PROYECTO EDUCATIVO</h1>
        <h2 style="color: #333; margin: 0; font-size: 20px;">${proyecto.nombre}</h2>
      </div>
      
      <div style="margin-bottom: 30px; background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
        <h3 style="color: #8B5CF6; margin-top: 0; margin-bottom: 15px;">INFORMACIÓN GENERAL</h3>
        <p><strong>Nombre del Proyecto:</strong> ${proyecto.nombre}</p>
        <p><strong>Grupo:</strong> ${proyecto.grupos?.nombre || "No especificado"} - ${proyecto.grupos?.grado || ""}° ${proyecto.grupos?.nivel || ""}</p>
        <p><strong>Metodología:</strong> ${proyecto.metodologia_nem}</p>
        <p><strong>Estado:</strong> ${proyecto.estado.charAt(0).toUpperCase() + proyecto.estado.slice(1)}</p>
      </div>
      
      <div style="margin-bottom: 30px;">
        <h3 style="color: #8B5CF6; margin-bottom: 15px;">PROBLEMÁTICA</h3>
        <div style="background-color: #fff; padding: 15px; border-left: 4px solid #8B5CF6; border-radius: 4px;">
          ${proyecto.problematica}
        </div>
      </div>
      
      <div style="margin-bottom: 30px;">
        <h3 style="color: #8B5CF6; margin-bottom: 15px;">PRODUCTO FINAL</h3>
        <div style="background-color: #fff; padding: 15px; border-left: 4px solid #8B5CF6; border-radius: 4px;">
          ${proyecto.producto_final}
        </div>
      </div>`;

  // PDAs Seleccionados
  if (proyecto.proyecto_curriculo && proyecto.proyecto_curriculo.length > 0) {
    htmlContent += `
      <div style="margin-bottom: 30px;">
        <h3 style="color: #8B5CF6; margin-bottom: 15px;">PDAs SELECCIONADOS</h3>`;

    proyecto.proyecto_curriculo.forEach((pc: any) => {
      htmlContent += `
        <div style="margin-bottom: 20px; background-color: #f8f9fa; padding: 15px; border-radius: 8px;">
          <h4 style="color: #333; margin-top: 0;">${pc.curriculo_sep?.campo_formativo || "Campo Formativo"}</h4>
          <p><strong>PDA:</strong> ${pc.curriculo_sep?.pda || ""}</p>
          ${pc.curriculo_sep?.contenido ? `<p>${pc.curriculo_sep.contenido}</p>` : ''}
        </div>`;
    });

    htmlContent += `</div>`;
  }

  // Fases del Proyecto
  if (proyecto.proyecto_fases && proyecto.proyecto_fases.length > 0) {
    htmlContent += `
      <div style="margin-bottom: 30px;">
        <h3 style="color: #8B5CF6; margin-bottom: 15px;">FASES Y MOMENTOS DEL PROYECTO</h3>`;

    proyecto.proyecto_fases
      .sort((a: any, b: any) => a.orden - b.orden)
      .forEach((fase: any) => {
        htmlContent += `
          <div style="margin-bottom: 20px; background-color: #fff; padding: 15px; border: 1px solid #e9ecef; border-radius: 8px;">
            <h4 style="color: #8B5CF6; margin-top: 0;">${fase.fase_nombre}</h4>
            <h5 style="color: #333; margin-bottom: 10px;">${fase.momento_nombre}</h5>
            <div>${fase.contenido}</div>
          </div>`;
      });

    htmlContent += `</div>`;
  } else {
    htmlContent += `
      <div style="margin-bottom: 30px;">
        <h3 style="color: #8B5CF6; margin-bottom: 15px;">FASES Y MOMENTOS DEL PROYECTO</h3>
        <p style="color: #666; font-style: italic;">No se generaron fases para este proyecto.</p>
      </div>`;
  }

  htmlContent += `
      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e9ecef; text-align: center; color: #666; font-size: 12px;">
        <p>Fecha de creación: ${new Date(proyecto.created_at).toLocaleDateString("es-MX")}</p>
      </div>
    </div>`;

  const title = proyecto.nombre;
  const filename = `${title.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_')}_Proyecto.pdf`;

  const options = {
    format: 'A4',
    orientation: 'portrait',
    margin: {
      top: '20mm',
      right: '15mm',
      bottom: '20mm',
      left: '15mm'
    }
  };

  await generatePDFWithPuppeteer(htmlContent, filename, options);
}

export async function generateRubricaPDF(rubrica: any): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    // Intentar primero con Puppeteer (alta calidad)
    await generateRubricaPDFPuppeteer(rubrica);
    console.log('PDF generado exitosamente con Puppeteer');
  } catch (error) {
    console.warn('Puppeteer falló, usando fallback html2canvas:', error);

    // Fallback a html2canvas
    const { titulo, contenido } = rubrica;
    const { criterios, pda_origen } = contenido;

    const tableRows = criterios.map((criterio: any) => `
      <tr>
        <td style="border: 1px solid #ddd; padding: 12px; font-weight: bold; background-color: #f8f9fa; vertical-align: top; width: 20%;">
          ${criterio.criterio}
          ${criterio.pda_origen ? `<br><small style="color: #666; font-weight: normal;">PDA: ${criterio.pda_origen}</small>` : ''}
        </td>
        <td style="border: 1px solid #ddd; padding: 12px; background-color: #d4edda; vertical-align: top; width: 20%;">
          <strong>Sobresaliente</strong><br>
          ${criterio.descriptores?.['Sobresaliente'] || 'No definido'}
        </td>
        <td style="border: 1px solid #ddd; padding: 12px; background-color: #d1ecf1; vertical-align: top; width: 20%;">
          <strong>Logrado</strong><br>
          ${criterio.descriptores?.['Logrado'] || 'No definido'}
        </td>
        <td style="border: 1px solid #ddd; padding: 12px; background-color: #fff3cd; vertical-align: top; width: 20%;">
          <strong>En Proceso</strong><br>
          ${criterio.descriptores?.['En Proceso'] || 'No definido'}
        </td>
        <td style="border: 1px solid #ddd; padding: 12px; background-color: #f8d7da; vertical-align: top; width: 20%;">
          <strong>Requiere Apoyo</strong><br>
          ${criterio.descriptores?.['Requiere Apoyo'] || 'No definido'}
        </td>
      </tr>
    `).join('');

    const content = `
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #333; margin-bottom: 10px;">${titulo}</h1>
        <p style="color: #666; font-style: italic;">Rúbrica Analítica</p>
        ${pda_origen ? `<p style="color: #666; font-size: 14px;">PDA de Origen: ${pda_origen}</p>` : ''}
      </div>
      
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 11px;">
        <thead>
          <tr style="background-color: #6f42c1; color: white;">
            <th style="border: 1px solid #ddd; padding: 10px; text-align: center;">Criterio de Evaluación</th>
            <th style="border: 1px solid #ddd; padding: 10px; text-align: center;">Sobresaliente</th>
            <th style="border: 1px solid #ddd; padding: 10px; text-align: center;">Logrado</th>
            <th style="border: 1px solid #ddd; padding: 10px; text-align: center;">En Proceso</th>
            <th style="border: 1px solid #ddd; padding: 10px; text-align: center;">Requiere Apoyo</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
      
      <div style="margin-top: 30px; padding: 15px; background-color: #f8f9fa; border-left: 4px solid #6f42c1;">
        <h3 style="margin-top: 0; color: #6f42c1;">Información Adicional</h3>
        <p><strong>Total de criterios:</strong> ${criterios.length}</p>
        <p><strong>Fecha de creación:</strong> ${new Date().toLocaleDateString('es-ES')}</p>
        <p style="margin-bottom: 0;"><strong>Tipo de instrumento:</strong> Rúbrica Analítica</p>
      </div>
    `;

    const filename = `rubrica_${titulo.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
    generateRubricaPDFLandscape(content, titulo, filename);
  }
}

function generateRubricaPDFLandscape(content: string, title: string, filename: string): void {
  // Verificar que estamos en el cliente (browser)
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    console.error('generateRubricaPDFLandscape solo puede ejecutarse en el cliente');
    return;
  }

  // Crear HTML estructurado sin página en blanco
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: Arial, sans-serif; 
          line-height: 1.4; 
          color: #333; 
          background: white;
          padding: 10mm;
        }
        table { page-break-inside: auto; }
        tr { page-break-after: auto; }
        td { word-wrap: break-word; overflow-wrap: break-word; }
      </style>
    </head>
    <body>
      ${content}
    </body>
    </html>
  `;

  // Configuración para orientación horizontal
  const options = {
    margin: [10, 10, 10, 10],
    filename: filename,
    image: { type: 'jpeg', quality: 0.95 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      height: null,
      width: null,
      letterRendering: true,
      logging: false,
      scrollX: 0,
      scrollY: 0,
      windowWidth: 1400,
      windowHeight: 900
    },
    jsPDF: {
      unit: 'mm',
      format: 'a4',
      orientation: 'landscape', // Orientación horizontal
      compress: false,
      precision: 2
    },
    pagebreak: {
      mode: ['avoid-all', 'css', 'legacy'],
      before: '.page-break-before',
      after: '.page-break-after',
      avoid: '.no-break'
    },
    enableLinks: false
  };

  // Crear elemento temporal para el HTML
  const element = document.createElement('div');
  element.innerHTML = htmlContent;
  element.style.width = '297mm'; // A4 landscape width
  element.style.minHeight = 'auto';
  element.style.overflow = 'visible';
  element.style.pageBreakInside = 'avoid';
  element.style.maxWidth = '100%';
  element.style.wordWrap = 'break-word';
  element.style.overflowWrap = 'break-word';

  // Importación dinámica de html2pdf para evitar errores SSR
  import('html2pdf.js').then((html2pdfModule) => {
    const html2pdf = html2pdfModule.default;

    // Generar PDF
    html2pdf()
      .set(options)
      .from(element)
      .save()
      .then(() => {
        // Limpiar elemento temporal
        element.remove();
      })
      .catch((error: any) => {
        console.error('Error generando PDF:', error);
        element.remove();
      });
  }).catch((error) => {
    console.error('Error importando html2pdf:', error);
    element.remove();
  });
}

export async function generateListaCotejoPDF(instrumento: any) {
  try {
    // Intentar primero con Puppeteer (alta calidad)
    await generateListaCotejoPDFPuppeteer(instrumento);
    console.log('PDF de lista de cotejo generado exitosamente con Puppeteer');
  } catch (error) {
    console.warn('Puppeteer falló para lista de cotejo, usando fallback html2canvas:', error);

    // Fallback a html2canvas
    const { contenido, titulo } = instrumento;

    // Verificar si el contenido es de la nueva estructura (con indicadores) o la antigua (con criterios)
    const indicadores = contenido?.indicadores || contenido?.criterios || []
    const tituloInstrumento = contenido?.titulo_instrumento || titulo || "Lista de Cotejo"

    if (!contenido || indicadores.length === 0) {
      throw new Error('Datos de lista de cotejo inválidos');
    }

    // Crear tabla HTML para la lista de cotejo
    const tableRows = indicadores.map((indicador: any, index: number) => `
      <tr class="criterio-row">
        <td style="border: 1px solid #333; padding: 10px; text-align: center; width: 8%; font-weight: bold;">
          ${index + 1}
        </td>
        <td style="border: 1px solid #333; padding: 10px; width: 50%;">
          <strong>${indicador.indicador || indicador.criterio || 'Indicador ' + (index + 1)}</strong>
          ${indicador.descripcion ? `<br><span style="font-size: 10px; color: #666;">${indicador.descripcion}</span>` : ''}
          ${(indicador.criterio_origen || indicador.pda_origen) ? `<br><small style="color: #8B5CF6; font-weight: bold;">Origen: ${indicador.criterio_origen || indicador.pda_origen}</small>` : ''}
        </td>
        <td style="border: 1px solid #333; padding: 10px; text-align: center; width: 10%;">
          <div style="width: 20px; height: 20px; border: 2px solid #333; margin: 0 auto;"></div>
        </td>
        <td style="border: 1px solid #333; padding: 10px; text-align: center; width: 10%;">
          <div style="width: 20px; height: 20px; border: 2px solid #333; margin: 0 auto;"></div>
        </td>
        <td style="border: 1px solid #333; padding: 10px; width: 22%;">
          <div style="min-height: 40px; border-bottom: 1px dotted #ccc; margin-bottom: 10px;"></div>
          <div style="min-height: 40px; border-bottom: 1px dotted #ccc;"></div>
        </td>
      </tr>
    `).join('');

    const content = `
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 11px;">
        <thead>
          <tr style="background-color: #8B5CF6; color: white;">
            <th style="border: 1px solid #333; padding: 10px; text-align: center;">#</th>
            <th style="border: 1px solid #333; padding: 10px; text-align: center;">Indicador de Logro</th>
            <th style="border: 1px solid #333; padding: 10px; text-align: center;">Sí</th>
            <th style="border: 1px solid #333; padding: 10px; text-align: center;">No</th>
            <th style="border: 1px solid #333; padding: 10px; text-align: center;">Observaciones</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
      
      <div style="margin-top: 30px; padding: 15px; background-color: #f8f9fa; border-left: 4px solid #8B5CF6;">
        <h3 style="margin-top: 0; color: #8B5CF6;">Información Adicional</h3>
        <p><strong>Total de indicadores:</strong> ${indicadores.length}</p>
        <p><strong>Fecha de creación:</strong> ${new Date().toLocaleDateString('es-ES')}</p>
        <p style="margin-bottom: 0;"><strong>Tipo de instrumento:</strong> Lista de Cotejo</p>
      </div>
    `;

    const filename = `lista_cotejo_${tituloInstrumento.replace(/\s+/g, '_').toLowerCase()}_${Date.now()}.pdf`;

    // Usar html2canvas como fallback
    await generateListaCotejoPDFLandscape(content, tituloInstrumento, filename);
  }
}

async function generateListaCotejoPDFLandscape(htmlContent: string, title: string, filename: string): Promise<void> {
  // Verificar que estamos en el cliente (browser)
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    console.error('generateListaCotejoPDFLandscape solo puede ejecutarse en el cliente');
    return;
  }

  // Configuración para orientación horizontal
  const options = {
    margin: [10, 10, 10, 10],
    filename: filename,
    image: { type: 'jpeg', quality: 0.95 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      height: null,
      width: null,
      letterRendering: true,
      logging: false,
      scrollX: 0,
      scrollY: 0,
      windowWidth: 1400,
      windowHeight: 900
    },
    jsPDF: {
      unit: 'mm',
      format: 'a4',
      orientation: 'landscape', // Orientación horizontal
      compress: false,
      precision: 2
    },
    pagebreak: {
      mode: ['avoid-all', 'css', 'legacy'],
      before: '.page-break-before',
      after: '.page-break-after',
      avoid: '.no-break'
    },
    enableLinks: false
  };

  // Crear elemento temporal para el HTML
  const element = document.createElement('div');
  element.innerHTML = htmlContent;
  element.style.width = '297mm'; // A4 landscape width
  element.style.minHeight = 'auto';
  element.style.overflow = 'visible';
  element.style.pageBreakInside = 'avoid';
  element.style.maxWidth = '100%';
  element.style.wordWrap = 'break-word';
  element.style.overflowWrap = 'break-word';

  // Importación dinámica de html2pdf para evitar errores SSR
  try {
    const html2pdfModule = await import('html2pdf.js');
    const html2pdf = html2pdfModule.default;

    // Generar PDF
    await html2pdf()
      .set(options)
      .from(element)
      .save();

    // Limpiar elemento temporal
    element.remove();
  } catch (error) {
    console.error('Error generando PDF:', error);
    element.remove();
    throw error;
  }
}

// Función para generar PDF de Ficha Descriptiva
export async function generateFichaPDF(ficha: any): Promise<void> {
  if (typeof window === 'undefined') return;

  // Importar html2pdf dinámicamente
  const html2pdf = (await import('html2pdf.js')).default;

  const { alumno_id, logros, dificultades, recomendaciones, estado_promocion, isPro } = ficha;
  const nombreAlumno = ficha.alumno_nombre || ficha.nombre_completo || "Alumno";

  // Mapear estado de promoción a texto legible
  const checkMark = (state: string) => estado_promocion === state ? '( X )' : '(   )';

  // Marca de agua HTML (estilo fijo para evitar problemas de CSS externo)
  const watermarkHtml = !isPro ? `
    <div style="
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-45deg);
      font-size: 60px;
      color: rgba(0, 0, 0, 0.1);
      z-index: 0;
      white-space: nowrap;
      pointer-events: none;
      font-weight: bold;
      width: 100%;
      text-align: center;
    ">
      Generado con EduPlanner Free
    </div>
  ` : '';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Ficha Descriptiva - ${nombreAlumno}</title>
      <style>
        body {
          font-family: 'Arial', sans-serif;
          margin: 0;
          padding: 20px;
          color: #000;
          line-height: 1.3;
          font-size: 11px;
          background: white;
          position: relative;
        }
        .header-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 5px;
          border: 1px solid #000;
          position: relative;
          z-index: 10;
        }
        .header-table td {
          border: 1px solid #000;
          padding: 5px 8px;
          background-color: #e0e0e0;
          font-weight: bold;
        }
        .status-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 10px;
          position: relative;
          z-index: 10;
        }
        .status-table td {
          border: 1px solid #000;
          padding: 5px;
          width: 50%;
          font-size: 10px;
        }
        .section-title {
          text-align: center;
          margin: 5px 0;
          font-style: italic;
          font-size: 10px;
          position: relative;
          z-index: 10;
        }
        .main-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 0;
          position: relative;
          z-index: 10;
        }
        .main-table th {
          border: 1px solid #000;
          padding: 5px;
          background-color: #e0e0e0;
          text-align: center;
          font-weight: bold;
          width: 50%;
        }
        .main-table td {
          border: 1px solid #000;
          padding: 8px;
          vertical-align: top;
          text-align: justify;
          height: 350px; /* Altura fija para mantener estructura */
        }
        .recommendations-box {
          border: 1px solid #000;
          border-top: none; /* Se une con la tabla de arriba */
          padding: 10px;
          min-height: 150px;
          position: relative;
          z-index: 10;
        }
        .rec-title {
          font-weight: bold;
          margin-bottom: 5px;
        }
        p { margin-top: 5px; margin-bottom: 5px; }
        ul { margin-top: 5px; margin-bottom: 5px; padding-left: 20px; }
        li { margin-bottom: 2px; }
      </style>
    </head>
    <body>
      ${watermarkHtml}
      <div id="ficha-content">
          <!-- Encabezado con Nombre -->
          <table class="header-table">
            <tr>
              <td>FICHA DESCRIPTIVA DEL ALUMNO: ${nombreAlumno}</td>
            </tr>
          </table>

          <!-- Estado de Promoción -->
          <table class="status-table">
            <tr>
              <td>No promovido ${checkMark('no_promovido')}</td>
              <td>Promovido con condiciones ${checkMark('condicionado')}   Promovido ${checkMark('promovido')}</td>
            </tr>
          </table>

          <div class="section-title">Durante el ciclo escolar</div>

          <!-- Tabla Principal: Logros y Dificultades -->
          <table class="main-table">
            <thead>
              <tr>
                <th>Logros</th>
                <th>Dificultades</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  ${markdownToHtml(logros || '')}
                </td>
                <td>
                  ${markdownToHtml(dificultades || '')}
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Recomendaciones -->
          <div class="recommendations-box">
            <div class="rec-title">Recomendaciones para la intervención docente el próximo año:</div>
            ${markdownToHtml(recomendaciones || '')}
          </div>
      </div>
    </body>
    </html>
  `;

  const filename = `Ficha_${nombreAlumno.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;

  const opt = {
    margin: [10, 10, 10, 10], // mm
    filename: filename,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  try {
    // Crear elemento temporal
    const element = document.createElement('div');
    element.innerHTML = htmlContent;
    // Hack: html2pdf necesita que el elemento esté en el DOM para renderizar estilos correctamente a veces, 
    // pero funciona con string/element suelto si los estilos son inline.
    // Para mayor seguridad con tablas complejas:
    document.body.appendChild(element);

    // Simular entorno de impresión
    // @ts-ignore
    await html2pdf().from(element).set(opt).save();

    document.body.removeChild(element);
    console.log('PDF generado exitosamente con html2pdf');

  } catch (error) {
    console.error('Error generando PDF de ficha CLI:', error);
    throw error;
  }
}

// Función para generar Reporte Institucional PDF
export async function generateReporteInstitucionalPDF(data: any, plantelInfo: any): Promise<void> {
  if (typeof window === 'undefined') return;

  const { periodo, kpis, detalles } = data;
  const mesTitulo = periodo.mes.charAt(0).toUpperCase() + periodo.mes.slice(1);
  // Si el mesTitulo ya contiene "Ciclo" o "Trimestre", no añadir "Reporte de Cumplimiento - " redundante o el año duplicado
  const isSpecialPeriod = mesTitulo.includes('Ciclo') || mesTitulo.includes('Trimestre') || mesTitulo.includes('Semestre') || mesTitulo.includes('Cuatrimestre');
  const titulo = isSpecialPeriod ? mesTitulo : `Reporte de Cumplimiento - ${mesTitulo} ${periodo.anio}`;

  // Obtener nombre del director
  let directorNombre = '';
  if (plantelInfo?.id) {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { data: director } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('plantel_id', plantelInfo.id)
        .eq('role', 'director')
        .eq('activo', true)
        .single();

      if (director?.full_name) {
        directorNombre = director.full_name;
      }
    } catch (e) {
      console.warn('No se pudo obtener nombre del director:', e);
    }
  }

  // Calcular color de salud global
  const score = (kpis.asistencia.promedio + kpis.planeaciones.progreso_porcentaje + kpis.incidencias.resolucion_porcentaje) / 3;
  const healthColor = score >= 90 ? '#10B981' : score >= 80 ? '#F59E0B' : '#EF4444';
  const healthText = score >= 90 ? 'Excelente' : score >= 80 ? 'Bueno' : 'Atención Requerida';

  // Convertir logo a Base64 para evitar problemas de CORS/Loading
  let logoBase64 = '';
  if (plantelInfo?.logo_url) {
    try {
      const response = await fetch(plantelInfo.logo_url);
      const blob = await response.blob();
      logoBase64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
    } catch (e) {
      console.error('Error convirtiendo logo a base64:', e);
      // Fallback: usar url original si falla, aunque probablemente no se vea
      logoBase64 = plantelInfo.logo_url;
    }
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${titulo}</title>
      <style>
        @page { size: A4; margin: 0; }
        body {
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
          margin: 0;
          padding: 40px;
          color: #1F2937;
          background: #fff;
          line-height: 1.5;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 40px;
          border-bottom: 2px solid #E5E7EB;
          padding-bottom: 20px;
        }
        .logo-container {
          display: flex;
          align-items: center;
          gap: 15px;
        }
        .logo {
          height: 60px;
          width: auto;
          object-fit: contain;
        }
        .school-name {
          font-size: 24px;
          font-weight: bold;
          color: #111827;
          margin: 0;
        }
        .report-meta {
          text-align: right;
          font-size: 12px;
          color: #6B7280;
        }
        .period-badge {
          background: #F3F4F6;
          padding: 5px 12px;
          border-radius: 20px;
          font-weight: 600;
          color: #374151;
          display: inline-block;
          margin-top: 5px;
        }
        
        .section-title {
          font-size: 18px;
          font-weight: bold;
          color: #374151;
          margin-bottom: 15px;
          display: flex;
          align-items: center;
          gap: 10px;
          border-left: 4px solid #3B82F6;
          padding-left: 10px;
        }

        /* KPI Cards */
        .kpi-container {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          margin-bottom: 40px;
        }
        .kpi-card {
          border: 1px solid #E5E7EB;
          border-radius: 12px;
          padding: 20px;
          text-align: center;
          background: #FAFAFA;
        }
        .kpi-value {
          font-size: 32px;
          font-weight: bold;
          margin: 10px 0;
        }
        .kpi-label {
          font-size: 14px;
          color: #6B7280;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .kpi-sub {
          font-size: 12px;
          color: #9CA3AF;
        }

        /* Health Status */
        .status-box {
          background: ${healthColor}15;
          border: 1px solid ${healthColor};
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 40px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .status-text {
          color: ${healthColor};
          font-weight: bold;
          font-size: 18px;
        }

        /* Tables */
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
          font-size: 14px;
        }
        th {
          text-align: left;
          padding: 12px;
          background: #F9FAFB;
          color: #4B5563;
          font-weight: 600;
          border-bottom: 1px solid #E5E7EB;
        }
        td {
          padding: 12px;
          border-bottom: 1px solid #F3F4F6;
          color: #374151;
        }
        tr:last-child td {
          border-bottom: none;
        }
        
        .footer {
          margin-top: 60px;
          text-align: center;
          color: #9CA3AF;
          font-size: 12px;
          border-top: 1px solid #E5E7EB;
          padding-top: 20px;
        }

        /* Charts placeholders (since we can't easily render JS charts in pdf yet without canvas) */
        .bar-container {
          width: 100%;
          background: #E5E7EB;
          height: 8px;
          border-radius: 4px;
          margin-top: 5px;
          overflow: hidden;
        }
        .bar-fill {
          height: 100%;
          border-radius: 4px;
          transition: width 0.3s;
        }
      </style>
    </head>
    <body>
      <!-- Header -->
      <div class="header">
        <div class="logo-container">
          ${logoBase64 ? `<img src="${logoBase64}" class="logo" />` : ''}
          <div>
            <h1 class="school-name">${plantelInfo?.nombre || 'Institución Educativa'}</h1>
            <div class="period-badge">${isSpecialPeriod ? mesTitulo : `${mesTitulo} ${periodo.anio}`}</div>
          </div>
        </div>
        <div class="report-meta">
          <strong>REPORTE EJECUTIVO</strong><br>
          Generado: ${new Date().toLocaleDateString('es-MX')}<br>
          Folio: RCI-${periodo.mes.substring(0, 3).toUpperCase()}-${new Date().getFullYear()}
        </div>
      </div>

      <!-- General Health -->
      <div class="status-box">
        <div>
          <div style="font-size: 12px; text-transform: uppercase; color: #666; margin-bottom: 4px;">Estado General del Plantel</div>
          <div class="status-text">${healthText} (Score: ${Math.round(score)}/100)</div>
        </div>
        <div style="text-align: right; font-size: 32px;">
           ${score >= 90 ? '🌟' : score >= 80 ? '✅' : '⚠️'}
        </div>
      </div>

      <!-- KPIs -->
      <div class="kpi-container">
        <div class="kpi-card">
          <div class="kpi-label">Asistencia Promedio</div>
          <div class="kpi-value" style="color: ${kpis.asistencia.promedio >= 90 ? '#10B981' : '#F59E0B'}">
            ${kpis.asistencia.promedio}%
          </div>
          <div class="kpi-sub">${kpis.asistencia.total_registros} registros analizados</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Planeaciones</div>
          <div class="kpi-value" style="color: #3B82F6">
            ${kpis.planeaciones.progreso_porcentaje}%
          </div>
          <div class="kpi-sub">${kpis.planeaciones.completadas} de ${kpis.planeaciones.total} esperadas</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Resolución Incidencias</div>
          <div class="kpi-value" style="color: ${kpis.incidencias.resolucion_porcentaje >= 80 ? '#10B981' : '#EF4444'}">
            ${kpis.incidencias.resolucion_porcentaje}%
          </div>
          <div class="kpi-sub">${kpis.incidencias.resueltas} cerradas de ${kpis.incidencias.total}</div>
        </div>
      </div>

      <!-- NUEVA SECCIÓN: Análisis de Riesgo de Deserción -->
      ${data.tendencia_riesgo ? `
      <div style="background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%); padding: 20px; border-radius: 12px; margin-bottom: 30px; border-left: 6px solid #F59E0B;">
        <div style="display: flex; align-items: center; margin-bottom: 12px;">
          <div style="font-size: 18px; margin-right: 10px;">📊</div>
          <div style="font-size: 16px; font-weight: bold; color: #92400E;">Análisis de Riesgo de Deserción</div>
        </div>
        <div style="font-size: 14px; color: #78350F; line-height: 1.6; margin-bottom: 12px;">
          ${data.tendencia_riesgo.insight}
        </div>
        <div style="display: flex; gap: 20px; margin-top: 15px;">
          <div style="flex: 1; background: rgba(255,255,255,0.6); padding: 12px; border-radius: 8px;">
            <div style="font-size: 11px; color: #92400E; text-transform: uppercase; margin-bottom: 4px;">Cambio vs. Periodo Anterior</div>
            <div style="font-size: 24px; font-weight: bold; color: ${data.tendencia_riesgo.direccion === 'incremento' ? '#DC2626' : '#059669'};">
              ${data.tendencia_riesgo.cambio_porcentaje > 0 ? '+' : ''}${data.tendencia_riesgo.cambio_porcentaje}%
              ${data.tendencia_riesgo.direccion === 'incremento' ? '↑' : data.tendencia_riesgo.direccion === 'reduccion' ? '↓' : '→'}
            </div>
          </div>
          <div style="flex: 1; background: rgba(255,255,255,0.6); padding: 12px; border-radius: 8px;">
            <div style="font-size: 11px; color: #92400E; text-transform: uppercase; margin-bottom: 4px;">Incidencias Alto Impacto</div>
            <div style="font-size: 24px; font-weight: bold; color: #DC2626;">
              ${data.tendencia_riesgo.incidencias_alto_impacto}
            </div>
          </div>
        </div>
      </div>
      ` : ''}

      <!-- NUEVA SECCIÓN: Salud Docente -->
      ${data.salud_docente ? `
      <div style="background: linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%); padding: 20px; border-radius: 12px; margin-bottom: 30px; border-left: 6px solid #3B82F6;">
        <div style="display: flex; align-items: center; margin-bottom: 12px;">
          <div style="font-size: 18px; margin-right: 10px;">👨‍🏫</div>
          <div style="font-size: 16px; font-weight: bold; color: #1E40AF;">Estado de Productividad Docente</div>
        </div>
        <div style="font-size: 14px; color: #1E3A8A; line-height: 1.6; margin-bottom: 12px;">
          ${data.salud_docente.resumen}
        </div>
        <div style="display: flex; gap: 20px; margin-top: 15px;">
          <div style="flex: 1; background: rgba(255,255,255,0.7); padding: 12px; border-radius: 8px;">
            <div style="font-size: 11px; color: #1E40AF; text-transform: uppercase; margin-bottom: 4px;">Productividad</div>
            <div style="font-size: 20px; font-weight: bold; color: ${data.salud_docente.productividad === 'alta' ? '#059669' : data.salud_docente.productividad === 'media' ? '#F59E0B' : '#DC2626'};">
              ${data.salud_docente.productividad === 'alta' ? '🌟 ALTA' : data.salud_docente.productividad === 'media' ? '✓ MEDIA' : '⚠ BAJA'}
            </div>
          </div>
          <div style="flex: 1; background: rgba(255,255,255,0.7); padding: 12px; border-radius: 8px;">
            <div style="font-size: 11px; color: #1E40AF; text-transform: uppercase; margin-bottom: 4px;">Alineación NEM</div>
            <div style="font-size: 20px; font-weight: bold; color: ${data.salud_docente.alineacion_nem ? '#059669' : '#DC2626'};">
              ${data.salud_docente.alineacion_nem ? '✅ CUMPLE' : '❌ NO CUMPLE'}
            </div>
          </div>
          <div style="flex: 1; background: rgba(255,255,255,0.7); padding: 12px; border-radius: 8px;">
            <div style="font-size: 11px; color: #1E40AF; text-transform: uppercase; margin-bottom: 4px;">Docentes Activos</div>
            <div style="font-size: 20px; font-weight: bold; color: #3B82F6;">
              ${data.salud_docente.profesores_activos}/${data.salud_docente.profesores_total}
            </div>
          </div>
        </div>
      </div>
      ` : ''}

      <!-- NUEVA SECCIÓN: Casos Críticos -->
      ${data.casos_criticos && data.casos_criticos.length > 0 ? `
      <div style="background: linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%); padding: 20px; border-radius: 12px; margin-bottom: 30px; border-left: 6px solid #DC2626;">
        <div style="display: flex; align-items: center; margin-bottom: 16px;">
          <div style="font-size: 18px; margin-right: 10px;">🚨</div>
          <div style="font-size: 16px; font-weight: bold; color: #991B1B;">Casos Críticos del Periodo</div>
        </div>
        <div style="font-size: 13px; color: #7F1D1D; margin-bottom: 15px;">
          Estudiantes que requieren atención inmediata por alto riesgo de deserción o problemas de conducta:
        </div>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: rgba(255,255,255,0.7);">
              <th style="padding: 10px; text-align: left; font-size: 12px; color: #991B1B; border-bottom: 2px solid #DC2626;">Estudiante</th>
              <th style="padding: 10px; text-align: left; font-size: 12px; color: #991B1B; border-bottom: 2px solid #DC2626;">Grupo</th>
              <th style="padding: 10px; text-align: left; font-size: 12px; color: #991B1B; border-bottom: 2px solid #DC2626;">Motivo</th>
              <th style="padding: 10px; text-align: left; font-size: 12px; color: #991B1B; border-bottom: 2px solid #DC2626;">Acción Recomendada</th>
            </tr>
          </thead>
          <tbody>
            ${data.casos_criticos.map((caso, idx) => `
              <tr style="background: ${idx % 2 === 0 ? 'rgba(255,255,255,0.5)' : 'transparent'};">
                <td style="padding: 10px; font-size: 13px; color: #7F1D1D; border-bottom: 1px solid rgba(220,38,38,0.2);">
                  <div style="font-weight: 600;">${caso.nombre}</div>
                </td>
                <td style="padding: 10px; font-size: 12px; color: #7F1D1D; border-bottom: 1px solid rgba(220,38,38,0.2);">
                  ${caso.grupo}
                </td>
                <td style="padding: 10px; font-size: 12px; color: #7F1D1D; border-bottom: 1px solid rgba(220,38,38,0.2);">
                  <div style="display: inline-block; background: ${caso.nivel_riesgo === 'alto' ? '#DC2626' : caso.nivel_riesgo === 'medio' ? '#F59E0B' : '#10B981'}; color: white; padding: 3px 8px; border-radius: 4px; font-size: 10px; font-weight: 600; margin-bottom: 4px;">
                    ${caso.nivel_riesgo.toUpperCase()}
                  </div>
                  <div>${caso.motivo}</div>
                </td>
                <td style="padding: 10px; font-size: 11px; color: #7F1D1D; border-bottom: 1px solid rgba(220,38,38,0.2);">
                  ${caso.accion_recomendada}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      ` : ''}

      <!-- Detail Sections -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px;">
        
        <!-- Attendance Table -->
        <div>
          <div class="section-title">📉 Asistencia por Grupo</div>
          <table>
            <thead>
              <tr>
                <th>Grupo</th>
                <th style="text-align: right;">% Asistencia</th>
              </tr>
            </thead>
            <tbody>
              ${detalles.grupos_asistencia.slice(0, 10).map((g: any) => `
                <tr>
                  <td>${g.grupo}</td>
                  <td style="text-align: right;">
                    <strong>${g.porcentaje}%</strong>
                    <div class="bar-container">
                      <div class="bar-fill" style="width: ${g.porcentaje}%; background: ${g.porcentaje >= 90 ? '#10B981' : g.porcentaje >= 80 ? '#F59E0B' : '#EF4444'};"></div>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <!-- Incidents Table -->
        <div>
          <div class="section-title">🛡️ Incidencias por Tipo</div>
          <table>
            <thead>
              <tr>
                <th>Tipo</th>
                <th style="text-align: right;">Cantidad</th>
              </tr>
            </thead>
            <tbody>
              ${detalles.incidencias_tipo.length > 0 ? detalles.incidencias_tipo.map((i: any) => `
                <tr>
                  <td style="text-transform: capitalize;">${i.tipo}</td>
                  <td style="text-align: right; font-weight: bold;">${i.cantidad}</td>
                </tr>
              `).join('') : '<tr><td colspan="2" style="text-align: center; color: #9CA3AF;">Sin incidencias reportadas</td></tr>'}
            </tbody>
          </table>
          
          <div style="margin-top: 20px; padding: 15px; background: #FEF2F2; border-radius: 8px; font-size: 13px;">
             <strong>⚠️ Alertas Activas:</strong><br>
             ${kpis.incidencias.pendientes} casos pendientes de resolución.
          </div>
        </div>

      </div>

      <!-- Signature Section -->
      <div style="margin-top: 60px; padding: 30px 40px; page-break-inside: avoid;">
        <div style="text-align: center; margin-bottom: 40px;">
          <strong style="font-size: 14px; color: #374151;">FIRMA DE VALIDACIÓN</strong>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 60px; margin-top: 40px;">
          <!-- Director Signature -->
          <div style="text-align: center;">
            <div style="border-top: 2px solid #1F2937; padding-top: 10px; margin-bottom: 8px;">
              <strong style="font-size: 13px; color: #374151;">${directorNombre || 'Director(a)'}</strong>
            </div>
            <div style="font-size: 11px; color: #6B7280;">Nombre y Firma</div>
          </div>
          
          <!-- Official Seal -->
          <div style="text-align: center;">
            <div style="border: 2px dashed #D1D5DB; height: 100px; display: flex; align-items: center; justify-content: center; border-radius: 8px; margin-bottom: 8px;">
              <span style="font-size: 11px; color: #9CA3AF;">Sello Oficial</span>
            </div>
            <div style="font-size: 11px; color: #6B7280;">${plantelInfo?.nombre || ''}</div>
          </div>
        </div>
        
        <div style="margin-top: 30px; text-align: center; font-size: 10px; color: #9CA3AF;">
          Fecha de emisión: ${new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      <div class="footer">
        <p>Este documento es un reporte generado automáticamente por EduPlanner.</p>
        <p>Validez interna para la toma de decisiones del plantel ${plantelInfo?.nombre}.</p>
      </div>

    </body>
    </html>
  `;

  // Filename
  const filename = `Reporte_${periodo.mes}_${periodo.anio}.pdf`;

  // Usar Puppeteer
  const options = {
    format: 'A4',
    margin: {
      top: '0mm',
      right: '0mm',
      bottom: '0mm',
      left: '0mm'
    }
  };

  try {
    await generatePDFWithPuppeteer(htmlContent, filename, options);
  } catch (error) {
    console.warn('Puppeteer failed, using fallback:', error);
    await generateReporteInstitucionalPDFFallback(htmlContent, filename);
  }
}

async function generateReporteInstitucionalPDFFallback(htmlContent: string, filename: string): Promise<void> {
  if (typeof window === 'undefined') return;

  const opt = {
    margin: [0, 0, 0, 0],
    filename: filename,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, letterRendering: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  try {
    const element = document.createElement('div');
    element.innerHTML = htmlContent;
    // Styles adjustment for fallback
    element.style.width = '210mm';
    element.style.maxWidth = '100%';

    // Import dynamic
    const html2pdf = (await import('html2pdf.js')).default;

    await html2pdf().from(element).set(opt).save();
  } catch (e) {
    console.error('Fallback generation failed:', e);
    throw e;
  }
}