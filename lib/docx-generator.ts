import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, UnderlineType } from "docx";

// Función para procesar texto Markdown y convertirlo a elementos de Word
function processMarkdownText(text: string): TextRun[] {
  if (!text || typeof text !== 'string') return [new TextRun("")];
  
  // Limpiar el texto de caracteres problemáticos
  const cleanText = text.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, '');
  
  const runs: TextRun[] = [];
  
  try {
    // Expresión regular más robusta para capturar markdown
    const markdownRegex = /(\*\*[^*]+\*\*|\*[^*]+\*|__[^_]+__|_[^_]+_)/g;
    let lastIndex = 0;
    let match;
    
    while ((match = markdownRegex.exec(cleanText)) !== null) {
      // Agregar texto antes del match
      if (match.index > lastIndex) {
        const beforeText = cleanText.substring(lastIndex, match.index);
        if (beforeText) {
          runs.push(new TextRun(beforeText));
        }
      }
      
      const matchedText = match[0];
      
      if (matchedText.startsWith('**') && matchedText.endsWith('**') && matchedText.length > 4) {
        // Texto en negrita
        runs.push(new TextRun({
          text: matchedText.slice(2, -2),
          bold: true
        }));
      } else if (matchedText.startsWith('__') && matchedText.endsWith('__') && matchedText.length > 4) {
        // Texto subrayado
        runs.push(new TextRun({
          text: matchedText.slice(2, -2),
          underline: {
            type: UnderlineType.SINGLE
          }
        }));
      } else if (matchedText.startsWith('*') && matchedText.endsWith('*') && matchedText.length > 2) {
        // Texto en cursiva
        runs.push(new TextRun({
          text: matchedText.slice(1, -1),
          italics: true
        }));
      } else if (matchedText.startsWith('_') && matchedText.endsWith('_') && matchedText.length > 2) {
        // Texto en cursiva alternativo
        runs.push(new TextRun({
          text: matchedText.slice(1, -1),
          italics: true
        }));
      } else {
        // Si no coincide con ningún patrón, agregar como texto normal
        runs.push(new TextRun(matchedText));
      }
      
      lastIndex = match.index + matchedText.length;
    }
    
    // Agregar texto restante
    if (lastIndex < cleanText.length) {
      const remainingText = cleanText.substring(lastIndex);
      if (remainingText) {
        runs.push(new TextRun(remainingText));
      }
    }
    
    // Si no se encontraron matches, devolver el texto completo
    if (runs.length === 0) {
      runs.push(new TextRun(cleanText));
    }
    
  } catch (error) {
    console.warn('Error procesando markdown:', error);
    // Fallback: devolver texto sin formato
    runs.push(new TextRun(cleanText));
  }
  
  return runs;
}

