function _1(md){return(
md`# cannabis exposure
`
)}

async function _cannabisChart(FileAttachment,d3,html)
{
  // Load CSV file from Observable file attachment
  // Pastikan nama file sama exactly: "cannabis exposure.csv"
  const raw = await FileAttachment("cannabis exposure.csv").csv();

  // Parse data
  const data = raw.map(d => ({
    date: d3.timeParse("%B %Y")(d["Month of Date"]),
    cbd: +String(d["Cannabidiol (CBD) Cases"]).replace(/,/g, ""),
    synthetic: +String(d["Synthetic Cannabinoid Cases"]).replace(/,/g, "") // replace comma with space
  })).sort((a, b) => d3.ascending(a.date, b.date));

  const width = 900;
  const height = 500;
  const margin = { top: 40, right: 140, bottom: 60, left: 70 };

  let showCBD = true;
  let showSynthetic = true;

  const container = html`<div style="font-family:sans-serif;"></div>`;

  const controls = html`
    <div style="margin-bottom:12px; display:flex; gap:16px; align-items:center; flex-wrap:wrap;">
      <label style="display:flex; align-items:center; gap:6px;">
        <input type="checkbox" checked>
        <span style="color:#1f77b4; font-weight:600;">CBD Cases</span>
      </label>
      <label style="display:flex; align-items:center; gap:6px;">
        <input type="checkbox" checked>
        <span style="color:#d62728; font-weight:600;">Synthetic Cannabinoid Cases</span>
      </label>
    </div>
  `;

  const cbdCheckbox = controls.querySelectorAll("input")[0];
  const syntheticCheckbox = controls.querySelectorAll("input")[1];

  container.appendChild(controls);

  const svg = d3.create("svg")
    // viewbox = canvas
    .attr("viewBox", [0, 0, width, height])
    .style("max-width", "100%")
    .style("height", "auto");

  container.appendChild(svg.node());

  const chart = svg.append("g");

  const x = d3.scaleTime()
    .domain(d3.extent(data, d => d.date))
    .range([margin.left, width - margin.right]);

  const y = d3.scaleLinear()
    .range([height - margin.bottom, margin.top]);

  const xAxisG = chart.append("g")
    .attr("transform", `translate(0,${height - margin.bottom})`);

  const yAxisG = chart.append("g")
    .attr("transform", `translate(${margin.left},0)`);

  const title = chart.append("text")
    .attr("x", width / 2)
    .attr("y", 22)
    .attr("text-anchor", "middle")
    .attr("font-size", 18)
    .attr("font-weight", "bold")
    .text("Cannabis Exposure Cases Over Time");

  const xLabel = chart.append("text")
    .attr("x", width / 2)
    .attr("y", height - 15)
    .attr("text-anchor", "middle")
    .attr("font-size", 12)
    .text("Month");

  const yLabel = chart.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", 18)
    .attr("text-anchor", "middle")
    .attr("font-size", 12)
    .text("Number of Cases");

  const lineCBD = d3.line()
    .x(d => x(d.date))
    .y(d => y(d.cbd));

  const lineSynthetic = d3.line()
    .x(d => x(d.date))
    .y(d => y(d.synthetic));

  const cbdPath = chart.append("path")
    .attr("fill", "none")
    .attr("stroke", "#1f77b4")
    .attr("stroke-width", 2.5);

  const syntheticPath = chart.append("path")
    .attr("fill", "none")
    .attr("stroke", "#d62728")
    .attr("stroke-width", 2.5);

  const hoverLine = chart.append("line")
    .attr("stroke", "#999")
    .attr("stroke-dasharray", "4,4")
    .attr("y1", margin.top)
    .attr("y2", height - margin.bottom)
    .style("opacity", 0);

  const cbdDot = chart.append("circle")
    .attr("r", 4)
    .attr("fill", "#1f77b4")
    .style("opacity", 0);

  const syntheticDot = chart.append("circle")
    .attr("r", 4)
    .attr("fill", "#d62728")
    .style("opacity", 0);

  const tooltip = html`
    <div style="
      position:absolute;
      pointer-events:none;
      background:white;
      border:1px solid #ccc;
      border-radius:6px;
      padding:8px 10px;
      font:12px sans-serif;
      box-shadow:0 2px 8px rgba(0,0,0,0.15);
      opacity:0;
    "></div>
  `;
  container.style.position = "relative";
  container.appendChild(tooltip);

  // interactive 
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;

  const overlay = chart.append("rect")
    .attr("x", margin.left)
    .attr("y", margin.top)
    .attr("width", plotWidth)
    .attr("height", plotHeight)
    .attr("fill", "none")
    .attr("pointer-events", "all");

  function updateChart() {
    const visibleMax = d3.max(data, d => Math.max(
      showCBD ? d.cbd : 0,
      showSynthetic ? d.synthetic : 0
    ));

    y.domain([0, visibleMax]).nice();

    xAxisG.call(
      d3.axisBottom(x)
        .ticks(width / 100)
        .tickFormat(d3.timeFormat("%b %Y"))
    )
    .selectAll("text")
    .attr("transform", "rotate(-35)")
    .style("text-anchor", "end");

    yAxisG.call(d3.axisLeft(y));

    cbdPath
      .datum(showCBD ? data : [])
      .attr("d", lineCBD)
      .style("opacity", showCBD ? 1 : 0);

    syntheticPath
      .datum(showSynthetic ? data : [])
      .attr("d", lineSynthetic)
      .style("opacity", showSynthetic ? 1 : 0);
  }

  function pointermoved(event) {
    const [mx] = d3.pointer(event);
    const bisect = d3.bisector(d => d.date).center;
    const i = bisect(data, x.invert(mx));
    const d = data[i];
    if (!d) return;

    const px = x(d.date);

    hoverLine
      .attr("x1", px)
      .attr("x2", px)
      .style("opacity", 1);

    cbdDot
      .attr("cx", px)
      .attr("cy", y(d.cbd))
      .style("opacity", showCBD ? 1 : 0);

    syntheticDot
      .attr("cx", px)
      .attr("cy", y(d.synthetic))
      .style("opacity", showSynthetic ? 1 : 0);

    tooltip.style.opacity = 1;
    tooltip.style.left = `${px + 15}px`;
    tooltip.style.top = `${y(Math.max(d.cbd, d.synthetic)) + 20}px`;
    tooltip.innerHTML = `
      <div><strong>${d3.timeFormat("%B %Y")(d.date)}</strong></div>
      ${showCBD ? `<div style="color:#1f77b4;">CBD: ${d.cbd.toLocaleString()}</div>` : ""}
      ${showSynthetic ? `<div style="color:#d62728;">Synthetic: ${d.synthetic.toLocaleString()}</div>` : ""}
    `;
  }

  function pointerleft() {
    hoverLine.style("opacity", 0);
    cbdDot.style("opacity", 0);
    syntheticDot.style("opacity", 0);
    tooltip.style.opacity = 0;
  }

  overlay
    .on("mousemove", pointermoved)
    .on("mouseleave", pointerleft);

  cbdCheckbox.addEventListener("change", () => {
    showCBD = cbdCheckbox.checked;
    updateChart();
    pointerleft();
  });

  syntheticCheckbox.addEventListener("change", () => {
    showSynthetic = syntheticCheckbox.checked;
    updateChart();
    pointerleft();
  });

  updateChart();

  return container;
}


export default function define(runtime, observer) {
  const main = runtime.module();
  function toString() { return this.url; }
  const fileAttachments = new Map([
    ["cannabis exposure.csv", {url: new URL("./files/0b10478d2fdc6ebab0ea43f6bb79beadba6d3c4cb4fc8466f79eccd55646fcd048254c229b67c4f981e1c58a62dd2e75f0b88f24fe30d6eb6523aaa1b843ed34.csv", import.meta.url), mimeType: "text/csv", toString}]
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], _1);
  main.variable(observer("viewof cannabisChart")).define("viewof cannabisChart", ["FileAttachment","d3","html"], _cannabisChart);
  main.variable(observer("cannabisChart")).define("cannabisChart", ["Generators", "viewof cannabisChart"], (G, _) => G.input(_));
  return main;
}
