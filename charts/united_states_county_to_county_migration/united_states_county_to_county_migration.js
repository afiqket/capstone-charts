function _1(md){return(
md`# United States County-to-county Migration`
)}

function _2(md){return(
md`## People moving in and out of between 2009-2013`
)}

function _3(htl){return(
htl.html`<div style="display:inline-block; font-family: Arial, sans-serif; padding:12px 14px 10px 14px;">
  <div style="display:flex; width:370px; height:15px; overflow:hidden;">
    <div style="flex:1; background:#1f3b78;"></div>
    <div style="flex:1; background:#2f5f9d;"></div>
    <div style="flex:1; background:#3f84b8;"></div>
    <div style="flex:1; background:#71b0b2;"></div>
    <div style="flex:1; background:#a8c9b2;"></div>
    <div style="flex:1; background:#cdddb7;"></div>
    <div style="flex:1; background:#e7e7b3;"></div>
    <div style="flex:1; background:#e8c761;"></div>
    <div style="flex:1; background:#ee9b34;"></div>
    <div style="flex:1; background:#f06d2f;"></div>
    <div style="flex:1; background:#f03d24;"></div>
    <div style="flex:1; background:#b3002d;"></div>
  </div>

  <div style="display:flex; justify-content:space-between; width:370px; margin-top:6px; color:#3a4858; font-size:14px; line-height:1;">
    <span>Net gain</span>
    <span>Net loss</span>
  </div>
</div>`
)}

