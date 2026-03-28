const statuses = ["ACTIVE", "FUNDED", "HARVEST_SOLD", "DISTRIBUTED"];

export function StatusTimeline({ current }: { current: string }) {
  const currentIndex = Math.max(statuses.indexOf(current), 0);

  return (
    <div className="flex flex-wrap gap-3">
      {statuses.map((status, index) => (
        <div
          key={status}
          className={`rounded-full px-4 py-2 text-sm ${
            index <= currentIndex ? "bg-leaf text-white" : "bg-bark/10 text-soil/60"
          }`}
        >
          {status}
        </div>
      ))}
    </div>
  );
}

