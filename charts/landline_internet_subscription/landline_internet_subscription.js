function _1(md){return(
md`# Landline Internet Subscription`
)}

function _2(d3,maxYear,topojson,world,dataByCountry,valueCol,numericEntityMap,getValueForYear,minYear,selectedCountries)
{
  // ── Dimensiones ───────────────────────────────────────────────────────────
  const W = 900, H = 580;
  const mapMargin = { top: 65, right: 20, bottom: 120, left: 20 };
  const mapW = W - mapMargin.left - mapMargin.right;
  const mapH = H - mapMargin.top - mapMargin.bottom;

  const BAR_COLOR = "#6b8cbf";

  // Colores por país para el line chart
  const lineColor = d3.scaleOrdinal()
    .domain(["China","United States","Japan","India","United Kingdom"])
    .range(["#8B6914","#c0392b","#3a6fc4","#7b4ea0","#2a9d5c"]);

  // ── Estado ────────────────────────────────────────────────────────────────
  let mode = "map";
  let currentYear = maxYear;
  let playing = false, playInterval = null;

  // ── Escala de color del mapa: blanco cremoso → naranja → marrón oscuro ───
  // Escala logarítmica igual que OWID (0, 300k, 1M, 3M, 10M, 30M, 100M, 300M, 1B)
  const logBreaks = [0, 300000, 1e6, 3e6, 1e7, 3e7, 1e8, 3e8, 1e9];
  const mapColors = ["#fff5eb","#fee6ce","#fdd0a2","#fdae6b","#fd8d3c","#f16913","#d94801","#8c2d04","#4a0d00"];
  const colorScale = d3.scaleThreshold().domain(logBreaks.slice(1)).range(mapColors);

  // ── Proyección ────────────────────────────────────────────────────────────
  const projection = d3.geoNaturalEarth1().scale(145).translate([mapW/2, mapH/2+10]);
  const pathGen = d3.geoPath().projection(projection);
  const countries = topojson.feature(world, world.objects.countries);

  // ── Container ─────────────────────────────────────────────────────────────
  const container = d3.create("div").style("font-family","sans-serif").style("user-select","none");

  // Botones
  const btnRow = container.append("div").style("display","flex").style("gap","6px").style("margin-bottom","6px");
  const mkBtn = (label, active) => btnRow.append("button").text(label)
    .style("padding","4px 14px").style("border","1px solid #ccc").style("border-radius","4px")
    .style("cursor","pointer").style("font-size","13px")
    .style("background", active ? "#3a6fc4" : "#fff")
    .style("color", active ? "#fff" : "#333");

  const btnMap  = mkBtn("🌍 Map",  true);
  const btnLine = mkBtn("📈 Line", false);
  const btnBar  = mkBtn("📊 Bar",  false);

  // SVG
  const svg = container.append("svg")
    .attr("viewBox",`0 0 ${W} ${H}`).attr("width",W).attr("height",H).style("background","#fff");

  // Defs (patrón rayas + gradiente leyenda)
  const defs = svg.append("defs");
  defs.append("pattern").attr("id","hatch").attr("patternUnits","userSpaceOnUse")
    .attr("width",6).attr("height",6).attr("patternTransform","rotate(45)")
    .append("line").attr("x1",0).attr("y1",0).attr("x2",0).attr("y2",6)
    .attr("stroke","#bbb").attr("stroke-width",2);

  // Título dinámico
  const titleEl = svg.append("text").attr("x", mapMargin.left).attr("y",24)
    .style("font-size","18px").style("font-weight","bold").style("fill","#111");

  svg.append("text").attr("x", mapMargin.left).attr("y",40)
    .style("font-size","11px").style("fill","#555")
    .text("Subscriptions to fixed access to the public Internet with a download speed of at least 256 kbit/s.");

  const mainG = svg.append("g").attr("transform",`translate(${mapMargin.left},${mapMargin.top})`);

  // ── Formato helpers ───────────────────────────────────────────────────────
  const fmtVal = v => {
    if (v >= 1e9) return `${d3.format(".2f")(v/1e9)} billion`;
    if (v >= 1e6) return `${d3.format(".2f")(v/1e6)} million`;
    if (v >= 1e3) return `${d3.format(",.0f")(v/1e3)}k`;
    return d3.format(",.0f")(v);
  };
  const fmtAxis = v => {
    if (v >= 1e9) return `${v/1e9}B`;
    if (v >= 1e6) return `${v/1e6}M`;
    if (v >= 1e3) return `${v/1e3}k`;
    return v;
  };

  // ── Tooltip (mapa y bar) ──────────────────────────────────────────────────
  const ttG = svg.append("g").style("display","none");
  const ttBg = ttG.append("rect").attr("rx",6).attr("fill","white")
    .attr("stroke","#ddd").attr("stroke-width",1)
    .attr("filter","drop-shadow(0 2px 8px rgba(0,0,0,0.14))");
  const ttCountry = ttG.append("text").attr("x",14).attr("y",24)
    .style("font-size","15px").style("font-weight","bold").style("fill","#111");
  const ttYearLbl = ttG.append("text").attr("x",14).attr("y",40)
    .style("font-size","11px").style("fill","#888");
  const ttSubLbl = ttG.append("text").attr("x",14).attr("y",56)
    .style("font-size","11px").style("fill","#888").text("subscriptions");
  const ttVal = ttG.append("text").attr("x",14).attr("y",78)
    .style("font-size","20px").style("font-weight","bold").style("fill","#e34a33");

  // Mini sparkline dentro del tooltip (para el mapa)
  const sparkG = ttG.append("g").attr("transform","translate(14,90)");
  const SPARK_W = 232, SPARK_H = 70;
  sparkG.append("rect").attr("width",SPARK_W).attr("height",SPARK_H).attr("fill","#fafafa").attr("rx",3);
  const sparkPath = sparkG.append("path").attr("fill","none").attr("stroke","#e34a33").attr("stroke-width",2);
  const sparkDot  = sparkG.append("circle").attr("r",5).attr("fill","#e34a33");
  const sparkEndLbl = sparkG.append("text").style("font-size","10px").style("fill","#888");
  const sparkYearMin = sparkG.append("text").attr("x",4).attr("y",SPARK_H-3).style("font-size","9px").style("fill","#aaa");
  const sparkYearMax = sparkG.append("text").attr("x",SPARK_W-4).attr("y",SPARK_H-3)
    .style("font-size","9px").style("fill","#aaa").style("text-anchor","end");
  const zeroLbl = sparkG.append("text").attr("x",SPARK_W+2).attr("y",SPARK_H-2)
    .style("font-size","9px").style("fill","#aaa").text("0");

  function showMapTooltip(entity, result, mx, my) {
    if (!result) return;
    ttCountry.text(entity);
    ttYearLbl.text(result.year);
    ttSubLbl.style("display",null);
    ttVal.text(fmtVal(result.value));
    sparkG.style("display",null);

    // Sparkline: todos los datos de ese país
    const rows = (dataByCountry.get(entity) || []).sort((a,b)=>a.Year-b.Year);
    const sxScale = d3.scaleLinear().domain(d3.extent(rows, d=>d.Year)).range([6, SPARK_W-6]);
    const syScale = d3.scaleLinear().domain([0, d3.max(rows,d=>d[valueCol])*1.1]).range([SPARK_H-14,4]);
    const lineGen = d3.line().x(d=>sxScale(d.Year)).y(d=>syScale(d[valueCol])).curve(d3.curveCatmullRom);
    sparkPath.attr("d", lineGen(rows));
    // Punto en el año actual
    const cur = rows.find(r=>r.Year===result.year) || rows[rows.length-1];
    sparkDot.attr("cx",sxScale(cur.Year)).attr("cy",syScale(cur[valueCol]));
    sparkEndLbl.attr("x",SPARK_W+4).attr("y",syScale(rows[rows.length-1][valueCol]))
      .text(fmtVal(rows[rows.length-1][valueCol]));
    sparkYearMin.text(d3.min(rows,d=>d.Year));
    sparkYearMax.text(d3.max(rows,d=>d.Year));

    const ttW = 260, ttH = 180;
    ttBg.attr("width",ttW).attr("height",ttH);
    ttG.style("display",null);
    const tx = mx+ttW+20>W ? mx-ttW-8 : mx+12;
    const ty = Math.max(0, Math.min(my-20, H-ttH-10));
    ttG.attr("transform",`translate(${tx},${ty})`);
  }

  function showBarTooltip(entity, result, mx, my) {
    if (!result) return;
    ttCountry.text(entity);
    ttYearLbl.text(result.year);
    ttSubLbl.style("display",null);
    ttVal.text(fmtVal(result.value));
    sparkG.style("display","none");
    const ttW=220, ttH=90;
    ttBg.attr("width",ttW).attr("height",ttH);
    ttG.style("display",null);
    const tx = mx+ttW+20>W ? mx-ttW-8 : mx+12;
    ttG.attr("transform",`translate(${tx},${Math.max(0,my-30)})`);
  }

  function hideTooltip() { ttG.style("display","none"); }

  // ── RENDER MAP ────────────────────────────────────────────────────────────
  function renderMap() {
    titleEl.text(`Landline Internet subscriptions, ${currentYear}`);
    mainG.selectAll("*").remove();

    mainG.selectAll(".country").data(countries.features).join("path")
      .attr("class","country").attr("d",pathGen)
      .attr("fill", d => {
        const entity = numericEntityMap.get(String(d.id).padStart(3,"0"));
        if (!entity) return "#e8e8e8";
        const r = getValueForYear(entity, currentYear);
        return r ? colorScale(r.value) : "url(#hatch)";
      })
      .attr("stroke","#fff").attr("stroke-width",0.4)
      .on("mousemove", function(event, d) {
        const entity = numericEntityMap.get(String(d.id).padStart(3,"0"));
        if (!entity) return hideTooltip();
        const r = getValueForYear(entity, currentYear);
        if (!r) return hideTooltip();
        d3.selectAll(".country").attr("stroke","#fff").attr("stroke-width",0.4);
        d3.select(this).attr("stroke","#222").attr("stroke-width",1.5).raise();
        const [mx,my] = d3.pointer(event, svg.node());
        showMapTooltip(entity, r, mx, my);
      })
      .on("mouseleave", function() {
        d3.selectAll(".country").attr("stroke","#fff").attr("stroke-width",0.4);
        hideTooltip();
      });

    // ── Leyenda escalonada (log) ──────────────────────────────────────────
    const legLabels = ["No data","0","300,000","1 million","3 million","10 million","30 million","100 million","300 million","1 billion"];
    const legW = 540, legH = 14;
    const legX = (mapW - legW) / 2 + 30;
    const legY = mapH + 16;
    const legG = mainG.append("g").attr("transform",`translate(${legX},${legY})`);
    const segW = legW / (mapColors.length);

    // No data
    legG.append("rect").attr("x",-80).attr("width",50).attr("height",legH)
      .attr("fill","url(#hatch)").attr("stroke","#ccc").attr("stroke-width",0.5);
    legG.append("text").attr("x",-80).attr("y",legH+15).style("font-size","10px").style("fill","#555").text("No data");

    // Segmentos de color
    mapColors.forEach((c,i) => {
      legG.append("rect").attr("x", i*segW).attr("width",segW).attr("height",legH).attr("fill",c);
    });
    legG.append("rect").attr("x",0).attr("width",legW).attr("height",legH)
      .attr("fill","none").attr("stroke","#ccc").attr("stroke-width",0.5);

    // Etiquetas (en los bordes de cada segmento)
    ["0","300k","1M","3M","10M","30M","100M","300M","1B"].forEach((lbl,i) => {
      legG.append("text").attr("x", i*segW).attr("y",legH+15)
        .style("font-size","10px").style("fill","#555").style("text-anchor","middle").text(lbl);
    });
  }

  // ── RENDER LINE ───────────────────────────────────────────────────────────
  function renderLine() {
    const lineStartYear = currentYear >= maxYear ? minYear : currentYear;
    titleEl.text(`Landline Internet subscriptions, ${lineStartYear} to ${maxYear}`);
    mainG.selectAll("*").remove();
    hideTooltip();

    const lMargin = {left:100, right:160, top:10, bottom:30};
    const lW = mapW - lMargin.left - lMargin.right;
    const lH = mapH - lMargin.top - lMargin.bottom;

    const seriesData = selectedCountries.map(entity => ({
      entity,
      values: (dataByCountry.get(entity)||[]).filter(d=>d.Year>=lineStartYear).sort((a,b)=>a.Year-b.Year)
    })).filter(s=>s.values.length>0);

    const xScale = d3.scaleLinear()
      .domain([lineStartYear, maxYear]).range([0,lW]);
    const yScale = d3.scaleLinear()
      .domain([0, d3.max(seriesData.flatMap(s=>s.values), d=>d[valueCol])*1.08]).nice()
      .range([lH,0]);

    const lG = mainG.append("g").attr("transform",`translate(${lMargin.left},${lMargin.top})`);

    // Grid
    yScale.ticks(6).forEach(v => {
      lG.append("line").attr("x1",0).attr("x2",lW).attr("y1",yScale(v)).attr("y2",yScale(v))
        .attr("stroke","#e8e8e8").attr("stroke-dasharray","4,3");
    });

    // Eje Y
    lG.append("g").call(
      d3.axisLeft(yScale).ticks(6).tickFormat(v => {
        if(v>=1e9) return `${v/1e9} billion`;
        if(v>=1e6) return `${v/1e6} million`;
        if(v>=1e3) return `${d3.format(",.0f")(v/1e3)}k`;
        return v;
      })
    ).call(ax=>ax.select(".domain").remove())
     .call(ax=>ax.selectAll("line").remove())
     .selectAll("text").style("font-size","11px").style("fill","#555");

    // Eje X
    const xTicks = d3.ticks(currentYear, maxYear, Math.min(maxYear-currentYear,8)).map(Math.round);
    lG.append("g").attr("transform",`translate(0,${lH})`).call(
      d3.axisBottom(xScale).tickValues(xTicks).tickFormat(d3.format("d"))
    ).call(ax=>ax.select(".domain").attr("stroke","#ccc"))
     .call(ax=>ax.selectAll("line").attr("stroke","#ccc"))
     .selectAll("text").style("font-size","11px").style("fill","#555");

    // Líneas + puntos
    const lineGen = d3.line().x(d=>xScale(d.Year)).y(d=>yScale(d[valueCol]));

    seriesData.forEach(s => {
      lG.append("path").datum(s.values)
        .attr("fill","none").attr("stroke",lineColor(s.entity))
        .attr("stroke-width",2).attr("d",lineGen);
      lG.selectAll(null).data(s.values).join("circle")
        .attr("cx",d=>xScale(d.Year)).attr("cy",d=>yScale(d[valueCol]))
        .attr("r",3).attr("fill",lineColor(s.entity));
    });

    // Etiquetas inline con separación
    let labelPositions = seriesData.filter(s=>s.values.length).map(s => {
      const last = s.values[s.values.length-1];
      return { entity: s.entity, y: yScale(last[valueCol]) };
    }).sort((a,b)=>a.y-b.y);

    // Separar etiquetas solapadas
    for(let iter=0; iter<30; iter++) {
      for(let i=0; i<labelPositions.length-1; i++) {
        const gap = labelPositions[i+1].y - labelPositions[i].y;
        if(gap < 16) { const push=(16-gap)/2; labelPositions[i].y-=push; labelPositions[i+1].y+=push; }
      }
    }

    labelPositions.forEach(pos => {
      lG.append("text").attr("x",lW+8).attr("y",pos.y).attr("dy","0.35em")
        .style("font-size","12px").style("font-weight","600").style("fill",lineColor(pos.entity))
        .text(pos.entity);
    });

    // Línea vertical + tooltip al hover
    const bisect = d3.bisector(d=>d.Year).left;
    const vLine = lG.append("line").attr("y1",0).attr("y2",lH)
      .attr("stroke","#aaa").attr("stroke-width",1).attr("stroke-dasharray","4,3").style("display","none");

    const hoverDots = seriesData.map(s =>
      lG.append("circle").attr("r",6).attr("fill",lineColor(s.entity))
        .attr("stroke","white").attr("stroke-width",2).style("display","none")
    );

    lG.append("rect").attr("width",lW).attr("height",lH).attr("fill","none").attr("pointer-events","all")
      .on("mousemove", function(event) {
        const [mx] = d3.pointer(event);
        const year = Math.round(xScale.invert(mx));
        vLine.style("display",null).attr("x1",xScale(year)).attr("x2",xScale(year));

        // Mini tooltip de líneas
        ttCountry.text(year); ttYearLbl.text(""); ttSubLbl.style("display","none");
        sparkG.style("display","none");

        const rows = seriesData.map((s,si) => {
          const i = bisect(s.values,year);
          const d = s.values[Math.min(i,s.values.length-1)];
          if(!d){hoverDots[si].style("display","none");return null;}
          hoverDots[si].style("display",null).attr("cx",xScale(d.Year)).attr("cy",yScale(d[valueCol]));
          return {entity:s.entity, value:d[valueCol]};
        }).filter(Boolean);

        // Reutilizamos ttLines del tooltip
        const ttW=220, ttH=30+rows.length*20;
        ttBg.attr("width",ttW).attr("height",ttH);
        ttVal.text("");
        // Limpiamos filas anteriores
        ttG.selectAll(".ttrow").remove();
        rows.forEach((r,i)=>{
          const row = ttG.append("g").attr("class","ttrow").attr("transform",`translate(0,${28+i*20})`);
          row.append("rect").attr("x",14).attr("y",-10).attr("width",10).attr("height",10).attr("rx",2).attr("fill",lineColor(r.entity));
          row.append("text").attr("x",28).attr("y",0).style("font-size","12px").style("fill","#222")
            .text(`${r.entity}: ${fmtVal(r.value)}`);
        });
        ttG.style("display",null);
        const px = mapMargin.left+lMargin.left+xScale(year);
        ttG.attr("transform",`translate(${px+ttW+20>W?px-ttW-8:px+12},${mapMargin.top+10})`);
      })
      .on("mouseleave",()=>{
        vLine.style("display","none");
        hoverDots.forEach(d=>d.style("display","none"));
        hideTooltip();
      });
  }

  // ── RENDER BAR ────────────────────────────────────────────────────────────
  function renderBar() {
    titleEl.text(`Landline Internet subscriptions, ${currentYear}`);
    mainG.selectAll("*").remove();
    hideTooltip();

    const barData = selectedCountries.map(entity => {
      const r = getValueForYear(entity, currentYear);
      return { entity, result: r };
    }).filter(d=>d.result).sort((a,b)=>b.result.value-a.result.value);

    const bMargin={left:140, right:180};
    const bW = mapW - bMargin.left - bMargin.right;
    const rowH = Math.min(60, (mapH-20)/barData.length);
    const xB = d3.scaleLinear().domain([0, d3.max(barData,d=>d.result.value)*1.1]).range([0,bW]);
    const yB = d3.scaleBand().domain(barData.map(d=>d.entity)).range([10,barData.length*rowH+10]).padding(0.28);

    const bG = mainG.append("g").attr("transform",`translate(${bMargin.left},0)`);

    bG.selectAll(".clabel").data(barData).join("text").attr("class","clabel")
      .attr("x",-10).attr("y",d=>yB(d.entity)+yB.bandwidth()/2).attr("dy","0.35em")
      .attr("text-anchor","end").style("font-size","13px").style("font-weight","bold").style("fill","#333")
      .text(d=>d.entity);

    bG.selectAll(".bar").data(barData).join("rect").attr("class","bar")
      .attr("x",0).attr("y",d=>yB(d.entity))
      .attr("width",d=>xB(d.result.value)).attr("height",yB.bandwidth())
      .attr("fill",BAR_COLOR).attr("rx",2)
      .on("mousemove",function(event,d){
        const [mx,my]=d3.pointer(event,svg.node());
        showBarTooltip(d.entity,d.result,mx,my);
      }).on("mouseleave",hideTooltip);

    bG.selectAll(".vlabel").data(barData).join("text").attr("class","vlabel")
      .attr("x",d=>xB(d.result.value)+8).attr("y",d=>yB(d.entity)+yB.bandwidth()/2)
      .attr("dy","0.35em").style("font-size","13px").style("fill","#444")
      .text(d=>`${fmtVal(d.result.value)}`);
  }

  // ── Slider ────────────────────────────────────────────────────────────────
  const sliderY = H - 72;
  const sliderX = 40, sliderW = W - sliderX - 40;
  const sliderG = svg.append("g").attr("transform",`translate(${sliderX},${sliderY})`);

  sliderG.append("line").attr("x1",0).attr("x2",sliderW).attr("y1",0).attr("y2",0)
    .attr("stroke","#ddd").attr("stroke-width",4).attr("stroke-linecap","round");
  const activeTrack = sliderG.append("line").attr("y1",0).attr("y2",0)
    .attr("stroke","#3a6fc4").attr("stroke-width",4).attr("stroke-linecap","round");

  const sliderScale = d3.scaleLinear().domain([minYear,maxYear]).range([0,sliderW]).clamp(true);

  sliderG.append("text").attr("x",0).attr("y",22).style("font-size","12px").style("fill","#555")
    .style("text-anchor","middle").text(minYear);
  sliderG.append("text").attr("x",sliderW).attr("y",22).style("font-size","12px").style("fill","#555")
    .style("text-anchor","middle").text(maxYear);

  const handle = sliderG.append("circle").attr("r",9)
    .attr("fill","#555").attr("stroke","#fff").attr("stroke-width",2).style("cursor","ew-resize");

  const playBtn = sliderG.append("g").attr("transform","translate(-28,0)").style("cursor","pointer");
  playBtn.append("circle").attr("r",14).attr("fill","#555");
  const playIcon = playBtn.append("text").attr("text-anchor","middle").attr("dy","0.35em")
    .style("font-size","14px").style("fill","#fff").text("▶");

  function updateSlider() {
    const x = sliderScale(currentYear);
    handle.attr("cx",x);
    activeTrack.attr("x1",0).attr("x2",x);
  }

  function stopPlay() { playing=false; clearInterval(playInterval); playIcon.text("▶"); }

  function redraw() { updateSlider(); if(mode==="map") renderMap(); else if(mode==="line") renderLine(); else renderBar(); }

  handle.call(d3.drag().on("drag",function(event){
    stopPlay();
    currentYear = Math.max(minYear, Math.min(maxYear, Math.round(sliderScale.invert(event.x))));
    redraw();
  }));

  sliderG.append("rect").attr("x",0).attr("y",-10).attr("width",sliderW).attr("height",20)
    .attr("fill","none").attr("pointer-events","all").style("cursor","pointer")
    .on("click",function(event){
      stopPlay();
      const [mx]=d3.pointer(event);
      currentYear = Math.max(minYear, Math.min(maxYear, Math.round(sliderScale.invert(mx))));
      redraw();
    });

  playBtn.on("click",()=>{
    if(playing){stopPlay();}else{
      playing=true; playIcon.text("⏸");
      if(currentYear>=maxYear) currentYear=minYear;
      playInterval=setInterval(()=>{
        currentYear=Math.min(currentYear+1,maxYear);
        redraw();
        if(currentYear>=maxYear) stopPlay();
      }, 350);
    }
  });

  // ── Pie ───────────────────────────────────────────────────────────────────
  svg.append("text").attr("x",mapMargin.left).attr("y",H-24)
    .style("font-size","10.5px").style("font-weight","bold").style("fill","#333").text("Data source: ");
  svg.append("text").attr("x",mapMargin.left+80).attr("y",H-24)
    .style("font-size","10.5px").style("fill","#333")
    .text("International Telecommunication Union (ITU), via World Bank (2026) – processed by Our World in Data");
  svg.append("text").attr("x",mapMargin.left).attr("y",H-10)
    .style("font-size","10px").style("fill","#aaa").text("OurWorldInData.org/internet | CC BY");

  // ── Botones ───────────────────────────────────────────────────────────────
  function setMode(m) {
    mode=m;
    btnMap.style("background",m==="map"?"#3a6fc4":"#fff").style("color",m==="map"?"#fff":"#333");
    btnLine.style("background",m==="line"?"#3a6fc4":"#fff").style("color",m==="line"?"#fff":"#333");
    btnBar.style("background",m==="bar"?"#3a6fc4":"#fff").style("color",m==="bar"?"#fff":"#333");
    hideTooltip();
    redraw();
  }

  btnMap.on("click",()=>setMode("map"));
  btnLine.on("click",()=>setMode("line"));
  btnBar.on("click",()=>setMode("bar"));

  currentYear= minYear;
  redraw();
  return container.node();
}


