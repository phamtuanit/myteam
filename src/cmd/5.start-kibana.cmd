cd /d %~dp0

SET CURRPATH=%~dp0..\

echo Setting up Kibana
kibana serve -e http://localhost:9200