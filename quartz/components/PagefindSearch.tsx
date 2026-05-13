import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"

const PagefindSearch: QuartzComponent = ({}: QuartzComponentProps) => {
  return (
    <div class="pagefind-search-wrapper">
      <div id="pagefind-search"></div>
    </div>
  )
}

PagefindSearch.afterDOMLoaded = `
  async function initPagefind() {
    const el = document.getElementById("pagefind-search");
    if (!el) return;

    // Load CSS once
    if (!document.querySelector('link[href="/pagefind/pagefind-ui.css"]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "/pagefind/pagefind-ui.css";
      document.head.appendChild(link);
    }

    // Load JS once
    if (!window.PagefindUI) {
      await new Promise((resolve) => {
        const script = document.createElement("script");
        script.src = "/pagefind/pagefind-ui.js";
        script.onload = resolve;
        document.head.appendChild(script);
      });
    }

    // Clear previous instance and init fresh
    el.innerHTML = "";
    new window.PagefindUI({
      element: "#pagefind-search",
      showSubResults: false,
      showImages: false,
      excerptLength: 20,
      resetStyles: false,
      translations: {
        placeholder: "Cari artikel...",
        zero_results: "Tidak ditemukan: [SEARCH_TERM]",
      },
    });
  }

  document.addEventListener("nav", initPagefind);
  initPagefind();
`

PagefindSearch.css = `
  .pagefind-search-wrapper {
    width: 100%;
  }

  .pagefind-ui__search-input {
    width: 100%;
    border: 1px solid var(--lightgray);
    border-radius: 5px;
    padding: 0.5em 1em;
    font-size: 1em;
    background: var(--light);
    color: var(--dark);
  }

  .pagefind-ui__search-input:focus {
    outline: none;
    border-color: var(--secondary);
  }

  .pagefind-ui__results {
    position: absolute;
    z-index: 999;
    background: var(--light);
    border: 1px solid var(--lightgray);
    border-radius: 5px;
    width: 90%;
    max-height: 60vh;
    overflow-y: auto;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  }

  .pagefind-ui__result {
    padding: 0.75em 1em;
    border-bottom: 1px solid var(--lightgray);
  }

  .pagefind-ui__result:hover {
    background: var(--highlight);
  }

  .pagefind-ui__result-title {
    font-weight: 600;
    color: var(--secondary);
  }

  .pagefind-ui__result-excerpt {
    font-size: 0.85em;
    color: var(--darkgray);
  }

  .pagefind-ui__search-clear {
    display: none;
  }

  .pagefind-ui__message {
    padding: 0.5em 1em;
    font-size: 0.9em;
    color: var(--gray);
  }
`

export default (() => PagefindSearch) satisfies QuartzComponentConstructor
