## Broker-agnostic admin panel for Taskiq

Standalone admin panel with all data stored in SQLite database


- [Broker-agnostic admin panel for Taskiq](#broker-agnostic-admin-panel-for-taskiq)
  - [Previews](#previews)
  - [Usage](#usage)
  - [Docker Compose Examples](#docker-compose-examples)
  - [Development](#development)

### Previews
Tasks Page | Task Details Page
:-------------------------:|:-------------------------:
![Alt text](./docs/images/preview1.png) | ![Alt text](./docs/images/preview2.png)

### Usage

1) Add this middleware to your taskiq broker:

```python
from typing import Any
from urllib.parse import urljoin
from datetime import datetime, UTC

import httpx
from taskiq import TaskiqMiddleware, TaskiqResult, TaskiqMessage

TASKIQ_ADMIN_URL = "..." # or os.getenv() to use .env vars
TASKIQ_ADMIN_API_TOKEN = "..." # or os.getenv() to use .env vars


class TaskiqAdminMiddleware(TaskiqMiddleware):
    def __init__(self, taskiq_broker_name: str | None = None):
        super().__init__()
        self.__ta_broker_name = taskiq_broker_name

    async def pre_execute(self, message: TaskiqMessage):
        """"""
        async with httpx.AsyncClient() as client:
            await client.post(
                headers={"access-token": TASKIQ_ADMIN_API_TOKEN},
                url=urljoin(TASKIQ_ADMIN_URL, f"/api/tasks/{message.task_id}/started"),
                json={
                    "args": message.args,
                    "kwargs": message.kwargs,
                    "taskName": message.task_name,
                    "worker": self.__ta_broker_name,
                    "startedAt": datetime.now(UTC).replace(tzinfo=None).isoformat(),
                },
            )

        return super().pre_execute(message)

    async def post_execute(
        self,
        message: TaskiqMessage,
        result: TaskiqResult[Any],
    ):
        """"""
        async with httpx.AsyncClient() as client:
            await client.post(
                headers={"access-token": TASKIQ_ADMIN_API_TOKEN},
                url=urljoin(TASKIQ_ADMIN_URL, f"/api/tasks/{message.task_id}/executed"),
                json={
                    "error": result.error
                    if result.error is None
                    else repr(result.error),
                    "executionTime": result.execution_time,
                    "returnValue": {"return_value": result.return_value},
                    "finishedAt": datetime.now(UTC).replace(tzinfo=None).isoformat(),
                },
            )

        return super().post_execute(message, result)
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

### Docker Compose Examples

.env file example:
```bash
TASKIQ_ADMIN_URL="http://taskiq_admin:3000"
TASKIQ_ADMIN_API_TOKEN="supersecret"
```

compose.yml file example
```yaml
services:
  queue:
    build:
      context: .
      dockerfile: ./Dockerfile
    container_name: my_queue
    command: taskiq worker app.tasks.queue:broker --workers 1 --max-async-tasks 20
    env_file:
      - .env
    depends_on:
      - redis
      - taskiq_admin

  taskiq_admin:
    image: ghcr.io/taskiq-python/taskiq-admin:latest
    container_name: taskiq_admin
    ports:
      - 3000:3000
    env_file:
      - .env
    volumes:
      - admin_data:/usr/database/

volumes:
    admin_data:
```

### Development
1) Run `pnpm install` to install all dependencies
2) Run `pnpm db:push` to create the sqlite database if needed
3) Run `pnpm dev` to run the project
