import html2pdf from 'html2pdf.js';

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
  
  // Dividir en líneas para procesamiento más preciso
  const lines = text.split('\n')
  const processedLines: string[] = []
  let inList = false
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i]
    
    // Títulos
    if (line.match(/^### /)) {
      line = line.replace(/^### (.*)/, '<h3>$1</h3>')
    } else if (line.match(/^## /)) {
      line = line.replace(/^## (.*)/, '<h2>$1</h2>')
    } else if (line.match(/^# /)) {
      line = line.replace(/^# (.*)/, '<h1>$1</h1>')
    }
    // Listas
    else if (line.match(/^[\*\-] /) || line.match(/^\d+\. /)) {
      if (!inList) {
        processedLines.push('<ul>')
        inList = true
      }
      line = line.replace(/^[\*\-] (.*)/, '<li>$1</li>')
      line = line.replace(/^\d+\. (.*)/, '<li>$1</li>')
    }
    // Línea vacía o no es lista
    else {
      if (inList) {
        processedLines.push('</ul>')
        inList = false
      }
      
      // Párrafos normales
      if (line.trim() !== '') {
        // Aplicar formato de texto
        line = line
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          .replace(/__(.*?)__/g, '<strong>$1</strong>')
          .replace(/\*(.*?)\*/g, '<em>$1</em>')
          .replace(/_(.*?)_/g, '<em>$1</em>')
        
        // Solo envolver en <p> si no es un título
          if (!line.includes('<h1>') && !line.includes('<h2>') && !line.includes('<h3>')) {
            line = '<p>' + line + '</p>'
          }
      } else {
        line = '' // Líneas vacías se mantienen vacías
      }
    }
    
    if (line.trim() !== '') {
      processedLines.push(line)
    }
  }
  
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
        font-family: Arial, sans-serif;
        line-height: 1.6;
        margin: 20px;
        color: #333;
      }
      .header {
        text-align: center;
        margin-bottom: 30px;
        border-bottom: 2px solid #333;
        padding-bottom: 15px;
      }
      .title {
        font-size: 24px;
        font-weight: bold;
        margin-bottom: 10px;
      }
      .subtitle {
        font-size: 14px;
        color: #666;
        margin-bottom: 5px;
      }
      .content {
        margin-top: 20px;
      }
      h1, h2, h3 {
        color: #000000;
        font-weight: bold;
        margin-top: 25px;
        margin-bottom: 15px;
      }
      h1 { font-size: 20px; }
      h2 { font-size: 18px; }
      h3 { font-size: 16px; }
      p {
        margin-bottom: 12px;
        text-align: justify;
      }
      ul, ol {
        margin-bottom: 15px;
        padding-left: 25px;
      }
      li {
        margin-bottom: 5px;
      }
      strong {
        font-weight: bold;
      }
      em {
        font-style: italic;
      }
      .footer {
        position: fixed;
        bottom: 20px;
        left: 20px;
        right: 20px;
        text-align: center;
        font-size: 10px;
        color: #666;
        border-top: 1px solid #ddd;
        padding-top: 10px;
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

  const footer = `
    <div class="footer">
      Generado por EduPlanner el ${new Date().toLocaleDateString('es-MX')}
    </div>
  `;

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
function generatePDFFromHTML(content: string, title: string, filename: string, isAnswerSheet: boolean = false): void {
  // Crear HTML estructurado
  const htmlContent = createPDFHtml(content, title, isAnswerSheet);
  
  // Configuración para html2pdf
  const options = {
    margin: [15, 15, 20, 15], // top, right, bottom, left
    filename: filename,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { 
      scale: 2,
      useCORS: true,
      letterRendering: true
    },
    jsPDF: { 
      unit: 'mm', 
      format: 'a4', 
      orientation: 'portrait'
    }
  };

  // Crear elemento temporal para el HTML
  const element = document.createElement('div');
  element.innerHTML = htmlContent;
  element.style.width = '210mm';
  element.style.minHeight = '297mm';
  
  // Generar PDF
  html2pdf()
    .set(options)
    .from(element)
    .save()
    .then(() => {
      console.log('PDF generado exitosamente:', filename);
      // Limpiar elemento temporal
      element.remove();
    })
    .catch((error: any) => {
      console.error('Error generando PDF:', error);
      element.remove();
    });
}

export function generateExamPDF(examen: any): void {
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
  
  console.log('Procesando examen:', {
    contentType: typeof examen.content,
    isStructured,
    hasAnswerSheet: !!answerSheet,
    examContentLength: examContent?.length || 0,
    answerSheetLength: answerSheet?.length || 0
  });
  
  // Generar PDF del examen
  const examTitle = cleanMarkdown(examen.title || 'Examen');
  const examFilename = `${examTitle.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_')}_Examen.pdf`;
  
  // Agregar información de la materia al contenido si existe
  let fullContent = examContent;
  if (examen.subject) {
    fullContent = `<p><strong>Materia:</strong> ${cleanMarkdown(examen.subject)}</p>${examContent}`;
  }
  
  generatePDFFromHTML(fullContent, examTitle, examFilename, false);
  
  console.log('PDF del examen generado. Hoja de respuestas disponible por separado:', { isStructured, hasAnswerSheet: !!answerSheet });
}

export function generateAnswerSheetPDF(examen: any, answerSheet: string): void {
  const answerTitle = `${cleanMarkdown(examen.title || 'Examen')} - Hoja de Respuestas`;
  const answerFilename = `${cleanMarkdown(examen.title || 'Examen').replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_')}_Respuestas.pdf`;
  
  // Agregar información de la materia al contenido si existe
  let fullContent = answerSheet;
  if (examen.subject) {
    fullContent = `<p><strong>Materia:</strong> ${cleanMarkdown(examen.subject)}</p>${answerSheet}`;
  }
  
  generatePDFFromHTML(fullContent, answerTitle, answerFilename, true);
}

export function generatePDF(planeacion: any): void {
  // Crear contenido HTML estructurado
  let content = `<div class="planeacion-header">`;
  content += `<h1>PLANEACIÓN DIDÁCTICA</h1>`;
  
  // Información básica
  content += `<h2>INFORMACIÓN GENERAL</h2>`;
  content += `<p><strong>Materia:</strong> ${cleanMarkdown(planeacion.materia) || "No especificada"}</p>`;
  content += `<p><strong>Grado:</strong> ${cleanMarkdown(planeacion.grado) || "No especificado"}</p>`;
  content += `<p><strong>Duración:</strong> ${cleanMarkdown(planeacion.duracion) || "No especificada"}</p>`;
  content += `<p><strong>Estado:</strong> ${planeacion.estado.charAt(0).toUpperCase() + planeacion.estado.slice(1)}</p>`;
  
  // Objetivo si existe
  if (planeacion.objetivo) {
    content += `<h2>OBJETIVO DE APRENDIZAJE</h2>`;
    content += `<p>${cleanMarkdown(planeacion.objetivo)}</p>`;
  }
  
  // Desarrollo de la clase
  content += `<h2>DESARROLLO DE LA CLASE</h2>`;
  const contenidoHtml = markdownToHtml(planeacion.contenido || '');
  content += `<div class="contenido">${contenidoHtml}</div>`;
  
  // Información adicional
  content += `<p><em>Fecha de creación: ${new Date(planeacion.created_at).toLocaleDateString("es-MX")}</em></p>`;
  content += `</div>`;
  
  // Generar PDF
  const title = cleanMarkdown(planeacion.titulo);
  const filename = `${title.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_')}_Planeacion.pdf`;
  
  generatePDFFromHTML(content, title, filename, false);
}
