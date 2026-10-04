const display = document.getElementById("display");
const expression = document.getElementById("expression");
const controls = document.querySelector(".controls");
const historyDialog = document.getElementById("history-dialog");
const historyList = document.getElementById("history-list");
const historyStatus = document.getElementById("history-status");
const scientificPanel = document.getElementById("scientific-keypad");
const scientificToggle = document.getElementById("scientific-toggle");
const angleToggle = document.getElementById("angle-toggle");
const historyOpen = document.getElementById("history-open");
const historyClose = document.getElementById("history-close");
const historyClear = document.getElementById("history-clear");

const HISTORY_STORAGE_KEY = "kalkulator-history-v1";
const MAX_HISTORY_ITEMS = 100;

let currentValue = "0";
let storedValue = null;
let pendingOperator = null;
let shouldResetOnDigit = false;
let hasError = false;
let errorMessage = "Operasi tidak terdefinisi";
let angleMode = "DEG";
let expressionLabel = "";
let calculationHistory = loadHistory();

const operatorSymbols = {
  "+": "+",
  "-": "−",
  "*": "×",
  "/": "÷",
  "^": "^"
};

function normalizeNumber(value) {
  if (!Number.isFinite(value)) {
    return null;
  }

  const rounded = Number(value.toPrecision(12));
  return Object.is(rounded, -0) ? "0" : rounded.toString();
}

function loadHistory() {
  try {
    const savedHistory = localStorage.getItem(HISTORY_STORAGE_KEY);

    if (!savedHistory) {
      return [];
    }

    const parsedHistory = JSON.parse(savedHistory);

    if (!Array.isArray(parsedHistory)) {
      console.error("Format riwayat kalkulator tidak valid.");
      return [];
    }

    return parsedHistory
      .filter((entry) =>
        entry &&
        typeof entry.id === "string" &&
        typeof entry.expression === "string" &&
        typeof entry.result === "string" &&
        Number.isFinite(Number(entry.result)) &&
        typeof entry.timestamp === "string" &&
        Number.isFinite(Date.parse(entry.timestamp))
      )
      .slice(0, MAX_HISTORY_ITEMS);
  } catch (error) {
    console.error("Riwayat kalkulator gagal dibaca:", error);
    return [];
  }
}

function setHistoryStatus(message) {
  if (historyStatus) {
    historyStatus.textContent = message;
  }
}

function saveHistory() {
  try {
    localStorage.setItem(
      HISTORY_STORAGE_KEY,
      JSON.stringify(calculationHistory)
    );
    return true;
  } catch (error) {
    console.error("Riwayat kalkulator gagal disimpan:", error);
    setHistoryStatus("Riwayat tidak dapat disimpan di perangkat ini.");
    return false;
  }
}

function addHistoryEntry(calculationExpression, result) {
  calculationHistory.unshift({
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    expression: calculationExpression,
    result,
    timestamp: new Date().toISOString()
  });

  calculationHistory = calculationHistory.slice(0, MAX_HISTORY_ITEMS);
  saveHistory();
}

function render() {
  if (!display || !expression) {
    console.error("Layar kalkulator tidak ditemukan.");
    return;
  }

  display.textContent = hasError ? "Error" : currentValue;

  if (hasError) {
    expression.textContent = errorMessage;
  } else if (pendingOperator && storedValue !== null) {
    expression.textContent =
      `${normalizeNumber(storedValue)} ${operatorSymbols[pendingOperator]}`;
  } else {
    expression.textContent = expressionLabel;
  }
}

function resetAfterError() {
  if (!hasError) {
    return;
  }

  currentValue = "0";
  storedValue = null;
  pendingOperator = null;
  shouldResetOnDigit = false;
  hasError = false;
  expressionLabel = "";
}

function showError(message) {
  currentValue = "0";
  storedValue = null;
  pendingOperator = null;
  shouldResetOnDigit = true;
  hasError = true;
  errorMessage = message;
  expressionLabel = "";
  render();
}

function enterDigit(digit) {
  resetAfterError();

  if (shouldResetOnDigit) {
    currentValue = digit;
    shouldResetOnDigit = false;
    expressionLabel = "";
  } else if (currentValue === "0") {
    currentValue = digit;
  } else if (currentValue === "-0") {
    currentValue = `-${digit}`;
  } else if (currentValue.replace("-", "").length < 14) {
    currentValue += digit;
  }

  render();
}

