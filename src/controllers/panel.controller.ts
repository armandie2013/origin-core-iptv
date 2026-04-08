import { Request, Response } from "express";

export function panelController(_req: Request, res: Response) {
  res.setHeader("Content-Type", "text/html; charset=utf-8");

  res.send(`<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8" />
<title>Origin Panel</title>

<style>
  body {
    margin: 0;
    font-family: system-ui, sans-serif;
    background: #f5f5f5;
    color: #222;
  }

  .container {
    max-width: 1200px;
    margin: auto;
    padding: 20px;
  }

  .card {
    background: #ffffff;
    border: 1px solid #e5e5e5;
    border-radius: 10px;
    padding: 16px;
    margin-bottom: 16px;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .title {
    font-size: 22px;
    font-weight: bold;
  }

  .subtitle {
    font-size: 13px;
    color: #666;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 12px;
  }

  .stat {
    font-size: 26px;
    font-weight: bold;
  }

  .small {
    font-size: 12px;
    color: #777;
  }

  button {
    padding: 8px 12px;
    border-radius: 6px;
    border: 1px solid #ccc;
    background: #f0f0f0;
    color: #333;
    cursor: pointer;
  }

  button:hover {
    background: #e0e0e0;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 10px;
  }

  th {
    text-align: left;
    font-size: 12px;
    color: #666;
    border-bottom: 1px solid #ddd;
    padding: 8px;
  }

  td {
    padding: 8px;
    border-bottom: 1px solid #eee;
    font-size: 13px;
  }

  .mono {
    font-family: monospace;
    font-size: 11px;
    color: #444;
  }

  .status {
    font-size: 12px;
    color: #333;
  }

</style>
</head>

<body>

<div class="container">

  <div class="card">
    <div class="header">
      <div>
        <div class="title">Origin Panel</div>
        <div class="subtitle">Estado del servidor</div>
      </div>

      <button onclick="loadData()">Actualizar</button>
    </div>
  </div>

  <div class="grid">
    <div class="card">
      <div class="subtitle">Nodo</div>
      <div id="nodeName"></div>
      <div id="nodeMeta" class="small"></div>
    </div>

    <div class="card">
      <div class="subtitle">Estado</div>
      <div id="healthStatus"></div>
      <div id="healthTime" class="small"></div>
    </div>

    <div class="card">
      <div class="subtitle">Canales activos</div>
      <div id="activeCount" class="stat">0</div>
      <div id="lastRefresh" class="small"></div>
    </div>
  </div>

  <div class="card">
    <div class="title">Canales</div>

    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Estado</th>
          <th>PID</th>
          <th>Idle</th>
          <th>Proceso</th>
          <th>Acción</th>
        </tr>
      </thead>
      <tbody id="table"></tbody>
    </table>
  </div>

</div>

<script>
async function loadData() {
  const health = await fetch("/health").then(r => r.json());
  const data = await fetch("/channels/active").then(r => r.json());

  document.getElementById("nodeName").innerText = health.nodeName;
  document.getElementById("nodeMeta").innerText = health.nodeKey;

  document.getElementById("healthStatus").innerText = health.ok ? "ONLINE" : "ERROR";
  document.getElementById("healthTime").innerText = new Date().toLocaleString();

  document.getElementById("activeCount").innerText = data.count;
  document.getElementById("lastRefresh").innerText = new Date().toLocaleTimeString();

  const table = document.getElementById("table");

  table.innerHTML = data.channels.map(c => \`
    <tr>
      <td class="mono">\${c.channelId}</td>
      <td class="status">\${c.status}</td>
      <td>\${c.pid ?? "-"}</td>
      <td>\${c.idleSeconds}s</td>
      <td>\${c.processAlive ? "OK" : "DOWN"}</td>
      <td>
        <button onclick="stopChannel('\${c.channelId}')">Stop</button>
      </td>
    </tr>
  \`).join("");
}

async function stopChannel(id) {
  if (!confirm("Detener canal?")) return;

  await fetch("/channels/" + id + "/stop", { method: "POST" });
  loadData();
}

setInterval(loadData, 5000);
loadData();
</script>

</body>
</html>`);
}