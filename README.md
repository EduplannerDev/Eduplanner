# 🎓 EduPlanner

**Planeaciones Didácticas con Inteligencia Artificial**

EduPlanner es una plataforma web moderna diseñada para ayudar a educadores a crear, gestionar y optimizar sus planeaciones didácticas, exámenes y comunicaciones con padres de familia utilizando inteligencia artificial.

## ✨ Características Principales

### 📋 Gestión de Planeaciones
- **Crear Planeaciones**: Genera planeaciones didácticas personalizadas con IA
- **Mis Planeaciones**: Visualiza, edita y gestiona todas tus planeaciones
- **Exportación**: Descarga planeaciones en formato DOCX y PDF

### 📝 Sistema de Exámenes
- **Generar Exámenes**: Crea exámenes automáticamente con IA
- **Mis Exámenes**: Administra tu biblioteca de exámenes
- **Múltiples Formatos**: Exporta en DOCX, PDF y PowerPoint

### 💬 Comunicación con Padres
- **Generar Mensajes**: Crea mensajes personalizados para padres de familia
- **Adaptación WhatsApp**: Formatea mensajes para WhatsApp
- **Historial**: Guarda y reutiliza mensajes anteriores

### 🤖 Chat con IA
- **Asistente Educativo**: Chat interactivo para consultas pedagógicas
- **Sugerencias Personalizadas**: Recomendaciones basadas en tu perfil

### 🏢 Administración y Gestión de Planteles
- **Gestión de Planteles**: Administra múltiples planteles educativos
- **Asignación de Usuarios**: Asigna profesores y directores a planteles específicos
- **Límites de Usuarios**: Control de límites por plantel (profesores y directores)
- **Estadísticas de Plantel**: Dashboard con métricas y estadísticas por plantel
- **Roles y Permisos**: Sistema de roles (Administrador, Director, Profesor)

### 📊 Dosificación Curricular y Seguimiento
- **Distribución Temporal**: Organiza contenidos por trimestres de forma inteligente
- **Seguimiento Académico**: Monitoreo del progreso curricular por campo formativo
- **Campos Formativos**: Gestión de los 4 campos formativos del NMCM
- **Estadísticas de Progreso**: Dashboard con porcentajes de avance por trimestre
- **Acciones Sugeridas**: Recomendaciones automáticas basadas en el progreso

### 👥 Gestión de Grupos y Alumnos
- **Crear Grupos**: Organiza estudiantes por grado y ciclo escolar
- **Gestión de Alumnos**: Registro completo de información estudiantil
- **Información de Padres**: Datos de contacto y comunicación con familias
- **Expedientes Individuales**: Seguimiento personalizado por alumno
- **Notas y Observaciones**: Registro de seguimiento académico y conductual

### 📋 Sistema de Asistencia
- **Tomar Asistencia**: Registro diario de asistencia por grupo
- **Estados de Asistencia**: Presente, ausente, retardo, justificado
- **Estadísticas de Asistencia**: Reportes y análisis de asistencia
- **Historial de Asistencia**: Seguimiento temporal por alumno

### 🎯 Proyectos Educativos
- **Asistente de Proyectos**: Creación de proyectos con IA en 3 fases
- **Gestión de Proyectos**: Administración completa de proyectos educativos
- **Fases y Momentos**: Estructura automática generada por IA
- **Seguimiento de Proyectos**: Monitoreo del progreso y estado

### 📝 Instrumentos de Evaluación
- **Rúbricas Analíticas**: Generación automática de rúbricas con IA
- **Listas de Cotejo**: Instrumentos de evaluación personalizados
- **Escalas de Estimación**: Herramientas de evaluación variadas
- **Gestión de Instrumentos**: Administración y organización de evaluaciones

### 📅 Calendario y Eventos Escolares
- **Calendario Interactivo**: Gestión de eventos con FullCalendar
- **Eventos Escolares**: Importación automática del calendario SEP
- **Vinculación de Contenidos**: Conexión con planeaciones y exámenes
- **Categorización**: Organización por tipos de eventos
- **Generación Automática**: Eventos del calendario escolar oficial

### 👤 Gestión de Perfil
- **Perfil Personalizado**: Configura tu información personal y profesional
- **Suscripciones**: Gestión de planes y pagos con Stripe
- **Feedback**: Sistema de retroalimentación integrado
- **Sistema de Invitaciones**: Invitación de usuarios por email con roles específicos

## 🛠️ Tecnologías Utilizadas

