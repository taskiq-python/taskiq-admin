# taskiq-admin-client

Schedule management client for [taskiq-admin](https://github.com/taskiq-python/taskiq-admin).

It connects a taskiq scheduler to the admin's `/schedules` page:
the admin shows all schedules of every source and lets you delete,
reschedule and trigger them, while all changes are applied by this
client inside the scheduler process. The admin never needs network
access to your workers or your broker.

## Usage

With taskiq scheduler plugins (taskiq >= 0.12.5):

```python
from taskiq import TaskiqScheduler
from taskiq.schedule_sources import LabelScheduleSource
from taskiq_admin_client import AdminSchedulerPlugin

scheduler = TaskiqScheduler(
    broker,
    sources=[redis_source, LabelScheduleSource(broker)],
    plugins=[
        AdminSchedulerPlugin(
            url="http://localhost:3000",
            api_token="supersecret",
            source_names={redis_source: "redis"},
        ),
    ],
)
```

With older taskiq versions, wrap each source instead:

```python
from taskiq_admin_client import AdminScheduleSource

scheduler = TaskiqScheduler(
    broker,
    sources=[
        AdminScheduleSource(
            redis_source,
            url="http://localhost:3000",
            api_token="supersecret",
            source_name="redis",
            broker=broker,
        ),
    ],
)
```

## How it works

- On every schedule refresh the client pushes a full snapshot of each
  source to `POST /api/schedules/snapshot`.
- A background loop polls `POST /api/schedules/commands/poll` for
  commands created from the admin UI (delete, add, trigger), applies
  them to the source or the broker and acknowledges the results via
  `POST /api/schedules/commands/ack`.
- Sources that don't implement `add_schedule`/`delete_schedule`
  (like `LabelScheduleSource`, whose schedules live in code) are
  reported as read-only: the admin only allows triggering their tasks.
- All HTTP errors are logged and suppressed, so an unavailable admin
  never breaks scheduling.
