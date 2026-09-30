const bootstrapReady = new Promise((resolve, reject) => {
  const bootstrapScript = document.createElement("script");
  bootstrapScript.src = "./bootstrap-5.3.8-dist/js/bootstrap.bundle.min.js";
  bootstrapScript.onload = () => resolve(window.bootstrap);
  bootstrapScript.onerror = () => reject(new Error("Bootstrap bundle gagal dimuat."));
  document.head.appendChild(bootstrapScript);
});

// ---------- Menu data & rendering ----------
  const MENU = [
    { name: "Teh Tarik (Panas / Dingin)", price: 7000, cat: "minuman" },
    { name: "Kopi Susu (Panas / Dingin)", price: 7000, cat: "minuman" },
    { name: "Pizza Oriental", price: 13000, cat: "berat" },
    { name: "Pizza Meet", price: 13000, cat: "berat" },
    { name: "Mie Aceh (Rebus / Goreng / Pedas)", price: 15000, cat: "berat" },
    { name: "Kwetiaw Goreng", price: 10000, cat: "berat" },
    { name: "Roti Bakar Cokelat Keju", price: 5000, cat: "roti" },
    { name: "Roti Bakar Kacang Cokelat", price: 5000, cat: "roti" },
  ];
  const CAT_LABEL = { minuman: "Minuman", berat: "Makanan Berat", roti: "Roti Bakar" };
  const WA_NUMBER = "6281315971723";
  const rupiah = n => "Rp" + n.toLocaleString("id-ID");

  const grid = document.getElementById("menuGrid");
  const menuSearch = document.getElementById("menuSearch");
  const menuResultCount = document.getElementById("menuResultCount");
  let activeCategory = "all";
  let searchTerm = "";

  function renderMenu() {
    grid.innerHTML = "";
    const normalizedSearch = searchTerm.trim().toLocaleLowerCase("id-ID");
    const filteredMenu = MENU.filter(item => {
      const matchesCategory = activeCategory === "all" || item.cat === activeCategory;
      const matchesSearch = item.name.toLocaleLowerCase("id-ID").includes(normalizedSearch)
        || CAT_LABEL[item.cat].toLocaleLowerCase("id-ID").includes(normalizedSearch);
      return matchesCategory && matchesSearch;
    });
    menuResultCount.textContent = `${filteredMenu.length} menu ditemukan`;
    if (filteredMenu.length === 0) {
      grid.innerHTML = '<p class="menu-empty">Menu tidak ditemukan. Coba kata kunci lain.</p>';
      return;
    }
    filteredMenu.forEach(item => {
      const card = document.createElement("div");
      card.className = "menu-card card";
      const menuIndex = MENU.indexOf(item);
      card.innerHTML = `
        <div class="menu-card-top">
          <div>
            <span class="cat badge text-bg-warning">${CAT_LABEL[item.cat]}</span>
            <h4>${item.name}</h4>
          </div>
          <span class="price-tag">${rupiah(item.price)}</span>
        </div>
        <div class="menu-order-controls">
          <label class="menu-quantity-label">Jumlah
            <input class="menu-quantity" type="number" min="1" max="99" value="1" inputmode="numeric" aria-label="Jumlah ${item.name}">
          </label>
          <button class="add-to-order btn btn-primary" type="button" data-add-menu="${menuIndex}">Tambah</button>
        </div>
      `;
      grid.appendChild(card);
    });
  }
  renderMenu();

  // ---------- Order calculator ----------
  const orderList = document.getElementById("orderList");
  const orderCount = document.getElementById("orderCount");
  const orderEmpty = document.getElementById("orderEmpty");
  const orderTotal = document.getElementById("orderTotal");
  const clearOrder = document.getElementById("clearOrder");
  const sendOrder = document.getElementById("sendOrder");
  const orderToast = document.getElementById("orderToast");
  const orderToastText = document.getElementById("orderToastText");
  const orderCart = new Map();
  let orderToastTimer;

  function showOrderToast(message) {
    orderToastText.textContent = message;
    orderToast.classList.remove("is-visible");
    window.clearTimeout(orderToastTimer);
    window.requestAnimationFrame(() => orderToast.classList.add("is-visible"));
    orderToastTimer = window.setTimeout(() => orderToast.classList.remove("is-visible"), 2400);
  }

  function renderOrderCart() {
    const rows = [...orderCart.entries()].map(([menuIndex, quantity]) => ({
      item: MENU[menuIndex],
      menuIndex,
      quantity,
      subtotal: MENU[menuIndex].price * quantity,
    }));
    const itemCount = rows.reduce((sum, row) => sum + row.quantity, 0);
    const total = rows.reduce((sum, row) => sum + row.subtotal, 0);

    orderList.replaceChildren();
    orderEmpty.hidden = rows.length > 0;
    orderCount.textContent = rows.length ? `${itemCount} porsi · ${rows.length} jenis menu` : "Belum ada item";
    orderTotal.textContent = rupiah(total);
    clearOrder.disabled = rows.length === 0;

    rows.forEach(({ item, menuIndex, quantity, subtotal }) => {
      const line = document.createElement("li");
      line.className = "order-line";
      const details = document.createElement("div");
      const name = document.createElement("strong");
      name.className = "order-line-name";
      name.textContent = item.name;
      const price = document.createElement("span");
      price.className = "order-line-price";
      price.textContent = `${rupiah(item.price)} × ${quantity}`;
      details.append(name, price);

      const tools = document.createElement("div");
      tools.className = "order-line-tools";
      const subtotalLabel = document.createElement("span");
      subtotalLabel.className = "order-line-subtotal";
      subtotalLabel.textContent = rupiah(subtotal);
      const decrease = document.createElement("button");
      decrease.className = "order-quantity-control";
      decrease.type = "button";
      decrease.dataset.cartDelta = "-1";
      decrease.dataset.menuIndex = menuIndex;
      decrease.setAttribute("aria-label", `Kurangi ${item.name}`);
      decrease.textContent = "-";
      const quantityLabel = document.createElement("span");
      quantityLabel.className = "order-quantity-value";
      quantityLabel.textContent = quantity;
      const increase = document.createElement("button");
      increase.className = "order-quantity-control";
      increase.type = "button";
      increase.dataset.cartDelta = "1";
      increase.dataset.menuIndex = menuIndex;
      increase.setAttribute("aria-label", `Tambah ${item.name}`);
      increase.textContent = "+";
      tools.append(subtotalLabel, decrease, quantityLabel, increase);
      line.append(details, tools);
      orderList.appendChild(line);
    });

    if (rows.length) {
      const message = [
        "Halo, saya mau pesan:",
        ...rows.map(row => `- ${row.item.name} x ${row.quantity} = ${rupiah(row.subtotal)}`),
        `Total: ${rupiah(total)}`,
      ].join("\n");
      sendOrder.href = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(message)}`;
    } else {
      sendOrder.href = "#menu";
    }
    sendOrder.setAttribute("aria-disabled", rows.length ? "false" : "true");
    sendOrder.classList.toggle("is-disabled", rows.length === 0);
  }

  grid.addEventListener("click", event => {
    const button = event.target.closest("[data-add-menu]");
    if (!button) return;
    const menuIndex = Number(button.dataset.addMenu);
    const quantityInput = button.closest(".menu-card").querySelector(".menu-quantity");
    const requestedQuantity = Math.max(1, Math.min(99, Number.parseInt(quantityInput.value, 10) || 1));
    const previousQuantity = orderCart.get(menuIndex) || 0;
    const nextQuantity = Math.min(99, previousQuantity + requestedQuantity);
    orderCart.set(menuIndex, nextQuantity);
    renderOrderCart();
    showOrderToast(`${nextQuantity - previousQuantity} × ${MENU[menuIndex].name} ditambahkan`);
  });

  orderList.addEventListener("click", event => {
    const button = event.target.closest("[data-cart-delta]");
    if (!button) return;
    const menuIndex = Number(button.dataset.menuIndex);
    const nextQuantity = (orderCart.get(menuIndex) || 0) + Number(button.dataset.cartDelta);
    if (nextQuantity > 0) orderCart.set(menuIndex, nextQuantity);
    else orderCart.delete(menuIndex);
    renderOrderCart();
  });

  clearOrder.addEventListener("click", () => {
    orderCart.clear();
    renderOrderCart();
  });
  sendOrder.addEventListener("click", event => {
    if (orderCart.size === 0) event.preventDefault();
  });
  renderOrderCart();

  // ---------- Food gallery slideshow ----------
  const foodSlides = [
    "GALERI MAKAN1.jpg",
    "GALERI MAKAN2.jpg",
    "GALERI MAKAN 3.jpg",
    "GALERI MAKAN 4.jpg",
    "GALERI MAKAN 5.jpg",
  ];
  const foodSlideImage = document.getElementById("foodSlideImage");
  const foodSlideCount = document.getElementById("foodSlideCount");
  const foodSlideDots = document.getElementById("foodSlideDots");
  const foodSlideshow = document.getElementById("foodSlideshow");
  let currentFoodSlide = 0;
  let foodSlideTimer;

  function showFoodSlide(index) {
    currentFoodSlide = (index + foodSlides.length) % foodSlides.length;
    foodSlideImage.classList.remove("is-changing");
    foodSlideImage.src = foodSlides[currentFoodSlide];
    foodSlideImage.alt = `Foto makanan Kedai Roti Ibu Saya ${currentFoodSlide + 1}`;
    foodSlideCount.textContent = `${String(currentFoodSlide + 1).padStart(2, "0")} / ${String(foodSlides.length).padStart(2, "0")}`;
    foodSlideImage.classList.add("is-changing");
    foodSlideDots.querySelectorAll(".slide-dot").forEach((dot, dotIndex) => {
      dot.setAttribute("aria-current", dotIndex === currentFoodSlide ? "true" : "false");
    });
  }

  foodSlides.forEach((_, index) => {
    const dot = document.createElement("button");
    dot.className = "slide-dot";
    dot.type = "button";
    dot.setAttribute("aria-label", `Tampilkan foto ${index + 1}`);
    dot.setAttribute("aria-current", index === 0 ? "true" : "false");
    dot.addEventListener("click", () => showFoodSlide(index));
    foodSlideDots.appendChild(dot);
  });
  document.getElementById("foodSlidePrevious").addEventListener("click", () => showFoodSlide(currentFoodSlide - 1));
  document.getElementById("foodSlideNext").addEventListener("click", () => showFoodSlide(currentFoodSlide + 1));

  function startFoodSlideshow() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || document.hidden) return;
    window.clearInterval(foodSlideTimer);
    foodSlideTimer = window.setInterval(() => showFoodSlide(currentFoodSlide + 1), 4500);
  }
  function stopFoodSlideshow() {
    window.clearInterval(foodSlideTimer);
  }
  foodSlideshow.addEventListener("mouseenter", stopFoodSlideshow);
  foodSlideshow.addEventListener("mouseleave", startFoodSlideshow);
  foodSlideshow.addEventListener("focusin", stopFoodSlideshow);
  foodSlideshow.addEventListener("focusout", startFoodSlideshow);
  document.addEventListener("visibilitychange", () => document.hidden ? stopFoodSlideshow() : startFoodSlideshow());
  startFoodSlideshow();

  menuSearch.addEventListener("input", () => {
    searchTerm = menuSearch.value;
    renderMenu();
  });

  document.getElementById("menuTabs").addEventListener("click", e => {
    const btn = e.target.closest(".tab-btn");
    if (!btn) return;
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    activeCategory = btn.dataset.cat;
    renderMenu();
  });

  // Store hours use the kedai's Asia/Jakarta time, including when visitors are abroad.
  const storeStatus = document.getElementById("storeStatus");
  const storeStatusText = document.getElementById("storeStatusText");
  function updateStoreStatus() {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Jakarta",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(new Date());
    const hour = Number(parts.find(part => part.type === "hour").value);
    const minute = Number(parts.find(part => part.type === "minute").value);
    const currentMinutes = hour * 60 + minute;
    const isOpen = currentMinutes >= 480 && currentMinutes < 1290;
    storeStatus.classList.toggle("is-open", isOpen);
    storeStatusText.textContent = isOpen ? "Buka sekarang · tutup pukul 21.30" : "Tutup · buka pukul 08.00";
  }
  updateStoreStatus();
  setInterval(updateStoreStatus, 60000);

  const copyAddress = document.getElementById("copyAddress");
  const address = "Jl. Tamansari No.66, Lb. Siliwangi, Kec. Coblong, Kota Bandung, Jawa Barat 40132";
  copyAddress.addEventListener("click", async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(address);
      } else {
        const temporaryInput = document.createElement("textarea");
        temporaryInput.value = address;
        temporaryInput.style.position = "fixed";
        temporaryInput.style.opacity = "0";
        document.body.appendChild(temporaryInput);
        temporaryInput.select();
        document.execCommand("copy");
        temporaryInput.remove();
      }
      copyAddress.textContent = "Alamat tersalin";
    } catch (error) {
      copyAddress.textContent = "Tidak dapat menyalin";
    }
    window.setTimeout(() => { copyAddress.textContent = "Salin alamat"; }, 2200);
  });

  // ---------- Mobile nav ----------
  const navLinks = document.getElementById("navLinks");
  const menuToggle = document.getElementById("menuToggle");
  let navCollapse;
  bootstrapReady.then(({ Collapse }) => {
    navLinks.classList.add("collapse");
    navCollapse = Collapse.getOrCreateInstance(navLinks, { toggle: false });
    navLinks.addEventListener("shown.bs.collapse", () => menuToggle.setAttribute("aria-expanded", "true"));
    navLinks.addEventListener("hidden.bs.collapse", () => menuToggle.setAttribute("aria-expanded", "false"));
  }).catch(() => {});
  menuToggle.addEventListener("click", () => {
    const open = menuToggle.getAttribute("aria-expanded") !== "true";
    if (navCollapse) {
      navCollapse.toggle();
    } else {
      navLinks.classList.toggle("open", open);
    }
    menuToggle.setAttribute("aria-expanded", open ? "true" : "false");
  });
  navLinks.querySelectorAll("a").forEach(a => a.addEventListener("click", () => {
    if (navCollapse) navCollapse.hide();
    navLinks.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
  }));

  // ---------- Popup promo ----------
  const overlay = document.getElementById("promoOverlay");
  const popupClose = document.getElementById("popupClose");
  const popup = overlay.querySelector(".popup");
  const popupContent = document.createElement("div");
  popupContent.className = "modal-content popup-content";
  while (popup.firstChild) popupContent.appendChild(popup.firstChild);
  popup.appendChild(popupContent);
  popup.classList.add("modal-dialog", "modal-dialog-centered");
  popup.removeAttribute("role");
  popup.removeAttribute("aria-modal");
  popup.removeAttribute("aria-labelledby");
  overlay.classList.add("modal", "fade");
  overlay.setAttribute("tabindex", "-1");
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-labelledby", "popupTitle");
  let promoModal;
  bootstrapReady.then(({ Modal }) => {
    promoModal = Modal.getOrCreateInstance(overlay);
  }).catch(() => {});

  function openPopup() {
    bootstrapReady.then(({ Modal }) => {
      promoModal = promoModal || Modal.getOrCreateInstance(overlay);
      promoModal.show();
    }).catch(() => {
      overlay.style.display = "block";
      overlay.classList.add("show");
      overlay.setAttribute("aria-hidden", "false");
    });
  }
  function closePopup() {
    if (promoModal) promoModal.hide();
    else {
      overlay.classList.remove("show");
      overlay.setAttribute("aria-hidden", "true");
    }
  }
  popupClose.addEventListener("click", closePopup);
  overlay.addEventListener("hidden.bs.modal", () => {
    try { sessionStorage.setItem("kris_promo_shown", "1"); } catch (e) {}
  });

  window.addEventListener("load", () => {
    let alreadyShown = false;
    try { alreadyShown = sessionStorage.getItem("kris_promo_shown") === "1"; } catch (e) {}
    if (!alreadyShown) setTimeout(openPopup, 900);
  });

  // ---------- Footer year ----------
  document.getElementById("year").textContent = new Date().getFullYear();
