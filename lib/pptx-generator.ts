// Función para limpiar texto de caracteres problemáticos
function cleanText(text: string): string {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Eliminar caracteres de control
    .replace(/[\u2018\u2019]/g, "'") // Comillas simples curvas
    .replace(/[\u201C\u201D]/g, '"') // Comillas dobles curvas
    .replace(/\u2013/g, '-') // En dash
    .replace(/\u2014/g, '--') // Em dash
    .replace(/\u2026/g, '...') // Ellipsis
    .trim();
}

// Función para procesar texto markdown básico
function processMarkdownText(text: string): string {
  if (!text || typeof text !== 'string') return '';
  
  let processed = cleanText(text);
  
  // Eliminar encabezados markdown
  processed = processed.replace(/^#{1,6}\s+/gm, '');
  
  // Eliminar formato de lista
  processed = processed.replace(/^[\s]*[-*+]\s+/gm, '• ');
  processed = processed.replace(/^[\s]*\d+\.\s+/gm, '');
  
  // Eliminar formato de código
  processed = processed.replace(/`([^`]+)`/g, '$1');
  processed = processed.replace(/```[\s\S]*?```/g, '');
  
  // Eliminar enlaces markdown
  processed = processed.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  
  return processed;
}

// Función para crear contenido de diapositiva
function createSlideContent(title: string, content: string): string {
  const processedTitle = processMarkdownText(title);
  const processedContent = processMarkdownText(content);
  
  return `${processedTitle}\n\n${processedContent}`;
}

// Función para procesar contenido con múltiples párrafos y listas
function processContent(content: string): string[] {
  if (!content || typeof content !== 'string') return [];
  
  const cleanContent = cleanText(content);
  const lines = cleanContent.split('\n');
  const processedLines: string[] = [];
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    if (!trimmedLine) {
      processedLines.push(''); // Línea vacía
      continue;
    }
    
    if (trimmedLine.startsWith('### ')) {
      processedLines.push(processMarkdownText(trimmedLine.substring(4)));
    } else if (trimmedLine.startsWith('## ')) {
      processedLines.push(processMarkdownText(trimmedLine.substring(3)));
    } else if (trimmedLine.startsWith('# ')) {
      processedLines.push(processMarkdownText(trimmedLine.substring(2)));
    } else if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
      processedLines.push('• ' + processMarkdownText(trimmedLine.substring(2)));
    } else if (/^\d+\. /.test(trimmedLine)) {
      const match = trimmedLine.match(/^(\d+)\. (.*)/);
      if (match && match[2].trim()) {
        processedLines.push(`${match[1]}. ${processMarkdownText(match[2])}`);
      }
    } else {
      processedLines.push(processMarkdownText(trimmedLine));
    }
  }
  
  return processedLines.filter(line => line.trim() !== '');
}

// Función para agregar texto a una diapositiva con formato automático
function addTextToSlide(slide: any, text: string, options: any = {}) {
  const defaultOptions = {
    x: 0.5,
    y: options.y || 1,
    w: 9,
    h: 1,
    fontSize: options.fontSize || 14,
    color: options.color || '363636',
    align: options.align || 'left',
    valign: options.valign || 'top',
    ...options
  };
  
  slide.addText(text, defaultOptions);
}

// Función para agregar una lista de elementos a una diapositiva
function addListToSlide(slide: any, items: string[], startY: number = 2) {
  let currentY = startY;
  
  items.forEach((item, index) => {
    if (item.trim()) {
      addTextToSlide(slide, item, {
        y: currentY,
        fontSize: 12,
        h: 0.5
      });
      currentY += 0.6;
    }
  });
  
  return currentY;
}

export async function generatePptx(planningData: any) {
  try {
    // Send planning data to AI API to generate presentation content
    const response = await fetch('/api/generate-presentation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [{
          role: 'user',
          content: `Genera una presentación basada en esta planeación: ${JSON.stringify(planningData)}`
        }]
      })
    });

    if (!response.ok) {
      throw new Error('Error al generar contenido de presentación');
    }

    // Read the streaming response
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let aiResponse = '';

    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        console.log('Received chunk:', chunk);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.trim()) {
            console.log('Processing line:', line);
            if (line.startsWith('0:')) {
              try {
                const jsonStr = line.substring(2);
                const parsed = JSON.parse(jsonStr);
                console.log('Parsed chunk data:', parsed);
                // Acumular directamente el contenido de texto
                aiResponse += parsed;
              } catch (e) {
                console.log('Error parsing chunk:', e);
                // Si no se puede parsear como JSON, agregar el contenido directamente
                aiResponse += line.substring(2);
              }
            }
          }
        }
      }
    }
    
    console.log('Final AI response length:', aiResponse.length);
    console.log('Final AI response preview:', aiResponse.substring(0, 200));

    // Extract JSON from AI response
    let presentationData;
    try {
      console.log('AI Response:', aiResponse);
      
      // Clean the response - remove any markdown code blocks or extra text
      let cleanResponse = aiResponse.trim();
      
      // Remove markdown code blocks if present
      cleanResponse = cleanResponse.replace(/```json\s*/, '').replace(/```\s*$/, '');
      
      // Find JSON in the response - look for the first { and last }
      const firstBrace = cleanResponse.indexOf('{');
      const lastBrace = cleanResponse.lastIndexOf('}');
      
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        const jsonStr = cleanResponse.substring(firstBrace, lastBrace + 1);
        console.log('Extracted JSON:', jsonStr);
        presentationData = JSON.parse(jsonStr);
        
        // Validate the structure
        if (!presentationData.titulo || !presentationData.diapositivas || !Array.isArray(presentationData.diapositivas)) {
          throw new Error('Estructura JSON inválida');
        }
      } else {
        throw new Error('No se encontró JSON válido en la respuesta');
      }
    } catch (error) {
      console.error('Error parsing AI response:', error);
      console.error('Raw AI response:', aiResponse);
      
      // Fallback to basic presentation
      presentationData = {
        titulo: planningData.materia || 'Presentación',
        subtitulo: `Grado: ${planningData.grado || 'No especificado'}`,
        tema_color: '#3498db',
        diapositivas: [
          {
            tipo: 'portada',
            titulo: planningData.materia || 'Planeación Didáctica',
            subtitulo: `Grado: ${planningData.grado || 'No especificado'}`,
            descripcion_imagen: 'Imagen educativa relacionada con el tema'
          },
          {
            tipo: 'contenido',
            titulo: 'Contenido de la Planeación',
            puntos: [
              planningData.proposito || 'Propósito de la clase',
              planningData.aprendizajes || 'Aprendizajes esperados',
              planningData.actividades || 'Actividades principales'
            ],
            descripcion_imagen: 'Imagen relacionada con el contenido'
          },
          {
            tipo: 'cierre',
            titulo: 'Resumen',
            resumen: 'Puntos clave de la planeación didáctica',
            pregunta_reflexion: '¿Qué aprendimos hoy?'
          }
        ]
      };
    }

    // Generate PowerPoint presentation via server API
    try {
      const response = await fetch('/api/generate-pptx', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ presentationData })
      });

      if (!response.ok) {
        throw new Error('Error al generar la presentación PowerPoint');
      }

      // Get the file as a blob
      const blob = await response.blob();
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `presentacion-${presentationData.titulo.replace(/[^a-zA-Z0-9]/g, '-')}.pptx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      return { success: true, message: 'Presentación PowerPoint generada exitosamente' };
    } catch (error) {
      console.error('Error generating PowerPoint:', error);
      throw new Error('Error al generar la presentación PowerPoint');
    }
  } catch (error) {
    console.error('Error generating presentation:', error);
    return { success: false, message: 'Error al generar la presentación' };
  }
}

