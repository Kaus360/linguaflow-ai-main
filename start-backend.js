/**
 * start-backend.js
 * Cross-platform launcher for the FastAPI backend.
 * - Kills any existing process on port 8000 before starting.
 * - Used by root `npm run dev` via `concurrently`.
 */
const { spawn, execSync } = require("child_process");
const path = require("path");
const net = require("net");

const PORT = 8000;
const python = path.join(__dirname, "venv", "Scripts", "python.exe");
const uvicornArgs = ["-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", String(PORT), "--reload"];
const cwd = path.join(__dirname, "backend");

function isPortInUse(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", () => resolve(true));
    server.once("listening", () => {
      server.close();
      resolve(false);
    });
    server.listen(port);
  });
}

function killPort(port) {
  try {
    // Find PID using the port and kill it (Windows)
    const result = execSync(`netstat -ano | findstr :${port}`, { encoding: "utf8" });
    const lines = result.trim().split("\n");
    const pids = new Set();
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      const pid = parts[parts.length - 1];
      if (pid && !isNaN(pid) && pid !== "0") pids.add(pid);
    }
    for (const pid of pids) {
      try {
        execSync(`taskkill /PID ${pid} /F`, { stdio: "ignore" });
        console.log(`[BACKEND] Killed existing process on port ${port} (PID ${pid})`);
      } catch (_) {}
    }
  } catch (_) {
    // Port not in use - no action needed
  }
}

async function start() {
  const inUse = await isPortInUse(PORT);
  if (inUse) {
    console.log(`[BACKEND] Port ${PORT} is in use. Clearing it...`);
    killPort(PORT);
    // Wait briefly for OS to release the port
    await new Promise((r) => setTimeout(r, 1500));
  }

  console.log(`[BACKEND] Starting FastAPI on http://localhost:${PORT} ...`);

  const proc = spawn(python, uvicornArgs, { cwd, stdio: "inherit", shell: false });

  proc.on("error", (err) => {
    console.error("[BACKEND] Failed to start:", err.message);
    process.exit(1);
  });

  proc.on("exit", (code) => {
    if (code !== 0 && code !== null) {
      console.error(`[BACKEND] Exited with code ${code}`);
      process.exit(code);
    }
  });
}

start();
