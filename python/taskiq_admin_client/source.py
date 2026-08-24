from logging import getLogger
from typing import TYPE_CHECKING, Optional

from taskiq.abc.schedule_source import ScheduleSource
from taskiq.scheduler.scheduled_task import ScheduledTask
from taskiq.utils import maybe_awaitable

from taskiq_admin_client.client import (
    AdminSchedulesClient,
    apply_command,
    is_editable_source,
)

if TYPE_CHECKING:  # pragma: no cover
    from taskiq.abc.broker import AsyncBroker

logger = getLogger("taskiq_admin_client")


class AdminScheduleSource(ScheduleSource):
    """
    Schedule source wrapper that syncs with taskiq-admin.

    This is a compatibility integration for taskiq versions
    without scheduler plugins. On every `get_schedules` call
    (the scheduler refreshes sources periodically) it applies
    pending admin commands to the wrapped source and pushes
    a snapshot of its schedules to the admin.

    Prefer `AdminSchedulerPlugin` when scheduler plugins are
    available: it applies commands with a low latency instead
    of once per refresh.
    """

    def __init__(
        self,
        wrapped: ScheduleSource,
        url: str,
        api_token: str,
        source_name: Optional[str] = None,
        broker: "Optional[AsyncBroker]" = None,
    ) -> None:
        self.wrapped = wrapped
        self.client = AdminSchedulesClient(url, api_token)
        self.source_name = source_name or type(wrapped).__name__
        self.broker = broker
        self._tasks_pushed = False

    async def startup(self) -> None:
        """Start the wrapped source."""
        await self.wrapped.startup()

    async def shutdown(self) -> None:
        """Shut down the wrapped source and close the client."""
        await self.wrapped.shutdown()
        await self.client.close()

    async def get_schedules(self) -> list[ScheduledTask]:
        """
        Return the wrapped source's schedules, syncing with the admin.

        Pending admin commands are applied first, so the returned
        schedules already include their effect.
        """
        if self.broker is not None and not self._tasks_pushed:
            self._tasks_pushed = True
            await self.client.push_registered_tasks(self.broker.get_all_tasks())
        await self._apply_commands()
        schedules = await self.wrapped.get_schedules()
        await self.client.push_snapshot(
            self.source_name,
            is_editable_source(self.wrapped),
            schedules,
        )
        return schedules

    async def _apply_commands(self) -> None:
        """Poll, apply and acknowledge commands from the admin."""
        commands = await self.client.poll_commands(self.source_name)
        if not commands:
            return
        results = []
        for command in commands:
            if command.get("type") == "trigger" and self.broker is None:
                results.append(
                    {
                        "id": command["id"],
                        "status": "failed",
                        "error": "No broker is set for this source.",
                    },
                )
                continue
            status, error = await apply_command(
                command,
                self.wrapped,
                self.broker,  # type: ignore[arg-type]
            )
            results.append({"id": command["id"], "status": status, "error": error})
        await self.client.ack(results)

    async def add_schedule(self, schedule: ScheduledTask) -> None:
        """Add a schedule to the wrapped source."""
        await self.wrapped.add_schedule(schedule)

    async def delete_schedule(self, schedule_id: str) -> None:
        """Delete a schedule from the wrapped source."""
        await self.wrapped.delete_schedule(schedule_id)

    async def pre_send(self, task: ScheduledTask) -> None:
        """Delegate to the wrapped source."""
        await maybe_awaitable(self.wrapped.pre_send(task))

    async def post_send(self, task: ScheduledTask) -> None:
        """Delegate to the wrapped source."""
        await maybe_awaitable(self.wrapped.post_send(task))
