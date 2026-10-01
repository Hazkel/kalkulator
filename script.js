let display = document.getElementById('display');
let currentInput = '0';

function appendNumber(num) {
  if (currentInput === '0') currentInput = num;
  else currentInput += num;
  display.innerText = currentInput;
}

function appendOperator(op) { currentInput += op;
  display.innerText = currentInput; }

function clearDisplay() { currentInput = '0';
  display.innerText = '0'; }

function calculate() {
  try {
    currentInput = eval(currentInput.replace('×', '*').replace('÷', '/')).toString();
    display.innerText = currentInput;
  } catch { display.innerText = 'Error'; }
}