function enterDecimal() {
  resetAfterError();

  if (shouldResetOnDigit) {
    currentValue = "0.";
    shouldResetOnDigit = false;
    expressionLabel = "";
  } else if (!currentValue.includes(".")) {
    currentValue += ".";
  }

  render();
}

function calculate(a, b, operator) {
  switch (operator) {
    case "+":
      return a + b;
    case "-":
      return a - b;
    case "*":
      return a * b;
    case "/":
      return b === 0 ? null : a / b;
    case "^":
      return a ** b;
    default:
      return null;
  }
}

function chooseOperator(operator) {
  if (hasError) {
    return;
  }

  if (pendingOperator && !shouldResetOnDigit && storedValue !== null) {
    const result = calculate(
      storedValue,
      Number(currentValue),
      pendingOperator
    );
    const normalized = normalizeNumber(result);

    if (normalized === null) {
      showError("Operasi tidak terdefinisi");
      return;
    }

    currentValue = normalized;
  }

  storedValue = Number(currentValue);
  pendingOperator = operator;
  shouldResetOnDigit = true;
  expressionLabel = "";
  render();
}

function calculateResult() {
  if (hasError || !pendingOperator || storedValue === null) {
    return;
  }

  const firstValue = storedValue;
  const secondValue = Number(currentValue);
  const operator = pendingOperator;
  const result = calculate(firstValue, secondValue, operator);
  const normalized = normalizeNumber(result);

  if (normalized === null) {
    showError(
      operator === "/" && secondValue === 0
        ? "Tidak dapat membagi dengan nol"
        : "Operasi tidak terdefinisi"
    );
    return;
  }

  const calculationExpression =
    `${normalizeNumber(firstValue)} ${operatorSymbols[operator]} ` +
    `${normalizeNumber(secondValue)} =`;

  currentValue = normalized;
  storedValue = null;
  pendingOperator = null;
  shouldResetOnDigit = true;
  expressionLabel = calculationExpression;
  render();
  addHistoryEntry(calculationExpression, normalized);
}

function toRadians(value) {
  return angleMode === "DEG" ? value * Math.PI / 180 : value;
}

function applyScientificFunction(functionName) {
  if (hasError) {
    return;
  }

  if (functionName === "pi") {
    resetAfterError();

    if (shouldResetOnDigit) {
      expressionLabel = "";
    }

    currentValue = normalizeNumber(Math.PI);
    shouldResetOnDigit = false;
    render();
    return;
  }

  const value = Number(currentValue);
  let result;
  let label;

  switch (functionName) {
    case "sin":
      result = Math.sin(toRadians(value));
      label = `sin(${currentValue}${angleMode === "DEG" ? "°" : " rad"})`;
      break;

    case "cos":
      result = Math.cos(toRadians(value));
      label = `cos(${currentValue}${angleMode === "DEG" ? "°" : " rad"})`;
      break;

    case "tan": {
      const radians = toRadians(value);

      if (Math.abs(Math.cos(radians)) < 1e-12) {
        showError("Tangen tidak terdefinisi");
        return;
      }

      result = Math.tan(radians);
      label = `tan(${currentValue}${angleMode === "DEG" ? "°" : " rad"})`;
      break;
    }

    case "log":
      if (value <= 0) {
        showError("log hanya berlaku untuk angka > 0");
        return;
      }

      result = Math.log10(value);
      label = `log(${currentValue})`;
      break;

    case "ln":
      if (value <= 0) {
        showError("ln hanya berlaku untuk angka > 0");
        return;
      }

      result = Math.log(value);
      label = `ln(${currentValue})`;
      break;

    case "sqrt":
      if (value < 0) {
        showError("Akar kuadrat tidak berlaku untuk angka negatif");
        return;
      }

      result = Math.sqrt(value);
      label = `√(${currentValue})`;
      break;

    case "square":
      result = value ** 2;
      label = `(${currentValue})²`;
      break;

    case "factorial":
      if (value < 0 || !Number.isInteger(value) || value > 170) {
        showError("Faktorial hanya berlaku untuk bilangan bulat 0–170");
        return;
      }

      result = 1;

      for (let number = 2; number <= value; number += 1) {
        result *= number;
      }

      label = `${currentValue}!`;
      break;

    default:
      return;
  }

  const normalized = normalizeNumber(result);

  if (normalized === null) {
    showError("Hasil di luar jangkauan");
    return;
  }

  const calculationExpression = `${label} =`;

  currentValue = normalized;
  storedValue = null;
  pendingOperator = null;
  shouldResetOnDigit = true;
  expressionLabel = calculationExpression;
  render();
  addHistoryEntry(calculationExpression, normalized);
}

