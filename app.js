const builderConfig = window.builderConfig;
if (!builderConfig || typeof builderConfig !== "object") {
  throw new Error("Builder configuration was not loaded.");
}

const builderHeadings = builderConfig.headings || {};
const builderTaglines = builderConfig.taglines || {};
const builderAbout = builderConfig.about || {};
const builderColors = builderConfig.colors || {};
const primaryColor = builderColors.primary || "#2563eb";
const buttonColor = builderColors.button || "#123b72";
const completionColor = builderColors.completion || "#2563eb";

const configuredText = (path) => {
  const [group, key] = path.split(".");
  if (key) return builderConfig[group]?.[key];
  return (
    builderHeadings[path] ||
    builderTaglines[path] ||
    builderAbout[path]
  );
};

document.documentElement.style.setProperty("--accent", primaryColor);
document.documentElement.style.setProperty("--success", primaryColor);
document.documentElement.style.setProperty("--navy", buttonColor);
document.documentElement.style.setProperty(
  "--completion-start",
  completionColor,
);
document.documentElement.style.setProperty(
  "--completion-end",
  completionColor,
);
document.documentElement.style.setProperty(
  "--completion-link",
  completionColor,
);
document.querySelectorAll("[data-config-text]").forEach((element) => {
  const value = configuredText(element.dataset.configText);
  if (typeof value === "string") element.textContent = value;
});

const form = document.querySelector("#website-form");
const homeScreen = document.querySelector("#home-screen");
const homeOptions = document.querySelector("#home-options");
const builderWorkspace = document.querySelector("#builder-workspace");
const startCreateWebsiteButton = document.querySelector(
  "#start-create-website",
);
const createWebsiteCard = document.querySelector("#create-website-card");
const showManageWebsiteButton = document.querySelector(
  "#show-manage-website",
);
const manageWebsiteTitle = document.querySelector("#manage-website-title");
const manageWebsiteDescription = document.querySelector(
  "#manage-website-description",
);
const createdWebsiteResult = document.querySelector(
  "#created-website-result",
);
const publishedWebsiteLabel = document.querySelector(
  "#published-website-label",
);
const createdWebsiteLink = document.querySelector("#created-website-link");
const trialReminderNote = document.querySelector("#trial-reminder-note");
const createCardTrialNote = document.querySelector("#create-card-trial-note");

const createdWebsiteHeading = document.querySelector(
  "#created-website-heading",
);
const createdWebsiteDescription = document.querySelector(
  "#created-website-description",
);
const createdWebsitePending = document.querySelector(
  "#created-website-pending",
);
const ringProgressFill = document.querySelector("#ring-progress-fill");
const managePanel = document.querySelector("#manage-panel");
const manageEmail = document.querySelector("#manage-email");
const loadWebsiteButton = document.querySelector("#load-website");
const manageStatus = document.querySelector("#manage-status");
const showDeleteWebsiteButton = document.querySelector(
  "#show-delete-website",
);
const deletePanel = document.querySelector("#delete-panel");
const deleteEmail = document.querySelector("#delete-email");
const deleteWebsiteButton = document.querySelector("#delete-website");
const deleteStatus = document.querySelector("#delete-status");
const backToHomeButton = document.querySelector("#back-to-home");
const builderPromptTitle = document.querySelector("#builder-prompt-title");
const previousPageTopButton = document.querySelector("#previous-page-top");
const nextPageTopButton = document.querySelector("#next-page-top");
const wizardStepLinksTrack = document.querySelector(
  "#wizard-step-links-track",
);
const wizardStepLinksThumb = document.querySelector(
  "#wizard-step-links-thumb",
);
const discardConfirmDialog = document.querySelector("#discard-confirm-dialog");
const discardKeepEditingButton = document.querySelector(
  "#discard-keep-editing",
);
const discardConfirmButton = document.querySelector("#discard-confirm");
const deleteConfirmDialog = document.querySelector("#delete-confirm-dialog");
const deleteDialogMessage = document.querySelector("#delete-dialog-message");
const deleteDialogCancelButton = document.querySelector(
  "#delete-dialog-cancel",
);
const deleteDialogConfirmButton = document.querySelector(
  "#delete-dialog-confirm",
);

// Same styled-dialog pattern as the wizard's discard-changes prompt,
// promise-based so the caller can just `await` a yes/no answer instead of
// the browser's own window.confirm() (which looks like a security warning
// and shows the raw local dev URL, not something to ship a delete
// confirmation behind).
function confirmDeleteWebsite(email) {
  return new Promise((resolve) => {
    deleteDialogMessage.textContent = `Delete the website for ${email}? This action cannot be undone. If you have an active plan, it will also be cancelled.`;
    deleteConfirmDialog.hidden = false;

    const cleanup = (result) => {
      deleteConfirmDialog.hidden = true;
      deleteDialogCancelButton.removeEventListener("click", onCancel);
      deleteDialogConfirmButton.removeEventListener("click", onConfirm);
      resolve(result);
    };
    const onCancel = () => cleanup(false);
    const onConfirm = () => cleanup(true);

    deleteDialogCancelButton.addEventListener("click", onCancel);
    deleteDialogConfirmButton.addEventListener("click", onConfirm);
  });
}
const statusMessage = document.querySelector("#status");
const serverWarning = document.querySelector("#server-warning");
const serverStatus = document.querySelector("#server-status");
const previewButton = document.querySelector("#preview-website");
const previewSection = document.querySelector("#website-preview");
const previewFrame = document.querySelector("#preview-frame");
const previewFrameShell = document.querySelector("#preview-frame-shell");
const previewPlaceholder = document.querySelector("#preview-placeholder");
const serviceEditorList = document.querySelector("#service-editor-list");
const servicesValidationError = document.querySelector(
  "#services-validation-error",
);
const addServiceButton = document.querySelector("#add-service");
const reviewEditorList = document.querySelector("#review-editor-list");
const addReviewButton = document.querySelector("#add-review");
const logoInput = form.elements.namedItem("logo");
const logoPreview = document.querySelector("#logo-preview");
const logoPreviewImage = document.querySelector("#logo-preview-image");
const removeLogoButton = document.querySelector("#remove-logo");
const logoValidationError = document.querySelector("#logo-validation-error");
const galleryInput = form.elements.namedItem("gallery");
const galleryPreviews = document.querySelector("#gallery-previews");
const galleryValidationError = document.querySelector(
  "#gallery-validation-error",
);
const createWebsiteButton = document.querySelector("#create-website-api");
const finalGeneration = document.querySelector("#final-generation");
const contactEmailField = document.querySelector("#contact-email");
const modifyEmailMessage = document.querySelector("#modify-email-message");
const dataDeliveryStatus = document.querySelector("#data-delivery-status");
const operationLoader = document.querySelector("#operation-loader");
const operationLoaderMessage = document.querySelector(
  "#operation-loader-message",
);
const otpDialog = document.querySelector("#otp-dialog");
const otpForm = document.querySelector("#otp-form");
const otpEmail = document.querySelector("#otp-email");
const otpInput = document.querySelector("#otp-input");
const otpStatus = document.querySelector("#otp-status");
const otpCancelButton = document.querySelector("#otp-cancel");
const otpResendButton = document.querySelector("#otp-resend");
const otpContinueButton = otpForm.querySelector('button[type="submit"]');
const maxImageSizeMb = 2;
const maxImageSize = maxImageSizeMb * 1024 * 1024;
const maxSourceImageSizeMb = 20;
const maxSourceImageSize = maxSourceImageSizeMb * 1024 * 1024;
const maxImageDimension = 2560;
const maxGalleryImagesCreate = 8;
const maxGalleryImagesModify = 24;
function currentMaxGalleryImages() {
  return websiteOperation === "modify" ? maxGalleryImagesModify : maxGalleryImagesCreate;
}
const expectedServerVersion = Number(builderConfig.version);
const web3FormsEndpoint = "https://api.web3forms.com/submit";
//const prefix = "stabilisation-";
const prefix = "";
const websiteGenerationEndpoint =
  "https://"+prefix+"gudi-space-workers.hellogudispace.workers.dev/api/generate";
const otpGenerationEndpoint =
  "https://"+prefix+"gudi-space-workers.hellogudispace.workers.dev/api/generateOtp";
const sanityCheckEndpoint =
  "https://"+prefix+"gudi-space-workers.hellogudispace.workers.dev/api/generateSanityCheck";
const websiteStatusEndpoint =
  "https://"+prefix+"gudi-space-workers.hellogudispace.workers.dev/api/generateStatus";
const planPricesEndpoint =
  "https://"+prefix+"gudi-space-workers.hellogudispace.workers.dev/api/planPrices";
const paymentStatusEndpoint =
  "https://"+prefix+"gudi-space-workers.hellogudispace.workers.dev/api/paymentStatus";

// Pulls the real trial length from the worker (CONSTANTS.FREE_TRIAL_DAYS)
// instead of hardcoding it here - change that one constant and both
// this pre-create note and the post-create one below pick it up with no
// code change on this side. Fire-and-forget: if it fails, the static
// data.json text already rendered stays as the fallback.
fetch(planPricesEndpoint)
  .then((response) => response.json())
  .then((data) => {
    if (typeof data?.freeTrialDays === "number") {
      freeTrialDays = data.freeTrialDays;
      if (createCardTrialNote) {
        createCardTrialNote.textContent = `Your site is free for ${freeTrialDays} day${freeTrialDays === 1 ? "" : "s"}. Add a plan to keep it live permanently.`;
      }
    }
  })
  .catch((error) => console.error("Could not fetch free trial length.", error));

// The "free for N days, add a plan" note only knows whether this was a
// create or a modify - it has no idea whether the person already paid
// (e.g. they added a plan, then came back here later). Hide it whenever
// they actually have an active subscription, regardless of that.
function hideTrialNoteIfSubscribed(email) {
  if (!email) return;
  fetch(`${paymentStatusEndpoint}?email=${encodeURIComponent(email)}`)
    .then((response) => response.json())
    .then((data) => {
      if (data?.status === "active") {
        trialReminderNote.hidden = true;
      }
    })
    .catch((error) => console.error("Could not check subscription status.", error));
}
const supportedImageTypes = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
]);
const heicImageTypes = new Set([
  "image/heic",
  "image/heif",
  "image/heic-sequence",
  "image/heif-sequence",
]);
const supportedImagePattern = /\.(png|jpe?g|webp|gif|heic|heif)$/i;
const heicImagePattern = /\.(heic|heif)$/i;
const isOpenedDirectly = window.location.protocol === "file:";
const isLocalBuilder = ["127.0.0.1", "localhost"].includes(
  window.location.hostname,
);
let serverConnected = false;
let serverOutdated = false;
let importedLogo = null;
let importedGallery = [];
let importedBackgroundImage = null;
let serviceEditorSequence = 0;
let websiteOperation = "create";
let lockedWebsiteEmail = "";
// Fallback only - overwritten as soon as /api/planPrices responds, so
// this number never has to be kept in sync with the worker's
// CONSTANTS.FREE_TRIAL_DAYS by hand.
let freeTrialDays = 7;
let activeOtpRequest = null;
const yearStartedField = form.elements.namedItem("yearStarted");
const brandColorField = form.elements.namedItem("brandColor");
const secondaryColorField = form.elements.namedItem("secondaryColor");
const pageColorField = form.elements.namedItem("pageColor");
const usePageColorField = form.elements.namedItem("usePageColor");

async function runWithLoader(message, operation) {
  operationLoaderMessage.textContent = message;
  operationLoader.hidden = false;
  document.body.classList.add("operation-in-progress");
  try {
    return await operation();
  } finally {
    operationLoader.hidden = true;
    document.body.classList.remove("operation-in-progress");
  }
}

class BackendRequestError extends Error {
  constructor(message, status = 0, code = "") {
    super(message);
    this.name = "BackendRequestError";
    this.status = status;
    this.code = code;
  }
}

function backendErrorMessage(data, fallback) {
  const candidates = [
    data?.message,
    typeof data?.error === "string" ? data.error : data?.error?.message,
    data?.details,
  ];
  return (
    candidates.find(
      (value) => typeof value === "string" && value.trim(),
    )?.trim() || fallback
  );
}

function backendErrorCode(data) {
  const value = data?.code || data?.errorCode || data?.error?.code;
  return typeof value === "string" ? value.trim() : "";
}

function isOtpVerificationError(error) {
  return (
    [401, 403].includes(error?.status) ||
    /(?:\botp\b|one[- ]time|verification code|security code|invalid code|expired code|incorrect code)/i.test(
      `${error?.code || ""} ${error?.message || ""}`,
    )
  );
}

function setOtpSubmitting(submitting) {
  otpContinueButton.disabled = submitting;
  otpContinueButton.classList.toggle("otp-submitting", submitting);
  otpContinueButton.setAttribute("aria-busy", String(submitting));
  otpContinueButton.textContent = submitting ? "Verifying..." : "Continue";
}

function closeOtpDialog(cancelled = false) {
  const request = activeOtpRequest;
  activeOtpRequest = null;
  otpDialog.hidden = true;
  otpForm.reset();
  otpStatus.hidden = true;
  otpStatus.textContent = "";
  setOtpSubmitting(false);
  otpResendButton.disabled = false;
  document.body.classList.remove("operation-in-progress");
  if (cancelled) request?.onCancel?.();
}

