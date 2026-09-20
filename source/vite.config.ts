import { existsSync, readFileSync } from "node:fs";
import vinext from "vinext";
import { defineConfig, type Plugin } from "vite";
import { readExecutionProfile } from "./scripts/execution-profile.mjs";

type HostingConfig = { d1?: string | null; r2?: string | null };
const hostingPath = new URL("./.openai/hosting.json", import.meta.url);
const pluginPath = new URL("./build/sites-vite-plugin.ts", import.meta.url);
const hostingConfig: HostingConfig = existsSync(hostingPath)
  ? JSON.parse(readFileSync(hostingPath, "utf8")) as HostingConfig
  : { d1: null, r2: null };

const PLACEHOLDER_DATABASE_ID = "00000000-0000-4000-8000-000000000000";
const managedLinux = readExecutionProfile() === "managed-linux";
const isSeatbelt = process.env.CODEX_SANDBOX === "seatbelt";

export default defineConfig(async () => {
  process.env.CLOUDFLARE_CF_FETCH_ENABLED ??= "false";
  process.env.WRANGLER_SEND_METRICS ??= "false";
  process.env.WRANGLER_WRITE_LOGS ??= "false";
  process.env.WRANGLER_LOG_PATH ??= ".wrangler/logs";
  process.env.WRANGLER_REGISTRY_PATH ??= ".wrangler/dev-registry";
  process.env.MINIFLARE_REGISTRY_PATH ??= ".wrangler/registry";
  const { cloudflare } = await import("@cloudflare/vite-plugin");
  const plugins: Plugin[] = [vinext()];
  if (existsSync(pluginPath)) {
    const sitesPlugin = await import(pluginPath.href) as { sites: (options: { mockAuth: boolean }) => Plugin };
    plugins.push(sitesPlugin.sites({ mockAuth: !managedLinux }));
  }
  plugins.push(cloudflare({ viteEnvironment:{name:"rsc",childEnvironments:["ssr"]}, inspectorPort:false, config:{ main:"vinext/server/fetch-handler", compatibility_flags:["nodejs_compat"], d1_databases:hostingConfig.d1?[{binding:hostingConfig.d1,database_name:"site-creator-d1",database_id:PLACEHOLDER_DATABASE_ID}]:[], r2_buckets:hostingConfig.r2?[{binding:hostingConfig.r2,bucket_name:"site-creator-r2"}]:[] } }));
  return {
    optimizeDeps: { exclude: ["next", "next/link", "next/navigation", "lucide-react"] },
    server:{...(managedLinux?{host:"0.0.0.0",allowedHosts:["terminal.local"]}:{}),...(isSeatbelt?{watch:{useFsEvents:false,usePolling:true}}:{})},
    plugins,
  };
});
