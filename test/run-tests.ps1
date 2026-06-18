# ============================================================
# CastellanStore - Suite de Pruebas con Newman (PowerShell)
# ============================================================
# Ejecuta todas las colecciones de Postman en orden secuencial.
# Las variables de sesion (tokens, IDs) se comparten entre archivos
# usando --export-environment para persistir cambios.
#
# Uso:
#   .\test\run-tests.ps1
#
# Requisitos:
#   - Newman instalado globalmente: npm install -g newman
#   - Docker con el contenedor castellan-backend corriendo
# ============================================================

$BASE_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path
$REPORT_DIR = Join-Path $BASE_DIR "reports"
$TIMESTAMP = Get-Date -Format "yyyyMMdd_HHmmss"
$SUMMARY_FILE = Join-Path $REPORT_DIR "summary_$TIMESTAMP.txt"
$ENV_FILE = Join-Path $BASE_DIR "session.json"

# ============================================================
# Detectar puerto del backend automaticamente desde Docker
# ============================================================
Write-Host "Detectando backend..." -ForegroundColor Cyan
$BACKEND_PORT = $null
try {
    $dockerPorts = docker ps --filter "name=castellan-backend" --format "{{.Ports}}" 2>$null
    if ($dockerPorts) {
        # Buscar el mapeo del tipo 0.0.0.0:XXXX->9100/tcp
        if ($dockerPorts -match '0\.0\.0\.0:(\d+)->9100') {
            $BACKEND_PORT = $Matches[1]
        } elseif ($dockerPorts -match '0\.0\.0\.0:(\d+)') {
            $BACKEND_PORT = $Matches[1]
        }
    }
} catch {
    Write-Host "  No se pudo detectar Docker, usando puerto por defecto" -ForegroundColor Yellow
}

if (-not $BACKEND_PORT) {
    # Intentar leer del session.json como fallback
    try {
        $session = Get-Content $ENV_FILE -Raw | ConvertFrom-Json
        $baseUrlEntry = $session.values | Where-Object { $_.key -eq 'baseUrl' }
        if ($baseUrlEntry -and $baseUrlEntry.value -match ':(\d+)$') {
            $BACKEND_PORT = $Matches[1]
        }
    } catch {}
}

if (-not $BACKEND_PORT) {
    $BACKEND_PORT = "9100"
}

$BACKEND_URL = "http://localhost:$BACKEND_PORT"
Write-Host "  Backend detectado en: $BACKEND_URL" -ForegroundColor Green

# Actualizar session.json con la URL correcta
try {
    $sessionContent = Get-Content $ENV_FILE -Raw -Encoding UTF8
    $sessionContent = $sessionContent -replace '("baseUrl"\s*,\s*"value"\s*:\s*")[^"]*(")', "`$1$BACKEND_URL`$2"
    $sessionContent | Out-File -FilePath $ENV_FILE -Encoding UTF8
    Write-Host "  session.json actualizado con: $BACKEND_URL" -ForegroundColor Green
} catch {
    Write-Host "  No se pudo actualizar session.json" -ForegroundColor Yellow
}

# Contadores
$TOTAL = 0
$PASSED = 0
$FAILED = 0

