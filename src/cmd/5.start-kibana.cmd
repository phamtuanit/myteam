cd /d %~dp0

SET CURRPATH=%~dp0..\

echo Setting up Kibana
kibana serve -e http://192.168.106.248:9200