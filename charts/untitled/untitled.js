function _1(d3,series)
{
  // ── Config ────────────────────────────────────────────────────────────────
  const W = 900, H = 560;
  const margin = { top: 60, right: 150, bottom: 110, left: 100 };
  const w = W - margin.left - margin.right;
  const h = H - margin.top - margin.bottom;

  const color = d3.scaleOrdinal()
    .domain(["Memory", "Flash", "Disk", "Solid state"])
    .range(["#3a6fc4", "#c0392b", "#8B6914", "#2a9d5c"]);

  const BAR_COLOR = "#6b8cbf";

  // ── Estado ────────────────────────────────────────────────────────────────
  let mode = "line";
  let startYear = 1956;
  let endYear = 2023;
  const minYear = 1956;
  const maxYear = 2023;
  let playing = false;
  let playInterval = null;

  // ── Scales base ───────────────────────────────────────────────────────────
  const allPoints = series.flatMap(s => s.values);

  const xScaleFull = d3.scaleLinear()
    .domain([minYear, maxYear])
    .range([0, w]);

  const yScale = d3.scaleLog()
    .domain([
      d3.min(allPoints, d => d.value) * 0.5,
      d3.max(allPoints, d => d.value) * 3
    ])
    .range([h, 0])
    .nice();

  // ── Container principal ───────────────────────────────────────────────────
  const container = d3.create("div")
    .style("position", "relative")
    .style("font-family", "sans-serif")
    .style("user-select", "none");

  // Botones Line / Bar
  const btnRow = container.append("div")
    .style("display", "flex").style("gap", "6px")
    .style("margin-bottom", "6px").style("margin-left", `${margin.left}px`);

  const btnLine = btnRow.append("button").text("📈 Line")
    .style("padding", "4px 14px").style("border", "1px solid #ccc")
    .style("border-radius", "4px").style("cursor", "pointer")
    .style("font-size", "13px").style("background", "#3a6fc4").style("color", "#fff");

  const btnBar = btnRow.append("button").text("📊 Bar")
    .style("padding", "4px 14px").style("border", "1px solid #ccc")
    .style("border-radius", "4px").style("cursor", "pointer")
    .style("font-size", "13px").style("background", "#fff").style("color", "#333");

  // ── SVG ───────────────────────────────────────────────────────────────────
  const svg = container.append("svg")
    .attr("viewBox", `0 0 ${W} ${H}`)
    .attr("width", W).attr("height", H)
    .style("background", "#fff");

  // Título
  const titleEl = svg.append("text")
    .attr("x", margin.left).attr("y", 22)
    .style("font-size", "17px").style("font-weight", "bold").style("fill", "#111");

  svg.append("foreignObject")
    .attr("x", margin.left).attr("y", 28)
    .attr("width", W - margin.left - 20).attr("height", 26)
    .append("xhtml:div")
      .style("font-size", "11px").style("color", "#555").style("line-height", "1.3")
      .text(`"Memory" = RAM, "Disk" = magnetic storage, "Flash" = flash memory, "Solid state" = SSDs. US$/TB adjusted for inflation (constant 2020 US$).`);

  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  const gridG   = g.append("g").attr("class", "grid");
  const axisYG  = g.append("g").attr("class", "axis-y");
  const axisXG  = g.append("g").attr("class", "axis-x").attr("transform", `translate(0,${h})`);
  const contentG = g.append("g").attr("class", "content");
  const overlayG = g.append("g").attr("class", "overlay");

  // ── Slider de años ────────────────────────────────────────────────────────
  const sliderY = H - 62;   // posición Y del slider dentro del SVG
  const sliderX = margin.left;
  const sliderW = W - margin.left - margin.right + 150; // ancho total del slider

  const sliderG = svg.append("g").attr("transform", `translate(${sliderX}, ${sliderY})`);

  // Fondo del track
  sliderG.append("line")
    .attr("x1", 0).attr("x2", sliderW)
    .attr("y1", 0).attr("y2", 0)
    .attr("stroke", "#ddd").attr("stroke-width", 4).attr("stroke-linecap", "round");

  // Track activo (entre startYear y maxYear)
  const activeTrack = sliderG.append("line")
    .attr("y1", 0).attr("y2", 0)
    .attr("stroke", "#3a6fc4").attr("stroke-width", 4).attr("stroke-linecap", "round");

  // Escala del slider
  const sliderScale = d3.scaleLinear()
    .domain([minYear, maxYear])
    .range([0, sliderW])
    .clamp(true);

  // Label año inicio (izquierda)
  const startLabel = sliderG.append("text")
    .attr("y", 22).style("font-size", "12px").style("fill", "#555")
    .style("text-anchor", "middle");

  // Label año fin (derecha)
  sliderG.append("text")
    .attr("x", sliderW).attr("y", 22)
    .style("font-size", "12px").style("fill", "#555")
    .style("text-anchor", "middle")
    .text(maxYear);

  // Handle (thumb) del slider — solo el año de inicio se mueve
  const handle = sliderG.append("circle")
    .attr("r", 9)
    .attr("fill", "#555").attr("stroke", "#fff").attr("stroke-width", 2)
    .style("cursor", "ew-resize");

  // Botón play/pause
  const playBtn = sliderG.append("g")
    .attr("transform", `translate(-36, 0)`)
    .style("cursor", "pointer");

  playBtn.append("circle")
    .attr("r", 14).attr("fill", "#555");

  const playIcon = playBtn.append("text")
    .attr("text-anchor", "middle").attr("dy", "0.35em")
    .style("font-size", "14px").style("fill", "#fff")
    .text("▶");

  // ── Actualizar slider visual ───────────────────────────────────────────────
  function updateSliderVisual() {
    const x = sliderScale(startYear);
    handle.attr("cx", x);
    startLabel.attr("x", x).text(startYear);
    activeTrack.attr("x1", x).attr("x2", sliderW);
  }

  // ── Drag en el handle ─────────────────────────────────────────────────────
  const drag = d3.drag()
    .on("drag", function(event) {
      stopPlay();
      const newYear = Math.round(sliderScale.invert(event.x));
      startYear = Math.max(minYear, Math.min(maxYear - 1, newYear));
      updateSliderVisual();
      redrawContent();
    });

  handle.call(drag);

  // Click en el track también mueve el handle
  sliderG.append("rect")
    .attr("x", 0).attr("y", -10).attr("width", sliderW).attr("height", 20)
    .attr("fill", "none").attr("pointer-events", "all")
    .style("cursor", "ew-resize")
    .on("click", function(event) {
      stopPlay();
      const [mx] = d3.pointer(event);
      const newYear = Math.round(sliderScale.invert(mx));
      startYear = Math.max(minYear, Math.min(maxYear - 1, newYear));
      updateSliderVisual();
      redrawContent();
    });

  // ── Play / Pause ──────────────────────────────────────────────────────────
  function stopPlay() {
    playing = false;
    clearInterval(playInterval);
    playIcon.text("▶");
  }

  playBtn.on("click", () => {
    if (playing) {
      stopPlay();
    } else {
      playing = true;
      playIcon.text("⏸");
      if (startYear >= maxYear - 1) startYear = minYear; // reiniciar si al final
      playInterval = setInterval(() => {
        startYear = Math.min(startYear + 1, maxYear - 1);
        updateSliderVisual();
        redrawContent();
        if (startYear >= maxYear - 1) stopPlay();
      }, 120);
    }
  });

  // ── Pie de gráfica ────────────────────────────────────────────────────────
  svg.append("text")
    .attr("x", margin.left).attr("y", H - 24)
    .style("font-size", "10.5px").style("font-weight", "bold").style("fill", "#333")
    .text("Data source: ");
  svg.append("text")
    .attr("x", margin.left + 80).attr("y", H - 24)
    .style("font-size", "10.5px").style("fill", "#333")
    .text("John C. McCallum (2023); U.S. Bureau of Labor Statistics (2026) – with minor processing by Our World in Data");
  svg.append("text")
    .attr("x", margin.left).attr("y", H - 10)
    .style("font-size", "10px").style("fill", "#aaa")
    .text("OurWorldInData.org/technological-change | CC BY");

  // ── Helpers formato ───────────────────────────────────────────────────────
  const formatShort = d => {
    if (d >= 1e12) return d3.format(".2s")(d / 1e12) + "T $/TB";
    if (d >= 1e9)  return d3.format(".2s")(d / 1e9)  + "B $/TB";
    if (d >= 1e6)  return d3.format(".2s")(d / 1e6)  + "M $/TB";
    if (d >= 1e3)  return d3.format(",.0f")(d / 1e3) + "k $/TB";
    return d3.format(",.0f")(d) + " $/TB";
  };

  const formatY = d => {
    if (d >= 1e12) return `${d3.format(".0s")(d / 1e12).replace("G","B")} trillion $/TB`;
    if (d >= 1e9)  return `${d3.format(".0f")(d / 1e9)} billion $/TB`;
    if (d >= 1e6)  return `${d3.format(".0f")(d / 1e6)} million $/TB`;
    if (d >= 1e3)  return `${d3.format(",.0f")(d / 1e3)}k $/TB`;
    return `${d} $/TB`;
  };

  // ── Tooltip DOM ───────────────────────────────────────────────────────────
  const bisect = d3.bisector(d => d.year).left;

  const vLine = overlayG.append("line")
    .attr("y1", 0).attr("y2", h)
    .attr("stroke", "#888").attr("stroke-width", 1)
    .attr("stroke-dasharray", "4,3")
    .style("display", "none");

  const tooltip = svg.append("g").style("display", "none");
  const ttBg = tooltip.append("rect").attr("rx", 5)
    .attr("fill", "white").attr("stroke", "#ccc").attr("stroke-width", 1);
  const ttYear = tooltip.append("text").attr("x", 10).attr("y", 20)
    .style("font-weight", "bold").style("font-size", "13px").style("fill", "#111");
  const ttSub = tooltip.append("text").attr("x", 10).attr("y", 34)
    .style("font-size", "10px").style("fill", "#888");
  const ttLines = Array.from({length: 4}, (_, i) => {
    const row = tooltip.append("g").attr("transform", `translate(0,${50 + i * 18})`);
    row.append("rect").attr("x", 10).attr("y", -9).attr("width", 10).attr("height", 10).attr("rx", 2);
    const txt = row.append("text").attr("x", 25).attr("y", 0).style("font-size", "12px");
    return { g: row, rect: row.select("rect"), txt };
  });

  const hoverDots = series.map(s =>
    overlayG.append("circle").attr("r", 6)
      .attr("fill", color(s.name)).attr("stroke", "white").attr("stroke-width", 2)
      .style("display", "none")
  );

  function hideTooltip() {
    tooltip.style("display", "none");
    vLine.style("display", "none");
    hoverDots.forEach(d => d.style("display", "none"));
  }

  // ── Render LINE ───────────────────────────────────────────────────────────
  function renderLine() {
    titleEl.text("Historical price of computer memory and storage");

    // Filtrar datos según startYear
    const filtered = series.map(s => ({
      ...s,
      values: s.values.filter(v => v.year >= startYear)
    }));

    const xScale = d3.scaleLinear()
      .domain([startYear, maxYear])
      .range([0, w]);

    // Grid
    const yTicks = [1e15, 1e12, 1e9, 1e6, 1e3, 1];
    gridG.selectAll("line").data(yTicks).join("line")
      .attr("x1", 0).attr("x2", w)
      .attr("y1", d => yScale(d)).attr("y2", d => yScale(d))
      .attr("stroke", "#e8e8e8").attr("stroke-dasharray", "3,3");

    // Eje Y
    axisYG.call(
      d3.axisLeft(yScale).tickValues(yTicks).tickFormat(formatY)
    )
    .call(ax => ax.select(".domain").remove())
    .call(ax => ax.selectAll("line").remove())
    .selectAll("text").style("font-size", "11px").style("fill", "#555");

    axisYG.selectAll(".log-label").data([null]).join("text")
      .attr("class", "log-label")
      .attr("x", -5).attr("y", -10).attr("text-anchor", "end")
      .style("font-size", "11px").style("fill", "#aaa").style("font-style", "italic")
      .text("log axis");

    // Eje X
    const xTicks = d3.ticks(startYear, maxYear, 6).map(Math.round);
    axisXG.call(
      d3.axisBottom(xScale).tickValues(xTicks).tickFormat(d3.format("d"))
    )
    .call(ax => ax.select(".domain").attr("stroke", "#ccc"))
    .call(ax => ax.selectAll("line").attr("stroke", "#ccc"))
    .selectAll("text").style("font-size", "12px").style("fill", "#555");

    // Líneas
    const lineGen = d3.line()
      .x(d => xScale(d.year)).y(d => yScale(d.value)).defined(d => d.value > 0);

    const sGroups = contentG.selectAll(".serie").data(filtered).join("g").attr("class", "serie");

    sGroups.selectAll("path").data(d => [d]).join("path")
      .attr("fill", "none")
      .attr("stroke", d => color(d.name))
      .attr("stroke-width", 2)
      .attr("d", d => lineGen(d.values));

    contentG.selectAll(".serie").each(function(s) {
      d3.select(this).selectAll("circle").data(s.values).join("circle")
        .attr("cx", d => xScale(d.year)).attr("cy", d => yScale(d.value))
        .attr("r", 3).attr("fill", color(s.name));
    });

    // Labels inline
    contentG.selectAll(".end-label").data(filtered.filter(s => s.values.length)).join("text")
      .attr("class", "end-label")
      .attr("x", d => xScale(d.values[d.values.length - 1].year) + 8)
      .attr("y", d => yScale(d.values[d.values.length - 1].value))
      .attr("dy", "0.35em")
      .style("font-size", "12px").style("font-weight", "600")
      .style("fill", d => color(d.name)).text(d => d.name);

    // Mouse events
    mouseRect
      .on("mousemove", function(event) {
        const [mx] = d3.pointer(event, g.node());
        const year = Math.round(xScale.invert(mx));
        if (year < startYear || year > maxYear) return hideTooltip();

        vLine.style("display", null).attr("x1", xScale(year)).attr("x2", xScale(year));

        const rows = series.map((s, si) => {
          const vals = s.values.filter(v => v.year >= startYear);
          const i = bisect(vals, year);
          const d = vals[i] || vals[vals.length - 1];
          if (!d) { hoverDots[si].style("display", "none"); return null; }
          hoverDots[si].style("display", null)
            .attr("cx", xScale(d.year)).attr("cy", yScale(d.value))
            .attr("fill", color(s.name));
          return { name: s.name, value: d.value };
        }).filter(Boolean);

        if (!rows.length) return;

        const ttH = 42 + rows.length * 18 + 8, ttW = 220;
        ttBg.attr("width", ttW).attr("height", ttH);
        ttYear.text(year);
        ttSub.text("constant 2020 US$ per terabyte");
        rows.forEach((r, i) => {
          ttLines[i].g.style("display", null);
          ttLines[i].rect.attr("fill", color(r.name));
          ttLines[i].txt.style("fill", "#222").text(`${r.name}: ${formatShort(r.value)}`);
        });
        for (let i = rows.length; i < 4; i++) ttLines[i].g.style("display", "none");

        tooltip.style("display", null);
        const px = margin.left + xScale(year);
        tooltip.attr("transform", `translate(${px + ttW + 20 > W ? px - ttW - 12 : px + 12}, ${margin.top + 10})`);
      })
      .on("mouseleave", hideTooltip);
  }

  // ── Render BAR ────────────────────────────────────────────────────────────
  function renderBar() {
    titleEl.text(`Historical price of computer memory and storage, ${startYear}–${maxYear}`);
    hideTooltip();

    const barData = series.map(s => {
      const match = s.values.filter(v => v.year >= startYear).slice(-1)[0]
        || s.values[s.values.length - 1];
      return { name: s.name, value: match ? match.value : null };
    }).filter(d => d.value !== null);

    const xBarScale = d3.scaleLinear()
      .domain([0, d3.max(barData, d => d.value) * 1.15]).range([0, w]);
    const yBarScale = d3.scaleBand()
      .domain(barData.map(d => d.name)).range([0, h]).padding(0.35);

    gridG.selectAll("*").remove();

    axisYG.call(d3.axisLeft(yBarScale).tickSize(0))
      .call(ax => ax.select(".domain").remove())
      .selectAll("text").style("font-size", "13px").style("font-weight", "bold")
      .style("fill", "#333").attr("x", -8);

    axisXG.call(
      d3.axisBottom(xBarScale).ticks(5).tickFormat(d => {
        if (d >= 1e9) return d3.format(".1s")(d / 1e9) + "B";
        if (d >= 1e6) return d3.format(".1s")(d / 1e6) + "M";
        if (d >= 1e3) return d3.format(".1s")(d / 1e3) + "k";
        return d;
      })
    )
    .call(ax => ax.select(".domain").attr("stroke", "#ccc"))
    .call(ax => ax.selectAll("line").attr("stroke", "#ccc"))
    .selectAll("text").style("font-size", "11px").style("fill", "#888");

    contentG.selectAll(".serie,.end-label").remove();

    contentG.selectAll(".bar").data(barData).join("rect").attr("class", "bar")
      .attr("x", 0).attr("y", d => yBarScale(d.name))
      .attr("width", d => xBarScale(d.value))
      .attr("height", yBarScale.bandwidth())
      .attr("fill", BAR_COLOR).attr("rx", 2);

    contentG.selectAll(".bar-label").data(barData).join("text").attr("class", "bar-label")
      .attr("x", d => xBarScale(d.value) + 8)
      .attr("y", d => yBarScale(d.name) + yBarScale.bandwidth() / 2)
      .attr("dy", "0.35em").style("font-size", "13px").style("fill", "#333")
      .text(d => formatShort(d.value));

    contentG.selectAll(".bar")
      .on("mousemove", function(event, d) {
        const [mx, my] = d3.pointer(event, svg.node());
        const ttH = 55, ttW = 190;
        ttBg.attr("width", ttW).attr("height", ttH);
        ttYear.text(d.name); ttSub.text(`Most recent year ≥ ${startYear}`);
        ttLines[0].g.style("display", null);
        ttLines[0].rect.attr("fill", BAR_COLOR);
        ttLines[0].txt.style("fill", "#222").text(formatShort(d.value));
        for (let i = 1; i < 4; i++) ttLines[i].g.style("display", "none");
        tooltip.style("display", null);
        tooltip.attr("transform", `translate(${mx + ttW + 20 > W ? mx - ttW - 12 : mx + 12},${my - 20})`);
      })
      .on("mouseleave", hideTooltip);

    mouseRect.on("mousemove", null).on("mouseleave", null);
  }

  // ── Rect invisible para capturar mouse en line mode ───────────────────────
  const mouseRect = g.append("rect")
    .attr("width", w).attr("height", h)
    .attr("fill", "none").attr("pointer-events", "all");

  // ── redrawContent: re-dibuja según modo actual ────────────────────────────
  function redrawContent() {
    contentG.selectAll("*").remove();
    gridG.selectAll("*").remove();
    axisYG.selectAll("*").remove();
    axisXG.selectAll("*").remove();
    hoverDots.forEach(d => d.style("display", "none"));
    mode === "line" ? renderLine() : renderBar();
  }

  // ── Botones Line/Bar ──────────────────────────────────────────────────────
  function setMode(m) {
    mode = m;
    btnLine.style("background", m === "line" ? "#3a6fc4" : "#fff").style("color", m === "line" ? "#fff" : "#333");
    btnBar.style("background",  m === "bar"  ? "#3a6fc4" : "#fff").style("color", m === "bar"  ? "#fff" : "#333");
    redrawContent();
  }

  btnLine.on("click", () => setMode("line"));
  btnBar.on("click",  () => setMode("bar"));

  // ── Init ──────────────────────────────────────────────────────────────────
  updateSliderVisual();
  setMode("line");

  return container.node();
}


