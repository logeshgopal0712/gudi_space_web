const navigationToggle = document.querySelector("#builder-menu-toggle");
const builderNavigation = document.querySelector("#builder-navigation");

function closeBuilderNavigation() {
  builderNavigation?.classList.remove("open");
  navigationToggle?.setAttribute("aria-expanded", "false");
}

navigationToggle?.addEventListener("click", () => {
  const open = builderNavigation?.classList.toggle("open") === true;
  navigationToggle.setAttribute("aria-expanded", String(open));
});

builderNavigation?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", closeBuilderNavigation);
});

document.addEventListener("click", (event) => {
  if (
    builderNavigation?.classList.contains("open") &&
    !event.target.closest(".builder-topbar")
  ) {
    closeBuilderNavigation();
  }
});

function setSharedColors(colors = {}) {
  const root = document.documentElement.style;
  root.setProperty("--accent", colors.primary || "#2563eb");
  root.setProperty("--success", colors.primary || "#2563eb");
  root.setProperty("--navy", colors.button || "#123b72");
  root.setProperty("--completion-start", colors.completion || "#2563eb");
  root.setProperty("--completion-end", colors.completion || "#2563eb");
  root.setProperty("--completion-link", colors.completion || "#2563eb");
}

function setBrandLogo(brand = {}) {
  document.querySelectorAll("[data-brand-logo]").forEach((image) => {
    const fallback = image.parentElement.querySelector(
      "[data-brand-logo-fallback]",
    );
    const path = String(brand.logoPath || "").trim();
    if (!path) {
      image.hidden = true;
      fallback.hidden = false;
      return;
    }
    image.addEventListener(
      "load",
      () => {
        image.hidden = false;
        fallback.hidden = true;
      },
      { once: true },
    );
    image.addEventListener(
      "error",
      () => {
        image.hidden = true;
        fallback.hidden = false;
      },
      { once: true },
    );
    image.src = path;
  });
}

const builderContactForm = document.querySelector("#builder-contact-form");
const contactUsStatus = document.querySelector("#contact-us-status");
const builderContactEndpoint = "";

if (builderContactForm) {
  const contactUsButton = builderContactForm.querySelector(
    'button[type="submit"]',
  );

  builderContactForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!builderContactForm.reportValidity()) return;
    if (!builderContactEndpoint) {
      if (contactUsStatus) {
        contactUsStatus.textContent =
          "Contact form delivery will be available after the form endpoint is connected.";
        contactUsStatus.className = "home-panel-status";
      }
      return;
    }

    if (contactUsStatus) {
      contactUsStatus.textContent = "Sending message...";
      contactUsStatus.className = "home-panel-status";
    }
    contactUsButton.disabled = true;
    try {
      const response = await fetch(builderContactEndpoint, {
        method: "POST",
        body: new FormData(builderContactForm),
      });
      if (!response.ok) throw new Error(`Form returned ${response.status}.`);
      builderContactForm.reset();
      if (contactUsStatus) {
        contactUsStatus.textContent = "Message sent successfully.";
        contactUsStatus.className = "home-panel-status success";
      }
    } catch (error) {
      if (contactUsStatus) {
        contactUsStatus.textContent = `Could not send message: ${error.message}`;
        contactUsStatus.className = "home-panel-status error";
      }
    } finally {
      contactUsButton.disabled = false;
    }
  });
}

function renderHowItWorks(items) {
  const container = document.querySelector("[data-how-it-works-list]");
  if (!container) return;
  container.replaceChildren();
  (Array.isArray(items) ? items : []).forEach((item, index) => {
    if (!item || typeof item !== "object") return;
    const card = document.createElement("article");
    card.className = "information-tile";
    const number = document.createElement("strong");
    number.textContent = String(index + 1);
    const heading = document.createElement("h2");
    heading.textContent = String(item.heading || "");
    const description = document.createElement("p");
    description.textContent = String(item.description || "");
    card.append(number, heading, description);
    container.append(card);
  });
}

function renderWhyUs(items) {
  const list = document.querySelector("[data-why-us-list]");
  if (!list) return;
  list.replaceChildren();

  const valid = (Array.isArray(items) ? items : []).filter(
    (item) => item && typeof item === "object" && String(item.heading || "").trim(),
  );
  if (!valid.length) return;

  valid.forEach((item) => {
    const row = document.createElement("div");
    row.className = "why-us-row";
    const mark = document.createElement("strong");
    mark.textContent = "\u2713";
    const textGroup = document.createElement("div");
    textGroup.className = "why-us-text";
    const heading = document.createElement("p");
    heading.className = "why-us-heading";
    heading.textContent = String(item.heading || "");
    textGroup.append(heading);
    const description = String(item.description || "").trim();
    if (description) {
      const descriptionEl = document.createElement("p");
      descriptionEl.className = "why-us-description";
      descriptionEl.textContent = description;
      textGroup.append(descriptionEl);
    }
    row.append(mark, textGroup);
    list.append(row);
  });
}

function validExampleUrl(value) {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
}

