# 📚 EduPlanner API Documentation

## 🚀 Introducción

Esta documentación describe la API REST de EduPlanner, una plataforma educativa que utiliza IA para generar planeaciones didácticas, exámenes y contenido educativo.

## 📋 Tabla de Contenidos

- [Configuración](#configuración)
- [Autenticación](#autenticación)
- [Endpoints Principales](#endpoints-principales)
- [Swagger UI](#swagger-ui)
- [Ejemplos de Uso](#ejemplos-de-uso)
- [Desarrollo Móvil](#desarrollo-móvil)

## ⚙️ Configuración

### Variables de Entorno Requeridas

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Google AI
GOOGLE_GENERATIVE_AI_API_KEY=your_google_ai_key

# Stripe (opcional)
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret
```

### Base URLs

- **Desarrollo**: `http://localhost:3000/api`
- **Producción**: `https://eduplanner.vercel.app/api`

## 🔐 Autenticación

La API utiliza **Supabase Auth** con tokens JWT Bearer.

### Formato del Header

```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### Obtener Token de Autenticación

```javascript
// Usando Supabase Client
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(supabaseUrl, supabaseKey)

// Login
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'usuario@ejemplo.com',
  password: 'contraseña'
})

const token = data.session?.access_token
```

## 🎯 Endpoints Principales

### 1. Chat con IA Educativa

**POST** `/api/chat`

Interactúa con el asistente de IA especializado en educación.

```javascript
// Ejemplo de solicitud
fetch('/api/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    messages: [
      {
        role: 'user',
        content: 'Crea una planeación de matemáticas para segundo grado sobre fracciones'
      }
    ]
  })
})
```

### 2. Generar Exámenes

**POST** `/api/generate-exam`

Genera exámenes basados en planeaciones didácticas.

```javascript
// Ejemplo de solicitud
fetch('/api/generate-exam', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    messages: [
      {
        role: 'user',
        content: 'Genera un examen basado en esta planeación: [contenido de la planeación]'
      }
    ]
  })
})
.then(response => response.json())
.then(data => {
  console.log('Examen:', data.examen_contenido)
  console.log('Respuestas:', data.hoja_de_respuestas)
})
```

### 3. Gestión de Mensajes

**GET** `/api/messages?user_id={user_id}`

Obtiene todos los mensajes de un usuario.

```javascript
// Obtener mensajes
fetch(`/api/messages?user_id=${userId}`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
.then(response => response.json())
.then(messages => console.log(messages))
```

**POST** `/api/save-message`

Guarda un nuevo mensaje.

```javascript
// Guardar mensaje
fetch('/api/save-message', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    user_id: userId,
    content: 'Contenido del mensaje',
    type: 'planeacion'
  })
})
```

### 4. Generar Presentaciones

**POST** `/api/generate-presentation`

Genera contenido para presentaciones educativas.

**POST** `/api/generate-pptx`

Genera archivos PowerPoint descargables.

### 5. Integración WhatsApp

**POST** `/api/adapt-whatsapp`

Adapta contenido educativo para WhatsApp.

```javascript
fetch('/api/adapt-whatsapp', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    content: 'Contenido a adaptar',
    format: 'text'
  })
})
```

## 📖 Swagger UI

### Visualizar la Documentación

1. **Opción 1: Swagger Editor Online**
   - Ve a [editor.swagger.io](https://editor.swagger.io/)
   - Copia el contenido de `swagger.yaml`
   - Pégalo en el editor

2. **Opción 2: Instalar Swagger UI localmente**

```bash
# Instalar swagger-ui-express
npm install swagger-ui-express swagger-jsdoc

# Crear endpoint para documentación
# En tu aplicación Next.js
```

3. **Opción 3: Usar extensión de VS Code**
   - Instala "Swagger Viewer" en VS Code
   - Abre el archivo `swagger.yaml`
   - Presiona `Shift + Alt + P` y selecciona "Preview Swagger"

## 🔧 Ejemplos de Uso

### Cliente JavaScript/TypeScript

```typescript
class EduPlannerAPI {
  private baseUrl: string
  private token: string

