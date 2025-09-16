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
        font-family: Arial, sans-serif;
        line-height: 1.3;
        margin: 20px;
        color: #333;
      }
      .header {
        text-align: center;
        margin-bottom: 15px;
        border-bottom: 2px solid #333;
        padding-bottom: 10px;
      }
      .title {
        font-size: 24px;
        font-weight: bold;
        margin-bottom: 8px;
      }
      .subtitle {
        font-size: 14px;
        color: #666;
        margin-bottom: 3px;
      }
      .content {
        margin-top: 10px;
        margin-bottom: 30px;
        overflow: visible;
        word-wrap: break-word;
        overflow-wrap: break-word;
        white-space: normal;
      }
      h1, h2, h3 {
        color: #000000;
        font-weight: bold;
        margin-top: 16px;
        margin-bottom: 8px;
        display: block;
        clear: both;
      }
      h1 { font-size: 20px; margin-top: 20px; }
      h2 { font-size: 18px; margin-top: 18px; }
      h3 { font-size: 16px; margin-top: 16px; }
      p {
        margin-bottom: 8px;
        margin-top: 4px;
        text-align: justify;
        line-height: 1.4;
        display: block;
        clear: both;
        word-wrap: break-word;
        overflow-wrap: break-word;
        white-space: normal;
        max-width: 100%;
      }
      ul, ol {
        margin-bottom: 8px;
        margin-top: 4px;
        padding-left: 20px;
      }
      li {
        margin-bottom: 3px;
        line-height: 1.3;
      }
      strong {
        font-weight: bold;
      }
      em {
        font-style: italic;
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
function generatePDFFromHTML(content: string, title: string, filename: string, isAnswerSheet: boolean = false): void {
  // Verificar que estamos en el cliente (browser)
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    console.error('generatePDFFromHTML solo puede ejecutarse en el cliente');
    return;
  }

  // Crear HTML estructurado
  const htmlContent = createPDFHtml(content, title, isAnswerSheet);
  
  // Configuración para html2pdf
  const options = {
    margin: [10, 10, 10, 10],
    filename: filename,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { 
      scale: 1,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      height: null,
      width: null
    },
    jsPDF: { 
      unit: 'mm', 
      format: 'a4', 
      orientation: 'portrait'
    },
    pagebreak: { 
      mode: []
    },
    enableLinks: false
  };

  // Crear elemento temporal para el HTML
  const element = document.createElement('div');
  element.innerHTML = htmlContent;
  element.style.width = '210mm';
  element.style.minHeight = 'auto';
  element.style.overflow = 'visible';
  element.style.pageBreakInside = 'avoid';
  
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
  
  generatePDFFromHTML(fullContent, examTitle, examFilename, false);
  
  
}

export function generateAnswerSheetPDF(examen: any, answerSheet: string): void {
  const answerTitle = `${cleanMarkdown(examen.title || 'Examen')} - Hoja de Respuestas`;
  const answerFilename = `${cleanMarkdown(examen.title || 'Examen').replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_')}_Respuestas.pdf`;
  
  // Convertir markdown a HTML
  const htmlAnswerSheet = markdownToHtml(answerSheet);
  
  // Agregar información de la materia al contenido si existe
  let fullContent = htmlAnswerSheet;
  if (examen.subject) {
    fullContent = `<p><strong>Materia:</strong> ${cleanMarkdown(examen.subject)}</p>${htmlAnswerSheet}`;
  }
  
  generatePDFFromHTML(fullContent, answerTitle, answerFilename, true);
}

export function generatePDF(planeacion: any): void {
  // Crear contenido en formato markdown para procesamiento consistente
  let markdownContent = `# PLANEACIÓN DIDÁCTICA\n\n`;
  
  // Información básica
  markdownContent += `## INFORMACIÓN GENERAL\n\n`;
  markdownContent += `**Materia:** ${cleanMarkdown(planeacion.materia) || "No especificada"}\n\n`;
  markdownContent += `**Grado:** ${cleanMarkdown(planeacion.grado) || "No especificado"}\n\n`;
  markdownContent += `**Duración:** ${cleanMarkdown(planeacion.duracion) || "No especificada"}\n\n`;
  markdownContent += `**Estado:** ${planeacion.estado.charAt(0).toUpperCase() + planeacion.estado.slice(1)}\n\n`;
  
  // Objetivo si existe
  if (planeacion.objetivo) {
    markdownContent += `## OBJETIVO DE APRENDIZAJE\n\n`;
    markdownContent += `${cleanMarkdown(planeacion.objetivo)}\n\n`;
  }
  
  // Desarrollo de la clase
  markdownContent += `## DESARROLLO DE LA CLASE\n\n`;
  markdownContent += `${planeacion.contenido || ''}\n\n`;
  
  // Información adicional
  markdownContent += `*Fecha de creación: ${new Date(planeacion.created_at).toLocaleDateString("es-MX")}*\n`;
  
  // Procesar todo el contenido de manera consistente
  const content = markdownToHtml(markdownContent);
  
  // Generar PDF
  const title = cleanMarkdown(planeacion.titulo);
  const filename = `${title.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_')}_Planeacion.pdf`;
  
  generatePDFFromHTML(content, title, filename, false);
}
