function _1(md){return(
md`# Profit Margin`
)}

async function _2(FileAttachment)
{
  const d3 = await import("https://cdn.jsdelivr.net/npm/d3@7/+esm");

  const raw = await FileAttachment("profit margin.csv").csv({ typed: true });

  const data = raw
    .filter(d => d["Region/Country"] && d["Revenue Share"] != null && d["Profit Margin"] != null)
    .map(d => ({
      name: String(d["Region/Country"]).trim(),
      revenue: +d["Revenue Share"],
      margin: +d["Profit Margin"],
      economy: String(d["Economy"]).trim()
    }))
    .sort((a, b) => d3.descending(a.margin, b.margin));

  const width = 879;
  const height = 648;

  const chartX = 106;
  const chartY = 153;
  const chartW = 660;
  const chartH = 407;

  const colors = {
    "U.S.": "#ef4b92",
    "Developed": "#2c8794",
    "Emerging": "#9aa7a8"
  };

  const root = d3.create("div")
    .style("position", "relative")
    .style("width", `${width}px`)
    .style("height", `${height}px`)
    .style("background", "white")
    .style("font-family", "Arial, Helvetica, sans-serif")
    .style("color", "#2d333b");

  root.append("div")
    .style("position", "absolute")
    .style("left", "22px")
    .style("top", "16px")
    .style("font-size", "30px")
    .style("font-weight", "700")
    .style("line-height", "1.25")
    .style("letter-spacing", "0.4px")
    .html(`The <span style="color:${colors["U.S."]}">U.S.</span> is our biggest market and has room to grow<br>margins`);

  const legend = root.append("div")
    .style("position", "absolute")
    .style("left", "22px")
    .style("top", "108px")
    .style("display", "flex")
    .style("gap", "10px")
    .style("align-items", "center")
    .style("font-size", "16px");

  for (const key of ["U.S.", "Developed", "Emerging"]) {
    const item = legend.append("div")
      .style("display", "flex")
      .style("align-items", "center")
      .style("gap", "4px");

    item.append("span")
      .style("width", "13px")
      .style("height", "16px")
      .style("border-radius", "3px")
      .style("background", colors[key]);

    item.append("span").text(key);
  }

  const svg = root.append("svg")
    .attr("width", width)
    .attr("height", height)
    .style("position", "absolute")
    .style("left", 0)
    .style("top", 0);

  const x = d3.scaleLinear()
    .domain([0, 29])
    .range([chartX, chartX + chartW]);

  const yNorm = d3.scaleLinear()
    .domain([0, 100])
    .range([chartY + chartH, chartY]);

  const xTicks = d3.range(0, 30, 2);
  const yTicks = [0, 20, 40, 60, 80, 100];

  svg.append("line")
    .attr("x1", chartX)
    .attr("x2", chartX)
    .attr("y1", chartY)
    .attr("y2", chartY + chartH)
    .attr("stroke", "#e6e6e6");

  svg.append("line")
    .attr("x1", chartX)
    .attr("x2", chartX + chartW)
    .attr("y1", chartY + chartH)
    .attr("y2", chartY + chartH)
    .attr("stroke", "#e6e6e6");

  svg.selectAll(".y-grid")
    .data(yTicks)
    .join("line")
    .attr("x1", chartX)
    .attr("x2", chartX + chartW)
    .attr("y1", d => yNorm(d))
    .attr("y2", d => yNorm(d))
    .attr("stroke", "#eeeeee");

  svg.selectAll(".y-tick")
    .data(yTicks)
    .join("text")
    .attr("x", chartX - 12)
    .attr("y", d => yNorm(d) + 5)
    .attr("text-anchor", "end")
    .attr("font-size", 16)
    .attr("fill", "#444")
    .text(d => d);

  svg.selectAll(".x-tick")
    .data(xTicks)
    .join("text")
    .attr("x", d => x(d))
    .attr("y", chartY + chartH + 23)
    .attr("text-anchor", "middle")
    .attr("font-size", 16)
    .attr("fill", "#444")
    .text(d => `${d}%`);

  svg.append("text")
    .attr("x", chartX + chartW / 2)
    .attr("y", chartY + chartH + 62)
    .attr("text-anchor", "middle")
    .attr("font-size", 17)
    .attr("font-weight", 700)
    .attr("fill", "#333")
    .text("Profit Margin");

  svg.append("text")
    .attr("transform", `translate(50, ${chartY + chartH / 2}) rotate(-90)`)
    .attr("text-anchor", "middle")
    .attr("font-size", 17)
    .attr("font-weight", 700)
    .attr("fill", "#333")
    .text("Revenue Share (%)");

  const totalRevenue = d3.sum(data, d => d.revenue);
  let cumulative = 0;

  const bars = data.map(d => {
    const h = d.revenue / totalRevenue * chartH;
    const y = chartY + cumulative / totalRevenue * chartH;
    cumulative += d.revenue;
    return { ...d, y, h };
  });

  const tooltipW = 208;
  const tooltipH = 142;

  const tooltip = svg.append("g")
    .style("display", "none")
    .style("pointer-events", "none");

  tooltip.append("polygon")
    .attr("class", "tooltip-arrow")
    .attr("fill", "#ffffff");

  tooltip.append("rect")
    .attr("class", "tooltip-box")
    .attr("width", tooltipW)
    .attr("height", tooltipH)
    .attr("rx", 2)
    .attr("fill", "#ffffff");

  tooltip.append("rect")
    .attr("class", "tooltip-header")
    .attr("width", tooltipW)
    .attr("height", 40)
    .attr("rx", 2)
    .attr("fill", "#2f2f31");

  tooltip.append("text")
    .attr("class", "tooltip-title")
    .attr("x", 10)
    .attr("y", 25)
    .attr("font-size", 16)
    .attr("font-weight", 700)
    .attr("fill", "#ffffff");

  const tooltipRows = tooltip.selectAll(".tooltip-row")
    .data([0, 1, 2])
    .join("g")
    .attr("class", "tooltip-row")
    .attr("transform", (_, i) => `translate(10, ${66 + i * 31})`);

  tooltipRows.append("text")
    .attr("class", "tooltip-label")
    .attr("font-size", 16)
    .attr("fill", "#333");

  tooltipRows.append("text")
    .attr("class", "tooltip-value")
    .attr("x", tooltipW - 20)
    .attr("text-anchor", "end")
    .attr("font-size", 16)
    .attr("fill", "#333");

function showTooltip(event, d) {
  const barCenterY = d.y + d.h / 2;

  let tx = x(d.margin) - tooltipW / 2;
  tx = Math.max(chartX + 5, Math.min(tx, chartX + chartW - tooltipW - 5));

  let ty = barCenterY + 22;

  if (ty + tooltipH > chartY + chartH) {
    ty = barCenterY - tooltipH - 22;

    tooltip.select(".tooltip-arrow")
      .attr("points", `${tooltipW / 2 - 12},${tooltipH} ${tooltipW / 2 + 12},${tooltipH} ${tooltipW / 2},${tooltipH + 12}`);
  } else {
    tooltip.select(".tooltip-arrow")
      .attr("points", `${tooltipW / 2 - 12},0 ${tooltipW / 2 + 12},0 ${tooltipW / 2},-12`);
  }

  tooltip
    .style("display", null)
    .attr("transform", `translate(${tx}, ${ty})`)
    .raise();

  tooltip.select(".tooltip-title")
    .text(d.name);

  const rows = [
    ["Revenue Share", `${d.revenue}%`],
    ["Profit Margin", `${d.margin}%`],
    ["Economy", d.economy]
  ];

  tooltip.selectAll(".tooltip-row")
    .data(rows)
    .select(".tooltip-label")
    .text(row => row[0]);

  tooltip.selectAll(".tooltip-row")
    .data(rows)
    .select(".tooltip-value")
    .text(row => row[1]);
}

  function hideTooltip() {
    tooltip.style("display", "none");
  }

  svg.selectAll(".bar")
    .data(bars)
    .join("rect")
    .attr("x", chartX)
    .attr("y", d => d.y)
    .attr("width", d => x(d.margin) - chartX)
    .attr("height", d => d.h)
    .attr("fill", d => colors[d.economy])
    .attr("stroke", d => d.name === "China" ? "#111" : "#ffffff")
    .attr("stroke-width", d => d.name === "China" ? 1.6 : 1.2)
    .style("cursor", "default")
    .on("mouseenter", showTooltip)
    .on("mousemove", showTooltip)
    .on("mouseleave", hideTooltip);

  svg.selectAll(".bar-label")
    .data(bars)
    .join("text")
    .attr("x", d => x(d.margin) + 8)
    .attr("y", d => d.y + d.h / 2 + 5)
    .attr("font-size", 16)
    .attr("font-weight", 700)
    .attr("fill", "#000")
    .style("pointer-events", "none")
    .text(d => d.name);

  return root.node();
}


export default function define(runtime, observer) {
  const main = runtime.module();
  function toString() { return this.url; }
  const fileAttachments = new Map([
    ["profit margin.csv", {url: new URL("./files/2d1a082b217b2a974da55868a9026d6802a18396b864eeb11b45d2c8bf418f0538384f3e974a4d6680b9c69c4c9d9b56ebd6f0c5d3ea1262641c73b35fbedb9f.csv", import.meta.url), mimeType: "text/csv", toString}]
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], _1);
  main.variable(observer()).define(["FileAttachment"], _2);
  return main;
}
