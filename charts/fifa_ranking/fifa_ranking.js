function _1(md){return(
md`# Fifa ranking`
)}

async function _chart(require,FileAttachment)
{
  const d3 = await require("d3@7");
  const raw = await FileAttachment("fifa_ranking.csv").csv({typed: false});

  const width = 1024;
  const height = 712;
  const topN = 15;

  const margin = {top: 110, right: 24, bottom: 140, left: 140};
  const chartRight = 800;
  const chartBottom = 570;

  const parseDate = d3.timeParse("%d/%m/%Y");
  const formatDate = d3.timeFormat("%d/%m/%Y");

  const dateInfo = raw.columns
    .map(key => ({key, date: parseDate(key)}))
    .filter(d => d.date)
    .sort((a, b) => d3.ascending(a.date, b.date));

  const lastIndex = dateInfo.length - 1;

  function number(v) {
    const n = +String(v ?? "").replace(/,/g, "");
    return Number.isFinite(n) ? n : NaN;
  }

  const maxValue = d3.max(raw, d =>
    d3.max(dateInfo, c => number(d[c.key]))
  );

  const maxX = Math.ceil(maxValue / 500) * 500;

  const x = d3.scaleLinear()
    .domain([0, maxX])
    .range([margin.left, chartRight]);

  const y = d3.scaleBand()
    .domain(d3.range(topN))
    .range([margin.top, chartBottom])
    .paddingInner(0.06);

  const sliderLeft = 86;
  const sliderRight = width - 82;

  const sliderX = d3.scaleLinear()
    .domain([0, lastIndex])
    .range([sliderLeft, sliderRight])
    .clamp(true);

  const colorByCountry = new Map(Object.entries({
    "Spain": "#bf0000",
    "Germany": "#bfc5cf",
    "Argentina": "#7fb2df",
    "Italy": "#06479e",
    "Colombia": "#d8c20f",
    "England": "#e8e8e8",
    "Portugal": "#c80018",
    "Netherlands": "#e85b00",
    "Russia": "#c31b20",
    "Croatia": "#df1608",
    "Greece": "#105da8",
    "Ecuador": "#00489d",
    "Switzerland": "#e00000",
    "Cote d'Ivoire": "#d47a0b",
    "Mexico": "#005a3a",
    "Brazil": "#0a8f44",
    "France": "#16499a",
    "Belgium": "#e11b22",
    "Uruguay": "#5aa7d9",
    "USA": "#234c9c",
    "Japan": "#ffffff",
    "Senegal": "#00853f",
    "Morocco": "#c1272d",
    "Denmark": "#c60c30",
    "Poland": "#dc143c",
    "Sweden": "#006aa7",
    "Wales": "#00843d"
  }));

  const regionColor = d3.scaleOrdinal()
    .domain([...new Set(raw.map(d => d.Region))])
    .range(["#2f80ed", "#e63946", "#f2c94c", "#9b51e0", "#27ae60"]);

  function barColor(d) {
    return colorByCountry.get(d.name) || regionColor(d.region);
  }

  function fallbackFlag(name) {
    const initials = String(name)
      .split(/\s+/)
      .map(s => s[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80">
        <circle cx="40" cy="40" r="40" fill="#263a60"/>
        <text x="40" y="49" text-anchor="middle"
          font-family="Arial" font-size="26" fill="white">${initials}</text>
      </svg>`;

    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }

  function flag(d) {
    return d.flag && d.flag.trim() ? d.flag.trim() : fallbackFlag(d.name);
  }

  function interpolatedDate(index) {
    const i0 = Math.floor(index);
    const i1 = Math.min(lastIndex, i0 + 1);
    const p = index - i0;

    const a = dateInfo[i0].date;
    const b = dateInfo[i1].date;

    return new Date(+a + (+b - +a) * p);
  }

  function interpolatedValue(row, index) {
    const i0 = Math.floor(index);
    const i1 = Math.min(lastIndex, i0 + 1);
    const p = index - i0;

    const a = dateInfo[i0];
    const b = dateInfo[i1];

    const va = number(row[a.key]);
    const vb = number(row[b.key]);

    if (!Number.isFinite(va) && !Number.isFinite(vb)) return NaN;
    if (!Number.isFinite(va)) return vb;
    if (!Number.isFinite(vb)) return va;

    return va + (vb - va) * p;
  }

  function rowsForIndex(index) {
    return raw
      .map(d => ({
        name: d.Name || d["Row Labels"] || d.Country || d.Team,
        region: d.Region,
        flag: d.Picture,
        value: interpolatedValue(d, index)
      }))
      .filter(d => d.name && Number.isFinite(d.value))
      .sort((a, b) => d3.descending(a.value, b.value))
      .slice(0, topN)
      .map((d, i) => ({...d, rank: i}));
  }

  const labelledDateKeys = [
    "17/01/2013",
    "28/11/2013",
    "18/09/2014",
    "09/07/2015",
    "05/05/2016",
    "09/03/2017",
    "18/01/2018",
    "29/11/2018",
    "20/02/2020",
    "27/05/2021",
    "06/10/2022"
  ];

  const labelledDates = labelledDateKeys
    .map(key => dateInfo.find(d => d.key === key))
    .filter(Boolean);

  const wrap = document.createElement("div");

  const svg = d3.select(wrap)
    .append("svg")
    .attr("viewBox", [0, 0, width, height])
    .attr("width", width)
    .attr("height", height)
    .style("max-width", "100%")
    .style("height", "auto")
    .style("background", "#06183a")
    .style("font-family", "Arial, Helvetica, sans-serif");

  svg.append("text")
    .attr("x", 24)
    .attr("y", 55)
    .attr("fill", "white")
    .attr("font-size", 40)
    .attr("font-weight", 700)
    .attr("letter-spacing", 3)
    .text("Fifa World Ranking 2013-2023");

  const grid = svg.append("g")
    .attr("transform", `translate(0,${margin.top})`)
    .call(
      d3.axisTop(x)
        .tickValues(d3.range(0, maxX + 1, 500))
        .tickSize(-(chartBottom - margin.top))
        .tickFormat(d3.format("d"))
    );

  grid.select(".domain").remove();

  grid.selectAll("line")
    .attr("stroke", "white")
    .attr("stroke-opacity", 0.33);

  grid.selectAll("text")
    .attr("fill", "white")
    .attr("font-size", 15)
    .attr("dy", "-0.4em");

  const rowsG = svg.append("g");

  const dateLabel = svg.append("text")
    .attr("x", width - 32)
    .attr("y", 565)
    .attr("text-anchor", "end")
    .attr("fill", "white")
    .attr("font-size", 40)
    .attr("font-weight", 700)
    .attr("opacity", 0.95);

  svg.append("text")
    .attr("x", 22)
    .attr("y", 694)
    .attr("fill", "white")
    .attr("font-size", 14)
    .text("Source: Kaggle");

  const sliderY = 631;

  const slider = svg.append("g")
    .attr("transform", `translate(0,${sliderY})`);

  slider.append("line")
    .attr("x1", sliderLeft)
    .attr("x2", sliderRight)
    .attr("y1", 0)
    .attr("y2", 0)
    .attr("stroke", "white")
    .attr("stroke-width", 2)
    .attr("stroke-opacity", 0.9);

  slider.selectAll(".smallTick")
    .data(dateInfo)
    .join("line")
    .attr("class", "smallTick")
    .attr("x1", (d, i) => sliderX(i))
    .attr("x2", (d, i) => sliderX(i))
    .attr("y1", 0)
    .attr("y2", 6)
    .attr("stroke", "white")
    .attr("stroke-opacity", 0.48);

  slider.selectAll(".dateTick")
    .data(labelledDates)
    .join("text")
    .attr("class", "dateTick")
    .attr("x", d => sliderX(dateInfo.indexOf(d)))
    .attr("y", 21)
    .attr("text-anchor", "middle")
    .attr("fill", "white")
    .attr("font-size", 14)
    .text(d => d.key);

  const handle = slider.append("path")
    .attr("d", "M -8 -12 L 8 -12 L 0 0 Z")
    .attr("fill", "white");

  function pointerIndex(event) {
    const [px] = d3.pointer(event, slider.node());
    return sliderX.invert(px);
  }

  const sliderHitbox = slider.append("rect")
    .attr("x", sliderLeft - 15)
    .attr("y", -24)
    .attr("width", sliderRight - sliderLeft + 30)
    .attr("height", 52)
    .attr("fill", "transparent")
    .style("cursor", "pointer");

  const button = svg.append("g")
    .attr("transform", "translate(56,620)")
    .style("cursor", "pointer");

  button.append("circle")
    .attr("r", 22)
    .attr("fill", "#2c3540");

  const playIcon = button.append("path")
    .attr("fill", "white");

  button.on("click", () => {
    playing ? pause() : play();
  });

  let currentIndex = 0;
  let playing = false;
  let timer = null;
  let lastFrame = 0;

  function updateIcon() {
    if (playing) {
      playIcon.attr("d", "M -7 -9 H -2 V 9 H -7 Z M 3 -9 H 8 V 9 H 3 Z");
    } else {
      playIcon.attr("d", "M -5 -11 L 12 0 L -5 11 Z");
    }
  }

  function render(index, duration = 0) {
    const rows = rowsForIndex(index);

    dateLabel.text(formatDate(interpolatedDate(index)));

    handle
      .interrupt()
      .transition()
      .duration(duration)
      .ease(d3.easeLinear)
      .attr("transform", `translate(${sliderX(index)},0)`);

    const t = svg.transition()
      .duration(duration)
      .ease(d3.easeCubicOut);

    const row = rowsG.selectAll(".row")
      .data(rows, d => d.name);

    const rowEnter = row.enter()
      .append("g")
      .attr("class", "row")
      .attr("opacity", 0)
      .attr("transform", d => `translate(0,${y(d.rank)})`);

    rowEnter.append("text")
      .attr("class", "name")
      .attr("x", margin.left - 8)
      .attr("y", y.bandwidth() / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", "end")
      .attr("fill", "white")
      .attr("font-size", 20);

    rowEnter.append("rect")
      .attr("class", "bar")
      .attr("x", margin.left)
      .attr("y", 0)
      .attr("height", y.bandwidth());

    rowEnter.append("image")
      .attr("class", "flag")
      .attr("width", 26)
      .attr("height", 26)
      .attr("y", (y.bandwidth() - 26) / 2)
      .attr("preserveAspectRatio", "xMidYMid slice")
      .style("clip-path", "circle(50%)");

    rowEnter.append("text")
      .attr("class", "value")
      .attr("y", y.bandwidth() / 2)
      .attr("dy", "0.35em")
      .attr("fill", "white")
      .attr("font-size", 21);

    const rowMerge = rowEnter.merge(row);

    rowMerge.interrupt();

    rowMerge.select(".name")
      .text(d => d.name);

    rowMerge.select(".bar")
      .attr("fill", barColor);

    rowMerge.select(".flag")
      .attr("href", flag);

    rowMerge
      .transition(t)
      .attr("opacity", 1)
      .attr("transform", d => `translate(0,${y(d.rank)})`);

    rowMerge.select(".bar")
      .interrupt()
      .transition(t)
      .attr("width", d => Math.max(0, x(d.value) - margin.left));

    rowMerge.select(".flag")
      .interrupt()
      .transition(t)
      .attr("x", d => Math.max(margin.left + 4, x(d.value) - 32));

    rowMerge.select(".value")
      .interrupt()
      .transition(t)
      .attr("x", d => x(d.value) + 12)
      .tween("text", function(d) {
        const start = +this.textContent.replace(/,/g, "") || d.value;
        const interp = d3.interpolateNumber(start, d.value);
        return p => {
          this.textContent = d3.format(",d")(Math.round(interp(p)));
        };
      });

    row.exit()
      .interrupt()
      .transition(t)
      .attr("opacity", 0)
      .remove();
  }

  function setIndex(index, duration = 250) {
    currentIndex = Math.max(0, Math.min(lastIndex, index));
    render(currentIndex, duration);
  }

  sliderHitbox
    .on("pointerdown", event => {
      pause(false);
      setIndex(pointerIndex(event), 350);
    })
    .call(
      d3.drag()
        .on("start drag", event => {
          pause(false);
          setIndex(sliderX.invert(event.x), 80);
        })
        .on("end", event => {
          setIndex(sliderX.invert(event.x), 300);
        })
    );

  function play() {
    if (currentIndex >= lastIndex) {
      setIndex(0, 0);
    }

    playing = true;
    updateIcon();

    // Controls the animation speed.
    // Smaller = faster. Bigger = slower.
    const playDurationMs = 100000;

    const indexSpeed = lastIndex / playDurationMs;
    const playStartIndex = currentIndex;

    lastFrame = 0;

    timer = d3.timer(elapsed => {
      if (elapsed - lastFrame < 120) return;
      lastFrame = elapsed;

      let nextIndex = playStartIndex + elapsed * indexSpeed;

      if (nextIndex > lastIndex) {
        nextIndex = nextIndex % lastIndex;
      }

      setIndex(nextIndex, 180);
    });
  }

  function pause(snap = true) {
    playing = false;
    updateIcon();

    if (timer) {
      timer.stop();
      timer = null;
    }

    if (snap) {
      setIndex(currentIndex, 250);
    }
  }

  updateIcon();
  render(currentIndex, 0);

  return wrap;
}


function _3(md){return(
md`Original by joseph (@josephw) on [Flourish](https://flourish.studio/examples/?q=Fifa+ranking) `
)}

export default function define(runtime, observer) {
  const main = runtime.module();
  function toString() { return this.url; }
  const fileAttachments = new Map([
    ["fifa_ranking.csv", {url: new URL("./files/d31c4fe8ec0971d06d9feeed1f28d6202b5b08f3cadb41575efc730b9741a87d4a70f45099d7bf0bba3fac19bfe2d00046dfdd3f682b4b4a8cdabdadeff7f1c2.csv", import.meta.url), mimeType: "text/csv", toString}]
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], _1);
  main.variable(observer("chart")).define("chart", ["require","FileAttachment"], _chart);
  main.variable(observer()).define(["md"], _3);
  return main;
}
