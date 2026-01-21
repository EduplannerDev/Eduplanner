# Script para procesar libros SEP de 2 a 6 grado
# Uso: .\process-grados-2-6.ps1

$libros = @(
    "P2MLA",
    "P2PAA",
    "P2PCA",
    "P2PEA",
    "P2SDA",
    "P2TNA",
    "P2TPA",
    "P3MLA",
    "P3PAA",
    "P3PCA",
    "P3PEA",
    "P3SDA",
    "P4MLA",
    "P4PAA",
    "P4PCA",
    "P4PEA",
    "P4SDA",
    "P5MLA",
    "P5PAA",
    "P5PCA",
    "P5PEA",
    "P5SDA",
    "P6MLA",
    "P6PAA",
    "P6PCA",
    "P6PEA",
    "P6SDA"
)

$totalLibros = $libros.Count
$librosCompletados = 0
$errores = @()

Write-Host "`nIniciando procesamiento de libros SEP de 2 a 6 grado" -ForegroundColor Cyan
Write-Host "Total de libros a procesar: $totalLibros`n" -ForegroundColor Yellow

foreach ($libro in $libros) {
    $libroNum = $librosCompletados + 1
    
    Write-Host "=======================================================" -ForegroundColor DarkGray
    Write-Host "Libro $libroNum/$totalLibros : $libro" -ForegroundColor Green
    Write-Host "=======================================================`n" -ForegroundColor DarkGray
    
    Write-Host "  [1/3] Descargando imagenes..." -ForegroundColor Cyan
    npm run sep:scrape -- --libro=$libro
    if ($LASTEXITCODE -ne 0) {
        $errores += "$libro : Error en scraping"
        Write-Host "  Error en scraping, saltando al siguiente libro`n" -ForegroundColor Red
        continue
    }
    
    Write-Host "`n  [2/3] Procesando OCR (esto tomara 15-20 min)..." -ForegroundColor Cyan
    npm run sep:ocr -- --libro=$libro
    if ($LASTEXITCODE -ne 0) {
        $errores += "$libro : Error en OCR"
        Write-Host "  Error en OCR, saltando al siguiente libro`n" -ForegroundColor Red
        continue
    }
    
    Write-Host "`n  [3/3] Vectorizando e insertando en Supabase..." -ForegroundColor Cyan
    npm run sep:vectorize -- --libro=$libro
    if ($LASTEXITCODE -ne 0) {
        $errores += "$libro : Error en vectorizacion"
        Write-Host "  Error en vectorizacion`n" -ForegroundColor Red
        continue
    }
    
    $librosCompletados++
    Write-Host "`n  Libro $libro completado exitosamente!`n" -ForegroundColor Green
    
    Start-Sleep -Seconds 2
}

Write-Host "`n`n" -NoNewline
Write-Host "========================================================" -ForegroundColor DarkGray
Write-Host "RESUMEN FINAL" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor DarkGray
Write-Host "Libros procesados exitosamente: $librosCompletados / $totalLibros" -ForegroundColor Green
Write-Host "Errores: $($errores.Count)" -ForegroundColor $(if ($errores.Count -gt 0) { "Red" } else { "Green" })

if ($errores.Count -gt 0) {
    Write-Host "`nLibros con errores:" -ForegroundColor Yellow
    foreach ($error in $errores) {
        Write-Host "   - $error" -ForegroundColor Red
    }
}

Write-Host "`nProceso completado!" -ForegroundColor Green
Write-Host "Archivos guardados en: downloads/sep-books y downloads/sep-books-ocr" -ForegroundColor Gray
Write-Host "Datos vectorizados en Supabase: tabla sep_books_content`n" -ForegroundColor Gray
