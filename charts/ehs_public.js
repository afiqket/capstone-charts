function _1(md){return(
md`# EHS - Public`
)}

function _2(dataAR,dataYoY,dataMoM,d3,html,invalidation)
{
  // ── PARSE ────────────────────────────────────────────────
  const parseRows = (rows) =>
    rows.map(d => ({ date: new Date(d.date), value: +d.value }))
        .sort((a, b) => a.date - b.date)

  const datasets = {
    "Home Sales Annualized Rate": parseRows(dataAR),
    "Year-Over-Year Change (%)":  parseRows(dataYoY),
    "Month-Over-Month Change (%)":parseRows(dataMoM),
  }

  // ── STATE ────────────────────────────────────────────────
  let metric  = "Home Sales Annualized Rate"
  let startIdx = 0
  let endIdx   = 0  // set after we know data length

  // ── HELPERS ──────────────────────────────────────────────
  const fmtSlider  = d3.timeFormat("%-m/%-d/%Y")
  const isPercent  = m => m.includes("%")
  const lineColor  = "#9b1c1c"

  // ── LAYOUT ───────────────────────────────────────────────
  const W = 860, H = 460
  const m = { top: 30, right: 110, bottom: 50, left: 72 }
  const iW = W - m.left - m.right
  const iH = H - m.top  - m.bottom

  const svgEl = d3.create("svg").attr("width", W).attr("height", H)
    .style("font-family","sans-serif")

  // ── TOOLTIP ──────────────────────────────────────────────
  const tip = d3.select("body").append("div")
    .style("position","fixed").style("background","white")
    .style("border","1px solid #ccc").style("border-radius","4px")
    .style("padding","8px 12px").style("font-size","12px")
    .style("pointer-events","none").style("display","none")
    .style("box-shadow","2px 2px 6px rgba(0,0,0,0.2)")
    .style("line-height","1.8")

  // ── SLIDER LABELS ────────────────────────────────────────
  const sliderLabel1 = html`<span style="font-size:12px;color:#333;min-width:70px"></span>`
  const sliderLabel2 = html`<span style="font-size:12px;color:#333;min-width:70px;text-align:right"></span>`
  const slider1 = html`<input type="range" min="0" max="100" value="0" step="1" style="width:180px">`
  const slider2 = html`<input type="range" min="0" max="100" value="100" step="1" style="width:180px">`

  function updateSliders() {
    const pts = datasets[metric]
    const max = pts.length - 1
    slider1.max = max
    slider2.max = max
    slider1.value = startIdx = 0
    slider2.value = endIdx   = max
    sliderLabel1.textContent = fmtSlider(pts[0].date)
    sliderLabel2.textContent = fmtSlider(pts[max].date)
  }

  slider1.addEventListener("input", e => {
    const pts = datasets[metric]
    startIdx = Math.min(+e.target.value, endIdx - 1)
    slider1.value = startIdx
    sliderLabel1.textContent = fmtSlider(pts[startIdx].date)
    draw()
  })
  slider2.addEventListener("input", e => {
    const pts = datasets[metric]
    endIdx = Math.max(+e.target.value, startIdx + 1)
    slider2.value = endIdx
    sliderLabel2.textContent = fmtSlider(pts[endIdx].date)
    draw()
  })

  const sliderRow = html`<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
    ${sliderLabel1}${slider1}${slider2}${sliderLabel2}
  </div>`

  // ── DROPDOWNS ────────────────────────────────────────────
  function makeSelect(label, options, onChange) {
    const wrap = html`<div style="display:flex;flex-direction:column;gap:3px;font-size:13px"></div>`
    wrap.append(html`<label style="font-weight:600;color:#333">${label}</label>`)
    const sel = html`<select style="padding:5px 8px;border:1px solid #bbb;
      border-radius:3px;font-size:13px;min-width:220px">
      ${options.map(o => `<option>${o}</option>`).join("")}
    </select>`
    if (onChange) sel.addEventListener("change", e => { onChange(e.target.value); draw() })
    wrap.append(sel)
    return wrap
  }

  const ctrlRow = html`<div style="display:flex;gap:24px;flex-wrap:wrap;margin-bottom:4px"></div>`
  ctrlRow.append(
    makeSelect("Metrics", Object.keys(datasets), v => {
      metric = v
      updateSliders()
    }),
    makeSelect("Region Name",          ["National"]),
    makeSelect("Seasonally Adjusted",  ["True","False"])
  )

  // ── DRAW ─────────────────────────────────────────────────
  function draw() {
    svgEl.selectAll("*").remove()

    const pts     = datasets[metric]
    const visible = pts.slice(startIdx, endIdx + 1)
    if (visible.length < 2) return

    const pct = isPercent(metric)

    const xScale = d3.scaleTime()
      .domain(d3.extent(visible, d => d.date))
      .range([0, iW])

    const yMin = d3.min(visible, d => d.value)
    const yMax = d3.max(visible, d => d.value)
    const yPad = (yMax - yMin) * 0.1 || 1

    const yScale = d3.scaleLinear()
      .domain([pct ? yMin - yPad : 0, yMax + yPad])
      .range([iH, 0])

    const g = svgEl.append("g").attr("transform",`translate(${m.left},${m.top})`)

    // Zero line for percent charts
    if (pct && yMin < 0 && yMax > 0) {
      g.append("line")
        .attr("x1",0).attr("x2",iW)
        .attr("y1", yScale(0)).attr("y2", yScale(0))
        .attr("stroke","#999").attr("stroke-width",1)
    }

    // Gridlines
    g.append("g").selectAll("line")
      .data(yScale.ticks(6)).join("line")
      .attr("x1",0).attr("x2",iW)
      .attr("y1", d => yScale(d)).attr("y2", d => yScale(d))
      .attr("stroke","#e8e8e8").attr("stroke-width",1)

    // Area fill for percent charts (positive = light red, negative = light blue)
    if (pct) {
      const areaPos = d3.area()
        .x(d => xScale(d.date))
        .y0(yScale(0))
        .y1(d => yScale(Math.max(0, d.value)))
        .curve(d3.curveCatmullRom)

      const areaNeg = d3.area()
        .x(d => xScale(d.date))
        .y0(yScale(0))
        .y1(d => yScale(Math.min(0, d.value)))
        .curve(d3.curveCatmullRom)

      g.append("path").datum(visible).attr("d", areaPos)
        .attr("fill","#f5b8b8").attr("opacity",0.5)
      g.append("path").datum(visible).attr("d", areaNeg)
        .attr("fill","#b8d4f5").attr("opacity",0.5)
    }

    // Line
    const line = d3.line()
      .x(d => xScale(d.date))
      .y(d => yScale(d.value))
      .curve(d3.curveCatmullRom)

    g.append("path").datum(visible)
      .attr("fill","none").attr("stroke", lineColor)
      .attr("stroke-width", 1.8).attr("d", line)

    // End-point dot + label
    const last = visible[visible.length - 1]
    g.append("circle")
      .attr("cx", xScale(last.date)).attr("cy", yScale(last.value))
      .attr("r", 4).attr("fill", lineColor)

    const lastLabel = pct
      ? `${last.value.toFixed(1)}%`
      : d3.format(",")(Math.round(last.value))
    g.append("text")
      .attr("x", xScale(last.date) + 6)
      .attr("y", yScale(last.value) + 4)
      .attr("font-size",13).attr("font-weight","600").attr("fill", lineColor)
      .text(lastLabel)

    // Hover overlay
    g.append("rect").attr("width",iW).attr("height",iH)
      .attr("fill","transparent")
      .on("mousemove", function(event) {
        const x0 = xScale.invert(d3.pointer(event)[0])
        const bi = d3.bisector(d => d.date).left
        const i  = bi(visible, x0)
        const d0 = visible[Math.max(0, i-1)]
        const d1 = visible[Math.min(i, visible.length-1)]
        const d  = !d0 || (d1 && Math.abs(d1.date-x0) < Math.abs(d0.date-x0)) ? d1 : d0
        if (!d) return

        g.selectAll(".hline,.hdot").remove()
        g.append("line").attr("class","hline")
          .attr("x1", xScale(d.date)).attr("x2", xScale(d.date))
          .attr("y1",0).attr("y2",iH)
          .attr("stroke", lineColor).attr("stroke-width",1).attr("stroke-dasharray","4,3")
        g.append("circle").attr("class","hdot")
          .attr("cx", xScale(d.date)).attr("cy", yScale(d.value))
          .attr("r",5).attr("fill", lineColor).attr("stroke","white").attr("stroke-width",2)

        const valStr = pct
          ? `${d.value.toFixed(1)}%`
          : d3.format(",")(Math.round(d.value))
        tip.style("display","block")
          .style("left",(event.clientX+14)+"px")
          .style("top",(event.clientY-10)+"px")
          .html(`<strong>National</strong><br>
            <span style="color:#555">Month:</span> ${d3.timeFormat("%b %Y")(d.date)}<br>
            <span style="color:#555">Value:</span> <strong>${valStr}</strong>`)
      })
      .on("mouseleave", () => {
        g.selectAll(".hline,.hdot").remove()
        tip.style("display","none")
      })

    // X axis
    g.append("g").attr("transform",`translate(0,${iH})`)
      .call(d3.axisBottom(xScale).ticks(d3.timeYear.every(2)).tickFormat(d3.timeFormat("%Y")))
      .call(ax => ax.select(".domain").attr("stroke","#aaa"))
      .call(ax => ax.selectAll(".tick line").attr("stroke","#aaa"))

    // Y axis
    const yFmt = pct
      ? d => `${d.toFixed(0)}%`
      : d => `${d3.format(".0f")(d/1e6)}M`

    g.append("g")
      .call(d3.axisLeft(yScale).ticks(6).tickFormat(yFmt))
      .call(ax => ax.select(".domain").remove())
      .call(ax => ax.selectAll(".tick line").remove())

    // Y label
    const yLabel = pct ? metric : "Existing Home Sales Annualized Rate"
    g.append("text").attr("transform","rotate(-90)")
      .attr("x",-iH/2).attr("y",-58)
      .attr("text-anchor","middle").attr("font-size",11).attr("fill","#555")
      .text(yLabel)
  }

  // ── ROOT ─────────────────────────────────────────────────
  const monthLabel = html`<div style="font-size:13px;font-weight:600;color:#333;margin-bottom:2px">Month</div>`
  const legend = html`<div style="display:flex;align-items:center;gap:8px;font-size:13px;margin-bottom:8px">
    <span style="width:16px;height:16px;background:${lineColor};display:inline-block"></span>
    <span style="color:#333;font-weight:500">National</span>
  </div>`
  const note = html`<p style="font-size:13px;color:#555;margin:8px 0 6px;max-width:700px">
    The numbers displayed represent sales of existing homes, including single-family homes,
    condominiums, townhomes, and 2-4 multifamily homes.</p>`

  const root = html`<div style="font-family:sans-serif;max-width:${W}px">
    <h2 style="font-size:22px;font-weight:700;margin-bottom:12px">Redfin's Existing Home Sales</h2>
  </div>`

  updateSliders()
  draw()

  root.append(monthLabel, sliderRow, ctrlRow, note, legend, svgEl.node())
  root.append(html`<p style="font-size:12px;color:#888;margin-top:10px">Source: Redfin Analysis of MLS Data</p>`)

  invalidation.then(() => tip.remove())
  return root
}