### Frontend
- **Next.js 15** - Framework de React con App Router
- **React 19** - Biblioteca de interfaz de usuario
- **TypeScript** - Tipado estático
- **Tailwind CSS** - Framework de estilos utilitarios
- **Radix UI** - Componentes de interfaz accesibles
- **Lucide React** - Iconografía moderna
- **FullCalendar** - Calendario interactivo
- **Recharts** - Gráficos y visualizaciones
- **TipTap** - Editor de texto enriquecido

### Backend & Base de Datos
- **Supabase** - Backend como servicio (BaaS)
- **PostgreSQL** - Base de datos relacional
- **Supabase Auth** - Autenticación y autorización
- **Row Level Security (RLS)** - Seguridad a nivel de fila

### Inteligencia Artificial
- **OpenAI API** - Generación de contenido educativo
- **Google AI SDK (Gemini)** - Servicios adicionales de IA
- **Vercel AI SDK** - Integración de IA optimizada
- **Sistema de Embeddings** - Búsqueda semántica de documentación

### Generación de Documentos
- **docx** - Generación de documentos Word
- **jsPDF** - Creación de archivos PDF
- **PptxGenJS** - Generación de presentaciones PowerPoint
- **html2pdf.js** - Conversión HTML a PDF
- **Puppeteer** - Generación de PDFs avanzada

### Pagos y Comunicación
- **Stripe** - Procesamiento de pagos
- **Resend** - Servicio de email transaccional

### Calendario y Eventos
- **FullCalendar** - Calendario interactivo completo
- **iCal** - Importación de calendarios escolares
- **Date-fns** - Manipulación de fechas

### Herramientas de Desarrollo
- **React Hook Form** - Manejo de formularios
- **Zod** - Validación de esquemas
- **SweetAlert2** - Alertas y modales elegantes
- **Sonner** - Notificaciones toast
- **Microsoft Clarity** - Analytics y monitoreo
- **Vercel Analytics** - Métricas de rendimiento

## 🚀 Instalación y Configuración

### Prerrequisitos
- Node.js 18+ 
- npm, yarn o pnpm
- Cuenta de Supabase
- API Keys de OpenAI
- Cuenta de Stripe (para pagos)

### Instalación

1. **Clonar el repositorio**
```bash
git clone https://github.com/tu-usuario/eduplanner.git
cd eduplanner
```

2. **Instalar dependencias**
```bash
npm install
# o
yarn install
# o
pnpm install
```

3. **Configurar variables de entorno**

Crea un archivo `.env.local` en la raíz del proyecto:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key

# OpenAI
OPENAI_API_KEY=tu_openai_api_key

# Google AI (opcional)
GOOGLE_AI_API_KEY=tu_google_ai_key

# Stripe
STRIPE_SECRET_KEY=tu_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=tu_stripe_publishable_key

# Resend (para emails)
RESEND_API_KEY=tu_resend_api_key
```

4. **Configurar la base de datos**

Ejecuta las migraciones de Supabase:
```bash
# Si tienes Supabase CLI instalado
supabase db push
```

O ejecuta manualmente los archivos SQL en `supabase/migrations/`

5. **Ejecutar en desarrollo**
```bash
npm run dev
# o
yarn dev
# o
pnpm dev
```

La aplicación estará disponible en `http://localhost:3000`

## 📚 Scripts Disponibles

- `npm run dev` - Inicia el servidor de desarrollo
- `npm run build` - Construye la aplicación para producción
- `npm run start` - Inicia el servidor de producción
- `npm run lint` - Ejecuta el linter
- `npm run docs` - Inicia el servidor de documentación API
- `npm run docs:install` - Instala dependencias para documentación
- `npm run docs:build` - Genera documentación en formato YAML
- `npm run import-calendar` - Importa calendario escolar oficial

## 📖 Documentación

### Documentación API
La documentación de la API está disponible en formato Swagger:

1. **Instalar dependencias de documentación**:
```bash
npm run docs:install
```

2. **Iniciar servidor de documentación**:
```bash
npm run docs
```

3. **Acceder a la documentación**:
   - Swagger UI: `http://localhost:3001`
   - Archivo YAML: `swagger.yaml`

### Flujos de Usuario Documentados
El proyecto incluye documentación detallada de flujos de usuario en `docs/flujos/`:

- **COMO_CREAR_PLANEACION.txt** - Guía completa para crear planeaciones didácticas
- **COMO_GENERAR_EXAMEN.txt** - Proceso para generar exámenes con IA
- **COMO_CREAR_PROYECTO.txt** - Creación de proyectos educativos en 3 fases
- **COMO_GESTIONAR_MIS_PROYECTOS.txt** - Administración de proyectos e instrumentos
- **COMO_USAR_DOSIFICACION.txt** - Uso del módulo de dosificación curricular

