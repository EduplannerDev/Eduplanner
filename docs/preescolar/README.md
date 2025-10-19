# Importación de PDAs de Preescolar

Este directorio contiene los archivos y scripts necesarios para importar los Procesos de Desarrollo de Aprendizaje (PDAs) de preescolar al sistema EduPlanner.

## 📁 Estructura de Archivos

```
docs/preescolar/
├── README.md                    # Este archivo
├── Preescolar.xlsx             # Archivo Excel con los PDAs (colocar aquí)
└── (otros archivos Excel si los hay)
```

## 🚀 Proceso de Importación

### 1. Preparar el Archivo Excel

1. Coloca tu archivo Excel con los PDAs de preescolar en esta carpeta
2. El archivo debe llamarse `Preescolar.xlsx`
3. El archivo debe tener hojas separadas para cada grado (1°, 2°, 3°)

### 2. Estructura del Excel

El archivo Excel debe tener la siguiente estructura:

- **Columna A**: Contenido o tema
- **Columna C**: Proceso de Desarrollo de Aprendizaje (PDA)
- **Hojas**: Una hoja por grado (ej: "1°", "2°", "3°" o "Primero", "Segundo", "Tercero")

### 3. Ejecutar la Importación

```bash
# Ejecutar la migración de base de datos (solo la primera vez)
npx supabase db push

# Importar los PDAs de preescolar
npx tsx scripts/import-preescolar-pdas.ts
```

### 4. Verificar la Importación

```bash
# Verificar que los PDAs se importaron correctamente
npx tsx scripts/verify-preescolar-pdas.ts
```

## 📊 Campos Formativos de Preescolar

Los siguientes campos formativos se mapean automáticamente:

| Campo en Excel | Campo en Sistema |
|----------------|------------------|
| LENGUAJE ORAL | LENGUAJES |
| LENGUAJE ESCRITO | LENGUAJES |
| LENGUAJES | LENGUAJES |
| PENSAMIENTO MATEMÁTICO | SABERES Y PENSAMIENTO CIENTÍFICO |
| MATEMÁTICAS | SABERES Y PENSAMIENTO CIENTÍFICO |
| EXPLORACIÓN Y COMPRENSIÓN DEL MUNDO NATURAL Y SOCIAL | ÉTICA, NATURALEZA Y SOCIEDADES |
| MUNDO NATURAL Y SOCIAL | ÉTICA, NATURALEZA Y SOCIEDADES |
| ARTES | LENGUAJES |
| EDUCACIÓN FÍSICA | DE LO HUMANO Y LO COMUNITARIO |
| DESARROLLO PERSONAL Y SOCIAL | DE LO HUMANO Y LO COMUNITARIO |
| PERSONAL Y SOCIAL | DE LO HUMANO Y LO COMUNITARIO |

## 🔢 Sistema de Grados

Los grados de preescolar se almacenan como números negativos para evitar conflictos:

- **Preescolar 1°** = Grado -3
- **Preescolar 2°** = Grado -2  
- **Preescolar 3°** = Grado -1

## 🛠️ Scripts Disponibles

### `import-preescolar-pdas.ts`
- Importa los PDAs desde el archivo Excel
- Mapea automáticamente los campos formativos
- Convierte los grados a números negativos
- Maneja duplicados automáticamente

### `verify-preescolar-pdas.ts`
- Verifica que los PDAs se importaron correctamente
- Muestra estadísticas por grado y campo formativo
- Permite buscar PDAs específicos
- Muestra una muestra de los datos importados

## 🔍 Verificación de Datos

Después de la importación, puedes verificar los datos con:

```bash
# Ver estadísticas generales
npx tsx scripts/verify-preescolar-pdas.ts

# Buscar PDAs específicos (modificar el script)
# Ejemplo: buscar "números", "colores", "juego", etc.
```

## ⚠️ Notas Importantes

1. **Migración de Base de Datos**: La primera vez que importes PDAs de preescolar, necesitarás ejecutar la migración que actualiza el constraint de grados.

2. **Duplicados**: El sistema maneja automáticamente los duplicados y los omite.

3. **Campos Formativos**: Si tienes campos formativos que no están en el mapeo, se usarán tal como aparecen en el Excel.

4. **Ejes Articuladores**: Por ahora, los ejes articuladores se dejan como NULL. Se pueden agregar manualmente después si es necesario.

## 🆘 Solución de Problemas

### Error: "El archivo no existe"
- Verifica que el archivo `Preescolar.xlsx` esté en la carpeta `docs/preescolar/`
- Verifica que el nombre del archivo sea exactamente `Preescolar.xlsx`

### Error: "Constraint violation"
- Ejecuta primero la migración: `npx supabase db push`
- Verifica que la migración `20250127000005_update_curriculo_sep_for_preescolar.sql` se haya aplicado

### Error: "No se encontraron PDAs"
- Verifica que el archivo Excel tenga la estructura correcta
- Verifica que las hojas tengan nombres que contengan "1°", "2°", "3°" o "Primero", "Segundo", "Tercero"

## 📞 Soporte

Si tienes problemas con la importación, verifica:

1. La estructura del archivo Excel
2. Los nombres de las hojas
3. Que las variables de entorno estén configuradas
4. Que la migración de base de datos se haya ejecutado

Para más ayuda, revisa los logs de error que aparecen en la consola.