// Runs the create/delete sanity checks (misspelled/duplicate company name,
// email that already has a site, email that has no site to delete, etc.)
// with no OTP involved. Called right before an OTP would be sent, so an
// operation that's always going to fail doesn't burn an OTP send + verify
// round trip first. `body` is either { action: "create", data } or
// { action: "delete", email }.
async function runSanityCheck(body) {
  const response = await fetch(sanityCheckEndpoint, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  let data;
  try {
    data = await response.json();
  } catch (error) {
    console.error("Sanity check API returned invalid JSON.", error);
    throw new Error("The server returned an invalid response.");
  }
  if (!response.ok || data.success === false) {
    console.error("Sanity check failed:", data);
    throw new BackendRequestError(
      backendErrorMessage(data, "That request can't be completed."),
      response.status,
      backendErrorCode(data),
    );
  }
  return data;
}

async function sendOtp(email) {
  const responseData = await runWithLoader("Sending OTP...", async () => {
    const response = await fetch(otpGenerationEndpoint, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });
    let data;
    try {
      data = await response.json();
    } catch (error) {
      console.error("OTP API returned invalid JSON.", error);
      throw new Error("The server returned an invalid response.");
    }
    if (!response.ok || data.success === false) {
      console.error("OTP API error:", data);
      throw new BackendRequestError(
        backendErrorMessage(data, "The OTP could not be sent."),
        response.status,
        backendErrorCode(data),
      );
    }
    return data;
  });
  return responseData;
}

function openOtpDialog({ email, onVerify, onCancel, onOperationError }) {
  activeOtpRequest = { email, onVerify, onCancel, onOperationError };
  otpEmail.textContent = email;
  otpStatus.hidden = true;
  otpStatus.textContent = "";
  otpDialog.hidden = false;
  document.body.classList.add("operation-in-progress");
  window.setTimeout(() => otpInput.focus(), 0);
}

async function startOtpVerification(options) {
  await sendOtp(options.email);
  openOtpDialog(options);
}

otpCancelButton.addEventListener("click", () => closeOtpDialog(true));

otpDialog.addEventListener("click", (event) => {
  if (event.target === otpDialog) closeOtpDialog(true);
});

otpResendButton.addEventListener("click", async () => {
  if (!activeOtpRequest) return;
  otpResendButton.disabled = true;
  otpStatus.hidden = true;
  try {
    await sendOtp(activeOtpRequest.email);
    otpStatus.textContent = "A new OTP was sent.";
    otpStatus.className = "home-panel-status success";
    otpStatus.hidden = false;
    otpInput.focus();
  } catch (error) {
    otpStatus.textContent = error.message;
    otpStatus.className = "home-panel-status error";
    otpStatus.hidden = false;
  } finally {
    otpResendButton.disabled = false;
  }
});

otpForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!activeOtpRequest || !otpForm.reportValidity()) return;
  const otp = otpInput.value.trim();
  if (!otp) return;

  setOtpSubmitting(true);
  otpResendButton.disabled = true;
  otpStatus.hidden = true;
  try {
    await activeOtpRequest.onVerify(otp);
    closeOtpDialog();
  } catch (error) {
    if (isOtpVerificationError(error)) {
      otpStatus.textContent = error.message;
      otpStatus.className = "home-panel-status error";
      otpStatus.hidden = false;
      otpInput.select();
    } else {
      const onOperationError = activeOtpRequest.onOperationError;
      closeOtpDialog();
      onOperationError?.(error);
    }
  } finally {
    setOtpSubmitting(false);
    otpResendButton.disabled = false;
  }
});

const transparentPageColorField = form.elements.namedItem(
  "transparentPageColor",
);
const pageColorOpacityField = form.elements.namedItem("pageColorOpacity");
const pageColorOptions = document.querySelector("#page-color-options");
const pageColorOpacityOutput = document.querySelector(
  "#page-color-opacity-output",
);
const backgroundImageField = form.elements.namedItem("backgroundImage");
const backgroundImagePreview = document.querySelector(
  "#background-image-preview",
);
const backgroundImagePreviewElement = document.querySelector(
  "#background-image-preview-image",
);
const backgroundImageValidationError = document.querySelector(
  "#background-image-validation-error",
);
const clearBackgroundImageButton = document.querySelector(
  "#clear-background-image",
);
const wizardSteps = [...form.querySelectorAll(":scope > .form-card")];
const wizardStepCount = document.querySelector("#wizard-step-count");
const wizardStepTitle = document.querySelector("#wizard-step-title");
const wizardProgressBar = document.querySelector("#wizard-progress-bar");
const wizardStepLinks = document.querySelector("#wizard-step-links");
const previousPageButton = document.querySelector("#previous-page");
const nextPageButton = document.querySelector("#next-page");
let currentWizardStep = 0;
let wizardInitialized = false;

function applyBuilderConfiguration() {
  const headingOrder = [
    "company",
    "offerings",
    "gallery",
    "contact",
    "inquiriesReviews",
    "follow",
    "appointment",
    "template",
    "preview",
  ];
  wizardSteps.forEach((step, index) => {
    const heading = builderHeadings[headingOrder[index]];
    if (heading) step.dataset.stepTitle = heading;
  });
}

applyBuilderConfiguration();

function getVisibleWizardSteps() {
  return wizardSteps.filter((step) => !step.hidden);
}

function wizardStepName(step) {
  return (
    step.dataset.stepTitle ||
    step.querySelector(".section-heading h2, .preview-heading h2")?.textContent ||
    "Details"
  );
}

function updateWizardStepLinks(visibleSteps) {
  wizardStepLinks.replaceChildren();
  visibleSteps.forEach((step, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = `${index + 1}. ${wizardStepName(step)}`;
    button.classList.toggle("active", index === currentWizardStep);
    button.setAttribute(
      "aria-current",
      index === currentWizardStep ? "step" : "false",
    );
    button.addEventListener("click", () => {
      if (index < currentWizardStep || validateStepsBefore(index)) {
        showWizardStep(index, true);
      }
    });
    wizardStepLinks.append(button);
  });
  // Keep the active tab pill visible within its own horizontally-scrolling
  // strip. This must NOT touch vertical/page scroll - a plain
  // scrollIntoView({block: "nearest"}) can still shift the whole page
  // vertically (this runs on every showWizardStep call, including
  // non-navigational refreshes where nothing should scroll at all), which
  // was racing against the real page scroll below and landing the page in
  // an inconsistent spot. Scrolling wizardStepLinks.scrollLeft directly
  // instead can never affect vertical position.
  const activeButton = wizardStepLinks.querySelector("button.active");
  if (activeButton) {
    const containerRect = wizardStepLinks.getBoundingClientRect();
    const buttonRect = activeButton.getBoundingClientRect();
    const offset =
      buttonRect.left -
      containerRect.left -
      containerRect.width / 2 +
      buttonRect.width / 2;
    // "auto" (instant), not "smooth" - this strip sits inside the sticky
    // header, right where the eye lands after the page-level jump above.
    // A smooth animation here trails slightly behind that instant jump,
    // which reads as a little secondary shake/settle right after the page
    // snaps into place. Instant here means both resolve in the same frame.
    wizardStepLinks.scrollBy({ left: offset, behavior: "auto" });
  }
  updateStepLinksScrollThumb();
}

// Keeps the hand-drawn scroll indicator under the step strip in sync with
// its real scroll position - see the .wizard-step-links-track CSS comment
// for why this isn't just a native scrollbar.
function updateStepLinksScrollThumb() {
  const { scrollWidth, clientWidth, scrollLeft } = wizardStepLinks;
  const scrollable = scrollWidth > clientWidth + 1;
  wizardStepLinksTrack.hidden = !scrollable;
  if (!scrollable) return;
  const thumbRatio = clientWidth / scrollWidth;
  const maxScroll = scrollWidth - clientWidth;
  const scrollRatio = maxScroll > 0 ? scrollLeft / maxScroll : 0;
  wizardStepLinksThumb.style.width = `${thumbRatio * 100}%`;
  wizardStepLinksThumb.style.left = `${scrollRatio * (1 - thumbRatio) * 100}%`;
}

wizardStepLinks.addEventListener("scroll", updateStepLinksScrollThumb);
window.addEventListener("resize", updateStepLinksScrollThumb);

// A plain mouse wheel only ever sends vertical delta, so without this a
// wheel scroll over the step strip does nothing (only a trackpad's own
// horizontal swipe would move it). Redirect vertical wheel input into
// horizontal scroll here, same as most horizontally-scrolling UI does.
wizardStepLinks.addEventListener(
  "wheel",
  (event) => {
    const { scrollWidth, clientWidth } = wizardStepLinks;
    if (scrollWidth <= clientWidth) return; // nothing to scroll
    if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return; // already horizontal input
    event.preventDefault();
    wizardStepLinks.scrollBy({ left: event.deltaY, behavior: "auto" });
  },
  { passive: false },
);

// Click-and-drag scrolling (holding the mouse button down and dragging
// sideways) - separate from the wheel/trackpad scrolling above, which a
// plain mouse with no wheel and no touch surface has no other way to
// trigger. A small movement threshold keeps an ordinary click on a step
// pill working as a click instead of being swallowed as a drag.
(() => {
  let isDragging = false;
  let dragMoved = false;
  let startX = 0;
  let startScrollLeft = 0;

  wizardStepLinks.addEventListener("mousedown", (event) => {
    isDragging = true;
    dragMoved = false;
    startX = event.clientX;
    startScrollLeft = wizardStepLinks.scrollLeft;
  });

  window.addEventListener("mousemove", (event) => {
    if (!isDragging) return;
    const delta = event.clientX - startX;
    if (Math.abs(delta) > 4) dragMoved = true;
    if (dragMoved) {
      wizardStepLinks.scrollLeft = startScrollLeft - delta;
    }
  });

  window.addEventListener("mouseup", () => {
    isDragging = false;
  });

  // Suppress the click that would otherwise fire on a step-pill button
  // right after a drag - without this, releasing the mouse after
  // dragging also "clicks" whatever pill happens to be under the cursor.
  wizardStepLinks.addEventListener(
    "click",
    (event) => {
      if (dragMoved) {
        event.stopPropagation();
        event.preventDefault();
      }
    },
    { capture: true },
  );
})();

// Makes the hand-drawn indicator bar under the step strip an actual,
// draggable scrollbar - not just a visual readout of scroll position.
// Dragging the thumb (or clicking anywhere on the track) scrolls
// wizardStepLinks proportionally; updateStepLinksScrollThumb (above)
// keeps the thumb's size/position in sync the other way around.
(() => {
  let isDraggingThumb = false;

  function scrollToTrackPosition(clientX) {
    const trackRect = wizardStepLinksTrack.getBoundingClientRect();
    const thumbWidth = wizardStepLinksThumb.getBoundingClientRect().width;
    const usableTrackWidth = Math.max(trackRect.width - thumbWidth, 1);
    const ratio = Math.min(
      1,
      Math.max(0, (clientX - trackRect.left - thumbWidth / 2) / usableTrackWidth),
    );
    const maxScroll = wizardStepLinks.scrollWidth - wizardStepLinks.clientWidth;
    wizardStepLinks.scrollLeft = ratio * maxScroll;
  }

  wizardStepLinksThumb.addEventListener("mousedown", (event) => {
    isDraggingThumb = true;
    event.preventDefault(); // avoid text-selection while dragging
  });

  // Clicking the bare track (not the thumb itself) jumps straight to
  // that position, same as a native scrollbar.
  wizardStepLinksTrack.addEventListener("mousedown", (event) => {
    if (event.target === wizardStepLinksThumb) return;
    scrollToTrackPosition(event.clientX);
  });

  window.addEventListener("mousemove", (event) => {
    if (!isDraggingThumb) return;
    scrollToTrackPosition(event.clientX);
  });

  window.addEventListener("mouseup", () => {
    isDraggingThumb = false;
  });
})();

// Create/Manage/Delete are mutually exclusive "below the cards" panels -
// opening one closes whichever of the others was open, while the 3 action
// cards (#home-options) themselves always stay visible.
function closeAllHomePanels() {
  builderWorkspace.hidden = true;
  managePanel.hidden = true;
  deletePanel.hidden = true;
  // Always safe to call even if the wizard modal wasn't the thing open -
  // removing a class that isn't there is a no-op.
  document.body.classList.remove("wizard-modal-open");
}

function showHomeScreen(scrollTarget = homeOptions) {
  closeAllHomePanels();
  homeScreen.hidden = false;
  scrollTarget.scrollIntoView({ behavior: "smooth", block: "start" });
}

function showBuilderWorkspace() {
  closeAllHomePanels();
  homeScreen.hidden = false;
  builderWorkspace.hidden = false;
  document.body.classList.add("wizard-modal-open");
  showWizardStep(0);
  formDirty = false;
}

// Whether anything in the form has actually been touched since the wizard
// was last opened. Kept as a plain synchronous flag (not an async
// snapshot-diff of collectConfiguration()) on purpose - that async
// approach could race or silently never resolve if any one field read
// hung, which would leave the discard prompt permanently disabled. A
// flag set directly by the interaction itself can't race or hang.
let formDirty = false;

// input/change covers plain fields (text, textarea, select, checkbox,
// radio, file, native color pickers). The click listener below is the
// broader net: many controls here (template cards, color swatches,
// section toggles) are custom buttons that set a value via JS rather
// than firing input/change, so any click on an interactive element
// inside a step's actual content (.form-card) counts too - except the
// "i" info tooltips, which never touch data. A false positive here
// (prompting when nothing meaningfully changed) is far cheaper than a
// false negative that silently discards real edits.
form.addEventListener("input", () => {
  formDirty = true;
});
form.addEventListener("change", () => {
  formDirty = true;
});
// Controls that live inside a .form-card but don't touch the site's data -
// Preview, the Desktop/Mobile preview-size toggle, and the Create/Modify
// submit button itself - so clicking them isn't itself a "change".
const NON_DATA_CONTROLS_SELECTOR =
  "#preview-website, .preview-devices, #create-website-api";

