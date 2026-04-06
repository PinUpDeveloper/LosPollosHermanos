import { useI18n } from "@/lib/i18n";

const statuses = ["ACTIVE", "FUNDED", "HARVEST_SOLD", "DISTRIBUTED"];

export function StatusTimeline({ current }: { current: string }) {
  const { translateStatus } = useI18n();
  const currentIndex = Math.max(statuses.indexOf(current), 0);

  return (
    <div className="flex flex-wrap gap-2">
      {statuses.map((status, index) => (
        <div
          key={status}
          className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold tracking-[0.14em] ${
            index <= currentIndex
              ? "border-leaf/20 bg-leaf text-[#f6f1e8]"
              : "border-bark/10 bg-white/66 text-soil/48"
          }`}
        >
          {translateStatus(status)}
        </div>
      ))}
    </div>
  );
}
