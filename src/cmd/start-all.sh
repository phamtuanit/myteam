#!/bin/bash
# Variables
# Absolute path to this script, e.g. /home/user/bin/foo.sh
SCRIPT=$(readlink -f "$0")
# Absolute path this script is in, thus /home/user/bin
CURRPATH=$(dirname "$SCRIPT")
echo $CURRPATH
DB_PATH=$CURRPATH/../db
MONGO_DB_PATH=$DB_PATH/mongodb

start mongod.exe --dbpath=$MONGO_DB_PATH  --bind_ip_all

ELASTIC_DB_PATH=$DB_PATH/elasticsearch
ELASTIC_DB_LOG_PATH=$DB_PATH/logs/elasticsearch
ELASTIC_DB_BK_PATH=$DB_PATH/bk/elasticsearch
start elasticsearch -E network.host=0.0.0.0 -E cluster.name=my-team  -E node.name=node-248-1 -E path.repo=$ELASTIC_DB_BK_PATH -E cluster.initial_master_nodes=["node-248-1"] -E path.data=$ELASTIC_DB_PATH -E path.logs=$ELASTIC_DB_LOG_PATH

REDIS_DB_PATH=$DB_PATH/redis
REDIS_DB_CONF=$REDIS_DB_PATH/redis.conf
cd $REDIS_DB_PATH
redis-server.exe $REDIS_DB_CONF