function clearCalculator() {
  currentValue = "0";
  storedValue = null;
  pendingOperator = null;
  shouldResetOnDigit = false;
  hasError = false;
  expressionLabel = "";
  render();
}

function toggleSign() {
  if (hasError) {
    return;
  }

  if (shouldResetOnDigit) {
    currentValue = "0";
    shouldResetOnDigit = false;
    expressionLabel = "";
  }

  if (Number(currentValue) !== 0) {
    currentValue = currentValue.startsWith("-")
      ? currentValue.slice(1)
      : `-${currentValue}`;
  }

  render();
}

function convertToPercent() {
  if (hasError) {
    return;
  }

  const normalized = normalizeNumber(Number(currentValue) / 100);

  if (normalized === null) {
    showError("Operasi tidak terdefinisi");
    return;
  }

  currentValue = normalized;
  shouldResetOnDigit = true;
  render();
}

function deleteLastDigit() {
  if (hasError) {
    clearCalculator();
    return;
  }

  if (shouldResetOnDigit) {
    currentValue = "0";
    shouldResetOnDigit = false;
    expressionLabel = "";
  } else {
    currentValue = currentValue.slice(0, -1);

    if (currentValue === "" || currentValue === "-") {
      currentValue = "0";
    }
  }

  render();
}

function formatHistoryDate(timestamp) {
  return new Date(timestamp).toLocaleString("id-ID", {
    dateStyle: "short",
    timeStyle: "short"
  });
}

function createHistoryButton(label, action, entryId, className = "") {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `history-action ${className}`.trim();
  button.dataset.historyAction = action;
  button.dataset.historyId = entryId;
  button.textContent = label;
  return button;
}

function renderHistory() {
  if (!historyList) {
    console.error("Daftar riwayat tidak ditemukan.");
    setHistoryStatus("Daftar riwayat tidak ditemukan.");
    return;
  }

  historyList.replaceChildren();

  if (calculationHistory.length === 0) {
    const emptyMessage = document.createElement("li");
    emptyMessage.className = "history-empty";
    emptyMessage.textContent = "Belum ada perhitungan.";
    historyList.append(emptyMessage);
    return;
  }

  for (const entry of calculationHistory) {
    const item = document.createElement("li");
    item.className = "history-item";

    const details = document.createElement("div");
    details.className = "history-details";

    const calculation = document.createElement("p");
    calculation.className = "history-expression";
    calculation.textContent = entry.expression;

    const result = document.createElement("p");
    result.className = "history-result";
    result.textContent = entry.result;

    const date = document.createElement("time");
    date.className = "history-date";
    date.dateTime = entry.timestamp;
    date.textContent = formatHistoryDate(entry.timestamp);

    details.append(calculation, result, date);

    const actions = document.createElement("div");
    actions.className = "history-actions";
    actions.append(
      createHistoryButton("Pakai", "use", entry.id),
      createHistoryButton("Salin", "copy", entry.id),
      createHistoryButton(
        "Hapus",
        "delete",
        entry.id,
        "history-action-delete"
      )
    );

    item.append(details, actions);
    historyList.append(item);
  }
}

function findHistoryEntry(entryId) {
  return calculationHistory.find((entry) => entry.id === entryId);
}

async function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const temporaryInput = document.createElement("textarea");
  temporaryInput.value = text;
  temporaryInput.setAttribute("readonly", "");
  temporaryInput.style.position = "fixed";
  temporaryInput.style.opacity = "0";
  document.body.append(temporaryInput);
  temporaryInput.select();

  const copied = document.execCommand("copy");
  temporaryInput.remove();

  if (!copied) {
    throw new Error("Perangkat tidak mengizinkan penyalinan.");
  }
}

