#!/bin/bash
# Variables
# Absolute path to this script, e.g. /home/user/bin/foo.sh
SCRIPT=$(readlink -f "$0")
# Absolute path this script is in, thus /home/user/bin
CURRPATH=$(dirname "$SCRIPT")
echo $CURRPATH
DB_PATH=$CURRPATH/DB
MONGO_DB_PATH=$DB_PATH/mongodb
REDIS_DB_PATH=$DB_PATH/redis
REDIS_DB_CONF=$REDIS_DB_PATH/redis.conf

# 1 - Setup ENV
start mongod.exe --dbpath=$MONGO_DB_PATH  --bind_ip_all

redis-server.exe $REDIS_DB_CONF

# 2 - Sart all services
# start npm run service
# pm2 start ./backend/node_modules/moleculer/bin/moleculer-runner.js --name myteam-services -- --instances=2 ./backend/services/*.service.js

# 3 - Wait 1 minute

# 4 - Start gateway
# start npm run gateway
# pm2 start ./backend/node_modules/moleculer/bin/moleculer-runner.js --name myteam-gateway -- ./backend/services/*.gateway.js