function renderExamples(items) {
  const examples = (Array.isArray(items) ? items : []).filter(
    (item) => item && typeof item === "object" && validExampleUrl(item.url),
  );
  document.querySelectorAll('[data-navigation-key="examples"]').forEach((link) => {
    link.hidden = examples.length === 0;
  });

  const container = document.querySelector("[data-examples-list]");
  if (!container) return;
  container.replaceChildren();
  examples.forEach((item) => {
    const card = document.createElement("a");
    card.className = "example-tile";
    card.href = validExampleUrl(item.url);
    card.target = "_blank";
    card.rel = "noopener noreferrer";
    const category = document.createElement("span");
    category.textContent = String(item.category || "Website");
    const heading = document.createElement("h2");
    heading.textContent = String(item.heading || "");
    const description = document.createElement("p");
    description.textContent = String(item.description || "");
    const linkText = document.createElement("b");
    linkText.textContent = "View website →";
    card.append(category, heading, description, linkText);
    container.append(card);
  });

  if (examples.length === 0) {
    const emptyState = document.createElement("p");
    emptyState.className = "empty-page-state";
    emptyState.textContent = "No examples have been added yet.";
    container.append(emptyState);
  }
}

function renderPricing(items) {
  const pricing = (Array.isArray(items) ? items : []).filter(
    (item) =>
      item &&
      typeof item === "object" &&
      String(item.heading || "").trim() &&
      String(item.price || "").trim(),
  );
  document.querySelectorAll('[data-navigation-key="pricing"]').forEach((link) => {
    link.hidden = pricing.length === 0;
  });

  const container = document.querySelector("[data-pricing-list]");
  if (!container) return;
  container.replaceChildren();
  pricing.forEach((item) => {
    const card = document.createElement("article");
    card.className = "pricing-tile";

    const heading = document.createElement("h2");
    heading.textContent = String(item.heading || "");
    const price = document.createElement("strong");
    price.className = "pricing-value";
    price.textContent = String(item.price || "");
    card.append(heading, price);

    if (String(item.description || "").trim()) {
      const description = document.createElement("p");
      description.textContent = String(item.description).trim();
      card.append(description);
    }

    const features = (Array.isArray(item.features) ? item.features : [])
      .map((feature) => String(feature || "").trim())
      .filter(Boolean);
    if (features.length) {
      const list = document.createElement("ul");
      features.forEach((feature) => {
        const listItem = document.createElement("li");
        listItem.textContent = feature;
        list.append(listItem);
      });
      card.append(list);
    }

    const link = validExampleUrl(item.url);
    if (link) {
      const action = document.createElement("a");
      action.href = link;
      action.target = "_blank";
      action.rel = "noopener noreferrer";
      action.textContent = String(item.buttonLabel || "Choose plan");
      card.append(action);
    }

    container.append(card);
  });

  if (pricing.length === 0) {
    const emptyState = document.createElement("p");
    emptyState.className = "empty-page-state";
    emptyState.textContent = "Pricing information has not been added yet.";
    container.append(emptyState);
  }
}

function renderFaq(items) {
  const container = document.querySelector("[data-faq-list]");
  if (!container) return;
  container.replaceChildren();
  (Array.isArray(items) ? items : []).forEach((item) => {
    if (!item || typeof item !== "object") return;
    const entry = document.createElement("details");
    const question = document.createElement("summary");
    question.textContent = String(item.question || "");
    const answer = document.createElement("p");
    answer.textContent = String(item.answer || "");
    entry.append(question, answer);
    container.append(entry);
  });
}

function applySharedConfiguration(configuration) {
  document.querySelectorAll("[data-config-text]").forEach((element) => {
    const [group, key] = element.dataset.configText.split(".");
    const value = configuration[group]?.[key];
    if (typeof value === "string") element.textContent = value;
  });
  setSharedColors(configuration.colors);
  setBrandLogo(configuration.brand);
  renderHowItWorks(configuration.howItWorks);
  renderWhyUs(configuration.whyUs);
  renderExamples(configuration.examples);
  renderPricing(configuration.pricing);
  renderFaq(configuration.faq);
}

const sharedConfiguration = window.builderConfigReady
  ? window.builderConfigReady.then(() => window.builderConfig)
  : fetch("data/data.json", { cache: "no-store" }).then((response) => {
      if (!response.ok) {
        throw new Error(`Could not load GudiSpace content (${response.status}).`);
      }
      return response.json();
    });

sharedConfiguration
  .then(applySharedConfiguration)
  .then(applyLiveTrialDays)
  .catch((error) => console.error("GudiSpace page content failed to load.", error));

// How-it-works/FAQ content (above) references the free trial length as a
// {{TRIAL_DAYS}} placeholder rather than a hardcoded number, so it stays
// correct if that's ever changed - same reasoning as every other trial-
// days display across the site. Swapped in from the live worker value
// after the static content has rendered.
const livePlanPricesEndpoint =
  "https://stabilisation-gudi-space-workers.hellogudispace.workers.dev/api/planPrices";

function applyLiveTrialDays() {
  return fetch(livePlanPricesEndpoint)
    .then((response) => response.json())
    .then((data) => {
      if (typeof data?.freeTrialDays !== "number") return;
      const trialDays = String(data.freeTrialDays);
      document
        .querySelectorAll("[data-how-it-works-list], [data-faq-list]")
        .forEach((container) => {
          container.querySelectorAll("*").forEach((node) => {
            if (
              node.children.length === 0 &&
              node.textContent.includes("{{TRIAL_DAYS}}")
            ) {
              node.textContent = node.textContent.replaceAll(
                "{{TRIAL_DAYS}}",
                trialDays,
              );
            }
          });
        });
    })
    .catch((error) =>
      console.error("Could not fetch live trial length for page content.", error),
    );
}