function _d3(require){return(
require("d3@7")
)}

function _rawData(FileAttachment){return(
FileAttachment("landline-internet-subscriptions.csv").csv({typed: true})
)}

function _world(){return(
fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json").then(r => r.json())
)}

function _topojson(require){return(
require("topojson-client@3")
)}

function _selectedCountries(){return(
["United States", "United Kingdom", "China", "India", "Japan"]
)}

function _valueCol(){return(
"Fixed broadband subscriptions"
)}

function _allYears(rawData){return(
[...new Set(rawData.map(d => d.Year))].sort((a,b) => a - b)
)}

function _minYear(allYears){return(
allYears[0]
)}

function _maxYear(allYears){return(
allYears[allYears.length - 1]
)}

function _dataByCountry(d3,rawData){return(
d3.group(rawData, d => d.Entity)
)}

function _alpha3Numeric(){return(
{"AFG":"004","ALB":"008","DZA":"012","AND":"020","AGO":"024","ARG":"032","ARM":"051","AUS":"036","AUT":"040","AZE":"031","BHS":"044","BHR":"048","BGD":"050","BLR":"112","BEL":"056","BLZ":"084","BEN":"204","BTN":"064","BOL":"068","BIH":"070","BWA":"072","BRA":"076","BRN":"096","BGR":"100","BFA":"854","BDI":"108","CPV":"132","KHM":"116","CMR":"120","CAN":"124","CAF":"140","TCD":"148","CHL":"152","CHN":"156","COL":"170","COM":"174","COG":"178","COD":"180","CRI":"188","CIV":"384","HRV":"191","CUB":"192","CYP":"196","CZE":"203","DNK":"208","DJI":"262","DOM":"214","ECU":"218","EGY":"818","SLV":"222","GNQ":"226","ERI":"232","EST":"233","SWZ":"748","ETH":"231","FJI":"242","FIN":"246","FRA":"250","GAB":"266","GMB":"270","GEO":"268","DEU":"276","GHA":"288","GRC":"300","GTM":"320","GIN":"324","GNB":"624","HTI":"332","HND":"340","HUN":"348","ISL":"352","IND":"356","IDN":"360","IRN":"364","IRQ":"368","IRL":"372","ISR":"376","ITA":"380","JAM":"388","JPN":"392","JOR":"400","KAZ":"398","KEN":"404","PRK":"408","KOR":"410","KWT":"414","KGZ":"417","LAO":"418","LVA":"428","LBN":"422","LSO":"426","LBR":"430","LBY":"434","LTU":"440","LUX":"442","MDG":"450","MWI":"454","MYS":"458","MDV":"462","MLI":"466","MLT":"470","MRT":"478","MUS":"480","MEX":"484","MDA":"498","MNG":"496","MNE":"499","MAR":"504","MOZ":"508","MMR":"104","NAM":"516","NPL":"524","NLD":"528","NZL":"554","NIC":"558","NER":"562","NGA":"566","MKD":"807","NOR":"578","OMN":"512","PAK":"586","PAN":"591","PNG":"598","PRY":"600","PER":"604","PHL":"608","POL":"616","PRT":"620","QAT":"634","ROU":"642","RUS":"643","RWA":"646","SAU":"682","SEN":"686","SRB":"688","SLE":"694","SGP":"702","SVK":"703","SVN":"705","SOM":"706","ZAF":"710","SSD":"728","ESP":"724","LKA":"144","SDN":"729","SUR":"740","SWE":"752","CHE":"756","SYR":"760","TWN":"158","TJK":"762","TZA":"834","THA":"764","TLS":"626","TGO":"768","TTO":"780","TUN":"788","TUR":"792","TKM":"795","UGA":"800","UKR":"804","ARE":"784","GBR":"826","USA":"840","URY":"858","UZB":"860","VEN":"862","VNM":"704","PSE":"275","YEM":"887","ZMB":"894","ZWE":"716"}
)}

