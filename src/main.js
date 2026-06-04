const STORAGE_KEY = "normiranSpInvoiceApp";
const DEFAULT_VAT_CLAUSE =
  "DDV ni obračunan na podlagi 1. odstavka 94. člena ZDDV-1 (mali davčni zavezanec).";

const defaultData = {
  issuerName: "Vaše ime in priimek s.p.",
  issuerTax: "12345678",
  issuerAddress: "Ulica 1, 1000 Ljubljana",
  issuerIban: "SI56 0000 0000 0000 000",
  issuerEmail: "info@example.si",
  issuerPhone: "+386 40 000 000",
  clientName: "Naročnik d.o.o.",
  clientTax: "SI12345678",
  clientAddress: "Naročnikova cesta 10, 2000 Maribor",
  invoiceNumber: buildInvoiceNumber(),
  issueDate: todayIso(),
  serviceDate: todayIso(),
  dueDate: addDaysIso(8),
  place: "Ljubljana",
  reference: "SI00 " + new Date().getFullYear(),
  vatClause: DEFAULT_VAT_CLAUSE,
  notes: "Prosimo, da znesek poravnate do roka plačila na navedeni TRR.",
  items: [
    {
      description: "Svetovalne storitve",
      quantity: 1,
      unit: "kos",
      price: 300,
      discount: 0,
    },
  ],
};

const form = document.querySelector("#invoiceForm");
const itemsList = document.querySelector("#itemsList");
const preview = document.querySelector("#invoicePreview");
const toast = document.querySelector("#toast");

let state = loadState();

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function addDaysIso(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function buildInvoiceNumber() {
  const year = new Date().getFullYear();
  return `${year}-001`;
}

function loadState() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return stored ? { ...defaultData, ...stored, items: stored.items?.length ? stored.items : defaultData.items } : defaultData;
  } catch {
    return defaultData;
  }
}

function saveState(showMessage = false) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  if (showMessage) showToast("Račun je shranjen v tem brskalniku.");
}

function hydrateForm() {
  Object.entries(state).forEach(([key, value]) => {
    const field = form.elements[key];
    if (field && typeof value !== "object") field.value = value;
  });
  renderItems();
  renderPreview();
}

function collectFormData() {
  const data = new FormData(form);
  const values = Object.fromEntries(data.entries());
  state = {
    ...state,
    ...values,
    items: collectItems(),
  };
}

function collectItems() {
  return [...itemsList.querySelectorAll(".item-row")].map((row) => ({
    description: row.querySelector('[name="description"]').value,
    quantity: parseNumber(row.querySelector('[name="quantity"]').value),
    unit: row.querySelector('[name="unit"]').value,
    price: parseNumber(row.querySelector('[name="price"]').value),
    discount: parseNumber(row.querySelector('[name="discount"]').value),
  }));
}

function parseNumber(value) {
  const normalized = String(value).replace(".", "").replace(",", ".");
  const number = Number.parseFloat(normalized);
  return Number.isFinite(number) ? number : 0;
}

