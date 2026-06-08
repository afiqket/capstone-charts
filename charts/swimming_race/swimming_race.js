function _1(md){return(
md`# Swimming race`
)}

async function _2(FileAttachment)
{
  const d3 = await import("https://cdn.jsdelivr.net/npm/d3@7/+esm");

  const raw = await FileAttachment("swimming_race.csv").csv({ typed: false });

  // =========================
  // CONFIG
  // =========================
  const playbackDurationMs = 20000;

  const width = 1008;
  const height = 710;

  const poolX = 91;
  const poolY = 101;
  const poolW = 826;
  const poolH = 415;

  const laneCount = 8;
  const laneH = poolH / laneCount;

  const leftWallX = poolX + 36;
  const rightWallX = poolX + poolW - 36;

  const sliderX0 = 91;
  const sliderX1 = 996;
  const sliderY = 650;

  const colors = [
    "#0787d8",
    "#f4b21b",
    "#04a85a",
    "#ff2b2b",
    "#000000",
    "#0787d8",
    "#f4b21b",
    "#04a85a"
  ];

  // =========================
  // HELPERS
  // =========================
  function parseRaceTime(str) {
    const [m, s] = String(str).trim().split(":");
    return Number(m) * 60 + Number(s);
  }

  function formatRaceTime(t) {
    const m = Math.floor(t / 60);
    const s = t - m * 60;
    return `${String(m).padStart(2, "0")}:${s.toFixed(2).padStart(5, "0")}`;
  }

  function formatAxisTime(t) {
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  function ordinal(n) {
    if (n % 100 >= 11 && n % 100 <= 13) return `${n}th`;
    if (n % 10 === 1) return `${n}st`;
    if (n % 10 === 2) return `${n}nd`;
    if (n % 10 === 3) return `${n}rd`;
    return `${n}th`;
  }

  function medal(n) {
    if (n === 1) return "🥇";
    if (n === 2) return "🥈";
    if (n === 3) return "🥉";
    return "";
  }

  function lerp(a, b, u) {
    return a + (b - a) * u;
  }

  function clamp(x, min, max) {
    return Math.max(min, Math.min(max, x));
  }

  function xForSide(side) {
    return side === "left" ? leftWallX : rightWallX;
  }

  // =========================
  // DATA
  // =========================
  const splitCols = Object.keys(raw[0])
    .filter(k => /^\d+$/.test(k))
    .sort((a, b) => Number(a) - Number(b));

  let swimmers = raw.map((d, i) => {
    const splits = splitCols.map(c => parseRaceTime(d[c]));

    return {
      lane: Number(d.Lane),
      name: d.Name,
      color: colors[i % colors.length],
      splits,
      finalTime: splits[splits.length - 1]
    };
  });

  const ranking = [...swimmers].sort((a, b) => a.finalTime - b.finalTime);

  ranking.forEach((d, i) => {
    d.place = i + 1;
  });

  swimmers = swimmers.sort((a, b) => a.lane - b.lane);

  const maxRaceTime = d3.max(swimmers, d => d.finalTime);

  // =========================
  // POSITION INTERPOLATION
  // =========================
  // Start is left.
  // Split 1 is right.
  // Split 2 is left.
  // Split 3 is right.
  // Split 4 is left.
  function swimmerState(d, t) {
    if (t <= 0) {
      return {
        x: leftWallX,
        dir: 1,
        finished: false
      };
    }

    let prevTime = 0;
    let prevSide = "left";

    for (let i = 0; i < d.splits.length; i++) {
      const nextTime = d.splits[i];
      const nextSide = i % 2 === 0 ? "right" : "left";

      if (t <= nextTime) {
        const u = clamp((t - prevTime) / (nextTime - prevTime), 0, 1);

        return {
          x: lerp(xForSide(prevSide), xForSide(nextSide), u),
          dir: nextSide === "right" ? 1 : -1,
          finished: false
        };
      }

      prevTime = nextTime;
      prevSide = nextSide;
    }

    return {
      x: xForSide(prevSide),
      dir: prevSide === "right" ? 1 : -1,
      finished: true
    };
  }

  // =========================
  // DOM
  // =========================
  const container = d3
    .create("div")
    .style("width", `${width}px`)
    .style("height", `${height}px`)
    .style("background", "#1f1f1f")
    .style("position", "relative")
    .style("font-family", "Arial, Helvetica, sans-serif")
    .style("user-select", "none");

  const svg = container
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  // =========================
  // POOL
  // =========================
  svg
    .append("rect")
    .attr("x", poolX)
    .attr("y", poolY)
    .attr("width", poolW)
    .attr("height", poolH)
    .attr("fill", "#c7f5ff");

  svg
    .selectAll(".lane-divider")
    .data(d3.range(laneCount + 1))
    .join("line")
    .attr("x1", poolX)
    .attr("x2", poolX + poolW)
    .attr("y1", d => poolY + d * laneH)
    .attr("y2", d => poolY + d * laneH)
    .attr("stroke", "white")
    .attr("stroke-width", 1.1)
    .attr("opacity", 0.9);

  const laneGuides = svg
    .append("g")
    .selectAll(".lane-guide")
    .data(swimmers)
    .join("g")
    .attr("transform", d => {
      const y = poolY + (d.lane - 0.5) * laneH;
      return `translate(0,${y})`;
    });

  laneGuides
    .append("line")
    .attr("x1", leftWallX)
    .attr("x2", rightWallX)
    .attr("y1", 0)
    .attr("y2", 0)
    .attr("stroke", "#9fe3f5")
    .attr("stroke-width", 4)
    .attr("opacity", 0.45);

  laneGuides
    .append("line")
    .attr("x1", leftWallX)
    .attr("x2", leftWallX)
    .attr("y1", -8)
    .attr("y2", 8)
    .attr("stroke", "#9fe3f5")
    .attr("stroke-width", 4)
    .attr("opacity", 0.45);

  laneGuides
    .append("line")
    .attr("x1", rightWallX)
    .attr("x2", rightWallX)
    .attr("y1", -8)
    .attr("y2", 8)
    .attr("stroke", "#9fe3f5")
    .attr("stroke-width", 4)
    .attr("opacity", 0.45);

  // =========================
  // SWIMMER ICON
  // =========================
  function drawSwimmer(g, color) {
    const icon = g
      .append("g")
      .attr("class", "swimmer-svg")
      .attr("transform", "translate(-20,-20) scale(1.25)");

    icon
      .append("path")
      .attr(
        "d",
        "M 23.5 11 C 21.578125 11 20 12.578125 20 14.5 C 20 16.421875 21.578125 18 23.5 18 C 25.421875 18 27 16.421875 27 14.5 C 27 12.578125 25.421875 11 23.5 11 Z M 13.71875 11.03125 C 13.355469 11.054688 13.003906 11.175781 12.6875 11.40625 L 7.40625 15.1875 L 8.59375 16.8125 L 13.84375 13.03125 L 16.125 15.65625 L 8.71875 21.9375 C 9.125 21.972656 9.558594 22 10 22 C 10.675781 22 11.324219 21.929688 11.96875 21.8125 L 17.40625 17.15625 L 19.4375 19.5 C 20.175781 19.308594 20.933594 19.144531 21.71875 19.0625 L 15.34375 11.71875 C 14.917969 11.222656 14.324219 10.992188 13.71875 11.03125 Z M 23.5 13 C 24.339844 13 25 13.660156 25 14.5 C 25 15.34375 24.339844 16 23.5 16 C 22.65625 16 22 15.34375 22 14.5 C 22 13.660156 22.65625 13 23.5 13 Z M 23 20 C 20.5625 20 18.425781 20.816406 16.34375 21.5625 C 14.261719 22.308594 12.234375 23 10 23 C 4.503906 23 1.6875 20.28125 1.6875 20.28125 L 0.3125 21.71875 C 0.3125 21.71875 3.816406 25 10 25 C 12.644531 25 14.90625 24.191406 17 23.4375 C 19.09375 22.683594 21.015625 22 23 22 C 26.96875 22 30.34375 24.78125 30.34375 24.78125 L 31.65625 23.21875 C 31.65625 23.21875 27.875 20 23 20 Z"
      )
      .attr("fill", color);
  }

  // =========================
  // ATHLETES
  // =========================
  const athletes = svg
    .append("g")
    .selectAll(".athlete")
    .data(swimmers)
    .join("g")
    .attr("class", "athlete");

  athletes.each(function(d) {
    const g = d3.select(this);

    const iconWrap = g.append("g").attr("class", "icon-wrap");
    drawSwimmer(iconWrap, d.color);

    g.append("text")
      .attr("class", "label")
      .attr("y", 5)
      .attr("font-size", 16)
      .attr("font-weight", 500)
      .attr("fill", "black")
      .attr("paint-order", "stroke")
      .attr("stroke", "white")
      .attr("stroke-width", 4)
      .attr("stroke-linejoin", "round");
  });

  function labelText(d, finished) {
    const base = `${d.name} (${ordinal(d.place)})`;

    if (!finished) return base;

    const m = medal(d.place);
    return `${base} ${m ? m + " " : ""}${formatRaceTime(d.finalTime)}`;
  }

  // =========================
  // FOOTER
  // =========================
  const footer = svg
    .append("text")
    .attr("x", 10)
    .attr("y", 695)
    .attr("fill", "white")
    .attr("font-size", 16)
    .attr("font-weight", 700);

  footer.append("tspan").text("Source: ");

  footer
    .append("tspan")
    .text("World Aquatics")
    .attr("text-decoration", "underline");

  footer.append("tspan").text(" · Created with the Flourish ");

  footer
    .append("tspan")
    .text("Sports Race")
    .attr("text-decoration", "underline");

  footer.append("tspan").text(" template");

  // =========================
  // SLIDER
  // =========================
  const sliderScale = d3
    .scaleLinear()
    .domain([0, maxRaceTime])
    .range([sliderX0, sliderX1])
    .clamp(true);

  const slider = svg.append("g").attr("class", "slider");

  slider
    .append("line")
    .attr("x1", sliderX0)
    .attr("x2", sliderX1)
    .attr("y1", sliderY)
    .attr("y2", sliderY)
    .attr("stroke", "#bfbfbf")
    .attr("stroke-width", 2);

  const sliderProgress = slider
    .append("line")
    .attr("x1", sliderX0)
    .attr("x2", sliderX0)
    .attr("y1", sliderY)
    .attr("y2", sliderY)
    .attr("stroke", "#ffffff")
    .attr("stroke-width", 2);

  // Labeled ticks stop at 01:45.
  // The true end of the slider only has a small pip and no label.
  const labeledTickVals = d3.range(0, 106, 15);

  const labeledTicks = slider
    .selectAll(".tick-labeled")
    .data(labeledTickVals)
    .join("g")
    .attr("class", "tick-labeled")
    .attr("transform", d => `translate(${sliderScale(d)},${sliderY})`);

  labeledTicks
    .append("line")
    .attr("y1", 0)
    .attr("y2", 8)
    .attr("stroke", "#bfbfbf")
    .attr("stroke-width", 1.5);

  labeledTicks
    .append("text")
    .attr("y", 21)
    .attr("text-anchor", "middle")
    .attr("fill", "white")
    .attr("font-size", 13)
    .text(d => formatAxisTime(d));

  slider
    .append("line")
    .attr("class", "end-pip")
    .attr("x1", sliderScale(maxRaceTime))
    .attr("x2", sliderScale(maxRaceTime))
    .attr("y1", sliderY)
    .attr("y2", sliderY + 8)
    .attr("stroke", "#bfbfbf")
    .attr("stroke-width", 1.5);

  const thumb = slider
    .append("path")
    .attr("d", d3.symbol().type(d3.symbolTriangle).size(70))
    .attr("fill", "#d0d0d0")
    .attr("transform", `translate(${sliderX0},${sliderY - 6}) rotate(180)`);

  const sliderHit = slider
    .append("rect")
    .attr("x", sliderX0)
    .attr("y", sliderY - 18)
    .attr("width", sliderX1 - sliderX0)
    .attr("height", 36)
    .attr("fill", "transparent")
    .style("cursor", "pointer");

  // =========================
  // PLAY BUTTON
  // =========================
  const playButton = svg
    .append("g")
    .attr("transform", "translate(46,638)")
    .style("cursor", "pointer");

  playButton
    .append("circle")
    .attr("r", 22)
    .attr("fill", "#3b3b3b");

  const playIcon = playButton.append("g");

  // =========================
  // ANIMATION STATE
  // =========================
  let currentTime = 0;
  let playing = false;
  let lastFrame = null;
  let raf = null;

  function drawPlayIcon() {
    playIcon.selectAll("*").remove();

    if (playing) {
      playIcon
        .append("rect")
        .attr("x", -9)
        .attr("y", -10)
        .attr("width", 7)
        .attr("height", 20)
        .attr("rx", 2)
        .attr("fill", "white");

      playIcon
        .append("rect")
        .attr("x", 3)
        .attr("y", -10)
        .attr("width", 7)
        .attr("height", 20)
        .attr("rx", 2)
        .attr("fill", "white");
    } else {
      playIcon
        .append("path")
        .attr("d", "M-7,-11 L12,0 L-7,11 Z")
        .attr("fill", "white");
    }
  }

  function update(t) {
    currentTime = clamp(t, 0, maxRaceTime);

    athletes.each(function(d) {
      const state = swimmerState(d, currentTime);
      const y = poolY + (d.lane - 0.5) * laneH;
      const x = state.x;

      const g = d3.select(this);

      g.attr("transform", `translate(${x},${y})`);

      // Flip only the swimmer icon.
      // The label stays readable and always stays on the right.
      g.select(".icon-wrap")
        .attr("transform", `scale(${state.dir},1)`);

      const finished = currentTime >= d.finalTime;

      g.select(".label")
        .attr("x", 30)
        .attr("text-anchor", "start")
        .text(labelText(d, finished));
    });

    sliderProgress.attr("x2", sliderScale(currentTime));

    thumb.attr(
      "transform",
      `translate(${sliderScale(currentTime)},${sliderY - 6}) rotate(180)`
    );
  }

  function animationFrame(now) {
    if (!playing) return;

    if (lastFrame == null) lastFrame = now;

    const dt = now - lastFrame;
    lastFrame = now;

    currentTime += (dt / playbackDurationMs) * maxRaceTime;

    if (currentTime >= maxRaceTime) {
      currentTime = maxRaceTime;
      playing = false;
      lastFrame = null;
      drawPlayIcon();
      update(currentTime);
      return;
    }

    update(currentTime);
    raf = requestAnimationFrame(animationFrame);
  }

  function play() {
    if (currentTime >= maxRaceTime - 0.001) {
      currentTime = 0;
      update(currentTime);
    }

    playing = true;
    lastFrame = null;
    drawPlayIcon();

    if (raf) cancelAnimationFrame(raf);
    raf = requestAnimationFrame(animationFrame);
  }

  function pause() {
    playing = false;
    lastFrame = null;
    drawPlayIcon();

    if (raf) cancelAnimationFrame(raf);
  }

  playButton.on("click", () => {
    if (playing) pause();
    else play();
  });

  function scrub(event) {
    const [mx] = d3.pointer(event, svg.node());
    pause();
    update(sliderScale.invert(mx));
  }

  sliderHit.on("pointerdown", event => {
    scrub(event);

    d3.select(window)
      .on("pointermove.swimming-slider", scrub)
      .on("pointerup.swimming-slider", () => {
        d3.select(window)
          .on("pointermove.swimming-slider", null)
          .on("pointerup.swimming-slider", null);
      });
  });

  drawPlayIcon();
  update(0);

  return container.node();
}


function _3(md){return(
md`[Original](https://flourish.studio/examples/?q=Swimming+race) by Scott Barber (@scottb) on Flourish`
)}

export default function define(runtime, observer) {
  const main = runtime.module();
  function toString() { return this.url; }
  const fileAttachments = new Map([
    ["swimming_race.csv", {url: new URL("./files/f8eb148dd88752efb0f89049e1e44b2be74aad29f8c430b92f41a40a8d9285d56ae1a3d73ee139f50ab494bc943c6c9cb2858cfacfb89dfafd9505c34861117c.csv", import.meta.url), mimeType: "text/csv", toString}]
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], _1);
  main.variable(observer()).define(["FileAttachment"], _2);
  main.variable(observer()).define(["md"], _3);
  return main;
}
