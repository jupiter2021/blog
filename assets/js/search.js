var fuse;
var searchData;
var showButton = document.getElementById("search-button");
var showButtonMobile = document.getElementById("search-button-mobile");
var hideButton = document.getElementById("close-search-button");
var wrapper = document.getElementById("search-wrapper");
var modal = document.getElementById("search-modal");
var input = document.getElementById("search-query");
var output = document.getElementById("search-results");
var first = output.firstChild;
var last = output.lastChild;
var searchVisible = false;
var indexed = false;
var hasResults = false;

// Listen for events
showButton ? showButton.addEventListener("click", displaySearch) : null;
showButtonMobile ? showButtonMobile.addEventListener("click", displaySearch) : null;
hideButton.addEventListener("click", hideSearch);
wrapper.addEventListener("click", hideSearch);
modal.addEventListener("click", function (event) {
  event.stopPropagation();
  event.stopImmediatePropagation();
  return false;
});
document.addEventListener("keydown", function (event) {
  // Forward slash to open search wrapper
  if (event.key == "/") {
    const active = document.activeElement;
    const tag = active.tagName;
    const isInputField = tag === "INPUT" || tag === "TEXTAREA" || active.isContentEditable;

    if (!searchVisible && !isInputField) {
      event.preventDefault();
      displaySearch();
    }
  }

  // Esc to close search wrapper
  if (event.key == "Escape") {
    hideSearch();
  }

  // Down arrow to move down results list
  if (event.key == "ArrowDown") {
    if (searchVisible && hasResults) {
      event.preventDefault();
      if (document.activeElement == input) {
        first.focus();
      } else if (document.activeElement == last) {
        last.focus();
      } else {
        document.activeElement.parentElement.nextSibling.firstElementChild.focus();
      }
    }
  }

  // Up arrow to move up results list
  if (event.key == "ArrowUp") {
    if (searchVisible && hasResults) {
      event.preventDefault();
      if (document.activeElement == input) {
        input.focus();
      } else if (document.activeElement == first) {
        input.focus();
      } else {
        document.activeElement.parentElement.previousSibling.firstElementChild.focus();
      }
    }
  }

  // Enter to get to results
  if (event.key == "Enter") {
    if (searchVisible && hasResults) {
      event.preventDefault();
      if (document.activeElement == input) {
        first.focus();
      } else {
        document.activeElement.click();
      }
    }
  }
});

// Update search on each keypress
input.onkeyup = function (event) {
  executeQuery(this.value);
};

function displaySearch() {
  if (!indexed) {
    buildIndex();
  }
  if (!searchVisible) {
    document.body.style.overflow = "hidden";
    wrapper.style.visibility = "visible";
    input.focus();
    searchVisible = true;
  }
}

function hideSearch() {
  if (searchVisible) {
    document.body.style.overflow = "visible";
    wrapper.style.visibility = "hidden";
    input.value = "";
    output.innerHTML = "";
    document.activeElement.blur();
    searchVisible = false;
  }
}

function fetchJSON(path, callback) {
  var httpRequest = new XMLHttpRequest();
  httpRequest.onreadystatechange = function () {
    if (httpRequest.readyState === 4) {
      if (httpRequest.status === 200) {
        var data = JSON.parse(httpRequest.responseText);
        if (callback) callback(data);
      }
    }
  };
  httpRequest.open("GET", path);
  httpRequest.send();
}

// Detect if a string contains CJK characters
function containsCJK(str) {
  return /[\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af]/.test(str);
}

// CJK-aware search: use exact substring matching for CJK queries
function searchCJK(term, data) {
  var results = [];
  var lowerTerm = term.toLowerCase();

  data.forEach(function (item) {
    var score = 0;
    var matched = false;

    // Search in title (highest priority)
    if (item.title && item.title.toLowerCase().includes(lowerTerm)) {
      score += 80;
      matched = true;
    }

    // Search in summary
    if (item.summary) {
      var plainSummary = item.summary.replace(/<[^>]*>/g, "").toLowerCase();
      if (plainSummary.includes(lowerTerm)) {
        score += 60;
        matched = true;
      }
    }

    // Search in content
    if (item.content && item.content.toLowerCase().includes(lowerTerm)) {
      score += 40;
      matched = true;
    }

    // Search in section
    if (item.section && item.section.toLowerCase().includes(lowerTerm)) {
      score += 20;
      matched = true;
    }

    if (matched) {
      results.push({ item: item, score: score });
    }
  });

  // Sort by score descending
  results.sort(function (a, b) {
    return b.score - a.score;
  });

  return results;
}

function buildIndex() {
  var baseURL = wrapper.getAttribute("data-url");
  baseURL = baseURL.replace(/\/?$/, "/");
  fetchJSON(baseURL + "index.json", function (data) {
    // Filter out category/tag listing pages to keep results clean
    searchData = data.filter(function (item) {
      return item.content && item.content.length > 0;
    });

    var options = {
      shouldSort: true,
      ignoreLocation: true,
      threshold: 0.0,
      includeMatches: true,
      minMatchCharLength: 2,
      keys: [
        { name: "title", weight: 0.8 },
        { name: "section", weight: 0.2 },
        { name: "summary", weight: 0.6 },
        { name: "content", weight: 0.4 },
      ],
    };
    fuse = new Fuse(searchData, options);
    indexed = true;
  });
}

function executeQuery(term) {
  if (!term || term.length < 1) {
    output.innerHTML = "";
    hasResults = false;
    return;
  }

  // Use CJK-aware search for CJK queries, Fuse.js for Latin
  let results;
  if (containsCJK(term)) {
    results = searchCJK(term, searchData);
  } else {
    results = fuse.search(term);
  }

  let resultsHTML = "";

  if (results.length > 0) {
    results.forEach(function (value, key) {
      var html = value.item.summary;
      var div = document.createElement("div");
      div.innerHTML = html;
      value.item.summary = div.textContent || div.innerText || "";
      var title = value.item.externalUrl
        ? value.item.title +
          '<span class="text-xs ml-2 align-center cursor-default text-neutral-400 dark:text-neutral-500">' +
          value.item.externalUrl +
          "</span>"
        : value.item.title;
      var linkconfig = value.item.externalUrl
        ? 'target="_blank" rel="noopener" href="' + value.item.externalUrl + '"'
        : 'href="' + value.item.permalink + '"';
      resultsHTML =
        resultsHTML +
        `<li class="mb-2">
          <a class="flex items-center px-3 py-2 rounded-md appearance-none bg-neutral-100 dark:bg-neutral-700 focus:bg-primary-100 hover:bg-primary-100 dark:hover:bg-primary-900 dark:focus:bg-primary-900 focus:outline-dotted focus:outline-transparent focus:outline-2" 
          ${linkconfig} tabindex="0">
            <div class="grow">
              <div class="-mb-1 text-lg font-bold">
                ${title}
              </div>
              <div class="text-sm text-neutral-500 dark:text-neutral-400">${value.item.section}<span class="px-2 text-primary-500">&middot;</span>${value.item.date ? value.item.date : ""}</span></div>
              <div class="text-sm italic">${value.item.summary}</div>
            </div>
            <div class="ml-2 ltr:block rtl:hidden text-neutral-500">&rarr;</div>
            <div class="mr-2 ltr:hidden rtl:block text-neutral-500">&larr;</div>
          </a>
        </li>`;
    });
    hasResults = true;
  } else {
    resultsHTML = "";
    hasResults = false;
  }

  output.innerHTML = resultsHTML;
  if (results.length > 0) {
    first = output.firstChild.firstElementChild;
    last = output.lastChild.firstElementChild;
  }
}
