@echo off
echo =========================================
echo   Sistema de Controle de Estoque
echo =========================================
echo.
cd backend
if not exist node_modules (
  echo Instalando dependencias...
  call npm install
)
echo A aplicacao ficara disponivel em http://localhost:3000
call npm start