// Función para procesar contenido con múltiples párrafos y listas
function processContent(content: string): Paragraph[] {
  if (!content || typeof content !== 'string') return [];
  
  // Limpiar el contenido de caracteres problemáticos
  const cleanContent = content.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, '');
  
  const paragraphs: Paragraph[] = [];
  const lines = cleanContent.split('\n');
  
  try {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();
      
      if (!trimmedLine) {
        // Línea vacía - agregar espacio pequeño
        paragraphs.push(new Paragraph({ 
          children: [new TextRun("")],
          spacing: {
            after: 120 // Espacio pequeño después
          }
        }));
        continue;
      }
      
      try {
        if (trimmedLine.startsWith('### ')) {
          // Subtítulo nivel 3
          const headingText = trimmedLine.substring(4).trim();
          if (headingText) {
            paragraphs.push(new Paragraph({
              children: processMarkdownText(headingText),
              heading: HeadingLevel.HEADING_3,
              spacing: {
                before: 240,
                after: 120
              }
            }));
          }
        } else if (trimmedLine.startsWith('## ')) {
          // Subtítulo nivel 2
          const headingText = trimmedLine.substring(3).trim();
          if (headingText) {
            paragraphs.push(new Paragraph({
              children: processMarkdownText(headingText),
              heading: HeadingLevel.HEADING_2,
              spacing: {
                before: 240,
                after: 120
              }
            }));
          }
        } else if (trimmedLine.startsWith('# ')) {
          // Título nivel 1
          const headingText = trimmedLine.substring(2).trim();
          if (headingText) {
            paragraphs.push(new Paragraph({
              children: processMarkdownText(headingText),
              heading: HeadingLevel.HEADING_1,
              spacing: {
                before: 240,
                after: 120
              }
            }));
          }
        } else if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
          // Lista con viñetas
          const listText = trimmedLine.substring(2).trim();
          if (listText) {
            paragraphs.push(new Paragraph({
              children: [
                new TextRun("• "),
                ...processMarkdownText(listText)
              ],
              indent: {
                left: 720 // Indentación de 0.5 pulgadas
              },
              spacing: {
                after: 60
              }
            }));
          }
        } else if (/^\d+\. /.test(trimmedLine)) {
          // Lista numerada
          const match = trimmedLine.match(/^(\d+)\. (.*)/);
          if (match && match[2].trim()) {
            paragraphs.push(new Paragraph({
              children: [
                new TextRun(`${match[1]}. `),
                ...processMarkdownText(match[2].trim())
              ],
              indent: {
                left: 720 // Indentación de 0.5 pulgadas
              },
              spacing: {
                after: 60
              }
            }));
          }
        } else {
          // Párrafo normal
          paragraphs.push(new Paragraph({
            children: processMarkdownText(trimmedLine),
            spacing: {
              after: 120
            }
          }));
        }
      } catch (lineError) {
        console.warn(`Error procesando línea: "${trimmedLine}"`, lineError);
        // Fallback: agregar como párrafo simple
        paragraphs.push(new Paragraph({
          children: [new TextRun(trimmedLine)],
          spacing: {
            after: 120
          }
        }));
      }
    }
  } catch (error) {
    console.warn('Error procesando contenido:', error);
    // Fallback: crear un párrafo simple con todo el contenido
    paragraphs.push(new Paragraph({
      children: [new TextRun(cleanContent)]
    }));
  }
  
  return paragraphs;
}