### Sistema de Documentación Vectorizada
- **Búsqueda Semántica**: Sistema inteligente de búsqueda en documentación
- **Embeddings**: Procesamiento automático de contenido educativo
- **Filtrado por Módulo**: Búsqueda específica por funcionalidad
- **Extracción de Palabras Clave**: Identificación automática de términos relevantes

### Documentación Técnica
- **CONFIGURACION_CORREOS.md** - Configuración del sistema de emails
- **MODULO_CORREOS.md** - Documentación del módulo de comunicación
- **NOTIFICATIONS.md** - Sistema de notificaciones

## 🏗️ Estructura del Proyecto

```
eduplanner/
├── app/                    # App Router de Next.js
│   ├── api/               # Rutas de API
│   │   ├── chat/          # Chat con IA
│   │   ├── generate-*/    # Generadores de contenido
│   │   ├── proyectos/     # API de proyectos educativos
│   │   ├── instrumentos-evaluacion/ # Instrumentos de evaluación
│   │   ├── stripe/        # Integración de pagos
│   │   └── invite-user/   # Sistema de invitaciones
│   ├── globals.css        # Estilos globales
│   ├── layout.tsx         # Layout principal
│   └── page.tsx           # Página de inicio
├── components/            # Componentes React
│   ├── sections/          # Secciones de la aplicación
│   │   ├── admin-*.tsx    # Componentes de administración
│   │   ├── dosificacion.tsx # Módulo de dosificación
│   │   ├── gestionar-*.tsx # Gestión de grupos y alumnos
│   │   ├── proyecto-*.tsx # Componentes de proyectos
│   │   ├── agenda.tsx     # Calendario y eventos
│   │   └── expediente-alumno.tsx # Expedientes estudiantiles
│   ├── ui/               # Componentes de UI reutilizables
│   ├── app-sidebar.tsx   # Sidebar principal
│   └── dashboard.tsx     # Dashboard principal
├── hooks/                # Custom hooks
│   ├── use-auth.ts       # Autenticación
│   ├── use-roles.ts      # Gestión de roles
│   ├── use-proyectos.ts  # Hook de proyectos
│   └── use-documentation-search.ts # Búsqueda semántica
├── lib/                  # Utilidades y configuraciones
│   ├── supabase.ts       # Configuración de Supabase
│   ├── docx-generator.ts # Generador de documentos Word
│   ├── pdf-generator.ts  # Generador de PDFs
│   ├── pptx-generator.ts # Generador de PowerPoint
│   ├── planteles.ts      # Gestión de planteles
│   ├── grupos.ts         # Gestión de grupos
│   ├── alumnos.ts        # Gestión de alumnos
│   ├── asistencia.ts     # Sistema de asistencia
│   ├── proyectos.ts      # Gestión de proyectos
│   ├── events.ts         # Calendario y eventos
│   └── invitations.ts    # Sistema de invitaciones
├── docs/                 # Documentación del proyecto
│   ├── flujos/           # Flujos de usuario documentados
│   ├── CONFIGURACION_CORREOS.md
│   ├── MODULO_CORREOS.md
│   └── NOTIFICATIONS.md
├── public/               # Archivos estáticos
├── supabase/            # Migraciones de base de datos
│   ├── migrations/      # Archivos SQL de migración
│   └── config.toml      # Configuración de Supabase
├── scripts/             # Scripts de utilidad
│   ├── import-school-calendar.ts # Importación de calendario
│   ├── generate-curriculo-embeddings.ts # Embeddings curriculares
│   └── serve-docs.js    # Servidor de documentación
└── styles/              # Estilos adicionales
```

## 🔐 Autenticación y Seguridad

- **Supabase Auth**: Manejo seguro de autenticación
- **Row Level Security (RLS)**: Políticas de seguridad a nivel de fila
- **API Keys**: Gestión segura de claves de API
- **Validación**: Validación de datos con Zod

## 🌐 Despliegue

### Vercel (Recomendado)

1. Conecta tu repositorio con Vercel
2. Configura las variables de entorno
3. Despliega automáticamente

### Variables de Entorno para Producción

Asegúrate de configurar todas las variables de entorno necesarias en tu plataforma de despliegue.

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 📞 Soporte

Para soporte técnico o preguntas:
- 📧 Email: soporte@eduplanner.com
- 💬 Chat: Disponible en la aplicación
- 📚 FAQ: Sección de preguntas frecuentes en la app

## 🙏 Agradecimientos

- **OpenAI** por proporcionar las capacidades de IA
- **Supabase** por el backend robusto
- **Vercel** por el hosting y despliegue
- **Radix UI** por los componentes accesibles
- **Tailwind CSS** por el sistema de diseño

---

**Desarrollado con ❤️ para educadores que transforman el futuro**