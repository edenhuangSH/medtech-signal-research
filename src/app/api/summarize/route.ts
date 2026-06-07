import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

// AI summarization endpoint. Two modes:
//   • single signal  → a one-line sharp digest
//   • mode: "digest" → an executive summary across many signals
// Degrades gracefully (returns the existing summary) when no API key is set.

export const runtime = "nodejs";
export const maxDuration = 60;

const MODEL = "claude-haiku-4-5-20251001";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const lang: "en" | "zh" = body.lang === "en" ? "en" : "zh";
  const key = process.env.ANTHROPIC_API_KEY;

  // No key → graceful fallback.
  if (!key) {
    if (body.mode === "digest") {
      return NextResponse.json({ digest: fallbackDigest(body.signals, lang), fallback: true });
    }
    const s = body.signal;
    return NextResponse.json({
      digest: lang === "zh" ? s?.summary_zh : s?.summary_en,
      fallback: true,
    });
  }

  const client = new Anthropic({ apiKey: key });

  try {
    if (body.mode === "digest") {
      const list = (body.signals as any[])
        .map(
          (s, i) =>
            `${i + 1}. [${s.type}] ${s.title}${s.org ? ` — ${s.org}` : ""}${
              s.amount ? ` (${s.amount})` : ""
            }: ${s.summary}`
        )
        .join("\n");
      const prompt =
        lang === "zh"
          ? `你是一位生命科学/医疗科技投资分析师。下面是一组按优先级排序的市场信号。请用中文写一段150字以内的"执行摘要",提炼出最重要的3-4个趋势或主题(资金流向、热门赛道、值得关注的机构动作),语气专业、信息密度高,直接给出洞察,不要逐条复述。\n\n信号:\n${list}`
          : `You are a life-science/medtech investment analyst. Below are priority-ranked market signals. Write a tight executive summary (under 120 words) surfacing the 3-4 most important trends or themes (capital flows, hot tracks, notable institutional moves). Professional, high signal density, lead with insight — do not just restate each item.\n\nSignals:\n${list}`;

      const msg = await client.messages.create({
        model: MODEL,
        max_tokens: 400,
        messages: [{ role: "user", content: prompt }],
      });
      const text = msg.content.find((c) => c.type === "text");
      return NextResponse.json({ digest: text ? (text as any).text : "" });
    }

    // single signal
    const s = body.signal;
    const title = lang === "zh" ? s.title_zh : s.title_en;
    const summary = lang === "zh" ? s.summary_zh : s.summary_en;
    const prompt =
      lang === "zh"
        ? `用一句话(40字以内)精炼下面这条${s.type}信号最关键的"所以呢"——它意味着什么、为什么重要。只输出这一句,不要前缀。\n标题:${title}\n摘要:${summary}`
        : `In one sharp sentence (under 30 words), distill the "so what" of this ${s.type} signal — what it means and why it matters. Output only the sentence, no prefix.\nTitle: ${title}\nSummary: ${summary}`;

    const msg = await client.messages.create({
      model: MODEL,
      max_tokens: 150,
      messages: [{ role: "user", content: prompt }],
    });
    const text = msg.content.find((c) => c.type === "text");
    return NextResponse.json({ digest: text ? (text as any).text : summary });
  } catch (e) {
    const s = body.signal;
    return NextResponse.json({
      digest: body.mode === "digest" ? fallbackDigest(body.signals, lang) : lang === "zh" ? s?.summary_zh : s?.summary_en,
      fallback: true,
      error: String(e),
    });
  }
}

function fallbackDigest(signals: any[], lang: "en" | "zh"): string {
  const n = signals?.length ?? 0;
  if (lang === "zh")
    return `本期共 ${n} 条优先信号。配置 ANTHROPIC_API_KEY 后可生成 AI 执行摘要,自动提炼资金流向与热门赛道。以下为按优先级排序的明细。`;
  return `${n} priority signals this digest. Set ANTHROPIC_API_KEY to enable AI executive summaries that distill capital flows and hot tracks. Ranked detail follows below.`;
}
