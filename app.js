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
const headerHomeLogo = document.querySelector("#header-home-logo");
const builderContactForm = document.querySelector("#builder-contact-form");
const contactUsStatus = document.querySelector("#contact-us-status");
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
const contactUsButton = builderContactForm.querySelector(
  'button[type="submit"]',
);
const maxImageSizeMb = 2;
const maxImageSize = maxImageSizeMb * 1024 * 1024;
const maxSourceImageSizeMb = 20;
const maxSourceImageSize = maxSourceImageSizeMb * 1024 * 1024;
const maxImageDimension = 2560;
const maxGalleryImages = 24;
const expectedServerVersion = Number(builderConfig.version);
const web3FormsEndpoint = "https://api.web3forms.com/submit";
const websiteGenerationEndpoint =
  "https://gudi-space-workers.hellogudispace.workers.dev/api/generate";
const otpGenerationEndpoint =
  "https://gudi-space-workers.hellogudispace.workers.dev/api/generateOtp";
const publishedWebsiteRepository =
  "https://raw.githubusercontent.com/logeshgopal0712/cloudflareTest";
const publishedWebsiteBranchesEndpoint =
  "https://api.github.com/repos/logeshgopal0712/cloudflareTest/branches?per_page=100";
const builderContactEndpoint = "";
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
}