async function _chart(FileAttachment,d3)
{
  const data = await FileAttachment("counties.json").json();

  const width = 1000;
  const height = 650;

  const container = d3.create("div")
    .style("position", "relative")
    .style("width", "100%");

  const svg = d3.create("svg")
    .attr("viewBox", [0, 0, width, height])
    .style("max-width", "100%")
    .style("height", "auto")
    .style("display", "block")
    .style("cursor", "grab");

  container.append(() => svg.node());

  const tooltip = container.append("div")
    .style("position", "absolute")
    .style("pointer-events", "none")
    .style("opacity", 0)
    .style("background", "rgba(255,255,255,0.96)")
    .style("border", "1px solid #333")
    .style("border-radius", "4px")
    .style("padding", "6px 8px")
    .style("font", "12px sans-serif")
    .style("color", "#111")
    .style("box-shadow", "0 2px 8px rgba(0,0,0,0.15)")
    .style("white-space", "nowrap");

  const features = data.features;

  const projection = d3.geoAlbersUsa()
    .fitSize([width, height], data);

  const path = d3.geoPath(projection);

  svg.append("rect")
    .attr("width", width)
    .attr("height", height)
    .attr("fill", "white");

  const zoomLayer = svg.append("g");
  const countyLayer = zoomLayer.append("g");
  const flowLayer = zoomLayer.append("g")
    .attr("pointer-events", "none");

  const gainColors = [
    "#1f3b78",
    "#2f5f9d",
    "#3f84b8",
    "#71b0b2",
    "#a8c9b2",
    "#cdddb7"
  ];

  const lossColors = [
    "#e7e7b3",
    "#e8c761",
    "#ee9b34",
    "#f06d2f",
    "#f03d24",
    "#b3002d"
  ];

  function makeArc(sourceXY, targetXY) {
    const [x1, y1] = sourceXY;
    const [x2, y2] = targetXY;

    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2;

    const dx = x2 - x1;
    const dy = y2 - y1;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;

    const offset = Math.max(20, dist * 0.18);
    const nx = -dy / dist;
    const ny = dx / dist;

    const cx = mx + nx * offset;
    const cy = my + ny * offset;

    return `M${x1},${y1} Q${cx},${cy} ${x2},${y2}`;
  }

  function showTooltip(event, d) {
    tooltip
      .style("opacity", 1)
      .text(d.properties.name);
    moveTooltip(event);
  }

  function moveTooltip(event) {
    const [x, y] = d3.pointer(event, container.node());
    const tooltipNode = tooltip.node();
    const tooltipWidth = tooltipNode.offsetWidth || 0;
    const tooltipHeight = tooltipNode.offsetHeight || 0;

    let left = x + 12;
    let top = y + 12;

    if (left + tooltipWidth > width) left = x - tooltipWidth - 12;
    if (top + tooltipHeight > height) top = y - tooltipHeight - 12;

    tooltip
      .style("left", `${left}px`)
      .style("top", `${top}px`);
  }

  function hideTooltip() {
    tooltip.style("opacity", 0);
  }

  function drawFlows(selectedCounty) {
    const flows = selectedCounty.properties.flows || {};

    const arcs = Object.entries(flows)
      .map(([targetId, value]) => {
        const target = features[+targetId];
        if (!target) return null;

        const s = selectedCounty.properties.centroid;
        const t = target.properties.centroid;

        const sourceXY = projection([s[0], s[1]]);
        const targetXY = projection([t[0], t[1]]);

        if (!sourceXY || !targetXY) return null;

        return {
          source: selectedCounty,
          target,
          value: +value,
          absValue: Math.abs(+value),
          sourceXY,
          targetXY
        };
      })
      .filter(d => d && d.absValue > 0);

    flowLayer.selectAll("*").remove();

    if (!arcs.length) return;

    const gainArcs = arcs.filter(d => d.value > 0);
    const lossArcs = arcs.filter(d => d.value < 0);

    const gainScale = d3.scaleQuantile()
      .domain(gainArcs.map(d => d.absValue))
      .range(gainColors);

    const lossScale = d3.scaleQuantile()
      .domain(lossArcs.map(d => d.absValue))
      .range(lossColors);

    flowLayer.selectAll("path")
      .data(arcs)
      .join("path")
      .attr("d", d => makeArc(d.sourceXY, d.targetXY))
      .attr("fill", "none")
      .attr("stroke", d => {
        if (d.value > 0) return gainScale(d.absValue);
        return lossScale(d.absValue);
      })
      .attr("stroke-width", 1)
      .attr("stroke-opacity", 0.8)
      .attr("stroke-linecap", "round");
  }

  countyLayer.selectAll("path")
    .data(features)
    .join("path")
    .attr("d", path)
    .attr("fill", "#d9d9d9")
    .attr("stroke", "#222")
    .attr("stroke-width", 0.35)
    .style("cursor", "pointer")
    .on("mouseenter", showTooltip)
    .on("mousemove", moveTooltip)
    .on("mouseleave", hideTooltip)
    .on("click", function(event, d) {
      countyLayer.selectAll("path")
        .attr("fill", "#d9d9d9");

      d3.select(this).attr("fill", "#f2c94c");
      drawFlows(d);
    });

  const zoom = d3.zoom()
    .scaleExtent([1, 8])
    .on("start", () => svg.style("cursor", "grabbing"))
    .on("end", () => svg.style("cursor", "grab"))
    .on("zoom", event => {
      zoomLayer.attr("transform", event.transform);
      flowLayer.selectAll("path").attr("stroke-width", 1 / event.transform.k);
      countyLayer.selectAll("path").attr("stroke-width", 0.35 / event.transform.k);
    });

  svg.call(zoom);

  return container.node();
}


function _5(md){return(
md`Data Source: [US Census Bureau](http://www.census.gov/)

Original from [deck.gl Examples](https://deck.gl/examples/arc-layer)`
)}

export default function define(runtime, observer) {
  const main = runtime.module();
  function toString() { return this.url; }
  const fileAttachments = new Map([
    ["counties.json", {url: new URL("./files/dac4ba99547aa823c17b10eb70f8eb3a166c87a09b299cd645aae6459b6ecb0781701fe1cf6d4c0cb94d53d3e550f199c180f9da202814eef73ddf83984d5776.json", import.meta.url), mimeType: "application/json", toString}]
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], _1);
  main.variable(observer()).define(["md"], _2);
  main.variable(observer()).define(["htl"], _3);
  main.variable(observer("chart")).define("chart", ["FileAttachment","d3"], _chart);
  main.variable(observer()).define(["md"], _5);
  return main;
}
