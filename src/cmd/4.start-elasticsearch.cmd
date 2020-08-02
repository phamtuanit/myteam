cd /d %~dp0

SET CURRPATH=%~dp0..\
SET DB_PATH=%CURRPATH%DB
SET ELASTIC_DB_PATH=%DB_PATH%\elasticsearch
SET ELASTIC_DB_BK_PATH=%DB_PATH%\bk\elasticsearch
SET ELASTIC_DB_LOG_PATH=%DB_PATH%\logs\elasticsearch

echo Setting up elasticsearch: %ELASTIC_DB_PATH%
elasticsearch -E network.host=0.0.0.0 -E cluster.name=my-team  -E node.name=node-248-1 -E path.repo=%ELASTIC_DB_BK_PATH% -E cluster.initial_master_nodes=["node-248-1"] -E path.data=%ELASTIC_DB_PATH% -E path.logs=%ELASTIC_DB_LOG_PATH%