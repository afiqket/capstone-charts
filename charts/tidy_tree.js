function _1(md){return(
md`# Tidy Tree`
)}

function _chart(d3,data)
{
  const width = 928;
  const dx = 20;
  const duration = 250;

  const root = d3.hierarchy(data);
  const dy = width / (root.height + 1);

  const tree = d3.tree().nodeSize([dx, dy]);

  // Collapse all nodes except root
  root.descendants().forEach((d, i) => {
    d.id = i;
    d._children = d.children;
    if (d.depth > 0) d.children = null;
  });

  const svg = d3.create("svg")
    .attr("width", width)
    .attr("style", "max-width: 100%; height: auto; font: 15px sans-serif;");

  const gLink = svg.append("g")
    .attr("fill", "none")
    .attr("stroke", "#555")
    .attr("stroke-opacity", 0.4)
    .attr("stroke-width", 1.5);

  const gNode = svg.append("g")
    .attr("cursor", "pointer");

  function update(event, source) {
    const nodes = root.descendants();
    const links = root.links();

    tree(root);

    let x0 = Infinity;
    let x1 = -Infinity;
    root.each(d => {
      if (d.x > x1) x1 = d.x;
      if (d.x < x0) x0 = d.x;
    });

    const height = x1 - x0 + dx * 2;

    svg.transition().duration(duration)
      .attr("height", height)
      .attr("viewBox", [-dy / 3, x0 - dx, width, height]);

    // ── LINKS ─────────────────────────
    const link = gLink.selectAll("path")
      .data(links, d => d.target.id);

    const linkEnter = link.enter().append("path")
      .attr("d", d => {
        const o = {x: source.x0 || source.x, y: source.y0 || source.y};
        return d3.linkHorizontal()({source: o, target: o});
      });

    link.merge(linkEnter).transition().duration(duration)
      .attr("d", d3.linkHorizontal()
        .x(d => d.y)
        .y(d => d.x));

    link.exit().transition().duration(duration).remove()
      .attr("d", d => {
        const o = {x: source.x, y: source.y};
        return d3.linkHorizontal()({source: o, target: o});
      });

    // ── NODES ─────────────────────────
    const node = gNode.selectAll("g")
      .data(nodes, d => d.id);

    const nodeEnter = node.enter().append("g")
      .attr("transform", d => `translate(${source.y0 || source.y},${source.x0 || source.x})`)
      .on("click", (event, d) => {
        d.children = d.children ? null : d._children;
        update(event, d);
      });

    nodeEnter.append("circle")
      .attr("r", 2.5)
      .attr("fill", d => d._children ? "#555" : "#999");

    nodeEnter.append("text")
      .attr("dy", "0.31em")
      .attr("x", d => d._children ? -6 : 6)
      .attr("text-anchor", d => d._children ? "end" : "start")
      .text(d => d.data.name)
      .attr("stroke", "white")
      .attr("paint-order", "stroke");

    const nodeUpdate = node.merge(nodeEnter);

    nodeUpdate.transition().duration(duration)
      .attr("transform", d => `translate(${d.y},${d.x})`);

    nodeUpdate.select("circle")
      .attr("fill", d => d._children ? (d.children ? "#555" : "#999") : "#999");

    node.exit().transition().duration(duration).remove()
      .attr("transform", d => `translate(${source.y},${source.x})`);

    // Save positions for animation
    root.each(d => {
      d.x0 = d.x;
      d.y0 = d.y;
    });
  }

  // Initial positions
  root.x0 = 0;
  root.y0 = 0;

  update(null, root);

  return svg.node();
}


function _data(FileAttachment){return(
FileAttachment("flare.json").json()
)}

export default function define(runtime, observer) {
  const main = runtime.module();
  function toString() { return this.url; }
  const fileAttachments = new Map([
    ["flare.json", {url: new URL("./files/319d5b81375f780850b8cdc86d394924a149960bb68df92a87aa79a66bad9a6351b80b847fbebe11a41f935358dc6cf7fab54d4f509777e41488c76a52ce8e72.json", import.meta.url), mimeType: "application/json", toString}]
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], _1);
  main.variable(observer("chart")).define("chart", ["d3","data"], _chart);
  main.variable(observer("data")).define("data", ["FileAttachment"], _data);
  return main;
}