form.addEventListener("click", (event) => {
  if (event.target.closest(".field-info")) return;
  if (event.target.closest(NON_DATA_CONTROLS_SELECTOR)) return;
  const interactive = event.target.closest(
    "button, input, select, textarea, [role='button']",
  );
  if (interactive && interactive.closest(".form-card")) {
    formDirty = true;
  }
});

function closeWizardModal() {
  formDirty = false;
  showHomeScreen();
}

function requestCloseWizardModal() {
  if (formDirty) {
    discardConfirmDialog.hidden = false;
  } else {
    closeWizardModal();
  }
}

discardKeepEditingButton.addEventListener("click", () => {
  discardConfirmDialog.hidden = true;
});

discardConfirmButton.addEventListener("click", () => {
  discardConfirmDialog.hidden = true;
  closeWizardModal();
});

function portableImageValue(image) {
  if (image && typeof image === "object") {
    return (
      image.dataUrl ||
      image.image_src ||
      image.image_path ||
      ""
    );
  }
  return "";
}

function portableImageSource(image, includePreviewSource = false) {
  if (!image || typeof image !== "object") return "";
  return image.dataUrl?.startsWith("data:")
    ? image.dataUrl
    : image.image_src || (includePreviewSource ? image.preview_src || "" : "");
}

