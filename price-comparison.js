(function () {
  "use strict";

  function initializePriceComparison() {
    var productList = document.getElementById("product-list");
    var categorySelect = document.getElementById("price-category");
    var addButton = document.getElementById("add-product");
    var resetButton = document.getElementById("reset-products");
    var errorMessage = document.getElementById("price-error");

    if (!productList || !categorySelect || !addButton || !resetButton || !errorMessage) {
      console.error(
        "Harga Satuan tidak dapat dimulai. Pastikan index.html memiliki ID product-list, price-category, add-product, reset-products, dan price-error."
      );
      return;
    }

    var categories = {
      mass: {
        unit: "g",
        units: [
          { id: "mg", label: "mg", factor: 0.001 },
          { id: "g", label: "g", factor: 1 },
          { id: "kg", label: "kg", factor: 1000 }
        ]
      },
      volume: {
        unit: "ml",
        units: [
          { id: "ml", label: "ml", factor: 1 },
          { id: "l", label: "L", factor: 1000 }
        ]
      },
      count: {
        unit: "buah",
        units: [
          { id: "piece", label: "buah", factor: 1 },
          { id: "pair", label: "pasang", factor: 2 },
          { id: "dozen", label: "lusin", factor: 12 }
        ]
      }
    };

    var examples = [
      { name: "Produk A", price: "18000", quantity: "250", unit: "g" },
      { name: "Produk B", price: "29000", quantity: "500", unit: "g" }
    ];

    var currencyFormatter = new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 2
    });

    var numberFormatter = new Intl.NumberFormat("id-ID", {
      maximumFractionDigits: 2
    });

    function clearElement(element) {
      while (element.firstChild) {
        element.removeChild(element.firstChild);
      }
    }

    function formatCurrency(value) {
      return currencyFormatter.format(value);
    }

    function formatNumber(value) {
      return numberFormatter.format(value);
    }

    function parseNumber(rawValue) {
      var text = rawValue.trim();

      if (!text || !/^\d+(?:[.,]\d*)?$|^[.,]\d+$/.test(text)) {
        return null;
      }

      var value = Number(text.replace(",", "."));
      return isFinite(value) ? value : null;
    }

    function currentCategory() {
      return categories[categorySelect.value] || categories.mass;
    }

    function createField(labelText, fieldName, value, placeholder, inputMode) {
      var label = document.createElement("label");
      label.className = "product-field";

      var caption = document.createElement("span");
      caption.textContent = labelText;

      var input = document.createElement("input");
      input.type = "text";
      input.autocomplete = "off";
      input.spellcheck = false;
      input.dataset.field = fieldName;
      input.value = value || "";
      input.placeholder = placeholder || "";
      input.setAttribute("aria-label", labelText);

      if (inputMode) {
        input.inputMode = inputMode;
      }

      label.appendChild(caption);
      label.appendChild(input);
      return label;
    }

    function createUnitField(selectedUnit) {
      var label = document.createElement("label");
      label.className = "product-field";

      var caption = document.createElement("span");
      caption.textContent = "Satuan";

      var select = document.createElement("select");
      select.dataset.field = "unit";
      select.setAttribute("aria-label", "Satuan jumlah produk");

      var units = currentCategory().units;
      var selectedExists = false;

      for (var i = 0; i < units.length; i += 1) {
        var option = document.createElement("option");
        option.value = units[i].id;
        option.textContent = units[i].label;
        select.appendChild(option);

        if (units[i].id === selectedUnit) {
          selectedExists = true;
        }
      }

      select.value = selectedExists ? selectedUnit : units[0].id;
      label.appendChild(caption);
      label.appendChild(select);
      return label;
    }

    function createProductCard(index, values) {
      values = values || {};

      var card = document.createElement("article");
      card.className = "product-card";
      card.dataset.product = "true";

      var header = document.createElement("div");
      header.className = "product-card-header";

      var title = document.createElement("h2");
      title.className = "product-card-title";
      title.textContent = "Produk " + String.fromCharCode(65 + index);
      header.appendChild(title);

      if (index >= 2) {
        var removeButton = document.createElement("button");
        removeButton.className = "remove-product";
        removeButton.type = "button";
        removeButton.dataset.removeProduct = "true";
        removeButton.textContent = "×";
        removeButton.setAttribute("aria-label", "Hapus " + title.textContent);
        header.appendChild(removeButton);
      }

      var fields = document.createElement("div");
      fields.className = "product-fields";

      var nameField = createField(
        "Nama produk",
        "name",
        values.name,
        "Produk " + String.fromCharCode(65 + index),
        "text"
      );
      nameField.className += " product-field-name";

      fields.appendChild(nameField);
      fields.appendChild(
        createField("Harga kemasan (Rp)", "price", values.price, "Contoh: 18000", "decimal")
      );
      fields.appendChild(
        createField("Jumlah isi", "quantity", values.quantity, "Contoh: 250", "decimal")
      );
      fields.appendChild(createUnitField(values.unit));

      var unitPrice = document.createElement("div");
      unitPrice.className = "product-unit-price";

      var unitPriceLabel = document.createElement("span");
      unitPriceLabel.textContent = "Harga per satuan";

      var unitPriceValue = document.createElement("strong");
      unitPriceValue.dataset.unitPrice = "true";
      unitPriceValue.textContent = "—";

      unitPrice.appendChild(unitPriceLabel);
      unitPrice.appendChild(unitPriceValue);
      fields.appendChild(unitPrice);

      card.appendChild(header);
      card.appendChild(fields);
      return card;
    }

    function setText(id, value) {
      var element = document.getElementById(id);
      if (element) {
        element.textContent = value;
      }
    }

    function clearResults() {
      setText("best-badge", "—");
      setText("result-summary", "Isi data produk untuk membandingkan harga satuannya.");
      setText("unit-difference", "—");
      setText("saving-percent", "—");
      setText("equivalent-quantity", "—");
      setText(
        "equivalent-caption",
        "Jumlah acuan mengikuti kemasan produk pertama."
      );

      var equivalentList = document.getElementById("equivalent-list");
      if (equivalentList) {
        clearElement(equivalentList);
      }

      var outputs = productList.querySelectorAll("[data-unit-price]");
      for (var i = 0; i < outputs.length; i += 1) {
        outputs[i].textContent = "—";
      }
    }

    function readProducts() {
      var cards = productList.querySelectorAll("[data-product]");
      var products = [];

      for (var i = 0; i < cards.length; i += 1) {
        var card = cards[i];
        var nameInput = card.querySelector('[data-field="name"]');
        var priceInput = card.querySelector('[data-field="price"]');
        var quantityInput = card.querySelector('[data-field="quantity"]');
        var unitSelect = card.querySelector('[data-field="unit"]');

        if (!nameInput || !priceInput || !quantityInput || !unitSelect) {
          return { error: "Kolom produk tidak lengkap. Muat ulang contoh produk." };
        }

        var name = nameInput.value.trim();
        var priceText = priceInput.value.trim();
        var quantityText = quantityInput.value.trim();

        if (i >= 2 && !name && !priceText && !quantityText) {
          continue;
        }

        if (!priceText || !quantityText) {
          return {
            error: "Lengkapi harga dan jumlah untuk Produk " + String.fromCharCode(65 + i) + "."
          };
        }

        var price = parseNumber(priceText);
        var quantity = parseNumber(quantityText);

        if (price === null || quantity === null) {
          return {
            error: "Masukkan angka yang valid untuk Produk " + String.fromCharCode(65 + i) + "."
          };
        }

        if (quantity <= 0) {
          return {
            error: "Jumlah Produk " + String.fromCharCode(65 + i) + " harus lebih dari nol."
          };
        }

        var unit = null;
        var units = currentCategory().units;

        for (var j = 0; j < units.length; j += 1) {
          if (units[j].id === unitSelect.value) {
            unit = units[j];
            break;
          }
        }

        if (!unit) {
          return { error: "Pilih satuan produk yang valid." };
        }

        var baseQuantity = quantity * unit.factor;

        if (!isFinite(baseQuantity) || baseQuantity <= 0) {
          return { error: "Jumlah produk terlalu besar atau tidak valid." };
        }

        products.push({
          name: name || "Produk " + String.fromCharCode(65 + i),
          price: price,
          quantity: baseQuantity,
          unitPrice: price / baseQuantity,
          card: card
        });
      }

      if (products.length < 2) {
        return { error: "Minimal dua produk diperlukan untuk membandingkan harga." };
      }

      return { products: products };
    }

    function calculate() {
      errorMessage.textContent = "";

      var result = readProducts();

      if (result.error) {
        clearResults();
        errorMessage.textContent = result.error;
        return;
      }

      var products = result.products;
      var unitName = currentCategory().unit;
      var cheapest = products[0];
      var mostExpensive = products[0];

      for (var i = 1; i < products.length; i += 1) {
        if (products[i].unitPrice < cheapest.unitPrice) {
          cheapest = products[i];
        }

        if (products[i].unitPrice > mostExpensive.unitPrice) {
          mostExpensive = products[i];
        }
      }

      var difference = mostExpensive.unitPrice - cheapest.unitPrice;
      var savingPercent = mostExpensive.unitPrice === 0
        ? 0
        : difference / mostExpensive.unitPrice * 100;
      var referenceQuantity = products[0].quantity;

      setText("best-badge", cheapest.name + " paling hemat");
      setText(
        "result-summary",
        cheapest.name + " memiliki harga satuan terendah: " +
          formatCurrency(cheapest.unitPrice) + " per " + unitName + "."
      );
      setText(
        "unit-difference",
        formatCurrency(difference) + " / " + unitName
      );
      setText("saving-percent", formatNumber(savingPercent) + "%");
      setText(
        "equivalent-quantity",
        formatNumber(referenceQuantity) + " " + unitName
      );
      setText(
        "equivalent-caption",
        "Harga tiap produk dihitung untuk jumlah yang sama dengan kemasan " +
          products[0].name + " (" + formatNumber(referenceQuantity) + " " + unitName + ")."
      );

      var equivalentList = document.getElementById("equivalent-list");
      if (!equivalentList) {
        errorMessage.textContent = "Bagian hasil tidak ditemukan. Periksa index.html.";
        return;
      }

      clearElement(equivalentList);

      for (var k = 0; k < products.length; k += 1) {
        var product = products[k];
        var output = product.card.querySelector("[data-unit-price]");

        if (output) {
          output.textContent =
            formatCurrency(product.unitPrice) + " / " + unitName;
        }

        var row = document.createElement("div");
        row.className = "equivalent-row";

        if (product === cheapest) {
          row.className += " is-best";
        }

        var productName = document.createElement("span");
        productName.textContent = product.name;

        var equivalentPrice = document.createElement("strong");
        equivalentPrice.textContent = formatCurrency(
          product.unitPrice * referenceQuantity
        );

        row.appendChild(productName);
        row.appendChild(equivalentPrice);
        equivalentList.appendChild(row);
      }
    }

    function updateUnits() {
      var cards = productList.querySelectorAll("[data-product]");

      for (var i = 0; i < cards.length; i += 1) {
        var oldSelect = cards[i].querySelector('[data-field="unit"]');
        var oldLabel = oldSelect ? oldSelect.parentNode : null;
        var oldUnit = oldSelect ? oldSelect.value : "";

        if (oldLabel && oldLabel.parentNode) {
          oldLabel.parentNode.replaceChild(createUnitField(oldUnit), oldLabel);
        }
      }

      calculate();
    }

    function loadExamples() {
      categorySelect.value = "mass";
      clearElement(productList);

      for (var i = 0; i < examples.length; i += 1) {
        productList.appendChild(createProductCard(i, examples[i]));
      }

      errorMessage.textContent = "";
      calculate();
    }

    productList.addEventListener("input", calculate);
    productList.addEventListener("change", calculate);

    productList.addEventListener("click", function (event) {
      var target = event.target;

      while (target && target !== productList) {
        if (target.dataset && target.dataset.removeProduct === "true") {
          var cards = productList.querySelectorAll("[data-product]");

          if (cards.length <= 2) {
            errorMessage.textContent = "Sisakan minimal dua produk untuk dibandingkan.";
            return;
          }

          var cardToRemove = target;
          while (cardToRemove && cardToRemove.parentNode !== productList) {
            cardToRemove = cardToRemove.parentNode;
          }

          if (cardToRemove && cardToRemove.parentNode === productList) {
            productList.removeChild(cardToRemove);
          }

          var remainingCards = productList.querySelectorAll("[data-product]");
          for (var i = 0; i < remainingCards.length; i += 1) {
            var title = remainingCards[i].querySelector(".product-card-title");
            if (title) {
              title.textContent = "Produk " + String.fromCharCode(65 + i);
            }
          }

          errorMessage.textContent = "";
          calculate();
          return;
        }

        target = target.parentNode;
      }
    });

    categorySelect.addEventListener("change", updateUnits);

    addButton.addEventListener("click", function () {
      var cards = productList.querySelectorAll("[data-product]");

      if (cards.length >= 5) {
        errorMessage.textContent = "Maksimal lima produk dapat dibandingkan.";
        return;
      }

      productList.appendChild(createProductCard(cards.length));
      errorMessage.textContent = "";
      calculate();
    });

    resetButton.addEventListener("click", loadExamples);

    loadExamples();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializePriceComparison);
  } else {
    initializePriceComparison();
  }
})();