function _d3(require){return(
require("d3@7")
)}

function _rawData(FileAttachment){return(
FileAttachment("historical-cost-of-computer-memory-and-storage.csv").csv({typed: true})
)}

function _series(rawData)
{
  const keys = ["Memory", "Flash", "Disk", "Solid state"];
  return keys.map(key => ({
    name: key,
    values: rawData
      .filter(d => d[key] != null && !isNaN(d[key]) && d[key] > 0)
      .map(d => ({ year: d.Year, value: d[key] }))
  }));
}


export default function define(runtime, observer) {
  const main = runtime.module();
  function toString() { return this.url; }
  const fileAttachments = new Map([
    ["historical-cost-of-computer-memory-and-storage.csv", {url: new URL("./files/38df7d46e1744fcd320e148533b158cc30b339e4de6e4eae8b659de03da2e6ea54fb9788cdf8c161e2b28ec384bd8f40dc8dd4006a56f376a03e869c49588cab.csv", import.meta.url), mimeType: "text/csv", toString}]
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["d3","series"], _1);
  main.variable(observer("d3")).define("d3", ["require"], _d3);
  main.variable(observer("rawData")).define("rawData", ["FileAttachment"], _rawData);
  main.variable(observer("series")).define("series", ["rawData"], _series);
  return main;
}
