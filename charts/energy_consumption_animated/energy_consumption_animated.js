function _1(md){return(
md`# Energy Consumption Animated`
)}

function _2(d3,html,data,invalidation)
{
  // ── CONFIG ───────────────────────────────────────────────
  const energyColors = {
    "Coal":                  "#8c8c8c",
    "Crude oil":             "#e8a838",
    "Hydropower":            "#5b9bd5",
    "Natural gas":           "#70c4d4",
    "Nuclear":               "#6abf69",
    "Other renewables":      "#a08c3c",
    "Solar":                 "#e8e838",
    "Traditional biofuels":  "#e87878",
    "Wind":                  "#d45fe8"
  }

  const energyOrder = [
    "Traditional biofuels","Coal","Crude oil","Natural gas",
    "Hydropower","Nuclear","Other renewables","Solar","Wind"
  ]

  // ── CONTROLS STATE ───────────────────────────────────────
  let chartType  = "Stream"   // Stream | Area | Percentage
  let sortMode   = "Alphabetically"  // Alphabetically | By Value | Chronologically
  let sortOrder  = "Ascending"
  let filterType = "(All)"
  let yearRange  = [1800, 2020]

  // ── LAYOUT ───────────────────────────────────────────────
  const width = 820, height = 500
  const margin = { top: 20, right: 20, bottom: 50, left: 70 }
  const iW = width  - margin.left - margin.right
  const iH = height - margin.top  - margin.bottom

  const svgEl = d3.create("svg").attr("width", width).attr("height", height)
    .style("font-family","sans-serif")

  // ── TOOLTIP ──────────────────────────────────────────────
  const tip = d3.select("body").append("div")
    .style("position","fixed").style("background","white")
    .style("border","1px solid #ccc").style("border-radius","4px")
    .style("padding","8px 12px").style("font-size","12px")
    .style("pointer-events","none").style("display","none")
    .style("box-shadow","2px 2px 6px rgba(0,0,0,0.2)")
    .style("line-height","1.8")

  // ── LEGEND ───────────────────────────────────────────────
  const legendDiv = html`<div style="display:flex;flex-direction:column;gap:6px;
    font-size:13px;font-family:sans-serif;padding-left:16px;padding-top:60px"></div>`
  Object.entries(energyColors).forEach(([label, color]) => {
    legendDiv.append(html`<div style="display:flex;align-items:center;gap:0">
      <div style="background:${color};border-radius:12px;padding:4px 10px;
        font-size:12px;font-weight:600;color:#fff;text-align:center;
        min-width:80px;text-shadow:0 1px 2px rgba(0,0,0,0.4)">${label}</div>
    </div>`)
  })

  // ── CONTROLS HTML ────────────────────────────────────────
  function radioGroup(label, options, current, onChange) {
    const wrap = html`<div style="font-size:12px;font-family:sans-serif;margin-right:24px">
      <div style="font-weight:600;margin-bottom:4px;color:#333">${label}</div>
    </div>`
    options.forEach(opt => {
      const row = html`<label style="display:block;margin:2px 0;cursor:pointer">
        <input type="radio" name="${label}" value="${opt}"
          ${opt===current?"checked":""} style="margin-right:4px">
        ${opt}
      </label>`
      row.querySelector("input").addEventListener("change", e => {
        if (e.target.checked) { onChange(opt); draw() }
      })
      wrap.append(row)
    })
    return wrap
  }

  const energyTypes = ["(All)", ...Object.keys(energyColors)]
  const filterWrap = html`<div style="font-size:12px;font-family:sans-serif;margin-right:24px">
    <div style="font-weight:600;margin-bottom:4px;color:#333">Energy Type</div>
    <select style="font-size:12px;padding:3px 6px;min-width:120px">
      ${energyTypes.map(t => `<option>${t}</option>`).join("")}
    </select>
  </div>`
  filterWrap.querySelector("select").addEventListener("change", e => {
    filterType = e.target.value; draw()
  })

  const yearWrap = html`<div style="font-size:12px;font-family:sans-serif;margin-right:24px">
    <div style="font-weight:600;margin-bottom:4px;color:#333">Year</div>
    <div style="display:flex;align-items:center;gap:6px">
      <span>1800</span>
      <input type="range" min="1800" max="2020" step="10" value="2020"
        style="width:120px" id="yearSlider">
      <span id="yearLabel">2020</span>
    </div>
  </div>`
  yearWrap.querySelector("#yearSlider").addEventListener("input", e => {
    yearRange = [1800, +e.target.value]
    yearWrap.querySelector("#yearLabel").textContent = e.target.value
    draw()
  })

  const ctrlRow = html`<div style="display:flex;flex-wrap:wrap;align-items:flex-start;
    padding:10px 0 16px;border-bottom:1px solid #eee;margin-bottom:12px"></div>`
  ctrlRow.append(
    radioGroup("Chart Type", ["Stream","Area","Percentage"], chartType, v => chartType = v),
    radioGroup("Sort", ["Alphabetically","By Value","Chronologically"], sortMode, v => sortMode = v),
    radioGroup("Sort Order", ["Ascending","Descending"], sortOrder, v => sortOrder = v),
    filterWrap,
    yearWrap
  )

  // ── DRAW ─────────────────────────────────────────────────
  function draw() {
    svgEl.selectAll("*").remove()
    const g = svgEl.append("g").attr("transform",`translate(${margin.left},${margin.top})`)

    // Filter data
    let years = [...new Set(data.map(d => d.year))].filter(y => y >= yearRange[0] && y <= yearRange[1]).sort((a,b)=>a-b)
    let types = filterType === "(All)" ? energyOrder : [filterType]

    // Sort types
    if (sortMode === "Alphabetically") {
      types = [...types].sort((a,b) => sortOrder==="Ascending" ? a.localeCompare(b) : b.localeCompare(a))
    } else if (sortMode === "By Value") {
      const totals = {}
      types.forEach(t => {
        totals[t] = d3.sum(data.filter(d => d.energy===t && years.includes(d.year)), d => d.value)
      })
      types = [...types].sort((a,b) => sortOrder==="Ascending" ? totals[a]-totals[b] : totals[b]-totals[a])
    }

    // Pivot data: year → { energy: value }
    const byYear = new Map()
    years.forEach(y => byYear.set(y, { year: y }))
    data.filter(d => years.includes(d.year) && types.includes(d.energy)).forEach(d => {
      byYear.get(d.year)[d.energy] = d.value
    })
    const pivoted = Array.from(byYear.values())

    const xScale = d3.scaleLinear().domain(d3.extent(years)).range([0, iW])

    // Choose stack offset
    const offset = chartType === "Stream"     ? d3.stackOffsetWiggle
                 : chartType === "Percentage" ? d3.stackOffsetExpand
                 : d3.stackOffsetNone

    const stack = d3.stack().keys(types).offset(offset).order(d3.stackOrderNone)
    const series = stack(pivoted)

    const yScale = d3.scaleLinear()
      .domain([d3.min(series, s => d3.min(s, d => d[0])),
               d3.max(series, s => d3.max(s, d => d[1]))])
      .range([iH, 0])

    // Gridlines
    if (chartType !== "Stream") {
      g.append("g").selectAll("line")
        .data(yScale.ticks(6)).join("line")
        .attr("x1",0).attr("x2",iW)
        .attr("y1", d => yScale(d)).attr("y2", d => yScale(d))
        .attr("stroke","#e0e0e0")
    }

    const area = d3.area()
      .x(d => xScale(d.data.year))
      .y0(d => yScale(d[0]))
      .y1(d => yScale(d[1]))
      .curve(d3.curveCatmullRom)

    series.forEach((s, i) => {
      const etype = types[i]
      g.append("path")
        .datum(s)
        .attr("d", area)
        .attr("fill", energyColors[etype] || "#aaa")
        .attr("opacity", 0.85)
        .on("mousemove", function(event) {
          d3.select(this).attr("opacity", 1)
          const x0 = xScale.invert(d3.pointer(event, this)[0])
          const yr  = years.reduce((a,b) => Math.abs(b-x0)<Math.abs(a-x0)?b:a)
          const row = data.find(d => d.energy===etype && d.year===yr)
          const val = row ? d3.format(",")(Math.round(row.value))+" TWh" : "N/A"
          tip.style("display","block")
            .style("left",(event.clientX+14)+"px")
            .style("top",(event.clientY-10)+"px")
            .html(`<strong>${etype}</strong><br>
              <span style="color:#555">Year:</span> ${yr}<br>
              <span style="color:#555">Value:</span> <strong>${val}</strong>`)
        })
        .on("mouseleave", function() {
          d3.select(this).attr("opacity", 0.85)
          tip.style("display","none")
        })
    })

    // X axis
    g.append("g").attr("transform",`translate(0,${iH})`)
      .call(d3.axisBottom(xScale).tickFormat(d3.format("d")).ticks(10))
      .call(ax => ax.select(".domain").attr("stroke","#aaa"))
    g.append("text").attr("x",iW/2).attr("y",iH+40)
      .attr("text-anchor","middle").attr("font-size",13).attr("fill","#444").text("Year")

    // Y axis (not for stream)
    if (chartType !== "Stream") {
      const yFmt = chartType === "Percentage"
        ? d3.format(".0%")
        : d => d>=1000 ? `${Math.round(d/1000)}K` : d
      g.append("g").call(d3.axisLeft(yScale).ticks(6).tickFormat(yFmt))
        .call(ax => ax.select(".domain").remove())
        .call(ax => ax.selectAll(".tick line").remove())
      g.append("text").attr("transform","rotate(-90)")
        .attr("x",-iH/2).attr("y",-55)
        .attr("text-anchor","middle").attr("font-size",13).attr("fill","#444")
        .text("Energy Consumption")
    }
  }

  draw()

  // ── ROOT ─────────────────────────────────────────────────
  const chartRow = html`<div style="display:flex;align-items:flex-start"></div>`
  chartRow.append(svgEl.node(), legendDiv)

  const root = html`<div style="font-family:sans-serif;max-width:1000px">
    <h2 style="font-size:22px;font-weight:700;margin-bottom:4px">
      Global Primary Energy Consumption during 200 Years</h2>
  </div>`
  root.append(ctrlRow, chartRow)

  invalidation.then(() => tip.remove())
  return root
}


function _d3(require){return(
require("d3@7")
)}

function _data(FileAttachment){return(
FileAttachment("energy_tidy.csv").csv({ typed: true })
)}

export default function define(runtime, observer) {
  const main = runtime.module();
  function toString() { return this.url; }
  const fileAttachments = new Map([
    ["energy_tidy.csv", {url: new URL("./files/2688a1d146762959222d28cb0cd8c45cd067959bd3b229887826d1565960a1d59a9ce6347202d21c4c1723d22ca670d9e10acc5d6e34f29bab236b5a7552b037.csv", import.meta.url), mimeType: "text/csv", toString}]
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], _1);
  main.variable(observer()).define(["d3","html","data","invalidation"], _2);
  main.variable(observer("d3")).define("d3", ["require"], _d3);
  main.variable(observer("data")).define("data", ["FileAttachment"], _data);
  return main;
}
