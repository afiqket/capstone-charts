function _1(md){return(
md`# Play space`
)}

function _2(md){return(
md`## Less than 1% of London's open spaces are Play Space`
)}

async function _chart(FileAttachment,d3)
{
  const raw = await FileAttachment("openspaces.csv").csv();

  const width = 900;
  const height = 500;
  const headerHeight = 30;

  const data = {
    name: "Open Spaces",
    children: Array.from(
      d3.group(raw, d => d["Open Space"]),
      ([openSpace, values]) => ({
        name: openSpace,
        children: values.map(d => ({
          name: d.Borough,
          openSpace,
          borough: d.Borough,
          value: +d.Value
        }))
      })
    )
  };


// Section 2: Create hierarchy, treemap layout, scales, and formatting
  const hierarchy = d3.hierarchy(data)
    .sum(d => d.value || 0)
    .sort((a, b) => b.value - a.value);

  const root = d3.treemap()
    .size([width, height])
    .paddingInner(0)
    .round(true)
    .tile(d3.treemapBinary)(hierarchy);

  const x = d3.scaleLinear().range([0, width]);
  const y = d3.scaleLinear().range([0, height]);

  x.domain([root.x0, root.x1]);
  y.domain([root.y0, root.y1]);

  const format = d3.format(",.0f");


// Section 3: Create container, SVG, and tooltip elements
  const container = d3.create("div")
    .style("position", "relative")
    .style("width", `${width}px`)
    .style("max-width", "100%");

  const svg = container.append("svg")
    .attr("viewBox", [0, -headerHeight, width, height + headerHeight])
    .attr("width", width)
    .attr("height", height + headerHeight)
    .attr("style", "display: block; max-width: 100%; height: auto; font-family: sans-serif;");

  const tooltip = container.append("div")
    .style("position", "absolute")
    .style("pointer-events", "none")
    .style("opacity", 0)
    .style("background", "rgba(255,255,255,0.96)")
    .style("border", "1px solid #000")
    .style("padding", "8px 10px")
    .style("font", "12px sans-serif")
    .style("line-height", "1.35")
    .style("white-space", "nowrap")
    .style("box-shadow", "0 2px 8px rgba(0,0,0,0.15)")
    .style("z-index", 10);

  let uid = 0;
  let group = svg.append("g").call(render, root);


// Section 4: Tooltip content and tooltip interaction handlers
  function tooltipHtml(d) {
    if (d.depth === 0) {
      return `<div><strong>${d.data.name}</strong></div>
              <div>Value: ${format(d.value)}</div>`;
    }
    if (d.depth === 1) {
      return `<div><strong>Open Space:</strong> ${d.data.name}</div>
              <div><strong>Value:</strong> ${format(d.value)}</div>`;
    }
    return `<div><strong>Open Space:</strong> ${d.data.openSpace}</div>
            <div><strong>Borough:</strong> ${d.data.borough}</div>
            <div><strong>Value:</strong> ${format(d.value)}</div>`;
  }

  function showTooltip(event, d) {
    tooltip.html(tooltipHtml(d)).style("opacity", 1);
    moveTooltip(event);
  }

  function moveTooltip(event) {
    const [mx, my] = d3.pointer(event, container.node());

    const tooltipNode = tooltip.node();
    const containerNode = container.node();

    const tw = tooltipNode.offsetWidth;
    const th = tooltipNode.offsetHeight;
    const cw = containerNode.clientWidth;
    const ch = containerNode.clientHeight;

    const offset = 12;

    let left = mx + offset;
    let top = my + offset;

    if (left + tw > cw) left = mx - tw - offset;
    if (top + th > ch) top = my - th - offset;

    if (left < 0) left = 6;
    if (top < 0) top = 6;

    tooltip
      .style("left", `${left}px`)
      .style("top", `${top}px`);
  }

  function hideTooltip() {
    tooltip.style("opacity", 0);
  }


// Section 5: Text wrapping and label layout calculation
  function measureTextWidth(text, fontSize) {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    context.font = `bold ${fontSize}px sans-serif`;
    return context.measureText(text).width;
  }

  function wrapLines(label, maxWidth, fontSize) {
    const words = label.split(/\s+/).filter(Boolean);
    const lines = [];
    let line = [];

    for (const word of words) {
      const testLine = [...line, word].join(" ");
      const testWidth = measureTextWidth(testLine, fontSize);

      if (testWidth > maxWidth && line.length > 0) {
        lines.push(line.join(" "));
        line = [word];
      } else {
        line.push(word);
      }
    }

    if (line.length) lines.push(line.join(" "));
    return lines;
  }

  function getLabelLayout(d, rootNode) {
    const w = d === rootNode ? width : Math.max(0, x(d.x1) - x(d.x0));
    const h = d === rootNode ? headerHeight : Math.max(0, y(d.y1) - y(d.y0));

    const pad = d === rootNode ? 8 : 6;
    const innerW = Math.max(0, w - pad * 2);
    const innerH = Math.max(0, h - pad * 2);

    let fontSize = d === rootNode ? 16 : 14;
    if (w < 160 || h < 80) fontSize = d === rootNode ? 14 : 12;
    if (w < 110 || h < 55) fontSize = d === rootNode ? 12 : 11;

    if (innerW < 30 || innerH < fontSize + 2) {
      return {show: false};
    }

    const lines = wrapLines(d.data.name, innerW, fontSize);
    const lineHeight = fontSize * 1.1;
    const maxLines = Math.max(1, Math.floor(innerH / lineHeight));
    const fittedLines = lines.slice(0, maxLines);
    const blockHeight = fittedLines.length * lineHeight;

    if (!fittedLines.length || blockHeight > innerH) {
      return {show: false};
    }

    const centerX = d === rootNode ? width / 2 : w / 2;
    const centerY = d === rootNode ? headerHeight / 2 : h / 2;
    const startY = centerY - ((fittedLines.length - 1) * lineHeight) / 2;

    return {
      show: true,
      fontSize,
      centerX,
      centerY,
      startY,
      lineHeight,
      lines: fittedLines
    };
  }


// Section 6: Update text labels inside rectangles
  function updateLabels(group, rootNode) {
    group.selectAll("text.label")
      .each(function(d) {
        const text = d3.select(this);
        const layout = getLabelLayout(d, rootNode);

        if (!layout.show) {
          text.style("display", "none");
          text.selectAll("tspan").remove();
          return;
        }

        text
          .style("display", null)
          .style("opacity", 1)
          .attr("font-size", layout.fontSize)
          .attr("font-weight", "bold")
          .attr("text-anchor", "middle")
          .attr("dominant-baseline", "middle")
          .attr("x", layout.centerX)
          .attr("y", layout.centerY);

        const tspans = text.selectAll("tspan")
          .data(layout.lines, (_, i) => i);

        tspans.exit().remove();

        tspans.join(
          enter => enter.append("tspan").text(line => line),
          update => update.text(line => line)
        )
        .attr("x", layout.centerX)
        .attr("y", (_, i) => layout.startY + i * layout.lineHeight);
      });
  }

  function animateLabels(group, rootNode, transition = null) {
    // No separate text animation.
    // This avoids wrapped-text snapping entirely.
    updateLabels(group, rootNode);
  }

// Section 7: Render nodes, rectangles, colors, clip paths, and text elements
  function render(group, rootNode) {
    const nodes = group.selectAll("g")
      .data(rootNode.children ? rootNode.children.concat(rootNode) : [rootNode])
      .join("g");

    nodes
      .filter(d => d === rootNode ? d.parent : d.children)
      .attr("cursor", "pointer")
      .on("click", (event, d) => d === rootNode ? zoomout(rootNode) : zoomin(d));

    nodes.append("rect")
      .attr("id", d => (d.nodeUid = `node-${++uid}`))
      .attr("fill", d => {
        if (d === rootNode) return "#fff";
    
        const openSpaceName = (
          d.depth === 1 ? d.data.name :
          d.depth >= 2 ? d.data.openSpace :
          ""
        ).trim().toLowerCase();
    
        if (openSpaceName === "golf course") return "#bfe3b4";
        if (openSpaceName === "play space") return "#f4b6b6";
    
        return d.children ? "#ccc" : "#e0e0e0";
      })
      .attr("stroke", "#000")
      .on("mouseenter", showTooltip)
      .on("mousemove", moveTooltip)
      .on("mouseleave", hideTooltip);

    nodes.append("clipPath")
      .attr("id", d => (d.clipUid = `clip-${++uid}`))
      .append("use")
      .attr("href", d => `#${d.nodeUid}`);

    nodes.append("text")
      .attr("class", "label")
      .attr("clip-path", d => `url(#${d.clipUid})`)
      .attr("pointer-events", "none")
      .attr("fill", "#000");

    position(group, rootNode);
    updateLabels(group, rootNode);
    animateLabels(group, rootNode);
  }


// Section 8: Position rectangles and labels based on current zoom state
  function position(group, rootNode, transition = null) {
    const g = group.selectAll("g");
    const r = group.selectAll("rect");

    if (transition) {
      g.transition(transition)
        .attr("transform", d =>
          d === rootNode
            ? `translate(0,${-headerHeight})`
            : `translate(${x(d.x0)},${y(d.y0)})`
        );

      r.transition(transition)
        .attr("width", d =>
          d === rootNode ? width : Math.max(0, x(d.x1) - x(d.x0))
        )
        .attr("height", d =>
          d === rootNode ? headerHeight : Math.max(0, y(d.y1) - y(d.y0))
        );

    } else {
      g.attr("transform", d =>
        d === rootNode
          ? `translate(0,${-headerHeight})`
          : `translate(${x(d.x0)},${y(d.y0)})`
      );

      r.attr("width", d =>
          d === rootNode ? width : Math.max(0, x(d.x1) - x(d.x0))
        )
        .attr("height", d =>
          d === rootNode ? headerHeight : Math.max(0, y(d.y1) - y(d.y0))
        );

      updateLabels(group, rootNode);
    }
  }


// Section 9: Zoom in, zoom out, and return the finished chart
  function zoomin(d) {
    if (!d.children) return;
    hideTooltip();

    const oldGroup = group.attr("pointer-events", "none");

    const newGroup = svg.append("g")
      .style("opacity", 0)
      .call(render, d);

    // Keep old labels visible so they can fade out.
    oldGroup.selectAll("text.label")
      .style("display", null)
      .style("opacity", 1);

    // Keep new labels hidden until zoom finishes.
    newGroup.selectAll("text.label")
      .style("display", "none")
      .style("opacity", 0);

    group = newGroup;

    x.domain([d.x0, d.x1]);
    y.domain([d.y0, d.y1]);

    const t = svg.transition().duration(750);

    oldGroup.selectAll("text.label")
      .transition()
      .duration(350)
      .style("opacity", 0);

    oldGroup.transition(t)
      .style("opacity", 0);

    newGroup.transition(t)
      .style("opacity", 1)
      .on("end", function() {
        oldGroup.remove();

        updateLabels(newGroup, d);

        newGroup.selectAll("text.label")
          .style("opacity", 0)
          .transition()
          .duration(350)
          .style("opacity", 1);
      });

    position(oldGroup, d.parent, t);
    position(newGroup, d, t);
  }

  function zoomout(d) {
    if (!d.parent) return;
    hideTooltip();

    const oldGroup = group.attr("pointer-events", "none");

    const newGroup = svg.insert("g", "*")
      .style("opacity", 0)
      .call(render, d.parent);

    // Keep old labels visible so they can fade out.
    oldGroup.selectAll("text.label")
      .style("display", null)
      .style("opacity", 1);

    // Keep new labels hidden until zoom finishes.
    newGroup.selectAll("text.label")
      .style("display", "none")
      .style("opacity", 0);

    group = newGroup;

    x.domain([d.parent.x0, d.parent.x1]);
    y.domain([d.parent.y0, d.parent.y1]);

    const t = svg.transition().duration(750);

    oldGroup.selectAll("text.label")
      .transition()
      .duration(350)
      .style("opacity", 0);

    oldGroup.transition(t)
      .style("opacity", 0);

    newGroup.transition(t)
      .style("opacity", 1)
      .on("end", function() {
        oldGroup.remove();

        updateLabels(newGroup, d.parent);

        newGroup.selectAll("text.label")
          .style("opacity", 0)
          .transition()
          .duration(350)
          .style("opacity", 1);
      });

    position(oldGroup, d, t);
    position(newGroup, d.parent, t);
  }

  return container.node();
}


function _4(md){return(
md`Source: [Green Infastructure Framework](https://designatedsites.naturalengland.org.uk/GreenInfrastructure/Map.aspx)

Original by Cham Mamador (@cmamador) named "Play space" on [Flourish](https://flourish.studio/examples/?q=Play+space)`
)}

export default function define(runtime, observer) {
  const main = runtime.module();
  function toString() { return this.url; }
  const fileAttachments = new Map([
    ["openspaces.csv", {url: new URL("./files/5f3d441fafb7a52a6293871a6d36386af404d712ea79b3700371a56945d735660e0f29bb138a54219bd919b6f1ebfaf58296ad6ff73a46e5d29cd1436581ac90.csv", import.meta.url), mimeType: "text/csv", toString}]
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], _1);
  main.variable(observer()).define(["md"], _2);
  main.variable(observer("chart")).define("chart", ["FileAttachment","d3"], _chart);
  main.variable(observer()).define(["md"], _4);
  return main;
}
