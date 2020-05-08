cd /d %~dp0
SET CURRPATH=%~dp0
SET SERVER_PATH=%CURRPATH%backend

echo Setting up environment
start setup_env.cmd

echo Start Server
start-server.cmd