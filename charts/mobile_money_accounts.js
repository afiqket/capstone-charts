function _1(md){return(
md`# Mobile Money Accounts`
)}

function _2(d3,stackOrder,pivotData)
{
  // ── Config ────────────────────────────────────────────────────────────────
  const W = 900, H = 560;
  const margin = { top: 60, right: 200, bottom: 110, left: 110 };
  const w = W - margin.left - margin.right;
  const h = H - margin.top - margin.bottom;

  // Colores por región (orden de abajo a arriba = stackOrder)
  const color = d3.scaleOrdinal()
    .domain(stackOrder)
    .range([
      "#4e79a7",  // Sub-Saharan Africa — azul
      "#c0392b",  // East Asia and Pacific — rojo oscuro
      "#8db87e",  // South Asia — verde
      "#d4845a",  // Latin America — naranja/salmón
      "#c9a96e",  // Europe and Central Asia — beige/dorado
      "#c9728a",  // Middle East and North Africa — rosa
    ]);

  // ── Estado ────────────────────────────────────────────────────────────────
  let startYear = 2010;
  const minYear = 2010, maxYear = 2024;
  let playing = false, playInterval = null;

  // ── Stack ─────────────────────────────────────────────────────────────────
  const stack = d3.stack().keys(stackOrder).order(d3.stackOrderNone).offset(d3.stackOffsetNone);

  // ── Container ─────────────────────────────────────────────────────────────
  const container = d3.create("div")
    .style("position", "relative")
    .style("font-family", "sans-serif")
    .style("user-select", "none");

  // ── SVG ───────────────────────────────────────────────────────────────────
  const svg = container.append("svg")
    .attr("viewBox", `0 0 ${W} ${H}`)
    .attr("width", W).attr("height", H)
    .style("background", "#fff");

  // Título
  svg.append("text")
    .attr("x", margin.left).attr("y", 22)
    .style("font-size", "20px").style("font-weight", "bold").style("fill", "#111")
    .text("Active mobile money accounts");

  svg.append("foreignObject")
    .attr("x", margin.left).attr("y", 30)
    .attr("width", W - margin.left - 20).attr("height", 28)
    .append("xhtml:div")
      .style("font-size", "11.5px").style("color", "#555").style("line-height", "1.3")
      .text("Mobile money accounts are financial accounts managed via mobile devices. They offer services like deposits, transfers, and payments, mainly in regions with limited banking access.");

  // ── Grupo principal ───────────────────────────────────────────────────────
  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
  const gridG    = g.append("g");
  const areaG    = g.append("g");
  const axisXG   = g.append("g").attr("transform", `translate(0,${h})`);
  const axisYG   = g.append("g");
  const overlayG = g.append("g");

  // ── Escalas ───────────────────────────────────────────────────────────────
  const xScale = d3.scaleLinear().range([0, w]);
  const yScale = d3.scaleLinear().range([h, 0]);

  // ── Tooltip ───────────────────────────────────────────────────────────────
  const vLine = overlayG.append("line")
    .attr("y1", 0).attr("y2", h)
    .attr("stroke", "#aaa").attr("stroke-width", 1)
    .style("display", "none");

  // Puntos hover (uno por región)
  const hoverDots = stackOrder.map(region =>
    overlayG.append("circle").attr("r", 5)
      .attr("fill", color(region)).attr("stroke", "white").attr("stroke-width", 2)
      .style("display", "none")
  );

  // Caja tooltip
  const ttG = svg.append("g").style("display", "none");
  const ttBg = ttG.append("rect").attr("rx", 6)
    .attr("fill", "white").attr("stroke", "#ddd").attr("stroke-width", 1)
    .attr("filter", "drop-shadow(0 2px 4px rgba(0,0,0,0.12))");
  const ttYear = ttG.append("text").attr("x", 14).attr("y", 24)
    .style("font-size", "15px").style("font-weight", "bold").style("fill", "#111");
  const ttSub = ttG.append("text").attr("x", 14).attr("y", 40)
    .style("font-size", "11px").style("fill", "#888");

  // Filas del tooltip (6 regiones + total)
  const ttRows = [...stackOrder].reverse().concat(["__total__"]).map((region, i) => {
    const isTotal = region === "__total__";
    const row = ttG.append("g").attr("transform", `translate(0,${56 + i * 20})`);
    if (!isTotal) {
      row.append("rect").attr("x", 14).attr("y", -10).attr("width", 12).attr("height", 12)
        .attr("rx", 2).attr("fill", color(region));
    }
    const label = row.append("text").attr("x", isTotal ? 14 : 32).attr("y", 0)
      .style("font-size", "12px").style("fill", isTotal ? "#111" : "#333");
    const val = row.append("text").attr("y", 0)
      .style("font-size", "12px").style("text-anchor", "end");
    if (isTotal) {
      label.style("font-weight", "bold");
      val.style("font-weight", "bold");
    }
    return { g: row, label, val, region, isTotal };
  });

  // ── Format helpers ────────────────────────────────────────────────────────
  const fmtY = v => {
    if (v >= 1e9) return `${d3.format(".1f")(v / 1e9)} billion`;
    if (v >= 1e6) return `${d3.format(".0f")(v / 1e6)} million`;
    return d3.format(",.0f")(v);
  };

  const fmtTT = v => {
    if (v >= 1e9) return `${d3.format(".2f")(v / 1e9)} billion`;
    if (v >= 1e6) return `${d3.format(".2f")(v / 1e6)} million`;
    return d3.format(",.0f")(v);
  };

  // ── Leyenda inline (derecha) ───────────────────────────────────────────────
  // Se dibuja una vez, posiciones ajustadas al renderizar
  const legendItems = [...stackOrder].reverse().map((region, i) => {
    const lg = svg.append("g");
    lg.append("line")
      .attr("x1", 0).attr("x2", 8).attr("y1", 0).attr("y2", 0)
      .attr("stroke", color(region)).attr("stroke-width", 2);
    const txt = lg.append("text")
      .attr("x", 12).attr("dy", "0.35em")
      .style("font-size", "11.5px").style("fill", color(region)).style("font-weight", "600")
      .text(region);
    return { g: lg, region, txt };
  });

  // ── Render principal ──────────────────────────────────────────────────────
  function render() {
    const filtered = pivotData.filter(d => d.year >= startYear);
    const stacked  = stack(filtered);

    xScale.domain([startYear, maxYear]);

    const maxVal = d3.max(stacked[stacked.length - 1], d => d[1]);
    yScale.domain([0, maxVal * 1.08]).nice();

    // Grid
    const yTicks = yScale.ticks(6);
    gridG.selectAll("line").data(yTicks).join("line")
      .attr("x1", 0).attr("x2", w)
      .attr("y1", d => yScale(d)).attr("y2", d => yScale(d))
      .attr("stroke", "#e8e8e8").attr("stroke-dasharray", "4,3");

    // Eje Y
    axisYG.call(
      d3.axisLeft(yScale).ticks(6).tickFormat(fmtY)
    )
    .call(ax => ax.select(".domain").remove())
    .call(ax => ax.selectAll("line").remove())
    .selectAll("text").style("font-size", "12px").style("fill", "#555");

    // Eje X
    const xTicks = d3.ticks(startYear, maxYear, Math.min(maxYear - startYear, 8)).map(Math.round);
    axisXG.call(
      d3.axisBottom(xScale).tickValues(xTicks).tickFormat(d3.format("d"))
    )
    .call(ax => ax.select(".domain").attr("stroke", "#ccc"))
    .call(ax => ax.selectAll("line").attr("stroke", "#ccc"))
    .selectAll("text").style("font-size", "12px").style("fill", "#555");

    // Áreas apiladas
    const areaGen = d3.area()
      .x(d => xScale(d.data.year))
      .y0(d => yScale(d[0]))
      .y1(d => yScale(d[1]))
      .curve(d3.curveCatmullRom.alpha(0.5));

    areaG.selectAll("path").data(stacked).join("path")
      .attr("fill", d => color(d.key))
      .attr("opacity", 0.88)
      .attr("d", areaGen);

    // Leyenda inline: posicionar al final de cada área
    const lastRow = stacked[0][stacked[0].length - 1]; // referencia para x
    const legendX = margin.left + xScale(maxYear) + 14;

    legendItems.forEach(({ g: lg, region }) => {
      const ser = stacked.find(s => s.key === region);
      if (!ser) return;
      const last = ser[ser.length - 1];
      const midY = margin.top + yScale((last[0] + last[1]) / 2);
      lg.attr("transform", `translate(${legendX}, ${midY})`);
    });
  }

  // ── Tooltip lógica ────────────────────────────────────────────────────────
  const bisect = d3.bisector(d => d.year).left;

  const mouseRect = g.append("rect")
    .attr("width", w).attr("height", h)
    .attr("fill", "none").attr("pointer-events", "all");

  mouseRect
    .on("mousemove", function(event) {
      const [mx] = d3.pointer(event, g.node());
      const year = Math.round(xScale.invert(mx));
      if (year < startYear || year > maxYear) return hideTooltip();

      vLine.style("display", null).attr("x1", xScale(year)).attr("x2", xScale(year));

      const row = pivotData.find(d => d.year === year);
      if (!row) return;

      // Calcular posiciones apiladas para los puntos
      const stacked = stack(pivotData.filter(d => d.year >= startYear));
      stackOrder.forEach((region, si) => {
        const ser = stacked.find(s => s.key === region);
        if (!ser) { hoverDots[si].style("display", "none"); return; }
        const pt = ser.find(d => d.data.year === year);
        if (!pt) { hoverDots[si].style("display", "none"); return; }
        const cy = yScale((pt[0] + pt[1]) / 2);
        hoverDots[si].style("display", null)
          .attr("cx", xScale(year)).attr("cy", cy);
      });

      // Tooltip contenido
      ttYear.text(year);
      ttSub.text("in active accounts");

      const regionsReversed = [...stackOrder].reverse();
      let total = 0;
      const ttW = 340;

      regionsReversed.forEach((region, i) => {
        const v = row[region] || 0;
        total += v;
        ttRows[i].label.text(region)
          .style("font-weight", region === "East Asia and Pacific" ? "bold" : "normal");
        ttRows[i].val.attr("x", ttW - 14).text(fmtTT(v))
          .style("fill", "#333").style("font-weight", region === "East Asia and Pacific" ? "bold" : "normal");
      });
      // Fila total
      const totalRow = ttRows[ttRows.length - 1];
      totalRow.label.text("Total");
      totalRow.val.attr("x", ttW - 14).text(fmtTT(total)).style("fill", "#111");

      const ttH = 56 + (stackOrder.length + 1) * 20 + 10;
      ttBg.attr("width", ttW).attr("height", ttH);
      ttG.style("display", null);

      const px = margin.left + xScale(year);
      const tx = px + ttW + 20 > W ? px - ttW - 12 : px + 12;
      ttG.attr("transform", `translate(${tx}, ${margin.top + 10})`);
    })
    .on("mouseleave", hideTooltip);

  function hideTooltip() {
    ttG.style("display", "none");
    vLine.style("display", "none");
    hoverDots.forEach(d => d.style("display", "none"));
  }

  // ── Slider ────────────────────────────────────────────────────────────────
  const sliderY = H - 62;
  const sliderX = margin.left;
  const sliderW = W - margin.left - margin.right + 150;

  const sliderG = svg.append("g").attr("transform", `translate(${sliderX}, ${sliderY})`);

  sliderG.append("line")
    .attr("x1", 0).attr("x2", sliderW).attr("y1", 0).attr("y2", 0)
    .attr("stroke", "#ddd").attr("stroke-width", 4).attr("stroke-linecap", "round");

  const activeTrack = sliderG.append("line")
    .attr("y1", 0).attr("y2", 0)
    .attr("stroke", "#3a6fc4").attr("stroke-width", 4).attr("stroke-linecap", "round");

  const sliderScale = d3.scaleLinear()
    .domain([minYear, maxYear]).range([0, sliderW]).clamp(true);

  const startLabel = sliderG.append("text")
    .attr("y", 22).style("font-size", "12px").style("fill", "#555").style("text-anchor", "middle");

  sliderG.append("text")
    .attr("x", sliderW).attr("y", 22)
    .style("font-size", "12px").style("fill", "#555").style("text-anchor", "middle")
    .text(maxYear);

  const handle = sliderG.append("circle").attr("r", 9)
    .attr("fill", "#555").attr("stroke", "#fff").attr("stroke-width", 2)
    .style("cursor", "ew-resize");

  const playBtn = sliderG.append("g")
    .attr("transform", `translate(-36, 0)`).style("cursor", "pointer");
  playBtn.append("circle").attr("r", 14).attr("fill", "#555");
  const playIcon = playBtn.append("text")
    .attr("text-anchor", "middle").attr("dy", "0.35em")
    .style("font-size", "14px").style("fill", "#fff").text("▶");

  function updateSlider() {
    const x = sliderScale(startYear);
    handle.attr("cx", x);
    startLabel.attr("x", x).text(startYear);
    activeTrack.attr("x1", x).attr("x2", sliderW);
  }

  function stopPlay() {
    playing = false; clearInterval(playInterval); playIcon.text("▶");
  }

  handle.call(d3.drag().on("drag", function(event) {
    stopPlay();
    startYear = Math.max(minYear, Math.min(maxYear - 1, Math.round(sliderScale.invert(event.x))));
    updateSlider(); render();
  }));

  sliderG.append("rect")
    .attr("x", 0).attr("y", -10).attr("width", sliderW).attr("height", 20)
    .attr("fill", "none").attr("pointer-events", "all").style("cursor", "ew-resize")
    .on("click", function(event) {
      stopPlay();
      const [mx] = d3.pointer(event);
      startYear = Math.max(minYear, Math.min(maxYear - 1, Math.round(sliderScale.invert(mx))));
      updateSlider(); render();
    });

  playBtn.on("click", () => {
    if (playing) { stopPlay(); } else {
      playing = true; playIcon.text("⏸");
      if (startYear >= maxYear - 1) startYear = minYear;
      playInterval = setInterval(() => {
        startYear = Math.min(startYear + 1, maxYear - 1);
        updateSlider(); render();
        if (startYear >= maxYear - 1) stopPlay();
      }, 200);
    }
  });

  // ── Pie ───────────────────────────────────────────────────────────────────
  svg.append("text").attr("x", margin.left).attr("y", H - 24)
    .style("font-size", "10.5px").style("font-weight", "bold").style("fill", "#333")
    .text("Data source: ");
  svg.append("text").attr("x", margin.left + 80).attr("y", H - 24)
    .style("font-size", "10.5px").style("fill", "#333")
    .text("GSM Association (2025) – with minor processing by Our World in Data");
  svg.append("text").attr("x", margin.left).attr("y", H - 10)
    .style("font-size", "10px").style("fill", "#888")
    .text("Note: Accounts are considered active when used to perform at least one mobile money payment in the last 90 days of each year. North America not shown.");

  // ── Init ──────────────────────────────────────────────────────────────────
  updateSlider();
  render();

  return container.node();
}


