import { NextRequest, NextResponse } from 'next/server';
import PptxGenJS from 'pptxgenjs';

// Define different presentation themes
const presentationThemes = [
  {
    name: 'Profesional Azul',
    primaryColor: '#2E86AB',
    secondaryColor: '#A23B72',
    accentColor: '#F18F01',
    backgroundColor: '#F8F9FA',
    textColor: '#2C3E50',
    subtitleColor: '#5D6D7E'
  },
  {
    name: 'Moderno Verde',
    primaryColor: '#27AE60',
    secondaryColor: '#8E44AD',
    accentColor: '#E67E22',
    backgroundColor: '#FDFEFE',
    textColor: '#1B4F72',
    subtitleColor: '#566573'
  },
  {
    name: 'Elegante Púrpura',
    primaryColor: '#8E44AD',
    secondaryColor: '#E74C3C',
    accentColor: '#F39C12',
    backgroundColor: '#F4F6F7',
    textColor: '#2E4057',
    subtitleColor: '#5D6D7E'
  },
  {
    name: 'Vibrante Naranja',
    primaryColor: '#E67E22',
    secondaryColor: '#3498DB',
    accentColor: '#9B59B6',
    backgroundColor: '#FEFEFE',
    textColor: '#34495E',
    subtitleColor: '#7F8C8D'
  },
  {
    name: 'Minimalista Gris',
    primaryColor: '#34495E',
    secondaryColor: '#E74C3C',
    accentColor: '#1ABC9C',
    backgroundColor: '#FFFFFF',
    textColor: '#2C3E50',
    subtitleColor: '#95A5A6'
  }
];