function _numericEntityMap(rawData,alpha3Numeric)
{
  const m = new Map()
  rawData.forEach(d => {
    if (d.Code && alpha3Numeric[d.Code]) m.set(alpha3Numeric[d.Code], d.Entity)
  })
  return m
}


function _getValueForYear(dataByCountry,valueCol){return(
function getValueForYear(entity, year) {
  const rows = dataByCountry.get(entity)
  if (!rows) return null
  const exact = rows.find(r => r.Year === year)
  if (exact) return { value: exact[valueCol], year: exact.Year, estimated: false }
  const before = rows.filter(r => r.Year < year).sort((a,b) => b.Year - a.Year)
  if (before.length) return { value: before[0][valueCol], year: before[0].Year, estimated: true }
  return null
}
)}

export default function define(runtime, observer) {
  const main = runtime.module();
  function toString() { return this.url; }
  const fileAttachments = new Map([
    ["landline-internet-subscriptions.csv", {url: new URL("./files/d7bda27866cfccbd36e77475f505d8d95cd4e01a8121068062c0470b7431f727c1f88733397c3b013e71e061225212b51c45ba419e5faf71b122a34088880617.csv", import.meta.url), mimeType: "text/csv", toString}]
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], _1);
  main.variable(observer()).define(["d3","maxYear","topojson","world","dataByCountry","valueCol","numericEntityMap","getValueForYear","minYear","selectedCountries"], _2);
  main.variable(observer("d3")).define("d3", ["require"], _d3);
  main.variable(observer("rawData")).define("rawData", ["FileAttachment"], _rawData);
  main.variable(observer("world")).define("world", _world);
  main.variable(observer("topojson")).define("topojson", ["require"], _topojson);
  main.variable(observer("selectedCountries")).define("selectedCountries", _selectedCountries);
  main.variable(observer("valueCol")).define("valueCol", _valueCol);
  main.variable(observer("allYears")).define("allYears", ["rawData"], _allYears);
  main.variable(observer("minYear")).define("minYear", ["allYears"], _minYear);
  main.variable(observer("maxYear")).define("maxYear", ["allYears"], _maxYear);
  main.variable(observer("dataByCountry")).define("dataByCountry", ["d3","rawData"], _dataByCountry);
  main.variable(observer("alpha3Numeric")).define("alpha3Numeric", _alpha3Numeric);
  main.variable(observer("numericEntityMap")).define("numericEntityMap", ["rawData","alpha3Numeric"], _numericEntityMap);
  main.variable(observer("getValueForYear")).define("getValueForYear", ["dataByCountry","valueCol"], _getValueForYear);
  return main;
}