function _d3(require){return(
require("d3@7")
)}

function _rawData(FileAttachment){return(
FileAttachment("active-mobile-money-accounts.csv").csv({typed: true})
)}

function _stackOrder(){return(
[
  "Sub-Saharan Africa",
  "East Asia and Pacific",
  "South Asia",
  "Latin America and the Caribbean",
  "Europe and Central Asia",
  "Middle East and North Africa"
]
)}

function _years(rawData){return(
[...new Set(rawData.map(d => d.Year))].sort()
)}

function _pivotData(years,stackOrder,rawData){return(
years.map(year => {
  const row = { year }
  stackOrder.forEach(region => {
    const match = rawData.find(d => d.Year === year && d.Entity === region)
    row[region] = match ? match["Active mobile money accounts"] : 0
  })
  return row
})
)}

export default function define(runtime, observer) {
  const main = runtime.module();
  function toString() { return this.url; }
  const fileAttachments = new Map([
    ["active-mobile-money-accounts.csv", {url: new URL("./files/2c7592d9a17176b60dcf0bf63bca5260150e83819ac69b354d5eb9a845bee7becce958843b5e1f4699394705f9fabafcb059cafadc4e5b8230ab5ad938dc581c.csv", import.meta.url), mimeType: "text/csv", toString}]
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], _1);
  main.variable(observer()).define(["d3","stackOrder","pivotData"], _2);
  main.variable(observer("d3")).define("d3", ["require"], _d3);
  main.variable(observer("rawData")).define("rawData", ["FileAttachment"], _rawData);
  main.variable(observer("stackOrder")).define("stackOrder", _stackOrder);
  main.variable(observer("years")).define("years", ["rawData"], _years);
  main.variable(observer("pivotData")).define("pivotData", ["years","stackOrder","rawData"], _pivotData);
  return main;
}
