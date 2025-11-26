import { NextRequest, NextResponse } from 'next/server';
import PptxGenJS from 'pptxgenjs';

// Temas profesionales mejorados
const presentationThemes = [
  {
    name: 'Azul Profesional',
    primary: '#2563EB',
    secondary: '#7C3AED',
    accent: '#F59E0B',
    background: '#F8FAFC',
    text: '#1E293B',
    subtitle: '#64748B',
    light: '#EFF6FF'
  },
  {
    name: 'Verde Moderno',
    primary: '#10B981',
    secondary: '#8B5CF6',
    accent: '#F97316',
    background: '#FAFAF9',
    text: '#0F172A',
    subtitle: '#71717A',
    light: '#ECFDF5'
  },
  {
    name: 'Púrpura Elegante',
    primary: '#8B5CF6',
    secondary: '#EC4899',
    accent: '#EAB308',
    background: '#FAFAF9',
    text: '#18181B',
    subtitle: '#71717A',
    light: '#FAF5FF'
  },
  {
    name: 'Naranja Energético',
    primary: '#F97316',
    secondary: '#3B82F6',
    accent: '#10B981',
    background: '#FEFCE8',
    text: '#292524',
    subtitle: '#78716C',
    light: '#FFF7ED'
  },
  {
    name: 'Azul Oscuro Pro',
    primary: '#1E40AF',
    secondary: '#DB2777',
    accent: '#059669',
    background: '#FFFFFF',
    text: '#0F172A',
    subtitle: '#475569',
    light: '#EFF6FF'
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

    // Seleccionar tema basado en el color sugerido o aleatorio
    const theme = presentationThemes[Math.floor(Math.random() * presentationThemes.length)];

    const pptx = new PptxGenJS();

    // Configuración de la presentación
    pptx.layout = 'LAYOUT_WIDE';
    pptx.author = 'EduPlanner IA';
    pptx.company = 'EduPlanner';
    pptx.subject = presentationData.titulo;
    pptx.title = presentationData.titulo;

    // Generar diapositivas
    if (presentationData.diapositivas) {
      for (const slide of presentationData.diapositivas) {
        const pptxSlide = pptx.addSlide();
        pptxSlide.background = { color: theme.background };

        switch (slide.tipo) {
          case 'portada':
            await generatePortadaSlide(pptxSlide, slide, theme, pptx);
            break;

          case 'objetivos':
            await generateObjetivosSlide(pptxSlide, slide, theme, pptx);
            break;

          case 'contenido':
            await generateContenidoSlide(pptxSlide, slide, theme, pptx);
            break;

          case 'ejemplo':
            await generateEjemploSlide(pptxSlide, slide, theme, pptx);
            break;

          case 'actividad':
            await generateActividadSlide(pptxSlide, slide, theme, pptx);
            break;

          case 'interactivo':
            await generateInteractivoSlide(pptxSlide, slide, theme, pptx);
            break;

          case 'resumen':
            await generateResumenSlide(pptxSlide, slide, theme, pptx);
            break;

          case 'cierre':
            await generateCierreSlide(pptxSlide, slide, theme, pptx);
            break;

          default:
            await generateGenericSlide(pptxSlide, slide, theme, pptx);
        }
      }
    }

    // Generar el archivo
    const pptxBuffer = await pptx.write({ outputType: 'arraybuffer' });

    return new NextResponse(pptxBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'Content-Disposition': `attachment; filename=\"${presentationData.titulo.replace(/[^a-zA-Z0-9]/g, '-')}.pptx\"`,
      },
    });

  } catch (error) {
    console.error('Error generating PowerPoint:', error);
    return NextResponse.json(
      { error: 'Error al generar la presentación' },
      { status: 500 }
    );
  }
}

// ===== FUNCIÓN AUXILIAR PARA IMÁGENES =====

