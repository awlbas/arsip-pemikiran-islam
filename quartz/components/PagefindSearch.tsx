import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"

const ALGOLIA_APP_ID = "C3TCNMT1PZ"
const ALGOLIA_SEARCH_KEY = "ae60e70a9b5a94b1235fd5fa86af5bcc"
const ALGOLIA_INDEX = "arsip_pemikiran_islam"

const PagefindSearch: QuartzComponent = ({}: QuartzComponentProps) => {
  return (
    <div class="pagefind-trigger-wrapper">
      <button id="pagefind-trigger" aria-label="Cari artikel">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <span>Cari artikel...</span>
        <kbd>Ctrl+K</kbd>
      </button>

      <div id="search-modal-overlay">
        <div id="search-modal">
          <div id="search-input-wrapper">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input id="search-input" type="text" placeholder="Cari artikel..." autocomplete="off" />
          </div>
          <div id="search-results"></div>
          <div id="search-hint">Tekan <kbd>Esc</kbd> untuk tutup</div>
        </div>
      </div>
    </div>
  )
}

PagefindSearch.afterDOMLoaded = `
  let searchIndex = null;
  let currentHits = [];
  let visibleCount = 10;

  async function loadAlgolia() {
    if (searchIndex) return;

    if (!window.algoliasearch) {
      await new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/npm/algoliasearch@4/dist/algoliasearch-lite.umd.js";
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }

    const client = window.algoliasearch("${ALGOLIA_APP_ID}", "${ALGOLIA_SEARCH_KEY}");
    searchIndex = client.initIndex("${ALGOLIA_INDEX}");
  }

  function getHighlight(hit, attr) {
    const h = hit._highlightResult?.[attr];
    if (!h || !h.value) return hit[attr] || "";
    return h.value.replace(/<em>/g, "<mark>").replace(/<\\/em>/g, "</mark>");
  }

  function getSnippet(hit, attr) {
    const s = hit._snippetResult?.[attr];
    if (!s || !s.value) return "";
    return s.value.replace(/<em>/g, "<mark>").replace(/<\\/em>/g, "</mark>");
  }

  function renderResults(hits, count) {
    const container = document.getElementById("search-results");
    if (!container) return;

    if (!hits || hits.length === 0) {
      container.innerHTML = '<p class="search-empty">Tidak ditemukan.</p>';
      return;
    }

    const items = hits.slice(0, count).map(hit => {
      const title = getHighlight(hit, "title") || hit.title;
      const snippet = getSnippet(hit, "content");
      const desc = snippet || getHighlight(hit, "description") || hit.description || "";
      const tags = (hit.tags || []).slice(0, 3)
        .map(t => '<span class="search-tag">' + t + '</span>')
        .join("");

      return \`
        <a href="/\${hit.slug}" class="search-result-item">
          <div class="search-result-title">\${title}</div>
          \${desc ? '<div class="search-result-desc">' + desc + '</div>' : ""}
          \${tags ? '<div class="search-result-tags">' + tags + '</div>' : ""}
        </a>
      \`;
    }).join("");

    const loadMore = count < hits.length
      ? '<button id="search-load-more">Muat lebih banyak</button>'
      : "";

    container.innerHTML = items + loadMore;

    const btn = document.getElementById("search-load-more");
    if (btn) {
      btn.addEventListener("click", () => {
        visibleCount += 10;
        renderResults(currentHits, visibleCount);
      });
    }
  }

  let debounceTimer = null;

  async function doSearch(query) {
    if (!searchIndex || query.length < 2) {
      const container = document.getElementById("search-results");
      if (container) container.innerHTML = "";
      return;
    }

    try {
      const { hits } = await searchIndex.search(query, {
        attributesToSnippet: ["content:40"],
        snippetEllipsisText: "…",
        attributesToHighlight: ["title", "description"],
        hitsPerPage: 30,
        distinct: 1,
        typoTolerance: true,
      });

      currentHits = hits;
      visibleCount = 10;
      renderResults(currentHits, visibleCount);
    } catch (e) {
      console.error("Algolia search error:", e);
    }
  }

  async function openModal() {
    const overlay = document.getElementById("search-modal-overlay");
    if (!overlay) return;
    overlay.classList.add("open");

    await loadAlgolia();

    setTimeout(() => {
      const input = document.getElementById("search-input");
      if (input) input.focus();
    }, 50);
  }

  function closeModal() {
    const overlay = document.getElementById("search-modal-overlay");
    if (overlay) overlay.classList.remove("open");
    const input = document.getElementById("search-input");
    if (input) input.value = "";
    const results = document.getElementById("search-results");
    if (results) results.innerHTML = "";
    currentHits = [];
    visibleCount = 10;
  }

  function setupListeners() {
    const trigger = document.getElementById("pagefind-trigger");
    const overlay = document.getElementById("search-modal-overlay");
    const input = document.getElementById("search-input");

    if (trigger) trigger.addEventListener("click", openModal);

    if (overlay) {
      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) closeModal();
      });
    }

    if (input) {
      input.addEventListener("input", (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => doSearch(e.target.value.trim()), 200);
      });
    }

    document.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        openModal();
      }
      if (e.key === "Escape") closeModal();
    });
  }

  document.addEventListener("nav", setupListeners);
  setupListeners();
`

