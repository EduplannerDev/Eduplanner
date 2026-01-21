# Script para procesar múltiples libros SEP secuencialmente
# Uso: .\process-libros.ps1

# Lista de códigos de libros a procesar (puedes editarla según necesites)
$libros = @(
    # 1° Primaria (falta procesar, P1PCA ya está)
    "P1PAA",
    "P1PEA", 
    "P1SDA",
    "P1MLA",
    "P1TNA",
    "P1TPA"
    # Descomenta P1LPM si quieres incluir la guía para maestros
    # "P1LPM"
)

# Estadísticas
$totalLibros = $libros.Count
$librosCompletados = 0
$errores = @()

Write-Host "`n🚀 Iniciando procesamiento masivo de libros SEP" -ForegroundColor Cyan
Write-Host "📖 Total de libros a procesar: $totalLibros`n" -ForegroundColor Yellow

foreach ($libro in $libros) {
    $libroNum = $librosCompletados + 1
    
    Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor DarkGray
    Write-Host "📚 Libro $libroNum/$totalLibros : $libro" -ForegroundColor Green
    Write-Host "═══════════════════════════════════════════════════════`n" -ForegroundColor DarkGray
    
    # Paso 1: Scraping
    Write-Host "  [1/3] 📥 Descargando imágenes..." -ForegroundColor Cyan
    npm run sep:scrape -- --libro=$libro
    if ($LASTEXITCODE -ne 0) {
        $errores += "$libro : Error en scraping"
        Write-Host "  ❌ Error en scraping, saltando al siguiente libro`n" -ForegroundColor Red
        continue
    }
    
    # Paso 2: OCR
    Write-Host "`n  [2/3] 🔍 Procesando OCR (esto tomará ~15-20 min)..." -ForegroundColor Cyan
    npm run sep:ocr -- --libro=$libro
    if ($LASTEXITCODE -ne 0) {
        $errores += "$libro : Error en OCR"
        Write-Host "  ❌ Error en OCR, saltando al siguiente libro`n" -ForegroundColor Red
        continue
    }
    
    # Paso 3: Vectorización
    Write-Host "`n  [3/3] 🧩 Vectorizando e insertando en Supabase..." -ForegroundColor Cyan
    npm run sep:vectorize -- --libro=$libro
    if ($LASTEXITCODE -ne 0) {
        $errores += "$libro : Error en vectorización"
        Write-Host "  ❌ Error en vectorización`n" -ForegroundColor Red
        continue
    }
    
    $librosCompletados++
    Write-Host "`n  ✅ Libro $libro completado exitosamente!`n" -ForegroundColor Green
    
    # Pausa pequeña entre libros
    Start-Sleep -Seconds 2
}

# Resumen final
Write-Host "`n`n" -NoNewline
Write-Host "════════════════════════════════════════════════════════" -ForegroundColor DarkGray
Write-Host "📊 RESUMEN FINAL" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════════" -ForegroundColor DarkGray
Write-Host "Libros procesados exitosamente: $librosCompletados / $totalLibros" -ForegroundColor Green
Write-Host "Errores: $($errores.Count)" -ForegroundColor $(if ($errores.Count -gt 0) { "Red" } else { "Green" })

if ($errores.Count -gt 0) {
    Write-Host "`n⚠️  Libros con errores:" -ForegroundColor Yellow
    foreach ($error in $errores) {
        Write-Host "   - $error" -ForegroundColor Red
    }
}

Write-Host "`n✅ Proceso completado!" -ForegroundColor Green
Write-Host "📁 Archivos guardados en: downloads/sep-books y downloads/sep-books-ocr" -ForegroundColor Gray
Write-Host "💾 Datos vectorizados en Supabase: tabla sep_books_content`n" -ForegroundColor Gray
