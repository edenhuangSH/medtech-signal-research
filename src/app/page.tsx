import { fetchSignals } from "@/lib/data";
import { AppShell } from "@/components/AppShell";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { signals, source } = await fetchSignals();
  return <AppShell signals={signals} source={source} />;
}
