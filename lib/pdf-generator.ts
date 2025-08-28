// Función para limpiar el texto de asteriscos y otros caracteres Markdown
import jsPDF from 'jspdf';

function cleanMarkdown(text: string): string {
  if (!text) return ""
  return text.replace(/\*\*/g, "").replace(/\*/g, "").replace(/__/g, "").replace(/_/g, "")
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

function processExamContent(content: string) {
  // Intentar parsear como JSON primero
  try {
    const examData = JSON.parse(content);
    if (examData.examen_contenido && examData.hoja_de_respuestas) {
      return {
        examContent: examData.examen_contenido,
        answerSheet: examData.hoja_de_respuestas,
        isStructured: true
      };
    }
  } catch (error) {
    // Si no es JSON válido, buscar JSON dentro del texto
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const examData = JSON.parse(jsonMatch[0]);
        if (examData.examen_contenido && examData.hoja_de_respuestas) {
          return {
            examContent: examData.examen_contenido,
            answerSheet: examData.hoja_de_respuestas,
            isStructured: true
          };
        }
      } catch (innerError) {
        // Continuar con el procesamiento normal
      }
    }
  }
  
  // Buscar patrones específicos que indiquen contenido estructurado
  const hasExamContent = content.includes('examen_contenido') || content.includes('Examen:');
  const hasAnswerSheet = content.includes('hoja_de_respuestas') || content.includes('Respuestas:') || content.includes('Hoja de respuestas:');
  
  if (hasExamContent && hasAnswerSheet) {
    // Intentar extraer las secciones manualmente
    const examMatch = content.match(/(?:examen_contenido["']?\s*[:=]\s*["']?|Examen:\s*)([\s\S]*?)(?=(?:hoja_de_respuestas|Respuestas:|Hoja de respuestas:)|$)/i);
    const answerMatch = content.match(/(?:hoja_de_respuestas["']?\s*[:=]\s*["']?|Respuestas:|Hoja de respuestas:)\s*([\s\S]*?)$/i);
    
    if (examMatch && answerMatch) {
      return {
        examContent: examMatch[1].trim().replace(/^["']|["']$/g, ''),
        answerSheet: answerMatch[1].trim().replace(/^["']|["']$/g, ''),
        isStructured: true
      };
    }
  }
  
  // Procesamiento normal para texto
  return {
    examContent: content,
    answerSheet: null,
    isStructured: false
  };
}

function generatePDFFromText(content: string, title: string, filename: string, isAnswerSheet: boolean = false): void {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });
  
  // Configuración de márgenes y dimensiones
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  const lineHeight = 6;
  let currentY = margin;
  
  // Función para agregar nueva página si es necesario
  const checkPageBreak = (neededHeight: number) => {
    if (currentY + neededHeight > pageHeight - margin) {
      pdf.addPage();
      currentY = margin;
    }
  };
  
  // Función para agregar texto con salto de línea automático
  const addText = (text: string, fontSize: number = 12, isBold: boolean = false) => {
    pdf.setFontSize(fontSize);
    pdf.setFont('helvetica', isBold ? 'bold' : 'normal');
    
    const lines = pdf.splitTextToSize(text, contentWidth);
    const textHeight = lines.length * lineHeight;
    
    checkPageBreak(textHeight);
    
    lines.forEach((line: string) => {
      pdf.text(line, margin, currentY);
      currentY += lineHeight;
    });
    
    currentY += 3; // Espacio adicional después del texto
  };
  
  // Encabezado
  addText(title, 18, true);
  addText(isAnswerSheet ? 'Hoja de Respuestas - EduPlanner' : 'Examen - EduPlanner', 12, false);
  
  // Línea separadora
  currentY += 5;
  pdf.setLineWidth(0.5);
  pdf.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 10;
  
  // Procesar contenido
  const processedContent = cleanMarkdown(content);
  const lines = processedContent.split('\n');
  
  lines.forEach(line => {
    line = line.trim();
    if (line === '') {
      currentY += 3;
      return;
    }
    
    // Detectar títulos
    if (line.startsWith('###')) {
      addText(line.replace('###', '').trim(), 14, true);
    } else if (line.startsWith('##')) {
      addText(line.replace('##', '').trim(), 16, true);
    } else if (line.startsWith('#')) {
      addText(line.replace('#', '').trim(), 18, true);
    } else if (line.startsWith('-') || line.startsWith('*')) {
      addText('• ' + line.substring(1).trim(), 12, false);
    } else {
      addText(line, 12, false);
    }
  });
  
  // Pie de página
  const footerY = pageHeight - 15;
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Generado por EduPlanner el ${new Date().toLocaleDateString('es-MX')}`, margin, footerY);
  
  // Descargar PDF
  pdf.save(filename);
  console.log('PDF generado exitosamente:', filename);
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
    fullContent = `Materia: ${cleanMarkdown(examen.subject)}\n\n${examContent}`;
  }
  
  generatePDFFromText(fullContent, examTitle, examFilename, false);
  
  console.log('PDF del examen generado. Hoja de respuestas disponible por separado:', { isStructured, hasAnswerSheet: !!answerSheet });
}

export function generateAnswerSheetPDF(examen: any, answerSheet: string): void {
  const answerTitle = `${cleanMarkdown(examen.title || 'Examen')} - Hoja de Respuestas`;
  const answerFilename = `${cleanMarkdown(examen.title || 'Examen').replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_')}_Respuestas.pdf`;
  
  // Agregar información de la materia al contenido si existe
  let fullContent = answerSheet;
  if (examen.subject) {
    fullContent = `Materia: ${cleanMarkdown(examen.subject)}\n\n${answerSheet}`;
  }
  
  generatePDFFromText(fullContent, answerTitle, answerFilename, true);
}

export function generatePDF(planeacion: any): void {
  // Crear contenido de texto estructurado
  let content = `${cleanMarkdown(planeacion.titulo)}\n\n`;
  content += `PLANEACIÓN DIDÁCTICA - EDUPLANNER\n\n`;
  
  // Información básica
  content += `INFORMACIÓN GENERAL\n`;
  content += `Materia: ${cleanMarkdown(planeacion.materia) || "No especificada"}\n`;
  content += `Grado: ${cleanMarkdown(planeacion.grado) || "No especificado"}\n`;
  content += `Duración: ${cleanMarkdown(planeacion.duracion) || "No especificada"}\n`;
  content += `Estado: ${planeacion.estado.charAt(0).toUpperCase() + planeacion.estado.slice(1)}\n\n`;
  
  // Objetivo si existe
  if (planeacion.objetivo) {
    content += `OBJETIVO DE APRENDIZAJE\n`;
    content += `${cleanMarkdown(planeacion.objetivo)}\n\n`;
  }
  
  // Desarrollo de la clase
  content += `DESARROLLO DE LA CLASE\n`;
  content += `${cleanMarkdown(planeacion.contenido)}\n\n`;
  
  // Información adicional
  content += `Fecha de creación: ${new Date(planeacion.created_at).toLocaleDateString("es-MX")}`;
  
  // Generar PDF usando la función de texto
  const title = cleanMarkdown(planeacion.titulo);
  const filename = `${title.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_')}_Planeacion.pdf`;
  
  generatePDFFromText(content, title, filename, false);
}
