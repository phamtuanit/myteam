cd /d %~dp0

SET CURRPATH=%~dp0..\
SET DB_PATH=%CURRPATH%DB
SET ELASTIC_DB_PATH=%DB_PATH%\elasticsearch
SET ELASTIC_DB_LOG_PATH=%DB_PATH%\logs\elasticsearch

echo Setting up elasticsearch: %ELASTIC_DB_PATH%
elasticsearch -E path.data=%ELASTIC_DB_PATH% -E path.logs=%ELASTIC_DB_LOG_PATH%