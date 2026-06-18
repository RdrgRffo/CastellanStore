#!/bin/bash
# ============================================================
# CastellanStore - Suite de Pruebas con Newman
# ============================================================
# Ejecuta todas las colecciones de Postman en orden secuencial.
# Las variables de sesión (tokens, IDs) se comparten entre archivos.
#
# Uso:
#   chmod +x test/run-tests.sh
#   ./test/run-tests.sh
#
# Requisitos:
#   - Newman instalado globalmente: npm install -g newman
#   - Servidor backend corriendo en http://localhost:5000
# ============================================================

BASE_DIR="$(cd "$(dirname "$0")" && pwd)"
REPORT_DIR="$BASE_DIR/reports"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
SUMMARY_FILE="$REPORT_DIR/summary_$TIMESTAMP.txt"
ENV_FILE="$BASE_DIR/session.json"

# ============================================================
# Detectar puerto del backend automáticamente desde Docker
# ============================================================
echo -e "${CYAN}Detectando backend...${NC}"
BACKEND_PORT=""

# Intentar obtener el puerto mapeado del contenedor Docker
if command -v docker &>/dev/null; then
    docker_ports=$(docker ps --filter "name=castellan-backend" --format "{{.Ports}}" 2>/dev/null || true)
    if [ -n "$docker_ports" ]; then
        # Buscar el mapeo del tipo 0.0.0.0:XXXX->9100/tcp
        if echo "$docker_ports" | grep -oP '0\.0\.0\.0:(\d+)->9100' >/dev/null 2>&1; then
            BACKEND_PORT=$(echo "$docker_ports" | grep -oP '0\.0\.0\.0:\K(\d+)(?=->9100)')
        fi
    fi
fi

# Fallback: leer del session.json
if [ -z "$BACKEND_PORT" ] && [ -f "$ENV_FILE" ]; then
    BACKEND_PORT=$(grep -oP '"baseUrl".*?:\s*"\K[^"]+' "$ENV_FILE" 2>/dev/null | grep -oP ':\K(\d+)$' || true)
fi

# Fallback final: puerto por defecto
if [ -z "$BACKEND_PORT" ]; then
    BACKEND_PORT="9100"
fi

BACKEND_URL="http://localhost:$BACKEND_PORT"
echo -e "${GREEN}  Backend detectado en: $BACKEND_URL${NC}"

# Actualizar session.json con la URL correcta
if [ -f "$ENV_FILE" ]; then
    sed -i "s|\"baseUrl\"[^}]*\"value\"[[:space:]]*:[[:space:]]*\"[^\"]*\"|\"baseUrl\",\"value\":\"$BACKEND_URL\"|g" "$ENV_FILE" 2>/dev/null || true
    echo -e "${GREEN}  session.json actualizado con: $BACKEND_URL${NC}"
fi
echo ""

# Colores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Contadores
TOTAL=0
PASSED=0
FAILED=0

mkdir -p "$REPORT_DIR"

echo -e "${CYAN}============================================${NC}"
echo -e "${CYAN}  CastellanStore - Suite de Pruebas API${NC}"
echo -e "${CYAN}  $(date)${NC}"
echo -e "${CYAN}============================================${NC}"
echo ""

# ============================================================
# Función para ejecutar una colección
# ============================================================
run_collection() {
  local name="$1"
  local file="$2"
  local folder="$3"

  echo -e "${YELLOW}[Ejecutando]${NC} $name..."

  local cmd="newman run \"$file\" \
    --environment \"$BASE_DIR/session.json\" \
    --reporters cli \
    --color on"

  # Si se especifica una carpeta, ejecutar solo esa
  if [ -n "$folder" ]; then
    cmd="$cmd --folder \"$folder\""
  fi

  # Ejecutar y capturar resultado
  eval $cmd
  local exit_code=$?

  TOTAL=$((TOTAL + 1))
  if [ $exit_code -eq 0 ]; then
    echo -e "${GREEN}  ✓ $name: OK${NC}"
    PASSED=$((PASSED + 1))
  else
    echo -e "${RED}  ✗ $name: FALLÓ${NC}"
    FAILED=$((FAILED + 1))
  fi
  echo ""
}

# ============================================================
# 1. Autenticación (obtiene userToken y adminToken)
# ============================================================
echo -e "${CYAN}--- Fase 1: Autenticación ---${NC}"

run_collection "auth" "$BASE_DIR/auth.json"

