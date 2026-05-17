function _1(md){return(
md`# Social media influence on mental health`
)}

async function _2(FileAttachment,width)
{
  const d3 = await import("https://cdn.jsdelivr.net/npm/d3@7/+esm");

  const raw = await FileAttachment("Data.1778510504378.csv").csv({ typed: false });

  const ageOrder = ["All adults", "18-29", "30-44", "45-64", "65+"];
  const seriesOrder = ["Positive", "Negative", "Neither", "Not applicable", "Don't know"];

  const colors = {
    Positive: "#40d2db",
    Negative: "#ff7f73",
    Neither: "#aeeedb",
    "Not applicable": "#b8acef",
    "Don't know": "#ffad47",
    bg: "#1f232c",
    grid: "#7e7e7e",
    axis: "#f0f0f0",
    text: "#f2f2f2",
    subtext: "#dddddd"
  };

  const parseDate = d3.timeParse("%Y-%m-%d");
  const formatDate = d3.timeFormat("%b %Y");

  const data = raw
    .filter(d => d.Date && d.Age)
    .map(d => ({
      age: d.Age.trim(),
      date: parseDate(d.Date.trim()),
      Positive: +String(d.Positive).replace("%", ""),
      Negative: +String(d.Negative).replace("%", ""),
      Neither: +String(d.Neither).replace("%", ""),
      "Not applicable": +String(d["Not applicable"]).replace("%", ""),
      "Don't know": +String(d["Don't know"]).replace("%", "")
    }))
    .sort((a, b) => d3.ascending(a.date, b.date));

  const byAge = d3.group(data, d => d.age);

  const fullWidth = 906;
  const fullHeight = 644;

  const fitWidth = Math.min(width, fullWidth);
  const scale = fitWidth / fullWidth;
  const fitHeight = fullHeight * scale;

  const margin = { top: 146, right: 177, bottom: 76, left: 60 };
  const chartW = fullWidth - margin.left - margin.right;
  const chartH = fullHeight - margin.top - margin.bottom;

  const x = d3.scaleTime()
    .domain([new Date(2020, 11, 1), new Date(2024, 6, 1)])
    .range([margin.left, margin.left + chartW]);

  const y = d3.scaleLinear()
    .domain([0, 45])
    .range([margin.top + chartH, margin.top]);

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
    .style("left", "22px")
    .style("top", "14px")
    .style("font-size", "23px")
    .style("font-weight", "700")
    .style("color", colors.text)
    .style("z-index", "20")
    .text("Social media influence on mental health");

  root.append("div")
    .style("position", "absolute")
    .style("left", "22px")
    .style("top", "47px")
    .style("font-size", "17px")
    .style("font-weight", "500")
    .style("color", colors.subtext)
    .style("z-index", "20")
    .text("Biannual survey of US Adults");

  root.append("div")
    .style("position", "absolute")
    .style("left", "14px")
    .style("top", "87px")
    .style("font-size", "15px")
    .style("font-weight", "700")
    .style("color", colors.text)
    .style("z-index", "20")
    .text("Select age group:");

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
    .style("left", "156px")
    .style("top", "82px")
    .style("display", "flex")
    .style("align-items", "stretch")
    .style("z-index", "50")
    .style("pointer-events", "auto");

  let selectedAge = "All adults";

  function drawTabs() {
    tabs.selectAll("*").remove();

    tabs.selectAll("button")
      .data(ageOrder)
      .join("button")
      .attr("type", "button")
      .style("appearance", "none")
      .style("-webkit-appearance", "none")
      .style("border", "1px solid #555b66")
      .style("background", d => d === selectedAge ? "#e7e7e7" : "transparent")
      .style("color", d => d === selectedAge ? "#2b2b2b" : "#f0f0f0")
      .style("padding", "6px 11px")
      .style("font-size", "15px")
      .style("font-family", "Arial, Helvetica, sans-serif")
      .style("line-height", "1")
      .style("cursor", "pointer")
      .style("margin", "0")
      .style("position", "relative")
      .style("z-index", "60")
      .style("pointer-events", "auto")
      .style("border-right", (d, i) => i === ageOrder.length - 1 ? "1px solid #555b66" : "0px")
      .style("border-radius", (d, i) => {
        if (i === 0) return "3px 0 0 3px";
        if (i === ageOrder.length - 1) return "0 3px 3px 0";
        return "0";
      })
      .text(d => d)
      .on("click", (event, d) => {
        event.preventDefault();
        event.stopPropagation();
        selectedAge = d;
        drawTabs();
        renderChart();
      });
  }

  function renderChart() {
    plot.selectAll("*").remove();

    const selected = byAge.get(selectedAge)
      .slice()
      .sort((a, b) => d3.ascending(a.date, b.date));

    const yTicks = [0, 10, 20, 30, 40];
    const xTicks = [
      new Date(2021, 0, 1),
      new Date(2022, 0, 1),
      new Date(2023, 0, 1),
      new Date(2024, 0, 1)
    ];

    plot.selectAll(".y-grid")
      .data(yTicks)
      .join("line")
      .attr("x1", margin.left)
      .attr("x2", margin.left + chartW)
      .attr("y1", d => y(d))
      .attr("y2", d => y(d))
      .attr("stroke", colors.grid)
      .attr("stroke-width", 1)
      .attr("opacity", 0.65);

    plot.append("line")
      .attr("x1", margin.left)
      .attr("x2", margin.left)
      .attr("y1", margin.top)
      .attr("y2", margin.top + chartH)
      .attr("stroke", colors.axis)
      .attr("stroke-width", 2);

    plot.append("line")
      .attr("x1", margin.left)
      .attr("x2", margin.left + chartW)
      .attr("y1", margin.top + chartH)
      .attr("y2", margin.top + chartH)
      .attr("stroke", colors.axis)
      .attr("stroke-width", 2);

    plot.selectAll(".y-label")
      .data(yTicks)
      .join("text")
      .attr("x", margin.left - 8)
      .attr("y", d => y(d) + 6)
      .attr("text-anchor", "end")
      .attr("font-size", 15)
      .attr("font-weight", 600)
      .attr("fill", colors.text)
      .text(d => `${d}%`);

    plot.selectAll(".x-label")
      .data(xTicks)
      .join("text")
      .attr("x", d => x(d))
      .attr("y", margin.top + chartH + 24)
      .attr("text-anchor", "middle")
      .attr("font-size", 15)
      .attr("font-weight", 500)
      .attr("fill", colors.text)
      .text(d3.timeFormat("Jan %Y"));

    const line = d3.line()
      .x(d => x(d.date))
      .y(d => y(d.value))
      .curve(d3.curveMonotoneX);

    const seriesData = seriesOrder.map(key => ({
      key,
      values: selected.map(d => ({
        date: d.date,
        value: d[key]
      }))
    }));

    plot.append("g")
      .selectAll(".series-path")
      .data(seriesData)
      .join("path")
      .attr("class", "series-path")
      .attr("fill", "none")
      .attr("stroke", d => colors[d.key])
      .attr("stroke-width", 3.2)
      .attr("d", d => line(d.values));

    const hoverGroup = plot.append("g");

    const tooltipW = 150;
    const tooltipH = 70;

    const tooltip = plot.append("g")
      .style("display", "none")
      .style("pointer-events", "none");

    tooltip.append("rect")
      .attr("width", tooltipW)
      .attr("height", tooltipH)
      .attr("rx", 2)
      .attr("fill", "#ffffff")
      .attr("filter", "drop-shadow(0px 2px 6px rgba(0,0,0,0.28))");

    tooltip.append("text")
      .attr("class", "tt-answer")
      .attr("x", 10)
      .attr("y", 23)
      .attr("font-size", 15)
      .attr("font-weight", 700);

    tooltip.append("text")
      .attr("class", "tt-date")
      .attr("x", 10)
      .attr("y", 43)
      .attr("font-size", 14)
      .attr("fill", "#333");

    tooltip.append("text")
      .attr("class", "tt-pct")
      .attr("x", 10)
      .attr("y", 60)
      .attr("font-size", 14)
      .attr("fill", "#333");

    function placeTooltip(px, py) {
      let tx = px + 14;
      let ty = py - tooltipH / 2;

      if (tx + tooltipW > margin.left + chartW + 10) {
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
    }

    function showTooltip(event, series) {
      const [px] = d3.pointer(event, svg.node());
      const i = d3.bisector(d => d.date).center(series.values, x.invert(px));
      const point = series.values[Math.max(0, Math.min(series.values.length - 1, i))];

      hoverGroup.selectAll("*").remove();

      hoverGroup.append("circle")
        .attr("cx", x(point.date))
        .attr("cy", y(point.value))
        .attr("r", 4.5)
        .attr("fill", colors[series.key])
        .attr("stroke", colors.bg)
        .attr("stroke-width", 2);

      tooltip.select(".tt-answer")
        .attr("fill", colors[series.key])
        .text(`Answer: ${series.key}`);

      tooltip.select(".tt-date")
        .text(`Date: ${formatDate(point.date)}`);

      tooltip.select(".tt-pct")
        .text(`Percentage: ${point.value}%`);

      placeTooltip(x(point.date), y(point.value));
    }

    function hideTooltip() {
      tooltip.style("display", "none");
      hoverGroup.selectAll("*").remove();
    }

    plot.append("g")
      .selectAll(".hover-path")
      .data(seriesData)
      .join("path")
      .attr("class", "hover-path")
      .attr("fill", "none")
      .attr("stroke", "transparent")
      .attr("stroke-width", 20)
      .attr("d", d => line(d.values))
      .style("cursor", "default")
      .on("mouseenter", showTooltip)
      .on("mousemove", showTooltip)
      .on("mouseleave", hideTooltip);

    const lastX = margin.left + chartW;

    const labelData = seriesData
      .map(s => ({
        key: s.key,
        x: lastX,
        y: y(s.values[s.values.length - 1].value),
        value: s.values[s.values.length - 1].value
      }))
      .sort((a, b) => a.y - b.y);

    const minGap = 15;

    for (let i = 1; i < labelData.length; i++) {
      if (labelData[i].y - labelData[i - 1].y < minGap) {
        labelData[i].y = labelData[i - 1].y + minGap;
      }
    }

    for (let i = labelData.length - 2; i >= 0; i--) {
      if (
        labelData[i + 1].y > margin.top + chartH - 4 &&
        labelData[i].y > labelData[i + 1].y - minGap
      ) {
        labelData[i].y = labelData[i + 1].y - minGap;
      }
    }

    const labels = plot.append("g");

    labels.selectAll(".connector")
      .data(labelData)
      .join("line")
      .attr("x1", d => lastX + 4)
      .attr("x2", d => lastX + 10)
      .attr("y1", d => y(d.value))
      .attr("y2", d => d.y)
      .attr("stroke", "#eaeaea")
      .attr("stroke-width", 1.2);

    labels.selectAll(".right-label")
      .data(labelData)
      .join("text")
      .attr("x", lastX + 15)
      .attr("y", d => d.y + 5)
      .attr("font-size", 16)
      .attr("font-weight", 700)
      .attr("fill", d => colors[d.key])
      .text(d => d.key);

    plot.append("text")
      .attr("x", 21)
      .attr("y", fullHeight - 16)
      .attr("font-size", 14)
      .attr("font-weight", 600)
      .attr("fill", colors.text)
      .text("Source:");

    plot.append("text")
      .attr("x", 74)
      .attr("y", fullHeight - 16)
      .attr("font-size", 14)
      .attr("font-weight", 600)
      .attr("fill", colors.text)
      .style("text-decoration", "underline")
      .text("YouGov");

    plot.append("text")
      .attr("x", 135)
      .attr("y", fullHeight - 16)
      .attr("font-size", 14)
      .attr("font-weight", 500)
      .attr("fill", colors.text)
      .text("• Created with the Flourish");

    plot.append("text")
      .attr("x", 318)
      .attr("y", fullHeight - 16)
      .attr("font-size", 14)
      .attr("font-weight", 700)
      .attr("fill", colors.text)
      .style("text-decoration", "underline")
      .text("Line, Bar, Pie template");
  }

  drawTabs();
  renderChart();

  return wrapper.node();
}


export default function define(runtime, observer) {
  const main = runtime.module();
  function toString() { return this.url; }
  const fileAttachments = new Map([
    ["Data.1778510504378.csv", {url: new URL("./files/f86732945408acfa0dba4317e57b8df96f4454471338dc545ffa153c3a65b828eb378fd4ac815dc6be12e7ae5cde070ceec5c0a7ae7095d69219fb51b6994037.csv", import.meta.url), mimeType: "text/csv", toString}]
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], _1);
  main.variable(observer()).define(["FileAttachment","width"], _2);
  return main;
}
