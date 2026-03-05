// ═══════════════════════════════════════════════
// src/components/LineChart.js — SVG progress line chart
// ═══════════════════════════════════════════════

function LineChart({ data, color = "#e8ff47" }) {
  if (!data || data.length < 2) {
    return React.createElement(
      "div",
      { style: { textAlign: "center", color: "var(--muted)", padding: "20px", fontSize: 13 } },
      "Not enough data yet — complete more workouts to see your progress"
    );
  }

  const vals  = data.map(d => d.max_weight);
  const min   = Math.min(...vals);
  const max   = Math.max(...vals);
  const range = max - min || 1;
  const W = 300, H = 100;

  const points = vals.map((v, i) => {
    const x = (i / (vals.length - 1)) * (W - 20) + 10;
    const y = H - 10 - ((v - min) / range) * (H - 20);
    return { x, y };
  });

  const polylinePoints = points.map(p => `${p.x},${p.y}`).join(" ");

  return React.createElement(
    "svg",
    { className: "chart-svg", viewBox: `0 0 ${W} ${H}`, preserveAspectRatio: "none" },

    // Gradient def
    React.createElement("defs", null,
      React.createElement("linearGradient", { id: "chartGrad", x1: "0", y1: "0", x2: "0", y2: "1" },
        React.createElement("stop", { offset: "0%",   stopColor: color, stopOpacity: "0.25" }),
        React.createElement("stop", { offset: "100%", stopColor: color, stopOpacity: "0" })
      )
    ),

    // Area fill
    React.createElement("polygon", {
      points: `${points[0].x},${H} ${polylinePoints} ${points[points.length-1].x},${H}`,
      fill: "url(#chartGrad)",
    }),

    // Line
    React.createElement("polyline", {
      points: polylinePoints,
      fill: "none",
      stroke: color,
      strokeWidth: "2.5",
      strokeLinecap: "round",
      strokeLinejoin: "round",
    }),

    // Dots
    ...points.map((p, i) =>
      React.createElement("circle", { key: i, cx: p.x, cy: p.y, r: 4, fill: color })
    )
  );
}