export async function POST(request: NextRequest) {
  try {
    const { presentationData } = await request.json();

    if (!presentationData) {
      return NextResponse.json(
        { error: 'No se proporcionaron datos de presentación' },
        { status: 400 }
      );
    }

    // Select a random theme
    const selectedTheme = presentationThemes[Math.floor(Math.random() * presentationThemes.length)];
    console.log('Tema seleccionado:', selectedTheme.name);

    // Create PowerPoint presentation
    const pptx = new PptxGenJS();
    
    // Set presentation properties
    pptx.author = 'EduPlanner';
    pptx.company = 'EduPlanner';
    pptx.subject = presentationData.titulo;
    pptx.title = presentationData.titulo;
    
    // Set slide master with theme background
    pptx.defineSlideMaster({
      title: 'MASTER_SLIDE',
      background: { color: selectedTheme.backgroundColor }
    });
    
    // Generate slides from AI data
    presentationData.diapositivas.forEach((slide: any, index: number) => {
      const pptxSlide = pptx.addSlide();
      
      switch (slide.tipo) {
        case 'portada':
          // Title slide with theme background
          pptxSlide.background = { color: selectedTheme.backgroundColor };
          
          // Add decorative shape
          pptxSlide.addShape(pptx.ShapeType.rect, {
            x: 0,
            y: 0,
            w: 10,
            h: 1,
            fill: { color: selectedTheme.primaryColor }
          });
          
          pptxSlide.addText(slide.titulo, {
            x: 0.8,
            y: 2.2,
            w: 8.4,
            h: 1.5,
            fontSize: 32,
            bold: true,
            align: 'center',
            valign: 'middle',
            color: selectedTheme.primaryColor
          });
          
          if (slide.subtitulo) {
            pptxSlide.addText(slide.subtitulo, {
              x: 0.8,
              y: 3.8,
              w: 8.4,
              h: 1,
              fontSize: 20,
              align: 'center',
              valign: 'middle',
              color: selectedTheme.subtitleColor
            });
          }
          
          // Add image placeholder with theme colors
          pptxSlide.addText('🖼️ ' + (slide.descripcion_imagen || 'Imagen de portada'), {
            x: 0.8,
            y: 5.0,
            w: 8.4,
            h: 1.0,
            fontSize: 14,
            align: 'center',
            valign: 'middle',
            color: selectedTheme.accentColor,
            italic: true
          });
          
          // Add teacher instructions
          pptxSlide.addText('📝 INSTRUCCIONES PARA EL PROFESOR: Reemplazar este texto con una imagen relacionada al tema', {
            x: 0.8,
            y: 6.2,
            w: 8.4,
            h: 0.8,
            fontSize: 10,
            align: 'center',
            color: selectedTheme.subtitleColor,
            italic: true
          });
          break;
          
        case 'contenido':
          // Content slide with theme styling
          pptxSlide.background = { color: selectedTheme.backgroundColor };
          
          // Add header accent line
          pptxSlide.addShape(pptx.ShapeType.rect, {
            x: 0.8,
            y: 1.3,
            w: 8.4,
            h: 0.1,
            fill: { color: selectedTheme.secondaryColor }
          });
          
          pptxSlide.addText(slide.titulo, {
            x: 0.8,
            y: 0.6,
            w: 8.4,
            h: 1,
            fontSize: 26,
            bold: true,
            align: 'center',
            valign: 'middle',
            color: selectedTheme.primaryColor
          });
          
          // Add bullet points with theme colors
          if (slide.puntos && Array.isArray(slide.puntos)) {
            const bulletText = slide.puntos.map((punto: string) => ({ text: punto, options: { bullet: true } }));
            pptxSlide.addText(bulletText, {
              x: 1.2,
              y: 2,
              w: 7.6,
              h: 3.2,
              fontSize: 16,
              valign: 'top',
              color: selectedTheme.textColor
            });
          }
          
          // Add image placeholder with theme colors
          if (slide.descripcion_imagen) {
            pptxSlide.addText('🖼️ ' + slide.descripcion_imagen, {
              x: 0.8,
              y: 5.5,
              w: 8.4,
              h: 0.7,
              fontSize: 12,
              align: 'center',
              valign: 'middle',
              color: selectedTheme.subtitleColor,
              italic: true
            });
            
            // Add teacher instructions for image
            pptxSlide.addText('📝 PROFESOR: Insertar imagen aquí - ' + slide.descripcion_imagen, {
              x: 0.8,
              y: 6.3,
              w: 8.4,
              h: 0.5,
              fontSize: 9,
              align: 'center',
              color: selectedTheme.accentColor,
              italic: true
            });
          }
          
          // Add interactive activity with accent color
          if (slide.actividad_interactiva) {
            pptxSlide.addText('💡 Actividad: ' + slide.actividad_interactiva, {
              x: 0.8,
              y: 5.8,
              w: 8.4,
              h: 0.8,
              fontSize: 14,
              align: 'center',
              valign: 'middle',
              color: selectedTheme.accentColor,
              bold: true
            });
          }
          break;
          
        case 'actividad':
          // Activity slide with theme styling
          pptxSlide.background = { color: selectedTheme.backgroundColor };
          
          // Add activity icon background
          pptxSlide.addShape(pptx.ShapeType.rect, {
            x: 8.2,
            y: 0.3,
            w: 1,
            h: 1,
            fill: { color: selectedTheme.accentColor },
            line: { color: selectedTheme.secondaryColor, width: 2 }
          });
          
          pptxSlide.addText('🎯', {
            x: 8.3,
            y: 0.5,
            w: 0.8,
            h: 0.6,
            fontSize: 24,
            align: 'center'
          });
          
          pptxSlide.addText(slide.titulo, {
            x: 0.8,
            y: 0.6,
            w: 7.2,
            h: 1,
            fontSize: 26,
            bold: true,
            valign: 'middle',
            color: selectedTheme.primaryColor
          });
          
          if (slide.descripcion) {
            pptxSlide.addText(slide.descripcion, {
              x: 0.8,
              y: 2,
              w: 8.4,
              h: 1.6,
              fontSize: 16,
              align: 'center',
              valign: 'middle',
              color: selectedTheme.textColor
            });
          }
          
          if (slide.instrucciones && Array.isArray(slide.instrucciones)) {
            const instructionText = slide.instrucciones.map((inst: string) => ({ text: inst, options: { bullet: true } }));
            pptxSlide.addText(instructionText, {
              x: 1.2,
              y: 4.0,
              w: 7.6,
              h: 2.2,
              fontSize: 14,
              valign: 'top',
              color: selectedTheme.accentColor
            });
            
            // Add teacher preparation notes
            pptxSlide.addText('👨‍🏫 NOTAS PARA EL PROFESOR: Preparar materiales necesarios y organizar el espacio para la actividad', {
              x: 0.8,
              y: 6.8,
              w: 8.4,
              h: 0.6,
              fontSize: 10,
              align: 'center',
              color: selectedTheme.primaryColor,
              italic: true,
              bold: true
            });
          }
          break;
          
        case 'cierre':
          // Closing slide with theme styling
          pptxSlide.background = { color: selectedTheme.backgroundColor };
          
          // Add decorative footer
          pptxSlide.addShape(pptx.ShapeType.rect, {
            x: 0,
            y: 6.5,
            w: 10,
            h: 1,
            fill: { color: selectedTheme.primaryColor }
          });
          
          // Add celebration icon
          pptxSlide.addText('🎉', {
            x: 4.5,
            y: 0.8,
            w: 1,
            h: 0.8,
            fontSize: 32,
            align: 'center'
          });
          
          pptxSlide.addText(slide.titulo, {
            x: 0.8,
            y: 2,
            w: 8.4,
            h: 1.2,
            fontSize: 28,
            bold: true,
            align: 'center',
            valign: 'middle',
            color: selectedTheme.primaryColor
          });
          
          if (slide.mensaje_final) {
            pptxSlide.addText(slide.mensaje_final, {
              x: 0.8,
              y: 3.5,
              w: 8.4,
              h: 1.3,
              fontSize: 18,
              align: 'center',
              valign: 'middle',
              color: selectedTheme.textColor
            });
          }
          
          if (slide.puntos_clave && Array.isArray(slide.puntos_clave)) {
            const keyPointsText = slide.puntos_clave.map((punto: string) => ({ text: punto, options: { bullet: true } }));
            pptxSlide.addText(keyPointsText, {
              x: 1.2,
              y: 5.0,
              w: 7.6,
              h: 1.0,
              fontSize: 14,
              valign: 'top',
              color: selectedTheme.accentColor
            });
            
            // Add teacher closing instructions
            pptxSlide.addText('🎓 PROFESOR: Tiempo para preguntas, reflexión final y asignación de tareas de seguimiento', {
              x: 0.8,
              y: 6.5,
              w: 8.4,
              h: 0.5,
              fontSize: 10,
              align: 'center',
              color: selectedTheme.primaryColor,
              italic: true,
              bold: true
            });
          }
          break;
          
        default:
          // Generic slide
          pptxSlide.addText(slide.titulo || 'Diapositiva', {
            x: 0.5,
            y: 0.5,
            w: 9,
            h: 1,
            fontSize: 28,
            bold: true,
            color: presentationData.tema_color || '#2E86AB'
          });
          
          if (slide.contenido) {
            pptxSlide.addText(slide.contenido, {
              x: 0.5,
              y: 2,
              w: 9,
              h: 4,
              fontSize: 18,
              color: '333333'
            });
          }
          break;
      }
    });
    
    // Generate the PowerPoint file as buffer
    const pptxBuffer = await pptx.write({ outputType: 'arraybuffer' });
    
    // Return the file as response
    return new NextResponse(pptxBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'Content-Disposition': `attachment; filename="presentacion-${presentationData.titulo.replace(/[^a-zA-Z0-9]/g, '-')}.pptx"`,
      },
    });
    
  } catch (error) {
    console.error('Error generating PowerPoint:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor al generar la presentación' },
      { status: 500 }
    );
  }
}