function createMediaId(prefix = "image") {
  const randomId =
    typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}-${randomId}`.toLowerCase();
}

function portableImageId(image, prefix = "image") {
  if (!image || typeof image !== "object") return "";
  const existingId = image.id || image.image_id;
  if (existingId) return existingId;
  image.id = createMediaId(prefix);
  return image.id;
}

function portableImageThumbnail(image) {
  if (!image || typeof image !== "object") return "";
  return image.thumbnail || image.image_thumbnail || "";
}

function imagePreviewValue(image) {
  return (
    image?.preview_src ||
    image?.image_src ||
    portableImageThumbnail(image) ||
    portableImageValue(image)
  );
}

function normalizeStoredImage(image, prefix = "media") {
  if (!image || typeof image !== "object") return null;
  const dataUrl =
    image.dataUrl ||
    image.image_src ||
    image.image_path ||
    "";
  const thumbnail = image.thumbnail || image.image_thumbnail || "";
  if (!dataUrl && !thumbnail) return null;
  return {
    id: image.id || image.image_id || createMediaId(prefix),
    name: image.name || "",
    type: image.type || "",
    dataUrl,
    thumbnail,
    image_src: image.image_src || "",
    image_path: image.image_path || "",
    preview_src: image.image_preview_src || image.preview_src || "",
  };
}

function portableImageExtension(image) {
  if (!image || typeof image !== "object") return "";
  const mimeType = image.type || "";
  const mimeExtensions = {
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/webp": ".webp",
    "image/gif": ".gif",
  };
  if (mimeExtensions[mimeType]) return mimeExtensions[mimeType];

  const fileName = image.name || portableImageValue(image);
  const extension = fileName.match(/\.(png|jpe?g|webp|gif)(?:$|[?#])/i)?.[1];
  return extension ? `.${extension.toLowerCase().replace("jpeg", "jpg")}` : "";
}

function portableImagePath(image, folder, fileName) {
  const extension = portableImageExtension(image);
  return extension ? `data/${folder}/${fileName}${extension}` : "";
}

function createPortableData(config, includePreviewSources = false) {
  const companyImageId = portableImageId(config.logo, "company");
  const backgroundImageId = portableImageId(
    config.backgroundImage,
    "background",
  );
  return {
    schemaVersion: 1,
    company: {
      companyName: config.companyName,
      yearStarted: config.yearStarted ? Number(config.yearStarted) : "",
      tagline: config.tagline,
      description: config.description,
      about: config.about,
      image_id: companyImageId,
      image_path: portableImagePath(
        config.logo,
        "company",
        companyImageId,
      ),
      image_src: portableImageSource(config.logo, includePreviewSources),
      image_thumbnail: portableImageThumbnail(config.logo),
    },
    template: {
      templateId: config.template,
      mode: config.mode,
      mood: config.mood,
      primaryColor: config.brandColor,
      secondaryColor: config.secondaryColor,
      headerTextColor: config.headerTextColor,
      usePageColor: config.usePageColor,
      pageColor: config.pageColor,
      transparentPageColor: config.transparentPageColor,
      pageColorOpacity: config.pageColorOpacity,
      font: config.font,
      background_image_id: backgroundImageId,
      background_image_path: portableImagePath(
        config.backgroundImage,
        "background",
        backgroundImageId,
      ),
      background_image_src: portableImageSource(
        config.backgroundImage,
        includePreviewSources,
      ),
      background_image_thumbnail: portableImageThumbnail(
        config.backgroundImage,
      ),
      servicesHeading: config.servicesHeading,
      servicesLayout: config.servicesLayout,
      sections: config.sections,
    },
    services: config.services.map(({ image, ...service }) => {
      const imageId = portableImageId(image, "service");
      return {
        ...service,
        image_id: imageId,
        image_path: portableImagePath(image, "service", imageId),
        image_src: portableImageSource(image, includePreviewSources),
        image_thumbnail: portableImageThumbnail(image),
      };
    }),
    gallery: config.gallery.map((image) => {
      const imageId = portableImageId(image, "gallery");
      return {
        image_id: imageId,
        image_path: portableImagePath(image, "gallery", imageId),
        image_src: portableImageSource(image, includePreviewSources),
        image_thumbnail: portableImageThumbnail(image),
        alt: "",
      };
    }),
    reviews: config.reviews,
    contact: {
      formEndpoint: config.formEndpoint,
      accessKey: config.contactAccessKey,
      email: config.email,
      phone: config.phone,
      address: config.address,
      showCall: config.showCall,
      showEmail: config.showEmail,
    },
    reviewSettings: {
      formEndpoint: config.reviewFormEndpoint,
      accessKey: config.reviewAccessKey,
    },
    socialMedia: {
      instagram: config.instagram,
      facebook: config.facebook,
      linkedin: config.linkedin,
      twitter: config.twitter,
      youtube: config.youtube,
      applePodcast: config.applePodcast,
      spotify: config.spotify,
    },
    appointment: {
      url: config.appointmentUrl,
    },
  };
}

function createDataDeliveryPayload(config, otp) {
  return {
    branchName: config.companyName,
    data: createPortableData(config),
    otp,
  };
}

function setDataDeliveryStatus(message, type = "") {
  dataDeliveryStatus.textContent = message;
  dataDeliveryStatus.className = type;
}

async function readGenerationApiResponse(response) {
  let responseData;
  try {
    responseData = await response.json();
  } catch (error) {
    console.error("Generation API returned invalid JSON.", error);
    throw new Error("The server returned an invalid response.");
  }

  if (!response.ok || responseData.success === false) {
    console.error("Generation API error:", responseData);
    throw new BackendRequestError(
      backendErrorMessage(responseData, "The request could not be completed."),
      response.status,
      backendErrorCode(responseData),
    );
  }

  if (responseData.success !== true) {
    console.error("Generation API response is missing success status.", responseData);
    throw new Error("The server returned an invalid response.");
  }

  return responseData;
}

const websiteStatusPollIntervalMs = 4000;
const websiteStatusPollMaxAttempts = 20; // ~80s ceiling before we just show the link anyway

async function checkWebsiteStatus(token) {
  const response = await fetch(
    `${websiteStatusEndpoint}?token=${encodeURIComponent(token)}`,
  );
  return readGenerationApiResponse(response);
}

// Polls "/api/generateStatus" with the token the create/modify call handed
// back, calling onProgress(attempt) as it goes, until the Pages build for
// this branch is actually live. This is what closes the old 522 gap -
// instead of showing the link the instant the API responds, we wait
// (bounded) until Cloudflare confirms the build finished.
async function waitForWebsiteReady(token, onProgress) {
  if (!token) {
    // No token (e.g. server couldn't issue one) - nothing to poll, just proceed.
    return;
  }

  for (let attempt = 1; attempt <= websiteStatusPollMaxAttempts; attempt++) {
    let statusData;
    try {
      statusData = await checkWebsiteStatus(token);
    } catch (error) {
      console.error("Website status check failed.", error);
      return; // don't block the user on a status-check hiccup - just show the link
    }

    if (statusData.ready) {
      return;
    }

    if (statusData.status === "failure" || statusData.status === "canceled") {
      throw new Error(
        "Your website build failed. Please try again or contact support.",
      );
    }

    onProgress?.(attempt);

    await new Promise((resolve) =>
      setTimeout(resolve, websiteStatusPollIntervalMs),
    );
  }

  // Timed out waiting client-side - proceed anyway. Worst case, the first
  // click on the link needs a refresh, same as before this change.
}

function setWebsiteOperation(operation, email = "") {
  websiteOperation = operation;
  lockedWebsiteEmail = operation === "modify" ? email.trim() : "";
  contactEmailField.readOnly = operation === "modify";
  modifyEmailMessage.hidden = operation !== "modify";
  createWebsiteButton.textContent =
    operation === "modify"
      ? "Modify website"
      : "Create website";
  builderPromptTitle.textContent =
    operation === "modify" ? "Modify website" : "Create website";
}

const ringProgressRadius = 16;
const ringProgressCircumference = 2 * Math.PI * ringProgressRadius;
ringProgressFill?.setAttribute(
  "stroke-dasharray",
  String(ringProgressCircumference),
);

// fraction is 0..1. 0 = empty ring, 1 = fully filled.
function setRingProgress(fraction) {
  if (!ringProgressFill) return;
  const clamped = Math.max(0, Math.min(1, fraction));
  ringProgressFill.setAttribute(
    "stroke-dashoffset",
    String(ringProgressCircumference * (1 - clamped)),
  );
}

// Reveals the "website created" card right away (as soon as the fast
// create/modify API call succeeds), but in a pending state - a ring in
// place of the link - since the site itself can still take up to ~80s to
// actually go live. Lets the OTP dialog close immediately instead of
// making the user stare at it for the whole build/poll phase.
function showPublishedWebsitePending(previewUrl, payload, wasModified, token) {
  dataDeliveryStatus.replaceChildren();
  dataDeliveryStatus.className = "success";

  publishedWebsiteLabel.textContent = wasModified
    ? builderTaglines.modifiedLabel
    : builderTaglines.createdLabel;
  createdWebsiteHeading.textContent = wasModified
    ? "Updating your website..."
    : "Setting up your website...";
  createdWebsiteDescription.textContent =
    "This usually takes under a minute. Feel free to look around while you wait.";

  createdWebsiteLink.href = previewUrl;
  createdWebsiteLink.hidden = true;
  setRingProgress(0);
  createdWebsitePending.hidden = false;
  createdWebsiteResult.hidden = false;

  // Not disabling startCreateWebsiteButton here - a person should be free
  // to start building another website right away rather than being stuck
  // until this one is deleted.
  createWebsiteCard.classList.add("website-created");

  manageWebsiteTitle.textContent = "Edit website";
  manageWebsiteDescription.textContent =
    "Update your website using the same form.";
  showManageWebsiteButton.innerHTML =
    'Edit website <span aria-hidden="true">→</span>';
  manageEmail.value = payload.data?.contact?.email || "";

  // Save right away, not just once the build is confirmed ready - the
  // build/poll wait below can run up to ~80s, and a reload during that
  // window would otherwise find nothing in storage and show a blank
  // "Create website" screen, even though the site itself already exists
  // server-side and this exact link will work once deployment finishes.
  saveCreatedSiteState(
    previewUrl,
    payload.data?.contact?.email,
    wasModified,
    token,
    false,
  );

  // Land on the "your website is ready" banner itself, not the action
  // cards below it - that's the status the person just triggered and
  // came back to the home screen to see.
  showHomeScreen(createdWebsiteResult);
}

// Swaps the card over to its finished state once polling confirms the
// site is actually live (or gives up waiting - see waitForWebsiteReady).
function showPublishedWebsiteReady(email, wasModified) {
  createdWebsiteHeading.textContent = "Your website is ready!";
  createdWebsiteDescription.textContent =
    "Deployment may take a few minutes. If the site doesn’t load right away, please wait and refresh.";
  createdWebsitePending.hidden = true;
  createdWebsiteLink.hidden = false;

  // Only relevant right after a brand new site goes live, not after an
  // edit to an existing (presumably already-paid-or-still-in-trial) one.
  if (!wasModified && email) {
    trialReminderNote.replaceChildren();
    trialReminderNote.append(
      `Your site is free for ${freeTrialDays} day${freeTrialDays === 1 ? "" : "s"}. `,
    );
    const manageLink = document.createElement("a");
    manageLink.href = `manage_plan.html?email=${encodeURIComponent(email)}`;
    manageLink.textContent = "Add a plan";
    trialReminderNote.append(manageLink, " to keep it live permanently.");
    trialReminderNote.hidden = false;
    hideTrialNoteIfSubscribed(email);
  } else {
    trialReminderNote.hidden = true;
  }

  saveCreatedSiteState(createdWebsiteLink.href, email, wasModified, null, true);
}

// The "your website is ready" panel otherwise lives only in this page's
// in-memory JS state, so a full navigation away (e.g. clicking "Add a
// plan" to Manage Plan) and back loses it entirely. Persist just enough
// to redraw the same banner on the next load, until the site is deleted.
const createdSiteStorageKey = "gudispace:lastCreatedSite";

function saveCreatedSiteState(previewUrl, email, wasModified, token, ready) {
  try {
    localStorage.setItem(
      createdSiteStorageKey,
      JSON.stringify({ previewUrl, email, wasModified, token, ready }),
    );
  } catch (error) {
    console.error("Could not save created-website state.", error);
  }
}

function clearCreatedSiteState() {
  try {
    localStorage.removeItem(createdSiteStorageKey);
  } catch (error) {
    console.error("Could not clear created-website state.", error);
  }
}

// Whichever email the persisted "ready" banner belongs to, if any -
// independent of lockedWebsiteEmail, which is only set once someone has
// clicked "Edit website" and is empty right after a plain create.
function getCreatedSiteEmail() {
  try {
    const raw = localStorage.getItem(createdSiteStorageKey);
    if (!raw) return "";
    return JSON.parse(raw)?.email || "";
  } catch (error) {
    return "";
  }
}

function restoreCreatedSiteState() {
  let state;
  try {
    const raw = localStorage.getItem(createdSiteStorageKey);
    if (!raw) return;
    state = JSON.parse(raw);
  } catch (error) {
    console.error("Could not read saved created-website state.", error);
    return;
  }
  if (!state?.previewUrl) return;

  // Self-heals against any removal path that doesn't go through this
  // page's own Delete button - e.g. the daily trial-prune job auto-
  // removing an unpaid, expired site server-side, or the site being
  // deleted from a different tab/device while this one still has it
  // saved. Runs unconditionally, up front, so it covers BOTH branches
  // below (still-pending resumed-poll and already-ready) rather than
  // only the one it happens to be written next to - a resumed poll
  // against a since-deleted site's token would otherwise just spin
  // forever with no way to notice the site is actually gone.
  if (state.email) {
    const requestUrl = new URL(websiteGenerationEndpoint);
    requestUrl.searchParams.set("email", state.email);
    fetch(requestUrl, { method: "GET", headers: { Accept: "application/json" } })
      .then((response) => readGenerationApiResponse(response))
      .then((responseData) => {
        if (!responseData?.data) {
          throw new Error("Site no longer exists.");
        }
      })
      .catch(() => {
        clearCreatedSiteState();
        createdWebsiteResult.hidden = true;
        createWebsiteCard.classList.remove("website-created");
      });
  }

  createdWebsiteLink.href = state.previewUrl;
  createdWebsiteResult.hidden = false;
  createWebsiteCard.classList.add("website-created");

  manageWebsiteTitle.textContent = "Edit website";
  manageWebsiteDescription.textContent =
    "Update your website using the same form.";
  showManageWebsiteButton.innerHTML =
    'Edit website <span aria-hidden="true">→</span>';
  if (state.email) manageEmail.value = state.email;

  // Not yet confirmed ready when this was saved (the person reloaded
  // during the ~80s build/poll window) - rather than falsely showing
  // "Your website is ready!" with a dead link, resume the same polling
  // that would have run had they never left, using the saved token.
  if (state.ready === false && state.token) {
    publishedWebsiteLabel.textContent = state.wasModified
      ? builderTaglines.modifiedLabel
      : builderTaglines.createdLabel;
    createdWebsiteHeading.textContent = state.wasModified
      ? "Updating your website..."
      : "Setting up your website...";
    createdWebsiteDescription.textContent =
      "This usually takes under a minute. Feel free to look around while you wait.";
    createdWebsiteLink.hidden = true;
    setRingProgress(0);
    createdWebsitePending.hidden = false;
    trialReminderNote.hidden = true;

    waitForWebsiteReady(state.token, (attempt) => {
      setRingProgress(attempt / websiteStatusPollMaxAttempts);
    })
      .then(() => {
        setRingProgress(1);
        showPublishedWebsiteReady(state.email, state.wasModified);
      })
      .catch((error) => {
        console.error("Website build polling failed.", error);
        showPublishedWebsiteFailed(error.message);
      });
    return;
  }

  publishedWebsiteLabel.textContent = state.wasModified
    ? builderTaglines.modifiedLabel
    : builderTaglines.createdLabel;
  createdWebsiteHeading.textContent = "Your website is ready!";
  createdWebsiteDescription.textContent =
    "Deployment may take a few minutes. If the site doesn’t load right away, please wait and refresh.";
  createdWebsiteLink.hidden = false;
  createdWebsitePending.hidden = true;

  if (!state.wasModified && state.email) {
    trialReminderNote.replaceChildren();
    trialReminderNote.append(
      `Your site is free for ${freeTrialDays} day${freeTrialDays === 1 ? "" : "s"}. `,
    );
    const manageLink = document.createElement("a");
    manageLink.href = `manage_plan.html?email=${encodeURIComponent(state.email)}`;
    manageLink.textContent = "Add a plan";
    trialReminderNote.append(manageLink, " to keep it live permanently.");
    trialReminderNote.hidden = false;
    hideTrialNoteIfSubscribed(state.email);
  } else {
    trialReminderNote.hidden = true;
  }

}

// The one case the background poll can genuinely fail (not just time
// out): the build itself came back "failure"/"canceled". Surface that
// on the same card instead of silently pretending it's ready.
function showPublishedWebsiteFailed(message) {
  createdWebsiteHeading.textContent = "Something went wrong";
  createdWebsiteDescription.textContent = message;
  createdWebsitePending.hidden = true;
  createdWebsiteLink.hidden = false;
}

// Fires the create/modify request and validates the response. This stays
// fast (it's just the API round-trip) so it's still fine to show under the
// generic floating loader - the OTP-verification-failed case surfaces here.
async function submitWebsite(config, otp) {
  const payload = createDataDeliveryPayload(config, otp);
  const action = websiteOperation === "modify" ? "modify" : "create";
  const response = await fetch(websiteGenerationEndpoint, {
    method: websiteOperation === "modify" ? "PUT" : "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const responseData = await readGenerationApiResponse(response);

  if (
    typeof responseData.previewUrl !== "string" ||
    !/^https?:\/\//i.test(responseData.previewUrl)
  ) {
    console.error(`Generation API returned invalid ${action} data.`, responseData);
    throw new Error("The server returned an invalid response.");
  }

  return { responseData, payload };
}

// Submits the create/modify request, then reveals the "created" card
// immediately in its pending state and returns - it does NOT wait for the
// build/poll phase, which runs in the background instead. That's what
// lets the OTP dialog close right away instead of sitting open for the
// whole ~80s wait.
async function publishWebsite(config, otp) {
  // Captured once, up front - websiteOperation is a shared, mutable
  // variable, and the build/poll wait below can run for up to ~80s, long
  // enough for the person to start a different create/modify session in
  // the meantime and change it out from under this one.
  const wasModifiedAtSubmit = websiteOperation === "modify";

  const { responseData, payload } = await runWithLoader(
    wasModifiedAtSubmit ? "Modifying website..." : "Creating website...",
    () => submitWebsite(config, otp),
  );

  showPublishedWebsitePending(responseData.previewUrl, payload, wasModifiedAtSubmit, responseData.token);

  waitForWebsiteReady(responseData.token, (attempt) => {
    setRingProgress(attempt / websiteStatusPollMaxAttempts);
  })
    .then(() => {
      setRingProgress(1);
      showPublishedWebsiteReady(payload.data?.contact?.email, wasModifiedAtSubmit);
    })
    .catch((error) => {
      console.error("Website build polling failed.", error);
      showPublishedWebsiteFailed(error.message);
    });
}

createWebsiteButton.addEventListener("click", async () => {
  if (!validateEntireForm()) return;

  // Nothing was actually touched since this modify session opened (the
  // same signal the close-confirm dialog uses) - skip the sanity
  // check/OTP/API round trip entirely rather than spending an OTP send
  // on a no-op save.
  if (websiteOperation === "modify" && !formDirty) {
    setDataDeliveryStatus("No changes to save.");
    return;
  }

  createWebsiteButton.disabled = true;
  setDataDeliveryStatus(
    websiteOperation === "modify" ? "Sending OTP..." : "Checking details...",
  );
  try {
    const config = await collectConfiguration();
    const email =
      websiteOperation === "modify" ? lockedWebsiteEmail : config.email;

    if (websiteOperation !== "modify") {
      // Catches a misspelled/duplicate company name or an email that
      // already has an active site *before* an OTP is sent, instead of
      // discovering it only after the customer has verified the OTP.
      await runSanityCheck({
        action: "create",
        data: createPortableData(config),
      });
      setDataDeliveryStatus("Sending OTP...");
    }

    await startOtpVerification({
      email,
      onCancel: () => {
        createWebsiteButton.disabled = false;
        setDataDeliveryStatus("");
      },
      onOperationError: (error) => {
        createWebsiteButton.disabled = false;
        setDataDeliveryStatus(error.message, "error");
      },
      onVerify: async (otp) => {
        setDataDeliveryStatus(
          websiteOperation === "modify"
            ? "Modifying website..."
            : "Creating website...",
        );
        await publishWebsite(config, otp);
        createWebsiteButton.disabled = false;
      },
    });
    setDataDeliveryStatus(`OTP sent to ${email}.`);
  } catch (error) {
    setDataDeliveryStatus(error.message, "error");
    createWebsiteButton.disabled = false;
  }
});

function showWizardStep(index, shouldScroll = false) {
  const visibleSteps = getVisibleWizardSteps();
  if (!visibleSteps.length) return;

  currentWizardStep = Math.max(0, Math.min(index, visibleSteps.length - 1));
  const activeStep = visibleSteps[currentWizardStep];

  wizardSteps.forEach((step) => {
    const isActive = step === activeStep;
    step.classList.toggle("wizard-hidden", !isActive);
    step.setAttribute("aria-hidden", String(!isActive));
  });

  const title = wizardStepName(activeStep);
  wizardStepCount.textContent =
    `Step ${currentWizardStep + 1} of ${visibleSteps.length}`;
  wizardStepTitle.textContent = title;
  wizardProgressBar.style.width =
    `${((currentWizardStep + 1) / visibleSteps.length) * 100}%`;
  previousPageButton.disabled = currentWizardStep === 0;
  nextPageButton.hidden = currentWizardStep === visibleSteps.length - 1;
  previousPageTopButton.disabled = currentWizardStep === 0;
  nextPageTopButton.hidden = currentWizardStep === visibleSteps.length - 1;
  updateWizardStepLinks(visibleSteps);

  if (shouldScroll) {
    // "smooth" here fights with the now-sticky .wizard-progress header -
    // as the animated scroll crosses the point where the header switches
    // between stuck/unstuck, the browser visibly re-corrects mid-flight,
    // which shows up as a shake-then-settle. An instant jump avoids that
    // entirely, and since the header is pinned there's no real benefit to
    // animating the scroll anyway.
    activeStep.scrollIntoView({ behavior: "auto", block: "start" });
  }
}

function refreshWizard() {
  if (!wizardInitialized) return;
  showWizardStep(currentWizardStep);
}

function findInvalidField(fields) {
  return [...fields].find(
    (field) =>
      !field.disabled &&
      typeof field.checkValidity === "function" &&
      !field.checkValidity(),
  );
}

function hasOfferingContent() {
  return [...serviceEditorList.querySelectorAll(".service-editor")].some(
    (editor) =>
      [
        ".service-title",
        ".service-price-input",
        ".service-description",
        ".service-link-input",
        ".service-payment-link-input",
        ".service-video-input",
      ].some((selector) => editor.querySelector(selector).value.trim()) ||
      editor.querySelector(".service-image-input").files.length > 0 ||
      Boolean(editor._importedImage),
  );
}

function validateOfferings() {
  const valid = hasOfferingContent();
  servicesValidationError.hidden = valid;
  if (!valid) {
    serviceEditorList.querySelector(".service-title")?.focus();
  }
  return valid;
}

function validateWizardStep(step) {
  const invalidField = findInvalidField(
    step.querySelectorAll("input, textarea, select"),
  );
  if (invalidField) {
    invalidField.reportValidity();
    return false;
  }

  if (step.dataset.fieldsFor === "services") {
    return validateOfferings();
  }

  return true;
}

function validateCurrentWizardStep() {
  return validateWizardStep(getVisibleWizardSteps()[currentWizardStep]);
}

function validateStepsBefore(targetIndex) {
  const visibleSteps = getVisibleWizardSteps();
  for (let index = 0; index < targetIndex; index += 1) {
    if (!validateWizardStep(visibleSteps[index])) {
      showWizardStep(index, true);
      return false;
    }
  }
  return true;
}

function validateEntireForm() {
  const invalidField = findInvalidField(form.elements);
  if (invalidField) {
    const invalidStep = invalidField.closest(".form-card");
    const stepIndex = getVisibleWizardSteps().indexOf(invalidStep);
    if (stepIndex >= 0) {
      showWizardStep(stepIndex, true);
    }
    invalidField.reportValidity();
    return false;
  }

  if (!validateOfferings()) {
    const servicesStep = serviceEditorList.closest(".form-card");
    const stepIndex = getVisibleWizardSteps().indexOf(servicesStep);
    if (stepIndex >= 0) {
      showWizardStep(stepIndex, true);
    }
    return false;
  }

  return true;
}

function goToPreviousWizardStep() {
  showWizardStep(currentWizardStep - 1, true);
}

function goToNextWizardStep() {
  if (validateCurrentWizardStep()) {
    showWizardStep(currentWizardStep + 1, true);
  }
}

previousPageButton.addEventListener("click", goToPreviousWizardStep);
nextPageButton.addEventListener("click", goToNextWizardStep);
// Same steps, duplicated at the top of the modal (next to the step name)
// so you don't have to scroll down to the bottom nav just to move on.
previousPageTopButton.addEventListener("click", goToPreviousWizardStep);
nextPageTopButton.addEventListener("click", goToNextWizardStep);

yearStartedField.max = String(new Date().getFullYear());
yearStartedField.value = String(new Date().getFullYear());

function updateTemplateColors() {
  document.documentElement.style.setProperty(
    "--selected-primary",
    brandColorField.value,
  );
  document.documentElement.style.setProperty(
    "--selected-secondary",
    secondaryColorField.value,
  );
  const pageColor = usePageColorField.checked
    ? transparentPageColorField.checked
      ? `${pageColorField.value}${Math.round(
          (Number(pageColorOpacityField.value) / 100) * 255,
        )
          .toString(16)
          .padStart(2, "0")}`
      : pageColorField.value
    : "#fbfaf7";
  document.documentElement.style.setProperty("--selected-page", pageColor);
}

function updatePageColorControls() {
  const enabled = usePageColorField.checked;
  pageColorOptions.classList.toggle("disabled", !enabled);
  pageColorField.disabled = !enabled;
  transparentPageColorField.disabled = !enabled;
  pageColorOpacityField.disabled =
    !enabled || !transparentPageColorField.checked;
  pageColorOpacityOutput.textContent = `${pageColorOpacityField.value}%`;
  updateTemplateColors();
}

brandColorField.addEventListener("input", updateTemplateColors);
secondaryColorField.addEventListener("input", updateTemplateColors);
pageColorField.addEventListener("input", updateTemplateColors);
usePageColorField.addEventListener("change", updatePageColorControls);
transparentPageColorField.addEventListener("change", updatePageColorControls);
pageColorOpacityField.addEventListener("input", updatePageColorControls);
updateTemplateColors();
updatePageColorControls();

// Advanced mode: mood -> font/layout/services-layout/logo-size is decided
// entirely by gudi_space_generated's own script.js (see MOOD_PRESETS
// there) once template.mode === "advanced" and template.mood is set - this
// builder only needs to submit those two fields. Colors are NOT part of
// that engine-side preset, so the palettes below are this builder's own
// curated, mood-appropriate color choices, applied the same way a manual
// pick of brandColor/secondaryColor would be.
// Each mood offers 2 dark-background palettes and 2 light-background ones -
// "dark"/"light" here describes the secondary color (the site's base/header
// tone), since that's what decides whether the overall site reads as a dark
// or light theme. The engine (contrastHexColor in gudi_space_generated's
// script.js) already picks readable text automatically off secondary's own
// luminance, so a light secondary works exactly as well as a dark one -
// nothing else needs to change for these to just work.
const MOOD_PALETTES = {
  professional: [
    { name: "Ink & Champagne", tone: "dark", primary: "#b08d57", secondary: "#0f1b2d" },
    { name: "Charcoal & Teal", tone: "dark", primary: "#2a9d8f", secondary: "#1c2b2f" },
    { name: "Alabaster & Navy", tone: "light", primary: "#1f3a5f", secondary: "#f4f1ea" },
    { name: "Porcelain & Slate", tone: "light", primary: "#475569", secondary: "#f8f7f5" },
    // English/British heritage register - still "professional," just a more
    // traditional, old-money take on it than the other 4.
    { name: "British Racing & Burgundy", tone: "dark", primary: "#6b1f26", secondary: "#0d2818" },
    { name: "Tweed & Cream", tone: "light", primary: "#5c3d2e", secondary: "#f3ead9" },
  ],
  warm: [
    { name: "Clay & Espresso", tone: "dark", primary: "#d97748", secondary: "#2b211b" },
    { name: "Honey & Umber", tone: "dark", primary: "#c99a46", secondary: "#33281c" },
    { name: "Peach & Cream", tone: "light", primary: "#e2825a", secondary: "#fbf2e9" },
    { name: "Sage & Linen", tone: "light", primary: "#8a9a6b", secondary: "#f7f3ea" },
    { name: "Spiced Pumpkin & Walnut", tone: "dark", primary: "#d2691e", secondary: "#2e1f14" },
    { name: "Apricot & Buttercream", tone: "light", primary: "#e8975c", secondary: "#fbf0df" },
  ],
  bold: [
    { name: "Volt & Carbon", tone: "dark", primary: "#d7ff00", secondary: "#0b0b0b" },
    { name: "Cobalt & Black", tone: "dark", primary: "#2d6cdf", secondary: "#0b0b0f" },
    { name: "Coral Pop & Ivory", tone: "light", primary: "#ff5a5f", secondary: "#fff7f0" },
    { name: "Electric Blue & Paper", tone: "light", primary: "#0066ff", secondary: "#f5f7fa" },
    { name: "Hot Pink & Jet", tone: "dark", primary: "#ff2d78", secondary: "#0a0a0a" },
    { name: "Tangerine & Snow", tone: "light", primary: "#ff6b1a", secondary: "#fff9f5" },
  ],
  minimal: [
    { name: "Graphite & Ink", tone: "dark", primary: "#8a8a8e", secondary: "#121212" },
    { name: "Pewter & Jet", tone: "dark", primary: "#6b6b6b", secondary: "#1a1a1a" },
    { name: "Bone & Graphite", tone: "light", primary: "#4a4a4a", secondary: "#f7f6f4" },
    { name: "Stone & Ink", tone: "light", primary: "#2b2b2b", secondary: "#efeee9" },
    { name: "Onyx & Taupe", tone: "dark", primary: "#a89f91", secondary: "#161412" },
    { name: "Linen & Charcoal", tone: "light", primary: "#2f2f2f", secondary: "#f2efe9" },
  ],
};

// Mirrors MOOD_PRESETS[mood].templateId in gudi_space_generated/script.js.
// Not strictly required (the generated site re-derives this from mood on
// its own), but keeping the hidden template radio in sync avoids the
// submitted data.json looking internally inconsistent.
const MOOD_TEMPLATE_ID = {
  professional: "logo-left",
  warm: "centered",
  bold: "logo-left",
  minimal: "centered",
};

const designModeField = form.elements.namedItem("designMode");
const moodField = form.elements.namedItem("mood");
const templateField = form.elements.namedItem("template");
const advancedModePanel = document.querySelector("#advanced-mode-panel");
const manualModePanel = document.querySelector("#manual-mode-panel");
const manualTemplatePicker = document.querySelector("#manual-template-picker");
const palettePicker = document.querySelector("#palette-picker");

function currentMood() {
  return moodField?.value || "professional";
}

function swatchStyle(hex) {
  return `background:${hex}`;
}

function renderPalettePicker(mood, preserveName) {
  if (!palettePicker) return;
  const palettes = MOOD_PALETTES[mood] || MOOD_PALETTES.professional;
  const previousChecked = preserveName
    ? palettes.find((palette) => palette.name === preserveName)
    : null;
  palettePicker.replaceChildren();
  palettes.forEach((palette, index) => {
    const label = document.createElement("label");
    label.className = "palette-option";

    const input = document.createElement("input");
    input.type = "radio";
    input.name = "paletteChoice";
    input.value = palette.name;
    input.checked = previousChecked
      ? palette.name === previousChecked.name
      : index === 0;
    input.addEventListener("change", () => applyPalette(palette));

    const swatches = document.createElement("span");
    swatches.className = "palette-swatches";
    [
      palette.primary,
      palette.secondary,
      `color-mix(in srgb, ${palette.primary} 55%, white)`,
      `color-mix(in srgb, ${palette.secondary} 70%, black)`,
    ].forEach((color) => {
      const swatch = document.createElement("span");
      swatch.className = "palette-swatch";
      swatch.style.cssText = swatchStyle(color);
      swatches.append(swatch);
    });

    const name = document.createElement("span");
    name.className = "palette-name";
    name.textContent = palette.name;

    const tone = document.createElement("span");
    tone.className = `palette-tone palette-tone-${palette.tone}`;
    tone.textContent = palette.tone === "light" ? "Light" : "Dark";

    label.append(input, swatches, name, tone);
    palettePicker.append(label);

    if (input.checked) {
      applyPalette(palette);
    }
  });
}

function applyPalette(palette) {
  brandColorField.value = palette.primary;
  secondaryColorField.value = palette.secondary;
  updateTemplateColors();
}

function updateDesignModeVisibility() {
  const advanced = (designModeField?.value || "advanced") === "advanced";
  if (advancedModePanel) advancedModePanel.hidden = !advanced;
  if (manualModePanel) manualModePanel.hidden = advanced;
  // The template/layout picker stays visible in both modes - mood still
  // pre-fills a sensible default layout when you pick a mood, but you can
  // override it either way, and the generated site now honors whatever is
  // actually picked here over mood's own default.
  if (manualTemplatePicker) manualTemplatePicker.hidden = false;
  if (advanced) {
    renderPalettePicker(currentMood());
  }
}

if (moodField) {
  document.querySelectorAll('input[name="mood"]').forEach((input) => {
    input.addEventListener("change", () => {
      if (templateField) {
        templateField.value = MOOD_TEMPLATE_ID[currentMood()] || "logo-left";
      }
      renderPalettePicker(currentMood());
    });
  });
}

if (designModeField) {
  document.querySelectorAll('input[name="designMode"]').forEach((input) => {
    input.addEventListener("change", updateDesignModeVisibility);
  });
}

updateDesignModeVisibility();

function renderBackgroundImagePreview() {
  const imageSource = imagePreviewValue(importedBackgroundImage);
  if (!imageSource) {
    backgroundImagePreviewElement.removeAttribute("src");
    backgroundImagePreview.hidden = true;
    return;
  }
  backgroundImagePreviewElement.src = imageSource;
  backgroundImagePreview.hidden = false;
}

backgroundImageField.addEventListener("change", async () => {
  const [file] = backgroundImageField.files;
  if (!file) return;

  backgroundImageValidationError.hidden = true;
  backgroundImageValidationError.textContent = "";

  try {
    importedBackgroundImage = await runWithLoader(
      "Loading image...",
      () => readImage(file, 900),
    );
    backgroundImageField.value = "";
    renderBackgroundImagePreview();
  } catch (error) {
    backgroundImageField.value = "";
    // Same reasoning as the logo input: it's visually hidden, so the
    // native validation bubble never renders. Use a visible element.
    backgroundImageValidationError.textContent = error.message;
    backgroundImageValidationError.hidden = false;
  }
});

clearBackgroundImageButton.addEventListener("click", () => {
  backgroundImageField.value = "";
  importedBackgroundImage = null;
  renderBackgroundImagePreview();
});

renderBackgroundImagePreview();

function closeInformationPopovers(exceptButton = null) {
  document.querySelectorAll(".field-info").forEach((button) => {
    if (button === exceptButton) return;
    button.setAttribute("aria-expanded", "false");
    const popover = document.querySelector(
      `#${button.getAttribute("aria-controls")}`,
    );
    if (popover) popover.hidden = true;
  });
}

