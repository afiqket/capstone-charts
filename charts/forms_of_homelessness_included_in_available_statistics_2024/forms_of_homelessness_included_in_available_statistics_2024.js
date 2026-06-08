function _1(md){return(
md`# Forms of homelessness included in available statistics, 2024`
)}

function _d3(require){return(
require("d3@7", "d3-geo-projection@4")
)}

function _topojson(require){return(
require("topojson-client@3")
)}

async function _homelessnessMap(FileAttachment,d3,topojson,html)
{
  // 1. Load Data
  const csvData = await FileAttachment("forms-of-homelessness-included-in-available-statistics.csv").csv();
  const world = await d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json");
  const countries = topojson.feature(world, world.objects.countries);

  // 2. Build a lookup map using the Country Name as the key for better compatibility
  const dataMap = new Map(csvData.map(d => [d.Entity, d]));

  // 3. Setup Dimensions & Robinson Projection
  const width = 960;
  const height = 500;
  const projection = d3.geoRobinson().fitSize([width, height], countries);
  const path = d3.geoPath(projection);

  // 4. Color Palette (Matched exactly to your PNG)
  const categories = [
    "No accommodation",
    "Temporary and crisis accommodation",
    "Severely inadequate accommodation",
    "None or temporary",
    "None or inadequate",
    "Temporary or inadequate",
    "None, temporary or inadequate",
    "Not enough information"
  ];

  const colors = [
    "#00847e", // Teal
    "#4c6a9c", // Muted Blue
    "#8c4566", // Plum
    "#b13507", // Deep Orange
    "#e56e5a", // Coral
    "#c05050", // Soft Red
    "#3c4e66", // Navy
    "#6d6e71"  // Gray
  ];

  const colorScale = d3.scaleOrdinal()
    .domain(categories)
    .range(colors)
    .unknown("#e0e0e0");

  // 5. Create UI Container
  const container = html`<div style="font-family: 'Playfair Display', serif; background: white; padding: 20px; border: 1px solid #ddd; max-width: 1000px;">
    <h2 style="margin: 0 0 10px 0; font-size: 24px; color: #333;">Forms of homelessness included in available statistics</h2>
    <p style="margin: 0 0 20px 0; font-size: 14px; color: #666; line-height: 1.4;">
      Categories of homelessness covered in the available data source, such as official government data, news reports, or information from non-governmental organizations.
    </p>
    <div id="map-holder" style="position: relative;"></div>
    <div id="tooltip" style="position: absolute; pointer-events: none; background: white; border: 1px solid #333; padding: 8px; font-size: 13px; display: none; box-shadow: 2px 2px 5px rgba(0,0,0,0.1); z-index: 10;"></div>
  </div>`;

  const svg = d3.select(container).select("#map-holder").append("svg")
    .attr("viewBox", [0, 0, width, height])
    .style("width", "100%")
    .style("height", "auto");

  const tooltip = d3.select(container).select("#tooltip");

  // 6. Draw Map with Improved Data Matching
  svg.append("g")
    .selectAll("path")
    .data(countries.features)
    .join("path")
      .attr("d", path)
      .attr("fill", d => {
        // Try matching by the name property (most reliable for this TopoJSON)
        const entry = dataMap.get(d.properties.name);
        return entry ? colorScale(entry["IGH Framework Category"]) : "#e0e0e0";
      })
      .attr("stroke", "#fff")
      .attr("stroke-width", 0.5)
      .on("mousemove", (event, d) => {
        const entry = dataMap.get(d.properties.name);
        d3.select(event.currentTarget).attr("stroke", "#000").attr("stroke-width", 1);
        
        tooltip.style("display", "block")
          .style("left", (event.offsetX + 15) + "px")
          .style("top", (event.offsetY + 15) + "px")
          .html(`<strong>${d.properties.name}</strong><br/>
                 ${entry ? `<span style="color:${colorScale(entry["IGH Framework Category"])}">●</span> ${entry["IGH Framework Category"]}` : "No data available"}`);
      })
      .on("mouseleave", (event) => {
        d3.select(event.currentTarget).attr("stroke", "#fff").attr("stroke-width", 0.5);
        tooltip.style("display", "none");
      });

  // 7. Legend (Flex Row for clean bottom look)
  const legend = d3.select(container).append("div")
    .style("display", "flex")
    .style("flex-wrap", "wrap")
    .style("gap", "15px")
    .style("margin-top", "20px")
    .style("border-top", "1px solid #eee")
    .style("padding-top", "15px");

  categories.forEach(cat => {
    const item = legend.append("div").style("display", "flex").style("align-items", "center").style("gap", "6px");
    item.append("div").style("width", "12px").style("height", "12px").style("background", colorScale(cat));
    item.append("span").style("font-size", "11px").style("color", "#555").text(cat);
  });

  return container;
}


export default function define(runtime, observer) {
  const main = runtime.module();
  function toString() { return this.url; }
  const fileAttachments = new Map([
    ["forms-of-homelessness-included-in-available-statistics.csv", {url: new URL("./files/c61a0ecc4ab0f9ca6ca9351ef3616c38f21c3aeeaa4ccfc1d6207790eee711b7775358172894187f3584b182e17831b6691d8df57b0b4f2fb502428e8b793009.csv", import.meta.url), mimeType: "text/csv", toString}]
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], _1);
  main.variable(observer("d3")).define("d3", ["require"], _d3);
  main.variable(observer("topojson")).define("topojson", ["require"], _topojson);
  main.variable(observer("viewof homelessnessMap")).define("viewof homelessnessMap", ["FileAttachment","d3","topojson","html"], _homelessnessMap);
  main.variable(observer("homelessnessMap")).define("homelessnessMap", ["Generators", "viewof homelessnessMap"], (G, _) => G.input(_));
  return main;
}
