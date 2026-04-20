@echo off
chcp 65001 > nul
echo ===================================================
echo           Ollama 本地 AI 服务启动器
echo ===================================================

echo [1/2] 检查 Ollama 服务状态...
tasklist /FI "IMAGENAME eq ollama.exe" 2>NUL | find /I /N "ollama.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo [提示] Ollama 服务已在运行中。
) else (
    echo [状态] 正在启动 Ollama 服务...
    start /min "" "ollama" serve
    echo [状态] 等待服务初始化 (5秒)...
    timeout /t 5 /nobreak > nul
)

echo [2/2] 当前已安装的模型列表:
echo ---------------------------------------------------
ollama list
echo ---------------------------------------------------
echo.
echo [提示] 如果你需要下载系统支持的模型，请在新的命令行中运行:
echo   ollama pull deepseek-r1:1.5b
echo   ollama pull deepseek-r1:7b
echo   ollama pull qwen2.5:7b
echo.
echo ===================================================
echo Ollama 服务已就绪，现在可以运行主系统了。
echo ===================================================
pause