PagefindSearch.css = `
  .pagefind-trigger-wrapper {
    width: 100%;
  }

  #pagefind-trigger {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5em 0.75em;
    border: 1px solid var(--lightgray);
    border-radius: 5px;
    background: var(--light);
    color: var(--gray);
    cursor: pointer;
    font-size: 0.9rem;
    font-family: inherit;
    text-align: left;
  }

  #pagefind-trigger:hover {
    border-color: var(--gray);
    color: var(--darkgray);
  }

  #pagefind-trigger span { flex: 1; }

  #pagefind-trigger kbd {
    font-size: 0.7rem;
    padding: 0.1em 0.4em;
    border: 1px solid var(--lightgray);
    border-radius: 3px;
    background: var(--lightgray);
    color: var(--gray);
    font-family: inherit;
  }

  #search-modal-overlay {
    display: none;
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.5);
    z-index: 9999;
    align-items: flex-start;
    justify-content: center;
    padding-top: 8vh;
  }

  #search-modal-overlay.open { display: flex; }

  #search-modal {
    background: var(--light);
    border-radius: 10px;
    width: 90%;
    max-width: 600px;
    max-height: 80vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
  }

  #search-input-wrapper {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem;
    border-bottom: 1px solid var(--lightgray);
  }

  #search-input-wrapper svg { color: var(--gray); flex-shrink: 0; }

  #search-input {
    flex: 1;
    border: none;
    outline: none;
    font-size: 1rem;
    background: transparent;
    color: var(--dark);
    font-family: inherit;
  }

  #search-results {
    overflow-y: auto;
    padding: 0.5rem;
    flex: 1;
  }

  .search-result-item {
    display: block;
    padding: 0.75rem;
    border-radius: 6px;
    text-decoration: none;
    color: inherit;
    transition: background 0.1s;
  }

  .search-result-item:hover { background: var(--highlight); }

  .search-result-title {
    font-weight: 600;
    font-size: 0.95rem;
    color: var(--dark);
    margin-bottom: 0.2rem;
  }

  .search-result-desc {
    font-size: 0.82rem;
    color: var(--darkgray);
    line-height: 1.5;
    margin-bottom: 0.3rem;
  }

  .search-result-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.3rem;
  }

  .search-tag {
    font-size: 0.7rem;
    padding: 0.1em 0.5em;
    border-radius: 3px;
    background: var(--lightgray);
    color: var(--gray);
  }

  .search-result-item mark {
    background: var(--textHighlight);
    border-radius: 2px;
    padding: 0 1px;
  }

  #search-load-more {
    display: block;
    width: 100%;
    margin-top: 0.5rem;
    padding: 0.6rem;
    border: 1px solid var(--lightgray);
    border-radius: 6px;
    background: transparent;
    color: var(--secondary);
    font-size: 0.85rem;
    font-family: inherit;
    cursor: pointer;
    text-align: center;
  }

  #search-load-more:hover {
    background: var(--highlight);
  }

  .search-empty {
    text-align: center;
    color: var(--gray);
    padding: 2rem;
    font-size: 0.9rem;
  }

  #search-hint {
    padding: 0.5rem 1rem;
    font-size: 0.75rem;
    color: var(--gray);
    border-top: 1px solid var(--lightgray);
    text-align: right;
  }

  #search-hint kbd {
    font-size: 0.7rem;
    padding: 0.1em 0.4em;
    border: 1px solid var(--lightgray);
    border-radius: 3px;
    background: var(--lightgray);
    font-family: inherit;
  }
`

export default (() => PagefindSearch) satisfies QuartzComponentConstructor
