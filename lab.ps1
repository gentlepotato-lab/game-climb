<#
  game / climb — 서비스 제어 스크립트 (네이티브 실행, Docker 미사용)

  사용법:
    .\lab.ps1 api        서버(Express) 포그라운드 실행 :18201
    .\lab.ps1 api-bg     서버 백그라운드 실행
    .\lab.ps1 dev        웹 개발 서버 :28201 (서버 자동 기동 포함)
    .\lab.ps1 build      웹 프로덕션 빌드 → apps\web\dist
                         ★ 게이트웨이가 이 폴더를 직접 서빙한다. 복사 단계 없음.
    .\lab.ps1 stop       백그라운드 서버 정지
    .\lab.ps1 status     포트/프로세스 확인

  접속:
    개발   http://localhost:28201/
    서비스 http://climb.game.localhost/          (게이트웨이 기동 필요)
           http://<이 PC IP>:8201/             (폰 등 외부 기기)

  주의: apps\server\.env 의 DB_INIT 은 0 이어야 한다.
        1 이면 부팅할 때마다 sql\001_init.sql 이 실행된다.
#>
param(
  [Parameter(Position = 0)]
  [ValidateSet('api', 'api-bg', 'dev', 'build', 'stop', 'status')]
  [string]$Action = 'status'
)

$ErrorActionPreference = 'Stop'
$Root      = $PSScriptRoot
$ServerDir = Join-Path $Root 'apps\server'
$WebDir    = Join-Path $Root 'apps\web'
$ApiPort   = 18201
$WebPort   = 28201
$PidFile   = Join-Path $Root '.api.pid'

switch ($Action) {

  'api' {
    Set-Location $ServerDir
    npm run dev
  }

  'api-bg' {
    if (Test-Path $PidFile) {
      $old = Get-Content $PidFile
      if (Get-Process -Id $old -ErrorAction SilentlyContinue) {
        Write-Host "이미 실행 중입니다 (PID $old)" -ForegroundColor Yellow; break
      }
    }
    $p = Start-Process -FilePath "cmd.exe" -ArgumentList "/c", "npm run dev" `
         -WorkingDirectory $ServerDir -WindowStyle Hidden -PassThru
    $p.Id | Set-Content $PidFile
    Start-Sleep -Seconds 4
    if (Get-Process -Id $p.Id -ErrorAction SilentlyContinue) {
      Write-Host "서버 기동 (PID $($p.Id)) — http://127.0.0.1:$ApiPort" -ForegroundColor Green
    } else {
      Write-Host "기동 실패. .\lab.ps1 api 로 포그라운드 실행해 오류를 확인하세요." -ForegroundColor Red
    }
  }

  'dev' {
    Set-Location $WebDir
    npm run dev
  }

  'build' {
    Set-Location $WebDir
    npm run build
    if ($LASTEXITCODE -eq 0) {
      Write-Host "`n빌드 완료 → $WebDir\dist" -ForegroundColor Green
      Write-Host "게이트웨이가 이 폴더를 직접 읽으므로 복사할 필요가 없습니다. 새로고침만 하세요." -ForegroundColor Green
    }
  }

  'stop' {
    if (Test-Path $PidFile) {
      $id = Get-Content $PidFile
      $proc = Get-Process -Id $id -ErrorAction SilentlyContinue
      if ($proc) { $proc | Stop-Process -Force }
      Remove-Item $PidFile -Force
    }
    # npm run dev 는 tsx 자식 프로세스를 남기므로 포트 기준으로 한 번 더 정리
    $conns = netstat -ano | Select-String ":$ApiPort\s.*LISTENING"
    foreach ($c in $conns) {
      $procId = ($c -split '\s+')[-1]
      if ($procId -match '^\d+$') { Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue }
    }
    Write-Host "정지 완료" -ForegroundColor Green
  }

  'status' {
    Write-Host "-- :$ApiPort (server) --"
    netstat -ano | Select-String ":$ApiPort\s.*LISTENING"
    Write-Host "-- :$WebPort (web dev) --"
    netstat -ano | Select-String ":$WebPort\s.*LISTENING"
    Write-Host "-- dist --"
    $d = Join-Path $WebDir 'dist\index.html'
    if (Test-Path $d) { "빌드됨: $((Get-Item $d).LastWriteTime)" } else { "dist 없음 — .\lab.ps1 build 필요" }
  }
}
