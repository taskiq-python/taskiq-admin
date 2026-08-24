import asyncio
import contextlib
from logging import getLogger
from typing import Any, Optional

from taskiq.abc.schedule_source import ScheduleSource
from taskiq.abc.scheduler_plugin import SchedulerPlugin
from taskiq.scheduler.scheduled_task import ScheduledTask

from taskiq_admin_client.client import (
    AdminSchedulesClient,
    apply_command,
    is_editable_source,
)

logger = getLogger("taskiq_admin_client")


class AdminSchedulerPlugin(SchedulerPlugin):
    """
    Scheduler plugin that syncs schedules with taskiq-admin.

    On every schedule refresh it pushes a snapshot of each source
    to the admin, and in the background it polls the admin for
    commands (delete, add, trigger) created from the UI and applies
    them to the sources or the broker.
    """

    def __init__(
        self,
        url: str,
        api_token: str,
        poll_interval: float = 2.0,
        source_names: Optional[dict[ScheduleSource, str]] = None,
    ) -> None:
        super().__init__()
        self.client = AdminSchedulesClient(url, api_token)
        self.poll_interval = poll_interval
        self._explicit_names = source_names or {}
        self._names: dict[int, str] = {}
        self._poll_task: Optional[asyncio.Task[Any]] = None

    def _resolve_names(self) -> None:
        """Assign a unique name to every source of the scheduler."""
        used: set[str] = set()
        for source in self.scheduler.sources:
            name = self._explicit_names.get(source, type(source).__name__)
            deduplicated = name
            counter = 1
            while deduplicated in used:
                counter += 1
                deduplicated = f"{name}-{counter}"
            used.add(deduplicated)
            self._names[id(source)] = deduplicated

    def source_name(self, source: ScheduleSource) -> str:
        """
        Get the admin-facing name of a source.

        :param source: source to get the name of.
        :return: name of the source.
        """
        return self._names[id(source)]

    async def startup(self) -> None:
        """Report the broker's tasks and start the command polling loop."""
        self._resolve_names()
        await self.client.push_registered_tasks(
            self.scheduler.broker.get_all_tasks(),
        )
        self._poll_task = asyncio.get_event_loop().create_task(self._poll_loop())

    async def shutdown(self) -> None:
        """Stop the polling loop and close the client."""
        if self._poll_task is not None:
            self._poll_task.cancel()
            with contextlib.suppress(asyncio.CancelledError):
                await self._poll_task
        await self.client.close()

    async def on_schedules_updated(
        self,
        source: ScheduleSource,
        schedules: list[ScheduledTask],
    ) -> None:
        """
        Push a snapshot of the refreshed source to the admin.

        :param source: source the schedules were fetched from.
        :param schedules: all schedules the source returned.
        """
        await self.client.push_snapshot(
            self.source_name(source),
            is_editable_source(source),
            schedules,
        )

    async def _poll_loop(self) -> None:
        """Poll the admin for commands until cancelled."""
        while True:
            try:
                await self._poll_once()
            except Exception:
                logger.exception("Cannot poll taskiq-admin for commands.")
            await asyncio.sleep(self.poll_interval)

    async def _poll_once(self) -> None:
        """Poll, apply and acknowledge commands for every source."""
        for source in self.scheduler.sources:
            name = self.source_name(source)
            commands = await self.client.poll_commands(name)
            if not commands:
                continue
            results = []
            for command in commands:
                status, error = await apply_command(
                    command,
                    source,
                    self.scheduler.broker,
                )
                results.append(
                    {"id": command["id"], "status": status, "error": error},
                )
            await self.client.ack(results)
            # An immediate snapshot, so the UI reflects
            # the applied commands right away.
            try:
                schedules = await source.get_schedules()
            except Exception:
                logger.exception("Cannot get schedules from source %s.", name)
                continue
            await self.client.push_snapshot(
                name,
                is_editable_source(source),
                schedules,
            )
