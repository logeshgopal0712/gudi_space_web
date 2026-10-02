(function () {
  // Same worker + branch prefix pattern app.js uses, so this hits the
  // same stabilisation environment without duplicating config anywhere
  // new.
  const prefix = "stabilisation-";
  const base = "https://" + prefix + "gudi-space-workers.hellogudispace.workers.dev";
  const endpoints = {
    otp: base + "/api/generateOtp",
    paymentStatus: base + "/api/paymentStatus",
    planPrices: base + "/api/planPrices",
    checkout: base + "/api/createCheckoutSession",
    portal: base + "/api/createPortalSession",
  };

  const emailField = document.querySelector("#plan-email");
  const emailConfirmField = document.querySelector("#plan-email-confirm");
  const lookupButton = document.querySelector("#plan-lookup");
  const statusBox = document.querySelector("#plan-status");
  const plansSection = document.querySelector("#plan-options");
  const monthlyButton = document.querySelector("#plan-monthly");
  const yearlyButton = document.querySelector("#plan-yearly");
  const monthlyPriceEl = document.querySelector("#plan-monthly-price");
  const yearlyPriceEl = document.querySelector("#plan-yearly-price");

  const otpSection = document.querySelector("#plan-otp-section");
  const sendOtpButton = document.querySelector("#plan-send-otp");
  const otpField = document.querySelector("#plan-otp");
  const openPortalButton = document.querySelector("#plan-open-portal");
  const manageStatus = document.querySelector("#plan-manage-status");

  if (!emailField) return; // this script only runs on manage_plan.html

  let currentEmail = "";

  function formatAmount(amount, currency) {
    if (typeof amount !== "number") return "";
    try {
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: (currency || "usd").toUpperCase(),
      }).format(amount / 100);
    } catch (err) {
      return `${(amount / 100).toFixed(2)} ${(currency || "").toUpperCase()}`;
    }
  }

  function setStatus(el, message, isError) {
    if (!el) return;
    el.textContent = message;
    el.className = "home-panel-status" + (isError ? " error" : message ? " success" : "");
  }

  async function fetchJson(url, options) {
    const response = await fetch(url, options);
    let data;
    try {
      data = await response.json();
    } catch (err) {
      throw new Error("The server returned an invalid response.");
    }
    if (!response.ok || data.success === false) {
      throw new Error(data.message || "Something went wrong.");
    }
    return data;
  }

  function currentReturnUrl(extraParams) {
    const url = new URL(window.location.origin + window.location.pathname);
    url.searchParams.set("email", currentEmail);
    Object.entries(extraParams || {}).forEach(([key, value]) => url.searchParams.set(key, value));
    return url.toString();
  }

  async function loadPlanState(email) {
    setStatus(statusBox, "Checking...", false);
    plansSection.hidden = true;
    otpSection.hidden = true;

    try {
      const [statusData, pricesData] = await Promise.all([
        fetchJson(`${endpoints.paymentStatus}?email=${encodeURIComponent(email)}`),
        fetchJson(endpoints.planPrices),
      ]);

      const isActive = statusData.status === "active";

      if (isActive) {
        setStatus(statusBox, `You're on the ${statusData.plan} plan.`, false);
      } else {
        setStatus(statusBox, "You don't have an active plan yet.", false);
      }

      if (monthlyPriceEl) {
        monthlyPriceEl.textContent = formatAmount(pricesData.prices?.monthly?.amount, pricesData.prices?.monthly?.currency);
      }
      if (yearlyPriceEl) {
        yearlyPriceEl.textContent = formatAmount(pricesData.prices?.yearly?.amount, pricesData.prices?.yearly?.currency);
      }

      // No plan yet -> only offer to add one. Already on a plan -> only
      // offer to manage it (switching monthly<->yearly and cancelling
      // both happen inside the Stripe billing portal, not here - see
      // openPortalButton below). Never show both at once, that's what
      // was confusing.
      plansSection.hidden = isActive;
      otpSection.hidden = !isActive;
    } catch (error) {
      setStatus(statusBox, error.message, true);
    }
  }

  lookupButton?.addEventListener("click", async () => {
    const email = emailField.value.trim();
    const confirmEmail = emailConfirmField ? emailConfirmField.value.trim() : email;

    if (!email) {
      setStatus(statusBox, "Enter your email first.", true);
      return;
    }
    // Catches a typo before it ever reaches checkout - a misspelled
    // email at payment time ties the subscription to an email the
    // person can never actually log back in with.
    if (email.toLowerCase() !== confirmEmail.toLowerCase()) {
      setStatus(statusBox, "Those two emails don't match. Please re-check.", true);
      return;
    }
    currentEmail = email;
    await loadPlanState(email);
  });

  async function startCheckout(plan) {
    if (!currentEmail) {
      setStatus(statusBox, "Enter your email first.", true);
      return;
    }
    setStatus(statusBox, "Redirecting to checkout...", false);
    try {
      const data = await fetchJson(endpoints.checkout, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: currentEmail,
          plan,
          successUrl: currentReturnUrl({ checkout: "success" }),
          cancelUrl: currentReturnUrl({ checkout: "cancel" }),
        }),
      });
      window.location.href = data.url;
    } catch (error) {
      setStatus(statusBox, error.message, true);
    }
  }

  monthlyButton?.addEventListener("click", () => startCheckout("monthly"));
  yearlyButton?.addEventListener("click", () => startCheckout("yearly"));

  sendOtpButton?.addEventListener("click", async () => {
    const email = currentEmail || emailField.value.trim();
    if (!email) {
      setStatus(manageStatus, "Enter your email above first.", true);
      return;
    }
    currentEmail = email;
    setStatus(manageStatus, "Sending code...", false);
    try {
      await fetchJson(endpoints.otp, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: currentEmail }),
      });
      setStatus(manageStatus, "Code sent. Check your email.", false);
    } catch (error) {
      setStatus(manageStatus, error.message, true);
    }
  });

  openPortalButton?.addEventListener("click", async () => {
    const otp = otpField.value.trim();
    if (!currentEmail) {
      setStatus(manageStatus, "Enter your email above and send a code first.", true);
      return;
    }
    if (!otp) {
      setStatus(manageStatus, "Enter the code we emailed you.", true);
      return;
    }
    setStatus(manageStatus, "Opening billing portal...", false);
    try {
      const data = await fetchJson(endpoints.portal, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: currentEmail,
          otp,
          returnUrl: currentReturnUrl(),
        }),
      });
      window.location.href = data.url;
    } catch (error) {
      setStatus(manageStatus, error.message, true);
    }
  });

  // Prefill from ?email= (e.g. the link in the "site is ready" email) and
  // load their plan state right away, so there's one less click. Falls
  // back to the last site created/modified in this browser (shared via
  // localStorage with the main builder page) when there's no query
  // param at all - e.g. arriving here from the plain "Manage Plan" nav
  // link instead of the "Add a plan"/emailed link that carries ?email=.
  function getLastCreatedSiteEmail() {
    try {
      const raw = localStorage.getItem("gudispace:lastCreatedSite");
      if (!raw) return "";
      return JSON.parse(raw)?.email || "";
    } catch (error) {
      return "";
    }
  }

  const params = new URLSearchParams(window.location.search);
  const prefillEmail = params.get("email") || getLastCreatedSiteEmail();
  if (prefillEmail) {
    emailField.value = prefillEmail;
    if (emailConfirmField) emailConfirmField.value = prefillEmail;
    currentEmail = prefillEmail;
    loadPlanState(prefillEmail);
  }
})();
