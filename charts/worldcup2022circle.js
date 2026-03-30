function _1(md){return(
md`# World Cup 2022 Circle`
)}

async function _2(FileAttachment,d3,html)
{
  const raw = await FileAttachment("World Cup 2022 Circle.csv").csv({ typed: true });

  const countryNameMap = new Map([
    ["FRA", "France"],
    ["ENG", "England"],
    ["ESP", "Spain"],
    ["GER", "Germany"],
    ["ITA", "Italy"],
    ["NED", "Netherlands"],
    ["POR", "Portugal"],
    ["BEL", "Belgium"],
    ["SUI", "Switzerland"],
    ["DEN", "Denmark"],
    ["USA", "United States"],
    ["MEX", "Mexico"],
    ["ARG", "Argentina"],
    ["BRA", "Brazil"],
    ["URU", "Uruguay"],
    ["KOR", "South Korea"],
    ["JPN", "Japan"],
    ["QAT", "Qatar"],
    ["KSA", "Saudi Arabia"],
    ["CAN", "Canada"],
    ["AUS", "Australia"],
    ["IRN", "Iran"],
    ["SEN", "Senegal"],
    ["MAR", "Morocco"],
    ["TUN", "Tunisia"],
    ["POL", "Poland"],
    ["CRO", "Croatia"],
    ["SRB", "Serbia"],
    ["CMR", "Cameroon"],
    ["GHA", "Ghana"],
    ["ECU", "Ecuador"],
    ["WAL", "Wales"]
  ]);

  // ----------------------------
  // 1) Clean data
  // ----------------------------
  const data = raw
    .map(d => ({
      player: String(d.Player || "").trim(),
      club: String(d.Club || "").trim(),
      clubCountry: countryNameMap.get(String(d["Club Country"] || "").trim()) 
        || String(d["Club Country"] || "").trim(),
      federation: String(d.Federation || "").trim(),
      nationalTeam: String(d["Country.1"] || d.Country || "").trim(),
      value: +d["Number of Players:"] || 1
    }))
    .filter(d => d.player && d.club && d.clubCountry);

  // ----------------------------
  // 2) Build hierarchy: Club Country -> Club
  // ----------------------------
  const countryMap = d3.rollup(
    data,
    countryRows => {
      const clubs = Array.from(
        d3.rollup(
          countryRows,
          rows => d3.sum(rows, d => d.value),
          d => d.club
        ),
        ([club, value]) => ({
          name: club,
          value
        })
      ).sort((a, b) => d3.descending(a.value, b.value));

      return { children: clubs };
    },
    d => d.clubCountry
  );

  const hierarchyData = {
    name: "World Cup 2022",
    children: Array.from(countryMap, ([country, obj]) => ({
      name: country,
      children: obj.children
    }))
  };

  // ----------------------------
  // 3) Layout
  // ----------------------------
  const width = 1024;
  const height = 1024;
  const bg = "#222222";
  const countryFill = "#045fc8";
  const countryStroke = "#1178f2";

  const root = d3.hierarchy(hierarchyData)
    .sum(d => d.value || 0)
    .sort((a, b) => b.value - a.value);

  d3.pack()
    .size([width, height])
    .padding(d => d.depth === 1 ? 9 : 3)(root);

  const countryNodes = root.descendants().filter(d => d.depth === 1);
  const clubNodes = root.descendants().filter(d => d.depth === 2);

  countryNodes.forEach(d => {
    d.totalPlayers = d3.sum(d.children || [], c => c.value);
  });

  // ----------------------------
  // 4) Colors
  // ----------------------------
  const palette = [
    "#f62f2f", "#0c4fb6", "#7ac0f6", "#ffd819", "#ff7a1a",
    "#1db954", "#000000", "#ffffff", "#bf0d66", "#6a3fb5",
    "#00a7e1", "#8c1c13", "#4caf50", "#c62828", "#1e88e5",
    "#f4511e", "#7b1fa2", "#43a047", "#3949ab", "#8d6e63"
  ];

  const clubColorScale = d3.scaleOrdinal()
    .domain([...new Set(clubNodes.map(d => d.data.name))])
    .range(palette);

  const specialClubColors = new Map([
    ["Juventus", "#000000"],
    ["Borussia Dortmund", "#f6df00"],
    ["FC Barcelona", "#a30059"],
    ["Real Madrid CF", "#0b57b7"],
    ["Atlético de Madrid", "#e65c2a"],
    ["AC Milan", "#ff1f3d"],
    ["Ajax", "#e8202e"],
    ["FC Porto", "#0070dc"],
    ["Benfica", "#ff002b"],
    ["Paris Saint Germain", "#0b4ea2"],
    ["Paris Saint-Germain", "#0b4ea2"],
    ["Chelsea", "#004fb6"],
    ["Arsenal", "#f01d25"],
    ["Manchester City", "#7db7e8"],
    ["Manchester United", "#ff4c1e"],
    ["Bayern München", "#ff2145"],
    ["Bayern Munich", "#ff2145"],
    ["RB Leipzig", "#ff1138"],
    ["Celtic", "#20a44b"],
    ["Sevilla", "#ff463f"],
    ["Real Betis Balompié", "#37a844"],
    ["Villarreal CF", "#f7e268"],
    ["Al Sadd", "#1272e2"],
    ["Al Duhail", "#ff1738"],
    ["Al Hilal Saudi", "#198bff"],
    ["Al Nassr Saudi", "#ffd700"],
    ["Club Brugge", "#0d58c8"],
    ["River Plate", "#e9eef5"],
    ["FC Seoul", "#ff1832"],
    ["León", "#1db954"],
    ["Kawasaki Frontale", "#1fb5e9"]
  ]);

  function clubColor(d) {
    return specialClubColors.get(d.data.name) || clubColorScale(d.data.name);
  }

  function textColor(fill) {
    const c = d3.color(fill);
    const luminance = (0.299 * c.r + 0.587 * c.g + 0.114 * c.b) / 255;
    return luminance > 0.68 ? "#1a1a1a" : "#ffffff";
  }

  // ----------------------------
  // 5) Container
  // ----------------------------
  const container = html`<div style="position:relative; width:100%; max-width:${width}px; margin:auto;"></div>`;

  // ----------------------------
  // 6) Dropdown
  // ----------------------------
  const controls = d3.select(container)
    .append("div")
    .style("margin", "0 0 10px 0");

  const select = controls.append("select")
    .style("font-size", "16px")
    .style("padding", "6px 10px")
    .style("background", "#222")
    .style("color", "white")
    .style("border", "1px solid #777")
    .style("border-radius", "4px");

  const countryOptions = ["All", ...countryNodes.map(d => d.data.name).sort(d3.ascending)];

  select.selectAll("option")
    .data(countryOptions)
    .join("option")
    .attr("value", d => d)
    .text(d => d);

  // ----------------------------
  // 7) Tooltip
  // ----------------------------
  const tooltip = d3.select(container)
    .append("div")
    .style("position", "absolute")
    .style("pointer-events", "none")
    .style("opacity", 0)
    .style("background", "#fff")
    .style("color", "#222")
    .style("border", "1px solid #999")
    .style("box-shadow", "0 4px 12px rgba(0,0,0,0.35)")
    .style("font-family", "sans-serif")
    .style("font-size", "14px")
    .style("min-width", "190px")
    .style("z-index", "20");

  function showClubTooltip(event, d) {
    tooltip
      .style("opacity", 1)
      .html(`
        <div style="background:#333; color:#fff; padding:8px 10px; font-weight:700;">
          ${d.data.name}
        </div>
        <div style="padding:8px 10px;">
          <div style="display:flex; justify-content:space-between; gap:16px; margin:4px 0;">
            <span>Country</span>
            <span>${d.parent.data.name}</span>
          </div>
          <div style="display:flex; justify-content:space-between; gap:16px; margin:4px 0;">
            <span>Number of Players:</span>
            <span>${d.value}</span>
          </div>
        </div>
      `);

    const bounds = container.getBoundingClientRect();
    tooltip
      .style("left", `${event.clientX - bounds.left + 16}px`)
      .style("top", `${event.clientY - bounds.top + 16}px`);
  }

  function showCountryTooltip(event, d) {
    tooltip
      .style("opacity", 1)
      .html(`
        <div style="background:#333; color:#fff; padding:8px 10px; font-weight:700;">
          ${d.data.name}
        </div>
        <div style="padding:8px 10px;">
          <div style="display:flex; justify-content:space-between; gap:16px; margin:4px 0;">
            <span>Number of Players:</span>
            <span>${d.totalPlayers}</span>
          </div>
        </div>
      `);

    const bounds = container.getBoundingClientRect();
    tooltip
      .style("left", `${event.clientX - bounds.left + 16}px`)
      .style("top", `${event.clientY - bounds.top + 16}px`);
  }

  function hideTooltip() {
    tooltip.style("opacity", 0);
  }

  // ----------------------------
  // 8) SVG
  // ----------------------------
  const svg = d3.create("svg")
    .attr("viewBox", [0, 0, width, height])
    .attr("width", width)
    .attr("height", height)
    .style("max-width", "100%")
    .style("height", "auto")
    .style("display", "block")
    .style("background", bg)
    .style("font-family", "Arial, Helvetica, sans-serif");

  svg.append("rect")
    .attr("width", width)
    .attr("height", height)
    .attr("fill", bg);

  const defs = svg.append("defs");

  // ----------------------------
  // 9) Country circles
  // ----------------------------
  const countryCircle = svg.append("g")
    .selectAll("circle")
    .data(countryNodes)
    .join("circle")
    .attr("cx", d => d.x)
    .attr("cy", d => d.y)
    .attr("r", d => d.r)
    .attr("fill", countryFill)
    .attr("stroke", countryStroke)
    .attr("stroke-width", 2)
    .on("mouseenter", function(event, d) {
      d3.select(this)
        .attr("stroke", "#ffffff")
        .attr("stroke-width", 3);
      showCountryTooltip(event, d);
    })
    .on("mousemove", function(event, d) {
      showCountryTooltip(event, d);
    })
    .on("mouseleave", function() {
      d3.select(this)
        .attr("stroke", countryStroke)
        .attr("stroke-width", 2);
      hideTooltip();
    });

  // ----------------------------
  // 10) Curved country labels
  // ----------------------------
  function arcPathTop(cx, cy, r) {
    const rr = Math.max(10, r - 10);
    const a0 = -145 * Math.PI / 180;
    const a1 = -35 * Math.PI / 180;
    const x0 = cx + rr * Math.cos(a0);
    const y0 = cy + rr * Math.sin(a0);
    const x1 = cx + rr * Math.cos(a1);
    const y1 = cy + rr * Math.sin(a1);
    return `M ${x0} ${y0} A ${rr} ${rr} 0 0 1 ${x1} ${y1}`;
  }

  countryNodes.forEach((d, i) => {
    defs.append("path")
      .attr("id", `country-arc-${i}`)
      .attr("d", arcPathTop(d.x, d.y, d.r));
  });

  svg.append("g")
    .selectAll("text")
    .data(countryNodes)
    .join("text")
    .style("font-weight", 800)
    .style("font-size", d => `${Math.max(10, Math.min(25, d.r / 4.8))}px`)
    .style("letter-spacing", "0.5px")
    .attr("fill", "#ffffff")
    .append("textPath")
    .attr("href", (_, i) => `#country-arc-${i}`)
    .attr("startOffset", "50%")
    .attr("text-anchor", "middle")
    .text(d => d.data.name.toUpperCase());

  // ----------------------------
  // 11) Club circles
  // ----------------------------
  const clubCircle = svg.append("g")
    .selectAll("circle")
    .data(clubNodes)
    .join("circle")
    .attr("cx", d => d.x)
    .attr("cy", d => d.y)
    .attr("r", d => d.r)
    .attr("fill", d => clubColor(d))
    .attr("stroke", d => d3.color(clubColor(d)).darker(0.7))
    .attr("stroke-width", d => d.r < 10 ? 0.8 : 1.2)
    .on("mouseenter", function(event, d) {
      d3.select(this)
        .raise()
        .attr("stroke", "#ffffff")
        .attr("stroke-width", 2.5);
      showClubTooltip(event, d);
    })
    .on("mousemove", function(event, d) {
      showClubTooltip(event, d);
    })
    .on("mouseleave", function(event, d) {
      d3.select(this)
        .attr("stroke", d3.color(clubColor(d)).darker(0.7))
        .attr("stroke-width", d.r < 10 ? 0.8 : 1.2);
      hideTooltip();
    });

  // ----------------------------
  // 12) Club labels
  // ----------------------------
  const labelLayer = svg.append("g");

  function wrapWords(label, maxChars) {
    const words = label.split(/\s+/);
    const lines = [];
    let line = [];

    for (const w of words) {
      const test = [...line, w].join(" ");
      if (test.length <= maxChars) {
        line.push(w);
      } else {
        if (line.length) lines.push(line.join(" "));
        line = [w];
      }
    }
    if (line.length) lines.push(line.join(" "));
    return lines;
  }

  labelLayer.selectAll("g")
    .data(clubNodes)
    .join("g")
    .attr("transform", d => `translate(${d.x},${d.y})`)
    .each(function(d) {
      const g = d3.select(this);
      const r = d.r;
      const fill = clubColor(d);
      const color = textColor(fill);

      if (r < 8.5) return;

      const fontSize =
        r >= 44 ? Math.min(18, r / 2.5) :
        r >= 28 ? Math.min(14, r / 2.6) :
        r >= 16 ? Math.min(10, r / 2.8) :
        6.5;

      const text = g.append("text")
        .attr("text-anchor", "middle")
        .attr("fill", color)
        .style("font-size", `${fontSize}px`)
        .style("font-weight", d.value >= 3 ? 700 : 600)
        .style("pointer-events", "none");

      if (r < 12) {
        text
          .attr("dy", "0.35em")
          .text(d.data.name.split(/\s+/)[0].slice(0, 3));
        return;
      }

      const maxChars =
        r >= 44 ? 12 :
        r >= 28 ? 10 :
        r >= 18 ? 8 : 6;

      const maxLines =
        r >= 44 ? 4 :
        r >= 28 ? 3 :
        r >= 18 ? 2 : 1;

      const lines = wrapWords(d.data.name, maxChars).slice(0, maxLines);

      lines.forEach((line, i) => {
        text.append("tspan")
          .attr("x", 0)
          .attr("dy", i === 0 ? `${-0.55 * (lines.length - 1)}em` : "1.05em")
          .text(line);
      });
    });

  // ----------------------------
  // 13) Zoom helpers
  // ----------------------------
  let currentView = [0, 0, width, height];
  svg.attr("viewBox", currentView.join(" "));
  
  function setViewBox(v) {
    currentView = v;
    svg.attr("viewBox", v.join(" "));
  }
  
  function animateViewBox(target, duration = 900) {
    const start = currentView.slice();
    const interp = d3.interpolateArray(start, target);
  
    d3.transition()
      .duration(duration)
      .tween("zoom-viewbox", () => t => {
        setViewBox(interp(t));
      });
  }
  
  function zoomToCountry(name) {
    if (name === "All") {
      animateViewBox([0, 0, width, height]);
      return;
    }
  
    const d = countryNodes.find(n => n.data.name === name);
    if (!d) return;
  
    const pad = 30;
    const target = [
      d.x - d.r - pad,
      d.y - d.r - pad,
      2 * (d.r + pad),
      2 * (d.r + pad)
    ];
  
    animateViewBox(target);
  }
  
  select.on("change", function() {
    zoomToCountry(this.value);
  });
  
  // optional: click bubble to zoom too
  countryCircle.on("click", function(event, d) {
    select.property("value", d.data.name);
    zoomToCountry(d.data.name);
  });

  container.appendChild(svg.node());
  return container;
}


export default function define(runtime, observer) {
  const main = runtime.module();
  function toString() { return this.url; }
  const fileAttachments = new Map([
    ["World Cup 2022 Circle.csv", {url: new URL("./files/6617724f990b5f1c007c278726905f6fe9b5c5d8a2cc4f7024119da97c10ed116683e7b53b444250d545f707b41371f77290f20dc712284d0b534d7b9632176b.csv", import.meta.url), mimeType: "text/csv", toString}]
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], _1);
  main.variable(observer()).define(["FileAttachment","d3","html"], _2);
  return main;
}