  constructor(baseUrl: string, token: string) {
    this.baseUrl = baseUrl
    this.token = token
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`,
        ...options.headers
      }
    })

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`)
    }

    return response
  }

  async chatWithAI(messages: Array<{role: string, content: string}>) {
    const response = await this.request('/chat', {
      method: 'POST',
      body: JSON.stringify({ messages })
    })
    return response.text()
  }

  async generateExam(messages: Array<{role: string, content: string}>) {
    const response = await this.request('/generate-exam', {
      method: 'POST',
      body: JSON.stringify({ messages })
    })
    return response.json()
  }

  async getMessages(userId: string) {
    const response = await this.request(`/messages?user_id=${userId}`)
    return response.json()
  }

  async saveMessage(userId: string, content: string, type: string) {
    const response = await this.request('/save-message', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, content, type })
    })
    return response.json()
  }
}

// Uso
const api = new EduPlannerAPI('http://localhost:3000/api', token)

// Chat con IA
const aiResponse = await api.chatWithAI([
  { role: 'user', content: 'Ayúdame con una planeación de ciencias' }
])

// Generar examen
const exam = await api.generateExam([
  { role: 'user', content: 'Genera un examen de matemáticas para 3er grado' }
])
```

### Cliente React Native

```typescript
// hooks/useEduPlannerAPI.ts
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(supabaseUrl, supabaseKey)

export const useEduPlannerAPI = () => {
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Obtener sesión actual
    supabase.auth.getSession().then(({ data: { session } }) => {
      setToken(session?.access_token || null)
      setLoading(false)
    })

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setToken(session?.access_token || null)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
    if (!token) throw new Error('No authenticated')

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers
      }
    })

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`)
    }

    return response
  }

  return {
    token,
    loading,
    apiRequest,
    isAuthenticated: !!token
  }
}
```

## 📱 Desarrollo Móvil

### Configuración para React Native

```bash
# Instalar dependencias
npm install @supabase/supabase-js
```

```typescript
// config/api.ts
export const API_CONFIG = {
  baseUrl: __DEV__ 
    ? 'http://localhost:3000/api' 
    : 'https://eduplanner.vercel.app/api',
  timeout: 30000
}
```

### Configuración para Flutter

```yaml
# pubspec.yaml
dependencies:
  supabase_flutter: ^2.0.0
  http: ^1.0.0
```

```dart
// lib/services/api_service.dart
class EduPlannerAPI {
  static const String baseUrl = 'https://eduplanner.vercel.app/api';
  
  static Future<Map<String, dynamic>> chatWithAI(List<Map<String, String>> messages) async {
    final response = await http.post(
      Uri.parse('$baseUrl/chat'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
      body: jsonEncode({'messages': messages}),
    );
    
    return jsonDecode(response.body);
  }
}
```

## 🔒 Seguridad

### Mejores Prácticas

1. **Nunca expongas las API keys** en el código del cliente
2. **Usa HTTPS** en producción
3. **Valida tokens** en cada request
4. **Implementa rate limiting** para prevenir abuso
5. **Sanitiza inputs** para prevenir inyecciones

### Rate Limiting (Recomendado)

```javascript
// middleware/rateLimit.js
import rateLimit from 'express-rate-limit'

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por ventana
  message: 'Demasiadas solicitudes, intenta de nuevo más tarde'
})
```

## 🐛 Manejo de Errores

### Códigos de Estado HTTP

- `200` - Éxito
- `400` - Solicitud inválida
- `401` - No autorizado
- `403` - Prohibido
- `404` - No encontrado
- `429` - Demasiadas solicitudes
- `500` - Error del servidor

### Estructura de Errores

```json
{
  "error": "Código del error",
  "message": "Descripción del error",
  "details": "Información adicional (opcional)"
}
```

## 📞 Soporte

Para soporte técnico o preguntas sobre la API:

- **Email**: support@eduplanner.com
- **Documentación**: Este archivo
- **Issues**: GitHub Issues (si aplica)

---

**Última actualización**: Diciembre 2024
**Versión de la API**: 1.0.0