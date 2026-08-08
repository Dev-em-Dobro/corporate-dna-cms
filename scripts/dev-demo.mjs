// Run `next dev` against the LOCAL demo database.
//
// Loads .env.demo into the process env, then spawns Next. Next.js does NOT
// override variables already present in process.env, so the demo DATABASE_URL
// wins over the one in .env.local while every other key still comes through.
import { spawn } from "node:child_process";

process.loadEnvFile(".env.demo");

// shell:true so Windows can resolve the `next` binary (.cmd) from PATH/node_modules.
const child = spawn("npx", ["next", "dev", "-p", "3010"], {
  stdio: "inherit",
  env: process.env,
  shell: true,
});
child.on("exit", (code) => process.exit(code ?? 0));
