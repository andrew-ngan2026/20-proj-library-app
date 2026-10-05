// TOP library application

const DEFAULT_COVER = "images/covers/default.svg";

const myLibrary = [];

// Current view settings. These only affect how books are displayed,
// never the data stored in myLibrary.
const view = {
    filter: "all", // "all" | "read" | "unread"
    search: "",
    sort: "title-asc",
};

/* ---------- Data: Book and library ---------- */

function Book(title, author, pages, read, cover) {
    if (!new.target) {
        throw Error("You must use the 'new' operator to call the constructor");
    }
    this.id = crypto.randomUUID();
    this.title = title;
    this.author = author;
    this.pages = pages;
    this.read = read;
    this.cover = cover || DEFAULT_COVER; // location of the cover icon/image
}

Book.prototype.toggleRead = function () {
    this.read = !this.read;
};

Book.prototype.info = function () {
    const status = this.read ? "read already!" : "not read yet.";
    return `${this.title} by ${this.author}, ${this.pages} pages, ${status}`;
};

function addBookToLibrary(title, author, pages, read, cover) {
    const book = new Book(title, author, pages, read, cover);
    myLibrary.push(book);
    return book;
}

function removeBookFromLibrary(id) {
    const index = myLibrary.findIndex((book) => book.id === id);
    if (index !== -1) {
        myLibrary.splice(index, 1);
    }
}

function findBook(id) {
    return myLibrary.find((book) => book.id === id);
}

/* ---------- Display ---------- */

const bookGrid = document.querySelector("#book-grid");
const emptyState = document.querySelector("#empty-state");
const resultsCount = document.querySelector("#results-count");
const filterReadBtn = document.querySelector("#filter-read");
const filterUnreadBtn = document.querySelector("#filter-unread");

const sorters = {
    "title-asc": (a, b) => a.title.localeCompare(b.title),
    "title-desc": (a, b) => b.title.localeCompare(a.title),
    "author-asc": (a, b) => a.author.localeCompare(b.author),
    "pages-asc": (a, b) => a.pages - b.pages,
    "pages-desc": (a, b) => b.pages - a.pages,
};

function getVisibleBooks() {
    const term = view.search.trim().toLowerCase();

    return myLibrary
        .filter((book) => {
            if (view.filter === "read") return book.read;
            if (view.filter === "unread") return !book.read;
            return true;
        })
        .filter((book) => {
            return (
                book.title.toLowerCase().includes(term) ||
                book.author.toLowerCase().includes(term)
            );
        })
        .sort(sorters[view.sort]);
}

function createElement(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
}

function createIcon(name, size) {
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("class", "icon");
    svg.setAttribute("width", size);
    svg.setAttribute("height", size);
    svg.setAttribute("aria-hidden", "true");
    const use = document.createElementNS(svgNS, "use");
    use.setAttribute("href", `#icon-${name}`);
    svg.appendChild(use);
    return svg;
}

function createBookCard(book) {
    const card = createElement("article", "book-card");
    card.dataset.id = book.id;

    const cover = createElement("img", "book-card__cover");
    cover.src = book.cover;
    cover.alt = `Cover of ${book.title}`;

    const info = createElement("div", "book-card__info");
    info.append(
        createElement("h2", "book-card__title", book.title),
        createElement("p", "book-card__author", `by ${book.author}`),
        createElement(
            "p",
            "book-card__pages",
            `${book.pages} ${book.pages === 1 ? "page" : "pages"}`
        )
    );

    const toggle = createElement("label", "toggle book-card__toggle");
    const toggleText = createElement("span", null, book.read ? "Read" : "Unread");
    const toggleInput = createElement("input", "toggle__switch");
    toggleInput.type = "checkbox";
    toggleInput.setAttribute("role", "switch");
    toggleInput.checked = book.read;
    toggleInput.dataset.action = "toggle-read";
    toggle.append(toggleText, toggleInput);

    const removeBtn = createElement("button", "remove-btn book-card__remove");
    removeBtn.type = "button";
    removeBtn.dataset.action = "remove";
    removeBtn.append(createIcon("trash", 18), document.createTextNode("Remove"));

    card.append(cover, info, toggle, removeBtn);
    return card;
}