New-Item -ItemType Directory -Force -Path $REPORT_DIR | Out-Null

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  CastellanStore - Suite de Pruebas API" -ForegroundColor Cyan
Write-Host "  $(Get-Date)" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# ============================================================
# Funcion para ejecutar una coleccion
# ============================================================
function Run-Collection {
    param(
        [string]$Name,
        [string]$File,
        [switch]$ExportEnv
    )

    Write-Host "[Ejecutando] $Name..." -ForegroundColor Yellow

    $cmd = "newman run `"$File`" --environment `"$ENV_FILE`" --env-var `"baseUrl=$BACKEND_URL`" --reporters cli --color on"

    if ($ExportEnv) {
        $cmd += " --export-environment `"$ENV_FILE`""
    }

    # Ejecutar y capturar resultado
    $exitCode = 0
    try {
        Invoke-Expression $cmd
        if ($LASTEXITCODE -ne 0) { $exitCode = 1 }
    } catch {
        $exitCode = 1
    }

    $script:TOTAL += 1
    if ($exitCode -eq 0) {
        Write-Host ("  OK: " + $Name) -ForegroundColor Green
        $script:PASSED += 1
    } else {
        Write-Host ("  FALLO: " + $Name) -ForegroundColor Red
        $script:FAILED += 1
    }
    Write-Host ""
}

# ============================================================
# 1. Autenticacion (obtiene userToken y adminToken)
# ============================================================
Write-Host "--- Fase 1: Autenticacion ---" -ForegroundColor Cyan
Run-Collection -Name "auth" -File (Join-Path $BASE_DIR "auth.json") -ExportEnv

# ============================================================
# 2. Catalogo publico (obtiene watchId)
# ============================================================
Write-Host "--- Fase 2: Catalogo Publico ---" -ForegroundColor Cyan
Run-Collection -Name "watches" -File (Join-Path $BASE_DIR "watches.json") -ExportEnv

# ============================================================
# 3. Carrito de compras (requiere userToken y watchId)
# ============================================================
Write-Host "--- Fase 3: Carrito ---" -ForegroundColor Cyan
Run-Collection -Name "cart" -File (Join-Path $BASE_DIR "cart.json") -ExportEnv

# ============================================================
# 4. Pedidos (requiere userToken, crea orderId y orderNumber)
# ============================================================
Write-Host "--- Fase 4: Pedidos ---" -ForegroundColor Cyan
Run-Collection -Name "orders" -File (Join-Path $BASE_DIR "orders.json") -ExportEnv

# ============================================================
# 5. Cupones y contacto
# ============================================================
Write-Host "--- Fase 5: Cupones y Contacto ---" -ForegroundColor Cyan
Run-Collection -Name "coupons" -File (Join-Path $BASE_DIR "coupons.json") -ExportEnv
Run-Collection -Name "contacts" -File (Join-Path $BASE_DIR "contacts.json")

# ============================================================
# 6. Facturas e imagenes (publicos, usan orderNumber)
# ============================================================
Write-Host "--- Fase 6: Facturas e Imagenes ---" -ForegroundColor Cyan
Run-Collection -Name "invoices" -File (Join-Path $BASE_DIR "invoices.json")
Run-Collection -Name "images" -File (Join-Path $BASE_DIR "images.json")

# ============================================================
# 7. Admin (requiere adminToken con ROLE_MANAGER)
# ============================================================
Write-Host "--- Fase 7: Administracion ---" -ForegroundColor Cyan
Run-Collection -Name "admin-dashboard" -File (Join-Path $BASE_DIR "admin-dashboard.json")
Run-Collection -Name "admin-products" -File (Join-Path $BASE_DIR "admin-products.json") -ExportEnv
Run-Collection -Name "admin-orders" -File (Join-Path $BASE_DIR "admin-orders.json")
Run-Collection -Name "admin-coupons" -File (Join-Path $BASE_DIR "admin-coupons.json") -ExportEnv

# ============================================================
# 8. Direcciones guardadas (requiere userToken)
# ============================================================
Write-Host "--- Fase 8: Direcciones ---" -ForegroundColor Cyan
Run-Collection -Name "addresses" -File (Join-Path $BASE_DIR "addresses.json") -ExportEnv

# ============================================================
# 9. Cancelacion de pedidos (requiere userToken)
# ============================================================
Write-Host "--- Fase 9: Cancelacion de Pedidos ---" -ForegroundColor Cyan
Run-Collection -Name "cancel-order" -File (Join-Path $BASE_DIR "cancel-order.json") -ExportEnv

# ============================================================
# 10. Reviews (requiere userToken)
# ============================================================
Write-Host "--- Fase 10: Reviews ---" -ForegroundColor Cyan
Run-Collection -Name "reviews" -File (Join-Path $BASE_DIR "reviews.json") -ExportEnv

# ============================================================
# 11. Wishlist (requiere userToken)
# ============================================================
Write-Host "--- Fase 11: Wishlist ---" -ForegroundColor Cyan
Run-Collection -Name "wishlist" -File (Join-Path $BASE_DIR "wishlist.json") -ExportEnv

# ============================================================
# 12. Admin - Usuarios y Logs (requiere adminToken)
# ============================================================
Write-Host "--- Fase 12: Admin Usuarios y Logs ---" -ForegroundColor Cyan
Run-Collection -Name "admin-users" -File (Join-Path $BASE_DIR "admin-users.json") -ExportEnv

# ============================================================
# 13. Pagos Stripe (requiere userToken y adminToken)
# ============================================================
Write-Host "--- Fase 13: Pagos Stripe ---" -ForegroundColor Cyan
Run-Collection -Name "payments" -File (Join-Path $BASE_DIR "payments.json") -ExportEnv

# ============================================================
# 14. Admin - Activity Logs y Rollback (requiere adminToken)
# ============================================================
Write-Host "--- Fase 14: Activity Logs y Rollback ---" -ForegroundColor Cyan
Run-Collection -Name "admin-activity-logs" -File (Join-Path $BASE_DIR "admin-activity-logs.json") -ExportEnv

# ============================================================
# 15. Factura PDF (publico, usa orderNumber)
# ============================================================
Write-Host "--- Fase 15: Factura PDF ---" -ForegroundColor Cyan
Run-Collection -Name "invoice-pdf" -File (Join-Path $BASE_DIR "invoice-pdf.json")

# ============================================================
# Resumen final
# ============================================================
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  RESUMEN DE PRUEBAS" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ("  Total:  " + $TOTAL)
Write-Host ("  Exitosas: " + $PASSED) -ForegroundColor Green
Write-Host ("  Fallidas: " + $FAILED) -ForegroundColor Red
Write-Host "============================================" -ForegroundColor Cyan

# Guardar resumen a archivo
@"
CastellanStore - Suite de Pruebas API
Fecha: $(Get-Date)
========================================
Total:  $TOTAL
Exitosas: $PASSED
Fallidas: $FAILED
========================================
"@ | Out-File -FilePath $SUMMARY_FILE -Encoding UTF8

Write-Host ""
Write-Host ("Reportes guardados en: " + $REPORT_DIR)
Write-Host ("Resumen: " + $SUMMARY_FILE)

# Salir con codigo de error si alguna fallo
if ($FAILED -gt 0) {
    exit 1
}
exit 0
