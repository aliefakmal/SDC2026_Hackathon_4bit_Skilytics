import { useQuery } from "@tanstack/react-query";
import { useT } from "@/i18n";
import { ErrorBox } from "./kit";
type Route = { agent: string; provider: string; model: string; tier: string; configured: boolean; runpodPlaceholder?: boolean };
const copy = {
  en: { title: "Models by agent", note: "Live server configuration. Configured means credentials are present, not that a generation has succeeded. Saved insights show the model that actually answered.", model: "Provider / model", ready: "Configured", missing: "Not configured", analyst: "Labour market analyst" },
  ms: { title: "Model mengikut agent", note: "Konfigurasi langsung pelayan. Dikonfigurasi bermaksud kelayakan akses tersedia, bukan penjanaan telah berjaya. Analisis yang disimpan menunjukkan model yang benar-benar menjawab.", model: "Penyedia / model", ready: "Dikonfigurasi", missing: "Belum dikonfigurasi", analyst: "Penganalisis pasaran buruh" },
  zh: { title: "各智能体使用的模型", note: "服务器实时配置。已配置仅表示凭据存在，不代表生成已成功。已保存的分析会显示实际回答的模型。", model: "提供商／模型", ready: "已配置", missing: "未配置", analyst: "劳动力市场分析师" },
};
export function AiRoutingPanel() {
  const { lang, tk } = useT();
  const c = copy[lang];
  const q = useQuery<Route[]>({ queryKey: ["/api/ai/routing"], queryFn: async ({ signal }) => {
    const response = await fetch((import.meta.env.VITE_API_URL || "").replace(/\/$/, "") + "/api/ai/routing", { signal });
    if (!response.ok) throw new Error("AI routing is unavailable");
    return response.json();
  }, staleTime: 60000, retry: false });
  return <div className="mb-3 rounded-xl border border-border p-3" data-testid="ai-agent-routing">
    <h4 className="font-semibold">{c.title}</h4>
    <p className="my-2 text-xs text-muted-foreground">{c.note}</p>
    {q.data?.some((r) => r.runpodPlaceholder) && <p className="mb-2 rounded bg-muted p-2 text-xs">
      {lang === "ms" ? "Fasa testing: semua agent menggunakan Gemini. RunPod Qwen ialah placeholder; penjanaan dan probe worker dimatikan. Holland/SDG (Qwen ringan) serta Fitter/Planner/Analyst (Qwen utama) disediakan untuk fasa hackathon."
        : lang === "zh" ? "测试阶段：所有智能体使用 Gemini。RunPod Qwen 仅为占位配置，生成及工作节点探测均已关闭。Holland／SDG 预留 Qwen 轻量模型，Fitter／Planner／Analyst 预留 Qwen 主模型供黑客松阶段使用。"
        : "Testing phase: all agents use Gemini. RunPod Qwen is a placeholder; generation and worker probes are disabled. Holland/SDG reserve Qwen light; Fitter/Planner/Analyst reserve Qwen main for the hackathon phase."}
    </p>}
    {q.isError ? <ErrorBox error={q.error} retry={() => q.refetch()} /> : <dl className="divide-y divide-border">
      {q.data?.map((r) => <div key={r.agent} className="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-2 py-2 text-xs">
        <dt className="font-semibold">{r.agent === "analyst" ? c.analyst : tk("agent", r.agent + ".name")}</dt>
        <dd className="min-w-0"><span className="block break-all">{r.provider} / {r.model}</span><span className="text-muted-foreground">{r.configured ? c.ready : c.missing}</span></dd>
      </div>)}
    </dl>}
  </div>;
}
