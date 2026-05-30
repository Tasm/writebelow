(() => {
  "use strict";

  // =========================
  // OPTIONS PANEL
  // =========================
  const controlPanel = document.querySelector(".control-panel");
  const optionsToggleBtn = document.getElementById("optionsToggleBtn");
  const optionsPanelBody = document.getElementById("optionsPanelBody");

  // =========================
  // MAIN ELEMENTS
  // =========================
  const photoPreviewWrap = document.getElementById("photoPreviewWrap");
  const photoPreview = document.getElementById("photoPreview");

  const textInput = document.getElementById("textInput");

  const fontSizeInput = document.getElementById("fontSizeInput");
  const fontStyleInput = document.getElementById("fontStyleInput");

  const fontColorInput = document.getElementById("fontColorInput");
  const fontColorTextInput = document.getElementById("fontColorTextInput");

  const alignButtons = document.querySelectorAll(".align-btn");

  const imageWidthInput = document.getElementById("imageWidthInput");
  const imageHeightInput = document.getElementById("imageHeightInput");

  const keepRatioInput = document.getElementById("keepRatioInput");

  // =========================
  // PHOTO BUTTONS
  // =========================
  const selectPhotoBtn = document.getElementById("selectPhotoBtn");
  const takePhotoBtn = document.getElementById("takePhotoBtn");

  const selectPhotoInput = document.getElementById("selectPhotoInput");
  const takePhotoInput = document.getElementById("takePhotoInput");

  // =========================
  // RESULT AREA
  // =========================
  const createBtn = document.getElementById("createBtn");

  const resultSection = document.getElementById("resultSection");
  const resultCanvas = document.getElementById("resultCanvas");
  const downloadBtn = document.getElementById("downloadBtn");

  const ctx = resultCanvas.getContext("2d");

  // =========================
  // STATE
  // =========================
  let selectedImage = null;
  let selectedFileName = "write-below-image.png";

  let selectedTextAlign = "left";

  let originalImageWidth = 0;
  let originalImageHeight = 0;

  let isUpdatingSizeInputs = false;

  // =========================
  // CONSTANTS
  // =========================
  const DEFAULT_FONT_SIZE = 35;
  const DEFAULT_FONT_COLOR = "#000000";

  const SETTINGS_KEY = "writeBelowOptions";

  const TEXT_PADDING_X = 32;
  const TEXT_PADDING_Y = 26;

  // =========================
  // OPTIONS PANEL
  // =========================
  function setOptionsCollapsed(isCollapsed) {
    controlPanel?.classList.toggle("is-collapsed", isCollapsed);

    optionsToggleBtn?.setAttribute(
      "aria-expanded",
      String(!isCollapsed)
    );

    const icon = optionsToggleBtn?.querySelector(
      ".options-toggle-icon"
    );

    if (icon) {
      icon.textContent = isCollapsed ? "+" : "−";
    }

    if (optionsPanelBody) {
      optionsPanelBody.style.display = isCollapsed
        ? "none"
        : "block";
    }
  }

  // =========================
  // FONT HELPERS
  // =========================
  function ptToPx(pt) {
    return Math.round(pt * 1.3333);
  }

  function getUserFontSize() {
    const size = Number(fontSizeInput?.value);

    return Number.isFinite(size) && size > 0
      ? size
      : DEFAULT_FONT_SIZE;
  }

  function getCanvasFontSize() {
    return ptToPx(getUserFontSize());
  }

  function getFontFamily() {
    return (
      fontStyleInput?.value ||
      "Arial, Helvetica, sans-serif"
    );
  }

  function normalizeHexColor(value) {
    const color = String(value || "").trim();

    if (/^#[0-9a-fA-F]{6}$/.test(color)) {
      return color.toUpperCase();
    }

    if (/^[0-9a-fA-F]{6}$/.test(color)) {
      return `#${color}`.toUpperCase();
    }

    return DEFAULT_FONT_COLOR;
  }

  function getFontColor() {
    return normalizeHexColor(
      fontColorInput?.value ||
      fontColorTextInput?.value ||
      DEFAULT_FONT_COLOR
    );
  }

  function updateTextPreviewFont() {
	  return;
    if (!textInput) return;

    textInput.style.fontSize =
      `${getCanvasFontSize()}px`;

    textInput.style.fontFamily =
      getFontFamily();

    textInput.style.color =
      getFontColor();

    textInput.style.textAlign =
      selectedTextAlign;
  }

  // =========================
  // SETTINGS
  // =========================
  function saveOptions() {
    const options = {
      fontSize: getUserFontSize(),
      fontStyle: getFontFamily(),
      fontColor: getFontColor(),
      textAlign: selectedTextAlign,
    };

    try {
      localStorage.setItem(
        SETTINGS_KEY,
        JSON.stringify(options)
      );
    } catch (error) {}
  }

  function setSelectedTextAlign(align) {
    selectedTextAlign =
      ["left", "center", "right"].includes(align)
        ? align
        : "center";

    alignButtons.forEach((button) => {
      button.classList.toggle(
        "active",
        button.dataset.align === selectedTextAlign
      );
    });

    updateTextPreviewFont();
  }

  function loadOptions() {
    let options = null;

    try {
      options = JSON.parse(
        localStorage.getItem(SETTINGS_KEY) || "null"
      );
    } catch (error) {
      options = null;
    }

    if (fontSizeInput) {
      fontSizeInput.value =
        Number(options?.fontSize) ||
        DEFAULT_FONT_SIZE;
    }

    if (fontStyleInput && options?.fontStyle) {
      const exists = Array.from(
        fontStyleInput.options
      ).some((option) => {
        return option.value === options.fontStyle;
      });

      if (exists) {
        fontStyleInput.value =
          options.fontStyle;
      }
    }

    const savedColor = normalizeHexColor(
      options?.fontColor || DEFAULT_FONT_COLOR
    );

    if (fontColorInput) {
      fontColorInput.value = savedColor;
    }

    if (fontColorTextInput) {
      fontColorTextInput.value = savedColor;
    }

    setSelectedTextAlign(
      options?.textAlign || "left"
    );

    updateTextPreviewFont();
  }

  // =========================
  // IMAGE SIZE
  // =========================
  function getFinalImageWidth() {
    const width = Number(imageWidthInput?.value);

    return Number.isFinite(width) && width >= 50
      ? Math.round(width)
      : originalImageWidth;
  }

  function getFinalImageHeight() {
    const height = Number(imageHeightInput?.value);

    return Number.isFinite(height) && height >= 50
      ? Math.round(height)
      : originalImageHeight;
  }

  function populateImageSizeInputs() {
    if (!selectedImage) return;

    isUpdatingSizeInputs = true;

    imageWidthInput.value =
      selectedImage.naturalWidth;

    imageHeightInput.value =
      selectedImage.naturalHeight;

    isUpdatingSizeInputs = false;
  }

  function updateHeightFromWidth() {
    if (
      !selectedImage ||
      !keepRatioInput.checked ||
      isUpdatingSizeInputs
    ) {
      return;
    }

    const width = Number(imageWidthInput.value);

    if (
      !Number.isFinite(width) ||
      width < 50
    ) {
      return;
    }

    isUpdatingSizeInputs = true;

    imageHeightInput.value = Math.round(
      width * (
        originalImageHeight /
        originalImageWidth
      )
    );

    isUpdatingSizeInputs = false;
  }

  function updateWidthFromHeight() {
    if (
      !selectedImage ||
      !keepRatioInput.checked ||
      isUpdatingSizeInputs
    ) {
      return;
    }

    const height = Number(imageHeightInput.value);

    if (
      !Number.isFinite(height) ||
      height < 50
    ) {
      return;
    }

    isUpdatingSizeInputs = true;

    imageWidthInput.value = Math.round(
      height * (
        originalImageWidth /
        originalImageHeight
      )
    );

    isUpdatingSizeInputs = false;
  }

  // =========================
  // TEXT HELPERS
  // =========================
  function getImageLineHeight() {
    return Math.round(
      getCanvasFontSize() * 1.35
    );
  }

  function hasText() {
    return textInput.value.trim().length > 0;
  }

  function updateCreateButton() {
    createBtn.disabled =
      !(selectedImage && hasText());
  }

  function hideResult() {
    resultSection.hidden = true;
  }

  function resizeTextBoxToImage() {
    if (!selectedImage) {
      textInput.style.maxWidth = "";
      return;
    }

    textInput.style.maxWidth =
      `${getFinalImageWidth()}px`;
  }

  function wrapText(text, maxWidth) {
    ctx.font =
      `${getCanvasFontSize()}px ${getFontFamily()}`;

    const paragraphs = text.split("\n");

    const lines = [];

    paragraphs.forEach((paragraph) => {

      if (paragraph.trim() === "") {
        lines.push("");
        return;
      }

      const words = paragraph
        .split(/\s+/)
        .filter(Boolean);

      let line = "";

      words.forEach((word) => {

        const testLine = line
          ? `${line} ${word}`
          : word;

        const width =
          ctx.measureText(testLine).width;

        if (width > maxWidth && line) {
          lines.push(line);
          line = word;
        } else {
          line = testLine;
        }
      });

      if (line) {
        lines.push(line);
      }
    });

    return lines;
  }

  function getTextXPosition(canvasWidth) {
    if (selectedTextAlign === "left") {
      return TEXT_PADDING_X;
    }

    if (selectedTextAlign === "right") {
      return canvasWidth - TEXT_PADDING_X;
    }

    return canvasWidth / 2;
  }

  // =========================
  // LOAD IMAGE
  // =========================
  function loadImageFromFile(file) {
    if (
      !file ||
      !file.type.startsWith("image/")
    ) {
      return;
    }

    selectedFileName = file.name
      ? file.name.replace(/\.[^.]+$/, "") +
        "-with-text.png"
      : "write-below-image.png";

    const objectUrl =
      URL.createObjectURL(file);

    const image = new Image();

    image.onload = () => {

      selectedImage = image;

      originalImageWidth =
        image.naturalWidth;

      originalImageHeight =
        image.naturalHeight;

      photoPreview.src = objectUrl;

      photoPreviewWrap.classList.remove(
        "is-empty"
      );

      populateImageSizeInputs();

      resizeTextBoxToImage();

      updateCreateButton();

      hideResult();
    };

    image.onerror = () => {

      URL.revokeObjectURL(objectUrl);

      selectedImage = null;

      originalImageWidth = 0;
      originalImageHeight = 0;

      photoPreview.removeAttribute("src");

      photoPreviewWrap.classList.add(
        "is-empty"
      );

      imageWidthInput.value = "";
      imageHeightInput.value = "";

      updateCreateButton();

      hideResult();
    };

    image.src = objectUrl;
  }

  // =========================
  // CREATE IMAGE
  // =========================
  function createImage() {

    if (!selectedImage || !hasText()) {
      return;
    }

    const finalImageWidth =
      getFinalImageWidth();

    const finalImageHeight =
      getFinalImageHeight();

    const maxTextWidth = Math.max(
      50,
      finalImageWidth -
      TEXT_PADDING_X * 2
    );

    ctx.font =
      `${getCanvasFontSize()}px ${getFontFamily()}`;

    const lines = wrapText(
      textInput.value,
      maxTextWidth
    );

    const lineHeight =
      getImageLineHeight();

    const textHeight =
      lines.length * lineHeight +
      TEXT_PADDING_Y * 2;

    // FINAL IMAGE SIZE
    resultCanvas.width =
      finalImageWidth;

    resultCanvas.height =
      finalImageHeight + textHeight;

    ctx.clearRect(
      0,
      0,
      resultCanvas.width,
      resultCanvas.height
    );

    // ORIGINAL IMAGE
    ctx.drawImage(
      selectedImage,
      0,
      0,
      finalImageWidth,
      finalImageHeight
    );

    // TEXT AREA BELOW IMAGE
    ctx.fillStyle = "#ffffff";

    ctx.fillRect(
      0,
      finalImageHeight,
      finalImageWidth,
      textHeight
    );

    ctx.font =
      `${getCanvasFontSize()}px ${getFontFamily()}`;

    ctx.fillStyle =
      getFontColor();

    ctx.textAlign =
      selectedTextAlign;

    ctx.textBaseline = "top";

    const x =
      getTextXPosition(finalImageWidth);

    let y =
      finalImageHeight +
      TEXT_PADDING_Y;

    lines.forEach((line) => {

      if (line) {
        ctx.fillText(line, x, y);
      }

      y += lineHeight;
    });

    resultSection.hidden = false;

    resultSection.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  // =========================
  // EVENTS
  // =========================
  optionsToggleBtn?.addEventListener(
    "click",
    () => {
      setOptionsCollapsed(
        !controlPanel?.classList.contains(
          "is-collapsed"
        )
      );
    }
  );

  selectPhotoBtn?.addEventListener(
    "click",
    () => {
      selectPhotoInput.click();
    }
  );

  takePhotoBtn?.addEventListener(
    "click",
    () => {
      takePhotoInput.click();
    }
  );

  selectPhotoInput?.addEventListener(
    "change",
    (event) => {
      loadImageFromFile(
        event.target.files?.[0]
      );

      event.target.value = "";
    }
  );

  takePhotoInput?.addEventListener(
    "change",
    (event) => {
      loadImageFromFile(
        event.target.files?.[0]
      );

      event.target.value = "";
    }
  );

  textInput?.addEventListener(
    "input",
    () => {
      updateCreateButton();
      hideResult();
    }
  );

fontSizeInput?.addEventListener("input", () => {
  saveOptions();
  hideResult();
});

  fontStyleInput?.addEventListener(
    "change",
    () => {

      saveOptions();
      hideResult();
    }
  );

  fontColorInput?.addEventListener(
    "input",
    () => {

      const color = getFontColor();

      fontColorInput.value = color;

      if (fontColorTextInput) {
        fontColorTextInput.value = color;
      }

      updateTextPreviewFont();

      saveOptions();

      hideResult();
    }
  );

  fontColorTextInput?.addEventListener(
    "input",
    () => {

      const rawColor =
        String(
          fontColorTextInput.value || ""
        ).trim();

      if (/^#?[0-9a-fA-F]{6}$/.test(rawColor)) {

        const color =
          normalizeHexColor(rawColor);

        fontColorTextInput.value =
          color;

        if (fontColorInput) {
          fontColorInput.value = color;
        }

        updateTextPreviewFont();

        saveOptions();

        hideResult();
      }
    }
  );

  alignButtons.forEach((button) => {

    button.addEventListener(
      "click",
      () => {

        setSelectedTextAlign(
          button.dataset.align || "center"
        );

        saveOptions();

        hideResult();
      }
    );
  });

  imageWidthInput?.addEventListener(
    "input",
    () => {
      updateHeightFromWidth();
      resizeTextBoxToImage();
      hideResult();
    }
  );

  imageHeightInput?.addEventListener(
    "input",
    () => {
      updateWidthFromHeight();
      hideResult();
    }
  );

  keepRatioInput?.addEventListener(
    "change",
    () => {

      if (keepRatioInput.checked) {
        updateHeightFromWidth();
      }

      hideResult();
    }
  );

  createBtn?.addEventListener(
    "click",
    createImage
  );

  downloadBtn?.addEventListener(
    "click",
    () => {

      const link =
        document.createElement("a");

      link.download =
        selectedFileName;

      link.href =
        resultCanvas.toDataURL("image/png");

      link.click();
    }
  );

  // =========================
  // INIT
  // =========================
  loadOptions();

  setOptionsCollapsed(true);

  updateCreateButton();
})();