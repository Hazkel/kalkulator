(() => {
  const header = document.querySelector(".calculator-header");

  if (!header || document.getElementById("percentage-tools-dialog")) {
    return;
  }

  const openButton = document.createElement("button");
  openButton.className = "header-button percentage-tools-open";
  openButton.type = "button";
  openButton.textContent = "%";
  openButton.title = "Persentase, diskon, PPN, untung dan rugi";
  openButton.setAttribute("aria-label", "Buka kalkulator persentase dan diskon");
  openButton.setAttribute("aria-haspopup", "dialog");
  openButton.setAttribute("aria-controls", "percentage-tools-dialog");

  const historyButton = header.querySelector("#history-open");
  if (historyButton) {
    header.insertBefore(openButton, historyButton);
  } else {
    header.append(openButton);
  }

  const dialog = document.createElement("dialog");
  dialog.className = "percentage-tools-dialog";
  dialog.id = "percentage-tools-dialog";
  dialog.setAttribute("aria-labelledby", "percentage-tools-title");

  dialog.innerHTML = `
    <div class="percentage-tools-header">
      <div>
        <h2 id="percentage-tools-title">Persentase &amp; Diskon</h2>
        <p>Hitung langsung di perangkat ini.</p>
      </div>
      <button
        class="percentage-tools-close"
        type="button"
        aria-label="Tutup kalkulator persentase"
      >×</button>
    </div>

    <div class="percentage-tools-content">
      <label class="percentage-tools-field">
        <span>Jenis perhitungan</span>
        <select class="percentage-tools-mode">
          <option value="discount">Diskon</option>
          <option value="vat">PPN / pajak</option>
          <option value="change">Kenaikan / penurunan</option>
          <option value="profit-loss">Untung / rugi</option>
        </select>
      </label>

      <p class="percentage-tools-hint"></p>
      <div class="percentage-tools-fields"></div>

      <section
        class="percentage-tools-result"
        aria-label="Hasil perhitungan"
        aria-live="polite"
        aria-atomic="true"
      >
        <p class="percentage-tools-result-empty">Masukkan nilai untuk melihat hasil.</p>
        <div class="percentage-tools-result-rows"></div>
      </section>

      <p class="percentage-tools-status" aria-live="polite"></p>

      <div class="percentage-tools-actions">
        <button class="percentage-tools-reset" type="button">Atur ulang</button>
        <button class="percentage-tools-copy" type="button">Salin hasil</button>
      </div>
    </div>
  `;

  document.body.append(dialog);

  const modeSelect = dialog.querySelector(".percentage-tools-mode");
  const hint = dialog.querySelector(".percentage-tools-hint");
  const fieldsContainer = dialog.querySelector(".percentage-tools-fields");
  const resultEmpty = dialog.querySelector(".percentage-tools-result-empty");
  const resultRows = dialog.querySelector(".percentage-tools-result-rows");
  const status = dialog.querySelector(".percentage-tools-status");
  const copyButton = dialog.querySelector(".percentage-tools-copy");
  const resetButton = dialog.querySelector(".percentage-tools-reset");

  const fieldDefinitions = {
    discount: [
      { id: "price", label: "Harga awal (Rp)", placeholder: "200000", value: "200000" },
      { id: "rate", label: "Diskon (%)", placeholder: "25", value: "25" }
    ],
    vat: [
      { id: "price", label: "Harga sebelum PPN (Rp)", placeholder: "200000", value: "200000" },
      { id: "rate", label: "Tarif PPN / pajak (%)", placeholder: "11", value: "11" }
    ],
    change: [
      { id: "initial", label: "Nilai awal (Rp)", placeholder: "100000", value: "100000" },
      { id: "final", label: "Nilai akhir (Rp)", placeholder: "125000", value: "125000" }
    ],
    "profit-loss": [
      { id: "cost", label: "Harga modal (Rp)", placeholder: "100000", value: "100000" },
      { id: "sale", label: "Harga jual (Rp)", placeholder: "125000", value: "125000" }
    ]
  };

  const modeHints = {
    discount: "Contoh: harga Rp200.000 dengan diskon 25%.",
    vat: "Tarif pajak dapat diubah sesuai kebutuhan. Nilai awal 11% hanya contoh.",
    change: "Persentase perubahan dihitung terhadap nilai awal.",
    "profit-loss": "Untung atau rugi dihitung dari harga jual dikurangi harga modal."
  };

  let latestResultText = "";

  function parseNumber(rawValue) {
    const valueText = rawValue.trim();

    if (!valueText) {
      return null;
    }

    if (!/^\d+(?:[.,]\d*)?$|^[.,]\d+$/.test(valueText)) {
      return NaN;
    }

    const parsed = Number(valueText.replace(",", "."));
    return Number.isFinite(parsed) ? parsed : NaN;
  }

  function formatCurrency(value) {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(value);
  }

  function formatPercent(value) {
    return `${new Intl.NumberFormat("id-ID", {
      maximumFractionDigits: 2
    }).format(value)}%`;
  }

  function renderFields(mode, values = {}) {
    fieldsContainer.replaceChildren();

    for (const definition of fieldDefinitions[mode]) {
      const label = document.createElement("label");
      label.className = "percentage-tools-field";

      const caption = document.createElement("span");
      caption.textContent = definition.label;

      const input = document.createElement("input");
      input.type = "text";
      input.inputMode = "decimal";
      input.autocomplete = "off";
      input.spellcheck = false;
      input.dataset.field = definition.id;
      input.placeholder = definition.placeholder;
      input.value = values[definition.id] ?? definition.value;
      input.setAttribute("aria-label", definition.label);

      label.append(caption, input);
      fieldsContainer.append(label);

      input.addEventListener("input", calculate);
    }
  }

  function getInputValues() {
    const values = {};

    for (const input of fieldsContainer.querySelectorAll("input[data-field]")) {
      const parsed = parseNumber(input.value);

      if (parsed === null || Number.isNaN(parsed)) {
        return null;
      }

      values[input.dataset.field] = parsed;
    }

    return values;
  }

  function addResultRow(label, value, rows) {
    const row = document.createElement("div");
    row.className = "percentage-tools-result-row";

    const rowLabel = document.createElement("span");
    rowLabel.textContent = label;

    const rowValue = document.createElement("strong");
    rowValue.textContent = value;

    row.append(rowLabel, rowValue);
    rows.append(row);
  }

  function showError(message) {
    resultEmpty.hidden = true;
    resultRows.replaceChildren();
    status.textContent = message;
    latestResultText = "";
  }

  function showResults(rows) {
    resultEmpty.hidden = true;
    resultRows.replaceChildren();
    status.textContent = "";

    for (const [label, value] of rows) {
      addResultRow(label, value, resultRows);
    }

    latestResultText = rows
      .map(([label, value]) => `${label}: ${value}`)
      .join("\n");
  }

  function calculate() {
    const values = getInputValues();

    if (!values) {
      resultEmpty.hidden = false;
      resultRows.replaceChildren();
      status.textContent = "Isi semua kolom dengan angka yang valid.";
      latestResultText = "";
      return;
    }

    const mode = modeSelect.value;

    if (mode === "discount") {
      const { price, rate } = values;

      if (rate > 100) {
        showError("Diskon tidak boleh lebih dari 100%.");
        return;
      }

      const discountAmount = price * rate / 100;
      const finalPrice = price - discountAmount;

      showResults([
        ["Harga awal", formatCurrency(price)],
        ["Besar diskon", `${formatCurrency(discountAmount)} (${formatPercent(rate)})`],
        ["Harga setelah diskon", formatCurrency(finalPrice)]
      ]);
      return;
    }

    if (mode === "vat") {
      const { price, rate } = values;
      const taxAmount = price * rate / 100;
      const total = price + taxAmount;

      showResults([
        ["Harga sebelum pajak", formatCurrency(price)],
        ["PPN / pajak", `${formatCurrency(taxAmount)} (${formatPercent(rate)})`],
        ["Total setelah pajak", formatCurrency(total)]
      ]);
      return;
    }

    if (mode === "change") {
      const { initial, final: finalValue } = values;
      const difference = finalValue - initial;
      const changePercent = initial === 0 ? null : difference / initial * 100;
      const changeLabel = difference > 0
        ? "Kenaikan"
        : difference < 0
          ? "Penurunan"
          : "Perubahan";

      showResults([
        ["Nilai awal", formatCurrency(initial)],
        ["Nilai akhir", formatCurrency(finalValue)],
        [changeLabel, formatCurrency(Math.abs(difference))],
        [
          "Persentase perubahan",
          changePercent === null
            ? "Tidak dapat dihitung jika nilai awal Rp0"
            : `${changeLabel} ${formatPercent(Math.abs(changePercent))}`
        ]
      ]);
      return;
    }

    const { cost, sale } = values;
    const difference = sale - cost;
    const outcome = difference > 0 ? "Untung" : difference < 0 ? "Rugi" : "Impas";
    const absoluteDifference = Math.abs(difference);
    const markup = cost === 0 ? null : difference / cost * 100;
    const margin = sale === 0 ? null : difference / sale * 100;

    showResults([
      ["Harga modal", formatCurrency(cost)],
      ["Harga jual", formatCurrency(sale)],
      [outcome, formatCurrency(absoluteDifference)],
      [
        "Persentase terhadap modal",
        markup === null ? "Tidak dapat dihitung jika modal Rp0" : formatPercent(markup)
      ],
      [
        "Margin terhadap harga jual",
        margin === null ? "Tidak dapat dihitung jika harga jual Rp0" : formatPercent(margin)
      ]
    ]);
  }

  function resetFields() {
    const mode = modeSelect.value;
    renderFields(mode);
    hint.textContent = modeHints[mode];
    resultEmpty.hidden = false;
    resultRows.replaceChildren();
    status.textContent = "";
    latestResultText = "";
    calculate();
  }

  async function copyResults() {
    if (!latestResultText) {
      status.textContent = "Belum ada hasil yang bisa disalin.";
      return;
    }

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(latestResultText);
      } else {
        const temporaryInput = document.createElement("textarea");
        temporaryInput.value = latestResultText;
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

      status.textContent = "Hasil disalin.";
    } catch (error) {
      console.error("Hasil persentase gagal disalin:", error);
      status.textContent = "Hasil tidak dapat disalin di perangkat ini.";
    }
  }

  modeSelect.addEventListener("change", resetFields);

  resetButton.addEventListener("click", () => {
    for (const input of fieldsContainer.querySelectorAll("input")) {
      input.value = "";
    }
    calculate();
  });

  copyButton.addEventListener("click", copyResults);

  dialog.querySelector(".percentage-tools-close").addEventListener("click", () => {
    dialog.close();
  });

  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) {
      dialog.close();
    }
  });

  openButton.addEventListener("click", () => {
    calculate();
    dialog.showModal();
    const firstInput = fieldsContainer.querySelector("input");
    if (firstInput) firstInput.focus();
  });

  resetFields();
})();