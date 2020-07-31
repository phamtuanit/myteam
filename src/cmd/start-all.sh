#!/bin/bash
# Variables
# Absolute path to this script, e.g. /home/user/bin/foo.sh
SCRIPT=$(readlink -f "$0")
# Absolute path this script is in, thus /home/user/bin
CURRPATH=$(dirname "$SCRIPT")
echo $CURRPATH
DB_PATH=$CURRPATH/../DB
MONGO_DB_PATH=$DB_PATH/mongodb
REDIS_DB_PATH=$DB_PATH/redis
REDIS_DB_CONF=$REDIS_DB_PATH/redis.conf
ELASTIC_DB_PATH=$DB_PATH/elasticsearch
ELASTIC_DB_LOG_PATH=$DB_PATH/logs/elasticsearch

start mongod.exe --dbpath=$MONGO_DB_PATH  --bind_ip_all

start elasticsearch -E network.host=0.0.0.0 -E cluster.name=my-team  -E node.name=node-248-1 -E cluster.initial_master_nodes=["node-248-1"] -E path.data=$ELASTIC_DB_PATH -E path.logs=$ELASTIC_DB_LOG_PATH

cd $REDIS_DB_PATH
redis-server.exe $REDIS_DB_CONF