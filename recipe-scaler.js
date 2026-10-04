(() => {
  "use strict";

  const MAX_INGREDIENTS = 50;
  let nextIngredientId = 1;

  const units = [
    ["g", "gram (g)"],
    ["kg", "kilogram (kg)"],
    ["ml", "mililiter (ml)"],
    ["l", "liter (L)"],
    ["sdt", "sendok teh"],
    ["sdm", "sendok makan"],
    ["butir", "butir"]
  ];

  const roundingSteps = [
    ["0", "Tanpa pembulatan"],
    ["0.5", "Ke atas per 0,5 satuan"],
    ["1", "Ke atas per 1 satuan"],
    ["2.5", "Ke atas per 2,5 satuan"],
    ["5", "Ke atas per 5 satuan"],
    ["10", "Ke atas per 10 satuan"]
  ];

  const quantityFormatter = new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 4
  });

  function parseAmount(rawValue) {
    const value = String(rawValue).trim();

    if (!/^(?:\d+(?:[.,]\d+)?|[.,]\d+)$/.test(value)) {
      return null;
    }

    const parsed = Number(value.replace(",", "."));
    return Number.isFinite(parsed) ? parsed : null;
  }

  function formatAmount(value) {
    const cleaned = Number(value.toPrecision(12));
    return quantityFormatter.format(cleaned);
  }

  function initializeRecipeScaler() {
    const section = document.getElementById("recipe-scaler-view");
    const ingredientList = document.getElementById("recipe-ingredients");
    const addButton = document.getElementById("recipe-add-ingredient");
    const originalServings = document.getElementById("recipe-original-servings");
    const desiredServings = document.getElementById("recipe-desired-servings");
    const roundingSelect = document.getElementById("recipe-rounding");
    const ratioOutput = document.getElementById("recipe-ratio");
    const resultList = document.getElementById("recipe-results");
    const status = document.getElementById("recipe-status");

    if (
      !section ||
      !ingredientList ||
      !addButton ||
      !originalServings ||
      !desiredServings ||
      !roundingSelect ||
      !ratioOutput ||
      !resultList ||
      !status
    ) {
      console.error(
        "Pengubah Takaran Resep tidak dapat dimulai. Periksa elemen recipe-scaler di index.html."
      );
      return;
    }

    function setStatus(message, kind) {
      status.textContent = message;
      status.dataset.kind = kind || "info";
    }

    function createIngredientRow(initialValues) {
      const values = initialValues || {};
      const row = document.createElement("div");
      row.className = "recipe-ingredient";
      row.dataset.ingredientId = String(nextIngredientId++);

      const nameLabel = document.createElement("label");
      nameLabel.className = "recipe-field recipe-field-name";

      const nameCaption = document.createElement("span");
      nameCaption.textContent = "Nama bahan";

      const nameInput = document.createElement("input");
      nameInput.type = "text";
      nameInput.className = "recipe-ingredient-name";
      nameInput.maxLength = 80;
      nameInput.autocomplete = "off";
      nameInput.placeholder = "Contoh: Tepung terigu";
      nameInput.value = values.name || "";
      nameInput.setAttribute("aria-label", "Nama bahan");

      nameLabel.append(nameCaption, nameInput);

      const amountLabel = document.createElement("label");
      amountLabel.className = "recipe-field";

      const amountCaption = document.createElement("span");
      amountCaption.textContent = "Takaran";

      const amountInput = document.createElement("input");
      amountInput.type = "text";
      amountInput.inputMode = "decimal";
      amountInput.className = "recipe-ingredient-amount";
      amountInput.maxLength = 16;
      amountInput.placeholder = "Contoh: 250";
      amountInput.value = values.amount || "";
      amountInput.setAttribute("aria-label", "Takaran bahan");

      amountLabel.append(amountCaption, amountInput);

      const unitLabel = document.createElement("label");
      unitLabel.className = "recipe-field";

      const unitCaption = document.createElement("span");
      unitCaption.textContent = "Satuan";

      const unitSelect = document.createElement("select");
      unitSelect.className = "recipe-ingredient-unit";
      unitSelect.setAttribute("aria-label", "Satuan bahan");

      for (const [value, label] of units) {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = label;
        unitSelect.appendChild(option);
      }

      unitSelect.value = values.unit || "g";
      unitLabel.append(unitCaption, unitSelect);

      const removeButton = document.createElement("button");
      removeButton.type = "button";
      removeButton.className = "recipe-remove-ingredient";
      removeButton.dataset.recipeRemove = "true";
      removeButton.textContent = "Hapus";
      removeButton.setAttribute("aria-label", "Hapus bahan");

      row.append(nameLabel, amountLabel, unitLabel, removeButton);
      ingredientList.appendChild(row);

      return row;
    }

    function clearResults() {
      ratioOutput.textContent = "—";
      resultList.replaceChildren();
    }

    function showEmptyResults(message) {
      const item = document.createElement("li");
      item.className = "recipe-result-empty";
      item.textContent = message;
      resultList.appendChild(item);
    }

    function updateResults() {
      const original = parseAmount(originalServings.value);
      const desired = parseAmount(desiredServings.value);

      if (original === null || original <= 0) {
        clearResults();
        setStatus("Jumlah porsi asli harus berupa angka lebih dari nol.", "error");
        return;
      }

      if (desired === null || desired <= 0) {
        clearResults();
        setStatus("Jumlah porsi baru harus berupa angka lebih dari nol.", "error");
        return;
      }

      const ratio = desired / original;

      if (!Number.isFinite(ratio)) {
        clearResults();
        setStatus("Rasio porsi terlalu besar untuk dihitung.", "error");
        return;
      }

      ratioOutput.textContent = `${quantityFormatter.format(ratio)}×`;
      resultList.replaceChildren();

      const rows = Array.from(
        ingredientList.querySelectorAll(".recipe-ingredient")
      );

      if (rows.length === 0) {
        showEmptyResults("Tambahkan bahan untuk melihat takaran hasil.");
        setStatus("Daftar bahan masih kosong.", "info");
        return;
      }

      const roundingStep = Number(roundingSelect.value);
      const invalidIngredients = [];

      rows.forEach((row, index) => {
        const name = row.querySelector(".recipe-ingredient-name").value.trim();
        const amount = parseAmount(
          row.querySelector(".recipe-ingredient-amount").value
        );
        const unit = row.querySelector(".recipe-ingredient-unit").value;
        const item = document.createElement("li");
        item.className = "recipe-result-item";

        const resultName = document.createElement("strong");
        resultName.className = "recipe-result-name";
        resultName.textContent = name || `Bahan ${index + 1}`;

        const resultAmount = document.createElement("span");
        resultAmount.className = "recipe-result-amount";

        if (!name || amount === null || amount < 0) {
          resultAmount.textContent = "Periksa nama dan takaran bahan.";
          item.classList.add("is-invalid");
          invalidIngredients.push(String(index + 1));
        } else {
          let scaledAmount = amount * ratio;

          if (roundingStep > 0) {
            scaledAmount =
              Math.ceil(scaledAmount / roundingStep - 1e-10) * roundingStep;
          }

          if (!Number.isFinite(scaledAmount)) {
            resultAmount.textContent = "Takaran terlalu besar untuk dihitung.";
            item.classList.add("is-invalid");
            invalidIngredients.push(String(index + 1));
          } else {
            resultAmount.textContent =
              `${formatAmount(scaledAmount)} ${unit}`;
          }
        }

        item.append(resultName, resultAmount);
        resultList.appendChild(item);
      });

      if (invalidIngredients.length > 0) {
        setStatus(
          `Periksa nama atau takaran bahan nomor ${invalidIngredients.join(", ")}.`,
          "error"
        );
      } else {
        setStatus(
          `Takaran dihitung untuk ${quantityFormatter.format(desired)} porsi. Perhitungan tersimpan hanya selama halaman ini digunakan.`,
          "success"
        );
      }
    }

    addButton.addEventListener("click", () => {
      const rows = ingredientList.querySelectorAll(".recipe-ingredient");

      if (rows.length >= MAX_INGREDIENTS) {
        setStatus(`Maksimal ${MAX_INGREDIENTS} bahan dalam satu resep.`, "error");
        return;
      }

      const row = createIngredientRow();
      updateResults();
      row.querySelector(".recipe-ingredient-name").focus();
    });

    ingredientList.addEventListener("click", (event) => {
      const button = event.target.closest("[data-recipe-remove]");

      if (!button || !ingredientList.contains(button)) {
        return;
      }

      const row = button.closest(".recipe-ingredient");

      if (row) {
        row.remove();
        updateResults();
      }
    });

    section.addEventListener("input", (event) => {
      if (
        event.target === originalServings ||
        event.target === desiredServings ||
        ingredientList.contains(event.target)
      ) {
        updateResults();
      }
    });

    section.addEventListener("change", (event) => {
      if (
        event.target === originalServings ||
        event.target === desiredServings ||
        event.target === roundingSelect ||
        ingredientList.contains(event.target)
      ) {
        updateResults();
      }
    });

    for (const [value, label] of roundingSteps) {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = label;
      roundingSelect.appendChild(option);
    }

    createIngredientRow({
      name: "Tepung terigu",
      amount: "250",
      unit: "g"
    });

    createIngredientRow({
      name: "Gula",
      amount: "100",
      unit: "g"
    });

    updateResults();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeRecipeScaler, {
      once: true
    });
  } else {
    initializeRecipeScaler();
  }
})();