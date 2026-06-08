function _1(md){return(
md`# Bears Will Be Boys`
)}

async function _2(FileAttachment,html,Option)
{
  const raw = await FileAttachment("kids-book-animals.csv").csv({ typed: true });

  const availableAnimals = [
    "aardvark", "alligator", "ape", "armadillo", "baboon", "badger", "bat",
    "bear", "beaver", "bee", "bird", "boa constrictor", "bug", "butterfly",
    "camel", "cat", "caterpillar", "chameleon", "chicken", "chimpanzee",
    "chipmunk", "clam", "cobra", "cow", "crab", "cricket", "crocodile",
    "crow", "deer", "dinosaur", "dog", "dolphin", "donkey", "dragonfly",
    "duck", "eagle", "eel", "elephant", "falcon", "firefly", "fish",
    "flamingo", "flea", "fly", "fox", "frog", "gecko", "giraffe", "goat",
    "goose", "gorilla", "grasshopper", "groundhog", "guinea pig", "hawk",
    "hedgehog", "hen", "hippo", "hog", "horse", "hyena", "iguana",
    "inchworm", "jaguar", "jellyfish", "kangaroo", "koala", "ladybug",
    "lemming", "leopard", "lion", "lizard", "llama", "lobster", "luna moth",
    "meerkat", "mink", "mole", "mongoose", "monkey", "moose", "mosquito",
    "moth", "mouse", "muskrat", "narwhal", "newt", "no-animal", "octopus",
    "opossum", "orangutan", "ostrich", "otter", "owl", "ox", "penguin",
    "pig", "pigeon", "pony", "porcupine", "praying mantis", "rabbit",
    "raccoon", "rat", "reindeer", "rhino", "robin", "rooster", "seal",
    "sheep", "skunk", "sloth", "snail", "snake", "sparrow", "spider",
    "squid", "squirrel", "stag beetle", "starfish", "stink bug", "swan",
    "tiger", "toad", "tortoise", "turkey", "turtle", "vulture",
    "walking stick", "walrus", "warthog", "whale", "wolf", "wolverine",
    "woodchuck", "worm", "yellow jacket", "zebra"
  ];

  const availableSet = new Set(availableAnimals);

  const aliases = new Map([
    ["bunny", "rabbit"],
    ["hare", "rabbit"],
    ["kitten", "cat"],
    ["puppy", "dog"],
    ["lamb", "sheep"],
    ["minnow", "fish"],
    ["lantern fish", "fish"],
    ["trout", "fish"],
    ["boa", "boa constrictor"],
    ["python", "snake"],
    ["ladybird", "ladybug"],
    ["rhino beetle", "stag beetle"],
    ["maybug", "bug"],
    ["beetle", "stag beetle"],
    ["possum", "opossum"],
    ["dove", "bird"],
    ["magpie", "bird"],
    ["parrot", "bird"],
    ["partridge", "bird"],
    ["raven", "bird"],
    ["seagull", "bird"],
    ["stork", "bird"],
    ["swallow", "bird"],
    ["wren", "bird"]
  ]);

  function normalizeAnimalName(name) {
    return String(name)
      .toLowerCase()
      .trim()
      .replace(/_/g, " ")
      .replace(/-/g, " ")
      .replace(/\s+/g, " ");
  }

  function titleCase(s) {
    return String(s)
      .split(" ")
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  }

  function pronounGroup(p) {
    const clean = String(p).toLowerCase().trim();

    if (clean === "he/him" || clean === "he" || clean === "him" || clean === "his") {
      return "he/him";
    }

    if (clean === "she/her" || clean === "she" || clean === "her" || clean === "hers") {
      return "she/her";
    }

    return "other";
  }

  function pronounLabel(p) {
    if (p === "he/him") return "He/him";
    if (p === "she/her") return "She/her";
    return "Other";
  }

  function levenshtein(a, b) {
    const m = a.length;
    const n = b.length;
    const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,
          dp[i][j - 1] + 1,
          dp[i - 1][j - 1] + cost
        );
      }
    }

    return dp[m][n];
  }

  function tokenScore(a, b) {
    const aTokens = new Set(a.split(" "));
    const bTokens = new Set(b.split(" "));
    let shared = 0;

    for (const token of aTokens) {
      if (bTokens.has(token)) shared++;
    }

    return shared / Math.max(aTokens.size, bTokens.size);
  }

  function closestAnimalName(name) {
    const clean = normalizeAnimalName(name);

    if (availableSet.has(clean)) return clean;
    if (aliases.has(clean)) return aliases.get(clean);

    let best = "no-animal";
    let bestScore = Infinity;

    for (const candidate of availableAnimals) {
      const distance = levenshtein(clean, candidate);
      const maxLen = Math.max(clean.length, candidate.length);
      const normalizedDistance = distance / maxLen;
      const sharedTokenBonus = tokenScore(clean, candidate);

      let score = normalizedDistance - sharedTokenBonus * 0.45;

      if (candidate.includes(clean) || clean.includes(candidate)) {
        score -= 0.3;
      }

      if (score < bestScore) {
        bestScore = score;
        best = candidate;
      }
    }

    return best;
  }

  const rows = raw
    .filter(d => d.title && d.animal && d.pronoun)
    .map(d => {
      const specificAnimal = normalizeAnimalName(d.animal);
      const groupedAnimal = normalizeAnimalName(d.animal_group || d.animal);
      const iconAnimal = closestAnimalName(specificAnimal);
      const groupedPronoun = pronounGroup(d.pronoun);

      return {
        title: String(d.title).trim(),
        animal: groupedAnimal,
        specific_animal: specificAnimal,
        icon_animal: iconAnimal,
        pronoun_raw: String(d.pronoun).trim(),
        pronoun: groupedPronoun,
        author: d.author ? String(d.author).trim() : "Unknown author",
        pub_year: d.pub_year ? String(d.pub_year).trim() : "",
        book_cover_image: d.book_cover_image ? String(d.book_cover_image).trim() : "",
        icon_url: `https://raw.githubusercontent.com/the-pudding/kids-book-animals/refs/heads/main/static/assets/animals/${encodeURIComponent(iconAnimal)}.png`
      };
    });

  const fullAnimalCounts = new Map();

  for (const d of rows) {
    fullAnimalCounts.set(d.animal, (fullAnimalCounts.get(d.animal) || 0) + 1);
  }

  function sortByAnimalCount(items) {
    const localCounts = new Map();

    for (const d of items) {
      localCounts.set(d.animal, (localCounts.get(d.animal) || 0) + 1);
    }

    return items.slice().sort((a, b) =>
      (localCounts.get(b.animal) - localCounts.get(a.animal)) ||
      (fullAnimalCounts.get(b.animal) - fullAnimalCounts.get(a.animal)) ||
      a.animal.localeCompare(b.animal) ||
      a.title.localeCompare(b.title)
    );
  }

  const data = sortByAnimalCount(rows);

  const animals = [
    "All animals",
    ...Array.from(new Set(data.map(d => d.animal))).sort((a, b) => a.localeCompare(b))
  ];

  const pronouns = [
    { label: "All pronouns", value: "All pronouns" },
    { label: "He/him", value: "he/him" },
    { label: "She/her", value: "she/her" },
    { label: "Other", value: "other" }
  ];

  const root = html`
    <div class="animal-explorer">
      <style>
        @import url("https://fonts.googleapis.com/css2?family=Gaegu:wght@400;700&display=swap");

        .animal-explorer {
          --animal-font: "Gaegu", "Comic Sans MS", "Trebuchet MS", cursive;
          position: relative;
          box-sizing: border-box;
          width: 100%;
          height: auto;
          overflow: visible;
          background: #f2d15b;
          color: #172033;
          font-family: var(--animal-font);
          padding: 22px 32px 28px;
          border-radius: 8px;
        }

        .animal-explorer,
        .animal-explorer * {
          font-family: var(--animal-font);
        }

        .animal-title {
          margin: 0 0 18px;
          text-align: center;
          font-size: 38px;
          line-height: 1;
          font-weight: 700;
          letter-spacing: 2px;
          text-transform: uppercase;
        }

        .animal-intro {
          max-width: 900px;
          margin: 0 auto 26px;
          font-size: 22px;
          line-height: 1.35;
        }

        .animal-intro p {
          margin: 0 0 12px;
        }

        .controls {
          display: grid;
          grid-template-columns: 1.4fr 0.6fr 0.6fr;
          gap: 44px;
          align-items: end;
          margin-bottom: 28px;
        }

        .control {
          position: relative;
        }

        .control label {
          display: block;
          margin-bottom: 8px;
          font-size: 25px;
          font-weight: 700;
          letter-spacing: 0.2px;
        }

        .search-shell {
          position: relative;
        }

        .control input,
        .control select {
          width: 100%;
          box-sizing: border-box;
          height: 56px;
          border-radius: 12px;
          border: 4px solid #111;
          padding: 0 14px;
          font-size: 22px;
          font-weight: 400;
          outline: none;
          color: #172033;
        }

        .control input {
          background: #f7f7f7;
          padding-right: 44px;
        }

        .control select {
          background: #ed8737;
          cursor: pointer;
        }

        .control option {
          font-size: 22px;
          font-family: var(--animal-font);
        }

        .clear-search {
          position: absolute;
          top: 50%;
          right: 12px;
          transform: translateY(-50%);
          width: 28px;
          height: 28px;
          border: 0;
          background: transparent;
          color: #8a8f99;
          font-size: 32px;
          line-height: 1;
          cursor: pointer;
          visibility: hidden;
        }

        .suggestions {
          position: absolute;
          left: 0;
          right: 0;
          top: calc(100% + 4px);
          max-height: 360px;
          overflow-y: auto;
          background: #f7f7f7;
          color: #172033;
          z-index: 100;
          box-shadow: 0 12px 28px rgba(0, 0, 0, 0.18);
          border-radius: 0 0 4px 4px;
          display: none;
        }

        .suggestion-item {
          width: 100%;
          display: block;
          text-align: left;
          border: 0;
          background: transparent;
          padding: 16px 14px;
          font-size: 19px;
          line-height: 1.25;
          color: #172033;
          cursor: pointer;
        }

        .suggestion-item:hover,
        .suggestion-item:focus {
          background: rgba(0, 0, 0, 0.08);
        }

        .summary-labels {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          margin-bottom: 6px;
          font-size: 18px;
          font-weight: 700;
        }

        .summary-labels div:nth-child(1) {
          text-align: left;
        }

        .summary-labels div:nth-child(2) {
          text-align: center;
        }

        .summary-labels div:nth-child(3) {
          text-align: right;
        }

        .summary-bar {
          width: 100%;
          height: 34px;
          display: flex;
          overflow: hidden;
          border: 4px solid #1b2638;
          border-radius: 12px;
          background: #ddd;
          box-sizing: border-box;
          margin-bottom: 18px;
        }

        .bar-he {
          background: #6fa8dc;
        }

        .bar-she {
          background: #d89a9a;
        }

        .bar-other {
          background: #333;
        }

        .meta-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          font-size: 17px;
          font-weight: 700;
        }

        .icon-scroll {
          height: 560px;
          overflow-y: auto;
          overflow-x: hidden;
          padding-right: 8px;
          scrollbar-gutter: stable;
        }

        .icon-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(48px, 48px));
          gap: 7px;
          align-items: start;
          justify-content: start;
          padding-bottom: 24px;
        }

        .animal-icon {
          width: 48px;
          height: 48px;
          padding: 0;
          border: 0;
          background: transparent;
          cursor: pointer;
        }

        .animal-icon img {
          width: 46px;
          height: 46px;
          object-fit: contain;
          display: block;
          pointer-events: none;
        }

        .animal-icon:hover img {
          transform: scale(1.18);
        }

        .tooltip {
          position: absolute;
          width: 270px;
          box-sizing: border-box;
          padding: 18px 16px 16px;
          background: #f4f4f4;
          color: #111;
          box-shadow: 0 12px 28px rgba(0, 0, 0, 0.25);
          opacity: 0;
          pointer-events: none;
          z-index: 50;
          transition: opacity 100ms linear;
        }

        .tip-animal {
          text-align: center;
          font-size: 21px;
          margin-bottom: 5px;
        }

        .tip-pronoun {
          display: table;
          margin: 0 auto 10px;
          padding: 3px 9px;
          font-size: 30px;
          line-height: 1.05;
          font-weight: 700;
        }

        .tip-he {
          background: #8ab7e8;
          color: #1c5d9f;
        }

        .tip-she {
          background: #dea2a2;
          color: #9b3d3d;
        }

        .tip-other {
          background: #ddd;
          color: #222;
        }

        .tip-cover-wrap {
          text-align: center;
          margin-bottom: 10px;
        }

        .tip-cover {
          width: 95px;
          max-height: 115px;
          object-fit: cover;
          border: 2px solid #111;
          background: white;
        }

        .tip-title {
          text-align: center;
          font-size: 24px;
          line-height: 1.05;
          font-weight: 700;
          margin-bottom: 8px;
        }

        .tip-author,
        .tip-year {
          text-align: center;
          font-size: 20px;
          line-height: 1.15;
        }

        .empty {
          font-weight: 700;
          font-size: 20px;
          padding: 12px 0;
        }

        @media (max-width: 800px) {
          .animal-explorer {
            padding: 20px;
          }

          .animal-title {
            font-size: 30px;
          }

          .animal-intro {
            font-size: 20px;
          }

          .controls {
            grid-template-columns: 1fr;
            gap: 14px;
          }

          .icon-scroll {
            height: 560px;
          }
        }
      </style>

      <h1 class="animal-title">Explore All Animal Characters</h1>

      <div class="animal-intro">
        <p>When I spend time with kids, I become hyperconscious of my word choices. “Look at Mr. Frog in the pond. Doesn’t he look grumpy?” Why did I say Mr. Frog? Why did I say he?</p>
        <p>Where do these gendered presumptions even come from, and how pervasive are they? Is it common to assume that a frog is a “he?” What about a bear, or a bird, or a cat, or a pig?</p>
        <p>I wanted to know: Which animals do we gender, and why?</p>
      </div>

      <div class="controls">
        <div class="control search-control">
          <label>Search by title</label>
          <div class="search-shell">
            <input class="search" placeholder="Ex: Goodnight Moon" autocomplete="off">
            <button class="clear-search" aria-label="Clear search">×</button>
            <div class="suggestions"></div>
          </div>
        </div>

        <div class="control">
          <label>Filter by animal</label>
          <select class="animal-filter"></select>
        </div>

        <div class="control">
          <label>Filter by pronoun</label>
          <select class="pronoun-filter"></select>
        </div>
      </div>

      <div class="summary-labels"></div>
      <div class="summary-bar"></div>

      <div class="meta-row">
        <div class="count"></div>
        <div>Hover an animal icon for details</div>
      </div>

      <div class="icon-scroll">
        <div class="icon-grid"></div>
      </div>

      <div class="tooltip"></div>
    </div>
  `;

  const searchInput = root.querySelector(".search");
  const clearSearch = root.querySelector(".clear-search");
  const suggestions = root.querySelector(".suggestions");
  const animalFilter = root.querySelector(".animal-filter");
  const pronounFilter = root.querySelector(".pronoun-filter");
  const labels = root.querySelector(".summary-labels");
  const bar = root.querySelector(".summary-bar");
  const count = root.querySelector(".count");
  const grid = root.querySelector(".icon-grid");
  const scrollBox = root.querySelector(".icon-scroll");
  const tooltip = root.querySelector(".tooltip");

  for (const a of animals) {
    animalFilter.appendChild(new Option(a === "All animals" ? a : titleCase(a), a));
  }

  for (const p of pronouns) {
    pronounFilter.appendChild(new Option(p.label, p.value));
  }

  const state = {
    search: "",
    animal: "All animals",
    pronoun: "All pronouns"
  };

  function pct(n, total) {
    return total ? `${((n / total) * 100).toFixed(1)}%` : "0.0%";
  }

  function pronounClass(p) {
    if (p === "he/him") return "tip-he";
    if (p === "she/her") return "tip-she";
    return "tip-other";
  }

  function placeTooltip(event) {
    const rootRect = root.getBoundingClientRect();
    const tipRect = tooltip.getBoundingClientRect();

    let left = event.clientX - rootRect.left + 18;
    let top = event.clientY - rootRect.top + 18;

    if (left + tipRect.width > rootRect.width - 12) {
      left = event.clientX - rootRect.left - tipRect.width - 18;
    }

    if (top + tipRect.height > rootRect.height - 12) {
      top = event.clientY - rootRect.top - tipRect.height - 18;
    }

    tooltip.style.left = `${Math.max(10, left)}px`;
    tooltip.style.top = `${Math.max(10, top)}px`;
  }

  function showTooltip(event, d) {
    tooltip.replaceChildren();

    const animal = document.createElement("div");
    animal.className = "tip-animal";
    animal.textContent = titleCase(d.animal);

    const pronoun = document.createElement("div");
    pronoun.className = `tip-pronoun ${pronounClass(d.pronoun)}`;
    pronoun.textContent = pronounLabel(d.pronoun);

    const coverWrap = document.createElement("div");
    coverWrap.className = "tip-cover-wrap";

    const cover = document.createElement("img");
    cover.className = "tip-cover";
    cover.src = d.book_cover_image;
    cover.alt = d.title;
    coverWrap.appendChild(cover);

    const title = document.createElement("div");
    title.className = "tip-title";
    title.textContent = d.title;

    const author = document.createElement("div");
    author.className = "tip-author";
    author.textContent = `By ${d.author}`;

    const year = document.createElement("div");
    year.className = "tip-year";
    year.textContent = d.pub_year;

    tooltip.append(animal, pronoun, coverWrap, title, author, year);

    tooltip.style.opacity = 1;
    placeTooltip(event);
  }

  function hideTooltip() {
    tooltip.style.opacity = 0;
  }

  function hideSuggestions() {
    suggestions.style.display = "none";
  }

  function showSuggestions() {
    suggestions.style.display = "block";
  }

  function baseSuggestionData() {
    const q = state.search.trim().toLowerCase();

    const matches = data.filter(d => {
      const matchAnimal = state.animal === "All animals" || d.animal === state.animal;
      const matchPronoun = state.pronoun === "All pronouns" || d.pronoun === state.pronoun;
      const matchSearch = !q || d.title.toLowerCase().includes(q);
      return matchAnimal && matchPronoun && matchSearch;
    });

    const seen = new Set();
    const unique = [];

    for (const d of matches.sort((a, b) => a.title.localeCompare(b.title))) {
      const key = `${d.title}|${d.author}|${d.pub_year}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(d);
      }
    }

    return unique.slice(0, 12);
  }

  function renderSuggestions() {
    suggestions.replaceChildren();

    const rows = baseSuggestionData();

    if (!rows.length) {
      hideSuggestions();
      return;
    }

    for (const d of rows) {
      const item = document.createElement("button");
      item.className = "suggestion-item";
      item.textContent = `${d.title} (${d.pub_year}) — ${d.author}`;

      item.addEventListener("mousedown", event => {
        event.preventDefault();
        state.search = d.title;
        searchInput.value = d.title;
        render();
        hideSuggestions();
      });

      suggestions.appendChild(item);
    }
  }

  function renderSummary(items) {
    const total = items.length;
    const he = items.filter(d => d.pronoun === "he/him").length;
    const she = items.filter(d => d.pronoun === "she/her").length;
    const other = items.filter(d => d.pronoun === "other").length;

    labels.replaceChildren();

    const heLabel = document.createElement("div");
    heLabel.textContent = `He/him: ${pct(he, total)}`;

    const sheLabel = document.createElement("div");
    sheLabel.textContent = `She/her: ${pct(she, total)}`;

    const otherLabel = document.createElement("div");
    otherLabel.textContent = `Other: ${pct(other, total)}`;

    labels.append(heLabel, sheLabel, otherLabel);

    bar.replaceChildren();

    const parts = [
      { value: he, cls: "bar-he" },
      { value: she, cls: "bar-she" },
      { value: other, cls: "bar-other" }
    ];

    for (const part of parts) {
      const seg = document.createElement("div");
      seg.className = part.cls;
      seg.style.width = total ? `${(part.value / total) * 100}%` : "0%";
      seg.style.height = "100%";
      bar.appendChild(seg);
    }
  }

  function filteredData() {
    const q = state.search.trim().toLowerCase();

    const items = data.filter(d => {
      const matchSearch = !q || d.title.toLowerCase().includes(q);
      const matchAnimal = state.animal === "All animals" || d.animal === state.animal;
      const matchPronoun = state.pronoun === "All pronouns" || d.pronoun === state.pronoun;

      return matchSearch && matchAnimal && matchPronoun;
    });

    return sortByAnimalCount(items);
  }

  function renderGrid(items) {
    grid.replaceChildren();

    if (!items.length) {
      const empty = document.createElement("div");
      empty.className = "empty";
      empty.textContent = "No matching animal characters found.";
      grid.appendChild(empty);
      return;
    }

    for (const d of items) {
      const btn = document.createElement("button");
      btn.className = "animal-icon";
      btn.setAttribute("aria-label", `${titleCase(d.animal)}, ${pronounLabel(d.pronoun)}, ${d.title}`);

      const img = document.createElement("img");
      img.src = d.icon_url;
      img.alt = titleCase(d.icon_animal);
      img.loading = "lazy";

      btn.appendChild(img);

      btn.addEventListener("mouseenter", event => showTooltip(event, d));
      btn.addEventListener("mousemove", event => placeTooltip(event));
      btn.addEventListener("mouseleave", hideTooltip);

      grid.appendChild(btn);
    }
  }

  function render() {
    const items = filteredData();

    count.textContent = `${items.length.toLocaleString()} animal characters shown`;

    clearSearch.style.visibility = state.search ? "visible" : "hidden";

    renderSummary(items);
    renderGrid(items);
    renderSuggestions();
  }

  searchInput.addEventListener("focus", () => {
    renderSuggestions();
    showSuggestions();
  });

  searchInput.addEventListener("input", event => {
    state.search = event.target.value;
    render();
    showSuggestions();
  });

  clearSearch.addEventListener("click", () => {
    state.search = "";
    searchInput.value = "";
    render();
    searchInput.focus();
    showSuggestions();
  });

  animalFilter.addEventListener("change", event => {
    state.animal = event.target.value;
    render();
  });

  pronounFilter.addEventListener("change", event => {
    state.pronoun = event.target.value;
    render();
  });

  root.addEventListener("pointerdown", event => {
    if (!event.target.closest(".search-shell")) {
      hideSuggestions();
    }
  });

  scrollBox.addEventListener("scroll", hideTooltip);

  render();

  return root;
}


function _3(md){return(
md`[Original chart, images, and data](https://pudding.cool/2025/07/kids-books/) by Melanie Walsh (with Russell Samora, Michelle Pera-McGhee, Jan Diehm) on [The Pudding](https://pudding.cool/)`
)}

export default function define(runtime, observer) {
  const main = runtime.module();
  function toString() { return this.url; }
  const fileAttachments = new Map([
    ["kids-book-animals.csv", {url: new URL("./files/75b689ef0b53c8d3a7beeeb695bec49ad0fd08d103e0d716af36bf146681ed6e422883ba3e725a4021e9d24c87bb29848d35010ed213846b269d1c46a2014ef4.csv", import.meta.url), mimeType: "text/csv", toString}]
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], _1);
  main.variable(observer()).define(["FileAttachment","html","Option"], _2);
  main.variable(observer()).define(["md"], _3);
  return main;
}
