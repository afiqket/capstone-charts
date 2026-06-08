function _1(md){return(
md`# health data bar 1`
)}

async function _2(FileAttachment,d3,html)
{
  const raw = await FileAttachment("health data.csv").csv();

  // 1) Parse and clean raw data
  const data = raw.map(d => ({
    year: new Date(d["Breach Submission Date"]).getFullYear(),
    breach: d["TypeofBreach"]
  })).filter(d => !isNaN(d.year) && d.breach);

  // 2) Count records by year + breach type
  const grouped = Array.from(
    d3.rollup(
      data,
      v => v.length,
      d => d.year,
      d => d.breach
    ),
    ([year, breaches]) =>
      Array.from(breaches, ([breach, count]) => ({ year, breach, count }))
  ).flat();

  // 3) Build full year list and breach list
  const years = Array.from(new Set(grouped.map(d => d.year))).sort(d3.ascending);
  const breachTypes = Array.from(new Set(grouped.map(d => d.breach)));

  // 4) Complete missing combinations with 0
  const completeData = breachTypes.flatMap(breach =>
    years.map(year => {
      const found = grouped.find(d => d.year === year && d.breach === breach);
      return { year, breach, count: found ? found.count : 0 };
    })
  );

  // 5) Sort breach types by total count
  const topBreaches = Array.from(
    d3.rollup(
      completeData,
      v => d3.sum(v, d => d.count),
      d => d.breach
    ),
    ([breach, total]) => ({ breach, total })
  )
    .sort((a, b) => d3.descending(a.total, b.total))
    .map(d => d.breach);

  const width = 1100;
  const height = 550;
  const margin = { top: 50, right: 220, bottom: 60, left: 80 };

  // Container for svg + tooltip
  const container = html`<div style="position:relative; font:12px sans-serif;"></div>`;

  const svg = d3.create("svg")
    .attr("viewBox", [0, 0, width, height])
    .style("max-width", "100%")
    .style("height", "auto")
    .style("display", "block");

  container.appendChild(svg.node());

  // Tooltip
  const tooltip = html`<div style="
    position:absolute;
    pointer-events:none;
    background:white;
    border:1px solid #ccc;
    border-radius:6px;
    padding:10px 12px;
    font:12px sans-serif;
    box-shadow:0 2px 10px rgba(0,0,0,0.15);
    opacity:0;
    max-width:280px;
  "></div>`;
  container.appendChild(tooltip);

  // Scales
  const x = d3.scaleLinear()
    .domain(d3.extent(years))
    .range([margin.left, width - margin.right]);

  const y = d3.scaleLinear()
    .domain([0, d3.max(completeData, d => d.count)]).nice()
    .range([height - margin.bottom, margin.top]);

  const color = d3.scaleOrdinal()
    .domain(topBreaches)
    .range(d3.schemeTableau10.concat(d3.schemeSet3));

  // Group data by breach
  const byBreach = d3.groups(completeData, d => d.breach)
    .map(([breach, values]) => ({
      breach,
      values: values.sort((a, b) => d3.ascending(a.year, b.year))
    }));

  // Line generator
  const line = d3.line()
    .x(d => x(d.year))
    .y(d => y(d.count));

  // Gridlines
  svg.append("g")
    .attr("stroke", "#e6e6e6")
    .selectAll("line")
    .data(y.ticks())
    .join("line")
    .attr("x1", margin.left)
    .attr("x2", width - margin.right)
    .attr("y1", d => y(d))
    .attr("y2", d => y(d));

  // X axis
  svg.append("g")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(
      d3.axisBottom(x)
        .tickFormat(d3.format("d"))
    );

  // Y axis
  svg.append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y));

  // Title
  svg.append("text")
    .attr("x", margin.left)
    .attr("y", 24)
    .attr("font-size", 16)
    .attr("font-weight", "bold")
    .text("Incidents by Breach Type Over Time");

  // X label
  svg.append("text")
    .attr("x", width / 2)
    .attr("y", height - 15)
    .attr("text-anchor", "middle")
    .text("Year");

  // Y label
  svg.append("text")
    .attr("x", -(height / 2))
    .attr("y", 20)
    .attr("transform", "rotate(-90)")
    .attr("text-anchor", "middle")
    .text("Count of TypeofBreach");

  // Draw lines
  const linesGroup = svg.append("g");

  linesGroup.selectAll("path")
    .data(byBreach)
    .join("path")
    .attr("fill", "none")
    .attr("stroke", d => color(d.breach))
    .attr("stroke-width", 2.5)
    .attr("opacity", 0.9)
    .attr("d", d => line(d.values));

  // End labels
  const latestYear = d3.max(years);
  const labelData = byBreach.map(series => {
    const latest = series.values.find(d => d.year === latestYear) || series.values[series.values.length - 1];
    return { breach: series.breach, ...latest };
  });

  svg.append("g")
    .selectAll("text.end-label")
    .data(labelData)
    .join("text")
    .attr("class", "end-label")
    .attr("x", d => x(d.year) + 8)
    .attr("y", d => y(d.count))
    .attr("dy", "0.35em")
    .attr("fill", d => color(d.breach))
    .style("font-size", "11px")
    .text(d => d.breach);

  // Hover line
  const hoverLine = svg.append("line")
    .attr("stroke", "#999")
    .attr("stroke-dasharray", "4,4")
    .attr("y1", margin.top)
    .attr("y2", height - margin.bottom)
    .style("opacity", 0);

  // Dots group
  const dotsGroup = svg.append("g");

  // Overlay for detecting mouse movement
  const overlay = svg.append("rect")
    .attr("x", margin.left)
    .attr("y", margin.top)
    .attr("width", width - margin.left - margin.right)
    .attr("height", height - margin.top - margin.bottom)
    .attr("fill", "transparent")
    .style("cursor", "crosshair");

  function moved(event) {
    const [mx] = d3.pointer(event, svg.node());

    const hoveredYear = Math.round(x.invert(mx));
    const clampedYear = Math.max(d3.min(years), Math.min(d3.max(years), hoveredYear));

    const points = completeData
      .filter(d => d.year === clampedYear)
      .sort((a, b) => d3.descending(a.count, b.count));

    if (!points.length) return;

    // Show vertical guide line
    hoverLine
      .attr("x1", x(clampedYear))
      .attr("x2", x(clampedYear))
      .style("opacity", 1);

    // Show dots for that year
    dotsGroup.selectAll("circle")
      .data(points, d => d.breach)
      .join("circle")
      .attr("cx", d => x(d.year))
      .attr("cy", d => y(d.count))
      .attr("r", 4)
      .attr("fill", d => color(d.breach))
      .attr("stroke", "white")
      .attr("stroke-width", 1.5);

    // Highlight all lines a bit faded, keep overall readable
    linesGroup.selectAll("path")
      .attr("opacity", 0.25)
      .attr("stroke-width", 2);

    // Highlight lines that have non-zero values that year
    linesGroup.selectAll("path")
      .filter(d => {
        const found = d.values.find(v => v.year === clampedYear);
        return found && found.count > 0;
      })
      .attr("opacity", 1)
      .attr("stroke-width", 3);

    // Tooltip content
    tooltip.style.opacity = 1;
    tooltip.style.left = `${x(clampedYear) + 15}px`;
    tooltip.style.top = `${margin.top + 10}px`;
    tooltip.innerHTML = `
      <div style="font-weight:700; margin-bottom:6px;">Year: ${clampedYear}</div>
      ${points.map(d => `
        <div style="display:flex; justify-content:space-between; gap:16px; margin:2px 0;">
          <span style="color:${color(d.breach)}">${d.breach}</span>
          <span><b>${d.count}</b></span>
        </div>
      `).join("")}
    `;
  }

  function left() {
    tooltip.style.opacity = 0;
    hoverLine.style("opacity", 0);

    dotsGroup.selectAll("circle").remove();

    linesGroup.selectAll("path")
      .attr("opacity", 0.9)
      .attr("stroke-width", 2.5);
  }

  overlay
    .on("mousemove", moved)
    .on("mouseleave", left);

  return container;
}


export default function define(runtime, observer) {
  const main = runtime.module();
  function toString() { return this.url; }
  const fileAttachments = new Map([
    ["health data.csv", {url: new URL("./files/4d979e6b89f18f96833d58be7b56ff2d699c4ac47ac91776f85ea280021843a91aadc6d0385200dd1e2bfc597773f2c0a8903f219d78de5b8693675cffccefec.csv", import.meta.url), mimeType: "text/csv", toString}]
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], _1);
  main.variable(observer()).define(["FileAttachment","d3","html"], _2);
  return main;
}
