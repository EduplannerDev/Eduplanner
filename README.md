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

### 👤 Gestión de Perfil
- **Perfil Personalizado**: Configura tu información personal y profesional
- **Suscripciones**: Gestión de planes y pagos con Stripe
- **Feedback**: Sistema de retroalimentación integrado

## 🛠️ Tecnologías Utilizadas

### Frontend
- **Next.js 15** - Framework de React con App Router
- **React 19** - Biblioteca de interfaz de usuario
- **TypeScript** - Tipado estático
- **Tailwind CSS** - Framework de estilos utilitarios
- **Radix UI** - Componentes de interfaz accesibles
- **Lucide React** - Iconografía moderna

### Backend & Base de Datos
- **Supabase** - Backend como servicio (BaaS)
- **PostgreSQL** - Base de datos relacional
- **Supabase Auth** - Autenticación y autorización

### Inteligencia Artificial
- **OpenAI API** - Generación de contenido educativo
- **Google AI SDK** - Servicios adicionales de IA
- **Vercel AI SDK** - Integración de IA optimizada

### Generación de Documentos
- **docx** - Generación de documentos Word
- **jsPDF** - Creación de archivos PDF
- **PptxGenJS** - Generación de presentaciones PowerPoint

### Pagos y Comunicación
- **Stripe** - Procesamiento de pagos
- **Resend** - Servicio de email transaccional

### Herramientas de Desarrollo
- **React Hook Form** - Manejo de formularios
- **Zod** - Validación de esquemas
- **SweetAlert2** - Alertas y modales elegantes
- **Sonner** - Notificaciones toast

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

## 📖 Documentación API

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

## 🏗️ Estructura del Proyecto

```
eduplanner/
├── app/                    # App Router de Next.js
│   ├── api/               # Rutas de API
│   ├── globals.css        # Estilos globales
│   ├── layout.tsx         # Layout principal
│   └── page.tsx           # Página de inicio
├── components/            # Componentes React
│   ├── sections/          # Secciones de la aplicación
│   ├── ui/               # Componentes de UI reutilizables
│   ├── app-sidebar.tsx   # Sidebar principal
│   └── dashboard.tsx     # Dashboard principal
├── hooks/                # Custom hooks
├── lib/                  # Utilidades y configuraciones
│   ├── supabase/         # Configuración de Supabase
│   ├── docx-generator.ts # Generador de documentos Word
│   ├── pdf-generator.ts  # Generador de PDFs
│   └── pptx-generator.ts # Generador de PowerPoint
├── public/               # Archivos estáticos
├── supabase/            # Migraciones de base de datos
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