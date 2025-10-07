# 🔧 Configuración de Correos - EduPlanner

## ❌ Error: Los correos no se están enviando

Si los correos no se están enviando, sigue estos pasos para diagnosticar y solucionar el problema:

## 🔍 Paso 1: Verificar Variables de Entorno

### Variables Requeridas

Debes tener configuradas estas variables de entorno en tu archivo `.env.local`:

```env
# OBLIGATORIO: API Key de Resend
RESEND_API_KEY=re_tu_api_key_aqui

# OBLIGATORIO: Email de remitente (debe estar verificado en Resend)
FROM_EMAIL="Eduplanner <contacto@eduplanner.mx>"

# OPCIONAL: URL base del sitio
NEXT_PUBLIC_SITE_URL=https://app.eduplanner.mx
```

### ⚠️ Importante sobre FROM_EMAIL

- El dominio `eduplanner.mx` debe estar **verificado en Resend**
- Si no tienes acceso al dominio, usa un email verificado temporalmente:
  ```env
  FROM_EMAIL="EduPlanner Test <noreply@tu-dominio-verificado.com>"
  ```

## 🔧 Paso 2: Obtener API Key de Resend

1. Ve a [Resend.com](https://resend.com)
2. Crea una cuenta o inicia sesión
3. Ve a **API Keys** en el dashboard
4. Crea una nueva API Key con permisos de envío
5. Copia la key que empieza con `re_`

## 📧 Paso 3: Configurar Dominio en Resend

### Opción 1: Dominio Propio (Recomendado)
1. En Resend, ve a **Domains**
2. Agrega `eduplanner.mx`
3. Configura los registros DNS según las instrucciones
4. Espera la verificación

### Opción 2: Dominio Temporal (Para Pruebas)
Usa el dominio de sandbox de Resend:
```env
FROM_EMAIL="EduPlanner Test <onboarding@resend.dev>"
```

## 🔍 Paso 4: Verificar Configuración

### Revisar Logs del Servidor

Cuando intentes enviar un correo, revisa la consola del servidor (terminal donde corre `npm run dev`) y busca:

1. **✅ Configuración correcta:**
   ```
   🔍 sendCustomEmail llamada con: {...}
   🔍 sendEmailWithLogo configuración: { hasApiKey: true, ... }
   📤 Enviando correo a Resend: {...}
   ✅ Respuesta de Resend: { data: { id: "..." } }
   ```

2. **❌ Error de API Key:**
   ```
   ❌ RESEND_API_KEY no está configurada
   ```

3. **❌ Error de dominio:**
   ```
   ❌ Error en sendEmailWithLogo: { message: "Domain not verified" }
   ```

4. **❌ Error de quota:**
   ```
   ❌ Error en sendEmailWithLogo: { message: "Rate limit exceeded" }
   ```

## 🛠️ Paso 5: Soluciones por Tipo de Error

### Error: "RESEND_API_KEY no está configurada"

**Solución:**
1. Crea el archivo `.env.local` en la raíz del proyecto
2. Agrega: `RESEND_API_KEY=re_tu_api_key_aqui`
3. Reinicia el servidor de desarrollo

### Error: "Domain not verified"

**Solución:**
1. Cambia temporalmente el FROM_EMAIL:
   ```env
   FROM_EMAIL="EduPlanner Test <onboarding@resend.dev>"
   ```
2. O verifica tu dominio en Resend

### Error: "Rate limit exceeded"

**Solución:**
1. Espera unos minutos antes de enviar más correos
2. Revisa los límites de tu plan en Resend
3. Considera actualizar tu plan si es necesario

### Error: "Invalid email address"

**Solución:**
1. Verifica que los emails de destinatarios sean válidos
2. Usa emails reales para las pruebas

## 🧪 Paso 6: Prueba Simple

Para verificar que Resend funciona, crea un archivo de prueba:

```javascript
// test-email.js
import { Resend } from 'resend';

const resend = new Resend('re_tu_api_key_aqui');

async function testEmail() {
  try {
    const result = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: 'tu-email@ejemplo.com',
      subject: 'Prueba de EduPlanner',
      html: '<p>¡Hola! Este es un correo de prueba.</p>'
    });
    
    console.log('✅ Correo enviado:', result);
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testEmail();
```

Ejecuta: `node test-email.js`

## 📋 Checklist de Configuración

- [ ] Variable `RESEND_API_KEY` configurada
- [ ] Variable `FROM_EMAIL` configurada
- [ ] Archivo `.env.local` existe en la raíz del proyecto
- [ ] Servidor reiniciado después de agregar variables
- [ ] Dominio verificado en Resend (o usando dominio de sandbox)
- [ ] API Key válida y con permisos
- [ ] Plan de Resend no excedido

## 📞 Soporte

Si sigues teniendo problemas después de seguir todos estos pasos:

1. Revisa los logs completos del servidor
2. Verifica tu configuración en el dashboard de Resend
3. Comprueba que el archivo `.env.local` esté en la raíz del proyecto
4. Asegúrate de haber reiniciado el servidor después de configurar las variables

## 🔄 Reiniciar el Servidor

Después de cualquier cambio en `.env.local`:

```bash
# Detener el servidor (Ctrl + C)
# Luego reiniciar:
npm run dev
```

---

*Configuración de Correos - EduPlanner v1.0*
