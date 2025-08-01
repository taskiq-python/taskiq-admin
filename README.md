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

1) Add this middleware to your project:

```python
from typing import Any
from urllib.parse import urljoin
from datetime import datetime, UTC

import httpx
from taskiq import TaskiqMiddleware, TaskiqResult, TaskiqMessage

class TaskiqAdminMiddleware(TaskiqMiddleware):
    def __init__(
        self,
        url: str,
        api_token: str,
        taskiq_broker_name: str | None = None,
    ):
        super().__init__()
        self.url = url
        self.api_token = api_token
        self.__ta_broker_name = taskiq_broker_name

    async def post_send(self, message):
        now = datetime.now(UTC).replace(tzinfo=None).isoformat()
        async with httpx.AsyncClient() as client:
            await client.post(
                headers={"access-token": self.api_token},
                url=urljoin(self.url, f"/api/tasks/{message.task_id}/queued"),
                json={
                    "args": message.args,
                    "kwargs": message.kwargs,
                    "taskName": message.task_name,
                    "worker": self.__ta_broker_name,
                    "queuedAt": now,
                },
            )
        return super().post_send(message)

    async def pre_execute(self, message: TaskiqMessage):
        """"""
        now = datetime.now(UTC).replace(tzinfo=None).isoformat()
        async with httpx.AsyncClient() as client:
            await client.post(
                headers={"access-token": self.api_token},
                url=urljoin(self.url, f"/api/tasks/{message.task_id}/started"),
                json={
                    "startedAt": now,
                    "args": message.args,
                    "kwargs": message.kwargs,
                    "taskName": message.task_name,
                    "worker": self.__ta_broker_name,
                },
            )
        return super().pre_execute(message)

    async def post_execute(
        self,
        message: TaskiqMessage,
        result: TaskiqResult[Any],
    ):
        """"""
        now = datetime.now(UTC).replace(tzinfo=None).isoformat()
        async with httpx.AsyncClient() as client:
            await client.post(
                headers={"access-token": self.api_token},
                url=urljoin(
                    self.url,
                    f"/api/tasks/{message.task_id}/executed",
                ),
                json={
                    "finishedAt": now,
                    "error": result.error
                    if result.error is None
                    else repr(result.error),
                    "executionTime": result.execution_time,
                    "returnValue": {"return_value": result.return_value},
                },
            )
        return super().post_execute(message, result)
```

2) Connect the middleware to your broker:
  
```python
...
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

3) Pull the image from GitHub Container Registry: `docker pull ghcr.io/taskiq-python/taskiq-admin:latest`

4) Replace `TASKIQ_ADMIN_API_TOKEN` with any secret enough string and run:
```bash
docker run -d --rm \
  -p "3000:3000" \
  -v "./taskiq-admin-data/:/usr/database/" \
  -e "TASKIQ_ADMIN_API_TOKEN=supersecret" \
  --name "taskiq-admin" \
  "ghcr.io/taskiq-python/taskiq-admin:latest"
```

5) Go to `http://localhost:3000/tasks`

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