document.addEventListener("click", (event) => {
  const button = event.target.closest(".field-info");
  if (!button) {
    closeInformationPopovers();
    return;
  }
  event.preventDefault();
  event.stopPropagation();
  const popover = document.querySelector(
    `#${button.getAttribute("aria-controls")}`,
  );
  const willOpen = button.getAttribute("aria-expanded") !== "true";
  closeInformationPopovers(button);
  button.setAttribute("aria-expanded", String(willOpen));
  if (popover) popover.hidden = !willOpen;
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeInformationPopovers();
});

if (isOpenedDirectly) {
  serverWarning.hidden = false;
  serverStatus.hidden = false;
  serverStatus.textContent = "Server unavailable: this page was opened directly.";
  serverStatus.className = "server-status disconnected";
  previewButton.disabled = true;
} else if (!isLocalBuilder) {
  serverStatus.hidden = true;
  previewButton.disabled = false;
}

function setStatus(message, type = "") {
  statusMessage.textContent = message;
  statusMessage.className = type;
}

async function checkServer() {
  if (isOpenedDirectly || !isLocalBuilder) {
    return false;
  }

  serverStatus.hidden = false;
  try {
    const response = await fetch(`/api/health?time=${Date.now()}`, {
      cache: "no-store",
    });
    const health = await response.json();
    serverOutdated =
      response.ok && Number(health.version) < expectedServerVersion;
    serverConnected = response.ok && !serverOutdated;
  } catch {
    serverConnected = false;
    serverOutdated = false;
  }

  serverStatus.textContent = serverConnected
    ? "Website Builder server connected."
    : serverOutdated
      ? "Website Builder server is outdated. Close its Terminal window and run start.command again."
      : "Website Builder server is not responding. Restart start.command.";
  serverStatus.className = `server-status ${
    serverConnected ? "connected" : "disconnected"
  }`;
  serverStatus.hidden = serverConnected;
  previewButton.disabled = isOpenedDirectly;
  return serverConnected;
}

wizardInitialized = true;
showWizardStep(0);

function createImageThumbnail(dataUrl, maxSize = 480) {
  return new Promise((resolve) => {
    const image = new Image();
    image.addEventListener("load", () => {
      const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
      const width = Math.max(1, Math.round(image.width * scale));
      const height = Math.max(1, Math.round(image.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      canvas.getContext("2d").drawImage(image, 0, 0, width, height);
      resolve(canvas.toDataURL("image/webp", 0.85));
    });
    image.addEventListener("error", () => resolve(""));
    image.src = dataUrl;
  });
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(reader.result));
    reader.addEventListener("error", () => {
      reject(new Error(`Could not read ${file.name}.`));
    });
    reader.readAsDataURL(file);
  });
}

