function _1(md){return(
md`# Chelsea Transfer Fee`
)}

function _2(d3)
{
  // ===== 1) DATA =====
  const hierarchyData = {
    name: "root",
    children: [
      {
        name: "Premier League",
        children: [
          { name: "Arsenal", children: [
            { name: "Timber", value: 40.00 },
            { name: "Havertz", value: 75.00 },
            { name: "Rice", value: 116.60 }
          ]},
          { name: "Aston Villa", children: [
            { name: "Torres", value: 33.00 },
            { name: "Diaby", value: 55.00 }
          ]},
          { name: "Bournemouth", children: [
            { name: "Aarons", value: 8.10 },
            { name: "Kluivert", value: 11.20 },
            { name: "Faivre", value: 15.00 },
            { name: "Kerkez", value: 17.87 },
            { name: "Scott", value: 23.00 },
            { name: "Traorè", value: 25.62 },
            { name: "Adams", value: 26.90 }
          ]},
          { name: "Brentford", children: [
            { name: "Flekken", value: 13.00 },
            { name: "Schade", value: 25.00 },
            { name: "Collins", value: 26.85 }
          ]},
          { name: "Brighton", children: [
            { name: "Igor", value: 17.00 },
            { name: "Verbruggen", value: 20.00 },
            { name: "Baleba", value: 27.00 },
            { name: "Pedro", value: 34.20 }
          ]},
          { name: "Burnley", children: [
            { name: "Delcroix", value: 3.00 },
            { name: "Koleosho", value: 3.00 },
            { name: "Obafemi", value: 4.00 },
            { name: "O'Shea", value: 7.80 },
            { name: "Odobert", value: 12.00 },
            { name: "Berge", value: 13.90 },
            { name: "Beyer", value: 15.00 },
            { name: "Ramsey", value: 16.45 },
            { name: "Trafford", value: 17.30 },
            { name: "Amdouni", value: 18.60 }
          ]},
          { name: "Chelsea", children: [
            { name: "Ângelo", value: 15.00 },
            { name: "Washington", value: 16.00 },
            { name: "Petrovic", value: 16.00 },
            { name: "Sánchez", value: 23.00 },
            { name: "Ugochukwu", value: 27.00 },
            { name: "Jackson", value: 37.00 },
            { name: "Disasi", value: 45.00 },
            { name: "Palmer", value: 47.00 },
            { name: "Nkunku", value: 60.00 },
            { name: "Lavia", value: 62.10 },
            { name: "Caicedo", value: 116.00 }
          ]},
          { name: "Crystal Palace", children: [
            { name: "Holding", value: 1.20 },
            { name: "Henderson", value: 17.50 },
            { name: "França", value: 20.00 }
          ]},
          { name: "Everton", children: [
            { name: "Chermiti", value: 12.50 },
            { name: "Beto", value: 25.00 }
          ]},
          { name: "Fulham", children: [
            { name: "Benda", value: 1.15 },
            { name: "Jiménez", value: 6.40 },
            { name: "Castagne", value: 13.00 },
            { name: "Bassey", value: 22.50 },
            { name: "Iwobi", value: 25.70 }
          ]},
          { name: "Liverpool", children: [
            { name: "Endo", value: 20.00 },
            { name: "Gravenberch", value: 40.00 },
            { name: "Mac Allister", value: 42.00 },
            { name: "Szoboszlai", value: 70.00 }
          ]},
          { name: "Luton", children: [
            { name: "Nakamba", value: 2.90 },
            { name: "Brown", value: 2.90 },
            { name: "Kaminski", value: 2.90 },
            { name: "Andersen", value: 3.50 },
            { name: "Chong", value: 4.70 },
            { name: "Giles", value: 5.85 }
          ]},
          { name: "Manchester City", children: [
            { name: "Kovacic", value: 29.10 },
            { name: "Doku", value: 60.00 },
            { name: "Nunes", value: 62.00 },
            { name: "Gvardiol", value: 90.00 }
          ]},
          { name: "Manchester United", children: [
            { name: "Bayindir", value: 5.00 },
            { name: "Onana", value: 52.50 },
            { name: "Mount", value: 64.20 },
            { name: "Højlund", value: 75.00 }
          ]},
          { name: "Newcastle", children: [
            { name: "Minteh", value: 8.00 },
            { name: "Livramento", value: 37.20 },
            { name: "Barnes", value: 44.00 },
            { name: "Tonali", value: 64.00 }
          ]},
          { name: "Nottingham Forest", children: [
            { name: "Hudson-Odoi", value: 3.50 },
            { name: "Turner", value: 8.15 },
            { name: "Vlachodimos", value: 9.00 },
            { name: "Domínguez", value: 10.00 },
            { name: "Murillo", value: 12.00 },
            { name: "Omobamidele", value: 12.85 },
            { name: "Wood", value: 17.00 },
            { name: "Elanga", value: 17.50 },
            { name: "Sangaré", value: 35.00 }
          ]},
          { name: "Sheffield United", children: [
            { name: "Slimane", value: 2.70 },
            { name: "Traoré", value: 4.60 },
            { name: "Trusty", value: 5.80 },
            { name: "Souza", value: 12.50 },
            { name: "Hamer", value: 17.30 },
            { name: "Archer", value: 21.55 }
          ]},
          { name: "Tottenham", children: [
            { name: "Phillips", value: 2.30 },
            { name: "Véliz", value: 15.00 },
            { name: "Vicario", value: 20.00 },
            { name: "Kulusevski", value: 30.00 },
            { name: "van de Ven", value: 40.00 },
            { name: "Porro", value: 40.00 },
            { name: "Maddison", value: 46.30 },
            { name: "Johnson", value: 55.00 }
          ]},
          { name: "West Ham", children: [
            { name: "Irving", value: 1.76 },
            { name: "Mavropanos", value: 20.00 },
            { name: "Ward-Prowse", value: 34.80 },
            { name: "Álvarez", value: 38.00 },
            { name: "Kudus", value: 43.00 }
          ]},
          { name: "Wolves", children: [
            { name: "González", value: 6.00 },
            { name: "Traoré", value: 11.00 },
            { name: "Bueno", value: 12.00 },
            { name: "Bellegarde", value: 15.00 },
            { name: "Cunha", value: 50.00 }
          ]}
        ]
      },
      { name: "La Liga", value: 440.85 },
      { name: "Saudi Pro League", value: 956.88 },
      { name: "Ligue 1", value: 907.14 },
      { name: "Serie A", value: 868.15 },
      { name: "Bundesliga", value: 743.08 },
      { name: "Eredivisie", value: 230.05 },
      { name: "Championship", value: 215.66 },
      { name: "Liga Portugal", value: 190.83 },
      { name: "Qatar Stars League", value: 163.47 }
    ]
  };

  // ===== 2) DIMENSIONS =====
  const width = 1100;
  const height = 720;
  const bg = "#1a1a6e";

  // ===== 3) PACK =====
  const leagueRoot = d3.pack()
    .size([width, height])
    .padding(4)(
      d3.hierarchy(hierarchyData)
        .sum(d => d.children ? 0 : (d.value ?? 0))
        .sort((a, b) => b.value - a.value)
    );

  // ===== 4) STATE =====
  let currentFocus = leagueRoot;
  let currentView = [leagueRoot.x, leagueRoot.y, leagueRoot.r * 2];
  let zoomedClub = null;
  let playerNodes = [];

  // ===== 5) COLORS =====
  const leagueColors = {
    "Premier League": "#2d5fa8",
    "La Liga": "#c0392b",
    "Saudi Pro League": "#1a7a4a",
    "Ligue 1": "#3568b0",
    "Serie A": "#1a6696",
    "Bundesliga": "#a83230",
    "Eredivisie": "#cc5500",
    "Championship": "#5a5aaa",
    "Liga Portugal": "#2e8b57",
    "Qatar Stars League": "#7a6010"
  };

  const leagueStroke = {
    "Premier League": "#1e4a8c",
    "La Liga": "#922b21",
    "Saudi Pro League": "#145f39",
    "Ligue 1": "#2a5090",
    "Serie A": "#135080",
    "Bundesliga": "#8b2020",
    "Eredivisie": "#a84000",
    "Championship": "#44448a",
    "Liga Portugal": "#236b42",
    "Qatar Stars League": "#5a4500"
  };

  function getLeagueColor(name) { return leagueColors[name] || "#3a5a8a"; }
  function getLeagueStroke(name) { return leagueStroke[name] || "#1e3a6a"; }
  function clubFill(clubName) { return clubName === "Chelsea" ? "#f5c518" : "#4a7abd"; }
  function clubStroke(clubName) { return clubName === "Chelsea" ? "#c89a00" : "#2d5090"; }

  // ===== 6) CONTAINER =====
  const container = document.createElement("div");
  container.style.cssText = "position:relative; font-family:'Helvetica Neue',Arial,sans-serif; user-select:none;";

  const titleDiv = document.createElement("div");
  titleDiv.style.cssText = `background:${bg}; padding:24px 32px 10px;`;
  titleDiv.innerHTML = `
    <div style="font-size:clamp(20px,2.8vw,36px);font-weight:900;color:white;line-height:1.2;margin-bottom:6px">
      <span style="color:#f5c518">Chelsea</span> spent more than the whole of
      <span style="color:#e84040">La Liga</span> on summer transfers
    </div>
    <div style="font-size:15px;color:#ccd3ff;margin-bottom:8px">Summer 2023 total transfer fees by league</div>
    <div id="ob-bc" style="font-size:13px;color:#9aa6ff;min-height:18px">
      Click a league to zoom in • Click background to zoom out
    </div>
  `;
  container.appendChild(titleDiv);

  // ===== 7) TOOLTIP =====
  const tooltip = document.createElement("div");
  tooltip.style.cssText = `
    position:absolute; display:none;
    background:rgba(10,10,50,0.96);
    border:1px solid rgba(255,255,255,0.18);
    color:white; padding:10px 14px;
    border-radius:10px; font-size:13px; line-height:1.65;
    box-shadow:0 6px 24px rgba(0,0,0,0.55);
    pointer-events:none; z-index:100;
    min-width:170px; max-width:240px;
  `;
  container.appendChild(tooltip);

  function positionTooltip(svgEl, cx, cy, r) {
    const svgRect = svgEl.getBoundingClientRect();
    const contRect = container.getBoundingClientRect();
    const scaleX = svgRect.width / width;
    const scaleY = svgRect.height / height;
    const k = width / currentView[2];

    const sx = (cx - currentView[0]) * k + width / 2;
    const sy = (cy - currentView[1]) * k + height / 2;

    let tx = svgRect.left - contRect.left + sx * scaleX + r * k * scaleX + 12;
    let ty = svgRect.top - contRect.top + sy * scaleY - 16;

    tooltip.style.display = "block";
    const ttW = 220;
    if (tx + ttW > contRect.width - 8) {
      tx = svgRect.left - contRect.left + sx * scaleX - r * k * scaleX - ttW - 12;
    }
    if (ty < 4) ty = 4;

    tooltip.style.left = `${tx}px`;
    tooltip.style.top = `${ty}px`;
  }

  // ===== 8) SVG =====
  const svg = d3.create("svg")
    .attr("viewBox", [0, 0, width, height])
    .attr("width", width)
    .attr("height", height)
    .style("display", "block")
    .style("max-width", "100%")
    .style("height", "auto")
    .style("background", bg)
    .style("cursor", "pointer");

  const defs = svg.append("defs");

  // ===== 9) GROUPS =====
  const leagueCircleG = svg.append("g");
  const clubCircleG = svg.append("g");
  const playerCircleG = svg.append("g");
  const arcLabelG = svg.append("g").style("pointer-events", "none");
  const clubLabelG = svg.append("g").style("pointer-events", "none");
  const playerLabelG = svg.append("g").style("pointer-events", "none");

  // ===== 10) NODES =====
  const allNodes = leagueRoot.descendants();
  const leagueNodes = allNodes.filter(d => d.depth === 1);
  const clubNodes = allNodes.filter(d => d.depth === 2);

  leagueCircleG.selectAll("circle")
    .data(leagueNodes)
    .join("circle")
    .attr("fill", d => getLeagueColor(d.data.name))
    .attr("fill-opacity", 0.85)
    .attr("stroke", d => getLeagueStroke(d.data.name))
    .attr("stroke-width", 1.5)
    .style("cursor", "pointer");

  clubCircleG.selectAll("circle")
    .data(clubNodes)
    .join("circle")
    .attr("fill", d => clubFill(d.data.name))
    .attr("fill-opacity", 0.82)
    .attr("stroke", d => clubStroke(d.data.name))
    .attr("stroke-width", d => d.data.name === "Chelsea" ? 2.5 : 1.5)
    .style("cursor", "pointer");

  // ===== 11) CLUB LABELS =====
  clubLabelG.selectAll("g")
    .data(clubNodes)
    .join("g")
    .attr("class", "club-label-group")
    .attr("text-anchor", "middle")
    .call(g => {
      g.append("text")
        .attr("class", "club-name")
        .attr("dy", "-0.25em")
        .style("fill", "white")
        .style("font-weight", "700");

      g.append("text")
        .attr("class", "club-fee")
        .attr("dy", "1em")
        .style("fill", "white")
        .style("opacity", "0.88");
    });

  // ===== 12) ARC LABELS =====
  function buildArcLabels() {
    arcLabelG.selectAll("*").remove();
    defs.selectAll(".arc-path-def").remove();

    const k = width / currentView[2];

    leagueNodes.forEach(d => {
      const cx = (d.x - currentView[0]) * k + width / 2;
      const cy = (d.y - currentView[1]) * k + height / 2;
      const r = d.r * k;
      const inset = Math.max(4, r * 0.06);
      const ar = r - inset;
      const id = `arcpath-${d.data.name.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9-]/g, "")}`;

      defs.append("path")
        .attr("class", "arc-path-def")
        .attr("id", id)
        .attr("d", `M ${cx - ar},${cy} A ${ar},${ar} 0 0,1 ${cx + ar},${cy}`);

      const fs = Math.max(8, Math.min(14, r * 0.095));

      arcLabelG.append("text")
        .style("font-size", `${fs}px`)
        .style("font-weight", "800")
        .style("fill", "white")
        .style("opacity", "0.92")
        .style("letter-spacing", "0.6px")
        .attr("dy", "0.3em")
        .append("textPath")
        .attr("href", `#${id}`)
        .attr("startOffset", "50%")
        .attr("text-anchor", "middle")
        .text(d.data.name.toUpperCase());
    });
  }

  // ===== 13) PLAYER RENDER =====
  function renderPlayerBubbles(clubNode) {
    playerCircleG.selectAll("*").remove();
    playerLabelG.selectAll("*").remove();
    playerNodes = [];

    if (!clubNode || !clubNode.data.children) return;

    const diameter = clubNode.r * 2;

    const packed = d3.pack()
      .size([diameter, diameter])
      .padding(4)(
        d3.hierarchy({ children: clubNode.data.children })
          .sum(d => d.value || 0)
          .sort((a, b) => b.value - a.value)
      );

    const offsetX = clubNode.x - clubNode.r;
    const offsetY = clubNode.y - clubNode.r;

    playerNodes = packed.descendants().slice(1).map(d => ({
      ...d,
      absX: offsetX + d.x,
      absY: offsetY + d.y
    }));

    const isChelsea = clubNode.data.name === "Chelsea";

    playerCircleG.selectAll("circle")
      .data(playerNodes)
      .join("circle")
      .attr("fill", isChelsea ? "#f5db69" : "#7fa1d1")
      .attr("fill-opacity", 0.9)
      .attr("stroke", isChelsea ? "#c89a00" : "#4f73a7")
      .attr("stroke-width", 1.2)
      .on("mouseover", function(event, d) {
        tooltip.innerHTML = `
          <div style="font-size:11px;color:#aab6ff;margin-bottom:4px">${clubNode.parent.data.name}</div>
          <div><strong>Player:</strong> ${d.data.name}</div>
          <div><strong>Club:</strong> ${clubNode.data.name}</div>
          <div><strong>Fee:</strong> €${d.data.value}m</div>
        `;
        positionTooltip(svg.node(), d.absX, d.absY, d.r);
      })
      .on("mousemove", function(event, d) {
        positionTooltip(svg.node(), d.absX, d.absY, d.r);
      })
      .on("mouseout", function() {
        tooltip.style.display = "none";
      });

    const labelGroups = playerLabelG.selectAll("g")
      .data(playerNodes)
      .join("g")
      .attr("class", "player-label-group")
      .attr("text-anchor", "middle");

    labelGroups.append("text")
      .attr("class", "player-name")
      .attr("dy", "-0.25em")
      .style("fill", "white")
      .style("font-weight", "700")
      .text(d => d.data.name);

    labelGroups.append("text")
      .attr("class", "player-fee")
      .attr("dy", "1em")
      .style("fill", "white")
      .style("opacity", 0.88)
      .text(d => `€${d.data.value}m`);
  }

  // ===== 14) APPLY VIEW =====
   function applyView(v) {
    currentView = v;
    const k = width / v[2];
  
    leagueCircleG.selectAll("circle")
      .attr("cx", d => (d.x - v[0]) * k + width / 2)
      .attr("cy", d => (d.y - v[1]) * k + height / 2)
      .attr("r", d => d.r * k);
  
    clubCircleG.selectAll("circle")
      .attr("cx", d => (d.x - v[0]) * k + width / 2)
      .attr("cy", d => (d.y - v[1]) * k + height / 2)
      .attr("r", d => d.r * k);
  
    const clubGroups = clubLabelG.selectAll(".club-label-group");
  
    clubGroups.attr("transform", d => {
      const cx = (d.x - v[0]) * k + width / 2;
      const cy = (d.y - v[1]) * k + height / 2;
      return `translate(${cx},${cy})`;
    });
  
    clubGroups.select(".club-name")
      .style("font-size", d => {
        const r = d.r * k;
        return `${Math.max(8, Math.min(18, r * 0.16))}px`;
      })
      .style("display", d => {
        const r = d.r * k;
        return r < 18 ? "none" : null;
      })
      .text(d => d.data.name);
  
    clubGroups.select(".club-fee")
      .style("font-size", d => {
        const r = d.r * k;
        return `${Math.max(7, Math.min(15, r * 0.13))}px`;
      })
      .style("display", d => {
        const r = d.r * k;
        return r < 24 ? "none" : null;
      })
      .text(d => `€${d3.format(".1f")(d.value)}m`);
  
    // players
    playerCircleG.selectAll("circle")
      .attr("cx", d => (d.absX - v[0]) * k + width / 2)
      .attr("cy", d => (d.absY - v[1]) * k + height / 2)
      .attr("r", d => d.r * k);
  
    const playerGroups = playerLabelG.selectAll(".player-label-group");
    playerGroups.attr("transform", d => {
      const cx = (d.absX - v[0]) * k + width / 2;
      const cy = (d.absY - v[1]) * k + height / 2;
      return `translate(${cx},${cy})`;
    });
  
    playerGroups.select(".player-name")
      .style("font-size", d => {
        const r = d.r * k;
        return `${Math.max(7, Math.min(13, r * 0.22))}px`;
      })
      .style("display", d => {
        const r = d.r * k;
        return r < 16 ? "none" : null;
      });
  
    playerGroups.select(".player-fee")
      .style("font-size", d => {
        const r = d.r * k;
        return `${Math.max(6, Math.min(11, r * 0.18))}px`;
      })
      .style("display", d => {
        const r = d.r * k;
        return r < 22 ? "none" : null;
      });
  }

  // ===== 15) ZOOM =====
  function zoom(targetNode) {
    tooltip.style.display = "none";
    currentFocus = targetNode;
  
    const bc = document.getElementById("ob-bc");
    if (bc) {
      if (targetNode === leagueRoot) {
        bc.innerHTML = `Click a league to zoom in • Click background to zoom out`;
      } else if (targetNode.depth === 1) {
        bc.innerHTML = `<span style="color:#f5c518">${targetNode.data.name}</span> › Click a club to zoom in • Click background to zoom out`;
      } else if (targetNode.depth === 2) {
        bc.innerHTML = `<span style="color:#f5c518">${targetNode.parent.data.name}</span> › <span style="color:#f5c518">${targetNode.data.name}</span> • Hover player for details • Click background to zoom out`;
      }
    }
  
    const targetView = [targetNode.x, targetNode.y, targetNode.r * 2];
  
    if (targetNode.depth === 2) {
      zoomedClub = targetNode;
      renderPlayerBubbles(targetNode);
  
      // hide only selected club circle + label
      clubCircleG.selectAll("circle")
        .style("opacity", d => d === targetNode ? 0 : 1);
  
      clubLabelG.selectAll(".club-label-group")
        .style("opacity", d => d === targetNode ? 0 : 1);
    } else {
      playerCircleG.selectAll("*").remove();
      playerLabelG.selectAll("*").remove();
      playerNodes = [];
      zoomedClub = null;
  
      // restore all clubs
      clubCircleG.selectAll("circle").style("opacity", 1);
      clubLabelG.selectAll(".club-label-group").style("opacity", 1);
    }
  
    const interp = d3.interpolateZoom(currentView, targetView);
  
    svg.transition()
      .duration(850)
      .ease(d3.easeCubicInOut)
      .tween("zoom", () => t => applyView(interp(t)))
      .on("end", () => {
        buildArcLabels();
        arcLabelG.style("display", currentFocus === leagueRoot ? null : "none");
      });
  }

  // ===== 16) EVENTS =====
  leagueCircleG.selectAll("circle")
    .on("click", function(event, d) {
      event.stopPropagation();
      if (currentFocus !== d) zoom(d);
    });

  clubCircleG.selectAll("circle")
    .on("click", function(event, d) {
      event.stopPropagation();
      if (currentFocus !== d) zoom(d);
    });

  svg.on("click", () => {
    tooltip.style.display = "none";
    if (currentFocus !== leagueRoot) zoom(leagueRoot);
  });

  // ===== 17) INITIAL =====
  applyView(currentView);
  buildArcLabels();

  container.appendChild(svg.node());

  const footer = document.createElement("div");
  footer.style.cssText = `background:${bg}; padding:8px 32px 18px; font-size:12px; color:#8893ff;`;
  footer.innerHTML = `Source: <a href="https://www.transfermarkt.com" target="_blank" style="color:#b8c2ff">Transfermarkt</a>`;
  container.appendChild(footer);

  return container;
}


export default function define(runtime, observer) {
  const main = runtime.module();
  main.variable(observer()).define(["md"], _1);
  main.variable(observer()).define(["d3"], _2);
  return main;
}
