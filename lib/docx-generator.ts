import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, UnderlineType } from "docx";

// Función para convertir HTML a texto plano preservando formato
function htmlToPlainText(html: string): string {
  if (!html || typeof html !== 'string') return '';
  
  return html
    // Convertir etiquetas de encabezados a markdown
    .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n')
    .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n')
    .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n')
    .replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n')
    .replace(/<h5[^>]*>(.*?)<\/h5>/gi, '##### $1\n')
    .replace(/<h6[^>]*>(.*?)<\/h6>/gi, '###### $1\n')
    
    // Convertir etiquetas de formato a markdown
    .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
    .replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
    .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
    .replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*')
    .replace(/<u[^>]*>(.*?)<\/u>/gi, '__$1__')
    
    // Convertir listas manteniendo estructura
    .replace(/<ul[^>]*>/gi, '')
    .replace(/<\/ul>/gi, '\n')
    .replace(/<ol[^>]*>/gi, '')
    .replace(/<\/ol>/gi, '\n')
    .replace(/<li[^>]*>(.*?)<\/li>/gi, '• $1\n')
    
    // Convertir párrafos y saltos de línea preservando espacios
    .replace(/<p[^>]*>/gi, '')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<br[^>]*\/?>/gi, '\n')
    .replace(/<div[^>]*>/gi, '')
    .replace(/<\/div>/gi, '\n')
    
    // Remover todas las demás etiquetas HTML
    .replace(/<[^>]*>/g, '')
    
    // Decodificar entidades HTML comunes
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    
    // Preservar espacios múltiples y tabulaciones
    .replace(/\t/g, '    ') // Convertir tabs a 4 espacios
    // NO eliminar espacios múltiples para preservar formato
    .replace(/\n{3,}/g, '\n\n') // Limitar a máximo 2 saltos de línea consecutivos
    .trim();
}

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
  
  // Convertir HTML a texto plano/markdown primero
  const plainTextContent = htmlToPlainText(content);
  
  // Limpiar el contenido de caracteres problemáticos
  const cleanContent = plainTextContent.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, '');
  
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
      
      // Detectar indentación del texto original
      const leadingSpaces = line.length - line.trimStart().length;
      const indentLevel = Math.floor(leadingSpaces / 4); // Cada 4 espacios = 1 nivel de indentación
      
      try {
        if (trimmedLine.startsWith('### ')) {
          // Subtítulo nivel 3
          const headingText = trimmedLine.substring(4).trim();
          if (headingText) {
            paragraphs.push(new Paragraph({
              children: processMarkdownText(headingText),
              heading: HeadingLevel.HEADING_3,
              indent: {
                left: indentLevel * 360 // 360 twips = 0.25 pulgadas por nivel
              },
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
              indent: {
                left: indentLevel * 360
              },
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
              indent: {
                left: indentLevel * 360
              },
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
                left: 720 + (indentLevel * 360) // Indentación base + indentación adicional
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
                left: 720 + (indentLevel * 360) // Indentación base + indentación adicional
              },
              spacing: {
                after: 60
              }
            }));
          }
        } else {
          // Párrafo normal con indentación preservada
          paragraphs.push(new Paragraph({
            children: processMarkdownText(trimmedLine),
            indent: {
              left: indentLevel * 360 // Preservar indentación original
            },
            spacing: {
              after: 120
            }
          }));
        }
      } catch (lineError) {
        console.warn(`Error procesando línea: "${trimmedLine}"`, lineError);
        // Fallback: agregar como párrafo simple con indentación preservada
        paragraphs.push(new Paragraph({
          children: [new TextRun(trimmedLine)],
          indent: {
            left: indentLevel * 360 // Preservar indentación original
          },
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
          
          const objetivoPlainText = htmlToPlainText(String(planeacion.objetivo));
          const objetivoParagraphs = processContent(objetivoPlainText);
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

export async function generateProyectoDocx(proyecto: any): Promise<void> {
  try {
    // Validar que proyecto existe y es un objeto
    if (!proyecto || typeof proyecto !== 'object') {
      throw new Error('Datos de proyecto inválidos');
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
      const titulo = proyecto.nombre || "Proyecto Educativo";
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
        `Nombre del Proyecto: ${String(proyecto.nombre || "No especificado")}`,
        `Grupo: ${String(proyecto.grupos?.nombre || "No especificado")} - ${String(proyecto.grupos?.grado || "")}° ${String(proyecto.grupos?.nivel || "")}`,
        `Metodología: ${String(proyecto.metodologia_nem || "No especificada")}`,
        `Estado: ${proyecto.estado ? String(proyecto.estado).charAt(0).toUpperCase() + String(proyecto.estado).slice(1) : "No especificado"}`
      ];
      
      infoItems.forEach(item => {
        try {
          documentChildren.push(new Paragraph({
            children: processMarkdownText(item),
            spacing: {
              after: 120
            }
          }));
        } catch (itemError) {
          console.warn('Error procesando item de información:', itemError);
          documentChildren.push(new Paragraph({
            children: [new TextRun("Error procesando información")],
            spacing: { after: 120 }
          }));
        }
      });
      
      addSpacing();
      
      // Problemática
      if (proyecto.problematica) {
        try {
          documentChildren.push(new Paragraph({
            children: [new TextRun("PROBLEMÁTICA")],
            heading: HeadingLevel.HEADING_2,
            spacing: {
              before: 240,
              after: 120
            }
          }));
          
          documentChildren.push(new Paragraph({
            children: processMarkdownText(String(proyecto.problematica)),
            spacing: {
              after: 200
            }
          }));
        } catch (problematicaError) {
          console.warn('Error procesando problemática:', problematicaError);
        }
      }
      
      // Producto Final
      if (proyecto.producto_final) {
        try {
          documentChildren.push(new Paragraph({
            children: [new TextRun("PRODUCTO FINAL")],
            heading: HeadingLevel.HEADING_2,
            spacing: {
              before: 240,
              after: 120
            }
          }));
          
          documentChildren.push(new Paragraph({
            children: processMarkdownText(String(proyecto.producto_final)),
            spacing: {
              after: 200
            }
          }));
        } catch (productoError) {
          console.warn('Error procesando producto final:', productoError);
        }
      }
      
      // PDAs Seleccionados
      if (proyecto.proyecto_curriculo && Array.isArray(proyecto.proyecto_curriculo) && proyecto.proyecto_curriculo.length > 0) {
        try {
          documentChildren.push(new Paragraph({
            children: [new TextRun("PDAs SELECCIONADOS")],
            heading: HeadingLevel.HEADING_2,
            spacing: {
              before: 240,
              after: 120
            }
          }));
          
          proyecto.proyecto_curriculo.forEach((pc: any) => {
            try {
              if (pc.curriculo_sep) {
                // Campo formativo
                documentChildren.push(new Paragraph({
                  children: processMarkdownText(String(pc.curriculo_sep.campo_formativo || "Campo Formativo")),
                  heading: HeadingLevel.HEADING_3,
                  spacing: {
                    before: 200,
                    after: 120
                  }
                }));
                
                // PDA
                if (pc.curriculo_sep.pda) {
                  documentChildren.push(new Paragraph({
                    children: [
                      new TextRun({
                        text: "PDA: ",
                        bold: true
                      }),
                      ...processMarkdownText(String(pc.curriculo_sep.pda))
                    ],
                    spacing: {
                      after: 120
                    }
                  }));
                }
                
                // Contenido
                if (pc.curriculo_sep.contenido) {
                  documentChildren.push(new Paragraph({
                    children: processMarkdownText(String(pc.curriculo_sep.contenido)),
                    spacing: {
                      after: 200
                    }
                  }));
                }
              }
            } catch (pdaError) {
              console.warn('Error procesando PDA:', pdaError);
            }
          });
        } catch (pdasError) {
          console.warn('Error procesando PDAs:', pdasError);
        }
      }
      
      // Fases del Proyecto
      if (proyecto.proyecto_fases && Array.isArray(proyecto.proyecto_fases) && proyecto.proyecto_fases.length > 0) {
        try {
          documentChildren.push(new Paragraph({
            children: [new TextRun("FASES Y MOMENTOS DEL PROYECTO")],
            heading: HeadingLevel.HEADING_2,
            spacing: {
              before: 240,
              after: 120
            }
          }));
          
          // Ordenar fases por orden
          const fasesOrdenadas = [...proyecto.proyecto_fases].sort((a: any, b: any) => (a.orden || 0) - (b.orden || 0));
          
          fasesOrdenadas.forEach((fase: any) => {
            try {
              // Nombre de la fase
              if (fase.fase_nombre) {
                documentChildren.push(new Paragraph({
                  children: processMarkdownText(String(fase.fase_nombre)),
                  heading: HeadingLevel.HEADING_3,
                  spacing: {
                    before: 200,
                    after: 120
                  }
                }));
              }
              
              // Momento
              if (fase.momento_nombre) {
                documentChildren.push(new Paragraph({
                  children: [
                    new TextRun({
                      text: String(fase.momento_nombre),
                      bold: true
                    })
                  ],
                  spacing: {
                    after: 120
                  }
                }));
              }
              
              // Contenido
              if (fase.contenido) {
                documentChildren.push(new Paragraph({
                  children: processMarkdownText(String(fase.contenido)),
                  spacing: {
                    after: 200
                  }
                }));
              }
            } catch (faseError) {
              console.warn('Error procesando fase:', faseError);
            }
          });
        } catch (fasesError) {
          console.warn('Error procesando fases:', fasesError);
        }
      } else {
        // Si no hay fases
        try {
          documentChildren.push(new Paragraph({
            children: [new TextRun("FASES Y MOMENTOS DEL PROYECTO")],
            heading: HeadingLevel.HEADING_2,
            spacing: {
              before: 240,
              after: 120
            }
          }));
          
          documentChildren.push(new Paragraph({
            children: [new TextRun("No se generaron fases para este proyecto.")],
            spacing: {
              after: 200
            }
          }));
        } catch (noFasesError) {
          console.warn('Error procesando mensaje de no fases:', noFasesError);
        }
      }
      
    } catch (contentError) {
      console.warn('Error procesando contenido del proyecto:', contentError);
      documentChildren.push(new Paragraph({
        children: [new TextRun("Error procesando contenido del proyecto")],
        spacing: { after: 200 }
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
      
      if (proyecto.created_at) {
        try {
          const createdDate = new Date(proyecto.created_at).toLocaleDateString("es-MX");
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
      const safeFilename = String(proyecto.nombre || "Proyecto")
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .replace(/\s+/g, '_')
        .substring(0, 50);
      
      link.download = `${safeFilename}_Proyecto.docx`;
    } catch (filenameError) {
      console.warn('Error creando nombre de archivo:', filenameError);
      link.download = "Proyecto.docx";
    }
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
  } catch (error) {
    console.error('Error generando documento Word del proyecto:', error);
    throw new Error(`Error al generar el documento Word del proyecto: ${(error as Error).message ?? 'Unknown error'}`);
  }
}