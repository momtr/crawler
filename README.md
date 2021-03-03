# HPI
web crawler that saves results as files. resilient through redis

## Run
- edit `.env` file
- create redis server: `docker run --name engine-db-redis -p 6379:6379  -d redis redis-server --appendonly yes`
- start crawler `cd crawler && node index.js`