function formatMoney(value) {
  return new Intl.NumberFormat("sl-SI", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(value);
}

function formatDate(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("sl-SI").format(new Date(`${value}T00:00:00`));
}

function calculateLine(item) {
  const subtotal = item.quantity * item.price;
  const discountAmount = subtotal * (item.discount / 100);
  return Math.max(subtotal - discountAmount, 0);
}

function calculateTotals() {
  const net = state.items.reduce((sum, item) => sum + calculateLine(item), 0);
  return {
    net,
    vat: 0,
    gross: net,
  };
}

function renderItems() {
  itemsList.innerHTML = "";
  state.items.forEach((item, index) => {
    const row = document.createElement("div");
    row.className = "item-row";
    row.innerHTML = `
      <label class="item-row__description">
        Opis
        <input name="description" value="${escapeAttribute(item.description)}" required />
      </label>
      <label>
        Količina
        <input name="quantity" inputmode="decimal" value="${item.quantity}" required />
      </label>
      <label>
        Enota
        <input name="unit" value="${escapeAttribute(item.unit)}" required />
      </label>
      <label>
        Cena brez DDV
        <input name="price" inputmode="decimal" value="${item.price}" required />
      </label>
      <label>
        Popust %
        <input name="discount" inputmode="decimal" value="${item.discount}" />
      </label>
      <button class="button button--danger" type="button" aria-label="Odstrani postavko ${index + 1}">×</button>
    `;
    row.querySelector("button").addEventListener("click", () => {
      state.items.splice(index, 1);
      if (!state.items.length) state.items.push({ description: "", quantity: 1, unit: "kos", price: 0, discount: 0 });
      renderItems();
      renderPreview();
      saveState();
    });
    row.addEventListener("input", () => {
      collectFormData();
      renderPreview();
      saveState();
    });
    itemsList.append(row);
  });
}

function renderPreview() {
  const totals = calculateTotals();
  preview.innerHTML = `
    <div class="invoice__header">
      <div>
        <p class="invoice__label">Račun</p>
        <h2>${escapeHtml(state.invoiceNumber)}</h2>
      </div>
      <div class="invoice__issuer">
        <strong>${escapeHtml(state.issuerName)}</strong>
        <span>${escapeHtml(state.issuerAddress)}</span>
        <span>DŠ: ${escapeHtml(state.issuerTax)}</span>
        <span>${escapeHtml(state.issuerEmail)}</span>
        <span>${escapeHtml(state.issuerPhone)}</span>
      </div>
    </div>

    <div class="invoice__meta">
      <div><span>Kraj in datum izdaje</span><strong>${escapeHtml(state.place)}, ${formatDate(state.issueDate)}</strong></div>
      <div><span>Datum opravljene storitve</span><strong>${formatDate(state.serviceDate)}</strong></div>
      <div><span>Rok plačila</span><strong>${formatDate(state.dueDate)}</strong></div>
      <div><span>Sklic</span><strong>${escapeHtml(state.reference || "—")}</strong></div>
    </div>

    <div class="invoice__parties">
      <section>
        <h3>Izdajatelj</h3>
        <p>${escapeHtml(state.issuerName)}</p>
        <p>${escapeHtml(state.issuerAddress)}</p>
        <p>Davčna številka: ${escapeHtml(state.issuerTax)}</p>
        <p>TRR: ${escapeHtml(state.issuerIban)}</p>
      </section>
      <section>
        <h3>Naročnik</h3>
        <p>${escapeHtml(state.clientName)}</p>
        <p>${escapeHtml(state.clientAddress)}</p>
        <p>${state.clientTax ? `Davčna številka / ID: ${escapeHtml(state.clientTax)}` : ""}</p>
      </section>
    </div>

    <table class="invoice__table">
      <thead>
        <tr>
          <th>Opis</th>
          <th>Količina</th>
          <th>Cena</th>
          <th>Popust</th>
          <th>Znesek</th>
        </tr>
      </thead>
      <tbody>
        ${state.items
          .map(
            (item) => `
              <tr>
                <td>${escapeHtml(item.description)}</td>
                <td>${item.quantity} ${escapeHtml(item.unit)}</td>
                <td>${formatMoney(item.price)}</td>
                <td>${item.discount || 0}%</td>
                <td>${formatMoney(calculateLine(item))}</td>
              </tr>
            `,
          )
          .join("")}
      </tbody>
    </table>

    <div class="invoice__totals">
      <div><span>Skupaj brez DDV</span><strong>${formatMoney(totals.net)}</strong></div>
      <div><span>DDV 0 %</span><strong>${formatMoney(totals.vat)}</strong></div>
      <div class="invoice__grand-total"><span>Za plačilo</span><strong>${formatMoney(totals.gross)}</strong></div>
    </div>

    <div class="invoice__notes">
      <p><strong>Klavzula:</strong> ${escapeHtml(state.vatClause || DEFAULT_VAT_CLAUSE)}</p>
      <p>${escapeHtml(state.notes || "")}</p>
    </div>
  `;
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
  })[character]);
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/'/g, "&#39;");
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("toast--visible");
  window.setTimeout(() => toast.classList.remove("toast--visible"), 2800);
}

function download(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function buildCsv() {
  const rows = [
    ["Racun", state.invoiceNumber],
    ["Datum izdaje", state.issueDate],
    ["Naročnik", state.clientName],
    [],
    ["Opis", "Količina", "Enota", "Cena brez DDV", "Popust %", "Znesek"],
    ...state.items.map((item) => [
      item.description,
      item.quantity,
      item.unit,
      item.price.toFixed(2),
      item.discount,
      calculateLine(item).toFixed(2),
    ]),
    [],
    ["Skupaj", calculateTotals().gross.toFixed(2)],
  ];
  return rows.map((row) => row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
}

function makeNextInvoice() {
  const match = state.invoiceNumber.match(/^(.*?)(\d+)$/);
  const nextNumber = match
    ? `${match[1]}${String(Number(match[2]) + 1).padStart(match[2].length, "0")}`
    : buildInvoiceNumber();
  state = {
    ...state,
    clientName: "",
    clientTax: "",
    clientAddress: "",
    invoiceNumber: nextNumber,
    issueDate: todayIso(),
    serviceDate: todayIso(),
    dueDate: addDaysIso(8),
    reference: "",
    notes: defaultData.notes,
    items: [{ description: "", quantity: 1, unit: "kos", price: 0, discount: 0 }],
  };
  hydrateForm();
  saveState(true);
}

form.addEventListener("input", () => {
  collectFormData();
  renderPreview();
  saveState();
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  collectFormData();
  saveState(true);
  renderPreview();
});

document.querySelector("#addItem").addEventListener("click", () => {
  collectFormData();
  state.items.push({ description: "", quantity: 1, unit: "kos", price: 0, discount: 0 });
  renderItems();
  saveState();
});

document.querySelector("#newInvoice").addEventListener("click", makeNextInvoice);

document.querySelectorAll("#printInvoice, #printInvoiceAside").forEach((button) => {
  button.addEventListener("click", () => {
    collectFormData();
    renderPreview();
    window.print();
  });
});

document.querySelector("#exportJson").addEventListener("click", () => {
  collectFormData();
  download(`racun-${state.invoiceNumber}.json`, JSON.stringify(state, null, 2), "application/json");
});

document.querySelector("#downloadCsv").addEventListener("click", () => {
  collectFormData();
  download(`racun-${state.invoiceNumber}.csv`, buildCsv(), "text/csv;charset=utf-8");
});

document.querySelector("#importJson").addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    const imported = JSON.parse(await file.text());
    state = { ...defaultData, ...imported, items: imported.items?.length ? imported.items : defaultData.items };
    hydrateForm();
    saveState(true);
  } catch {
    showToast("Uvoz ni uspel. Preveri, ali je datoteka veljaven JSON izvoz aplikacije.");
  } finally {
    event.target.value = "";
  }
});

hydrateForm();
