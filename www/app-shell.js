(() => {
  function initializeSidebar() {
    const sidebar = document.querySelector(".app-sidebar");

    if (!sidebar) {
      console.error("Sidebar tidak ditemukan. Periksa index.html yang sedang dibuka.");
      return;
    }

    function showMessage(message) {
      let status = document.getElementById("sidebar-status");

      if (!status) {
        status = document.createElement("p");
        status.id = "sidebar-status";
        status.setAttribute("role", "status");
        status.setAttribute("aria-live", "polite");
        status.style.cssText =
          "margin:12px 8px;padding:10px;border-radius:10px;background:rgba(255,170,170,.1);color:#ffaaaa;font-size:12px;line-height:1.5";
        sidebar.appendChild(status);
      }

      status.textContent = message;
    }

    function showView(viewId) {
      const targetView = document.getElementById(viewId);
      const views = document.querySelectorAll(".app-view");

      if (!targetView) {
        showMessage(`Halaman "${viewId}" tidak ditemukan. Periksa ID section di index.html.`);
        console.error(`Halaman fitur "${viewId}" tidak ditemukan.`);
        return false;
      }

      views.forEach((view) => {
        view.hidden = view !== targetView;
      });

      document.querySelectorAll(".sidebar-link[data-view]").forEach((button) => {
        const isActive = button.getAttribute("data-view") === viewId;

        button.classList.toggle("is-active", isActive);

        if (isActive) {
          button.setAttribute("aria-current", "page");
        } else {
          button.removeAttribute("aria-current");
        }
      });

      const status = document.getElementById("sidebar-status");
      if (status) {
        status.textContent = "";
      }

      return true;
    }

    function openTool(toolName) {
      const toolConfig = {
        unit: {
          buttonSelector: ".unit-converter-open",
          dialogId: "unit-converter-dialog",
          label: "Konversi satuan"
        },
        percentage: {
          buttonSelector: ".percentage-tools-open",
          dialogId: "percentage-tools-dialog",
          label: "Persentase & diskon"
        }
      };

      const config = toolConfig[toolName];

      if (!config) {
        showMessage("Fitur yang dipilih tidak dikenali.");
        return;
      }

      if (!showView("calculator-view")) {
        return;
      }

      const toolButton = document.querySelector(config.buttonSelector);

      if (toolButton) {
        toolButton.click();
        return;
      }

      const dialog = document.getElementById(config.dialogId);

      if (dialog && typeof dialog.showModal === "function") {
        dialog.showModal();
        return;
      }

      showMessage(
        `${config.label} belum tersedia. Pastikan file JavaScript fitur dimuat oleh index.html.`
      );
      console.error(`Tombol atau dialog untuk fitur "${toolName}" tidak ditemukan.`);
    }

    sidebar.addEventListener("click", (event) => {
      const button = event.target.closest("button");

      if (!button || !sidebar.contains(button)) {
        return;
      }

      if (button.hasAttribute("data-view")) {
        event.preventDefault();
        showView(button.getAttribute("data-view"));
        return;
      }

      if (button.hasAttribute("data-tool")) {
        event.preventDefault();
        openTool(button.getAttribute("data-tool"));
      }
    });

    document.querySelectorAll(".app-view").forEach((view) => {
      view.hidden = view.id !== "calculator-view";
    });

    const initialView = document.getElementById("price-view");
    if (initialView && window.location.hash === "#price-view") {
      showView("price-view");
    } else {
      showView("calculator-view");
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeSidebar, { once: true });
  } else {
    initializeSidebar();
  }
})();