async function addImageToSlide(slide: any, data: any, theme: any, x: number, y: number, w: number, h: number) {
  // Si hay URL de imagen, intentar agregarla
  if (data.imagen_url) {
    try {
      slide.addImage({
        path: data.imagen_url,
        x, y, w, h,
        sizing: { type: 'cover', w, h }
      });
      return true; // Imagen agregada exitosamente
    } catch (error) {
      console.error('Error agregando imagen:', error);
      // Si falla, continuar con la descripción de texto
    }
  }

  // Fallback: mostrar descripción de imagen
  if (data.descripcion_imagen) {
    slide.addText('📸 ' + data.descripcion_imagen, {
      x, y, w, h,
      fontSize: 14, align: 'center',
      valign: 'middle',
      color: theme.accent, italic: true
    });
  }

  return false;
}

// ===== GENERADORES DE DIAPOSITIVAS =====

async function generatePortadaSlide(slide: any, data: any, theme: any, pptx: any) {
  // Barra superior decorativa
  slide.addShape(pptx.ShapeType.rect, {
    x: 0, y: 0, w: '100%', h: 0.8,
    fill: { color: theme.primary }
  });

  // Título principal
  slide.addText(data.titulo, {
    x: 1, y: 2.5, w: '80%', h: 1.5,
    fontSize: 44, bold: true, align: 'center',
    valign: 'middle', color: theme.primary
  });

  // Subtítulo
  if (data.subtitulo) {
    slide.addText(data.subtitulo, {
      x: 1, y: 4.2, w: '80%', h: 0.8,
      fontSize: 24, align: 'center',
      color: theme.subtitle
    });
  }

  // Imagen o descripción
  await addImageToSlide(slide, data, theme, 1, 5.2, 8.5, 2.2);

  // Barra inferior
  slide.addShape(pptx.ShapeType.rect, {
    x: 0, y: 6.75, w: '100%', h: 0.5,
    fill: { color: theme.secondary }
  });
}

async function generateObjetivosSlide(slide: any, data: any, theme: any, pptx: any) {
  // Encabezado con icono
  slide.addShape(pptx.ShapeType.rect, {
    x: 0, y: 0, w: '100%', h: 1,
    fill: { color: theme.light }
  });

  slide.addText((data.icono_sugerido || '🎯') + '  ' + data.titulo, {
    x: 1, y: 0.2, w: '80%', h: 0.6,
    fontSize: 32, bold: true, color: theme.primary
  });

  // Objetivos como lista numerada con iconos
  if (data.objetivos && Array.isArray(data.objetivos)) {
    data.objetivos.forEach((obj: string, i: number) => {
      slide.addText(`${i + 1}.`, {
        x: 1.5, y: 2 + (i * 0.8), w: 0.5, h: 0.6,
        fontSize: 24, bold: true, color: theme.primary
      });

      slide.addText(obj, {
        x: 2.2, y: 2 + (i * 0.8), w: 8, h: 0.6,
        fontSize: 20, color: theme.text
      });
    });
  }
}

async function generateContenidoSlide(slide: any, data: any, theme: any, pptx: any) {
  // Barra lateral izquierda decorativa
  slide.addShape(pptx.ShapeType.rect, {
    x: 0, y: 0, w: 0.3, h: '100%',
    fill: { color: theme.primary }
  });

  // Título
  slide.addText(data.titulo, {
    x: 0.8, y: 0.5, w: '75%', h: 0.8,
    fontSize: 32, bold: true, color: theme.primary
  });

  // Subtema si existe
  if (data.subtema) {
    slide.addText(data.subtema, {
      x: 0.8, y: 1.4, w: '75%', h: 0.5,
      fontSize: 18, color: theme.subtitle, italic: true
    });
  }

  // Determinar layout si hay imagen
  const hasImage = data.imagen_url || data.descripcion_imagen;
  const textWidth = hasImage ? 5.5 : 8.5;

  // Puntos clave
  if (data.puntos && Array.isArray(data.puntos)) {
    const bullets = data.puntos.map((p: string) => ({
      text: p,
      options: { bullet: { code: '25CF' }, fontSize: 18, color: theme.text }
    }));

    slide.addText(bullets, {
      x: 1.5, y: 2.5, w: textWidth, h: 3.5,
      valign: 'top'
    });
  }

  // Agregar imagen si existe
  if (hasImage) {
    await addImageToSlide(slide, data, theme, 7.2, 2.5, 2.5, 3);
  }

  // Pregunta de reflexión
  if (data.pregunta_reflexion) {
    slide.addShape(pptx.ShapeType.rect, {
      x: 1, y: 6, w: 9, h: 0.8,
      fill: { color: theme.accent, transparency: 80 }
    });

    slide.addText('💭 ' + data.pregunta_reflexion, {
      x: 1.2, y: 6.1, w: 8.6, h: 0.6,
      fontSize: 16, color: theme.text, italic: true
    });
  }
}

