function _1(md){return(
md`# Marketing spend by channel`
)}

async function _2(FileAttachment,width)
{
  const d3 = await import("https://cdn.jsdelivr.net/npm/d3@7/+esm");

  const raw = await FileAttachment("Data.1778509913640.csv").csv({ typed: true });

  const channels = ["Television", "Email", "Print media", "Social media"];

  const data = raw
    .filter(d => d.Year != null)
    .map(d => ({
      Year: +d.Year,
      "Print media": +d["Print media"] / 1000,
      Television: +d.Television / 1000,
      "Social media": +d["Social media"] / 1000,
      Email: +d.Email / 1000
    }))
    .sort((a, b) => d3.ascending(a.Year, b.Year));

  const fullWidth = 907;
  const fullHeight = 640;

  const fitWidth = Math.min(width, fullWidth);
  const scale = fitWidth / fullWidth;
  const fitHeight = fullHeight * scale;

  const wrapper = d3.create("div")
    .style("position", "relative")
    .style("width", `${fitWidth}px`)
    .style("height", `${fitHeight}px`)
    .style("overflow", "visible");

  const root = wrapper.append("div")
    .style("position", "absolute")
    .style("left", 0)
    .style("top", 0)
    .style("width", `${fullWidth}px`)
    .style("height", `${fullHeight}px`)
    .style("background", "#f7f7f7")
    .style("font-family", "Arial, Helvetica, sans-serif")
    .style("color", "#3b3b3b")
    .style("transform", `scale(${scale})`)
    .style("transform-origin", "top left");

  const margin = {
    top: 173,
    right: 144,
    bottom: 46,
    left: 69
  };

  const chartW = fullWidth - margin.left - margin.right;
  const chartH = fullHeight - margin.top - margin.bottom;

  const colors = {
    "Print media": "#fb8583",
    Television: "#063f46",
    "Social media": "#3499e8",
    Email: "#f2bd22",
    grid: "#e4e4e4",
    text: "#3d3d3d"
  };

  root.append("div")
    .style("position", "absolute")
    .style("left", "19px")
    .style("top", "5px")
    .style("font-size", "31px")
    .style("font-weight", "700")
    .style("line-height", "1.22")
    .style("letter-spacing", "1.3px")
    .html(`Since 2019 we have been spending more on <span style="color:${colors["Social media"]}">Social media</span><br>than <span style="color:${colors["Print media"]}">Print media</span>`);

  root.append("div")
    .style("position", "absolute")
    .style("left", "20px")
    .style("top", "86px")
    .style("font-size", "27px")
    .style("letter-spacing", "1px")
    .style("color", colors.text)
  

  const legend = root.append("div")
    .style("position", "absolute")
    .style("left", "19px")
    .style("top", "131px")
    .style("display", "flex")
    .style("align-items", "center")
    .style("gap", "8px")
    .style("font-size", "16px");

  for (const key of ["Print media", "Television", "Social media", "Email"]) {
    const item = legend.append("div")
      .style("display", "flex")
      .style("align-items", "center")
      .style("gap", "4px");

    item.append("span")
      .style("width", "12px")
      .style("height", "14px")
      .style("border-radius", "3px")
      .style("background", colors[key]);

    item.append("span")
      .style("color", "#444")
      .text(key);
  }

  const svg = root.append("svg")
    .attr("width", fullWidth)
    .attr("height", fullHeight)
    .style("position", "absolute")
    .style("left", 0)
    .style("top", 0);

  const x = d3.scaleLinear()
    .domain([2014, 2024])
    .range([margin.left, margin.left + chartW]);

  const y = d3.scaleLinear()
    .domain([0, 90])
    .range([margin.top + chartH, margin.top]);

  const yTicks = [0, 20, 40, 60, 80];
  const xTicks = d3.range(2014, 2025);

  svg.selectAll(".y-grid")
    .data(yTicks)
    .join("line")
    .attr("x1", margin.left)
    .attr("x2", margin.left + chartW)
    .attr("y1", d => y(d))
    .attr("y2", d => y(d))
    .attr("stroke", colors.grid)
    .attr("stroke-width", 1);

  svg.append("line")
    .attr("x1", margin.left)
    .attr("x2", margin.left)
    .attr("y1", margin.top)
    .attr("y2", margin.top + chartH)
    .attr("stroke", colors.grid)
    .attr("stroke-width", 1);

  svg.selectAll(".y-label")
    .data(yTicks)
    .join("text")
    .attr("x", margin.left - 13)
    .attr("y", d => y(d) + 5)
    .attr("text-anchor", "end")
    .attr("font-size", 16)
    .attr("fill", "#555")
    .text(d => `£${d}K`);

  svg.selectAll(".x-label")
    .data(xTicks)
    .join("text")
    .attr("x", d => x(d))
    .attr("y", margin.top + chartH + 23)
    .attr("text-anchor", "middle")
    .attr("font-size", 16)
    .attr("fill", "#555")
    .text(d => d);

  const stacked = d3.stack()
    .keys(channels)
    .order(d3.stackOrderNone)
    .offset(d3.stackOffsetNone)(data);

  const area = d3.area()
    .x(d => x(d.data.Year))
    .y0(d => y(d[0]))
    .y1(d => y(d[1]))
    .curve(d3.curveMonotoneX);

  const tooltipW = 111;
  const tooltipH = 60;

  const tooltip = svg.append("g")
    .style("display", "none")
    .style("pointer-events", "none");

  tooltip.append("rect")
    .attr("width", tooltipW)
    .attr("height", tooltipH)
    .attr("rx", 2)
    .attr("fill", "#ffffff")
    .attr("filter", "drop-shadow(0px 1px 4px rgba(0,0,0,0.22))");

  tooltip.append("text")
    .attr("class", "tooltip-title")
    .attr("x", 10)
    .attr("y", 24)
    .attr("font-size", 16)
    .attr("font-weight", 700);

  tooltip.append("text")
    .attr("class", "tooltip-value")
    .attr("x", 10)
    .attr("y", 47)
    .attr("font-size", 15)
    .attr("fill", "#333");

  function formatK(value) {
    return `£${d3.format(".1f")(value)}K`;
  }

  function placeTooltip(event) {
    const [px, py] = d3.pointer(event, svg.node());

    let tx = px + 14;
    let ty = py - tooltipH / 2;

    if (tx + tooltipW > margin.left + chartW) {
      tx = px - tooltipW - 14;
    }

    if (tx < margin.left) {
      tx = margin.left + 5;
    }

    if (ty < margin.top) {
      ty = margin.top + 5;
    }

    if (ty + tooltipH > margin.top + chartH) {
      ty = margin.top + chartH - tooltipH - 5;
    }

    tooltip
      .attr("transform", `translate(${tx}, ${ty})`)
      .style("display", null)
      .raise();
  }

  function showTooltip(event, series) {
    const [px] = d3.pointer(event, svg.node());
    const hoveredYear = x.invert(px);
    const i = d3.bisector(d => d.Year).center(data, hoveredYear);
    const d = data[i];

    tooltip.select(".tooltip-title")
      .attr("fill", colors[series.key])
      .text(series.key);

    const valueText = tooltip.select(".tooltip-value");
    valueText.selectAll("*").remove();

    valueText.append("tspan")
      .attr("font-weight", 700)
      .text(`${d.Year}:`);

    valueText.append("tspan")
      .text(` ${formatK(d[series.key])}`);

    placeTooltip(event);
  }

  function hideTooltip() {
    tooltip.style("display", "none");
  }

  svg.append("g")
    .selectAll("path")
    .data(stacked)
    .join("path")
    .attr("d", area)
    .attr("fill", d => colors[d.key])
    .attr("opacity", 0.92)
    .style("cursor", "default")
    .on("mouseenter", showTooltip)
    .on("mousemove", showTooltip)
    .on("mouseleave", hideTooltip);

  const lineX = x(2019);

  svg.append("line")
    .attr("x1", lineX)
    .attr("x2", lineX)
    .attr("y1", margin.top)
    .attr("y2", margin.top + chartH)
    .attr("stroke", "#111")
    .attr("stroke-width", 2)
    .attr("stroke-dasharray", "2,3");

  svg.append("text")
    .attr("x", lineX - 10)
    .attr("y", margin.top + 18)
    .attr("text-anchor", "end")
    .attr("font-size", 15)
    .attr("font-weight", 700)
    .attr("fill", "#3c3c3c")
    .text("Social media");

  svg.append("text")
    .attr("x", lineX - 10)
    .attr("y", margin.top + 36)
    .attr("text-anchor", "end")
    .attr("font-size", 15)
    .attr("font-weight", 700)
    .attr("fill", "#3c3c3c")
    .text("overtakes Print media");

  const lastYear = data[data.length - 1];

  let cumulative = 0;
  const rightLabels = channels.map(key => {
    cumulative += lastYear[key];
    return {
      key,
      value: cumulative
    };
  }).reverse();

  svg.selectAll(".right-label")
    .data(rightLabels)
    .join("text")
    .attr("x", margin.left + chartW + 15)
    .attr("y", d => y(d.value) + 5)
    .attr("font-size", 16)
    .attr("font-weight", 700)
    .attr("fill", d => colors[d.key])
    .text(d => d.key);

  return wrapper.node();
}


export default function define(runtime, observer) {
  const main = runtime.module();
  function toString() { return this.url; }
  const fileAttachments = new Map([
    ["Data.1778509913640.csv", {url: new URL("./files/f8e3b8f7a5fec49b5829de151af20d7fcec30515e62e051674d05636b814471aa6538d9a25844baea8611d13c08e3abdb8abda3fbfeffcd9a75423a364d415c4.csv", import.meta.url), mimeType: "text/csv", toString}]
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], _1);
  main.variable(observer()).define(["FileAttachment","width"], _2);
  return main;
}