async function handleHistoryAction(action, entryId) {
  const entry = findHistoryEntry(entryId);

  if (!entry) {
    setHistoryStatus("Perhitungan tidak ditemukan.");
    return;
  }

  if (action === "copy") {
    try {
      await copyText(entry.result);
      setHistoryStatus(`Hasil ${entry.result} disalin.`);
    } catch (error) {
      console.error("Hasil kalkulator gagal disalin:", error);
      setHistoryStatus("Hasil tidak dapat disalin di perangkat ini.");
    }

    return;
  }

  if (action === "use") {
    currentValue = entry.result;
    storedValue = null;
    pendingOperator = null;
    shouldResetOnDigit = true;
    hasError = false;
    expressionLabel = "";
    render();

    if (historyDialog && historyDialog.open) {
      historyDialog.close();
    }

    return;
  }

  if (action === "delete") {
    calculationHistory = calculationHistory.filter(
      (item) => item.id !== entryId
    );

    saveHistory();
    renderHistory();
    setHistoryStatus("Perhitungan dihapus.");
  }
}

if (controls) {
  controls.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");

    if (!button) {
      return;
    }

    const { action, value } = button.dataset;

    switch (action) {
      case "digit":
        enterDigit(value);
        break;
      case "decimal":
        enterDecimal();
        break;
      case "operator":
        chooseOperator(value);
        break;
      case "equals":
        calculateResult();
        break;
      case "clear":
        clearCalculator();
        break;
      case "sign":
        toggleSign();
        break;
      case "percent":
        convertToPercent();
        break;
      case "scientific":
        applyScientificFunction(value);
        break;
      default:
        break;
case "delete":
  deleteLastDigit();
  break;
    }
  });
} else {
  console.error("Tombol kalkulator tidak ditemukan.");
}

if (scientificToggle && scientificPanel) {
  scientificToggle.addEventListener("click", () => {
    const isExpanded =
      scientificToggle.getAttribute("aria-expanded") === "true";

    scientificToggle.setAttribute("aria-expanded", String(!isExpanded));
    scientificPanel.hidden = isExpanded;
  });
}

if (angleToggle) {
  angleToggle.addEventListener("click", () => {
    angleMode = angleMode === "DEG" ? "RAD" : "DEG";
    angleToggle.textContent = angleMode;
    angleToggle.setAttribute(
      "aria-label",
      `Mode sudut: ${angleMode === "DEG" ? "derajat" : "radian"}`
    );
  });
}

if (historyOpen && historyDialog) {
  historyOpen.addEventListener("click", () => {
    renderHistory();
    setHistoryStatus("");

    if (typeof historyDialog.showModal === "function") {
      historyDialog.showModal();
    } else {
      historyDialog.setAttribute("open", "");
    }
  });
} else {
  console.error("Tombol atau dialog riwayat tidak ditemukan.");
}

if (historyClose && historyDialog) {
  historyClose.addEventListener("click", () => {
    if (typeof historyDialog.close === "function") {
      historyDialog.close();
    } else {
      historyDialog.removeAttribute("open");
    }
  });
}

if (historyClear) {
  historyClear.addEventListener("click", () => {
    if (calculationHistory.length === 0) {
      setHistoryStatus("Riwayat sudah kosong.");
      return;
    }

    if (!window.confirm("Hapus semua riwayat perhitungan?")) {
      return;
    }

    calculationHistory = [];
    saveHistory();
    renderHistory();
    setHistoryStatus("Semua riwayat dihapus.");
  });
}

if (historyList) {
  historyList.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-history-action]");

    if (button) {
      handleHistoryAction(
        button.dataset.historyAction,
        button.dataset.historyId
      );
    }
  });
}

document.addEventListener("keydown", (event) => {
  if (historyDialog && historyDialog.open) {
    return;
  }

  const target = event.target;
  const isEditable =
    target &&
    (
      target.isContentEditable ||
      target.tagName === "INPUT" ||
      target.tagName === "TEXTAREA" ||
      target.tagName === "SELECT"
    );

  if (isEditable) {
    return;
  }

  const { key } = event;

  if (/^[0-9]$/.test(key)) {
    enterDigit(key);
  } else if (key === "." || key === ",") {
    enterDecimal();
  } else if (["+", "-", "*", "/", "^"].includes(key)) {
    chooseOperator(key);
  } else if (key === "Enter" || key === "=") {
    event.preventDefault();
    calculateResult();
  } else if (key === "Escape") {
    clearCalculator();
  } else if (key === "Backspace" || key === "Delete") {
    event.preventDefault();
    deleteLastDigit();
  } else if (key === "%") {
    convertToPercent();
  }
});

render();