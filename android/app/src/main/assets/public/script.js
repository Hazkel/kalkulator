const display = document.getElementById("display");
const expression = document.getElementById("expression");
const keypad = document.querySelector(".keypad");

let currentValue = "0";
let storedValue = null;
let pendingOperator = null;
let shouldResetOnDigit = false;
let hasError = false;

const operatorSymbols = {
  "+": "+",
  "-": "−",
  "*": "×",
  "/": "÷"
};

function normalizeNumber(value) {
  if (!Number.isFinite(value)) {
    return null;
  }

  return Number(value.toPrecision(12)).toString();
}

function render() {
  display.textContent = hasError ? "Error" : currentValue;

  if (hasError) {
    expression.textContent = "Tidak dapat membagi dengan nol";
    return;
  }

  if (pendingOperator && storedValue !== null) {
    expression.textContent =
      `${normalizeNumber(storedValue)} ${operatorSymbols[pendingOperator]}`;
    return;
  }

  expression.textContent = "";
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
}

function enterDigit(digit) {
  resetAfterError();

  if (shouldResetOnDigit) {
    currentValue = digit;
    shouldResetOnDigit = false;
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
    default:
      return null;
  }
}

function showError() {
  currentValue = "0";
  storedValue = null;
  pendingOperator = null;
  shouldResetOnDigit = true;
  hasError = true;
  render();
}

function chooseOperator(operator) {
  if (hasError) {
    return;
  }

  if (pendingOperator && !shouldResetOnDigit && storedValue !== null) {
    const result = calculate(storedValue, Number(currentValue), pendingOperator);
    const normalized = normalizeNumber(result);

    if (normalized === null) {
      showError();
      return;
    }

    currentValue = normalized;
  }

  storedValue = Number(currentValue);
  pendingOperator = operator;
  shouldResetOnDigit = true;
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
    showError();
    return;
  }

  expression.textContent =
    `${normalizeNumber(firstValue)} ${operatorSymbols[operator]} ${normalizeNumber(secondValue)} =`;

  currentValue = normalized;
  storedValue = null;
  pendingOperator = null;
  shouldResetOnDigit = true;
  display.textContent = currentValue;
}

function clearCalculator() {
  currentValue = "0";
  storedValue = null;
  pendingOperator = null;
  shouldResetOnDigit = false;
  hasError = false;
  render();
}

function toggleSign() {
  if (hasError) {
    return;
  }

  if (shouldResetOnDigit) {
    currentValue = "0";
    shouldResetOnDigit = false;
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
    showError();
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
  } else {
    currentValue = currentValue.slice(0, -1);

    if (currentValue === "" || currentValue === "-") {
      currentValue = "0";
    }
  }

  render();
}

function handleAction(action, value) {
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
    default:
      break;
  }
}

keypad.addEventListener("click", (event) => {
  const button = event.target.closest("button");

  if (!button) {
    return;
  }

  handleAction(button.dataset.action, button.dataset.value);
});

document.addEventListener("keydown", (event) => {
  const { key } = event;

  if (/^[0-9]$/.test(key)) {
    enterDigit(key);
    return;
  }

  if (key === "." || key === ",") {
    enterDecimal();
    return;
  }

  if (["+", "-", "*", "/"].includes(key)) {
    chooseOperator(key);
    return;
  }

  if (key === "Enter" || key === "=") {
    event.preventDefault();
    calculateResult();
    return;
  }

  if (key === "Escape") {
    clearCalculator();
    return;
  }

  if (key === "Backspace") {
    event.preventDefault();
    deleteLastDigit();
    return;
  }

  if (key === "%") {
    convertToPercent();
  }
});

render();