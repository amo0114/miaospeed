@echo off
chcp 65001 >nul 2>&1
setlocal enabledelayedexpansion

echo.
echo ========================================
echo   MiaoSpeed dev startup
echo ========================================
echo.

cd /d "%~dp0"

for /f "tokens=5" %%P in ('netstat -ano ^| findstr ":8765" ^| findstr "LISTENING"') do set BACKEND_PID=%%P
if defined BACKEND_PID (
    echo [ERROR] Port 8765 is already in use by PID !BACKEND_PID!.
    echo         Stop the old backend before running this script.
    echo.
    exit /b 1
)

for /f "tokens=5" %%P in ('netstat -ano ^| findstr ":5173" ^| findstr "LISTENING"') do set FRONTEND_PID=%%P
if defined FRONTEND_PID (
    echo [WARN] Port 5173 is already in use by PID !FRONTEND_PID!.
    echo        Vite may choose another port unless you stop the old frontend first.
    echo.
)

where go >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Go is not installed.
    echo         Install Go from https://go.dev/dl/
    echo         or run: winget install GoLang.Go
    pause
    exit /b 1
)

if not exist "utils\embeded" mkdir "utils\embeded"
if not exist "preconfigs\embeded\miaokoCA" mkdir "preconfigs\embeded\miaokoCA"

echo MIAOKO4^|580JxAo049R^|GEnERAl^|1X571R930^|T0kEN> "utils\embeded\BUILDTOKEN.key"

if not exist "preconfigs\embeded\miaokoCA\miaoko.crt" (
  echo -----BEGIN CERTIFICATE----- > "preconfigs\embeded\miaokoCA\miaoko.crt"
  echo MIICpDCCAYwCCQDU+pQ4pHgB2jANBgkqhkiG9w0BAQsFADAUMRIwEAYDVQQDDAls >> "preconfigs\embeded\miaokoCA\miaoko.crt"
  echo b2NhbGhvc3QwHhcNMjUwMTAxMDAwMDAwWhcNMzUwMTAxMDAwMDAwWjAUMRIwEAYD >> "preconfigs\embeded\miaokoCA\miaoko.crt"
  echo VQQDDAlsb2NhbGhvc3QwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQC7 >> "preconfigs\embeded\miaokoCA\miaoko.crt"
  echo -----END CERTIFICATE----- >> "preconfigs\embeded\miaokoCA\miaoko.crt"
)

if not exist "preconfigs\embeded\miaokoCA\miaoko.key" (
  echo -----BEGIN RSA PRIVATE KEY----- > "preconfigs\embeded\miaokoCA\miaoko.key"
  echo MIIEowIBAAKCAQEAu6OC81fjA5R1zAh8mKdFRAyi+7yvhjwmUTEO1cXSdBzBzqAZ >> "preconfigs\embeded\miaokoCA\miaoko.key"
  echo -----END RSA PRIVATE KEY----- >> "preconfigs\embeded\miaokoCA\miaoko.key"
)

if not exist "preconfigs\embeded\ca-certificates.crt" (
  echo -----BEGIN CERTIFICATE----- > "preconfigs\embeded\ca-certificates.crt"
  echo Placeholder - Run setup-dev.ps1 to generate proper certificates >> "preconfigs\embeded\ca-certificates.crt"
  echo -----END CERTIFICATE----- >> "preconfigs\embeded\ca-certificates.crt"
)

echo [i] Building backend binary...
set CGO_ENABLED=0
go build -o miaospeed.exe .
if %errorlevel% neq 0 (
    echo [ERROR] Backend build failed.
    pause
    exit /b 1
)

if not exist "web\node_modules" (
    echo [i] Installing frontend dependencies...
    pushd web
    call npm install
    popd
)

echo.
echo ========================================
echo   Starting services
echo ========================================
echo.

echo [i] Starting backend on 127.0.0.1:8765
echo     path: /ws
echo     token: dev-token-123
echo     tls: disabled
echo.
start "MiaoSpeed Backend" cmd /k "cd /d "%~dp0" && miaospeed.exe server -bind 127.0.0.1:8765 -path /ws -token dev-token-123"

timeout /t 2 /nobreak >nul

echo [i] Starting frontend dev server...
echo     default url: http://localhost:5173
echo     note: if 5173 is busy, check the frontend window for the actual port.
echo.
start "MiaoSpeed Frontend" cmd /k "cd /d "%~dp0web" && npm run dev"

echo.
echo ========================================
echo   Recommended UI settings
echo ========================================
echo.
echo   Server URL: ws://localhost:5173
echo   WebSocket Path: /ws
echo   Startup Token: dev-token-123
echo   Build Token: MIAOKO4^|580JxAo049R^|GEnERAl^|1X571R930^|T0kEN
echo.
echo If the frontend starts on a different port, use that port in Server URL.
echo.
pause