function loadImage(dataUrl, fileName) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", () => {
      reject(new Error(`Could not process ${fileName}.`));
    });
    image.src = dataUrl;
  });
}

function canvasToBlob(canvas, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
          return;
        }
        reject(new Error("The image could not be compressed."));
      },
      "image/webp",
      quality,
    );
  });
}

// Carries a stable `code` + the file's `name` alongside a natural-language
// `message`, so a single-file caller (logo/background) can just show
// `.message`, while a multi-file caller (gallery) can group failures by
// `.code` and list the filenames together instead of repeating the same
// sentence once per file.
class ImageValidationError extends Error {
  constructor(code, fileName, message) {
    super(message);
    this.code = code;
    this.fileName = fileName;
  }
}

async function compressImage(
  file,
  originalDataUrl,
  image,
  forceCompression = false,
) {
  const largestDimension = Math.max(image.naturalWidth, image.naturalHeight);
  if (
    !forceCompression &&
    supportedImageTypes.has(file.type) &&
    file.size <= maxImageSize &&
    largestDimension <= maxImageDimension
  ) {
    return {
      name: file.name,
      type: file.type,
      dataUrl: originalDataUrl,
    };
  }

  let scale = Math.min(1, maxImageDimension / largestDimension);
  let width = Math.max(1, Math.round(image.naturalWidth * scale));
  let height = Math.max(1, Math.round(image.naturalHeight * scale));
  let quality = 0.86;

  for (let attempt = 0; attempt < 30; attempt += 1) {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) {
      throw new ImageValidationError(
        "processing-failed",
        file.name,
        `Could not process ${file.name}.`,
      );
    }
    context.drawImage(image, 0, 0, width, height);
    const blob = await canvasToBlob(canvas, quality);

    if (blob.size <= maxImageSize) {
      return {
        name: file.name.replace(/\.[^.]+$/, "") + ".webp",
        type: "image/webp",
        dataUrl: await readFileAsDataUrl(blob),
      };
    }

    if (quality > 0.58) {
      quality -= 0.07;
    } else {
      width = Math.max(1, Math.round(width * 0.85));
      height = Math.max(1, Math.round(height * 0.85));
      quality = 0.8;
    }
  }

  throw new ImageValidationError(
    "compression-failed",
    file.name,
    `${file.name} could not be compressed below ${maxImageSizeMb} MB.`,
  );
}

function isHeicImage(file) {
  return (
    heicImageTypes.has(file.type.toLowerCase()) ||
    heicImagePattern.test(file.name)
  );
}

async function convertHeicImage(file) {
  if (typeof window.heic2any !== "function") {
    throw new ImageValidationError(
      "heic-unavailable",
      file.name,
      "HEIC conversion is unavailable. Refresh the builder and try again.",
    );
  }

  let converted;
  try {
    converted = await window.heic2any({
      blob: file,
      toType: "image/jpeg",
      quality: 0.92,
    });
  } catch (error) {
    console.error("HEIC conversion failed.", error);
    throw new ImageValidationError(
      "heic-conversion-failed",
      file.name,
      `${file.name} could not be converted. Try exporting it as JPG and upload it again.`,
    );
  }

  const blob = Array.isArray(converted) ? converted[0] : converted;
  if (!(blob instanceof Blob)) {
    throw new ImageValidationError(
      "heic-invalid-output",
      file.name,
      `${file.name} did not produce a usable converted image.`,
    );
  }

  const dataUrl = await readFileAsDataUrl(blob);
  const image = await loadImage(dataUrl, file.name);
  return compressImage(
    {
      name: file.name.replace(/\.(heic|heif)$/i, ".jpg"),
      type: "image/jpeg",
      size: blob.size,
    },
    dataUrl,
    image,
    true,
  );
}

async function readImage(file, thumbnailMaxSize = 480) {
  const supportedExtension = supportedImagePattern.test(file.name);
  const heicImage = isHeicImage(file);
  if (
    !supportedImageTypes.has(file.type) &&
    !heicImage &&
    !supportedExtension
  ) {
    throw new ImageValidationError(
      "unsupported-type",
      file.name,
      `${file.name} is not supported. Choose a PNG, JPG, WebP, GIF, HEIC, or HEIF image.`,
    );
  }

  if (file.size > maxSourceImageSize) {
    throw new ImageValidationError(
      "too-large",
      file.name,
      `${file.name} is larger than the ${maxSourceImageSizeMb} MB input safety limit.`,
    );
  }

  const compressed = heicImage
    ? await convertHeicImage(file)
    : await (async () => {
        const originalDataUrl = await readFileAsDataUrl(file);
        const image = await loadImage(originalDataUrl, file.name);
        return compressImage(file, originalDataUrl, image);
      })();
  return {
    id: createMediaId("media"),
    ...compressed,
    thumbnail: await createImageThumbnail(compressed.dataUrl, thumbnailMaxSize),
  };
}

function clearLogo() {
  logoInput.value = "";
  importedLogo = null;
  renderLogoPreview();
}

function renderLogoPreview() {
  const imageSource = imagePreviewValue(importedLogo);
  if (imageSource) {
    logoPreviewImage.src = imageSource;
    logoPreview.hidden = false;
    return;
  }
  logoPreviewImage.removeAttribute("src");
  logoPreview.hidden = true;
}

logoInput.addEventListener("change", async () => {
  const [file] = logoInput.files;
  if (!file) {
    clearLogo();
    return;
  }

  logoValidationError.hidden = true;
  logoValidationError.textContent = "";

  try {
    const logo = await runWithLoader("Loading image...", () => readImage(file));
    importedLogo = logo;
    logoInput.value = "";
    renderLogoPreview();
  } catch (error) {
    clearLogo();
    // The logo file input is visually a 1x1px hidden element, so the
    // browser's native validation bubble (setCustomValidity/reportValidity)
    // has nowhere sensible to anchor and silently never appears. Show the
    // error in a real, visible element instead.
    logoValidationError.textContent = error.message;
    logoValidationError.hidden = false;
  }
});

removeLogoButton.addEventListener("click", clearLogo);

function renderGalleryPreviews() {
  galleryPreviews.replaceChildren();
  importedGallery.forEach((image, index) => {
    const preview = document.createElement("span");
    preview.className = "image-preview";
    preview.draggable = true;
    preview.dataset.mediaId = portableImageId(image, "gallery");
    preview.title = "Drag to reorder";

    const previewImage = document.createElement("img");
    previewImage.src = imagePreviewValue(image);
    previewImage.alt = `Selected gallery image ${index + 1}`;

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.setAttribute(
      "aria-label",
      `Remove gallery image ${index + 1}`,
    );
    removeButton.textContent = "×";
    removeButton.addEventListener("click", () => {
      importedGallery.splice(index, 1);
      galleryValidationError.hidden = true;
      galleryValidationError.textContent = "";
      renderGalleryPreviews();
    });

    preview.append(previewImage, removeButton);
    galleryPreviews.append(preview);
  });
}

function syncGalleryOrder() {
  const imagesById = new Map(
    importedGallery.map((image) => [portableImageId(image, "gallery"), image]),
  );
  importedGallery = [...galleryPreviews.querySelectorAll(".image-preview")]
    .map((preview) => imagesById.get(preview.dataset.mediaId))
    .filter(Boolean);
}

// One line per failure REASON, not per file - so 3 oversized files show
// as one grouped sentence ("a.jpg, b.jpg, c.jpg are larger than the 20 MB
// size limit.") instead of the same sentence repeated three times.
const galleryErrorTemplates = {
  "unsupported-type": (files, plural) =>
    `${files} ${plural ? "are" : "is"} not supported. Choose a PNG, JPG, WebP, GIF, HEIC, or HEIF image.`,
  "too-large": (files, plural) =>
    `${files} ${plural ? "are" : "is"} larger than the ${maxSourceImageSizeMb} MB size limit.`,
  "compression-failed": (files, plural) =>
    `${files} could not be compressed small enough to upload.`,
  "processing-failed": (files, plural) => `${files} could not be processed.`,
  "heic-unavailable": () =>
    "HEIC conversion is unavailable. Refresh the builder and try again.",
  "heic-conversion-failed": (files, plural) =>
    `${files} could not be converted. Try exporting ${plural ? "them" : "it"} as JPG and upload again.`,
  "heic-invalid-output": (files, plural) =>
    `${files} did not produce a usable converted image.`,
};

function formatGalleryErrors(failedResults) {
  const groups = new Map();
  failedResults.forEach((result) => {
    const error = result.reason;
    const code = error?.code || "unknown";
    const fileName = error?.fileName || "One image";
    if (!groups.has(code)) groups.set(code, []);
    groups.get(code).push(fileName);
  });

  return [...groups.entries()]
    .map(([code, fileNames]) => {
      const template = galleryErrorTemplates[code];
      const plural = fileNames.length > 1;
      if (template) return template(fileNames.join(", "), plural);
      return `${fileNames.join(", ")} could not be added.`;
    })
    .join(" ");
}

galleryInput.addEventListener("change", async () => {
  const files = [...galleryInput.files];
  if (!files.length) return;
  galleryValidationError.hidden = true;
  galleryValidationError.textContent = "";

  const maxGalleryImages = currentMaxGalleryImages();
  if (importedGallery.length + files.length > maxGalleryImages) {
    galleryInput.value = "";
    galleryValidationError.textContent =
      `You can add up to ${maxGalleryImages} gallery images. You selected ${files.length}, with ${importedGallery.length} already added.`;
    galleryValidationError.hidden = false;
    return;
  }

  const results = await runWithLoader(
    "Loading image...",
    () => Promise.allSettled(files.map((file) => readImage(file))),
  );

  const images = [];
  const failed = [];
  results.forEach((result) => {
    if (result.status === "fulfilled") {
      images.push(result.value);
    } else {
      failed.push(result);
    }
  });

  importedGallery.push(...images);
  galleryInput.value = "";
  renderGalleryPreviews();

  if (failed.length) {
    galleryValidationError.textContent = formatGalleryErrors(failed);
    galleryValidationError.hidden = false;
  }
});

function updateServiceEditorLabels() {
  const editors = [...serviceEditorList.querySelectorAll(".service-editor")];
  editors.forEach((editor, index) => {
    const title = editor.querySelector(".service-title")?.value.trim();
    editor.querySelector("[data-service-number]").textContent = title
      ? `Offering ${index + 1} — ${title}`
      : `Offering ${index + 1}`;
    editor.querySelector(".remove-service-button").disabled =
      editors.length === 1;
    editor.querySelector(".move-item-up").disabled = index === 0;
    editor.querySelector(".move-item-down").disabled =
      index === editors.length - 1;
  });
}

