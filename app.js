const form = document.querySelector("#assistantForm");
const input = document.querySelector("#assistantInput");
const messages = document.querySelector("#chatMessages");
const promptButtons = document.querySelectorAll("[data-prompt]");

const knowledgeBase = [
  {
    keywords: ["digital", "msp", "proizvod", "it", "software"],
    response:
      "Za digitalizacijske razpise običajno preverite: velikost podjetja, upravičene stroške, dokazila o finančni sposobnosti, časovnico izvedbe in skladnost z razpisnimi cilji. Priporočam, da pripravite kratek opis projekta, reference ekipe, finančni načrt in seznam merljivih učinkov.",
  },
  {
    keywords: ["grad", "javno naro", "ponud", "primerno"],
    response:
      "Pri gradbenem javnem naročilu najprej preverite CPV klasifikacijo, reference v zadnjih letih, zahtevane kadre, zavarovanja, bonitetne pogoje in obvezne obrazce. Če pogojev ne izpolnjujete sami, razmislite o partnerju ali podizvajalcu.",
  },
  {
    keywords: ["kontrol", "e-jn", "ejn", "oddaj", "check"],
    response:
      "Kontrolni seznam za oddajo: 1) prenesite zadnjo dokumentacijo, 2) označite rok za vprašanja in oddajo, 3) zberite izjave in dokazila, 4) pripravite predračun, 5) preverite elektronski podpis, 6) naložite dokumente v e-JN, 7) shranite potrdilo o oddaji.",
  },
];

function addMessage(role, text) {
  const article = document.createElement("article");
  article.className = `message ${role === "user" ? "user-message" : "assistant-message"}`;

  const label = document.createElement("span");
  label.textContent = role === "user" ? "Vi" : "AI";

  const paragraph = document.createElement("p");
  paragraph.textContent = text;

  article.append(label, paragraph);
  messages.append(article);
  messages.scrollTop = messages.scrollHeight;
}

function buildAssistantResponse(question) {
  const normalizedQuestion = question.toLowerCase();
  const match = knowledgeBase.find((entry) =>
    entry.keywords.some((keyword) => normalizedQuestion.includes(keyword)),
  );

  if (match) {
    return match.response;
  }

  return "Predlagam naslednji postopek: povzemite cilj razpisa, rok, upravičence, obvezna dokazila, merila ocenjevanja in omejitve stroškov. Nato primerjajte pogoje s profilom podjetja ter pripravite seznam odprtih vprašanj za naročnika ali razpisovalca.";
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const question = input.value.trim();

  if (!question) {
    return;
  }

  addMessage("user", question);
  input.value = "";

  window.setTimeout(() => {
    addMessage("assistant", buildAssistantResponse(question));
  }, 350);
});

promptButtons.forEach((button) => {
  button.addEventListener("click", () => {
    input.value = button.dataset.prompt;
    input.focus();
  });
});