# ============================================================
# 2. Catálogo público (obtiene watchId)
# ============================================================
echo -e "${CYAN}--- Fase 2: Catálogo Público ---${NC}"

run_collection "watches" "$BASE_DIR/watches.json"

# ============================================================
# 3. Carrito de compras (requiere userToken y watchId)
# ============================================================
echo -e "${CYAN}--- Fase 3: Carrito ---${NC}"

run_collection "cart" "$BASE_DIR/cart.json"

# ============================================================
# 4. Pedidos (requiere userToken, crea orderId y orderNumber)
# ============================================================
echo -e "${CYAN}--- Fase 4: Pedidos ---${NC}"

run_collection "orders" "$BASE_DIR/orders.json"

# ============================================================
# 5. Cupones y contacto
# ============================================================
echo -e "${CYAN}--- Fase 5: Cupones y Contacto ---${NC}"

run_collection "coupons" "$BASE_DIR/coupons.json"
run_collection "contacts" "$BASE_DIR/contacts.json"

# ============================================================
# 6. Facturas e imágenes (públicos, usan orderNumber)
# ============================================================
echo -e "${CYAN}--- Fase 6: Facturas e Imágenes ---${NC}"

run_collection "invoices" "$BASE_DIR/invoices.json"
run_collection "images" "$BASE_DIR/images.json"

# ============================================================
# 7. Admin (requiere adminToken con ROLE_MANAGER)
# ============================================================
echo -e "${CYAN}--- Fase 7: Administración ---${NC}"

run_collection "admin-dashboard" "$BASE_DIR/admin-dashboard.json"
run_collection "admin-products" "$BASE_DIR/admin-products.json"
run_collection "admin-orders" "$BASE_DIR/admin-orders.json"
run_collection "admin-coupons" "$BASE_DIR/admin-coupons.json"

# ============================================================
# 8. Direcciones guardadas (requiere userToken)
# ============================================================
echo -e "${CYAN}--- Fase 8: Direcciones ---${NC}"

run_collection "addresses" "$BASE_DIR/addresses.json"

# ============================================================
# 9. Cancelación de pedidos (requiere userToken)
# ============================================================
echo -e "${CYAN}--- Fase 9: Cancelación de Pedidos ---${NC}"

run_collection "cancel-order" "$BASE_DIR/cancel-order.json"

# ============================================================
# 10. Reviews (requiere userToken)
# ============================================================
echo -e "${CYAN}--- Fase 10: Reviews ---${NC}"

run_collection "reviews" "$BASE_DIR/reviews.json"

# ============================================================
# 11. Wishlist (requiere userToken)
# ============================================================
echo -e "${CYAN}--- Fase 11: Wishlist ---${NC}"

run_collection "wishlist" "$BASE_DIR/wishlist.json"

# ============================================================
# 12. Admin - Usuarios y Logs (requiere adminToken)
# ============================================================
echo -e "${CYAN}--- Fase 12: Admin Usuarios y Logs ---${NC}"

run_collection "admin-users" "$BASE_DIR/admin-users.json"

# ============================================================
# 13. Factura PDF (público, usa orderNumber)
# ============================================================
echo -e "${CYAN}--- Fase 13: Factura PDF ---${NC}"

run_collection "invoice-pdf" "$BASE_DIR/invoice-pdf.json"


# ============================================================
# Resumen final
# ============================================================
echo -e "${CYAN}============================================${NC}"
echo -e "${CYAN}  RESUMEN DE PRUEBAS${NC}"
echo -e "${CYAN}============================================${NC}"
echo -e "  Total:  $TOTAL"
echo -e "  ${GREEN}Exitosas: $PASSED${NC}"
echo -e "  ${RED}Fallidas: $FAILED${NC}"
echo -e "${CYAN}============================================${NC}"

# Guardar resumen a archivo
{
  echo "CastellanStore - Suite de Pruebas API"
  echo "Fecha: $(date)"
  echo "========================================"
  echo "Total:  $TOTAL"
  echo "Exitosas: $PASSED"
  echo "Fallidas: $FAILED"
  echo "========================================"
} > "$SUMMARY_FILE"

echo -e "\nReportes guardados en: $REPORT_DIR/"
echo -e "Resumen: $SUMMARY_FILE"

# Salir con código de error si alguna falló
if [ $FAILED -gt 0 ]; then
  exit 1
fi
exit 0
