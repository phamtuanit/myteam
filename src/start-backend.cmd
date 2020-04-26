cd /d %~dp0

SET CURRPATH=%~dp0
SET DB_PATH=%CURRPATH%DB
SET MONGO_DB_PATH=%DB_PATH%\mongodb
SET REDIS_DB_PATH=%DB_PATH%\redis
SET REDIS_DB_CONF=%REDIS_DB_PATH%\redis.conf

echo Setting up mongodDB: %DB_PATH%
start "myteam-mongodb" mongod.exe --dbpath=%MONGO_DB_PATH%  --bind_ip_all


cd %REDIS_DB_PATH%
echo Setting up Redis: %REDIS_DB_PATH%
start "myteam-redis" redis-server.exe %REDIS_DB_CONF%

cd /d %~dp0
cd backend
npm start