(() => {
  const categories = {
    length: {
      label: "Panjang",
      units: [
        { id: "mm", label: "Milimeter (mm)", factor: 0.001 },
        { id: "cm", label: "Sentimeter (cm)", factor: 0.01 },
        { id: "m", label: "Meter (m)", factor: 1 },
        { id: "km", label: "Kilometer (km)", factor: 1000 },
        { id: "in", label: "Inci (in)", factor: 0.0254 },
        { id: "ft", label: "Kaki (ft)", factor: 0.3048 },
        { id: "yd", label: "Yard (yd)", factor: 0.9144 },
        { id: "mi", label: "Mil (mi)", factor: 1609.344 }
      ],
      from: "km",
      to: "m"
    },
    mass: {
      label: "Berat / massa",
      units: [
        { id: "mg", label: "Miligram (mg)", factor: 0.000001 },
        { id: "g", label: "Gram (g)", factor: 0.001 },
        { id: "kg", label: "Kilogram (kg)", factor: 1 },
        { id: "tonne", label: "Ton metrik (t)", factor: 1000 },
        { id: "oz", label: "Ons (oz)", factor: 0.028349523125 },
        { id: "lb", label: "Pon (lb)", factor: 0.45359237 }
      ],
      from: "kg",
      to: "g"
    },
    temperature: {
      label: "Suhu",
      units: [
        { id: "c", label: "Celsius (°C)" },
        { id: "f", label: "Fahrenheit (°F)" },
        { id: "k", label: "Kelvin (K)" }
      ],
      from: "c",
      to: "f"
    },
    area: {
      label: "Luas",
      units: [
        { id: "mm2", label: "Milimeter persegi (mm²)", factor: 0.000001 },
        { id: "cm2", label: "Sentimeter persegi (cm²)", factor: 0.0001 },
        { id: "m2", label: "Meter persegi (m²)", factor: 1 },
        { id: "km2", label: "Kilometer persegi (km²)", factor: 1000000 },
        { id: "ha", label: "Hektare (ha)", factor: 10000 },
        { id: "acre", label: "Acre", factor: 4046.8564224 },
        { id: "ft2", label: "Kaki persegi (ft²)", factor: 0.09290304 }
      ],
      from: "ha",
      to: "m2"
    },
    volume: {
      label: "Volume",
      units: [
        { id: "ml", label: "Mililiter (mL)", factor: 0.001 },
        { id: "l", label: "Liter (L)", factor: 1 },
        { id: "m3", label: "Meter kubik (m³)", factor: 1000 },
        { id: "cm3", label: "Sentimeter kubik (cm³)", factor: 0.001 },
        { id: "us_gal", label: "Galon AS (US gal)", factor: 3.785411784 },
        { id: "us_cup", label: "Cangkir AS (US cup)", factor: 0.2365882365 },
        { id: "us_fl_oz", label: "Fluid ounce AS (US fl oz)", factor: 0.0295735295625 }
      ],
      from: "l",
      to: "ml"
    },
    speed: {
      label: "Kecepatan",
      units: [
        { id: "m_s", label: "Meter per detik (m/s)", factor: 1 },
        { id: "km_h", label: "Kilometer per jam (km/h)", factor: 1 / 3.6 },
        { id: "mph", label: "Mil per jam (mph)", factor: 0.44704 },
        { id: "ft_s", label: "Kaki per detik (ft/s)", factor: 0.3048 },
        { id: "knot", label: "Knot (kn)", factor: 0.514444444444 }
      ],
      from: "km_h",
      to: "m_s"
    },
    time: {
      label: "Waktu",
      units: [
        { id: "ms", label: "Milidetik (ms)", factor: 0.001 },
        { id: "s", label: "Detik (s)", factor: 1 },
        { id: "min", label: "Menit (min)", factor: 60 },
        { id: "h", label: "Jam (h)", factor: 3600 },
        { id: "day", label: "Hari", factor: 86400 },
        { id: "week", label: "Minggu", factor: 604800 }
      ],
      from: "h",
      to: "min"
    }
  };

  const header = document.querySelector(".calculator-header");
  if (!header || document.getElementById("unit-converter-dialog")) {
    return;
  }

  const openButton = document.createElement("button");
  openButton.className = "header-button unit-converter-open";
  openButton.type = "button";
  openButton.textContent = "↔";
  openButton.title = "Konversi satuan";
  openButton.setAttribute("aria-label", "Buka konversi satuan");
  openButton.setAttribute("aria-haspopup", "dialog");
  openButton.setAttribute("aria-controls", "unit-converter-dialog");

  const historyButton = header.querySelector("#history-open");
  if (historyButton) {
    header.insertBefore(openButton, historyButton);
  } else {
    header.append(openButton);
  }

  const dialog = document.createElement("dialog");
  dialog.className = "unit-converter-dialog";
  dialog.id = "unit-converter-dialog";
  dialog.setAttribute("aria-labelledby", "unit-converter-title");

  dialog.innerHTML = `
    <div class="unit-converter-header">
      <div>
        <h2 id="unit-converter-title">Konversi Satuan</h2>
        <p>Semua perhitungan dilakukan di perangkat ini.</p>
      </div>
      <button
        class="unit-converter-close"
        type="button"
        aria-label="Tutup konversi satuan"
      >×</button>
    </div>

    <div class="unit-converter-content">
      <label class="unit-converter-field">
        <span>Jenis satuan</span>
        <select class="unit-category"></select>
      </label>

      <div class="unit-converter-row">
        <label class="unit-converter-field">
          <span>Dari</span>
          <select class="unit-from"></select>
        </label>
        <button
          class="unit-swap"
          type="button"
          aria-label="Tukar satuan asal dan tujuan"
          title="Tukar satuan"
        >⇄</button>
        <label class="unit-converter-field">
          <span>Ke</span>
          <select class="unit-to"></select>
        </label>
      </div>

      <label class="unit-converter-field">
        <span>Nilai</span>
        <input
          class="unit-input"
          type="text"
          inputmode="decimal"
          autocomplete="off"
          spellcheck="false"
          value="1"
          aria-describedby="unit-converter-error"
        >
      </label>

      <div class="unit-result-box">
        <span>Hasil</span>
        <output class="unit-result" aria-live="polite" aria-atomic="true">—</output>
        <span class="unit-result-label"></span>
      </div>

      <p class="unit-converter-error" id="unit-converter-error" aria-live="polite"></p>

      <div class="unit-converter-actions">
        <button class="unit-copy" type="button">Salin hasil</button>
      </div>
    </div>
  `;

  document.body.append(dialog);

  const categorySelect = dialog.querySelector(".unit-category");
  const fromSelect = dialog.querySelector(".unit-from");
  const toSelect = dialog.querySelector(".unit-to");
  const input = dialog.querySelector(".unit-input");
  const resultOutput = dialog.querySelector(".unit-result");
  const resultLabel = dialog.querySelector(".unit-result-label");
  const errorMessage = dialog.querySelector(".unit-converter-error");
  const copyButton = dialog.querySelector(".unit-copy");

  for (const [id, category] of Object.entries(categories)) {
    const option = document.createElement("option");
    option.value = id;
    option.textContent = category.label;
    categorySelect.append(option);
  }

  function getSelectedCategory() {
    return categories[categorySelect.value];
  }

  function addUnitOptions(select, units, selectedId) {
    select.replaceChildren();

    for (const unit of units) {
      const option = document.createElement("option");
      option.value = unit.id;
      option.textContent = unit.label;
      select.append(option);
    }

    select.value = selectedId;
  }

  function formatNumber(value) {
    const rounded = Number(value.toPrecision(12));
    const safeNumber = Object.is(rounded, -0) ? 0 : rounded;

    return new Intl.NumberFormat("id-ID", {
      maximumSignificantDigits: 12
    }).format(safeNumber);
  }

  function parseInput(rawValue) {
    const trimmed = rawValue.trim();

    if (!trimmed) {
      return null;
    }

    if (!/^[+-]?(?:\d+(?:[.,]\d*)?|[.,]\d+)(?:[eE][+-]?\d+)?$/.test(trimmed)) {
      return NaN;
    }

    const value = Number(trimmed.replace(",", "."));
    return Number.isFinite(value) ? value : NaN;
  }

  function temperatureToKelvin(value, unitId) {
    switch (unitId) {
      case "c":
        return value + 273.15;
      case "f":
        return (value - 32) * 5 / 9 + 273.15;
      case "k":
        return value;
      default:
        return NaN;
    }
  }

  function kelvinToTemperature(value, unitId) {
    switch (unitId) {
      case "c":
        return value - 273.15;
      case "f":
        return (value - 273.15) * 9 / 5 + 32;
      case "k":
        return value;
      default:
        return NaN;
    }
  }

  function updateResult() {
    const rawValue = parseInput(input.value);
    const category = getSelectedCategory();

    errorMessage.textContent = "";
    resultOutput.textContent = "—";
    resultLabel.textContent = "";

    if (rawValue === null) {
      return;
    }

    if (Number.isNaN(rawValue)) {
      errorMessage.textContent = "Masukkan angka yang valid.";
      return;
    }

    const fromUnit = category.units.find((unit) => unit.id === fromSelect.value);
    const toUnit = category.units.find((unit) => unit.id === toSelect.value);

    if (!fromUnit || !toUnit) {
      errorMessage.textContent = "Pilih satuan asal dan tujuan.";
      return;
    }

    let convertedValue;

    if (categorySelect.value === "temperature") {
      const kelvin = temperatureToKelvin(rawValue, fromUnit.id);

      if (kelvin < -1e-10) {
        errorMessage.textContent = "Suhu tidak boleh di bawah nol mutlak.";
        return;
      }

      convertedValue = kelvinToTemperature(Math.max(0, kelvin), toUnit.id);
    } else {
      const baseValue = rawValue * fromUnit.factor;
      convertedValue = baseValue / toUnit.factor;
    }

    if (!Number.isFinite(convertedValue)) {
      errorMessage.textContent = "Hasil konversi di luar jangkauan.";
      return;
    }

    resultOutput.textContent = formatNumber(convertedValue);
    resultLabel.textContent = toUnit.label;
  }

  function populateUnits(resetValue = true) {
    const category = getSelectedCategory();
    const previousValue = input.value;

    addUnitOptions(fromSelect, category.units, category.from);
    addUnitOptions(toSelect, category.units, category.to);

    if (resetValue) {
      input.value = "1";
    } else {
      input.value = previousValue;
    }

    updateResult();
  }

  async function copyResult() {
    if (resultOutput.textContent === "—" || errorMessage.textContent) {
      errorMessage.textContent = "Belum ada hasil yang bisa disalin.";
      return;
    }

    const textToCopy = `${resultOutput.textContent} ${resultLabel.textContent}`.trim();

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(textToCopy);
      } else {
        const temporaryInput = document.createElement("textarea");
        temporaryInput.value = textToCopy;
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

      errorMessage.textContent = "Hasil konversi disalin.";
    } catch (error) {
      console.error("Hasil konversi gagal disalin:", error);
      errorMessage.textContent = "Hasil tidak dapat disalin di perangkat ini.";
    }
  }

  categorySelect.addEventListener("change", () => populateUnits(true));
  fromSelect.addEventListener("change", updateResult);
  toSelect.addEventListener("change", updateResult);
  input.addEventListener("input", updateResult);
  copyButton.addEventListener("click", copyResult);

  dialog.querySelector(".unit-swap").addEventListener("click", () => {
    const previousFrom = fromSelect.value;
    fromSelect.value = toSelect.value;
    toSelect.value = previousFrom;
    updateResult();
  });

  dialog.querySelector(".unit-converter-close").addEventListener("click", () => {
    dialog.close();
  });

  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) {
      dialog.close();
    }
  });

  openButton.addEventListener("click", () => {
    updateResult();
    dialog.showModal();
    input.focus();
    input.select();
  });

  populateUnits(true);
})();