export async function generateDocx(planeacion: any): Promise<void> {
  try {
    // Validar que planeacion existe y es un objeto
    if (!planeacion || typeof planeacion !== 'object') {
      throw new Error('Datos de planeación inválidos');
    }

    // Crear los elementos del documento
    const documentChildren: Paragraph[] = [];
    
    // Función helper para agregar espacios de manera consistente
    const addSpacing = () => {
      documentChildren.push(new Paragraph({ 
        children: [new TextRun("")],
        spacing: { after: 200 }
      }));
    };
    
    try {
      // Título principal
      const titulo = planeacion.titulo || "Planeación Didáctica";
      documentChildren.push(new Paragraph({
        children: processMarkdownText(titulo),
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        spacing: {
          after: 400
        }
      }));
      
      addSpacing();
      
      // Información general
      documentChildren.push(new Paragraph({
        children: [new TextRun("INFORMACIÓN GENERAL")],
        heading: HeadingLevel.HEADING_2,
        spacing: {
          before: 240,
          after: 120
        }
      }));
      
      // Información básica con validación
      const infoItems = [
        `Materia: ${String(planeacion.materia || "No especificada")}`,
        `Grado: ${String(planeacion.grado || "No especificado")}`,
        `Duración: ${String(planeacion.duracion || "No especificada")}`,
        `Estado: ${planeacion.estado ? String(planeacion.estado).charAt(0).toUpperCase() + String(planeacion.estado).slice(1) : "No especificado"}`
      ];
      
      infoItems.forEach(item => {
        try {
          documentChildren.push(new Paragraph({
            children: [
              new TextRun("• "),
              ...processMarkdownText(item)
            ],
            indent: {
              left: 360
            },
            spacing: {
              after: 60
            }
          }));
        } catch (itemError) {
          console.warn('Error procesando item de información:', itemError);
          documentChildren.push(new Paragraph({
            children: [new TextRun(`• ${item}`)],
            indent: { left: 360 },
            spacing: { after: 60 }
          }));
        }
      });
      
      addSpacing();
      
      // Objetivo de aprendizaje si existe
      if (planeacion.objetivo && String(planeacion.objetivo).trim()) {
        try {
          documentChildren.push(new Paragraph({
            children: [new TextRun("OBJETIVO DE APRENDIZAJE")],
            heading: HeadingLevel.HEADING_2,
            spacing: {
              before: 240,
              after: 120
            }
          }));
          
          const objetivoParagraphs = processContent(String(planeacion.objetivo));
          documentChildren.push(...objetivoParagraphs);
          
          addSpacing();
        } catch (objetivoError) {
          console.warn('Error procesando objetivo:', objetivoError);
          documentChildren.push(new Paragraph({
            children: [new TextRun("OBJETIVO DE APRENDIZAJE")],
            heading: HeadingLevel.HEADING_2
          }));
          documentChildren.push(new Paragraph({
            children: [new TextRun(String(planeacion.objetivo))]
          }));
          addSpacing();
        }
      }
      
      // Desarrollo de la clase
      documentChildren.push(new Paragraph({
        children: [new TextRun("DESARROLLO DE LA CLASE")],
        heading: HeadingLevel.HEADING_2,
        spacing: {
          before: 240,
          after: 120
        }
      }));
      
      try {
        const contenido = planeacion.contenido || "No hay contenido disponible";
        const contenidoParagraphs = processContent(String(contenido));
        documentChildren.push(...contenidoParagraphs);
      } catch (contenidoError) {
        console.warn('Error procesando contenido:', contenidoError);
        documentChildren.push(new Paragraph({
          children: [new TextRun(String(planeacion.contenido || "No hay contenido disponible"))]
        }));
      }
      
      addSpacing();
      addSpacing();
      
    } catch (sectionError) {
      console.warn('Error procesando sección del documento:', sectionError);
      // Agregar contenido mínimo en caso de error
      documentChildren.push(new Paragraph({
        children: [new TextRun("Error al procesar el documento. Contenido básico:")],
        heading: HeadingLevel.HEADING_1
      }));
      documentChildren.push(new Paragraph({
        children: [new TextRun(JSON.stringify(planeacion, null, 2))]
      }));
    }
    
    // Información de generación
    try {
      const currentDate = new Date().toLocaleDateString("es-MX");
      documentChildren.push(new Paragraph({
        children: [
          new TextRun({
            text: `Generado por EduPlanner el ${currentDate}`,
            italics: true,
            size: 20 // 10pt
          })
        ],
        alignment: AlignmentType.CENTER,
        spacing: {
          before: 400
        }
      }));
      
      if (planeacion.created_at) {
        try {
          const createdDate = new Date(planeacion.created_at).toLocaleDateString("es-MX");
          documentChildren.push(new Paragraph({
            children: [
              new TextRun({
                text: `Fecha de creación: ${createdDate}`,
                italics: true,
                size: 20 // 10pt
              })
            ],
            alignment: AlignmentType.CENTER
          }));
        } catch (dateError) {
          console.warn('Error procesando fecha de creación:', dateError);
        }
      }
    } catch (footerError) {
      console.warn('Error agregando información de generación:', footerError);
    }
    
    // Crear el documento
    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: 1440,    // 1 pulgada
                right: 1440,  // 1 pulgada
                bottom: 1440, // 1 pulgada
                left: 1440,   // 1 pulgada
              },
            },
          },
          children: documentChildren,
        },
       ],
     });

    const buffer = await Packer.toBuffer(doc);

    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    
    // Crear nombre de archivo más limpio
    try {
      const titulo = String(planeacion.titulo || "Planeacion");
      const fileName = titulo
        .replace(/[^a-zA-Z0-9\s\u00C0-\u017F]/g, "") // Permitir caracteres acentuados
        .replace(/\s+/g, "_")
        .substring(0, 50); // Limitar longitud
      
      link.download = `${fileName || "Planeacion"}.docx`;
    } catch (nameError) {
      console.warn('Error generando nombre de archivo:', nameError);
      link.download = "Planeacion.docx";
    }
    
    try {
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (downloadError) {
      console.error('Error durante la descarga:', downloadError);
      URL.revokeObjectURL(url);
      throw new Error('Error al descargar el archivo Word');
    }
    
  } catch (error) {
    console.error('Error generando documento Word:', error);
    throw new Error(`Error al generar el documento Word: ${(error as Error).message ?? 'Unknown error'}`);
  }
}