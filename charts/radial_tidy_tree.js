function _1(md){return(
md`# Radial Tidy Tree`
)}

function _chart(d3,data)
{
  const width = 928;
  const height = width;
  const cx = width * 0.5;
  const cy = height * 0.59;
  const radius = Math.min(width, height) / 2 - 30;
  const duration = 250;

  const tree = d3.tree()
    .size([2 * Math.PI, radius])
    .separation((a, b) => (a.parent == b.parent ? 1 : 2) / a.depth);

  const root = d3.hierarchy(data)
    .sort((a, b) => d3.ascending(a.data.name, b.data.name));

  // Collapse everything except root
  root.descendants().forEach((d, i) => {
    d.id = i;
    d._children = d.children;
    if (d.depth > 0) d.children = null;
  });

  const svg = d3.create("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [-cx, -cy, width, height])
    .attr("style", "width: 100%; height: auto; font: 10px sans-serif;");

  const gLink = svg.append("g")
    .attr("fill", "none")
    .attr("stroke", "#555")
    .attr("stroke-opacity", 0.4)
    .attr("stroke-width", 1.5);

  const gNode = svg.append("g");
  const gLabel = svg.append("g")
    .attr("stroke-linejoin", "round")
    .attr("stroke-width", 3);

  function update(event, source) {
    const nodes = root.descendants();
    const links = root.links();

    tree(root);

    // ── LINKS ─────────────────────────
    const link = gLink.selectAll("path")
      .data(links, d => d.target.id);

    const linkEnter = link.enter().append("path")
      .attr("d", d => {
        const o = {x: source.x0 || source.x, y: source.y0 || source.y};
        return d3.linkRadial()({source: o, target: o});
      });

    link.merge(linkEnter).transition().duration(duration)
      .attr("d", d3.linkRadial()
        .angle(d => d.x)
        .radius(d => d.y));

    link.exit().transition().duration(duration).remove()
      .attr("d", d => {
        const o = {x: source.x, y: source.y};
        return d3.linkRadial()({source: o, target: o});
      });

    // ── NODES ─────────────────────────
    const node = gNode.selectAll("circle")
      .data(nodes, d => d.id);

    const nodeEnter = node.enter().append("circle")
      .attr("r", 2.5)
      .attr("transform", d => {
        const a = (source.x0 || source.x) * 180 / Math.PI - 90;
        return `rotate(${a}) translate(${source.y0 || source.y},0)`;
      })
      .attr("fill", d => d._children ? "#555" : "#999")
      .on("click", (event, d) => {
        d.children = d.children ? null : d._children;
        update(event, d);
      });

    node.merge(nodeEnter).transition().duration(duration)
      .attr("transform", d =>
        `rotate(${d.x * 180 / Math.PI - 90}) translate(${d.y},0)`
      )
      .attr("fill", d => d._children ? (d.children ? "#555" : "#999") : "#999");

    node.exit().transition().duration(duration).remove();

    // ── LABELS ─────────────────────────
    const label = gLabel.selectAll("text")
      .data(nodes, d => d.id);

    const labelEnter = label.enter().append("text")
      .attr("dy", "0.31em")
      .attr("transform", d => {
        const a = (source.x0 || source.x) * 180 / Math.PI - 90;
        return `rotate(${a}) translate(${source.y0 || source.y},0)`;
      })
      .attr("stroke", "white")
      .attr("paint-order", "stroke")
      .text(d => d.data.name);

    label.merge(labelEnter).transition().duration(duration)
      .attr("transform", d =>
        `rotate(${d.x * 180 / Math.PI - 90}) translate(${d.y},0)
         rotate(${d.x >= Math.PI ? 180 : 0})`
      )
      .attr("x", d => d.x < Math.PI === !d.children ? 6 : -6)
      .attr("text-anchor", d => d.x < Math.PI === !d.children ? "start" : "end");

    label.exit().transition().duration(duration).remove();

    // Save positions for animation
    root.each(d => {
      d.x0 = d.x;
      d.y0 = d.y;
    });
  }

  root.x0 = 0;
  root.y0 = 0;

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
