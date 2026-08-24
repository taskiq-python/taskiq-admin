import json
from datetime import datetime, timezone
from logging import getLogger
from typing import TYPE_CHECKING, Any, Optional
from urllib.parse import urljoin

import aiohttp

from taskiq.abc.schedule_source import ScheduleSource
from taskiq.compat import model_dump, model_validate
from taskiq.kicker import AsyncKicker
from taskiq.scheduler.scheduled_task import ScheduledTask

if TYPE_CHECKING:  # pragma: no cover
    from taskiq.abc.broker import AsyncBroker, AsyncTaskiqDecoratedTask

logger = getLogger("taskiq_admin_client")


def _json_safe(value: Any) -> Any:
    """Return the value if it's JSON serializable, its repr otherwise."""
    try:
        json.dumps(value)
    except Exception:
        return repr(value)
    return value


def is_editable_source(source: ScheduleSource) -> bool:
    """
    Check whether a source supports adding and deleting schedules.

    Sources that don't override the optional `add_schedule` and
    `delete_schedule` methods of the `ScheduleSource` base class
    (like the label based one) are read-only for the admin.

    :param source: source to check.
    :return: True if the source is editable.
    """
    source_class = type(source)
    return (
        source_class.add_schedule is not ScheduleSource.add_schedule
        and source_class.delete_schedule is not ScheduleSource.delete_schedule
    )


def dump_schedule(schedule: ScheduledTask) -> dict[str, Any]:
    """
    Serialize a schedule into a snapshot item.

    If the schedule's arguments cannot be serialized to JSON,
    they are replaced with their reprs and the item is marked
    as opaque, so the admin disables editing and triggering for it.

    :param schedule: schedule to serialize.
    :return: snapshot item.
    """
    try:
        data = model_dump(schedule)
        opaque = False
    except Exception:
        opaque = True
        data = {
            "cron": schedule.cron,
            "args": [repr(arg) for arg in schedule.args],
            "kwargs": {key: repr(value) for key, value in schedule.kwargs.items()},
            "labels": {key: repr(value) for key, value in schedule.labels.items()},
            "cron_offset": (
                None if schedule.cron_offset is None else str(schedule.cron_offset)
            ),
            "time": None if schedule.time is None else schedule.time.isoformat(),
            "interval": None if schedule.interval is None else str(schedule.interval),
        }
    cron_offset = data.get("cron_offset")
    return {
        "scheduleId": schedule.schedule_id,
        "taskName": schedule.task_name,
        "cron": data.get("cron"),
        "cronOffset": None if cron_offset is None else str(cron_offset),
        "time": data.get("time"),
        "interval": data.get("interval"),
        "args": data.get("args") or [],
        "kwargs": data.get("kwargs") or {},
        "labels": data.get("labels") or {},
        "opaque": opaque,
    }


async def apply_command(
    command: dict[str, Any],
    source: ScheduleSource,
    broker: "AsyncBroker",
) -> tuple[str, Optional[str]]:
    """
    Apply a single admin command against a source or the broker.

    Delete and add commands are applied to the source, trigger
    commands are kicked to the broker directly.

    :param command: command received from the admin.
    :param source: source the command is scoped to.
    :param broker: broker to kick trigger commands with.
    :return: tuple of resulting status and an optional error.
    """
    command_type = command.get("type")
    payload = command.get("payload") or {}
    editable = is_editable_source(source)
    try:
        if command_type == "delete":
            if not editable:
                return "failed", "Source does not support deleting schedules."
            await source.delete_schedule(payload["schedule_id"])
        elif command_type == "add":
            if not editable:
                return "failed", "Source does not support adding schedules."
            await source.add_schedule(model_validate(ScheduledTask, payload))
        elif command_type == "trigger":
            await AsyncKicker(
                payload["task_name"],
                broker,
                payload.get("labels") or {},
            ).kiq(
                *(payload.get("args") or []),
                **(payload.get("kwargs") or {}),
            )
        else:
            return "failed", f"Unknown command type: {command_type}."
    except Exception as exc:
        logger.exception("Cannot apply admin command %s.", command.get("id"))
        return "failed", repr(exc)
    return "applied", None


class AdminSchedulesClient:
    """
    HTTP client for the schedules API of taskiq-admin.

    All errors are logged and suppressed, so an unavailable
    admin never breaks the scheduler.
    """

    def __init__(self, url: str, api_token: str, timeout: int = 5) -> None:
        self.url = url
        self.api_token = api_token
        self.timeout = timeout
        self._client: Optional[aiohttp.ClientSession] = None

    def _get_client(self) -> aiohttp.ClientSession:
        """Create and cache session."""
        if self._client is None or self._client.closed:
            self._client = aiohttp.ClientSession(
                timeout=aiohttp.ClientTimeout(total=self.timeout),
            )
        return self._client

    async def close(self) -> None:
        """Close the underlying session."""
        if self._client is not None:
            await self._client.close()

    async def _post(self, endpoint: str, payload: dict[str, Any]) -> Any:
        """
        Send a POST request to the admin.

        :param endpoint: endpoint to send the request to.
        :param payload: json payload.
        :return: parsed response or None if the request failed.
        """
        try:
            client = self._get_client()
            async with client.post(
                urljoin(self.url, endpoint),
                headers={"access-token": self.api_token},
                json=payload,
            ) as response:
                response.raise_for_status()
                return await response.json()
        except Exception as exc:
            logger.warning("Cannot reach taskiq-admin at %s: %s", self.url, exc)
            return None

    async def push_snapshot(
        self,
        source_name: str,
        editable: bool,
        schedules: list[ScheduledTask],
    ) -> None:
        """
        Push the full list of schedules of a source to the admin.

        :param source_name: name of the source.
        :param editable: whether the source supports add and delete.
        :param schedules: all schedules the source returned.
        """
        await self._post(
            "/api/schedules/snapshot",
            {
                "sourceName": source_name,
                "editable": editable,
                "scannedAt": datetime.now(timezone.utc).isoformat(),
                "schedules": [dump_schedule(schedule) for schedule in schedules],
            },
        )

    async def push_registered_tasks(
        self,
        tasks: "dict[str, AsyncTaskiqDecoratedTask[Any, Any]]",
    ) -> None:
        """
        Push all registered tasks of the broker to the admin.

        This lets the admin run or schedule any known task,
        even one that has no schedule yet.

        :param tasks: all tasks registered in the broker.
        """
        await self._post(
            "/api/schedules/tasks-snapshot",
            {
                "tasks": [
                    {
                        "name": name,
                        "labels": {
                            key: _json_safe(value)
                            for key, value in task.labels.items()
                        },
                    }
                    for name, task in tasks.items()
                ],
            },
        )

    async def poll_commands(self, source_name: str) -> list[dict[str, Any]]:
        """
        Poll and lease pending commands for a source.

        :param source_name: name of the source.
        :return: list of leased commands.
        """
        response = await self._post(
            "/api/schedules/commands/poll",
            {"sourceName": source_name},
        )
        if response is None:
            return []
        return response.get("commands") or []

    async def ack(self, results: list[dict[str, Any]]) -> None:
        """
        Acknowledge applied or failed commands.

        :param results: list of command results.
        """
        if not results:
            return
        await self._post("/api/schedules/commands/ack", {"results": results})