function createServiceEditor(service = {}) {
  serviceEditorSequence += 1;
  const infoIdPrefix = `offering-${serviceEditorSequence}`;
  const editor = document.createElement("article");
  editor.className = "service-editor";
  editor.innerHTML = `
    <div class="service-editor-header">
      <button class="drag-handle" type="button" draggable="true" aria-label="Drag offering to reorder" title="Drag to reorder">⋮⋮</button>
      <strong data-service-number>Offering</strong>
      <div class="editor-header-actions">
        <button class="move-item-up" type="button" aria-label="Move offering up">↑</button>
        <button class="move-item-down" type="button" aria-label="Move offering down">↓</button>
        <button class="collapse-editor-button" type="button" aria-expanded="true">Minimize</button>
        <button class="remove-service-button" type="button">Remove</button>
      </div>
    </div>
    <div class="service-editor-fields">
      <label>
        <span class="label-with-info">
          Title
          <button class="field-info" type="button" aria-expanded="false" aria-controls="${infoIdPrefix}-title-info" aria-label="Offering title information">i</button>
          <span class="info-popover" id="${infoIdPrefix}-title-info" role="tooltip" hidden>Name of what you're offering</span>
        </span>
        <input class="service-title" placeholder="e.g. Website Design" />
      </label>
      <label>
        <span class="label-with-info">
          Price
          <button class="field-info" type="button" aria-expanded="false" aria-controls="${infoIdPrefix}-price-info" aria-label="Offering price information">i</button>
          <span class="info-popover" id="${infoIdPrefix}-price-info" role="tooltip" hidden>Cost for this offering</span>
        </span>
        <input class="service-price-input" placeholder="e.g. $999 or Contact us" />
      </label>
      <label class="service-description-field">
        <span class="label-with-info">
          Description
          <button class="field-info" type="button" aria-expanded="false" aria-controls="${infoIdPrefix}-description-info" aria-label="Offering description information">i</button>
          <span class="info-popover" id="${infoIdPrefix}-description-info" role="tooltip" hidden>A short information about this offering.</span>
        </span>
        <textarea class="service-description" rows="3" placeholder="e.g. Describe this offering."></textarea>
      </label>
      <label>
        <span class="label-with-info">
          Purchase link
          <button class="field-info" type="button" aria-expanded="false" aria-controls="${infoIdPrefix}-purchase-info" aria-label="Purchase link information">i</button>
          <span class="info-popover" id="${infoIdPrefix}-purchase-info" role="tooltip" hidden>Where customers go to buy or book this. Paste the full URL.</span>
        </span>
        <input class="service-link-input" type="url" placeholder="e.g. amazon, flipkart links" />
      </label>
      <label>
        <span class="label-with-info">
          Payment link
          <button class="field-info" type="button" aria-expanded="false" aria-controls="${infoIdPrefix}-payment-info" aria-label="Payment link information">i</button>
          <span class="info-popover" id="${infoIdPrefix}-payment-info" role="tooltip" hidden>Adds a Pay now button. Direct payment link for this offering, if you have one (e.g. from Stripe or PayPal).</span>
        </span>
        <input class="service-payment-link-input" type="url" placeholder="e.g. https://buy.stripe.com/..." />
      </label>
      <div class="service-image-field">
        <span class="label-with-info">
          Offering image
          <button class="field-info" type="button" aria-expanded="false" aria-controls="${infoIdPrefix}-image-info" aria-label="Offering image information">i</button>
          <span class="info-popover" id="${infoIdPrefix}-image-info" role="tooltip" hidden>A photo for this offering. Ignored if you add a video link below.</span>
        </span>
        <div class="image-upload-row">
          <label class="image-file-button">
            Choose file
            <input class="service-image-input image-file-input" type="file" accept=".png,.jpg,.jpeg,.webp,.gif,.heic,.heif" />
          </label>
          <span class="service-image-preview image-preview" hidden>
            <img alt="Selected offering image preview" />
            <button class="remove-service-image" type="button" aria-label="Remove selected offering image">×</button>
          </span>
        </div>
      </div>
      <label>
        <span class="label-with-info">
          Video link
          <button class="field-info" type="button" aria-expanded="false" aria-controls="${infoIdPrefix}-video-info" aria-label="Video link information">i</button>
          <span class="info-popover" id="${infoIdPrefix}-video-info" role="tooltip" hidden>Link to a video for this offering (e.g. YouTube). If added, this replaces the image.</span>
        </span>
        <input class="service-video-input" type="url" placeholder="e.g. https://youtube.com/watch?v=..." />
      </label>
    </div>
  `;

  editor.querySelector(".service-title").value = service.title || "";
  editor.querySelector(".service-description").value =
    service.description || "";
  editor.querySelector(".service-price-input").value = service.price || "";
  editor.querySelector(".service-link-input").value = service.link || "";
  editor.querySelector(".service-payment-link-input").value =
    service.paymentLink || "";
  editor._importedImage = service.image || null;
  editor.querySelector(".service-video-input").value = service.video || "";

  const serviceImageInput = editor.querySelector(".service-image-input");
  const serviceImagePreview = editor.querySelector(".service-image-preview");
  const serviceImagePreviewElement = serviceImagePreview.querySelector("img");
  const renderServiceImage = () => {
    const imageSource = imagePreviewValue(editor._importedImage);
    if (!imageSource) {
      serviceImagePreviewElement.removeAttribute("src");
      serviceImagePreview.hidden = true;
      return;
    }
    serviceImagePreviewElement.src = imageSource;
    serviceImagePreview.hidden = false;
  };

  serviceImageInput.addEventListener("change", async (event) => {
    const [file] = event.target.files;
    if (!file) return;
    try {
      editor._importedImage = await runWithLoader(
        "Loading image...",
        () => readImage(file),
      );
      serviceImageInput.value = "";
      renderServiceImage();
    } catch (error) {
      serviceImageInput.value = "";
      serviceImageInput.setCustomValidity(error.message);
      serviceImageInput.reportValidity();
      serviceImageInput.setCustomValidity("");
    }
  });
  editor.querySelector(".remove-service-image").addEventListener("click", () => {
    serviceImageInput.value = "";
    editor._importedImage = null;
    renderServiceImage();
  });
  editor.querySelector(".remove-service-button").addEventListener("click", () => {
    editor.remove();
    updateServiceEditorLabels();
  });
  editor.querySelector(".collapse-editor-button").addEventListener("click", (event) => {
    const collapsed = editor.classList.toggle("editor-collapsed");
    event.currentTarget.textContent = collapsed ? "Expand" : "Minimize";
    event.currentTarget.setAttribute("aria-expanded", String(!collapsed));
  });
  serviceEditorList.append(editor);

  renderServiceImage();
  updateServiceEditorLabels();
}

function normalizeServices(services) {
  if (Array.isArray(services)) {
    return services.filter(
      (service) => service && typeof service === "object",
    );
  }
  if (typeof services === "string") {
    return services
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const parts = line.split("|").map((part) => part.trim());
        return {
          title: parts[0] || "",
          description: parts[1] || "",
          price: parts[2] || "",
          link: parts[3] || "",
          paymentLink: "",
          image: "",
          video: parts[4] || "",
        };
      });
  }
  return [];
}

function loadServices(services) {
  serviceEditorList.replaceChildren();
  const entries = normalizeServices(services);
  (entries.length ? entries : [{}]).forEach(createServiceEditor);
}

async function collectServices() {
  const services = await Promise.all(
    [...serviceEditorList.querySelectorAll(".service-editor")].map(
      async (editor) => {
        const imageFile = editor.querySelector(".service-image-input").files[0];
        return {
      title: editor.querySelector(".service-title").value.trim(),
      description: editor.querySelector(".service-description").value.trim(),
      price: editor.querySelector(".service-price-input").value.trim(),
      link: editor.querySelector(".service-link-input").value.trim(),
      paymentLink: editor
        .querySelector(".service-payment-link-input")
        .value.trim(),
          image: imageFile
            ? await readImage(imageFile)
            : editor._importedImage,
          video: editor.querySelector(".service-video-input").value.trim(),
        };
      },
    ),
  );
  return services.filter((service) =>
    Object.values(service).some((value) => Boolean(value)),
  );
}

addServiceButton.addEventListener("click", () => createServiceEditor());
serviceEditorList.addEventListener("input", () => {
  if (hasOfferingContent()) servicesValidationError.hidden = true;
  updateServiceEditorLabels();
});
serviceEditorList.addEventListener("change", () => {
  if (hasOfferingContent()) servicesValidationError.hidden = true;
});
loadServices([]);

function updateReviewEditorLabels() {
  const editors = [...reviewEditorList.querySelectorAll(".review-editor")];
  editors.forEach((editor, index) => {
    const name = editor.querySelector(".review-name")?.value.trim();
    editor.querySelector("[data-review-number]").textContent = name
      ? `Review ${index + 1} — ${name}`
      : `Review ${index + 1}`;
    editor.querySelector(".remove-review-button").disabled =
      editors.length === 1;
    editor.querySelector(".move-item-up").disabled = index === 0;
    editor.querySelector(".move-item-down").disabled =
      index === editors.length - 1;
  });
}

function createReviewEditor(review = {}) {
  const editor = document.createElement("article");
  editor.className = "review-editor";
  editor.innerHTML = `
    <div class="service-editor-header">
      <button class="drag-handle" type="button" draggable="true" aria-label="Drag review to reorder" title="Drag to reorder">⋮⋮</button>
      <strong data-review-number>Review</strong>
      <div class="editor-header-actions">
        <button class="move-item-up" type="button" aria-label="Move review up">↑</button>
        <button class="move-item-down" type="button" aria-label="Move review down">↓</button>
        <button class="collapse-editor-button" type="button" aria-expanded="true">Minimize</button>
        <button class="remove-review-button" type="button">Remove</button>
      </div>
    </div>
    <div class="review-editor-fields">
      <label>
        Customer name
        <input class="review-name" maxlength="180" placeholder="e.g. Alex Morgan" />
      </label>
      <label>
        Date
        <input class="review-date" type="date" />
      </label>
      <label class="review-text-field">
        Review
        <textarea class="review-text" maxlength="3000" rows="3" placeholder="e.g. Professional and easy to work with."></textarea>
      </label>
      <label>
        Stars
        <select class="review-stars">
          <option value="">Select rating</option>
          <option value="5">5 stars</option>
          <option value="4">4 stars</option>
          <option value="3">3 stars</option>
          <option value="2">2 stars</option>
          <option value="1">1 star</option>
        </select>
      </label>
    </div>
  `;
  editor.querySelector(".review-name").value = review.name || "";
  editor.querySelector(".review-date").value = review.date || "";
  editor.querySelector(".review-text").value = review.review || "";
  editor.querySelector(".review-stars").value = review.stars || "";
  editor.querySelector(".remove-review-button").addEventListener("click", () => {
    editor.remove();
    updateReviewEditorLabels();
  });
  editor.querySelector(".collapse-editor-button").addEventListener("click", (event) => {
    const collapsed = editor.classList.toggle("editor-collapsed");
    event.currentTarget.textContent = collapsed ? "Expand" : "Minimize";
    event.currentTarget.setAttribute("aria-expanded", String(!collapsed));
  });
  reviewEditorList.append(editor);
  updateReviewEditorLabels();
}

function loadReviews(reviews) {
  reviewEditorList.replaceChildren();
  const entries = Array.isArray(reviews) ? reviews : [];
  (entries.length ? entries : [{}]).forEach(createReviewEditor);
}

function collectReviews() {
  return [...reviewEditorList.querySelectorAll(".review-editor")]
    .map((editor) => {
      const stars = Number(editor.querySelector(".review-stars").value);
      return {
        name: editor.querySelector(".review-name").value.trim() || "Customer",
        review: editor.querySelector(".review-text").value.trim(),
        date: editor.querySelector(".review-date").value,
        stars: Number.isInteger(stars) && stars >= 1 && stars <= 5 ? stars : null,
      };
    })
    .filter((review) => review.review);
}

addReviewButton.addEventListener("click", () => createReviewEditor());
reviewEditorList.addEventListener("input", updateReviewEditorLabels);
loadReviews([]);

function setupSortableList(container, itemSelector, onReorder) {
  let draggedItem = null;

  container.addEventListener("dragstart", (event) => {
    const handle = event.target.closest(".drag-handle");
    const item = handle?.closest(itemSelector) || event.target.closest(itemSelector);
    if (!item || (!handle && container !== galleryPreviews)) {
      event.preventDefault();
      return;
    }
    draggedItem = item;
    item.classList.add("dragging");
    event.dataTransfer.effectAllowed = "move";
  });

  container.addEventListener("dragover", (event) => {
    if (!draggedItem) return;
    event.preventDefault();
    const target = event.target.closest(itemSelector);
    if (!target || target === draggedItem) return;
    const bounds = target.getBoundingClientRect();
    const after =
      container === galleryPreviews
        ? event.clientX > bounds.left + bounds.width / 2
        : event.clientY > bounds.top + bounds.height / 2;
    target[after ? "after" : "before"](draggedItem);
  });

  container.addEventListener("dragend", () => {
    if (!draggedItem) return;
    draggedItem.classList.remove("dragging");
    draggedItem = null;
    onReorder();
  });

  container.addEventListener("click", (event) => {
    const moveButton = event.target.closest(".move-item-up, .move-item-down");
    if (!moveButton) return;
    const item = moveButton.closest(itemSelector);
    if (moveButton.classList.contains("move-item-up") && item.previousElementSibling) {
      item.previousElementSibling.before(item);
    } else if (
      moveButton.classList.contains("move-item-down") &&
      item.nextElementSibling
    ) {
      item.nextElementSibling.after(item);
    }
    onReorder();
  });
}

setupSortableList(galleryPreviews, ".image-preview", syncGalleryOrder);
setupSortableList(serviceEditorList, ".service-editor", updateServiceEditorLabels);
setupSortableList(reviewEditorList, ".review-editor", updateReviewEditorLabels);

function setFormValue(name, value) {
  const field = form.elements.namedItem(name);
  if (!field) return;
  if (field instanceof RadioNodeList) {
    field.value = value ?? "";
    return;
  }
  if (field.type === "checkbox") {
    field.checked = Boolean(value);
    return;
  }
  field.value = value ?? "";
}

function resetBuilderForm() {
  form.reset();
  setWebsiteOperation("create");
  yearStartedField.value = String(new Date().getFullYear());
  importedLogo = null;
  importedGallery = [];
  importedBackgroundImage = null;
  renderLogoPreview();
  renderGalleryPreviews();
  renderBackgroundImagePreview();
  loadServices([]);
  loadReviews([]);
  servicesValidationError.hidden = true;
  setStatus("");
  setDataDeliveryStatus("");
  finalGeneration.hidden = true;
  previewFrame.removeAttribute("srcdoc");
  previewFrameShell.hidden = true;
  previewPlaceholder.hidden = false;
  updatePageColorControls();
  renderPalettePicker("professional");
  updateDesignModeVisibility();
}

