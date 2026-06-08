function _1(md){return(
md`# Number of daily smokers in 2012`
)}

function _2(rawData,d3)
{
  const countries = ["Japan", "Germany", "Vietnam", "Italy", "Thailand", "United Kingdom", "Peru", "Finland", "Singapore"];

  const colorMap = {
    "Japan":          "#3a9c6b",
    "Germany":        "#b35c2a",
    "Vietnam":        "#8c6d2f",
    "Italy":          "#a0a030",
    "Thailand":       "#1f4e79",
    "United Kingdom": "#c46ab0",
    "Peru":           "#7a5cc4",
    "Finland":        "#c44040",
    "Singapore":      "#c47a40"
  };

  const col = "Number of daily smokers - both (IHME, GHDx (2012))";

  const W = 900, H = 500;
  const margin = { top: 80, right: 140, bottom: 60, left: 80 };
  const innerW = W - margin.left - margin.right;
  const innerH = H - margin.top - margin.bottom;

  // ── Data prep ─────────────────────────────────────────────────────────────
  const filtered = rawData.filter(d => countries.includes(d.Entity));

  const nested = d3.groups(filtered, d => d.Entity).map(([country, values]) => ({
    country,
    values: values
      .map(d => ({ year: +d.Year, value: +d[col] }))
      .sort((a, b) => a.year - b.year)
  }));

  const allYears = [...new Set(filtered.map(d => +d.Year))].sort((a, b) => a - b);
  let currentYear = allYears[allYears.length - 1];
  let mode = "line";
  let playing = false, timer = null;

  // ── Container ─────────────────────────────────────────────────────────────
  const container = d3.create("div").style("font-family", "sans-serif").style("user-select", "none");

  const btnRow = container.append("div").style("display", "flex").style("gap", "6px").style("margin-bottom", "6px");
  const mkBtn = (label, active) => btnRow.append("button").text(label)
    .style("padding", "4px 14px").style("border", "1px solid #ccc").style("border-radius", "4px")
    .style("cursor", "pointer").style("font-size", "13px")
    .style("background", active ? "#3a6fc4" : "#fff")
    .style("color",      active ? "#fff"    : "#333");

  const btnLine = mkBtn("📈 Line", true);
  const btnBar  = mkBtn("📊 Bar",  false);

  const svg = container.append("svg")
    .attr("viewBox", `0 0 ${W} ${H}`)
    .attr("width", W).attr("height", H)
    .style("background", "#fff");

  const titleEl = svg.append("text").attr("x", margin.left).attr("y", 22)
    .style("font-size", "15px").style("font-weight", "bold").style("fill", "#111");

  svg.append("text").attr("x", margin.left).attr("y", 40)
    .style("font-size", "10.5px").style("fill", "#555")
    .text("Estimates of the total number of people who smoke cigarettes at least daily (across men and women of all ages).");

  const mainG = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  // ── Tooltip ───────────────────────────────────────────────────────────────
  const ttG = svg.append("g").style("display", "none").style("pointer-events", "none");
  const ttBg = ttG.append("rect").attr("rx", 6).attr("fill", "white")
    .attr("stroke", "#ddd").attr("stroke-width", 1)
    .attr("filter", "drop-shadow(0 2px 6px rgba(0,0,0,0.13))");
  const ttTitle = ttG.append("text").attr("x", 12).attr("y", 20)
    .style("font-size", "13px").style("font-weight", "bold").style("fill", "#111");

  function showTooltip(year, dataByCountry, mx, my) {
    ttTitle.text(year);
    ttG.selectAll(".ttrow").remove();
    const sorted = dataByCountry.sort((a, b) => b.value - a.value);
    sorted.forEach((d, i) => {
      const grp = ttG.append("g").attr("class", "ttrow");
      grp.append("rect").attr("x", 12).attr("y", 28 + i * 18).attr("width", 10).attr("height", 10)
        .attr("fill", colorMap[d.country]).attr("rx", 2);
      grp.append("text").attr("x", 28).attr("y", 37 + i * 18)
        .style("font-size", "11px").style("fill", "#333")
        .text(`${d.country}: ${d3.format(",.2s")(d.value)}`);
    });
    const ttH = 24 + sorted.length * 18 + 8;
    const ttW = 200;
    ttBg.attr("width", ttW).attr("height", ttH);
    ttG.style("display", null);
    const tx = mx + ttW + 20 > W ? mx - ttW - 8 : mx + 12;
    const ty = Math.max(0, Math.min(my - 20, H - ttH - 10));
    ttG.attr("transform", `translate(${tx},${ty})`);
  }
  function hideTooltip() { ttG.style("display", "none"); }

  // ── RENDER LINE ───────────────────────────────────────────────────────────
  function renderLine() {
    mainG.selectAll("*").remove();
    titleEl.text(`Number of daily smokers, 1980 to 2012`);

    const yMax = d3.max(filtered, d => +d[col]);
    const xScale = d3.scaleLinear().domain([1980, 2012]).range([0, innerW]);
    const yScale = d3.scaleLinear().domain([0, yMax]).nice().range([innerH, 0]);

    // Gridlines
    yScale.ticks(6).forEach(v => {
      mainG.append("line")
        .attr("x1", 0).attr("x2", innerW).attr("y1", yScale(v)).attr("y2", yScale(v))
        .attr("stroke", v === 0 ? "#bbb" : "#e0e0e0")
        .attr("stroke-dasharray", v === 0 ? "0" : "4,3").attr("stroke-width", 1);
      mainG.append("text").attr("x", -8).attr("y", yScale(v)).attr("dy", "0.35em")
        .style("font-size", "10px").style("fill", "#888").style("text-anchor", "end")
        .text(v === 0 ? "0" : v >= 1e6 ? `${v / 1e6} million` : d3.format(",")(v));
    });

    // X axis
    [1980, 1985, 1990, 1995, 2000, 2005, 2012].forEach(y => {
      mainG.append("text").attr("x", xScale(y)).attr("y", innerH + 18)
        .style("font-size", "10px").style("fill", "#888").style("text-anchor", "middle").text(y);
    });
    mainG.append("line").attr("x1", 0).attr("x2", innerW)
      .attr("y1", innerH).attr("y2", innerH).attr("stroke", "#bbb").attr("stroke-width", 1);

    const lineGen = d3.line().x(d => xScale(d.year)).y(d => yScale(d.value));

    nested.forEach(({ country, values }) => {
      mainG.append("path").datum(values)
        .attr("fill", "none").attr("stroke", colorMap[country]).attr("stroke-width", 2)
        .attr("d", lineGen);
      values.forEach(r => {
        mainG.append("circle")
          .attr("cx", xScale(r.year)).attr("cy", yScale(r.value))
          .attr("r", 2.5).attr("fill", colorMap[country]);
      });
      const last = values[values.length - 1];
      mainG.append("text")
        .attr("x", innerW + 6).attr("y", yScale(last.value)).attr("dy", "0.35em")
        .style("font-size", "11px").style("font-weight", "bold").style("fill", colorMap[country])
        .text(country);
    });

    // Hover overlay
    const hoverLine = mainG.append("line").attr("y1", 0).attr("y2", innerH)
      .attr("stroke", "#999").attr("stroke-width", 1).style("display", "none");

    mainG.append("rect").attr("width", innerW).attr("height", innerH).attr("fill", "transparent")
      .on("mousemove", function(event) {
        const [mx] = d3.pointer(event);
        const yr = Math.round(xScale.invert(mx));
        const clampedYr = Math.max(1980, Math.min(2012, yr));
        hoverLine.attr("x1", xScale(clampedYr)).attr("x2", xScale(clampedYr)).style("display", null);
        const dataAtYear = nested.map(({ country, values }) => ({
          country,
          value: values.find(v => v.year === clampedYr)?.value
        })).filter(d => d.value != null);
        const [sx, sy] = d3.pointer(event, svg.node());
        showTooltip(clampedYr, dataAtYear, sx, sy);
      })
      .on("mouseleave", () => { hoverLine.style("display", "none"); hideTooltip(); });
  }

  // ── RENDER BAR ────────────────────────────────────────────────────────────
  function renderBar() {
    mainG.selectAll("*").remove();
    titleEl.text(`Number of daily smokers, ${currentYear}`);

    const barData = nested.map(({ country, values }) => ({
      country,
      value: values.find(v => v.year === currentYear)?.value ?? 0
    })).sort((a, b) => b.value - a.value);

    const BAR_COLOR = "#6b7fad";
    const xScale = d3.scaleLinear().domain([0, d3.max(barData, d => d.value) * 1.08]).range([0, innerW]);
    const yScale = d3.scaleBand().domain(barData.map(d => d.country)).range([0, innerH]).padding(0.35);

    barData.forEach(d => {
      const y  = yScale(d.country);
      const bw = yScale.bandwidth();
      const cy = y + bw / 2;

      mainG.append("rect")
        .attr("x", 0).attr("y", y)
        .attr("width", xScale(d.value)).attr("height", bw)
        .attr("fill", BAR_COLOR);

      mainG.append("text").attr("x", -8).attr("y", cy).attr("dy", "0.35em")
        .style("text-anchor", "end").style("font-size", "13px").style("font-weight", "bold").style("fill", "#222")
        .text(d.country);

      const label = d.value >= 1e6
        ? `${d3.format(",.2f")(d.value / 1e6)} million`
        : d3.format(",")(d.value);
      mainG.append("text")
        .attr("x", xScale(d.value) + 8).attr("y", cy).attr("dy", "0.35em")
        .style("font-size", "13px").style("fill", "#444")
        .text(label);
    });

    mainG.append("line").attr("x1", 0).attr("x2", 0).attr("y1", 0).attr("y2", innerH)
      .attr("stroke", "#bbb").attr("stroke-width", 1);
  }

  // ── Slider ────────────────────────────────────────────────────────────────
  const sliderY  = H - 42;
  const sliderX0 = 90, sliderX1 = W - 60;
  const xSlider  = d3.scalePoint().domain(allYears).range([sliderX0, sliderX1]);
  const sliderG  = svg.append("g");

  const playBtn = sliderG.append("text").attr("x", 24).attr("y", sliderY + 5)
    .style("font-size", "18px").style("cursor", "pointer").style("fill", "#555").text("▶");

  sliderG.append("text").attr("x", sliderX0).attr("y", sliderY + 5)
    .style("font-size", "12px").style("fill", "#888").style("text-anchor", "middle").text(allYears[0]);
  sliderG.append("text").attr("x", sliderX1).attr("y", sliderY + 5)
    .style("font-size", "12px").style("fill", "#888").style("text-anchor", "middle").text(allYears[allYears.length - 1]);
  sliderG.append("line").attr("x1", sliderX0).attr("x2", sliderX1)
    .attr("y1", sliderY).attr("y2", sliderY)
    .attr("stroke", "#ccc").attr("stroke-width", 4).attr("stroke-linecap", "round");

  const handle = sliderG.append("circle").attr("cy", sliderY).attr("r", 9)
    .attr("fill", "#555").style("cursor", "pointer");

  function updateYear(y) {
    currentYear = y;
    handle.attr("cx", xSlider(y));
    if (mode === "bar") renderBar();
  }
  updateYear(currentYear);

  sliderG.append("rect").attr("x", sliderX0).attr("y", sliderY - 12)
    .attr("width", sliderX1 - sliderX0).attr("height", 24)
    .attr("fill", "transparent").style("cursor", "pointer")
    .on("click", function(event) {
      const [mx] = d3.pointer(event);
      updateYear(allYears.reduce((a, b) => Math.abs(xSlider(a) - mx) < Math.abs(xSlider(b) - mx) ? a : b));
    });

  handle.call(d3.drag().on("drag", function(event) {
    const mx = Math.max(sliderX0, Math.min(sliderX1, event.x));
    updateYear(allYears.reduce((a, b) => Math.abs(xSlider(a) - mx) < Math.abs(xSlider(b) - mx) ? a : b));
  }));

  playBtn.on("click", () => {
    if (playing) { clearInterval(timer); playing = false; playBtn.text("▶"); }
    else {
      if (currentYear === allYears[allYears.length - 1]) updateYear(allYears[0]);
      playing = true; playBtn.text("⏸");
      timer = setInterval(() => {
        const idx = allYears.indexOf(currentYear);
        if (idx < allYears.length - 1) updateYear(allYears[idx + 1]);
        else { clearInterval(timer); playing = false; playBtn.text("▶"); }
      }, 250);
    }
  });

  // ── Mode switching ────────────────────────────────────────────────────────
  function setMode(m) {
    mode = m;
    btnLine.style("background", m === "line" ? "#3a6fc4" : "#fff").style("color", m === "line" ? "#fff" : "#333");
    btnBar .style("background", m === "bar"  ? "#3a6fc4" : "#fff").style("color", m === "bar"  ? "#fff" : "#333");
    sliderG.style("display", m === "line" ? "none" : null);
    hideTooltip();
    if (m === "line") renderLine();
    if (m === "bar")  renderBar();
  }
  btnLine.on("click", () => setMode("line"));
  btnBar .on("click", () => setMode("bar"));

  // ── Footer ────────────────────────────────────────────────────────────────
  svg.append("text").attr("x", margin.left).attr("y", H - 16)
    .style("font-size", "10.5px").style("font-weight", "bold").style("fill", "#333").text("Data source: ");
  svg.append("text").attr("x", margin.left + 80).attr("y", H - 16)
    .style("font-size", "10.5px").style("fill", "#333")
    .text("IHME (2012) – processed by Our World in Data");
  svg.append("text").attr("x", W - 10).attr("y", H - 16)
    .style("font-size", "10px").style("fill", "#aaa").style("text-anchor", "end")
    .text("OurWorldInData.org/smoking | CC BY");

  setMode("line");
  return container.node();
}


function _d3(require){return(
require("d3@7")
)}

function _rawData(FileAttachment){return(
FileAttachment("number-of-total-daily-smokers.csv").csv({ typed: true })
)}

export default function define(runtime, observer) {
  const main = runtime.module();
  function toString() { return this.url; }
  const fileAttachments = new Map([
    ["number-of-total-daily-smokers.csv", {url: new URL("./files/9f877aef5a69619c7cafca80942c7ded99a2e439268efacfeb6c308610ebd6a0ca5cc4239df167173d85ef684db00aa1fce7a16d3486101ae7ce8c7ae9550c4b.csv", import.meta.url), mimeType: "text/csv", toString}]
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], _1);
  main.variable(observer()).define(["rawData","d3"], _2);
  main.variable(observer("d3")).define("d3", ["require"], _d3);
  main.variable(observer("rawData")).define("rawData", ["FileAttachment"], _rawData);
  return main;
}