async function generateEjemploSlide(slide: any, data: any, theme: any, pptx: any) {
  // Encabezado
  slide.addShape(pptx.ShapeType.rect, {
    x: 0, y: 0, w: '100%', h: 0.9,
    fill: { color: theme.secondary }
  });

  slide.addText('📝 ' + data.titulo, {
    x: 1, y: 0.15, w: '80%', h: 0.6,
    fontSize: 28, bold: true, color: 'FFFFFF'
  });

  // Determinar layout si hay imagen
  const hasImage = data.imagen_url || data.descripcion_imagen;
  const textWidth = hasImage ? 5.5 : 8;

  // Contexto
  if (data.contexto) {
    slide.addText(data.contexto, {
      x: 1, y: 1.5, w: 9, h: 1,
      fontSize: 18, color: theme.text
    });
  }

  // Pasos numerados
  if (data.pasos && Array.isArray(data.pasos)) {
    data.pasos.forEach((paso: string, i: number) => {
      // Círculo con número
      slide.addShape(pptx.ShapeType.ellipse, {
        x: 1, y: 3 + (i * 0.8), w: 0.5, h: 0.5,
        fill: { color: theme.primary }
      });

      slide.addText((i + 1).toString(), {
        x: 1, y: 3 + (i * 0.8), w: 0.5, h: 0.5,
        fontSize: 18, bold: true, color: 'FFFFFF',
        align: 'center', valign: 'middle'
      });

      slide.addText(paso, {
        x: 1.8, y: 3 + (i * 0.8), w: textWidth, h: 0.6,
        fontSize: 16, color: theme.text
      });
    });
  }

  // Agregar imagen si existe
  if (hasImage) {
    await addImageToSlide(slide, data, theme, 7.5, 3, 2.2, 2.5);
  }

  // Resultado esperado
  if (data.resultado) {
    slide.addText('✨ Resultado: ' + data.resultado, {
      x: 1, y: 6.2, w: 9, h: 0.6,
      fontSize: 16, bold: true, color: theme.accent
    });
  }
}

async function generateActividadSlide(slide: any, data: any, theme: any, pptx: any) {
  // Banner superior
  slide.addShape(pptx.ShapeType.rect, {
    x: 0, y: 0, w: '100%', h: 1.2,
    fill: { color: theme.accent }
  });

  slide.addText('🎯 ' + data.titulo, {
    x: 1, y: 0.3, w: '80%', h: 0.6,
    fontSize: 32, bold: true, color: 'FFFFFF'
  });

  // Determinar layout si hay imagen
  const hasImage = data.imagen_url || data.descripcion_imagen;
  const textWidth = hasImage ? 5.5 : 8;

  // Descripción
  if (data.descripcion) {
    slide.addText(data.descripcion, {
      x: 1, y: 1.5, w: 9, h: 0.8,
      fontSize: 18, color: theme.text
    });
  }

  // Instrucciones
  if (data.instrucciones && Array.isArray(data.instrucciones)) {
    slide.addText('📋 Instrucciones:', {
      x: 1, y: 2.5, w: 4, h: 0.5,
      fontSize: 20, bold: true, color: theme.primary
    });

    const bullets = data.instrucciones.map((inst: string) => ({
      text: inst,
      options: { bullet: true, fontSize: 16, color: theme.text }
    }));

    slide.addText(bullets, {
      x: 1.5, y: 3.2, w: textWidth, h: 2.5
    });
  }

  // Agregar imagen si existe
  if (hasImage) {
    await addImageToSlide(slide, data, theme, 7.5, 3, 2.2, 2.5);
  }

  // Info adicional en recuadros
  const infoY = 6;
  let infoX = 1;

  if (data.tiempo_estimado) {
    slide.addShape(pptx.ShapeType.rect, {
      x: infoX, y: infoY, w: 2.5, h: 0.6,
      fill: { color: theme.light }
    });
    slide.addText('⏱️ ' + data.tiempo_estimado, {
      x: infoX + 0.2, y: infoY + 0.1, w: 2.1, h: 0.4,
      fontSize: 14, color: theme.text
    });
    infoX += 2.7;
  }

  if (data.organizacion) {
    slide.addShape(pptx.ShapeType.rect, {
      x: infoX, y: infoY, w: 2.5, h: 0.6,
      fill: { color: theme.light }
    });
    slide.addText('👥 ' + data.organizacion, {
      x: infoX + 0.2, y: infoY + 0.1, w: 2.1, h: 0.4,
      fontSize: 14, color: theme.text
    });
    infoX += 2.7;
  }

  if (data.materiales) {
    slide.addShape(pptx.ShapeType.rect, {
      x: infoX, y: infoY, w: 3, h: 0.6,
      fill: { color: theme.light }
    });
    slide.addText('📦 ' + data.materiales, {
      x: infoX + 0.2, y: infoY + 0.1, w: 2.6, h: 0.4,
      fontSize: 14, color: theme.text
    });
  }
}

