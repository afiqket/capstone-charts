function _1(md){return(
md`# Homicide Rates`
)}

function _2(data,d3,html,invalidation)
{
  // ── DATA PREP ────────────────────────────────────────────
  // Two series: "South America" (left axis, red) and "Afghanistan" (right axis, blue)
  // The "Estimate" dropdown maps to a country/subregion in our data
  const estimateOptions = [...new Set(data.map(d => d.Country))].sort()
  const countryOptions  = [...new Set(data.map(d => d.Country))].sort()

  // State
  let selectedCountry  = "Afghanistan"
  let selectedEstimate = "South America"

  // ── DIMENSIONS ───────────────────────────────────────────
  const W  = 740, H = 420
  const ml = { top: 30, right: 80, bottom: 60, left: 80 }
  const iW = W  - ml.left - ml.right
  const iH = H  - ml.top  - ml.bottom

  const svgEl = d3.create("svg").attr("width", W).attr("height", H)
    .style("font-family", "sans-serif")

  // ── TOOLTIP ──────────────────────────────────────────────
  const tip = d3.select("body").append("div")
    .style("position","fixed").style("background","white")
    .style("border","1px solid #ccc").style("border-radius","4px")
    .style("padding","8px 12px").style("font-size","12px")
    .style("pointer-events","none").style("display","none")
    .style("box-shadow","2px 2px 6px rgba(0,0,0,0.2)")
    .style("line-height","1.8")

  // ── DRAW ─────────────────────────────────────────────────
  function draw() {
    svgEl.selectAll("*").remove()
    const g = svgEl.append("g").attr("transform", `translate(${ml.left},${ml.top})`)

    // Series 1: Estimate (left axis, red)
    const s1 = data
      .filter(d => d.Country === selectedEstimate && d.Indicator === "Homicide rate")
      .sort((a,b) => a.Year - b.Year)

    // Series 2: Country (right axis, blue)
    const s2 = data
      .filter(d => d.Country === selectedCountry && d.Indicator === "Homicide rate")
      .sort((a,b) => a.Year - b.Year)

    const allYears = d3.range(1990, 2019)
    const xScale = d3.scalePoint().domain(allYears).range([0, iW]).padding(0)

    // Left Y scale (red — estimate)
    const y1Max = d3.max(s1, d => d.Value) || 1
    const y1Min = d3.min(s1, d => d.Value) || 0
    const y1Pad = (y1Max - y1Min) * 0.15
    const yLeft = d3.scaleLinear()
      .domain([Math.max(0, y1Min - y1Pad), y1Max + y1Pad])
      .range([iH, 0])

    // Right Y scale (blue — country)
    const y2Max = d3.max(s2, d => d.Value) || 1
    const y2Min = d3.min(s2, d => d.Value) || 0
    const y2Pad = (y2Max - y2Min) * 0.15
    const yRight = d3.scaleLinear()
      .domain([Math.max(0, y2Min - y2Pad), y2Max + y2Pad])
      .range([iH, 0])

    // Gridlines (vertical, light)
    g.append("g").selectAll("line.vgrid")
      .data(allYears).join("line")
      .attr("x1", d => xScale(d)).attr("x2", d => xScale(d))
      .attr("y1", 0).attr("y2", iH)
      .attr("stroke", "#e8e8e8").attr("stroke-width", 1)

    // Horizontal gridlines
    g.append("g").selectAll("line.hgrid")
      .data(yLeft.ticks(5)).join("line")
      .attr("x1", 0).attr("x2", iW)
      .attr("y1", d => yLeft(d)).attr("y2", d => yLeft(d))
      .attr("stroke", "#e8e8e8").attr("stroke-width", 1)

    // ── SERIES 1 (red, left axis) ─────────────────────────
    if (s1.length > 1) {
      const line1 = d3.line()
        .x(d => xScale(d.Year))
        .y(d => yLeft(d.Value))
        .defined(d => d.Value != null)
        .curve(d3.curveMonotoneX)

      g.append("path").datum(s1)
        .attr("fill","none").attr("stroke","#c0392b")
        .attr("stroke-width", 2).attr("d", line1)

      // Dots
      g.selectAll(".dot1").data(s1).join("circle").attr("class","dot1")
        .attr("cx", d => xScale(d.Year)).attr("cy", d => yLeft(d.Value))
        .attr("r", 3.5).attr("fill","#c0392b")
        .on("mousemove", function(event, d) {
          tip.style("display","block")
            .style("left",(event.clientX+14)+"px")
            .style("top",(event.clientY-10)+"px")
            .html(`<strong>${selectedEstimate}</strong><br>
              Year: ${d.Year}<br>Rate: <strong>${d.Value}</strong>`)
        })
        .on("mouseleave", () => tip.style("display","none"))

      // End label
      const last1 = s1[s1.length - 1]
      g.append("text")
        .attr("x", xScale(last1.Year) + 6).attr("y", yLeft(last1.Value))
        .attr("dominant-baseline","middle").attr("font-size",11)
        .attr("font-weight","600").attr("fill","#c0392b")
        .text(selectedEstimate)
    }

    // ── SERIES 2 (blue, right axis) ───────────────────────
    if (s2.length > 1) {
      const line2 = d3.line()
        .x(d => xScale(d.Year))
        .y(d => yRight(d.Value))
        .defined(d => d.Value != null)
        .curve(d3.curveMonotoneX)

      g.append("path").datum(s2)
        .attr("fill","none").attr("stroke","#2980b9")
        .attr("stroke-width", 2).attr("d", line2)

      g.selectAll(".dot2").data(s2).join("circle").attr("class","dot2")
        .attr("cx", d => xScale(d.Year)).attr("cy", d => yRight(d.Value))
        .attr("r", 3.5).attr("fill","#2980b9")
        .on("mousemove", function(event, d) {
          tip.style("display","block")
            .style("left",(event.clientX+14)+"px")
            .style("top",(event.clientY-10)+"px")
            .html(`<strong>${selectedCountry}</strong><br>
              Year: ${d.Year}<br>Rate: <strong>${d.Value}</strong>`)
        })
        .on("mouseleave", () => tip.style("display","none"))

      // End label
      const last2 = s2[s2.length - 1]
      g.append("text")
        .attr("x", xScale(last2.Year) + 6).attr("y", yRight(last2.Value))
        .attr("dominant-baseline","middle").attr("font-size",11)
        .attr("font-weight","600").attr("fill","#2980b9")
        .text(selectedCountry)
    }

    // ── LEFT Y AXIS (red) ─────────────────────────────────
    const yAxisLeft = d3.axisLeft(yLeft).ticks(5).tickFormat(d3.format(".1f"))
    g.append("g").call(yAxisLeft)
      .call(ax => ax.select(".domain").remove())
      .call(ax => ax.selectAll(".tick line").remove())
      .call(ax => ax.selectAll("text").attr("fill","#c0392b").attr("font-weight","600"))

    svgEl.append("text")
      .attr("transform","rotate(-90)")
      .attr("x", -(ml.top + iH/2)).attr("y", 14)
      .attr("text-anchor","middle").attr("font-size",11)
      .attr("fill","#c0392b").attr("font-weight","600")
      .text("Homicide rate per 100,000 population")

    // ── RIGHT Y AXIS (blue) ───────────────────────────────
    if (s2.length) {
      const yAxisRight = d3.axisRight(yRight).ticks(5).tickFormat(d3.format(".1f"))
      g.append("g").attr("transform",`translate(${iW},0)`)
        .call(yAxisRight)
        .call(ax => ax.select(".domain").remove())
        .call(ax => ax.selectAll(".tick line").remove())
        .call(ax => ax.selectAll("text").attr("fill","#2980b9").attr("font-weight","600"))

      svgEl.append("text")
        .attr("transform","rotate(90)")
        .attr("x", ml.top + iH/2).attr("y", -(W - ml.right + 14))
        .attr("text-anchor","middle").attr("font-size",11)
        .attr("fill","#2980b9").attr("font-weight","600")
        .text("Country homicide victims rate per 100,000 population")
    }

    // ── X AXIS ────────────────────────────────────────────
    g.append("g").attr("transform",`translate(0,${iH})`)
      .call(d3.axisBottom(xScale)
        .tickValues(allYears)
        .tickFormat(d3.format("d")))
      .call(ax => ax.select(".domain").attr("stroke","#aaa"))
      .call(ax => ax.selectAll(".tick line").remove())
      .selectAll("text")
        .attr("transform","rotate(-90)")
        .attr("text-anchor","end")
        .attr("dx","-0.5em").attr("dy","-0.4em")
        .attr("font-size",10)
  }

  // ── DATA TABLE ───────────────────────────────────────────
  function makeTable() {
    const allCountries = [...new Set(data.map(d => d.Country))].sort()
    const years = d3.range(1990, 2019)

    const tableWrap = html`<div style="overflow-x:auto;margin-top:20px;font-family:sans-serif;font-size:12px"></div>`
    const table = html`<table style="border-collapse:collapse;white-space:nowrap"></table>`

    // Header
    const thead = html`<thead></thead>`
    const hrow  = html`<tr style="background:#f5f5f5"></tr>`
    ;["Region","Subregion","Country","Indicator",...years].forEach(h => {
      hrow.append(html`<th style="border:1px solid #ddd;padding:4px 8px;text-align:left;
        font-weight:600">${h}</th>`)
    })
    thead.append(hrow)
    table.append(thead)

    // Body
    const tbody = html`<tbody></tbody>`
    allCountries.forEach(country => {
      const countryData = data.filter(d => d.Country === country)
      const region    = countryData[0]?.Region    || ""
      const subregion = countryData[0]?.Subregion || ""

      ;["Homicide rate","Homicide count"].forEach(ind => {
        const row = html`<tr></tr>`
        ;[region, subregion, country, ind].forEach((v,i) => {
          row.append(html`<td style="border:1px solid #ddd;padding:3px 8px;
            font-weight:${i===1?'700':'400'}">${v}</td>`)
        })
        years.forEach(yr => {
          const pt = data.find(d => d.Country===country && d.Year===yr && d.Indicator===ind)
          const val = pt ? (ind === "Homicide count"
            ? d3.format(",")(pt.Value)
            : pt.Value) : ""
          row.append(html`<td style="border:1px solid #ddd;padding:3px 8px;
            text-align:right">${val}</td>`)
        })
        tbody.append(row)
      })
    })
    table.append(tbody)
    tableWrap.append(table)
    return tableWrap
  }

  // ── CONTROLS ─────────────────────────────────────────────
  function makeSelect(label, options, current, color, onChange) {
    const wrap = html`<div style="font-family:sans-serif;font-size:13px;margin-bottom:10px"></div>`
    wrap.append(html`<div style="font-weight:700;color:${color};margin-bottom:4px">${label}</div>`)
    const sel = html`<select style="padding:5px 8px;border:1px solid #bbb;border-radius:3px;
      font-size:13px;min-width:160px">
      ${options.map(o => `<option ${o===current?"selected":""}>${o}</option>`).join("")}
    </select>`
    sel.addEventListener("change", e => { onChange(e.target.value); draw() })
    wrap.append(sel)
    return wrap
  }

  const sidebar = html`<div style="padding-left:20px;padding-top:30px;min-width:180px"></div>`
  sidebar.append(
    makeSelect("Select Country",  countryOptions,  selectedCountry,  "#2980b9", v => selectedCountry  = v),
    makeSelect("Select Estimate", estimateOptions, selectedEstimate, "#c0392b", v => selectedEstimate = v)
  )

  draw()

  // ── ROOT ─────────────────────────────────────────────────
  const chartRow = html`<div style="display:flex;align-items:flex-start"></div>`
  chartRow.append(svgEl.node(), sidebar)

  const root = html`<div style="font-family:sans-serif;max-width:960px">
    <h3 style="font-size:16px;font-weight:700;margin-bottom:12px">
      Victims of intentional homicide, 1990-2018</h3>
  </div>`
  root.append(chartRow)

  // Table section
  root.append(html`<h3 style="font-size:15px;font-weight:700;margin:24px 0 8px">
    Victims of intentional homicide, counts and rates per 100,000 population</h3>`)
  root.append(makeTable())

  root.append(html`<p style="font-size:11px;color:#666;margin-top:12px;max-width:700px">
    <strong>* Source:</strong> Data are collected from national authorities through the annual United Nations
    Crime Trends Survey (UN-CTS). Estimate based on UNODC homicide statistics.</p>`)

  invalidation.then(() => tip.remove())
  return root
}


function _d3(require){return(
require("d3@7")
)}

function _data(FileAttachment){return(
FileAttachment("homicide_data.csv").csv({ typed: true })
)}

export default function define(runtime, observer) {
  const main = runtime.module();
  function toString() { return this.url; }
  const fileAttachments = new Map([
    ["homicide_data.csv", {url: new URL("./files/090b0489b61dfeb9db12c5c045ceef55cc22c9f8db9e3908a6dfcd3e60b68518866a951ca103e0b71dc0c96a8839a4a6f4ddbe5903a432066cd77ab4fc7d97ce.csv", import.meta.url), mimeType: "text/csv", toString}]
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], _1);
  main.variable(observer()).define(["data","d3","html","invalidation"], _2);
  main.variable(observer("d3")).define("d3", ["require"], _d3);
  main.variable(observer("data")).define("data", ["FileAttachment"], _data);
  return main;
}
