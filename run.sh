#!/bin/bash
# Merlo Aventura - Iniciar Servidor Local
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

echo "====================================================="
echo "   MERLO AVENTURA - EXCURSIONES 4X4 EN MERLO, SL    "
echo "====================================================="
echo ""
echo "Iniciando servidor local en http://localhost:5050 ..."
echo "Panel de control: http://localhost:5050/admin (Contraseña: admin)"
echo ""
echo "Para detener el servidor, presioná Ctrl + C"
echo ""

"$DIR/venv/bin/python3" "$DIR/app.py"