async function generateInteractivoSlide(slide: any, data: any, theme: any, pptx: any) {
  // Fondo especial
  slide.addShape(pptx.ShapeType.rect, {
    x: 0, y: 0, w: '100%', h: '100%',
    fill: { color: theme.light }
  });

  // Título
  slide.addText('💬 ' + data.titulo, {
    x: 1, y: 1, w: '80%', h: 1,
    fontSize: 36, bold: true, align: 'center',
    color: theme.primary
  });

  // Determinar layout si hay imagen
  const hasImage = data.imagen_url || data.descripcion_imagen;
  const questionWidth = hasImage ? 5.5 : 7.5;

  // Pregunta principal
  if (data.pregunta) {
    slide.addText(data.pregunta, {
      x: 1.5, y: 2.5, w: questionWidth, h: 1.5,
      fontSize: 24, align: 'center',
      valign: 'middle', color: theme.text
    });
  }

  // Agregar imagen si existe
  if (hasImage) {
    await addImageToSlide(slide, data, theme, 7.5, 2.2, 2.5, 2);
  }

  // Opciones en tarjetas
  if (data.opciones && Array.isArray(data.opciones)) {
    const opcionWidth = 2.5;
    const spacing = 0.5;
    const startX = 1.5;

    data.opciones.forEach((opcion: string, i: number) => {
      const x = startX + (i * (opcionWidth + spacing));

      slide.addShape(pptx.ShapeType.roundRect, {
        x, y: 4.5, w: opcionWidth, h: 1.2,
        fill: { color: theme.primary },
        line: { width: 2, color: theme.secondary }
      });

      slide.addText(opcion, {
        x, y: 4.7, w: opcionWidth, h: 0.8,
        fontSize: 18, bold: true, color: 'FFFFFF',
        align: 'center', valign: 'middle'
      });
    });
  }

  // Tipo de interacción
  if (data.tipo_interaccion) {
    slide.addText('💡 ' + data.tipo_interaccion, {
      x: 1, y: 6.3, w: '80%', h: 0.5,
      fontSize: 16, align: 'center',
      color: theme.accent, italic: true
    });
  }
}

