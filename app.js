const form = document.querySelector("#assistantForm");
const input = document.querySelector("#assistantInput");
const messages = document.querySelector("#chatMessages");
const promptButtons = document.querySelectorAll("[data-prompt]");
const tenderList = document.querySelector("#tenderList");

const tenders = Array.isArray(window.RAZPISI) ? window.RAZPISI : [];
const relativeDateFormatter = new Intl.RelativeTimeFormat("sl", { numeric: "auto" });

function parseTenderDate(date) {
  const parsedDate = new Date(`${date}T12:00:00`);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

function formatDate(date) {
  return new Intl.DateTimeFormat("sl-SI", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function daysUntil(date) {
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const targetDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.round((targetDay - startOfToday) / 86_400_000);
}

function formatDeadline(date) {
  const days = daysUntil(date);
  const relative = relativeDateFormatter.format(days, "day");
  return `${formatDate(date)} (${relative})`;
}

function normalizeText(text) {
  return String(text)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function tenderSearchText(tender) {
  return normalizeText(
    [
      tender.id,
      tender.naziv,
      tender.področje,
      tender.naročnik,
      tender.upravičenci,
      tender.vrednost,
      tender.povzetek,
      ...(tender.ključneBesede || []),
      ...(tender.pogoji || []),
      ...(tender.dokazila || []),
      ...(tender.priloge || []).flatMap((attachment) => [attachment.naziv, attachment.opis, attachment.url]),
    ].join(" "),
  );
}

function extractSearchTerms(question) {
  const ignoredWords = new Set([
    "ali",
    "ima",
    "imamo",
    "isce",
    "iscem",
    "kateri",
    "kaksni",
    "kaksna",
    "razpis",
    "razpisi",
    "razpise",
    "razpisov",
    "povej",
    "povzemi",
    "prosim",
    "potrebujem",
    "slovenija",
    "sloveniji",
    "za",
    "in",
    "po",
    "v",
    "na",
    "so",
    "je",
    "mi",
    "rok",
    "roki",
    "pogoj",
    "pogoji",
    "dokazila",
    "pdf",
    "pdfji",
    "pdf-ji",
    "priloga",
    "priloge",
    "dokumentacija",
  ]);

  return normalizeText(question)
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !ignoredWords.has(word));
}

function extractDayWindow(question) {
  const match = normalizeText(question).match(/(?:v\s+)?naslednjih\s+(\d{1,3})\s+dn(?:i|eh)/);
  return match ? Number(match[1]) : null;
}

function scoreTender(tender, terms) {
  const haystack = tenderSearchText(tender);
  return terms.reduce((score, term) => {
    if (!haystack.includes(term)) {
      return score;
    }

    const keywordHit = (tender.ključneBesede || []).some((keyword) => normalizeText(keyword).includes(term));
    return score + (keywordHit ? 3 : 1);
  }, 0);
}

function findMatchingTenders(question) {
  const terms = extractSearchTerms(question);

  if (terms.length === 0) {
    return [...tenders].sort((a, b) => new Date(a.rok) - new Date(b.rok)).slice(0, 3);
  }

  return tenders
    .map((tender) => ({ tender, score: scoreTender(tender, terms) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || new Date(a.tender.rok) - new Date(b.tender.rok))
    .map(({ tender }) => tender);
}

function renderTenderList() {
  if (!tenderList) {
    return;
  }

  tenderList.innerHTML = "";

  tenders.forEach((tender) => {
    const deadline = parseTenderDate(tender.rok);
    const article = document.createElement("article");
    const category = document.createElement("span");
    const title = document.createElement("strong");
    const owner = document.createElement("small");
    const dueDate = document.createElement("small");
    const attachmentCount = document.createElement("small");
    const attachmentList = document.createElement("div");

    article.className = "tender-card";
    attachmentList.className = "attachment-list";
    category.textContent = tender.področje;
    title.textContent = tender.naziv;
    owner.textContent = tender.naročnik;
    dueDate.textContent = `Rok: ${deadline ? formatDeadline(deadline) : tender.rok}`;
    attachmentCount.textContent = `PDF priloge: ${tender.priloge?.length || 0}`;

    (tender.priloge || []).forEach((attachment) => {
      const link = document.createElement("a");
      link.href = attachment.url;
      link.target = "_blank";
      link.rel = "noreferrer";
      link.textContent = attachment.naziv;
      attachmentList.append(link);
    });

    article.append(category, title, owner, dueDate, attachmentCount, attachmentList);
    tenderList.append(article);
  });
}

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

function formatAttachmentList(tender) {
  const attachments = tender.priloge || [];

  if (attachments.length === 0) {
    return "PDF priloge niso dodane.";
  }

  return attachments.map((attachment) => `${attachment.naziv} (${attachment.url})`).join(", ");
}

function buildTenderSummary(tender) {
  const deadline = parseTenderDate(tender.rok);
  const proofList = tender.dokazila.slice(0, 4).join(", ");
  const conditionList = tender.pogoji.slice(0, 3).join("; ");
  const attachmentList = formatAttachmentList(tender);

  return `${tender.naziv} (${tender.id}) — naročnik: ${tender.naročnik}; področje: ${tender.področje}; rok: ${
    deadline ? formatDeadline(deadline) : tender.rok
  }; vrednost: ${tender.vrednost}. Povzetek: ${tender.povzetek} Ključni pogoji: ${conditionList}. Dokazila: ${proofList}. PDF priloge: ${attachmentList}.`;
}

function buildAssistantResponse(question) {
  if (tenders.length === 0) {
    return "V ozadju trenutno ni naloženih razpisov. Dodajte jih v datoteko razpisi.js v polje window.RAZPISI, nato osvežite stran.";
  }

  const normalizedQuestion = normalizeText(question);
  const matches = findMatchingTenders(question);

  if (normalizedQuestion.includes("pdf") || normalizedQuestion.includes("prilog") || normalizedQuestion.includes("dokumentacija")) {
    const attachmentTenders = matches.length > 0 ? matches : tenders;
    return `PDF priloge za relevantne razpise: ${attachmentTenders
      .slice(0, 3)
      .map((tender) => `${tender.naziv}: ${formatAttachmentList(tender)}`)
      .join(" ")}`;
  }

  if (normalizedQuestion.includes("rok") || normalizedQuestion.includes("kmalu") || normalizedQuestion.includes("dni")) {
    const dayWindow = extractDayWindow(question);
    const upcomingTenders = [...tenders]
      .map((tender) => ({ tender, deadline: parseTenderDate(tender.rok) }))
      .filter(({ deadline }) => deadline)
      .filter(({ deadline }) => dayWindow === null || daysUntil(deadline) <= dayWindow)
      .sort((a, b) => a.deadline - b.deadline)
      .slice(0, 3)
      .map(({ tender }) => buildTenderSummary(tender));

    if (upcomingTenders.length === 0) {
      return `V bazi trenutno ni razpisov z rokom v naslednjih ${dayWindow} dneh.`;
    }

    return dayWindow === null
      ? `Najbližji roki v bazi so: ${upcomingTenders.join(" ")}`
      : `Razpisi z rokom v naslednjih ${dayWindow} dneh so: ${upcomingTenders.join(" ")}`;
  }

  if (matches.length === 0) {
    return "V naloženi bazi nisem našel razpisa, ki bi se dobro ujemal z vprašanjem. Poskusite z drugimi ključnimi besedami, npr. digitalizacija, energetska učinkovitost, zaposlovanje mladih, MSP ali subvencija.";
  }

  const responseIntro = matches.length === 1 ? "Našel sem najbolj relevanten razpis:" : `Našel sem ${matches.length} relevantne razpise:`;
  return `${responseIntro} ${matches.slice(0, 3).map(buildTenderSummary).join(" ")}`;
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
  }, 250);
});

promptButtons.forEach((button) => {
  button.addEventListener("click", () => {
    input.value = button.dataset.prompt;
    input.focus();
  });
});

renderTenderList();
