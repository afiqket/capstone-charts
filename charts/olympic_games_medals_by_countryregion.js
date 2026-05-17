function _1(md){return(
md`# Olympic games medals by country/region`
)}

async function _2(FileAttachment,width)
{
  const d3 = await import("https://cdn.jsdelivr.net/npm/d3@7/+esm");

  const raw = await FileAttachment("Data.1778510996547.csv").csv({ typed: false });

  const tabOrder = ["Summer", "Winter"];

  const legendOrder = [
    "United States",
    "Russia",
    "Germany",
    "Australia",
    "Other North America",
    "Other Asia",
    "Other Europe"
  ];

  // Stack order controls the vertical layering.
  // United States is last so it appears near the top, like the reference.
  const stackOrder = [
    "Russia",
    "Other Asia",
    "Other North America",
    "Other Europe",
    "Australia",
    "Germany",
    "United States"
  ];

  const colors = {
    "United States": "#7cc48d",
    Russia: "#d69a69",
    Germany: "#38c9cf",
    Australia: "#d8cd62",
    "Other North America": "#d98ca3",
    "Other Asia": "#77b8d3",
    "Other Europe": "#d3b47f",
    bg: "#1f2022",
    text: "#f2f2f2",
    muted: "#dddddd",
    axis: "#e8e8e8",
    guide: "#cccccc"
  };

  function cleanNumber(value) {
    const n = +value;
    if (!Number.isFinite(n) || Math.abs(n) < 1e-8) return 0;
    return n;
  }

  const data = raw
    .filter(d => d.year && d.Type)
    .map(d => {
      const row = {
        year: +d.year,
        type: d.Type.trim()
      };

      for (const key of stackOrder) {
        row[key] = cleanNumber(d[key]);
      }

      return row;
    })
    .sort((a, b) => d3.ascending(a.year, b.year));

  const byType = d3.group(data, d => d.type);

  const fullWidth = 955;
  const fullHeight = 648;

  const fitWidth = Math.min(width, fullWidth);
  const scale = fitWidth / fullWidth;
  const fitHeight = fullHeight * scale;

  const margin = {
    top: 198,
    right: 21,
    bottom: 46,
    left: 47
  };

  const chartW = fullWidth - margin.left - margin.right;
  const chartH = fullHeight - margin.top - margin.bottom;

  const wrapper = d3.create("div")
    .style("position", "relative")
    .style("width", `${fitWidth}px`)
    .style("height", `${fitHeight}px`)
    .style("overflow", "hidden");

  const root = wrapper.append("div")
    .style("position", "absolute")
    .style("left", 0)
    .style("top", 0)
    .style("width", `${fullWidth}px`)
    .style("height", `${fullHeight}px`)
    .style("background", colors.bg)
    .style("font-family", "Arial, Helvetica, sans-serif")
    .style("transform", `scale(${scale})`)
    .style("transform-origin", "top left");

  root.append("div")
    .style("position", "absolute")
    .style("left", "21px")
    .style("top", "14px")
    .style("font-size", "31px")
    .style("font-weight", "800")
    .style("line-height", "1.1")
    .style("color", colors.text)
    .style("z-index", "20")
    .text("Which countries have dominated the Olympics");

  root.append("div")
    .style("position", "absolute")
    .style("left", "22px")
    .style("top", "63px")
    .style("font-size", "17px")
    .style("font-weight", "700")
    .style("color", colors.text)
    .style("z-index", "20")
    .text("Olympic games medals by country/region");

  const svg = root.append("svg")
    .attr("width", fullWidth)
    .attr("height", fullHeight)
    .style("position", "absolute")
    .style("left", 0)
    .style("top", 0)
    .style("z-index", "1");

  const plot = svg.append("g");

  const tabs = root.append("div")
    .style("position", "absolute")
    .style("left", "21px")
    .style("top", "99px")
    .style("display", "flex")
    .style("z-index", "50")
    .style("pointer-events", "auto");

  const legend = root.append("div")
    .style("position", "absolute")
    .style("left", "21px")
    .style("top", "160px")
    .style("display", "flex")
    .style("align-items", "center")
    .style("gap", "10px")
    .style("font-size", "16px")
    .style("font-weight", "700")
    .style("color", colors.muted)
    .style("z-index", "20");

  for (const key of legendOrder) {
    const item = legend.append("div")
      .style("display", "flex")
      .style("align-items", "center")
      .style("gap", "3px");

    item.append("span")
      .style("width", "23px")
      .style("height", "3px")
      .style("background", colors[key])
      .style("display", "inline-block");

    item.append("span").text(key);
  }

  let selectedType = "Summer";

  function drawTabs() {
    tabs.selectAll("*").remove();

    tabs.selectAll("button")
      .data(tabOrder)
      .join("button")
      .attr("type", "button")
      .style("appearance", "none")
      .style("-webkit-appearance", "none")
      .style("border", "1px solid #62666b")
      .style("border-right", (d, i) => i === tabOrder.length - 1 ? "1px solid #62666b" : "0")
      .style("background", d => d === selectedType ? "#3a3a3a" : "transparent")
      .style("color", colors.text)
      .style("font-size", "16px")
      .style("font-weight", "700")
      .style("padding", "7px 9px")
      .style("line-height", "1")
      .style("cursor", "pointer")
      .style("margin", "0")
      .style("border-radius", (d, i) => {
        if (i === 0) return "2px 0 0 2px";
        if (i === tabOrder.length - 1) return "0 2px 2px 0";
        return "0";
      })
      .text(d => d)
      .on("click", (event, d) => {
        event.preventDefault();
        event.stopPropagation();
        selectedType = d;
        drawTabs();
        renderChart();
      });
  }

  function renderChart() {
    plot.selectAll("*").remove();

    const selected = byType.get(selectedType)
      .slice()
      .sort((a, b) => d3.ascending(a.year, b.year));

    const xDomain = selectedType === "Summer"
      ? [1896, 2020]
      : [1924, 2022];

    const xTicks = selectedType === "Summer"
      ? d3.range(1900, 2021, 10)
      : d3.range(1930, 2021, 10);

    const x = d3.scaleLinear()
      .domain(xDomain)
      .range([margin.left, margin.left + chartW]);

    const stacked = d3.stack()
      .keys(stackOrder)
      .order(d3.stackOrderNone)
      .offset(d3.stackOffsetSilhouette)(selected);

    const extent = d3.extent(stacked.flat(2));
    const pad = (extent[1] - extent[0]) * 0.06;

    const y = d3.scaleLinear()
      .domain([extent[0] - pad, extent[1] + pad])
      .range([margin.top + chartH, margin.top]);

    const area = d3.area()
      .x(d => x(d.data.year))
      .y0(d => y(d[0]))
      .y1(d => y(d[1]))
      .curve(d3.curveMonotoneX);

    const line = d3.line()
      .x(d => x(d.data.year))
      .y(d => y((d[0] + d[1]) / 2))
      .curve(d3.curveMonotoneX);

    plot.append("line")
      .attr("x1", margin.left)
      .attr("x2", margin.left + chartW)
      .attr("y1", margin.top + chartH)
      .attr("y2", margin.top + chartH)
      .attr("stroke", colors.axis)
      .attr("stroke-width", 4);

    plot.selectAll(".x-tick")
      .data(xTicks)
      .join("line")
      .attr("x1", d => x(d))
      .attr("x2", d => x(d))
      .attr("y1", margin.top + chartH)
      .attr("y2", margin.top + chartH + 8)
      .attr("stroke", colors.axis)
      .attr("stroke-width", 2);

    plot.selectAll(".x-label")
      .data(xTicks)
      .join("text")
      .attr("x", d => x(d))
      .attr("y", margin.top + chartH + 29)
      .attr("text-anchor", "middle")
      .attr("font-size", 21)
      .attr("font-weight", "700")
      .attr("fill", colors.text)
      .text(d => d);

    const areas = plot.append("g")
      .selectAll(".stream-area")
      .data(stacked)
      .join("path")
      .attr("class", "stream-area")
      .attr("fill", d => colors[d.key])
      .attr("opacity", 0.96)
      .attr("d", area);

    const tooltipW = 121;
    const tooltipH = 54;

    const tooltip = plot.append("g")
      .style("display", "none")
      .style("pointer-events", "none");

    tooltip.append("rect")
      .attr("width", tooltipW)
      .attr("height", tooltipH)
      .attr("rx", 2)
      .attr("fill", "#ffffff")
      .attr("filter", "drop-shadow(0px 2px 5px rgba(0,0,0,0.28))");

    tooltip.append("text")
      .attr("class", "tooltip-title")
      .attr("x", 9)
      .attr("y", 22)
      .attr("font-size", 14)
      .attr("font-weight", "800");

    tooltip.append("text")
      .attr("class", "tooltip-value")
      .attr("x", 9)
      .attr("y", 42)
      .attr("font-size", 16)
      .attr("font-weight", "700")
      .attr("fill", "#333333");

    const hoverDot = plot.append("circle")
      .attr("r", 0)
      .style("pointer-events", "none");

    function placeTooltip(px, py) {
      let tx = px + 14;
      let ty = py - tooltipH / 2;

      if (tx + tooltipW > margin.left + chartW - 4) {
        tx = px - tooltipW - 14;
      }

      if (tx < margin.left + 4) {
        tx = margin.left + 4;
      }

      if (ty < margin.top + 4) {
        ty = margin.top + 4;
      }

      if (ty + tooltipH > margin.top + chartH - 4) {
        ty = margin.top + chartH - tooltipH - 4;
      }

      tooltip
        .attr("transform", `translate(${tx}, ${ty})`)
        .style("display", null)
        .raise();

      hoverDot.raise();
    }

    function showTooltip(event, series) {
      const [px] = d3.pointer(event, svg.node());
      const nearestYear = x.invert(px);
      const i = d3.bisector(d => d.year).center(selected, nearestYear);
      const row = selected[Math.max(0, Math.min(selected.length - 1, i))];

      const point = series.find(d => d.data.year === row.year);
      const centerY = y((point[0] + point[1]) / 2);
      const value = row[series.key];

      hoverDot
        .attr("cx", x(row.year))
        .attr("cy", centerY)
        .attr("r", 4)
        .attr("fill", colors[series.key])
        .attr("stroke", colors.bg)
        .attr("stroke-width", 2);

      tooltip.select(".tooltip-title")
        .attr("fill", colors[series.key])
        .text(series.key);

      tooltip.select(".tooltip-value")
        .text(`${row.year}: ${d3.format(",")(value)}`);

      placeTooltip(x(row.year), centerY);
    }

    function hideTooltip() {
      tooltip.style("display", "none");
      hoverDot.attr("r", 0);
    }

    plot.append("g")
      .selectAll(".hover-line")
      .data(stacked)
      .join("path")
      .attr("class", "hover-line")
      .attr("fill", "none")
      .attr("stroke", "transparent")
      .attr("stroke-width", 28)
      .attr("d", line)
      .style("cursor", "default")
      .on("mouseenter", showTooltip)
      .on("mousemove", showTooltip)
      .on("mouseleave", hideTooltip);

    if (selectedType === "Summer") {
      const ww1X = x(1916);
      const ww2X = x(1942);

      plot.append("line")
        .attr("x1", ww1X)
        .attr("x2", ww1X)
        .attr("y1", margin.top)
        .attr("y2", margin.top + chartH)
        .attr("stroke", colors.guide)
        .attr("stroke-width", 1.5)
        .attr("stroke-dasharray", "2,3")
        .attr("opacity", 0.9);

      plot.append("text")
        .attr("x", ww1X - 8)
        .attr("y", margin.top + 20)
        .attr("text-anchor", "end")
        .attr("font-size", 15)
        .attr("font-weight", "800")
        .attr("fill", colors.muted)
        .text("World War I");

      plot.append("line")
        .attr("x1", ww2X)
        .attr("x2", ww2X)
        .attr("y1", margin.top)
        .attr("y2", margin.top + chartH)
        .attr("stroke", colors.guide)
        .attr("stroke-width", 1.5)
        .attr("stroke-dasharray", "2,3")
        .attr("opacity", 0.9);

      const ww2 = plot.append("text")
        .attr("x", ww2X - 8)
        .attr("y", margin.top + 20)
        .attr("text-anchor", "end")
        .attr("font-size", 15)
        .attr("font-weight", "800")
        .attr("fill", colors.muted);

      ww2.append("tspan")
        .attr("x", ww2X - 8)
        .attr("dy", 0)
        .text("No Olympic");

      ww2.append("tspan")
        .attr("x", ww2X - 8)
        .attr("dy", 18)
        .text("Games held");

      ww2.append("tspan")
        .attr("x", ww2X - 8)
        .attr("dy", 18)
        .text("during World");

      ww2.append("tspan")
        .attr("x", ww2X - 8)
        .attr("dy", 18)
        .text("War II");
    } else {
      const ww2X = x(1943);

      plot.append("line")
        .attr("x1", ww2X)
        .attr("x2", ww2X)
        .attr("y1", margin.top)
        .attr("y2", margin.top + chartH)
        .attr("stroke", colors.guide)
        .attr("stroke-width", 1.5)
        .attr("stroke-dasharray", "2,3")
        .attr("opacity", 0.9);

      const ww2 = plot.append("text")
        .attr("x", ww2X - 8)
        .attr("y", margin.top + 18)
        .attr("text-anchor", "end")
        .attr("font-size", 15)
        .attr("font-weight", "800")
        .attr("fill", colors.muted);

      ww2.append("tspan")
        .attr("x", ww2X - 8)
        .attr("dy", 0)
        .text("No Olympic");

      ww2.append("tspan")
        .attr("x", ww2X - 8)
        .attr("dy", 18)
        .text("Games held");

      ww2.append("tspan")
        .attr("x", ww2X - 8)
        .attr("dy", 18)
        .text("during World");

      ww2.append("tspan")
        .attr("x", ww2X - 8)
        .attr("dy", 18)
        .text("War II");
    }

    areas.raise();
    tooltip.raise();
  }

  drawTabs();
  renderChart();

  return wrapper.node();
}


export default function define(runtime, observer) {
  const main = runtime.module();
  function toString() { return this.url; }
  const fileAttachments = new Map([
    ["Data.1778510996547.csv", {url: new URL("./files/1321d779fc9703d297ca695a37dd800e4709db0ee42ddd2b36ab1a13235ad838dfe30695ae76bda7ade60276fad63f2868eab004514a80581f2101215fdc3db3.csv", import.meta.url), mimeType: "text/csv", toString}]
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], _1);
  main.variable(observer()).define(["FileAttachment","width"], _2);
  return main;
}