async function generateResumenSlide(slide: any, data: any, theme: any, pptx: any) {
  // Encabezado estilizado
  slide.addShape(pptx.ShapeType.rect, {
    x: 0, y: 0, w: '100%', h: 1,
    fill: { color: theme.primary }
  });

  slide.addText('📚 ' + data.titulo, {
    x: 1, y: 0.2, w: '80%', h: 0.6,
    fontSize: 32, bold: true, color: 'FFFFFF'
  });

  // Determinar layout si hay imagen
  const hasImage = data.imagen_url || data.descripcion_imagen;
  const boxWidth = hasImage ? 5.5 : 9;

  // Puntos clave en cajas
  if (data.puntos_clave && Array.isArray(data.puntos_clave)) {
    data.puntos_clave.forEach((punto: string, i: number) => {
      slide.addShape(pptx.ShapeType.rect, {
        x: 1, y: 2 + (i * 1.2), w: boxWidth, h: 1,
        fill: { color: theme.light },
        line: { width: 2, color: theme.primary }
      });

      slide.addText('✓ ' + punto, {
        x: 1.3, y: 2.2 + (i * 1.2), w: boxWidth - 0.6, h: 0.6,
        fontSize: 18, color: theme.text
      });
    });
  }

  // Agregar imagen si existe
  if (hasImage) {
    await addImageToSlide(slide, data, theme, 7, 2, 3, 3);
  }

  // Conexión con la vida real
  if (data.conexion_vida) {
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 1, y: 6, w: 9, h: 1,
      fill: { color: theme.accent, transparency: 80 }
    });

    slide.addText('🌟 ' + data.conexion_vida, {
      x: 1.3, y: 6.2, w: 8.4, h: 0.6,
      fontSize: 16, bold: true, color: theme.text
    });
  }
}

async function generateCierreSlide(slide: any, data: any, theme: any, pptx: any) {
  // Fondo de cierre especial
  slide.addShape(pptx.ShapeType.rect, {
    x: 0, y: 0, w: '100%', h: 2,
    fill: { color: theme.primary }
  });

  // Icono celebración
  slide.addText('🎉', {
    x: 4.5, y: 0.5, w: 1, h: 1,
    fontSize: 48
  });

  // Título
  slide.addText(data.titulo, {
    x: 1, y: 2.2, w: '80%', h: 0.8,
    fontSize: 32, bold: true, align: 'center',
    color: theme.primary
  });

  // Determinar layout si hay imagen
  const hasImage = data.imagen_url || data.descripcion_imagen;
  const textWidth = hasImage ? 5 : 7.5;

  // Resumen
  if (data.resumen) {
    slide.addText(data.resumen, {
      x: 1.5, y: 3.3, w: textWidth, h: 1,
      fontSize: 20, align: 'center',
      color: theme.text
    });
  }

  // Agregar imagen si existe
  if (hasImage) {
    await addImageToSlide(slide, data, theme, 7, 3.3, 2.5, 2);
  }

  // Pregunta de reflexión
  if (data.pregunta_reflexion) {
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 1, y: 4.8, w: 9, h: 1,
      fill: { color: theme.light }
    });

    slide.addText('🤔 ' + data.pregunta_reflexion, {
      x: 1.3, y: 5, w: 8.4, h: 0.6,
      fontSize: 18, italic: true, color: theme.text
    });
  }

  // Mensaje motivador
  if (data.mensaje_motivador) {
    slide.addText(data.mensaje_motivador, {
      x: 1, y: 6.2, w: '80%', h: 0.6,
      fontSize: 20, bold: true, align: 'center',
      color: theme.accent
    });
  }

  // Barra inferior
  slide.addShape(pptx.ShapeType.rect, {
    x: 0, y: 6.75, w: '100%', h: 0.5,
    fill: { color: theme.primary }
  });
}

async function generateGenericSlide(slide: any, data: any, theme: any, pptx: any) {
  slide.addText(data.titulo || 'Diapositiva', {
    x: 1, y: 0.5, w: '80%', h: 1,
    fontSize: 32, bold: true, color: theme.primary
  });

  // Determinar layout si hay imagen
  const hasImage = data.imagen_url || data.descripcion_imagen;
  const textWidth = hasImage ? 5 : 9;

  if (data.contenido) {
    slide.addText(data.contenido, {
      x: 1, y: 2, w: textWidth, h: 4,
      fontSize: 18, color: theme.text
    });
  }

  // Agregar imagen si existe
  if (hasImage) {
    await addImageToSlide(slide, data, theme, 6.5, 2, 3, 3);
  }
}