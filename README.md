## Broker-agnostic admin panel for Taskiq

Standalone admin panel with all data stored in SQLite database


- [Broker-agnostic admin panel for Taskiq](#broker-agnostic-admin-panel-for-taskiq)
  - [Previews](#previews)
  - [Usage](#usage)
  - [Docker Compose Example](#docker-compose-example)
  - [Running without Docker](#running-without-docker)
  - [Task States](#task-states)
  - [Development](#development)

### Previews
Tasks Page | Task Details Page
:-------------------------:|:-------------------------:
![Alt text](./docs/images/preview1.png) | ![Alt text](./docs/images/preview2.png)

### Usage

1) Import and connect the middleware to the broker:

```python
...
from taskiq.middlewares.taskiq_admin_middleware import TaskiqAdminMiddleware

broker = (
    RedisStreamBroker(
        url=redis_url,
        queue_name="my_lovely_queue",
    )
    .with_result_backend(result_backend)
    .with_middlewares(
        TaskiqAdminMiddleware(
            url="http://localhost:3000", # the url to your taskiq-admin instance
            api_token="supersecret", # any secret enough string
            taskiq_broker_name="mybroker",
        )
    )
)
...
```

2) Pull the image from GitHub Container Registry: `docker pull ghcr.io/taskiq-python/taskiq-admin:latest`

3) Replace `TASKIQ_ADMIN_API_TOKEN` with any secret enough string and run:
```bash
docker run -d --rm \
  -p "3000:3000" \
  -v "./taskiq-admin-data/:/usr/database/" \
  -e "TASKIQ_ADMIN_API_TOKEN=supersecret" \
  --name "taskiq-admin" \
  "ghcr.io/taskiq-python/taskiq-admin:latest"
```

4) Go to `http://localhost:3000/tasks`

### Docker Compose Example

```yaml
services:
  queue:
    build:
      context: .
      dockerfile: ./Dockerfile
    container_name: my_queue
    command: taskiq worker app.tasks.queue:broker --workers 1 --max-async-tasks 20
    environment:
      - TASKIQ_ADMIN_URL=http://taskiq_admin:3000
      - TASKIQ_ADMIN_API_TOKEN=supersecret
    depends_on:
      - redis
      - taskiq_admin

  taskiq_admin:
    image: ghcr.io/taskiq-python/taskiq-admin:latest
    container_name: taskiq_admin
    ports:
      - 3000:3000
    environment:
      - TASKIQ_ADMIN_API_TOKEN=supersecret
    volumes:
      - admin_data:/usr/database/

volumes:
    admin_data:
```

### Running without Docker
1) `cp env-example .env`, enter `.env` file and fill in all needed variables
2) run `make dev` to run it locally in dev mode
3) run `make prod` to run it locally in prod mode

### Task States
Let's assume we have a task 'do_smth', there are all states it can embrace:
1) `queued` - the task has been sent to the queue without an error
2) `running` - the task is grabbed by a worker and is being processed
3) `success` - the task is fully processed without any errors
4) `failure` - an error occured during the task processing
5) `abandoned` - taskiq-admin sets all 'running' tasks as 'abandoned' if there was a downtime between the time these tasks were in 'running' state and the time of next startup of taskiq-admin

### Development
1) Run `pnpm install` to install all dependencies
2) Run `pnpm db:push` to create the sqlite database if needed
3) Run `pnpm dev` to run the project
