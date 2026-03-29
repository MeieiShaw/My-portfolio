const AppModel = {
  themeStorageKey: "theme",
  visitorEndpoint:
    "https://fragrant-wind-f939.alphamikefoxtrot9948.workers.dev/hit/portfolio",
};

const AppView = {
  init() {
    this.yearEl = document.getElementById("year");
    this.themeToggle = document.getElementById("themeToggle");
    this.visitorCount = document.getElementById("visitorCount");
    this.revealTargets = Array.from(
      document.querySelectorAll(".sectionHead, .card, .timeline-item")
    );
  },

  setYear(value) {
    if (this.yearEl) this.yearEl.textContent = value;
  },

  setThemeButton(isLight) {
    if (!this.themeToggle) return;
    this.themeToggle.setAttribute("aria-pressed", String(isLight));
    const label = isLight
      ? "Switch to dark mode"
      : "Switch to light mode";
    this.themeToggle.setAttribute("aria-label", label);
    this.themeToggle.setAttribute("title", label);
  },

  setVisitorCount(value) {
    if (this.visitorCount) this.visitorCount.textContent = value;
  },

  setVisitorError() {
    if (this.visitorCount) this.visitorCount.textContent = "N/A";
  },

  prepareReveal() {
    this.revealTargets.forEach((el) => {
      el.classList.add("reveal");

      if (el.classList.contains("reveal-left") || el.classList.contains("reveal-right")) {
        return;
      }

      if (el.classList.contains("timeline-item")) {
        el.classList.add(
          el.classList.contains("left") ? "reveal-left" : "reveal-right"
        );
      }
    });
  },

  observeReveal() {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("show");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -10% 0px" }
    );

    this.revealTargets.forEach((el) => observer.observe(el));
  },
};

const AppController = {
  init() {
    AppView.init();
    this.applySavedTheme();
    this.bindEvents();
    AppView.setYear(new Date().getFullYear());
    AppView.prepareReveal();
    AppView.observeReveal();
    this.loadVisitorCounter();
  },

  applySavedTheme() {
    const savedTheme = localStorage.getItem(AppModel.themeStorageKey);
    if (savedTheme === "light") {
      document.body.classList.add("light");
    }
    AppView.setThemeButton(document.body.classList.contains("light"));
  },

  bindEvents() {
    if (!AppView.themeToggle) return;
    AppView.themeToggle.addEventListener("click", () => {
      this.toggleTheme();
    });
  },

  toggleTheme() {
    const isLight = document.body.classList.toggle("light");
    localStorage.setItem(
      AppModel.themeStorageKey,
      isLight ? "light" : "dark"
    );
    AppView.setThemeButton(isLight);
  },

  loadVisitorCounter() {
    if (!AppView.visitorCount) return;

    fetch(AppModel.visitorEndpoint)
      .then((response) => response.json())
      .then((data) => {
        if (typeof data.value === "number") {
          AppView.setVisitorCount(data.value.toLocaleString());
        } else {
          AppView.setVisitorError();
        }
      })
      .catch(() => {
        AppView.setVisitorError();
      });
  },
};

AppController.init();
