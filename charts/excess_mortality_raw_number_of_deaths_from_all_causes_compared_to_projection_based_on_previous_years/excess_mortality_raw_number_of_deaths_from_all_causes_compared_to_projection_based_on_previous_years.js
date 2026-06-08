function _1(md){return(
md`# Excess mortality: Raw number of deaths from all causes compared to projection based on previous years`
)}

function _2(d3,rawData)
{
  const W = 980, H = 560;
  const margin = { top: 115, right: 165, bottom: 80, left: 120 };
  const innerW = W - margin.left - margin.right;
  const innerH = H - margin.top - margin.bottom;

  const highlightedSeries = [
    { key: "2020",           label: "2020",           color: "#c0523a", width: 2 },
    { key: "2021",           label: "2021",           color: "#8a6abf", width: 2 },
    { key: "2022",           label: "2022",           color: "#3ab8c0", width: 2 },
    { key: "2023",           label: "2023",           color: "#4472c4", width: 2 },
    { key: "Projected, 2020",label: "Projected, 2020",color: "#111",    width: 2.5 },
  ];
  const backgroundSeries = [
    { key: "2015", label: "2015", color: "#ccc", width: 1 },
    { key: "2016", label: "2016", color: "#ccc", width: 1 },
    { key: "2017", label: "2017", color: "#ccc", width: 1 },
    { key: "2018", label: "2018", color: "#ccc", width: 1 },
    { key: "2019", label: "2019", color: "#ccc", width: 1 },
  ];
  const allSeries = [...backgroundSeries, ...highlightedSeries];

  const parseDate = d3.timeParse("%Y-%m-%d");
  const usData = rawData
    .filter(d => d.Entity === "United States" && d.Day)
    .map(d => {
      const row = { date: parseDate(d.Day) };
      allSeries.forEach(s => {
        row[s.key] = (d[s.key] !== "" && d[s.key] != null) ? +d[s.key] : null;
      });
      return row;
    })
    .filter(d => d.date)
    .sort((a,b) => a.date - b.date);

  const allDates = usData.map(d => d.date);
  let currentDateIdx = allDates.length - 1;
  let playing = false, timer = null;
  let viewMode = "line";

  const formatDate = d3.timeFormat("%b %-d, %Y");

  // ── Container ─────────────────────────────────────────────────────────────
  const container = d3.create("div")
    .style("font-family","sans-serif").style("user-select","none").style("position","relative");

  const svg = container.append("svg")
    .attr("viewBox",`0 0 ${W} ${H}`)
    .attr("width",W).attr("height",H)
    .style("background","#fff");

  // Title
  const titleEl = svg.append("foreignObject")
    .attr("x",margin.left).attr("y",6)
    .attr("width",W - margin.left - margin.right - 10).attr("height",52)
    .append("xhtml:div")
    .style("font-size","17px").style("font-weight","bold").style("color","#111")
    .style("line-height","1.25");
  titleEl.text("Excess mortality: Raw number of deaths from all causes compared to projection based on previous years, United States");

  // Subtitle
  svg.append("foreignObject")
    .attr("x",margin.left).attr("y",58)
    .attr("width",W - margin.left - 20).attr("height",36)
    .append("xhtml:div")
    .style("font-size","10.5px").style("color","#555").style("line-height","1.4")
    .text("The reported number of weekly or monthly deaths in 2020–2024 and the projected number of deaths for 2020, which is based on the reported deaths in 2015–2019.");

  // ── Buttons ───────────────────────────────────────────────────────────────
  const btnY = 88, btnH = 22;
  const btnDefs = [
    { label:"Line", mode:"line", x:margin.left },
    { label:"Bar",  mode:"bar",  x:margin.left+62 }
  ];
  const btnGs = btnDefs.map(b => {
    const g = svg.append("g").style("cursor","pointer");
    const rect = g.append("rect")
      .attr("x",b.x).attr("y",btnY).attr("width",56).attr("height",btnH)
      .attr("rx",4).attr("fill","#f0f0f0").attr("stroke","#ccc").attr("stroke-width",1);
    g.append("text").attr("x",b.x+28).attr("y",btnY+14)
      .style("font-size","11px").style("text-anchor","middle").style("fill","#333")
      .text(b.label);
    g.on("click",()=>{ viewMode=b.mode; updateView(); });
    return {rect, mode:b.mode};
  });
  function styleButtons() {
    btnGs.forEach(({rect,mode}) => {
      rect.attr("fill", mode===viewMode?"#dce8f5":"#f0f0f0")
          .attr("stroke", mode===viewMode?"#4472c4":"#ccc");
    });
  }

  const mainG = svg.append("g").attr("transform",`translate(${margin.left},${margin.top})`);

  // ── Scales ────────────────────────────────────────────────────────────────
  const xScaleLine = d3.scaleTime().domain(d3.extent(allDates)).range([0,innerW]);
  const allVals = usData.flatMap(d => allSeries.map(s => d[s.key]).filter(v=>v!=null));
  const yMax = Math.ceil(d3.max(allVals) / 10000) * 10000;
  const yScale = d3.scaleLinear().domain([0, yMax]).range([innerH,0]);

  // ── Gridlines ─────────────────────────────────────────────────────────────
  const gridG = mainG.append("g");
  d3.range(0, yMax+1, 20000).forEach(v => {
    gridG.append("line")
      .attr("x1",0).attr("x2",innerW)
      .attr("y1",yScale(v)).attr("y2",yScale(v))
      .attr("stroke", v===0?"#bbb":"#e0e0e0")
      .attr("stroke-dasharray",v===0?"0":"4,3").attr("stroke-width",1);
    gridG.append("text")
      .attr("class","y-axis-label")
      .attr("x",-8).attr("y",yScale(v)).attr("dy","0.35em")
      .style("font-size","10px").style("fill","#888").style("text-anchor","end")
      .text(d3.format(",")(v));
  });
  mainG.append("line").attr("x1",0).attr("x2",innerW).attr("y1",innerH).attr("y2",innerH)
    .attr("stroke","#bbb").attr("stroke-width",1);
  mainG.append("line").attr("x1",0).attr("x2",0).attr("y1",0).attr("y2",innerH)
    .attr("stroke","#bbb").attr("stroke-width",1);

  // X axis
  const xAxisG = mainG.append("g");
  xScaleLine.ticks(5).forEach(t => {
    xAxisG.append("text")
      .attr("x",xScaleLine(t)).attr("y",innerH+18)
      .style("font-size","10px").style("fill","#888").style("text-anchor","middle")
      .text(d3.timeFormat("%b %-d, %Y")(t));
  });

  // ── Line + end label elements ─────────────────────────────────────────────
  const bgLineG  = mainG.append("g");
  const fgLineG  = mainG.append("g");
  const dotsG    = mainG.append("g");
  const endLabG  = svg.append("g");

  // Cursor
  const cursorLine = mainG.append("line").attr("y1",0).attr("y2",innerH)
    .attr("stroke","#ccc").attr("stroke-width",1)
    .style("display","none").style("pointer-events","none");
  const hoverDots = highlightedSeries.map(s =>
    mainG.append("circle").attr("r",4).attr("fill","white")
      .attr("stroke",s.color).attr("stroke-width",2)
      .style("display","none").style("pointer-events","none")
  );

  // Bar
  const barG = mainG.append("g");

  // ── Tooltip ───────────────────────────────────────────────────────────────
  const ttG = svg.append("g").style("display","none").style("pointer-events","none");
  const ttBg = ttG.append("rect").attr("rx",6).attr("fill","white")
    .attr("stroke","#ddd").attr("stroke-width",1)
    .attr("filter","drop-shadow(0 2px 6px rgba(0,0,0,0.12))");
  const ttDate = ttG.append("text").attr("x",14).attr("y",26)
    .style("font-size","13px").style("font-weight","bold").style("fill","#111");
  const ttRows = ttG.append("g").attr("transform","translate(0,32)");

  function showTT(date, row, mx, my) {
    ttDate.text(formatDate(date));
    ttRows.selectAll("*").remove();
    const vals = allSeries
      .map(s=>({...s, value:row[s.key]}))
      .filter(s=>s.value!=null)
      .sort((a,b)=>b.value-a.value);
    const rowH=22;
    vals.forEach((s,i)=>{
      const g = ttRows.append("g").attr("transform",`translate(0,${i*rowH})`);
      g.append("rect").attr("x",14).attr("y",3).attr("width",12).attr("height",12)
        .attr("rx",2).attr("fill",s.color);
      g.append("text").attr("x",32).attr("y",13)
        .style("font-size","11px").style("fill","#111").text(s.label);
      g.append("text").attr("x",235).attr("y",13)
        .style("font-size","11px").style("font-weight","bold").style("fill","#111")
        .style("text-anchor","end").text(d3.format(",")(Math.round(s.value)));
    });
    const ttW=250, ttH=40+vals.length*rowH;
    ttBg.attr("width",ttW).attr("height",ttH);
    ttG.style("display",null);
    const tx=mx+ttW+20>W?mx-ttW-8:mx+14;
    const ty=Math.max(0,Math.min(my-ttH/2,H-ttH-10));
    ttG.attr("transform",`translate(${tx},${ty})`);
  }
  function hideTT() {
    ttG.style("display","none");
    cursorLine.style("display","none");
    hoverDots.forEach(d=>d.style("display","none"));
  }

  // ── Draw line ─────────────────────────────────────────────────────────────
  function drawLine() {
    gridG.selectAll(".y-axis-label").style("display",null);
    bgLineG.style("display",null); fgLineG.style("display",null);
    dotsG.style("display",null); xAxisG.style("display",null);
    endLabG.style("display",null); barG.style("display","none");

    const lineFn = s => d3.line()
      .x(d=>xScaleLine(d.date)).y(d=>yScale(d.value))
      .defined(d=>d.value!=null)
      (usData.filter(d=>d[s.key]!=null).map(d=>({date:d.date,value:d[s.key]})));

    bgLineG.selectAll("path").data(backgroundSeries, d=>d.key)
      .join("path").attr("fill","none")
      .attr("stroke",s=>s.color).attr("stroke-width",s=>s.width)
      .attr("d",s=>lineFn(s));

    fgLineG.selectAll("path").data(highlightedSeries, d=>d.key)
      .join("path").attr("fill","none")
      .attr("stroke",s=>s.color).attr("stroke-width",s=>s.width)
      .attr("d",s=>lineFn(s));

    const allPts = highlightedSeries.flatMap(s =>
      usData.filter(d=>d[s.key]!=null).map(d=>({date:d.date,value:d[s.key],key:s.key,color:s.color}))
    );
    dotsG.selectAll("circle").data(allPts, d=>`${d.key}-${d.date}`)
      .join("circle")
      .attr("cx",d=>xScaleLine(d.date)).attr("cy",d=>yScale(d.value))
      .attr("r",1.8).attr("fill",d=>d.color).attr("opacity",0.7);

    endLabG.selectAll("*").remove();
    const minGap = 14;
    const lastDate = allDates[allDates.length-1];
    const ex = margin.left + xScaleLine(lastDate) + 8;

    const labelData = [...highlightedSeries].reverse().map(s => {
      const lastRow = [...usData].reverse().find(d => d[s.key] != null);
      return { s, y: lastRow ? margin.top + yScale(lastRow[s.key]) : null };
    }).filter(d => d.y != null).sort((a,b)=>a.y-b.y);

    for (let i=1; i<labelData.length; i++) {
      if (labelData[i].y - labelData[i-1].y < minGap)
        labelData[i].y = labelData[i-1].y + minGap;
    }
    labelData.forEach(({s,y}) => {
      endLabG.append("text").attr("x",ex).attr("y",y).attr("dy","0.35em")
        .style("font-size","11px").style("font-weight","bold").style("fill",s.color)
        .text(s.label);
    });

    const bgLabelData = backgroundSeries.map(s => {
      const lastRow = [...usData].reverse().find(d => d[s.key] != null);
      return { s, y: lastRow ? margin.top + yScale(lastRow[s.key]) : null };
    }).filter(d => d.y != null).sort((a,b)=>a.y-b.y);

    for (let i=1; i<bgLabelData.length; i++) {
      if (bgLabelData[i].y - bgLabelData[i-1].y < minGap)
        bgLabelData[i].y = bgLabelData[i-1].y + minGap;
    }
    bgLabelData.forEach(({s,y}) => {
      endLabG.append("text").attr("x",ex).attr("y",y).attr("dy","0.35em")
        .style("font-size","10px").style("fill","#aaa").text(s.label);
    });

    mainG.select(".line-hover").remove();
    mainG.append("rect").attr("class","line-hover")
      .attr("width",innerW).attr("height",innerH).attr("fill","transparent")
      .on("mousemove", function(event) {
        const [mx,my]=d3.pointer(event);
        const hDate=xScaleLine.invert(mx);
        const closest=usData.reduce((b,d)=>Math.abs(d.date-hDate)<Math.abs(b.date-hDate)?d:b);
        cursorLine.attr("x1",xScaleLine(closest.date)).attr("x2",xScaleLine(closest.date))
          .style("display",null);
        highlightedSeries.forEach((s,i)=>{
          const v=closest[s.key];
          if(v!=null) hoverDots[i].attr("cx",xScaleLine(closest.date)).attr("cy",yScale(v)).style("display",null);
          else hoverDots[i].style("display","none");
        });
        const [sx,sy]=d3.pointer(event,svg.node());
        showTT(closest.date,closest,sx,sy);
      })
      .on("mouseleave",hideTT);
  }

  // ── Draw bar ──────────────────────────────────────────────────────────────
  function drawBar() {
    gridG.selectAll(".y-axis-label").style("display","none");
    bgLineG.style("display","none"); fgLineG.style("display","none");
    dotsG.style("display","none"); xAxisG.style("display","none");
    endLabG.style("display","none"); barG.style("display",null);
    mainG.select(".line-hover").remove(); hideTT();

    const currentDate = allDates[currentDateIdx];
    const row = usData.reduce((b,d)=>Math.abs(d.date-currentDate)<Math.abs(b.date-currentDate)?d:b);

    barG.selectAll("*").remove();

    const barSeries = [
      { key:"2020",           label:"2020",           color:"#c0523a" },
      { key:"Projected, 2020",label:"Projected, 2020",color:"#222" }
    ].filter(s=>row[s.key]!=null);

    const maxBarVal = d3.max(barSeries, s=>row[s.key]);
    const xBar = d3.scaleLinear().domain([0,maxBarVal*1.15]).range([0,innerW-80]);
    const barH=80, barGap=50;

    barSeries.forEach((s,i)=>{
      const y=i*(barH+barGap)+10;
      barG.append("text")
        .attr("x",-8).attr("y",y+barH/2).attr("dy","0.35em")
        .style("font-size","13px").style("font-weight","bold").style("fill","#333")
        .style("text-anchor","end").text(s.label);
      barG.append("rect")
        .attr("x",0).attr("y",y).attr("width",xBar(row[s.key])).attr("height",barH)
        .attr("fill",s.color).attr("rx",2);
      barG.append("text")
        .attr("x",xBar(row[s.key])+8).attr("y",y+barH/2).attr("dy","0.35em")
        .style("font-size","13px").style("fill","#333")
        .text(d3.format(",")(Math.round(row[s.key])));
    });
  }

  // ── Update ────────────────────────────────────────────────────────────────
  function updateView() {
    styleButtons();
    if (viewMode==="line") drawLine();
    else drawBar();
  }

  // ── Slider ────────────────────────────────────────────────────────────────
  const sliderY=H-50, sliderX0=90, sliderX1=W-60;
  const sliderG=svg.append("g");
  const playBtn=sliderG.append("text").attr("x",24).attr("y",sliderY+5)
    .style("font-size","18px").style("cursor","pointer").style("fill","#555").text("▶");
  sliderG.append("text").attr("x",sliderX0).attr("y",sliderY+5)
    .style("font-size","11px").style("fill","#888").style("text-anchor","middle")
    .text(formatDate(allDates[0]));
  sliderG.append("text").attr("x",sliderX1).attr("y",sliderY+5)
    .style("font-size","11px").style("fill","#888").style("text-anchor","middle")
    .text(formatDate(allDates[allDates.length-1]));
  sliderG.append("line").attr("x1",sliderX0).attr("x2",sliderX1)
    .attr("y1",sliderY).attr("y2",sliderY)
    .attr("stroke","#ccc").attr("stroke-width",4).attr("stroke-linecap","round");
  const handle=sliderG.append("circle").attr("cy",sliderY).attr("r",9)
    .attr("fill","#555").style("cursor","pointer");

  function updateDateIdx(idx) {
    currentDateIdx=Math.max(0,Math.min(allDates.length-1,idx));
    handle.attr("cx",sliderX0+(sliderX1-sliderX0)*currentDateIdx/(allDates.length-1));
    if(viewMode==="bar") {
      drawBar();
    }
  }
  updateDateIdx(currentDateIdx);

  sliderG.append("rect").attr("x",sliderX0).attr("y",sliderY-12)
    .attr("width",sliderX1-sliderX0).attr("height",24)
    .attr("fill","transparent").style("cursor","pointer")
    .on("click",function(event){
      const [mx]=d3.pointer(event);
      const idx=Math.round((mx-sliderX0)/(sliderX1-sliderX0)*(allDates.length-1));
      updateDateIdx(idx);
    });
  handle.call(d3.drag().on("drag",function(event){
    const mx=Math.max(sliderX0,Math.min(sliderX1,event.x));
    const idx=Math.round((mx-sliderX0)/(sliderX1-sliderX0)*(allDates.length-1));
    updateDateIdx(idx);
  }));
  playBtn.on("click",()=>{
    if(playing){clearInterval(timer);playing=false;playBtn.text("▶");}
    else{
      if(currentDateIdx===allDates.length-1)updateDateIdx(0);
      playing=true;playBtn.text("⏸");
      timer=setInterval(()=>{
        if(currentDateIdx<allDates.length-1)updateDateIdx(currentDateIdx+1);
        else{clearInterval(timer);playing=false;playBtn.text("▶");}
      },120);
    }
  });

  // ── Footer ────────────────────────────────────────────────────────────────
  svg.append("text").attr("x",margin.left).attr("y",H-28)
    .style("font-size","10.5px").style("font-weight","bold").style("fill","#333")
    .text("Data source: ");
  svg.append("text").attr("x",margin.left+82).attr("y",H-28)
    .style("font-size","10.5px").style("fill","#333")
    .text("Human Mortality Database (2026); Karlinsky and Kobak (2021) – processed by Our World in Data");
  svg.append("foreignObject").attr("x",margin.left).attr("y",H-20)
    .attr("width",W-margin.left-20).attr("height",18)
    .append("xhtml:div").style("font-size","10px").style("color","#555")
    .html("<strong>Note:</strong> The reported number of deaths might not count all deaths that occurred due to incomplete coverage and delays in reporting.");
  svg.append("text").attr("x",W-10).attr("y",H-4)
    .style("font-size","10px").style("fill","#aaa").style("text-anchor","end")
    .text("OurWorldInData.org/coronavirus | CC BY");

  updateView();
  return container.node();
}


function _d3(require){return(
require("d3@7")
)}

function _rawData(FileAttachment){return(
FileAttachment("excess-mortality-raw-death-count.csv").csv()
)}

export default function define(runtime, observer) {
  const main = runtime.module();
  function toString() { return this.url; }
  const fileAttachments = new Map([
    ["excess-mortality-raw-death-count.csv", {url: new URL("./files/7be9bd337cbc484b7bd22d047fc232209e418fd3a9a8abd3387c5b272ef0c0c34a3dd72da3d4660128d382eaa2d0d3af11ffcd6f57ed9b0dd3c017d51c3d8b18.csv", import.meta.url), mimeType: "text/csv", toString}]
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], _1);
  main.variable(observer()).define(["d3","rawData"], _2);
  main.variable(observer("d3")).define("d3", ["require"], _d3);
  main.variable(observer("rawData")).define("rawData", ["FileAttachment"], _rawData);
  return main;
}
