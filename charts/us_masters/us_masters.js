function _1(md){return(
md`# US Masters`
)}

async function _2(FileAttachment)
{
  const d3 = await import("https://cdn.jsdelivr.net/npm/d3@7/+esm");

  const csvText = await FileAttachment("us_masters.csv").text();

  const rows = d3
    .csvParseRows(csvText)
    .filter((row) => row.some((cell) => String(cell).trim() !== ""));

  // First row contains hole labels, not player data
  const holeLabels = rows[0].slice(2);

  // Actual player data starts from the second row
  const dataRows = rows.slice(1);

  const bg = "#2c6f4c";
  const axisColor = "#d8efe3";
  const textColor = "#f8fff9";

  const colors = {
    Rose: "rgb(105, 185, 255)",
    McIlroy: "rgb(248, 228, 76)",
    DeChambeau: "rgb(250, 154, 90)"
  };

  const playDuration = 20000;

  // Smooth movement controls
  const portraitSpeed = 180; // pixels per second
  const labelSpeed = 180; // pixels per second
  const minLabelGap = 30;

  const width = 1100;
  const height = 560;

  const margin = {
    top: 80,
    right: 270,
    bottom: 70,
    left: 50
  };

  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  function holeX(label, index) {
    const text = String(label).trim();

    if (/^PO\d+$/i.test(text)) {
      return 72 + Number(text.replace(/PO/i, ""));
    }

    const n = Number(text);
    return Number.isFinite(n) ? n : index + 1;
  }

  const holes = holeLabels.map((label, index) => ({
    label,
    x: holeX(label, index)
  }));

  function normalizeName(name) {
    return String(name).toLowerCase().replace(/[^a-z]/g, "");
  }

  function playerColor(name, i) {
    const n = normalizeName(name);

    if (n.includes("rose")) return colors.Rose;
    if (n.includes("mcilroy") || n.includes("mcllroy")) return colors.McIlroy;
    if (n.includes("dechambeau")) return colors.DeChambeau;

    return d3.schemeTableau10[i % 10];
  }

  const players = dataRows
    .map((row, i) => {
      const name = String(row[0] ?? "").trim();
      const image = String(row[1] ?? "").trim();

      const values = row
        .slice(2)
        .map((v, idx) => {
          const text = String(v ?? "").trim();

          // Empty cells must be skipped.
          // Otherwise +"" becomes 0 and creates fake score drops.
          if (text === "") return null;

          const score = Number(text);

          if (!Number.isFinite(score)) return null;

          return {
            x: holes[idx].x,
            value: score
          };
        })
        .filter((d) => d !== null);

      return {
        name,
        image,
        color: playerColor(name, i),
        values,
        firstX: d3.min(values, (d) => d.x),
        lastX: d3.max(values, (d) => d.x)
      };
    })
    .filter((d) => d.name && d.values.length);

  // Fixed order is used only when players have equal scores.
  // This prevents labels from randomly swapping above or below each other.
  const fixedTieOrder = new Map(players.map((d, i) => [d.name, i]));

  function compareLabelOrder(a, b) {
    // Higher score means more under par, so it should appear higher.
    if (a.score !== b.score) {
      return b.score - a.score;
    }

    // Equal score means keep a stable fixed order.
    return fixedTieOrder.get(a.name) - fixedTieOrder.get(b.name);
  }

  const lastX = d3.max(holes, (d) => d.x);

  const root = d3
    .create("div")
    .style("width", `${width}px`)
    .style("background", bg)
    .style(
      "font-family",
      "system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    )
    .style("color", textColor)
    .style("padding", "12px 10px 10px 10px")
    .style("box-sizing", "border-box");

  const titleRow = root
    .append("div")
    .style("display", "flex")
    .style("align-items", "center")
    .style("justify-content", "space-between")
    .style("margin-bottom", "12px");

  titleRow
    .append("div")
    .text("Race to the Green Jacket: Masters 2025, Hole by Hole ⛳")
    .style("font-size", "34px")
    .style("font-weight", "800")
    .style("letter-spacing", "0.4px")
    .style("line-height", "1.1");

  const replayButton = root
    .append("button")
    .text("Replay")
    .style("background", "transparent")
    .style("color", textColor)
    .style("border", "1px solid rgba(255,255,255,0.25)")
    .style("border-radius", "2px")
    .style("padding", "4px 13px")
    .style("font-size", "18px")
    .style("font-weight", "700")
    .style("cursor", "pointer")
    .style("margin-bottom", "18px");

  const svg = root
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .style("display", "block")
    .style("overflow", "visible");

  const g = svg
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const x = d3.scaleLinear().domain([1, lastX]).range([0, innerWidth]);

  const y = d3.scaleLinear().domain([0, 15]).range([innerHeight, 0]);

  const xTicks = [1, 18, 36, 54, 72].filter((d) => d <= lastX);

  const xAxis = d3.axisBottom(x).tickValues(xTicks).tickSizeOuter(0);

  const yAxis = d3
    .axisLeft(y)
    .tickValues([0, 5, 10])
    .tickFormat((d) => `-${d}`)
    .tickSizeOuter(0);

  g.append("text")
    .attr("x", -margin.left + 5)
    .attr("y", -22)
    .attr("fill", textColor)
    .attr("font-size", 20)
    .attr("font-weight", 800)
    .text("Shots under par");

  g.append("g")
    .attr("transform", `translate(0,${innerHeight})`)
    .call(xAxis)
    .call((axis) =>
      axis.select(".domain").attr("stroke", axisColor).attr("stroke-width", 1.5)
    )
    .call((axis) =>
      axis
        .selectAll(".tick line")
        .attr("stroke", axisColor)
        .attr("stroke-width", 1.5)
    )
    .call((axis) =>
      axis
        .selectAll(".tick text")
        .attr("fill", textColor)
        .attr("font-size", 17)
        .attr("font-weight", 600)
    );

  g.append("g")
    .call(yAxis)
    .call((axis) =>
      axis.select(".domain").attr("stroke", axisColor).attr("stroke-width", 1.5)
    )
    .call((axis) =>
      axis
        .selectAll(".tick line")
        .attr("stroke", axisColor)
        .attr("stroke-width", 1.5)
    )
    .call((axis) =>
      axis
        .selectAll(".tick text")
        .attr("fill", textColor)
        .attr("font-size", 17)
        .attr("font-weight", 600)
    );

  g.append("text")
    .attr("x", innerWidth / 2)
    .attr("y", innerHeight + 56)
    .attr("text-anchor", "middle")
    .attr("fill", textColor)
    .attr("font-size", 20)
    .attr("font-weight", 800)
    .text("Hole");

  const line = d3
    .line()
    .x((d) => x(d.x))
    .y((d) => y(d.value))
    .curve(d3.curveStepAfter);

  function valueAt(player, t) {
    const vals = player.values;

    if (!vals.length) return 0;
    if (t <= vals[0].x) return vals[0].value;
    if (t >= vals[vals.length - 1].x) return vals[vals.length - 1].value;

    const i = d3.bisector((d) => d.x).right(vals, t) - 1;
    return vals[Math.max(0, Math.min(i, vals.length - 1))].value;
  }

  function shownX(player, t) {
    return Math.max(player.firstX, Math.min(t, player.lastX));
  }

  function visibleValues(player, t) {
    const clamped = shownX(player, t);

    if (t < player.firstX) return [];

    const vals = player.values.filter((d) => d.x <= clamped);

    if (vals.length && vals[vals.length - 1].x < clamped) {
      vals.push({
        x: clamped,
        value: valueAt(player, clamped)
      });
    }

    return vals;
  }

  function scoreText(v) {
    const rounded = Math.round(v);
    return rounded === 0 ? "0" : `-${rounded}`;
  }

  const paths = g
    .append("g")
    .selectAll("path")
    .data(players)
    .join("path")
    .attr("fill", "none")
    .attr("stroke", (d) => d.color)
    .attr("stroke-width", 5)
    .attr("stroke-linejoin", "round")
    .attr("stroke-linecap", "butt");

  const tracker = g.append("g");

  tracker
    .append("line")
    .attr("y1", 0)
    .attr("y2", innerHeight)
    .attr("stroke", "rgba(255,255,255,0.85)")
    .attr("stroke-width", 2);

  tracker
    .append("circle")
    .attr("cy", innerHeight)
    .attr("r", 4)
    .attr("fill", axisColor);

  const marker = g
    .append("g")
    .selectAll("g.player")
    .data(players)
    .join("g")
    .attr("class", "player");

  marker.each(function (d, i) {
    const group = d3.select(this);
    const clipId = `portrait-clip-${i}-${Math.random()
      .toString(36)
      .slice(2)}`;

    group
      .append("clipPath")
      .attr("id", clipId)
      .append("circle")
      .attr("r", 24);

    group
      .append("image")
      .attr("href", d.image)
      .attr("x", -24)
      .attr("y", -24)
      .attr("width", 48)
      .attr("height", 48)
      .attr("preserveAspectRatio", "xMidYMid slice")
      .attr("clip-path", `url(#${clipId})`);

    group
      .append("circle")
      .attr("r", 24)
      .attr("fill", "none")
      .attr("stroke", "rgba(0,0,0,0.35)")
      .attr("stroke-width", 2);

    group
      .append("text")
      .attr("x", 36)
      .attr("y", 7)
      .attr("fill", d.color)
      .attr("font-size", 20)
      .attr("font-weight", 800)
      .style("paint-order", "stroke")
      .style("stroke", bg)
      .style("stroke-width", 5)
      .style("stroke-linejoin", "round");
  });

  const hoverLine = g
    .append("line")
    .attr("y1", 0)
    .attr("y2", innerHeight)
    .attr("stroke", "rgba(255,255,255,0.25)")
    .attr("stroke-width", 2)
    .style("display", "none");

  g.append("g")
    .selectAll("rect")
    .data(holes)
    .join("rect")
    .attr("x", (d, i) => {
      const prevMid = i === 0 ? d.x - 0.5 : (holes[i - 1].x + d.x) / 2;
      return x(Math.max(1, prevMid));
    })
    .attr("width", (d, i) => {
      const prevMid = i === 0 ? d.x - 0.5 : (holes[i - 1].x + d.x) / 2;
      const nextMid =
        i === holes.length - 1 ? d.x + 0.5 : (d.x + holes[i + 1].x) / 2;

      return x(Math.min(lastX, nextMid)) - x(Math.max(1, prevMid));
    })
    .attr("y", -50)
    .attr("height", innerHeight + 55)
    .attr("fill", "transparent")
    .style("cursor", "pointer")
    .on("mouseenter", function (event, d) {
      hoverLine
        .attr("x1", x(d.x))
        .attr("x2", x(d.x))
        .style("display", null);
    })
    .on("mouseleave", function () {
      hoverLine.style("display", "none");
    })
    .on("click", function (event, d) {
      animateTo(d.x);
    });

  let currentX = 0;
  let frameId = null;

  const portraitDisplayY = new Map();
  const labelDisplayY = new Map();

  function layoutLabelTargets(currentX) {
    const labels = players
      .map((d) => {
        const score = valueAt(d, currentX);
        const targetY = y(score);

        return {
          name: d.name,
          score,
          targetY,
          labelY: targetY
        };
      })
      .sort(compareLabelOrder);

    if (!labels.length) return [];

    for (let i = 1; i < labels.length; i++) {
      if (labels[i].labelY - labels[i - 1].labelY < minLabelGap) {
        labels[i].labelY = labels[i - 1].labelY + minLabelGap;
      }
    }

    const overflowBottom = labels[labels.length - 1].labelY - innerHeight;
    if (overflowBottom > 0) {
      labels.forEach((d) => {
        d.labelY -= overflowBottom;
      });
    }

    const overflowTop = -labels[0].labelY;
    if (overflowTop > 0) {
      labels.forEach((d) => {
        d.labelY += overflowTop;
      });
    }

    return labels;
  }

  function smoothMapToTargets(displayMap, targets, speed, dt) {
    const positions = new Map();
    let settled = true;

    targets.forEach((targetY, name) => {
      const previousY = displayMap.has(name) ? displayMap.get(name) : targetY;
      const maxStep = (speed * dt) / 1000;
      const diff = targetY - previousY;

      let displayY;

      if (Math.abs(diff) <= maxStep) {
        displayY = targetY;
      } else {
        displayY = previousY + Math.sign(diff) * maxStep;
        settled = false;
      }

      displayMap.set(name, displayY);
      positions.set(name, displayY);
    });

    return { positions, settled };
  }

  function smoothPortraitPositions(currentX, dt = 16) {
    const targets = new Map(
      players.map((d) => [d.name, y(valueAt(d, currentX))])
    );

    return smoothMapToTargets(portraitDisplayY, targets, portraitSpeed, dt);
  }

  function smoothLabelPositions(currentX, dt = 16) {
    const targetsArray = layoutLabelTargets(currentX);
    const targets = new Map(targetsArray.map((d) => [d.name, d.labelY]));

    const result = smoothMapToTargets(labelDisplayY, targets, labelSpeed, dt);

    const scoreByName = new Map(
      players.map((d) => [d.name, valueAt(d, currentX)])
    );

    // Stable order:
    // Different scores use true chart position.
    // Equal scores use fixed CSV order.
    const labels = players
      .map((d) => ({
        name: d.name,
        score: scoreByName.get(d.name),
        targetY: targets.get(d.name),
        displayY: result.positions.get(d.name)
      }))
      .sort(compareLabelOrder);

    if (!labels.length) {
      return {
        positions: new Map(),
        settled: true
      };
    }

    for (let i = 1; i < labels.length; i++) {
      if (labels[i].displayY - labels[i - 1].displayY < minLabelGap) {
        labels[i].displayY = labels[i - 1].displayY + minLabelGap;
      }
    }

    const overflowBottom = labels[labels.length - 1].displayY - innerHeight;
    if (overflowBottom > 0) {
      labels.forEach((d) => {
        d.displayY -= overflowBottom;
      });
    }

    const overflowTop = -labels[0].displayY;
    if (overflowTop > 0) {
      labels.forEach((d) => {
        d.displayY += overflowTop;
      });
    }

    let settled = result.settled;

    labels.forEach((d) => {
      labelDisplayY.set(d.name, d.displayY);

      if (Math.abs(d.displayY - targets.get(d.name)) > 0.75) {
        settled = false;
      }
    });

    return {
      positions: new Map(labels.map((d) => [d.name, d.displayY])),
      settled
    };
  }

  function resetSmoothPositions(currentX) {
    portraitDisplayY.clear();
    labelDisplayY.clear();

    players.forEach((d) => {
      portraitDisplayY.set(d.name, y(valueAt(d, currentX)));
    });

    layoutLabelTargets(currentX).forEach((d) => {
      labelDisplayY.set(d.name, d.labelY);
    });
  }

  function render(dt = 16) {
    const trackerX = Math.max(1, Math.min(currentX, lastX));

    const { positions: portraitYByName, settled: portraitsSettled } =
      smoothPortraitPositions(currentX, dt);

    const { positions: labelYByName, settled: labelsSettled } =
      smoothLabelPositions(currentX, dt);

    paths.attr("d", (d) => line(visibleValues(d, currentX)));

    tracker.attr("transform", `translate(${x(trackerX)},0)`);

    marker.attr("transform", (d) => {
      const px = shownX(d, currentX);
      const rawY = y(valueAt(d, currentX));
      const smoothY = portraitYByName.get(d.name) ?? rawY;

      return `translate(${x(px)},${smoothY})`;
    });

    marker
      .select("text")
      .attr("y", (d) => {
        const rawY = y(valueAt(d, currentX));
        const portraitY = portraitYByName.get(d.name) ?? rawY;
        const labelY = labelYByName.get(d.name) ?? portraitY;

        return labelY - portraitY + 7;
      })
      .text((d) => {
        const v = valueAt(d, currentX);
        return `${d.name} ${scoreText(v)}`;
      });

    return portraitsSettled && labelsSettled;
  }

  function animateTo(targetX, forcedDuration = null) {
    if (frameId) cancelAnimationFrame(frameId);

    const startX = currentX;
    const distance = Math.abs(targetX - startX);

    const duration =
      forcedDuration === null
        ? Math.max(300, (distance / lastX) * playDuration)
        : forcedDuration;

    const startTime = performance.now();
    let previousTime = null;

    function frame(now) {
      const dt = previousTime == null ? 16 : now - previousTime;
      previousTime = now;

      const t = Math.min(1, (now - startTime) / duration);

      // X movement stays linear.
      currentX = startX + (targetX - startX) * t;

      const settled = render(dt);

      if (t < 1 || !settled) {
        frameId = requestAnimationFrame(frame);
      } else {
        currentX = targetX;
        render(16);
      }
    }

    frameId = requestAnimationFrame(frame);
  }

  replayButton.on("click", () => {
    if (frameId) cancelAnimationFrame(frameId);

    currentX = 0;
    resetSmoothPositions(currentX);
    render(16);
    animateTo(lastX, playDuration);
  });

  resetSmoothPositions(currentX);
  render(16);
  animateTo(lastX, playDuration);

  root
    .append("div")
    .style("font-size", "18px")
    .style("margin-top", "8px")
    .html(
      `Source: <a href="https://www.masters.com" target="_blank" style="color:${textColor}; text-decoration: underline;">Masters.com</a>`
    );

  return root.node();
}


function _3(md){return(
md`Original by Scott Barber (@scottb) on [Flourish](https://flourish.studio/examples/?q=US+Masters)`
)}

export default function define(runtime, observer) {
  const main = runtime.module();
  function toString() { return this.url; }
  const fileAttachments = new Map([
    ["us_masters.csv", {url: new URL("./files/eb445e88803a91d8d435bdc282876882ca9341edd47d784c06f4155962a691c841d4406869ca9d8ebc2a829f277fe7ec01f82ef0f736847031b8e353ff371653.csv", import.meta.url), mimeType: "text/csv", toString}]
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], _1);
  main.variable(observer()).define(["FileAttachment"], _2);
  main.variable(observer()).define(["md"], _3);
  return main;
}