function loadWebsiteData(payload, accountEmail = "") {
  const data = payload;
  if (!data || typeof data !== "object") {
    throw new Error("The API response does not contain website data.");
  }

  const company = data.company || {};
  const template = data.template || {};
  const contact = data.contact || {};
  const reviewSettings = data.reviewSettings || {};
  const social = data.socialMedia || {};
  const appointment = data.appointment || {};

  setFormValue("companyName", company.companyName);
  setFormValue("yearStarted", company.yearStarted);
  setFormValue("tagline", company.tagline);
  setFormValue("description", company.description);
  setFormValue("about", company.about);
  setFormValue("template", template.templateId || "logo-left");
  setFormValue("designMode", template.mode || "advanced");
  setFormValue("mood", template.mood || "professional");
  setFormValue(
    "brandColor",
    template.primaryColor || "#c79245",
  );
  setFormValue(
    "secondaryColor",
    template.secondaryColor || "#172238",
  );
  // Re-render the palette list for whichever mood this site was saved
  // with, and try to re-select the exact palette (by matching its stored
  // colors) rather than defaulting back to the first option.
  if (typeof renderPalettePicker === "function") {
    const savedPalette = (
      MOOD_PALETTES[template.mood] || MOOD_PALETTES.professional
    ).find(
      (palette) =>
        palette.primary === template.primaryColor &&
        palette.secondary === template.secondaryColor,
    );
    renderPalettePicker(template.mood || "professional", savedPalette?.name);
  }
  if (typeof updateDesignModeVisibility === "function") {
    updateDesignModeVisibility();
  }
  setFormValue("usePageColor", template.usePageColor);
  setFormValue("pageColor", template.pageColor || "#fbfaf7");
  setFormValue("transparentPageColor", template.transparentPageColor);
  setFormValue(
    "pageColorOpacity",
    template.pageColorOpacity || 70,
  );
  setFormValue("contactAccessKey", contact.accessKey || reviewSettings.accessKey);
  setFormValue("email", accountEmail || contact.email);
  setFormValue("phone", contact.phone);
  setFormValue("address", contact.address);
  setFormValue("showCall", contact.showCall);
  setFormValue("showEmail", contact.showEmail);
  setFormValue("instagram", social.instagram);
  setFormValue("facebook", social.facebook);
  setFormValue("linkedin", social.linkedin);
  setFormValue("twitter", social.twitter);
  setFormValue("youtube", social.youtube);
  setFormValue("applePodcast", social.applePodcast);
  setFormValue("spotify", social.spotify);
  setFormValue("appointmentUrl", appointment.url);

  importedLogo = normalizeStoredImage(
    {
      image_id: company.image_id,
      image_src: company.image_src,
      image_path: company.image_path,
      image_preview_src: company.image_preview_src,
      image_thumbnail: company.image_thumbnail || "",
    },
    "company",
  );
  importedBackgroundImage = normalizeStoredImage(
    {
      image_id: template.background_image_id,
      image_src: template.background_image_src,
      image_path: template.background_image_path,
      image_preview_src: template.image_preview_src,
      image_thumbnail: template.background_image_thumbnail || "",
    },
    "background",
  );
  importedGallery = Array.isArray(data.gallery)
    ? data.gallery
        .map((image) => normalizeStoredImage(image, "gallery"))
        .filter(Boolean)
        .slice(0, maxGalleryImagesModify)
    : [];
  const services = Array.isArray(data.services)
    ? data.services.map((service) => ({
        ...service,
        image: normalizeStoredImage(
          {
            image_id: service.image_id,
            image_src: service.image_src,
            image_path: service.image_path,
            image_preview_src: service.image_preview_src,
            image_thumbnail: service.image_thumbnail || "",
          },
          "service",
        ),
      }))
    : [];

  renderLogoPreview();
  renderGalleryPreviews();
  renderBackgroundImagePreview();
  loadServices(services);
  loadReviews(data.reviews);
  updatePageColorControls();
  setWebsiteOperation("modify", accountEmail || contact.email || "");
  finalGeneration.hidden = true;
  previewFrame.removeAttribute("srcdoc");
  previewFrameShell.hidden = true;
  previewPlaceholder.hidden = false;
  setStatus("");
  showBuilderWorkspace();
}

startCreateWebsiteButton.addEventListener("click", () => {
  resetBuilderForm();
  showBuilderWorkspace();
});

showManageWebsiteButton.addEventListener("click", () => {
  closeAllHomePanels();
  // Otherwise a stale error from an earlier failed lookup (e.g. "No
  // company exists for provided email") keeps showing here every time
  // this panel is reopened, even after that was resolved elsewhere.
  manageStatus.textContent = "";
  manageStatus.className = "home-panel-status";
  managePanel.hidden = false;
  // Pre-fill from the last site created/modified in this browser, if
  // any, so the person doesn't have to retype an email they just used -
  // only when the field is still empty, never overwriting something
  // they're already in the middle of typing.
  if (!manageEmail.value) {
    manageEmail.value = getCreatedSiteEmail();
  }
  manageEmail.focus();
  managePanel.scrollIntoView({ behavior: "smooth", block: "center" });
});

showDeleteWebsiteButton.addEventListener("click", () => {
  closeAllHomePanels();
  deletePanel.hidden = false;
  if (!deleteEmail.value) {
    deleteEmail.value = getCreatedSiteEmail();
  }
  deleteEmail.focus();
  deletePanel.scrollIntoView({ behavior: "smooth", block: "center" });
});

document.querySelectorAll("[data-close-panel]").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelector(`#${button.dataset.closePanel}`).hidden = true;
  });
});

loadWebsiteButton.addEventListener("click", async () => {
  manageStatus.textContent = "";
  manageStatus.className = "home-panel-status";
  if (!manageEmail.value.trim() || !manageEmail.checkValidity()) {
    manageEmail.reportValidity();
    return;
  }

  const email = manageEmail.value.trim();
  const requestUrl = new URL(websiteGenerationEndpoint);
  requestUrl.searchParams.set("email", email);
  loadWebsiteButton.disabled = true;
  loadWebsiteButton.textContent = "Loading website...";

  try {
    const responseData = await runWithLoader("Loading website...", async () => {
      const response = await fetch(requestUrl, {
        method: "GET",
        headers: { Accept: "application/json" },
      });
      return readGenerationApiResponse(response);
    });
    if (
      !responseData.data ||
      typeof responseData.data !== "object" ||
      Array.isArray(responseData.data)
    ) {
      console.error("Generation API returned invalid website data.", responseData);
      throw new Error("The server returned an invalid response.");
    }
    loadWebsiteData(responseData.data, email);
  } catch (error) {
    manageStatus.textContent = error.message;
    manageStatus.className = "home-panel-status error";
  } finally {
    loadWebsiteButton.disabled = false;
    loadWebsiteButton.innerHTML =
      'Load website for editing <span aria-hidden="true">→</span>';
  }
});

deleteWebsiteButton.addEventListener("click", async () => {
  deleteStatus.textContent = "";
  deleteStatus.className = "home-panel-status";
  if (!deleteEmail.value.trim() || !deleteEmail.checkValidity()) {
    deleteEmail.reportValidity();
    return;
  }

  const email = deleteEmail.value.trim();
  if (!(await confirmDeleteWebsite(email))) {
    return;
  }

  const requestUrl = new URL(websiteGenerationEndpoint);
  requestUrl.searchParams.set("email", email);
  deleteWebsiteButton.disabled = true;
  deleteWebsiteButton.textContent = "Checking details...";
  try {
    // Confirms a company actually exists for this email *before* sending
    // an OTP - catches a misspelled/wrong email up front instead of
    // wasting an OTP send + verify on a delete that was always going to
    // fail with "No company exists for provided email."
    await runSanityCheck({ action: "delete", email });
    deleteWebsiteButton.textContent = "Sending OTP...";

    await startOtpVerification({
      email,
      onCancel: () => {
        deleteWebsiteButton.disabled = false;
        deleteWebsiteButton.textContent = "Delete website";
      },
      onOperationError: (error) => {
        deleteStatus.textContent = error.message;
        deleteStatus.className = "home-panel-status error";
        deleteWebsiteButton.disabled = false;
        deleteWebsiteButton.textContent = "Delete website";
      },
      onVerify: async (otp) => {
        requestUrl.searchParams.set("otp", otp);
        let deleteResponseData;
        await runWithLoader("Deleting website...", async () => {
          const response = await fetch(requestUrl, {
            method: "DELETE",
            headers: { Accept: "application/json" },
          });
          deleteResponseData = await readGenerationApiResponse(response);
        });
        deleteStatus.textContent = deleteResponseData?.subscriptionCanceled
          ? "Website deleted successfully. Your subscription has also been cancelled."
          : "Website deleted successfully.";
        deleteStatus.className = "home-panel-status success";
        deleteEmail.value = "";
        if (
          lockedWebsiteEmail.toLowerCase() === email.toLowerCase() ||
          getCreatedSiteEmail().toLowerCase() === email.toLowerCase()
        ) {
          resetBuilderForm();
          startCreateWebsiteButton.disabled = false;
          startCreateWebsiteButton.innerHTML =
            'Create website <span aria-hidden="true">→</span>';
          createWebsiteCard.classList.remove("website-created");
          createdWebsiteResult.hidden = true;
        }
        clearCreatedSiteState();
        deleteWebsiteButton.disabled = false;
        deleteWebsiteButton.textContent = "Delete website";
      },
    });
    deleteWebsiteButton.textContent = "Enter OTP";
  } catch (error) {
    deleteStatus.textContent = error.message;
    deleteStatus.className = "home-panel-status error";
    deleteWebsiteButton.disabled = false;
    deleteWebsiteButton.textContent = "Delete website";
  }
});

backToHomeButton.addEventListener("click", requestCloseWizardModal);

async function collectConfiguration() {
  const fieldValue = (name) => form.elements.namedItem(name)?.value || "";
  const logoField = form.elements.namedItem("logo");
  const logoFile = logoField?.files?.[0];

  const logo =
    logoFile instanceof File && logoFile.size > 0
      ? await readImage(logoFile)
      : importedLogo;
  const gallery = importedGallery;
  const backgroundImage = importedBackgroundImage;
  const services = await collectServices();
  const about = fieldValue("about");
  const reviews = collectReviews();
  const contactAccessKey = fieldValue("contactAccessKey");
  const email =
    websiteOperation === "modify" ? lockedWebsiteEmail : fieldValue("email");
  const phone = fieldValue("phone");
  const address = fieldValue("address");
  const appointmentUrl = fieldValue("appointmentUrl");
  const showCall = form.elements.namedItem("showCall")?.checked === true;
  const showEmail = form.elements.namedItem("showEmail")?.checked === true;

  return {
    companyName: fieldValue("companyName"),
    template: fieldValue("template"),
    mode: fieldValue("designMode") || "advanced",
    mood: fieldValue("designMode") === "manual" ? "" : fieldValue("mood"),
    yearStarted: fieldValue("yearStarted"),
    tagline: fieldValue("tagline"),
    description: fieldValue("description"),
    brandColor: fieldValue("brandColor"),
    secondaryColor: fieldValue("secondaryColor"),
    headerTextColor: "light",
    usePageColor: usePageColorField.checked,
    pageColor: pageColorField.value,
    transparentPageColor: transparentPageColorField.checked,
    pageColorOpacity: Number(pageColorOpacityField.value),
    font: fieldValue("font") || "modern",
    about,
    services,
    servicesHeading: "What we offer",
    servicesLayout: "horizontal",
    reviews,
    reviewFormEndpoint: web3FormsEndpoint,
    reviewAccessKey: contactAccessKey,
    formEndpoint: web3FormsEndpoint,
    contactAccessKey,
    email,
    phone,
    showCall,
    showEmail,
    address,
    instagram: fieldValue("instagram"),
    facebook: fieldValue("facebook"),
    linkedin: fieldValue("linkedin"),
    twitter: fieldValue("twitter"),
    youtube: fieldValue("youtube"),
    applePodcast: fieldValue("applePodcast"),
    spotify: fieldValue("spotify"),
    appointmentUrl,
    sections: {
      about: Boolean(about),
      services: services.length > 0,
      gallery: gallery.length > 0,
      reviews: reviews.length > 0 || Boolean(contactAccessKey),
      contact: Boolean(
        contactAccessKey || email || phone || address || showCall || showEmail,
      ),
      appointment: Boolean(appointmentUrl),
    },
    logo,
    gallery,
    backgroundImage,
  };
}

async function renderPreview() {
  previewButton.disabled = true;
  setStatus("Building preview...");
  // A stale error from a previous create/modify attempt (e.g. "Email
  // already used") would otherwise keep showing under the preview even
  // after the person fixes the field and previews again - clear it here
  // since a fresh preview means they're starting a new attempt.
  setDataDeliveryStatus("");
  try {
    const configuration = await collectConfiguration();
    const previewData = createPortableData(configuration, true);
    await new Promise((resolve, reject) => {
      const timeout = window.setTimeout(() => {
        window.removeEventListener("message", handlePreviewMessage);
        reject(new Error("The website preview took too long to load."));
      }, 15000);
      const handlePreviewMessage = (event) => {
        if (
          event.origin !== window.location.origin ||
          event.source !== previewFrame.contentWindow ||
          !["website-preview-ready", "website-preview-error"].includes(
            event.data?.type,
          )
        ) {
          return;
        }
        window.clearTimeout(timeout);
        window.removeEventListener("message", handlePreviewMessage);
        if (event.data.type === "website-preview-error") {
          reject(new Error(event.data.message || "The preview could not render."));
          return;
        }
        resolve();
      };
      window.addEventListener("message", handlePreviewMessage);
      previewFrame.addEventListener(
        "load",
        () => {
          previewFrame.contentWindow.postMessage(
            { type: "website-preview-data", data: previewData },
            window.location.origin,
          );
        },
        { once: true },
      );
      previewFrame.src = `preview/index.html?time=${Date.now()}`;
    });

    previewFrameShell.hidden = false;
    previewPlaceholder.hidden = true;
    finalGeneration.hidden = false;
    setStatus("Website preview updated.", "success");
    previewSection.scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (error) {
    setStatus(error.message, "error");
  } finally {
    previewButton.disabled = isOpenedDirectly;
  }
}

previewButton.addEventListener("click", renderPreview);

document.querySelectorAll("[data-preview-size]").forEach((button) => {
  button.addEventListener("click", () => {
    const mobile = button.dataset.previewSize === "mobile";
    previewFrameShell.classList.toggle("mobile", mobile);
    document.querySelectorAll("[data-preview-size]").forEach((item) => {
      item.classList.toggle("active", item === button);
    });
  });
});

form.addEventListener("submit", (event) => event.preventDefault());

checkServer();

// Restore the "your website is ready" banner on a fresh page load, in
// case the person just came back from Manage Plan (or anywhere else)
// rather than just having created/modified a site in this same page load.
restoreCreatedSiteState();
