import { CopilotChat } from "@/components/copilot/CopilotChat";

export const dynamic = "force-dynamic";

export default async function CopilotPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const sp = await searchParams;
  return (
    <div>
      <div className="mb-4 flex items-center gap-2.5">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="1.6">
          <circle cx="12" cy="12" r="2.5" /><path d="M12 2a10 10 0 0 1 10 10" /><path d="M12 6a6 6 0 0 1 6 6" />
        </svg>
        <h1 className="text-xl font-bold">Frontier Copilot</h1>
        <span className="rounded-full border border-[var(--border)] px-2 py-0.5 text-[10px] text-[var(--muted)]">Beta</span>
      </div>
      <CopilotChat initialQuery={sp.q} />
    </div>
  );
}
