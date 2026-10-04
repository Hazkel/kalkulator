(() => {
  "use strict";

  const STORAGE_KEY = "kalkulator-harga-jual-v1";
  const MAX_SAVED_PRODUCTS = 100;
  const ALLOWED_ROUNDING = [1, 100, 500, 1000];

  const currencyFormatter = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  });

  const numberFormatter = new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 2
  });

  function initializeSellingPrice() {
    const form = document.getElementById("selling-form");
    const savedList = document.getElementById("selling-saved-list");
    const message = document.getElementById("selling-message");
    const saveButton = document.getElementById("selling-save");
    const newButton = document.getElementById("selling-new");

    if (!form || !savedList || !message || !saveButton || !newButton) {
      console.error(
        "Kalkulator Harga Jual tidak dapat dimulai. Pastikan elemen selling-form, selling-saved-list, selling-message, selling-save, dan selling-new tersedia."
      );
      return;
    }

    const inputIds = [
      "selling-name",
      "selling-item-cost",
      "selling-packaging-cost",
      "selling-production-cost",
      "selling-operational-cost",
      "selling-platform-fee",
      "selling-method",
      "selling-target",
      "selling-rounding",
      "selling-quantity"
    ];

    for (const id of inputIds) {
      if (!document.getElementById(id)) {
        console.error(`Kolom ${id} tidak ditemukan. Periksa index.html.`);
        return;
      }
    }

    const outputIds = [
      "selling-price-result",
      "selling-net-profit",
      "selling-margin-result",
      "selling-estimated-profit",
      "selling-total-cost",
      "selling-platform-cost-result"
    ];

    for (const id of outputIds) {
      if (!document.getElementById(id)) {
        console.error(`Hasil ${id} tidak ditemukan. Periksa index.html.`);
        return;
      }
    }

    let savedProducts = readStoredProducts();
    let editingId = null;
    let lastValidCalculation = null;

    function byId(id) {
      return document.getElementById(id);
    }

    function currency(value) {
      return currencyFormatter.format(value);
    }

    function percentage(value) {
      return `${numberFormatter.format(value)}%`;
    }

    function showMessage(text, kind) {
      message.textContent = text;
      message.dataset.kind = kind || "error";
    }

    function readStoredProducts() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);

        if (!raw) {
          return [];
        }

        const parsed = JSON.parse(raw);

        if (!Array.isArray(parsed)) {
          throw new Error("Data produk tersimpan bukan berupa daftar.");
        }

        return parsed.filter((product) => {
          return product &&
            typeof product.id === "string" &&
            typeof product.name === "string" &&
            typeof product.method === "string" &&
            ["markup", "margin"].includes(product.method) &&
            ["itemCost", "packagingCost", "productionCost", "operationalCost",
              "platformFee", "target", "rounding", "quantity"].every((key) =>
              Number.isFinite(Number(product[key]))
            ) &&
            Number(product.itemCost) >= 0 &&
            Number(product.packagingCost) >= 0 &&
            Number(product.productionCost) >= 0 &&
            Number(product.operationalCost) >= 0 &&
            Number(product.platformFee) >= 0 &&
            Number(product.platformFee) < 100 &&
            Number(product.target) >= 0 &&
            ALLOWED_ROUNDING.includes(Number(product.rounding)) &&
            Number.isInteger(Number(product.quantity)) &&
            Number(product.quantity) > 0;
        }).slice(0, MAX_SAVED_PRODUCTS);
      } catch (error) {
        console.error("Produk tersimpan gagal dibaca:", error);
        showMessage("Data produk tersimpan tidak dapat dibaca. Periksa penyimpanan perangkat.", "error");
        return [];
      }
    }

    function persistProducts(nextProducts) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nextProducts));
        savedProducts = nextProducts;
        return true;
      } catch (error) {
        console.error("Produk gagal disimpan:", error);
        showMessage("Produk tidak dapat disimpan di perangkat ini. Periksa kapasitas penyimpanan.", "error");
        return false;
      }
    }

    function readNumber(id, label, options) {
      const raw = byId(id).value.trim();

      if (raw === "") {
        return { error: `${label} wajib diisi.` };
      }

      const value = Number(raw);

      if (!Number.isFinite(value)) {
        return { error: `${label} harus berupa angka yang valid.` };
      }

      if (value < 0) {
        return { error: `${label} tidak boleh kurang dari nol.` };
      }

      if (options && options.max !== undefined && value > options.max) {
        return { error: `${label} maksimal ${options.max}.` };
      }

      if (options && options.integer && !Number.isInteger(value)) {
        return { error: `${label} harus berupa bilangan bulat.` };
      }

      if (options && options.minimum !== undefined && value < options.minimum) {
        return { error: `${label} minimal ${options.minimum}.` };
      }

      return { value };
    }

    function readForm() {
      const name = byId("selling-name").value.trim();

      if (!name) {
        return { error: "Nama produk wajib diisi." };
      }

      const fields = [
        ["selling-item-cost", "Modal barang"],
        ["selling-packaging-cost", "Biaya kemasan"],
        ["selling-production-cost", "Ongkos produksi"],
        ["selling-operational-cost", "Biaya operasional"],
        ["selling-platform-fee", "Biaya platform marketplace"],
        ["selling-target", "Target keuntungan"],
        ["selling-quantity", "Jumlah produk terjual"]
      ];

      const values = {};

      for (const [id, label] of fields) {
        const options = id === "selling-platform-fee" || id === "selling-target"
          ? { max: 99.99 }
          : undefined;
        const result = readNumber(id, label, options);

        if (result.error) {
          return result;
        }

        values[id] = result.value;
      }

      if (values["selling-quantity"] < 1 ||
          !Number.isInteger(values["selling-quantity"])) {
        return { error: "Jumlah produk terjual harus bilangan bulat minimal 1." };
      }

      const method = byId("selling-method").value;
      const rounding = Number(byId("selling-rounding").value);

      if (!["markup", "margin"].includes(method)) {
        return { error: "Pilih metode keuntungan yang valid." };
      }

      if (!ALLOWED_ROUNDING.includes(rounding)) {
        return { error: "Pilih pembulatan harga yang valid." };
      }

      return {
        product: {
          name,
          itemCost: values["selling-item-cost"],
          packagingCost: values["selling-packaging-cost"],
          productionCost: values["selling-production-cost"],
          operationalCost: values["selling-operational-cost"],
          platformFee: values["selling-platform-fee"],
          method,
          target: values["selling-target"],
          rounding,
          quantity: values["selling-quantity"]
        }
      };
    }

    function calculate(product) {
      const totalCost =
        product.itemCost +
        product.packagingCost +
        product.productionCost +
        product.operationalCost;

      if (!Number.isFinite(totalCost) || totalCost <= 0) {
        return { error: "Total biaya harus lebih dari Rp0." };
      }

      const platformRate = product.platformFee / 100;
      const targetRate = product.target / 100;
      let idealPrice;

      if (product.method === "markup") {
        idealPrice = totalCost * (1 + targetRate) / (1 - platformRate);
      } else {
        const remainingRate = 1 - platformRate - targetRate;

        if (remainingRate <= 0) {
          return {
            error: "Target margin dan biaya platform harus berjumlah kurang dari 100%."
          };
        }

        idealPrice = totalCost / remainingRate;
      }

      if (!Number.isFinite(idealPrice) || idealPrice < 0) {
        return { error: "Harga jual tidak dapat dihitung dari data ini." };
      }

      const step = product.rounding;
      const price = Math.ceil(idealPrice / step - 1e-10) * step;
      const platformCost = price * platformRate;
      const netProfit = price - platformCost - totalCost;
      const margin = price > 0 ? netProfit / price * 100 : 0;
      const estimatedProfit = netProfit * product.quantity;

      if (![price, platformCost, netProfit, margin, estimatedProfit].every(Number.isFinite)) {
        return { error: "Hasil perhitungan terlalu besar untuk ditampilkan." };
      }

      return {
        totalCost,
        idealPrice,
        price,
        platformCost,
        netProfit,
        margin,
        estimatedProfit
      };
    }

    function clearResults() {
      byId("selling-price-result").textContent = "—";
      byId("selling-net-profit").textContent = "—";
      byId("selling-margin-result").textContent = "—";
      byId("selling-estimated-profit").textContent = "—";
      byId("selling-total-cost").textContent = "—";
      byId("selling-platform-cost-result").textContent = "—";
    }

    function updateCalculation() {
      const formResult = readForm();

      if (formResult.error) {
        lastValidCalculation = null;
        clearResults();
        showMessage(formResult.error, "error");
        return;
      }

      const calculation = calculate(formResult.product);

      if (calculation.error) {
        lastValidCalculation = null;
        clearResults();
        showMessage(calculation.error, "error");
        return;
      }

      lastValidCalculation = {
        product: formResult.product,
        calculation
      };

      byId("selling-price-result").textContent = currency(calculation.price);
      byId("selling-net-profit").textContent = currency(calculation.netProfit);
      byId("selling-margin-result").textContent = percentage(calculation.margin);
      byId("selling-estimated-profit").textContent =
        currency(calculation.estimatedProfit);
      byId("selling-total-cost").textContent = currency(calculation.totalCost);
      byId("selling-platform-cost-result").textContent =
        currency(calculation.platformCost);

      showMessage("", "success");
    }

    function createSavedItem(product) {
      const calculation = calculate(product);
      const item = document.createElement("article");
      item.className = "selling-saved-item";

      const info = document.createElement("div");
      info.className = "selling-saved-info";

      const name = document.createElement("strong");
      name.textContent = product.name;

      const detail = document.createElement("span");
      detail.textContent = calculation.error
        ? calculation.error
        : `${currency(calculation.price)} · Untung bersih ${currency(calculation.netProfit)} / produk`;

      info.appendChild(name);
      info.appendChild(detail);

      const actions = document.createElement("div");
      actions.className = "selling-saved-actions";

      const loadButton = document.createElement("button");
      loadButton.type = "button";
      loadButton.textContent = "Muat";
      loadButton.dataset.action = "load";
      loadButton.dataset.id = product.id;
      loadButton.setAttribute("aria-label", `Muat ${product.name}`);

      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.className = "selling-delete";
      deleteButton.textContent = "Hapus";
      deleteButton.dataset.action = "delete";
      deleteButton.dataset.id = product.id;
      deleteButton.setAttribute("aria-label", `Hapus ${product.name}`);

      actions.appendChild(loadButton);
      actions.appendChild(deleteButton);
      item.appendChild(info);
      item.appendChild(actions);

      return item;
    }

    function renderSavedProducts() {
      while (savedList.firstChild) {
        savedList.removeChild(savedList.firstChild);
      }

      if (savedProducts.length === 0) {
        const empty = document.createElement("p");
        empty.className = "selling-empty";
        empty.textContent = "Belum ada produk tersimpan di perangkat ini.";
        savedList.appendChild(empty);
        return;
      }

      for (const product of savedProducts) {
        savedList.appendChild(createSavedItem(product));
      }
    }

    function startNewProduct() {
      editingId = null;
      form.reset();
      byId("selling-item-cost").value = "0";
      byId("selling-packaging-cost").value = "0";
      byId("selling-production-cost").value = "0";
      byId("selling-operational-cost").value = "0";
      byId("selling-platform-fee").value = "0";
      byId("selling-method").value = "markup";
      byId("selling-target").value = "30";
      byId("selling-rounding").value = "100";
      byId("selling-quantity").value = "10";
      saveButton.textContent = "Simpan produk";
      updateCalculation();
      byId("selling-name").focus();
    }

    function loadProduct(id) {
      const product = savedProducts.find((item) => item.id === id);

      if (!product) {
        showMessage("Produk tersimpan tidak ditemukan.", "error");
        return;
      }

      editingId = product.id;
      byId("selling-name").value = product.name;
      byId("selling-item-cost").value = String(product.itemCost);
      byId("selling-packaging-cost").value = String(product.packagingCost);
      byId("selling-production-cost").value = String(product.productionCost);
      byId("selling-operational-cost").value = String(product.operationalCost);
      byId("selling-platform-fee").value = String(product.platformFee);
      byId("selling-method").value = product.method;
      byId("selling-target").value = String(product.target);
      byId("selling-rounding").value = String(product.rounding);
      byId("selling-quantity").value = String(product.quantity);
      saveButton.textContent = "Simpan perubahan";
      updateCalculation();
      byId("selling-form").scrollIntoView({ behavior: "smooth", block: "start" });
    }

    form.addEventListener("input", updateCalculation);
    form.addEventListener("change", updateCalculation);

    form.addEventListener("submit", (event) => {
      event.preventDefault();

      const formResult = readForm();

      if (formResult.error) {
        updateCalculation();
        return;
      }

      const calculation = calculate(formResult.product);

      if (calculation.error) {
        updateCalculation();
        return;
      }

      const product = {
        ...formResult.product,
        id: editingId || `${Date.now()}-${Math.random().toString(36).slice(2)}`
      };

      let nextProducts;

      if (editingId) {
        nextProducts = savedProducts.map((item) =>
          item.id === editingId ? product : item
        );
      } else {
        if (savedProducts.length >= MAX_SAVED_PRODUCTS) {
          showMessage(`Maksimal ${MAX_SAVED_PRODUCTS} produk dapat disimpan.`, "error");
          return;
        }

        nextProducts = [product, ...savedProducts];
      }

      if (persistProducts(nextProducts)) {
        editingId = product.id;
        saveButton.textContent = "Simpan perubahan";
        renderSavedProducts();
        updateCalculation();
        showMessage(
          editingId && nextProducts.some((item) => item.id === product.id)
            ? "Produk tersimpan secara lokal di perangkat ini."
            : "Produk tersimpan.",
          "success"
        );
      }
    });

    newButton.addEventListener("click", startNewProduct);

    savedList.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-action]");

      if (!button || !savedList.contains(button)) {
        return;
      }

      const id = button.dataset.id;

      if (button.dataset.action === "load") {
        loadProduct(id);
        return;
      }

      if (button.dataset.action === "delete") {
        const product = savedProducts.find((item) => item.id === id);

        if (!product) {
          showMessage("Produk tersimpan tidak ditemukan.", "error");
          return;
        }

        const nextProducts = savedProducts.filter((item) => item.id !== id);

        if (persistProducts(nextProducts)) {
          if (editingId === id) {
            startNewProduct();
          }

          renderSavedProducts();
          showMessage(`“${product.name}” dihapus dari penyimpanan lokal.`, "success");
        }
      }
    });

    renderSavedProducts();
    startNewProduct();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeSellingPrice, { once: true });
  } else {
    initializeSellingPrice();
  }
})();