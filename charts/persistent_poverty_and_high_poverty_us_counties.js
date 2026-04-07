function _1(md){return(
md`# Persistent poverty and high poverty U.S. counties`
)}

async function _2(data,html,d3,topojson,invalidation)
{
  const colors = {
    high:       "#6BAED6",
    persistent: "#D4956A",
    both:       "#3A3A3A",
    none:       "#f0f0f0"
  }

  // Build lookup with BOTH padded and unpadded keys to be safe
  const byFips = new Map()
  data.forEach(d => {
    const padded   = String(d.fips).padStart(5, "0")
    const unpadded = String(+d.fips)
    byFips.set(padded,   d)
    byFips.set(unpadded, d)
  })

  // Debug: check a few FIPS values from topology vs data
  console.log("Sample data fips:", data.slice(0,5).map(d => d.fips))

  let countyFilter = "All"

  const radioWrap = html`<div style="font-family:sans-serif;font-size:13px;margin-bottom:10px">
    <strong>Choose counties to view:</strong><br>
  </div>`
  ;["All","Nonmetro","Metro"].forEach(val => {
    const label = html`<label style="display:block;margin:3px 0;cursor:pointer">
      <input type="radio" name="countyFilter" value="${val}" ${val==="All"?"checked":""}
        style="margin-right:6px">
      ${val === "All" ? "(All)" : val}
    </label>`
    label.querySelector("input").addEventListener("change", e => {
      countyFilter = e.target.value
      draw()
    })
    radioWrap.append(label)
  })

  const legendItems = [
    { color: colors.high,       label: "High poverty only" },
    { color: colors.persistent, label: "Persistent poverty only" },
    { color: colors.both,       label: "Both persistent and high poverty" },
  ]
  const legendDiv = html`<div style="font-family:sans-serif;font-size:13px;margin-top:12px"></div>`
  legendItems.forEach(item => {
    const row = html`<div style="display:flex;align-items:center;gap:7px;margin:4px 0">
      <span style="width:14px;height:14px;border-radius:50%;background:${item.color};
        display:inline-block;flex-shrink:0;border:1px solid #aaa"></span>
      <span>${item.label}</span>
    </div>`
    legendDiv.append(row)
  })

  const tooltip = d3.select("body").append("div")
    .style("position","fixed").style("background","white")
    .style("border","1px solid #ccc").style("border-radius","3px")
    .style("padding","8px 12px").style("font-size","12px")
    .style("font-family","sans-serif").style("pointer-events","none")
    .style("display","none").style("box-shadow","2px 2px 6px rgba(0,0,0,0.15)")
    .style("line-height","1.8")

  const width = 820, height = 520
  const svgEl = d3.create("svg").attr("width", width).attr("height", height)
    .style("background","white")

  const sidebar = html`<div style="min-width:180px;padding-top:60px"></div>`
  sidebar.append(radioWrap, legendDiv)

  const container = html`<div style="display:flex;gap:16px;align-items:flex-start"></div>`
  container.append(svgEl.node(), sidebar)

  const us = await d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/counties-10m.json")
  const statesFeature   = topojson.feature(us, us.objects.states)
  const countiesFeature = topojson.feature(us, us.objects.counties)
  const stateMesh = topojson.mesh(us, us.objects.states, (a, b) => a !== b)

  // Debug: log a few topology IDs so we can see what format they use
  console.log("Sample topology IDs:", countiesFeature.features.slice(0,5).map(f => f.id))

  const projection = d3.geoAlbersUsa().scale(1060).translate([width/2, height/2])
  const path = d3.geoPath().projection(projection)

  function draw() {
    svgEl.selectAll("*").remove()

    svgEl.append("g").selectAll("path")
      .data(statesFeature.features)
      .join("path").attr("d", path)
      .attr("fill","#e8e8e8").attr("stroke","none")

    svgEl.append("g").selectAll("path")
      .data(countiesFeature.features)
      .join("path")
      .attr("d", path)
      .attr("fill", d => {
        // Try both padded and numeric string versions
        const padded   = String(d.id).padStart(5, "0")
        const unpadded = String(+d.id)
        const row      = byFips.get(padded) || byFips.get(unpadded)
        if (!row) return colors.none
        if (countyFilter !== "All" && row.metro !== countyFilter) return colors.none
        return colors[row.category] || colors.none
      })
      .attr("stroke","#fff")
      .attr("stroke-width", 0.3)
      .on("mousemove", function(event, d) {
        const padded   = String(d.id).padStart(5, "0")
        const unpadded = String(+d.id)
        const row      = byFips.get(padded) || byFips.get(unpadded)
        if (!row) return
        const catLabel = {
          high:       "High poverty only",
          persistent: "Persistent poverty only",
          both:       "Both persistent and high poverty",
          none:       "Neither"
        }
        d3.select(this).attr("stroke","#333").attr("stroke-width", 1)
        tooltip.style("display","block")
          .style("left",(event.clientX+14)+"px")
          .style("top",(event.clientY-10)+"px")
          .html(`<strong>${row.name}</strong><br>
            <span style="color:#555">Type:</span> ${catLabel[row.category]}<br>
            <span style="color:#555">Metro:</span> ${row.metro}`)
      })
      .on("mouseleave", function() {
        d3.select(this).attr("stroke","#fff").attr("stroke-width", 0.3)
        tooltip.style("display","none")
      })

    svgEl.append("path")
      .datum(stateMesh)
      .attr("d", path)
      .attr("fill","none")
      .attr("stroke","#999")
      .attr("stroke-width", 0.6)
  }

  draw()
  invalidation.then(() => tooltip.remove())
  return container
}


function _d3(require){return(
require("d3@7")
)}

function _topojson(require){return(
require("topojson-client@3")
)}

function _data(FileAttachment){return(
FileAttachment("poverty_counties.csv").csv({ typed: true })
)}

export default function define(runtime, observer) {
  const main = runtime.module();
  function toString() { return this.url; }
  const fileAttachments = new Map([
    ["poverty_counties.csv", {url: new URL("./files/88e3b47f78683d1af0c812fc985bc795c68d6459da8ae1d7aa31a39343bb1fd90681bf3b95eb6c91217a7ef72ceccc04ddc6c2ff4208202c1fb40f67975f4298.csv", import.meta.url), mimeType: "text/csv", toString}]
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], _1);
  main.variable(observer()).define(["data","html","d3","topojson","invalidation"], _2);
  main.variable(observer("d3")).define("d3", ["require"], _d3);
  main.variable(observer("topojson")).define("topojson", ["require"], _topojson);
  main.variable(observer("data")).define("data", ["FileAttachment"], _data);
  return main;
}