function updateStats() {
    const total = myLibrary.length;
    const read = myLibrary.filter((book) => book.read).length;
    const unread = total - read;

    document.querySelector("#stat-total").textContent = total;
    document.querySelector("#stat-read").textContent = read;
    document.querySelector("#stat-unread").textContent = unread;
    document.querySelector("#filter-read-count").textContent = read;
    document.querySelector("#filter-unread-count").textContent = unread;
}

function updateFilterButtons() {
    filterReadBtn.setAttribute("aria-pressed", view.filter === "read");
    filterUnreadBtn.setAttribute("aria-pressed", view.filter === "unread");
}

function displayBooks() {
    const visibleBooks = getVisibleBooks();

    bookGrid.replaceChildren(...visibleBooks.map(createBookCard));

    resultsCount.textContent = `${visibleBooks.length} ${
        visibleBooks.length === 1 ? "book" : "books"
    }`;

    if (visibleBooks.length === 0) {
        emptyState.hidden = false;
        emptyState.textContent =
            myLibrary.length === 0
                ? "Your library is empty. Select New Book to add your first one."
                : "No books match your search or filter.";
    } else {
        emptyState.hidden = true;
    }

    updateStats();
    updateFilterButtons();
}

/* ---------- Events ---------- */

// Remove and read-status buttons (event delegation on the grid)
bookGrid.addEventListener("click", (event) => {
    const removeBtn = event.target.closest('[data-action="remove"]');
    if (!removeBtn) return;

    const id = removeBtn.closest(".book-card").dataset.id;
    removeBookFromLibrary(id);
    displayBooks();
});

bookGrid.addEventListener("change", (event) => {
    if (event.target.dataset.action !== "toggle-read") return;

    const id = event.target.closest(".book-card").dataset.id;
    const book = findBook(id);
    book.toggleRead();
    displayBooks();

    // The card was re-created, so give keyboard focus back to its switch
    const newSwitch = bookGrid.querySelector(`[data-id="${id}"] .toggle__switch`);
    if (newSwitch) newSwitch.focus();
});

// Search, quick filters and sorting
document.querySelector("#search").addEventListener("input", (event) => {
    view.search = event.target.value;
    displayBooks();
});

function toggleFilter(name) {
    view.filter = view.filter === name ? "all" : name;
    displayBooks();
}

filterReadBtn.addEventListener("click", () => toggleFilter("read"));
filterUnreadBtn.addEventListener("click", () => toggleFilter("unread"));

document.querySelector("#sort").addEventListener("change", (event) => {
    view.sort = event.target.value;
    displayBooks();
});

// New Book dialog
const dialog = document.querySelector("#book-dialog");
const form = document.querySelector("#book-form");

document.querySelector("#new-book-btn").addEventListener("click", () => {
    dialog.showModal();
});

document.querySelector("#cancel-btn").addEventListener("click", () => {
    dialog.close();
});

// Runs for Cancel, Escape and a successful submit, so the form is always clean
dialog.addEventListener("close", () => {
    form.reset();
});

form.addEventListener("submit", (event) => {
    // Stop the form from trying to send data to a server
    event.preventDefault();

    const data = new FormData(form);
    addBookToLibrary(
        data.get("title").trim(),
        data.get("author").trim(),
        Number(data.get("pages")),
        data.has("read"),
        data.get("cover")
    );

    dialog.close();
    displayBooks();
});

/* ---------- Sample books ---------- */

addBookToLibrary("The Mountain", "Alex Rivers", 320, true, "images/covers/mountain.svg");
addBookToLibrary("Bright Days", "Sam Lee", 184, false, "images/covers/tree.svg");
addBookToLibrary("Night Sky", "Priya Shah", 276, true, "images/covers/moon.svg");
addBookToLibrary("Green Paths", "Jamie Kim", 402, false, "images/covers/leaf.svg");
addBookToLibrary("City Lights", "Morgan Cruz", 230, true, "images/covers/city.svg");
addBookToLibrary("River Tales", "Casey Nguyen", 315, false, "images/covers/river.svg");

displayBooks();
