import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

const usage =
  "Usage: node scripts/extraction/validate.mjs GRAPH.json [--inventory NODE-INVENTORY.graph.json]";
const args = process.argv.slice(2);
if (args.length === 1 && ["--help", "-h"].includes(args[0])) {
  console.log(usage);
} else if (
  ![1, 3].includes(args.length) ||
  args[0].startsWith("--") ||
  (args.length === 3 && args[1] !== "--inventory")
) {
  console.error(usage);
  process.exitCode = 2;
} else {
  let server;
  try {
    const graphText = await readFile(args[0], "utf8");
    const inventoryText =
      args.length === 3 ? await readFile(args[2], "utf8") : undefined;
    // Use installed Vite to load the existing TypeScript validation boundary.
    // No app config/plugins, HTTP listener, file watcher, or remote service.
    server = await createServer({
      root: fileURLToPath(new URL("../../", import.meta.url)),
      configFile: false,
      envFile: false,
      logLevel: "silent",
      server: { middlewareMode: true, hmr: false, watch: null },
    });
    const { auditPaperMap } = await server.ssrLoadModule(
      "/scripts/extraction/audit.ts",
    );
    const report = auditPaperMap(graphText, inventoryText);
    console.log(
      JSON.stringify(
        { generated_at: new Date().toISOString(), ...report },
        null,
        2,
      ),
    );
    process.exitCode = report.status === "passed" ? 0 : 1;
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 2;
  } finally {
    await server?.close();
  }
}
