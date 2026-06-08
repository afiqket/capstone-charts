function _1(md){return(
md`# Which regions walk the least?
`
)}

async function _2(FileAttachment)
{
  const d3 = await import("https://cdn.jsdelivr.net/npm/d3@7/+esm");
  const XLSX = await import("https://cdn.sheetjs.com/xlsx-0.20.3/package/xlsx.mjs");

  const file = await FileAttachment("Which regions walk the least_.xlsx").arrayBuffer();
  const workbook = XLSX.read(file);

  const walkRows = XLSX.utils.sheet_to_json(workbook.Sheets["Sheet1"], { defval: null });
  const hexRows = XLSX.utils.sheet_to_json(workbook.Sheets["Sheet2"], { defval: null });

  const year = "Walk three times a week 2022";

  const walkByName = new Map(
    walkRows.map(d => [d.Name, +d[year]])
  );

  const features = hexRows
    .filter(d => {
      const value = walkByName.get(d.Name);
      return d.Geometry && walkByName.has(d.Name) && value != null && value > 0;
    })
    .map(d => ({
      type: "Feature",
      properties: {
        name: d.Name,
        region: d.Region,
        value: walkByName.get(d.Name)
      },
      geometry: JSON.parse(d.Geometry)
    }));
  
  const width = 900;
  const height = 720;

  const color = d3.scaleLinear()
    .domain([30, 45, 60])
    .range(["#4f9b2f", "#ffffff", "#c0007a"])
    .clamp(true);

  const geojson = { type: "FeatureCollection", features };

  const projection = d3.geoIdentity()
    .reflectY(true)
    .fitExtent([[120, 220], [width - 120, height - 60]], geojson);

  const path = d3.geoPath(projection);

  const container = d3.create("div")
    .style("position", "relative")
    .style("width", `${width}px`)
    .style("font-family", "sans-serif");

  const tooltip = container.append("div")
    .style("position", "absolute")
    .style("pointer-events", "none")
    .style("background", "white")
    .style("border", "1px solid #ccc")
    .style("border-radius", "6px")
    .style("padding", "8px 10px")
    .style("font-size", "13px")
    .style("box-shadow", "0 2px 8px rgba(0,0,0,0.2)")
    .style("opacity", 0);

  const svg = container.append("svg")
    .attr("width", width)
    .attr("height", height)
    .style("background", "#1f6518");

  svg.append("text")
    .attr("x", 30)
    .attr("y", 65)
    .attr("fill", "white")
    .attr("font-size", 48)
    .attr("font-weight", 800)
    .text("Which regions walk the least?");

  svg.append("text")
    .attr("x", 32)
    .attr("y", 105)
    .attr("fill", "white")
    .attr("font-size", 24)
    .text("Percent of people walking for 10 minutes three times a week");

  const legend = svg.append("g")
    .attr("transform", "translate(280,145)");

  const defs = svg.append("defs");

  const gradient = defs.append("linearGradient")
    .attr("id", "walk-gradient")
    .attr("x1", "0%")
    .attr("x2", "100%");

  gradient.append("stop").attr("offset", "0%").attr("stop-color", "#4f9b2f");
  gradient.append("stop").attr("offset", "50%").attr("stop-color", "#ffffff");
  gradient.append("stop").attr("offset", "100%").attr("stop-color", "#c0007a");

  legend.append("rect")
    .attr("width", 330)
    .attr("height", 18)
    .attr("fill", "url(#walk-gradient)")
    .attr("rx", 3);

  legend.selectAll("text")
    .data([
      { x: 0, label: "30%" },
      { x: 165, label: "45%" },
      { x: 330, label: "60%" }
    ])
    .join("text")
    .attr("x", d => d.x)
    .attr("y", 42)
    .attr("text-anchor", "middle")
    .attr("fill", "white")
    .attr("font-size", 24)
    .attr("font-weight", 700)
    .text(d => d.label);

  svg.append("g")
    .selectAll("path")
    .data(features)
    .join("path")
    .attr("d", path)
    .attr("fill", d => color(d.properties.value))
    .on("mousemove", (event, d) => {
      tooltip
        .style("opacity", 1)
        .style("left", `${event.offsetX + 15}px`)
        .style("top", `${event.offsetY - 20}px`)
        .html(`
          <b>${d.properties.name}</b><br>
          Walk three times a week<br>
          2022:<br>
          ${d.properties.value.toFixed(1)}%
        `);
    })
    .on("mouseleave", () => tooltip.style("opacity", 0));

  svg.append("text")
    .attr("x", 30)
    .attr("y", height - 25)
    .attr("fill", "white")
    .attr("font-size", 15)
    .text("Source: Office for National Statistics, Simple maps, Gov.uk");

  return container.node();
}


function _3(md){return(
md`Original by @JosephWitcombe on [Flourish](https://flourish.studio/examples/?q=Least+walking+region)`
)}

export default function define(runtime, observer) {
  const main = runtime.module();
  function toString() { return this.url; }
  const fileAttachments = new Map([
    ["Which regions walk the least_.xlsx", {url: new URL("./files/2fcf69ef941ee5ea2f39be369045dd75289eec530d8c01feeb4833907e09d0265e0e2663f14c9db4a0805e7c7532d2dcaaeb350ff56092ef57dc5c474b30bf00.xlsx", import.meta.url), mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", toString}]
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], _1);
  main.variable(observer()).define(["FileAttachment"], _2);
  main.variable(observer()).define(["md"], _3);
  return main;
}
