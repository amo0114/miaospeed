#Requires -Version 5.1
<#
.SYNOPSIS
    MiaoSpeed 开发环境一键搭建脚本 (Windows)

.DESCRIPTION
    此脚本将：
    1. 检查并安装必要的依赖 (Go, Node.js)
    2. 准备开发用构建嵌入文件
    3. 编译 MiaoSpeed 后端
    4. 安装前端依赖
    5. 启动前后端联调服务

.EXAMPLE
    .\setup-dev.ps1 -BuildBackend
    .\setup-dev.ps1 -StartAll
#>

param(
    [switch]$BuildBackend,
    [switch]$StartAll,
    [switch]$BackendOnly,
    [switch]$FrontendOnly
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
if (-not $ProjectRoot) { $ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path }
if (-not $ProjectRoot) { $ProjectRoot = Get-Location }
$BackendRoot = $ProjectRoot
$FrontendRoot = Join-Path $ProjectRoot "web"

function Write-Success { Write-Host $args -ForegroundColor Green }
function Write-Info { Write-Host $args -ForegroundColor Cyan }
function Write-Warning { Write-Host $args -ForegroundColor Yellow }
function Write-ErrorMsg { Write-Host $args -ForegroundColor Red }

function Show-Banner {
    Write-Host ""
    Write-Success "=========================================================="
    Write-Success "        MiaoSpeed 开发环境搭建脚本 (Windows)"
    Write-Success "=========================================================="
    Write-Host ""
}

function Test-Command($Command) {
    return [bool](Get-Command -Name $Command -ErrorAction SilentlyContinue)
}

function Test-GoEnvironment {
    Write-Info ">>> 检查 Go 环境..."
    if (-not (Test-Command "go")) {
        Write-ErrorMsg "Go 未安装！"
        Write-Host "请安装 Go 1.21 或更高版本："
        Write-Host "  下载地址: https://go.dev/dl/"
        Write-Host "  或使用 winget: winget install GoLang.Go"
        exit 1
    }
    $goVersion = go version
    Write-Success "Go 已安装: $goVersion"
}

function Test-NodeEnvironment {
    Write-Info ">>> 检查 Node.js 环境..."
    if (-not (Test-Command "node")) {
        Write-ErrorMsg "Node.js 未安装！"
        Write-Host "请安装 Node.js 18 或更高版本："
        Write-Host "  下载地址: https://nodejs.org/"
        Write-Host "  或使用 winget: winget install OpenJS.NodeJS.LTS"
        exit 1
    }
    $nodeVersion = node --version
    Write-Success "Node.js 已安装: $nodeVersion"
}

function New-DevCertificates {
    Write-Info ">>> 创建开发用证书文件..."

    $certDir = Join-Path $BackendRoot "preconfigs\embeded\miaokoCA"
    New-Item -ItemType Directory -Force -Path $certDir | Out-Null

    $certPath = Join-Path $certDir "miaoko.crt"
    $keyPath = Join-Path $certDir "miaoko.key"

    if ((Test-Path $certPath) -and (Test-Path $keyPath)) {
        $certContent = Get-Content $certPath -Raw
        if ($certContent -match "BEGIN CERTIFICATE") {
            Write-Success "TLS 证书已存在，跳过生成"
            return
        }
    }

    # 创建临时证书（仅用于编译）
    $certContent = @"
-----BEGIN CERTIFICATE-----
MIICpDCCAYwCCQDU+pQ4pHgB2jANBgkqhkiG9w0BAQsFADAUMRIwEAYDVQQDDAls
b2NhbGhvc3QwHhcNMjUwMTAxMDAwMDAwWhcNMzUwMTAxMDAwMDAwWjAUMRIwEAYD
VQQDDAlsb2NhbGhvc3QwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQC7
o4LzV+MDlHXMCHyYp0VEDKL7vK+HPCZRMQ7VxdJ0HMHOoBl7ELz8VLj7HoR7I8b
V5Vd2c8b7fF0CkAMFSHtHE4jL7fnhcVK7MH1v0FJJdR0bWCBu6P3EKY7B1cGx1
rLVpKR8b7YpR7kO3W2V7i1R7t6Vq+D7m3+V8p7L3q6b1f7V4d3QvV7kR7f3b1
-----END CERTIFICATE-----
"@
    Set-Content -Path $certPath -Value $certContent -Encoding ASCII

    $keyContent = @"
-----BEGIN RSA PRIVATE KEY-----
MIIEowIBAAKCAQEAu6OC81fjA5R1zAh8mKdFRAyi+7yvhjwmUTEO1cXSdBzBzqAZ
exC8/FS4+x6EeyPG1eVXdnPG+3xdApABBUh7RxOIy+354XFSuzB9b9BSSXUdG1g
gbuj9xCmOwdXBsday1aSkfG+2KUe5Dt1tle4tUe7elavg+5t/lfKey96um9X+1eH
d0L1e5Ee3929Uex+1f7V4d3QvV7kR7f3b1e7V4d3QvV7kR7f3b1e7V4d3QvV7kR
-----END RSA PRIVATE KEY-----
"@
    Set-Content -Path $keyPath -Value $keyContent -Encoding ASCII

    Write-Success "TLS 证书已创建"
}

function New-BuildToken {
    Write-Info ">>> 创建 Build Token 文件..."

    $tokenDir = Join-Path $BackendRoot "utils\embeded"
    $tokenPath = Join-Path $tokenDir "BUILDTOKEN.key"

    if (Test-Path $tokenPath) {
        $content = Get-Content $tokenPath -Raw
        if ($content.Trim().Length -gt 0) {
            Write-Success "Build Token 已存在"
            return
        }
    }

    New-Item -ItemType Directory -Force -Path $tokenDir | Out-Null

    $defaultToken = "MIAOKO4|580JxAo049R|GEnERAl|1X571R930|T0kEN"
    Set-Content -Path $tokenPath -Value $defaultToken -Encoding ASCII

    Write-Success "Build Token 已创建"
    Write-Host "  Token: $defaultToken"
}

function New-CACertificates {
    Write-Info ">>> 创建根证书文件..."

    $caPath = Join-Path $BackendRoot "preconfigs\embeded\ca-certificates.crt"

    if (Test-Path $caPath) {
        $content = Get-Content $caPath -Raw
        if ($content.Length -gt 100) {
            Write-Success "根证书文件已存在"
            return
        }
    }

    # 创建占位文件
    $caContent = @"
-----BEGIN CERTIFICATE-----
MIIDrzCCApegAwIBAgIQCDvgVpBCRrGhdWrJWZHHSjANBgkqhkiG9w0BAQUFADBh
MQswCQYDVQQGEwJVUzEVMBMGA1UEChMMRGlnaUNlcnQgSW5jMRkwFwYDVQQLExB3
d3cuZGlnaWNlcnQuY29tMSAwHgYDVQQDExdEaWdpQ2VydCBHbG9iYWwgUm9vdCBD
QTAeFw0wNjExMTAwMDAwMDBaFw0zMTExMTAwMDAwMDBaMGExCzAJBgNVBAYTAlVT
MRUwEwYDVQQKEwxEaWdpQ2VydCBJbmMxGTAXBgNVBAsTEHd3dy5kaWdpY2VydC5j
b20xIDAeBgNVBAMTF0RpZ2lDZXJ0IEdsb2JhbCBSb290IENBMIIBIjANBgkqhkiG
9w0BAQEFAAOCAQ8AMIIBCgKCAQEA4jvhEXLeqKTTo1eqUKKPC3eQyaKl7hLOllsB
CSDMAZOnTjC3U/dDxGkAV53ijSLdhwZAAIEJzs4bg7/fzTtxRuLWZscFs3YnRo98
JiL97ꉂpunctuation_removed觿觿ZqjzAo8GBGZKxKh3FM5Q䧘punctuation_removed
-----END CERTIFICATE-----
"@
    Set-Content -Path $caPath -Value $caContent -Encoding ASCII

    Write-Success "根证书文件已创建"
}

function Build-Backend {
    Write-Info ">>> 编译 MiaoSpeed 后端..."

    Push-Location $BackendRoot
    try {
        Write-Host "  下载 Go 依赖..."
        go mod download

        Write-Host "  编译中..."
        $env:CGO_ENABLED = "0"
        go build -o "miaospeed.exe" .

        if ($LASTEXITCODE -ne 0) {
            throw "编译失败"
        }

        Write-Success "后端编译成功: $BackendRoot\miaospeed.exe"
    }
    finally {
        Pop-Location
    }
}

function Install-FrontendDependencies {
    Write-Info ">>> 安装前端依赖..."

    Push-Location $FrontendRoot
    try {
        if (-not (Test-Path "node_modules")) {
            Write-Host "  npm install..."
            npm install
        } else {
            Write-Success "前端依赖已安装"
        }
    }
    finally {
        Pop-Location
    }
}

function Start-Backend {
    param(
        [string]$Token = "dev-token-123",
        [int]$Port = 8765
    )

    Write-Info ">>> 启动 MiaoSpeed 后端..."

    $backendExe = Join-Path $BackendRoot "miaospeed.exe"

    if (-not (Test-Path $backendExe)) {
        Write-ErrorMsg "后端未编译！请先运行: .\setup-dev.ps1 -BuildBackend"
        exit 1
    }

    Write-Host ""
    Write-Success "=========================================================="
    Write-Success "        MiaoSpeed 后端启动信息"
    Write-Success "=========================================================="
    Write-Host "  监听地址: 127.0.0.1:$Port"
    Write-Host "  Token: $Token"
    Write-Host "  WebSocket 路径: /ws"
    Write-Host "  TLS: 默认本地联调关闭"
    Write-Success "=========================================================="
    Write-Host ""

    $arguments = @(
        "server"
        "-bind", "127.0.0.1:$Port"
        "-path", "/ws"
        "-token", $Token
        "-connthread", "32"
    )

    Start-Process -FilePath $backendExe -ArgumentList $arguments -NoNewWindow
}

function Start-Frontend {
    Write-Info ">>> 启动前端开发服务器..."

    Push-Location $FrontendRoot
    try {
        Write-Host ""
        Write-Success "=========================================================="
        Write-Success "        前端开发服务器启动信息"
        Write-Success "=========================================================="
        Write-Host "  地址: http://localhost:5173"
        Write-Host "  API 代理: ws://localhost:5173/ws -> ws://127.0.0.1:8765/ws"
        Write-Success "=========================================================="
        Write-Host ""

        npm run dev
    }
    finally {
        Pop-Location
    }
}

function Show-DebugInstructions {
    param(
        [string]$Token = "dev-token-123",
        [int]$Port = 8765
    )

    Write-Host ""
    Write-Success "=========================================================="
    Write-Success "        联调配置说明"
    Write-Success "=========================================================="
    Write-Host ""
    Write-Host "1. 打开浏览器访问: http://localhost:5173"
    Write-Host ""
    Write-Host "2. 点击右上角齿轮图标打开设置"
    Write-Host ""
    Write-Host "3. 配置连接信息:"
    Write-Host "   - Server URL: ws://localhost:5173"
    Write-Host "   - WebSocket Path: /ws"
    Write-Host "   - Startup Token: $Token"
    Write-Host "   - Build Token: MIAOKO4|580JxAo049R|GEnERAl|1X571R930|T0kEN"
    Write-Host ""
    Write-Host "4. 点击 'Connect' 连接后端"
    Write-Host ""
    Write-Host "5. 粘贴节点配置并开始测试"
    Write-Host ""
}

function Main {
    Show-Banner

    Test-GoEnvironment
    Test-NodeEnvironment

    Write-Host ""

    New-DevCertificates
    New-BuildToken
    New-CACertificates

    Write-Host ""

    if ($BuildBackend) {
        Build-Backend
        Install-FrontendDependencies
        Write-Host ""
        Write-Success "构建完成！"
        Write-Host "  后端: $BackendRoot\miaospeed.exe"
        Write-Host "  前端: $FrontendRoot"
        exit 0
    }

    if ($BackendOnly) {
        Build-Backend
        Start-Backend
        exit 0
    }

    if ($FrontendOnly) {
        Install-FrontendDependencies
        Start-Frontend
        exit 0
    }

    if ($StartAll) {
        Build-Backend
        Install-FrontendDependencies

        $token = "dev-token-123"
        $port = 8765

        Start-Backend -Token $token -Port $port
        Start-Sleep -Seconds 2
        Show-DebugInstructions -Token $token -Port $port
        Start-Frontend
        exit 0
    }

    Write-Host "使用方法:"
    Write-Host ""
    Write-Host "  .\setup-dev.ps1 -BuildBackend    # 编译后端 + 安装前端依赖"
    Write-Host "  .\setup-dev.ps1 -StartAll         # 编译并启动前后端"
    Write-Host "  .\setup-dev.ps1 -BackendOnly      # 仅启动后端"
    Write-Host "  .\setup-dev.ps1 -FrontendOnly     # 仅启动前端"
    Write-Host ""
    Write-Host "首次使用建议:"
    Write-Host "  1. .\setup-dev.ps1 -BuildBackend"
    Write-Host "  2. .\setup-dev.ps1 -StartAll"
    Write-Host ""
}

Main
