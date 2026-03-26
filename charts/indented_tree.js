function _1(md){return(
md`# Indented tree`
)}

function _chart(d3,data)
{
  const format = d3.format(",");
  const nodeSize = 30;
  const width = 930;

  /*const columns = [
    { label: "Size",  value: d => d.value,              format,                                    x: 280 },
    { label: "Count", value: d => d.children ? 0 : 1,  format: (v, d) => d.children ? format(v) : "-", x: 340 }
  ];*/

  // ── Build hierarchy ──────────────────────
  const root = d3.hierarchy(data)
    .eachBefore((i => d => d.index = i++)(0));

  // ── Collapse helpers ─────────────────────
  root.descendants().forEach((d, i) => {
    d.id = i;
    d._children = d.children;
    // Start with everything collapsed except root
    if (d.depth > 0) d.children = null;
  });

  // ── SVG setup ───────────────────────────
  const svg = d3.create("svg")
    .attr("width", width)
    .attr("style", "max-width:100%; height:auto; font:20px sans-serif; overflow:visible;");

  // Links group
  const gLink = svg.append("g")
    .attr("fill", "none")
    .attr("stroke", "#999");

  // Nodes group
  const gNode = svg.append("g")
    .attr("cursor", "pointer")
    .attr("pointer-events", "all");

  // Column headers (static — drawn once above the nodes)
  //const gHeaders = svg.append("g");

  // ── Update function ──────────────────────
  function update(event, source) {
    const duration = event?.altKey ? 2500 : 250;

    // Re-index visible nodes in order
    root.eachBefore((i => d => d.index = i++)(0));
    const nodes = root.descendants();
    const links = root.links();

    const height = (nodes.length + 1) * nodeSize;

    // Animate SVG height
    svg.transition().duration(duration)
      .attr("height", height)
      .attr("viewBox", [-nodeSize / 2, -nodeSize * 3 / 2, width, height]);

    // ── Column headers ─────────────────────
    /*gHeaders.selectAll("text").remove();
    for (const { label, x } of columns) {
      gHeaders.append("text")
        .attr("dy", "0.32em")
        .attr("y", -nodeSize)
        .attr("x", x)
        .attr("text-anchor", "end")
        .attr("font-weight", "bold")
        .text(label);
    }*/

    // ── Links ──────────────────────────────
    const link = gLink.selectAll("path")
      .data(links, d => d.target.id);

    const linkEnter = link.enter().append("path")
      .attr("d", d => {
        // Start from source's old position
        const sy = (source.oldIndex ?? source.index) * nodeSize;
        return `M${d.source.depth * nodeSize},${sy}V${sy}h${nodeSize}`;
      });

    link.merge(linkEnter).transition().duration(duration)
      .attr("d", d => `
        M${d.source.depth * nodeSize},${d.source.index * nodeSize}
        V${d.target.index * nodeSize}
        h${nodeSize}
      `);

    link.exit().transition().duration(duration).remove()
      .attr("d", d => {
        const ty = source.index * nodeSize;
        return `M${d.source.depth * nodeSize},${ty}V${ty}h${nodeSize}`;
      });

    // ── Nodes ──────────────────────────────
    const node = gNode.selectAll("g")
      .data(nodes, d => d.id);

    const nodeEnter = node.enter().append("g")
      .attr("transform", d => `translate(0,${(source.oldIndex ?? source.index) * nodeSize})`)
      .attr("fill-opacity", 0)
      .attr("stroke-opacity", 0)
      .on("click", (event, d) => {
        d.oldIndex = d.index;  // save position for animation origin
        d.children = d.children ? null : d._children;
        update(event, d);
      });

    // Circle
    nodeEnter.append("circle")
      .attr("cx", d => d.depth * nodeSize)
      .attr("r", 2.5)
      .attr("fill", d => d._children ? "#555" : "#999");

    // Name label
    nodeEnter.append("text")
      .attr("class", "label")
      .attr("dy", "0.32em")
      .attr("x", d => d.depth * nodeSize + 6)
      .text(d => d.data.name);

    // Tooltip title
    nodeEnter.append("title")
      .text(d => d.ancestors().reverse().map(d => d.data.name).join("/"));

    // Column value texts
    /*for (const { value, format, x } of columns) {
      nodeEnter.append("text")
        .attr("class", "col-val")
        .attr("dy", "0.32em")
        .attr("x", x)
        .attr("text-anchor", "end")
        .attr("fill", d => d.children ? null : "#555");
    }*/

    // UPDATE + ENTER merged — animate to new position
    const nodeUpdate = node.merge(nodeEnter);

    nodeUpdate.transition().duration(duration)
      .attr("transform", d => `translate(0,${d.index * nodeSize})`)
      .attr("fill-opacity", 1)
      .attr("stroke-opacity", 1);

    // Update circle fill (changes when collapsed/expanded)
    nodeUpdate.select("circle")
      .attr("fill", d => d._children ? (d.children ? "#555" : "#999") : "#999");

    // Update column values using fresh sum
    /*for (const [i, { value, format, x }] of columns.entries()) {
      const valued = root.copy().sum(value).descendants();
      nodeUpdate.select(`:nth-child(${4 + i})`) // circle=1, label=2, title=3, col vals start at 4
        .data(valued, d => d.id)
        .text(d => format(d.value, d))
        .attr("fill", d => d.children ? null : "#555");
    }*/

    // EXIT — animate collapsing nodes toward clicked node
    node.exit().transition().duration(duration).remove()
      .attr("transform", `translate(0,${source.index * nodeSize})`)
      .attr("fill-opacity", 0)
      .attr("stroke-opacity", 0);

    // Save index for next animation
    root.eachBefore(d => { d.oldIndex = d.index; });
  }

  // ── Initial render ───────────────────────
  update(null, root);
  return svg.node();
}


function _data(FileAttachment){return(
FileAttachment("flare-2-2.json").json()
)}

export default function define(runtime, observer) {
  const main = runtime.module();
  function toString() { return this.url; }
  const fileAttachments = new Map([
    ["flare-2-2.json", {url: new URL("./files/320319adbe9bc55f48decd5ac50240eb20a281129a3bf74dddec2e06cc751f75332ed152518f30160e9764e5aaf3343df10987252d7a41c1e912681dd7d1530d.json", import.meta.url), mimeType: "application/json", toString}]
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], _1);
  main.variable(observer("chart")).define("chart", ["d3","data"], _chart);
  main.variable(observer("data")).define("data", ["FileAttachment"], _data);
  return main;
}
