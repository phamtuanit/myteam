cd /d %~dp0
SET CURRPATH=%~dp0
SET SERVER_PATH=%CURRPATH%backend

cd %SERVER_PATH%
echo Start server

npm start


echo ============================= SERVER STOPPED =============================