function showHomeScreen() {
  builderWorkspace.hidden = true;
  homeScreen.hidden = false;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function showBuilderWorkspace() {
  homeScreen.hidden = true;
  builderWorkspace.hidden = false;
  showWizardStep(0);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

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

function collectStoredMedia(data) {
  const backgroundImage = data.template || {};
  if (backgroundImage.background_image_path) {
    backgroundImage.image_path = backgroundImage.background_image_path;
    backgroundImage.image_src = backgroundImage.background_image_src || "";
  }
  const media = [
    data.company,
    backgroundImage,
    ...(Array.isArray(data.services) ? data.services : []),
    ...(Array.isArray(data.gallery) ? data.gallery : []),
  ];
  return media.filter(
    (image) =>
      image &&
      typeof image === "object" &&
      image.image_path &&
      !image.image_src &&
      !image.image_preview_src,
  );
}

function publishedMediaUrl(branch, imagePath) {
  const safePath = String(imagePath)
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
  return `${publishedWebsiteRepository}/${encodeURIComponent(branch)}/${safePath}`;
}

async function publishedBranchContainsMedia(branch, imagePath) {
  try {
    const response = await fetch(publishedMediaUrl(branch, imagePath), {
      method: "HEAD",
      cache: "no-store",
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function findPublishedWebsiteBranch(email, imagePath, companyName) {
  const cacheKey = `gudispace-published-branch:${email.toLowerCase()}`;
  const cachedBranch = window.localStorage.getItem(cacheKey);
  if (
    cachedBranch &&
    (await publishedBranchContainsMedia(cachedBranch, imagePath))
  ) {
    return cachedBranch;
  }

  const likelyBranch = String(companyName || "")
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "");
  if (
    likelyBranch &&
    (await publishedBranchContainsMedia(likelyBranch, imagePath))
  ) {
    window.localStorage.setItem(cacheKey, likelyBranch);
    return likelyBranch;
  }

  try {
    const response = await fetch(publishedWebsiteBranchesEndpoint, {
      headers: { Accept: "application/vnd.github+json" },
    });
    if (!response.ok) return "";
    const branches = await response.json();
    const branchNames = branches
      .map((branch) => branch?.name)
      .filter((branchName) => branchName && branchName !== likelyBranch);
    const branchMatches = await Promise.all(
      branchNames.map((branchName) =>
        publishedBranchContainsMedia(branchName, imagePath),
      ),
    );
    const matchingBranch = branchNames[branchMatches.indexOf(true)] || "";
    if (matchingBranch) {
      window.localStorage.setItem(cacheKey, matchingBranch);
      return matchingBranch;
    }
  } catch (error) {
    console.warn("Published image lookup failed.", error);
  }
  return "";
}

async function resolvePublishedMediaSources(data, email) {
  const media = collectStoredMedia(data);
  if (!media.length) return;
  const branch = await findPublishedWebsiteBranch(
    email,
    media[0].image_path,
    data.company?.companyName,
  );
  if (!branch) return;
  media.forEach((image) => {
    image.image_preview_src = publishedMediaUrl(branch, image.image_path);
  });
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

function setWebsiteOperation(operation, email = "") {
  websiteOperation = operation;
  lockedWebsiteEmail = operation === "modify" ? email.trim() : "";
  contactEmailField.readOnly = operation === "modify";
  modifyEmailMessage.hidden = operation !== "modify";
  createWebsiteButton.textContent =
    operation === "modify"
      ? "Modify website"
      : "Create website";
}

function showPublishedWebsite(previewUrl, payload) {
  const wasModified = websiteOperation === "modify";
  dataDeliveryStatus.replaceChildren();
  dataDeliveryStatus.className = "success";
  createdWebsiteLink.href = previewUrl;
  publishedWebsiteLabel.textContent = wasModified
    ? builderTaglines.modifiedLabel
    : builderTaglines.createdLabel;
  createdWebsiteResult.hidden = false;

  startCreateWebsiteButton.disabled = true;
  startCreateWebsiteButton.textContent = wasModified
    ? builderTaglines.modifiedLabel
    : builderTaglines.createdLabel;
  createWebsiteCard.classList.add("website-created");

  manageWebsiteTitle.textContent = "Edit website";
  manageWebsiteDescription.textContent =
    "Update your website using the same form.";
  showManageWebsiteButton.innerHTML =
    'Edit website <span aria-hidden="true">→</span>';
  manageEmail.value = payload.data?.contact?.email || "";

  showHomeScreen();
}

async function publishWebsite(config, otp) {
  const payload = createDataDeliveryPayload(config, otp);
  const action = websiteOperation === "modify" ? "modify" : "create";
  const response = await fetch(websiteGenerationEndpoint, {
    method: websiteOperation === "modify" ? "PUT" : "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const responseData = await readGenerationApiResponse(response);

  if (
    typeof responseData.previewUrl === "string" &&
    /^https?:\/\//i.test(responseData.previewUrl)
  ) {
    showPublishedWebsite(responseData.previewUrl, payload);
    return;
  }

  console.error(`Generation API returned invalid ${action} data.`, responseData);
  throw new Error("The server returned an invalid response.");
}

createWebsiteButton.addEventListener("click", async () => {
  if (!validateEntireForm()) return;

  createWebsiteButton.disabled = true;
  setDataDeliveryStatus("Sending OTP...");
  try {
    const config = await collectConfiguration();
    const email =
      websiteOperation === "modify" ? lockedWebsiteEmail : config.email;
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
        await runWithLoader(
          websiteOperation === "modify"
            ? "Modifying website..."
            : "Creating website...",
          () => publishWebsite(config, otp),
        );
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
  updateWizardStepLinks(visibleSteps);

  if (shouldScroll) {
    activeStep.scrollIntoView({ behavior: "smooth", block: "start" });
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

previousPageButton.addEventListener("click", () => {
  showWizardStep(currentWizardStep - 1, true);
});

nextPageButton.addEventListener("click", () => {
  if (validateCurrentWizardStep()) {
    showWizardStep(currentWizardStep + 1, true);
  }
});

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
  try {
    importedBackgroundImage = await runWithLoader(
      "Loading image...",
      () => readImage(file),
    );
    backgroundImageField.value = "";
    renderBackgroundImagePreview();
  } catch (error) {
    backgroundImageField.value = "";
    backgroundImageField.setCustomValidity(error.message);
    backgroundImageField.reportValidity();
    backgroundImageField.setCustomValidity("");
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

function createImageThumbnail(dataUrl) {
  return new Promise((resolve) => {
    const image = new Image();
    image.addEventListener("load", () => {
      const maxSize = 240;
      const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
      const width = Math.max(1, Math.round(image.width * scale));
      const height = Math.max(1, Math.round(image.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      canvas.getContext("2d").drawImage(image, 0, 0, width, height);
      resolve(canvas.toDataURL("image/webp", 0.78));
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
    if (!context) throw new Error(`Could not process ${file.name}.`);
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

  throw new Error(
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
    throw new Error(
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
    throw new Error(
      `${file.name} could not be converted. Try exporting it as JPG and upload it again.`,
    );
  }

  const blob = Array.isArray(converted) ? converted[0] : converted;
  if (!(blob instanceof Blob)) {
    throw new Error(`${file.name} did not produce a usable converted image.`);
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

async function readImage(file) {
  const supportedExtension = supportedImagePattern.test(file.name);
  const heicImage = isHeicImage(file);
  if (
    !supportedImageTypes.has(file.type) &&
    !heicImage &&
    !supportedExtension
  ) {
    throw new Error(
      `${file.name} is not supported. Choose a PNG, JPG, WebP, GIF, HEIC, or HEIF image.`,
    );
  }

  if (file.size > maxSourceImageSize) {
    throw new Error(
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
    thumbnail: await createImageThumbnail(compressed.dataUrl),
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

  try {
    const logo = await runWithLoader("Loading image...", () => readImage(file));
    importedLogo = logo;
    logoInput.value = "";
    renderLogoPreview();
  } catch (error) {
    clearLogo();
    logoInput.setCustomValidity(error.message);
    logoInput.reportValidity();
    logoInput.setCustomValidity("");
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

galleryInput.addEventListener("change", async () => {
  const files = [...galleryInput.files];
  if (!files.length) return;
  galleryValidationError.hidden = true;
  galleryValidationError.textContent = "";

  if (importedGallery.length + files.length > maxGalleryImages) {
    galleryInput.value = "";
    galleryValidationError.textContent =
      `You can add up to ${maxGalleryImages} gallery images. You selected ${files.length}, with ${importedGallery.length} already added.`;
    galleryValidationError.hidden = false;
    return;
  }

  try {
    const images = await runWithLoader(
      "Loading image...",
      () => Promise.all(files.map(readImage)),
    );
    importedGallery.push(...images);
    galleryInput.value = "";
    renderGalleryPreviews();
  } catch (error) {
    galleryInput.value = "";
    galleryValidationError.textContent = error.message;
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
  setFormValue(
    "brandColor",
    template.primaryColor || "#c79245",
  );
  setFormValue(
    "secondaryColor",
    template.secondaryColor || "#172238",
  );
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
        .slice(0, maxGalleryImages)
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
  managePanel.hidden = false;
  manageEmail.focus();
  managePanel.scrollIntoView({ behavior: "smooth", block: "center" });
});

showDeleteWebsiteButton.addEventListener("click", () => {
  deletePanel.hidden = false;
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
    await resolvePublishedMediaSources(responseData.data, email);
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
  if (
    !window.confirm(
      `Delete the website for ${email}? This action cannot be undone.`,
    )
  ) {
    return;
  }

  const requestUrl = new URL(websiteGenerationEndpoint);
  requestUrl.searchParams.set("email", email);
  deleteWebsiteButton.disabled = true;
  deleteWebsiteButton.textContent = "Sending OTP...";
  try {
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
        await runWithLoader("Deleting website...", async () => {
          const response = await fetch(requestUrl, {
            method: "DELETE",
            headers: { Accept: "application/json" },
          });
          await readGenerationApiResponse(response);
        });
        deleteStatus.textContent = "Website deleted successfully.";
        deleteStatus.className = "home-panel-status success";
        deleteEmail.value = "";
        if (lockedWebsiteEmail.toLowerCase() === email.toLowerCase()) {
          resetBuilderForm();
          startCreateWebsiteButton.disabled = false;
          startCreateWebsiteButton.innerHTML =
            'Create website <span aria-hidden="true">→</span>';
          createWebsiteCard.classList.remove("website-created");
          createdWebsiteResult.hidden = true;
        }
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

backToHomeButton.addEventListener("click", showHomeScreen);
headerHomeLogo.addEventListener("click", showHomeScreen);

builderContactForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!builderContactForm.reportValidity()) return;
  if (!builderContactEndpoint) {
    contactUsStatus.textContent =
      "Contact form delivery will be available after the form endpoint is connected.";
    contactUsStatus.className = "home-panel-status";
    return;
  }

  contactUsStatus.textContent = "Sending message...";
  contactUsButton.disabled = true;
  try {
    await runWithLoader("Sending message...", async () => {
      const response = await fetch(builderContactEndpoint, {
        method: "POST",
        body: new FormData(builderContactForm),
      });
      if (!response.ok) throw new Error(`Form returned ${response.status}.`);
    });
    builderContactForm.reset();
    contactUsStatus.textContent = "Message sent successfully.";
    contactUsStatus.className = "home-panel-status success";
  } catch (error) {
    contactUsStatus.textContent = `Could not send message: ${error.message}`;
    contactUsStatus.className = "home-panel-status error";
  } finally {
    contactUsButton.disabled = false;
  }
});

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