function generateHTMLPresentation(data: any): string {
  const slides = data.diapositivas.map((slide: any, index: number) => {
    switch (slide.tipo) {
      case 'portada':
        return `
        <div class="slide portada" data-slide="${index + 1}">
          <div class="slide-content">
            <h1 class="titulo-principal">${slide.titulo}</h1>
            <h2 class="subtitulo">${slide.subtitulo}</h2>
            <div class="imagen-placeholder">
              <div class="imagen-descripcion">📚 ${slide.descripcion_imagen}</div>
            </div>
          </div>
        </div>`;
      
      case 'contenido':
        return `
        <div class="slide contenido" data-slide="${index + 1}">
          <div class="slide-content">
            <h1>${slide.titulo}</h1>
            <div class="contenido-principal">
              <ul class="puntos-clave">
                ${slide.puntos?.map((punto: string) => `<li>${punto}</li>`).join('') || ''}
              </ul>
              ${slide.descripcion_imagen ? `
              <div class="imagen-placeholder">
                <div class="imagen-descripcion">🖼️ ${slide.descripcion_imagen}</div>
              </div>` : ''}
              ${slide.actividad_interactiva ? `
              <div class="actividad-box">
                <h3>💡 Actividad Interactiva</h3>
                <p>${slide.actividad_interactiva}</p>
              </div>` : ''}
            </div>
          </div>
        </div>`;
      
      case 'actividad':
        return `
        <div class="slide actividad" data-slide="${index + 1}">
          <div class="slide-content">
            <h1>🎯 ${slide.titulo}</h1>
            <div class="actividad-contenido">
              <div class="instrucciones">
                <h3>Instrucciones:</h3>
                <p>${slide.instrucciones}</p>
              </div>
              ${slide.descripcion_imagen ? `
              <div class="imagen-placeholder">
                <div class="imagen-descripcion">🎨 ${slide.descripcion_imagen}</div>
              </div>` : ''}
            </div>
          </div>
        </div>`;
      
      case 'cierre':
        return `
        <div class="slide cierre" data-slide="${index + 1}">
          <div class="slide-content">
            <h1>✅ ${slide.titulo}</h1>
            <div class="cierre-contenido">
              <div class="resumen">
                <h3>Resumen:</h3>
                <p>${slide.resumen}</p>
              </div>
              ${slide.pregunta_reflexion ? `
              <div class="reflexion">
                <h3>💭 Reflexión:</h3>
                <p>${slide.pregunta_reflexion}</p>
              </div>` : ''}
            </div>
          </div>
        </div>`;
      
      default:
        return `
        <div class="slide" data-slide="${index + 1}">
          <div class="slide-content">
            <h1>${slide.titulo || 'Diapositiva'}</h1>
            <p>Contenido de la diapositiva</p>
          </div>
        </div>`;
    }
  }).join('');

  return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${data.titulo}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, ${data.tema_color || '#3498db'} 0%, ${adjustColor(data.tema_color || '#3498db', -30)} 100%);
            color: #333;
            overflow-x: hidden;
        }
        
        .presentation-container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .slide {
            background: white;
            margin: 30px 0;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            min-height: 600px;
            display: flex;
            align-items: center;
            page-break-after: always;
            position: relative;
            overflow: hidden;
        }
        
        .slide::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 5px;
            background: ${data.tema_color || '#3498db'};
        }
        
        .slide-content {
            padding: 60px;
            width: 100%;
        }
        
        .portada {
            background: linear-gradient(135deg, ${data.tema_color || '#3498db'} 0%, ${adjustColor(data.tema_color || '#3498db', -20)} 100%);
            color: white;
            text-align: center;
        }
        
        .titulo-principal {
            font-size: 3.5em;
            font-weight: bold;
            margin-bottom: 20px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        
        .subtitulo {
            font-size: 1.8em;
            margin-bottom: 40px;
            opacity: 0.9;
        }
        
        .slide h1 {
            font-size: 2.5em;
            color: ${data.tema_color || '#3498db'};
            margin-bottom: 30px;
            border-bottom: 3px solid ${data.tema_color || '#3498db'};
            padding-bottom: 15px;
        }
        
        .slide h3 {
            color: ${data.tema_color || '#3498db'};
            margin-bottom: 15px;
            font-size: 1.3em;
        }
        
        .puntos-clave {
            list-style: none;
            font-size: 1.3em;
            line-height: 1.8;
        }
        
        .puntos-clave li {
            margin: 15px 0;
            padding-left: 30px;
            position: relative;
        }
        
        .puntos-clave li::before {
            content: '▶';
            color: ${data.tema_color || '#3498db'};
            font-weight: bold;
            position: absolute;
            left: 0;
        }
        
        .imagen-placeholder {
            background: linear-gradient(45deg, #f8f9fa 25%, transparent 25%), 
                        linear-gradient(-45deg, #f8f9fa 25%, transparent 25%), 
                        linear-gradient(45deg, transparent 75%, #f8f9fa 75%), 
                        linear-gradient(-45deg, transparent 75%, #f8f9fa 75%);
            background-size: 20px 20px;
            background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
            border: 2px dashed #ddd;
            border-radius: 10px;
            padding: 40px;
            margin: 30px 0;
            text-align: center;
            min-height: 200px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .imagen-descripcion {
            font-size: 1.2em;
            color: #666;
            font-style: italic;
        }
        
        .actividad-box {
            background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%);
            border: 2px solid #f39c12;
            border-radius: 10px;
            padding: 25px;
            margin: 30px 0;
        }
        
        .actividad-box h3 {
            color: #d68910;
            margin-bottom: 15px;
        }
        
        .instrucciones {
            background: #e8f5e8;
            border-left: 5px solid #27ae60;
            padding: 20px;
            margin: 20px 0;
            border-radius: 5px;
        }
        
        .resumen {
            background: #e3f2fd;
            border-left: 5px solid #2196f3;
            padding: 20px;
            margin: 20px 0;
            border-radius: 5px;
        }
        
        .reflexion {
            background: #f3e5f5;
            border-left: 5px solid #9c27b0;
            padding: 20px;
            margin: 20px 0;
            border-radius: 5px;
        }
        
        .slide-number {
            position: absolute;
            bottom: 20px;
            right: 30px;
            background: ${data.tema_color || '#3498db'};
            color: white;
            padding: 8px 15px;
            border-radius: 20px;
            font-size: 0.9em;
        }
        
        @media print {
            body { 
                background: white !important; 
            }
            .slide { 
                box-shadow: none; 
                border: 1px solid #ddd; 
                margin: 0;
                page-break-after: always;
            }
        }
        
        @media (max-width: 768px) {
            .slide-content {
                padding: 30px;
            }
            .titulo-principal {
                font-size: 2.5em;
            }
            .slide h1 {
                font-size: 2em;
            }
        }
    </style>
</head>
<body>
    <div class="presentation-container">
        ${slides}
    </div>
    
    <script>
        // Add slide numbers
        document.querySelectorAll('.slide').forEach((slide, index) => {
            if (!slide.classList.contains('portada')) {
                const slideNumber = document.createElement('div');
                slideNumber.className = 'slide-number';
                slideNumber.textContent = \`\${index + 1} / \${document.querySelectorAll('.slide').length}\`;
                slide.appendChild(slideNumber);
            }
        });
        
        // Print functionality
        document.addEventListener('keydown', function(e) {
            if (e.ctrlKey && e.key === 'p') {
                e.preventDefault();
                window.print();
            }
        });
    </script>
</body>
</html>`;
}

function adjustColor(color: string, amount: number): string {
  const usePound = color[0] === '#';
  const col = usePound ? color.slice(1) : color;
  const num = parseInt(col, 16);
  let r = (num >> 16) + amount;
  let g = (num >> 8 & 0x00FF) + amount;
  let b = (num & 0x0000FF) + amount;
  r = r > 255 ? 255 : r < 0 ? 0 : r;
  g = g > 255 ? 255 : g < 0 ? 0 : g;
  b = b > 255 ? 255 : b < 0 ? 0 : b;
  return (usePound ? '#' : '') + (r << 16 | g << 8 | b).toString(16).padStart(6, '0');
}