function _d3(require){return(
require("d3@7")
)}

function _dataAR(FileAttachment){return(
FileAttachment("homes_sold.csv").csv({ typed: true })
)}

function _dataYoY(FileAttachment){return(
FileAttachment("homes_yoy.csv").csv({ typed: true })
)}

function _dataMoM(FileAttachment){return(
FileAttachment("homes_mom.csv").csv({ typed: true })
)}

export default function define(runtime, observer) {
  const main = runtime.module();
  function toString() { return this.url; }
  const fileAttachments = new Map([
    ["homes_sold.csv", {url: new URL("./files/efdce4bb52b7590ae0698db9cbb8bd7c5b1f8aaf82e986f6773cdd8485548d72ea719856a0e08d649b3aac6bf3f4a7a4d1002e6584bbe68cbb81573a08917419.csv", import.meta.url), mimeType: "text/csv", toString}],
    ["homes_mom.csv", {url: new URL("./files/1839bc9f85d5fccee0e93a7c8d3f8942ca3a995acf09f127404fc2ef1df0fdfad7f9312d99d79977573fea13aa17575be568ca6b8c777e4ebdaf5e7883124453.csv", import.meta.url), mimeType: "text/csv", toString}],
    ["homes_yoy.csv", {url: new URL("./files/4b05560e786692af6481f09a15f0028c7596b62bf71dab075b0ce4aefbcb812493458ea6dbebf324ef61a8a59001ddb4550796048c836176d21e7a5a81d32c5d.csv", import.meta.url), mimeType: "text/csv", toString}]
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], _1);
  main.variable(observer()).define(["dataAR","dataYoY","dataMoM","d3","html","invalidation"], _2);
  main.variable(observer("d3")).define("d3", ["require"], _d3);
  main.variable(observer("dataAR")).define("dataAR", ["FileAttachment"], _dataAR);
  main.variable(observer("dataYoY")).define("dataYoY", ["FileAttachment"], _dataYoY);
  main.variable(observer("dataMoM")).define("dataMoM", ["FileAttachment"], _dataMoM);
  return main;
}
