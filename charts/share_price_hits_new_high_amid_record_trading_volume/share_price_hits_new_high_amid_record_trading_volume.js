function _1(md){return(
md`# Share price hits new high amid record trading volume`
)}

async function _2(FileAttachment,width)
{
  const d3 = await import("https://cdn.jsdelivr.net/npm/d3@7/+esm");

  const raw = await FileAttachment("Data.1778508920486.csv").csv({ typed: true });

  const parseDate = d3.timeParse("%d/%m/%Y");

  const data = raw
    .filter(d => d.Date && d.Price != null && d.Volume != null)
    .map(d => ({
      date: parseDate(d.Date),
      price: +d.Price,
      volume: +d.Volume / 1000
    }))
    .filter(d => d.date)
    .sort((a, b) => d3.ascending(a.date, b.date));

  const fullWidth = 911;
  const fullHeight = 656;

  // Scale chart to fit Observable canvas
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
    top: 102,
    right: 73,
    bottom: 81,
    left: 88
  };

  const chartW = fullWidth - margin.left - margin.right;
  const chartH = fullHeight - margin.top - margin.bottom;

  const colors = {
    volume: "#79caf5",
    price: "#c7324b",
    text: "#3b3b3b",
    grid: "#e2e2e2"
  };

  root.append("div")
    .style("position", "absolute")
    .style("left", "23px")
    .style("top", "12px")
    .style("font-size", "24px")
    .style("font-weight", "700")
    .style("letter-spacing", "0.2px")
    .html(`Share <span style="color:${colors.price}">price</span> hits new high amid record trading <span style="color:${colors.volume}">volume</span>`);

  root.append("div")
    .style("position", "absolute")
    .style("left", "23px")
    .style("top", "73px")
    .style("font-size", "15px")
    .style("font-weight", "700")
    .style("color", colors.volume)
    .text("Volume traded (thousands)");

  root.append("div")
    .style("position", "absolute")
    .style("right", "18px")
    .style("top", "73px")
    .style("font-size", "15px")
    .style("font-weight", "700")
    .style("color", colors.price)
    .text("Share price");

  const svg = root.append("svg")
    .attr("width", fullWidth)
    .attr("height", fullHeight)
    .style("position", "absolute")
    .style("left", 0)
    .style("top", 0);

  const x = d3.scaleTime()
    .domain([new Date(2025, 0, 1), new Date(2025, 9, 31)])
    .range([margin.left, margin.left + chartW]);

  const yVolume = d3.scaleLinear()
    .domain([0, 150000])
    .range([margin.top + chartH, margin.top]);

  const yPrice = d3.scaleLinear()
    .domain([150, 300])
    .range([margin.top + chartH, margin.top]);

  const yTicksVolume = [0, 50000, 100000, 150000];
  const yTicksPrice = [150, 200, 250, 300];

  svg.selectAll(".grid")
    .data(yTicksVolume)
    .join("line")
    .attr("x1", margin.left)
    .attr("x2", margin.left + chartW)
    .attr("y1", d => yVolume(d))
    .attr("y2", d => yVolume(d))
    .attr("stroke", colors.grid)
    .attr("stroke-width", 1);

  svg.selectAll(".left-tick")
    .data(yTicksVolume)
    .join("text")
    .attr("x", margin.left - 6)
    .attr("y", d => yVolume(d) + 5)
    .attr("text-anchor", "end")
    .attr("font-size", 16)
    .attr("fill", "#333")
    .text(d => d3.format(",")(d));

  svg.selectAll(".right-tick")
    .data(yTicksPrice)
    .join("text")
    .attr("x", margin.left + chartW + 19)
    .attr("y", d => yPrice(d) + 5)
    .attr("font-size", 16)
    .attr("fill", "#333")
    .text(d => `$${d}`);

  const monthTicks = d3.timeMonth.range(
    new Date(2025, 0, 1),
    new Date(2025, 10, 1)
  );

  svg.selectAll(".x-tick")
    .data(monthTicks)
    .join("text")
    .attr("x", d => x(d))
    .attr("y", margin.top + chartH + 22)
    .attr("text-anchor", "middle")
    .attr("font-size", 16)
    .attr("fill", "#333")
    .text(d3.timeFormat("%b-%y"));

  const barW = 3;

  const volumeBars = svg.append("g")
    .selectAll("rect")
    .data(data)
    .join("rect")
    .attr("x", d => x(d.date) - barW / 2)
    .attr("y", d => yVolume(d.volume))
    .attr("width", barW)
    .attr("height", d => yVolume(0) - yVolume(d.volume))
    .attr("fill", colors.volume)
    .attr("opacity", 0.9);

  const line = d3.line()
    .x(d => x(d.date))
    .y(d => yPrice(d.price));

  svg.append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", colors.price)
    .attr("stroke-width", 3)
    .attr("d", line);

  svg.append("circle")
    .attr("cx", x(data[data.length - 1].date))
    .attr("cy", yPrice(data[data.length - 1].price))
    .attr("r", 4)
    .attr("fill", colors.price);

  const legend = svg.append("g")
    .attr("transform", `translate(${fullWidth / 2 - 68}, ${fullHeight - 31})`);

  legend.append("rect")
    .attr("x", 0)
    .attr("y", -10)
    .attr("width", 11)
    .attr("height", 11)
    .attr("rx", 2)
    .attr("fill", colors.volume);

  legend.append("text")
    .attr("x", 16)
    .attr("y", 0)
    .attr("font-size", 15)
    .attr("fill", "#444")
    .text("Volume");

  legend.append("rect")
    .attr("x", 75)
    .attr("y", -10)
    .attr("width", 11)
    .attr("height", 11)
    .attr("rx", 2)
    .attr("fill", colors.price);

  legend.append("text")
    .attr("x", 91)
    .attr("y", 0)
    .attr("font-size", 15)
    .attr("fill", "#444")
    .text("Price");

  const tooltipW = 136;
  const tooltipH = 57;

  const tooltip = svg.append("g")
    .style("display", "none")
    .style("pointer-events", "none");

  tooltip.append("rect")
    .attr("width", tooltipW)
    .attr("height", tooltipH)
    .attr("fill", "white")
    .attr("filter", "drop-shadow(0px 1px 4px rgba(0,0,0,0.18))");

  tooltip.append("text")
    .attr("class", "tooltip-title")
    .attr("x", 10)
    .attr("y", 24)
    .attr("font-size", 17)
    .attr("font-weight", 700);

  tooltip.append("text")
    .attr("class", "tooltip-value")
    .attr("x", 10)
    .attr("y", 43)
    .attr("font-size", 15)
    .attr("fill", "#333");

  function placeTooltip(px, py) {
    let tx = px + 14;
    let ty = py - tooltipH - 10;

    if (tx + tooltipW > margin.left + chartW) {
      tx = px - tooltipW - 14;
    }

    if (tx < margin.left) {
      tx = margin.left + 4;
    }

    if (ty < margin.top) {
      ty = py + 14;
    }

    if (ty + tooltipH > margin.top + chartH) {
      ty = margin.top + chartH - tooltipH - 4;
    }

    tooltip
      .attr("transform", `translate(${tx}, ${ty})`)
      .style("display", null)
      .raise();
  }

  function showPriceTooltip(event, d) {
    tooltip.select(".tooltip-title")
      .attr("fill", colors.price)
      .text("Price");

    tooltip.select(".tooltip-value")
      .text(`${d3.timeFormat("%b-%y")(d.date)}: $${d.price.toFixed(2)}`);

    placeTooltip(x(d.date), yPrice(d.price));
  }

  function showVolumeTooltip(event, d) {
    tooltip.select(".tooltip-title")
      .attr("fill", colors.volume)
      .text("Volume");

    tooltip.select(".tooltip-value")
      .text(`${d3.timeFormat("%b-%y")(d.date)}: ${d3.format(",.0f")(d.volume)}`);

    placeTooltip(x(d.date), yVolume(d.volume));
  }

  function hideTooltip() {
    tooltip.style("display", "none");
  }

  volumeBars
    .style("cursor", "default")
    .on("mouseenter", showVolumeTooltip)
    .on("mousemove", showVolumeTooltip)
    .on("mouseleave", hideTooltip);

  svg.append("g")
    .selectAll("circle")
    .data(data)
    .join("circle")
    .attr("cx", d => x(d.date))
    .attr("cy", d => yPrice(d.price))
    .attr("r", 7)
    .attr("fill", "transparent")
    .style("cursor", "default")
    .on("mouseenter", showPriceTooltip)
    .on("mousemove", showPriceTooltip)
    .on("mouseleave", hideTooltip);

  return wrapper.node();
}


export default function define(runtime, observer) {
  const main = runtime.module();
  function toString() { return this.url; }
  const fileAttachments = new Map([
    ["Data.1778508920486.csv", {url: new URL("./files/fc2e3df4357e0379e403f016a2280e7ea0ae4b8bf21c88a6e15ceff7fc9a9f7b463bf927a19fedcf34eed9429991826664b5f818ef187a9afda5987a6376c2c3.csv", import.meta.url), mimeType: "text/csv", toString}]
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], _1);
  main.variable(observer()).define(["FileAttachment","width"], _2);
  return main;
}
