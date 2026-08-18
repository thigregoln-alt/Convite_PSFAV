"use strict";

/* ================================================================
   CONFIGURAÇÃO DO FORMSPREE
   ================================================================
   Troque o valor abaixo pelo endpoint do seu formulário em
   https://formspree.io (algo como "https://formspree.io/f/xxxxxxxx").
   ================================================================ */
const FORMSPREE_ENDPOINT = "https://formspree.io/f/xjybegdk";

/* ================================================================
   ESTADO CENTRAL DA APLICAÇÃO
   ================================================================ */
const STEPS = ["invitation", "celebration", "location", "datetime", "food", "summary", "final"];

const state = {
  currentStep: 0,
  noAttempts: 0,
  noMessage: "Não",
  response: "",
  location: "",
  customLocation: "",
  date: "",
  time: "",
  food: "",
  customFood: "",
  isSubmitting: false,
  submitSuccess: false,
  submitError: "",
};

/* ================================================================
   HELPERS GERAIS
   ================================================================ */
function icon(id, extraClass) {
  return `<svg class="icon ${extraClass || ""}" aria-hidden="true"><use href="#${id}"></use></svg>`;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const MONTH_NAMES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];
const MONTH_NAMES_CAP = MONTH_NAMES.map((m) => m.charAt(0).toUpperCase() + m.slice(1));
const WEEKDAYS = ["D", "S", "T", "Q", "Q", "S", "S"];

function formatDateLong(dateStr) {
  if (!dateStr) return "";
  const [year, month, day] = dateStr.split("-").map(Number);
  if (!year || !month || !day) return dateStr;
  return `${day} de ${MONTH_NAMES[month - 1]} de ${year}`;
}

function resolveLocationLabel() {
  if (state.location === "Outro lugar") {
    return state.customLocation || state.location;
  }
  return state.location;
}

function resolveFoodLabel() {
  if (state.food === "Outra coisa") {
    return state.customFood || state.food;
  }
  return state.food;
}

/* ================================================================
   DECORAÇÕES FLUTUANTES
   ================================================================ */
const SYMBOL_SETS = {
  invitation: ["icon-heart", "icon-flower", "icon-sparkle", "icon-star", "icon-petal"],
  celebration: ["icon-heart", "icon-flower", "icon-sparkle", "icon-star", "icon-moon", "icon-shell", "icon-petal"],
  location: ["icon-flower", "icon-sparkle", "icon-petal", "icon-star"],
  datetime: ["icon-star", "icon-moon", "icon-sparkle"],
  food: ["icon-flower", "icon-sparkle", "icon-heart"],
  summary: ["icon-heart", "icon-sparkle", "icon-star"],
  final: ["icon-heart", "icon-flower", "icon-sparkle", "icon-star", "icon-moon", "icon-shell", "icon-petal"],
};

const DECO_COLORS = ["#ec6a9c", "#e8b96a", "#ff9fc0", "#e8607e", "#f4d9a3"];

function renderDecorations(variant) {
  const container = document.getElementById("decorations");
  container.innerHTML = "";
  const symbols = SYMBOL_SETS[variant] || SYMBOL_SETS.invitation;
  const count = variant === "celebration" || variant === "final" ? 24 : 13;

  for (let i = 0; i < count; i += 1) {
    const symbol = symbols[Math.floor(Math.random() * symbols.length)];
    const color = DECO_COLORS[Math.floor(Math.random() * DECO_COLORS.length)];
    const left = Math.round(Math.random() * 94) + 1;
    const top = Math.round(Math.random() * 90) + 2;
    const size = 14 + Math.round(Math.random() * 22);
    const duration = 6 + Math.random() * 8;
    const delay = Math.random() * 5;
    const driftX = (Math.random() - 0.5) * 40;
    const rotate = (Math.random() - 0.5) * 60;
    const opacity = 0.4 + Math.random() * 0.45;
    const animType = i % 3;

    const span = document.createElement("span");
    span.className = `float-item float-anim-${animType}`;
    span.style.left = `${left}%`;
    span.style.top = `${top}%`;
    span.style.width = `${size}px`;
    span.style.height = `${size}px`;
    span.style.color = color;
    span.style.opacity = String(opacity);
    span.style.animationDuration = `${duration}s`;
    span.style.animationDelay = `${delay}s`;
    span.style.setProperty("--drift-x", `${driftX}px`);
    span.style.setProperty("--start-rotate", `${rotate}deg`);
    span.innerHTML = icon(symbol);
    container.appendChild(span);
  }
}

/* ================================================================
   NAVEGAÇÃO / TRANSIÇÕES
   ================================================================ */
const CHOICE_STEPS = ["location", "datetime", "food"];

function updateProgress(stepName) {
  const progressEl = document.getElementById("progress");
  const fillEl = document.getElementById("progress-fill");
  const dotsEl = document.getElementById("progress-dots");
  const idx = CHOICE_STEPS.indexOf(stepName);

  if (idx === -1) {
    progressEl.hidden = true;
    return;
  }

  progressEl.hidden = false;
  const total = CHOICE_STEPS.length;
  const percent = total > 1 ? (idx / (total - 1)) * 100 : 0;
  fillEl.style.width = `${percent}%`;

  dotsEl.innerHTML = "";
  for (let i = 0; i < total; i += 1) {
    const dot = document.createElement("span");
    dot.className = `progress-indicator__dot ${i <= idx ? "is-active" : ""}`;
    dotsEl.appendChild(dot);
  }
}

function goToStep(stepName) {
  transitionTo(STEPS.indexOf(stepName));
}

function goNext() {
  transitionTo(Math.min(state.currentStep + 1, STEPS.length - 1));
}

function transitionTo(newStepIndex) {
  const container = document.getElementById("screen-container");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reduceMotion) {
    state.currentStep = newStepIndex;
    renderCurrentScreen();
    window.scrollTo(0, 0);
    return;
  }

  container.style.transition = "opacity 0.35s ease, transform 0.35s ease, filter 0.35s ease";
  container.style.opacity = "0";
  container.style.transform = "scale(1.04)";
  container.style.filter = "blur(6px)";

  setTimeout(() => {
    state.currentStep = newStepIndex;
    renderCurrentScreen();
    window.scrollTo(0, 0);

    container.style.transition = "none";
    container.style.opacity = "0";
    container.style.transform = "scale(0.96)";
    container.style.filter = "blur(6px)";

    // força o reflow antes de animar de volta ao estado normal
    // eslint-disable-next-line no-unused-expressions
    container.offsetHeight;

    requestAnimationFrame(() => {
      container.style.transition = "opacity 0.5s cubic-bezier(0.22,1,0.36,1), transform 0.5s cubic-bezier(0.22,1,0.36,1), filter 0.5s cubic-bezier(0.22,1,0.36,1)";
      container.style.opacity = "1";
      container.style.transform = "scale(1)";
      container.style.filter = "blur(0px)";
    });
  }, 350);
}

/* ================================================================
   TELA 1: CONVITE
   ================================================================ */
const NO_MESSAGES = [
  "Tem certeza?",
  "Você vai se arrepender...",
  "Pensa melhor",
  "Se eu fosse você, escolheria SIM.",
  "Essa não parece uma boa ideia...",
  "Você realmente quer dizer não?",
  "Olha o tamanho do SIM",
  "Não acredito nisso...",
  "Última chance",
  "Você sabe qual é a resposta certa.",
  "Vamos, tenta de novo",
  "O SIM está bem ali, olha",
];

const MARGIN = 16;
const MAX_ATTEMPTS_FOR_SCALE = 11;
const MAX_SCALE = 2.15;

function pickNextMessage(current) {
  let next = current;
  let guard = 0;
  while (next === current && guard < 10) {
    next = NO_MESSAGES[Math.floor(Math.random() * NO_MESSAGES.length)];
    guard += 1;
  }
  return next;
}

function renderInvitationScreen() {
  return `
    <section class="screen screen--invitation">
      <div class="invitation-card">
        <span class="eyebrow">Um convite especial pra você</span>
        <h1 class="invitation-title">
          Giulia Você gostaria de <span class="highlight">sair comigo ???</span>?
        </h1>
        <p class="invitation-subtitle">
          Só preciso de uma respostinha... e já aviso: só existe uma certa.
        </p>

        <div class="invitation-actions">
          <button
            type="button"
            id="yes-button"
            class="romantic-button romantic-button--primary invitation-yes"
            aria-label="Sim, eu aceito sair com você"
            style="--yes-scale: 1;"
          >
            <span class="romantic-button__label" id="yes-label">SIM ${icon("icon-heart")}</span>
          </button>

          <button
            type="button"
            id="no-button"
            class="romantic-button romantic-button--ghost invitation-no"
            aria-label="Não"
          >
            <span class="romantic-button__label" id="no-label">Não</span>
          </button>
        </div>

        <p class="invitation-hint" id="invitation-hint" hidden></p>
      </div>
    </section>
  `;
}

function bindInvitationScreen() {
  let attempts = 0;
  let message = "Não";
  let isConfirming = false;
  let evading = false;

  const yesButton = document.getElementById("yes-button");
  const yesLabel = document.getElementById("yes-label");
  const noButton = document.getElementById("no-button");
  const noLabel = document.getElementById("no-label");
  const hint = document.getElementById("invitation-hint");

  function currentScale() {
    return Math.min(1 + Math.min(attempts, MAX_ATTEMPTS_FOR_SCALE) * 0.1, MAX_SCALE);
  }

  function overlapsKeepOut(x, y, w, h, keepOut) {
    if (!keepOut) return false;
    return x < keepOut.right && x + w > keepOut.left && y < keepOut.bottom && y + h > keepOut.top;
  }

  function escapeNoButton(e) {
    if (evading) return;
    evading = true;

    if (e && e.cancelable) {
      e.preventDefault();
    }

    // O botão precisa ficar fora de qualquer ancestral com "transform"
    // ou "filter" (usados nas transições entre telas), porque isso muda
    // a referência do "position: fixed" e o botão passaria a ficar
    // fixo em relação a esse ancestral em vez da tela inteira.
    if (noButton.parentElement !== document.body) {
      document.body.appendChild(noButton);
    }

    // Atualiza o texto ANTES de medir a largura do botão — senão a
    // largura medida fica desatualizada quando a nova frase for mais
    // longa que a anterior, e o botão pode acabar posicionado além da
    // borda da tela.
    message = pickNextMessage(message);
    noLabel.textContent = message;

    const btnWidth = noButton.offsetWidth || 120;
    const btnHeight = noButton.offsetHeight || 56;
    const maxX = Math.max(window.innerWidth - btnWidth - MARGIN, MARGIN);
    const maxY = Math.max(window.innerHeight - btnHeight - MARGIN, MARGIN);

    const yesRect = yesButton.getBoundingClientRect();
    const keepOutPadding = 24;
    const keepOut = {
      left: yesRect.left - keepOutPadding,
      right: yesRect.right + keepOutPadding,
      top: yesRect.top - keepOutPadding,
      bottom: yesRect.bottom + keepOutPadding,
    };

    let x = MARGIN;
    let y = MARGIN;
    let found = false;

    for (let attempt = 0; attempt < 20; attempt += 1) {
      const candidateX = MARGIN + Math.random() * (maxX - MARGIN);
      const candidateY = MARGIN + Math.random() * (maxY - MARGIN);
      if (!overlapsKeepOut(candidateX, candidateY, btnWidth, btnHeight, keepOut)) {
        x = candidateX;
        y = candidateY;
        found = true;
        break;
      }
    }

    if (!found) {
      const corners = [
        { x: MARGIN, y: MARGIN },
        { x: maxX, y: MARGIN },
        { x: MARGIN, y: maxY },
        { x: maxX, y: maxY },
      ];
      const safeCorner = corners.find((c) => !overlapsKeepOut(c.x, c.y, btnWidth, btnHeight, keepOut)) || corners[0];
      x = safeCorner.x;
      y = safeCorner.y;
    }

    x = Math.min(Math.max(x, MARGIN), maxX);
    y = Math.min(Math.max(y, MARGIN), maxY);

    noButton.style.position = "fixed";
    noButton.style.left = `${x}px`;
    noButton.style.top = `${y}px`;
    noButton.style.margin = "0";
    noButton.style.zIndex = "40";

    attempts += 1;

    yesButton.style.setProperty("--yes-scale", String(isConfirming ? 1.08 : currentScale()));

    hint.hidden = false;
    hint.innerHTML = `${icon("icon-heart-outline")} tentativas de fuga do "não": ${attempts}`;

    setTimeout(() => {
      evading = false;
    }, 120);
  }

  noButton.addEventListener("pointerenter", escapeNoButton);
  noButton.addEventListener("pointerdown", escapeNoButton);
  noButton.addEventListener("touchstart", escapeNoButton, { passive: false });
  noButton.addEventListener("click", escapeNoButton);

  yesButton.addEventListener("click", () => {
    if (isConfirming) return;
    isConfirming = true;
    yesButton.disabled = true;
    yesLabel.innerHTML = `Uhuul... ${icon("icon-heart")}`;
    yesButton.style.setProperty("--yes-scale", "1.08");

    setTimeout(() => {
      if (noButton.parentElement === document.body) {
        noButton.remove();
      }
      state.response = "sim";
      goNext();
    }, 420);
  });
}

/* ================================================================
   TELA 2: CELEBRAÇÃO
   ================================================================ */
function renderCelebrationScreen() {
  const text = "YHEEEEEAAAA!!!";
  const letters = text
    .split("")
    .map((letter, i) => `<span class="celebration-title__letter" style="animation-delay:${0.15 + i * 0.045}s">${letter}</span>`)
    .join("");

  return `
    <section class="screen screen--celebration">
      <div class="celebration-burst" id="celebration-burst"></div>
      <div class="celebration-card">
        <h1 class="celebration-title" aria-label="YHEEEEEAAAA! Um coração de alegria">
          ${letters}
          <span class="celebration-title__heart">${icon("icon-heart")}</span>
        </h1>
        <p class="celebration-subtitle">Eu sabia que você ia escolher a resposta certa.</p>
        <div class="celebration-continue-wrap">
          <button type="button" class="romantic-button romantic-button--primary" id="celebration-continue">
            <span class="romantic-button__label">Continuar ${icon("icon-heart")}</span>
          </button>
        </div>
      </div>
    </section>
  `;
}

function triggerCelebrationBurst(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = "";

  const symbols = ["icon-heart", "icon-star", "icon-sparkle", "icon-flower"];
  const total = 22;

  for (let i = 0; i < total; i += 1) {
    const angle = (i / total) * Math.PI * 2;
    const distance = 120 + ((i * 37) % 140);
    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance;
    const size = 18 + (i % 4) * 6;
    const delay = (i % 8) * 0.05;
    const symbol = symbols[i % symbols.length];
    const color = DECO_COLORS[i % DECO_COLORS.length];

    const span = document.createElement("span");
    span.className = "celebration-burst__item";
    span.style.color = color;
    span.style.fontSize = `${size}px`;
    span.style.width = `${size}px`;
    span.style.height = `${size}px`;
    span.style.transitionDelay = `${delay}s`;
    span.innerHTML = icon(symbol);
    container.appendChild(span);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        span.classList.add("is-bursting");
        span.style.transform = `translate(${x}px, ${y}px) scale(1.1) rotate(${x > 0 ? 90 : -90}deg)`;
      });
    });
  }

  setTimeout(() => {
    container.innerHTML = "";
  }, 2400);
}

function bindCelebrationScreen() {
  triggerCelebrationBurst("celebration-burst");
  document.getElementById("celebration-continue").addEventListener("click", goNext);
}

/* ================================================================
   TELA 3: LOCAL
   ================================================================ */
const LOCATIONS = [
  { id: "Shopping Montijo", iconName: "icon-bag" },
  { id: "Lisboa", iconName: "icon-building" },
  { id: "UBBO", iconName: "icon-ferris" },
  { id: "Cinema", iconName: "icon-clapper" },
  { id: "Restaurante", iconName: "icon-utensils" },
  { id: "Parque de pula-pula", iconName: "icon-bounce" },
  { id: "Praia", iconName: "icon-umbrella" },
  { id: "Outro lugar", iconName: "icon-sparkle" },
];

function renderLocationScreen() {
  const cards = LOCATIONS.map((loc, index) => {
    const selected = state.location === loc.id ? "is-selected" : "";
    return `
      <button type="button" class="option-card ${selected}" data-location="${escapeHtml(loc.id)}" style="animation-delay:${index * 0.05}s">
        <span class="option-card__icon">${icon(loc.iconName)}</span>
        <span class="option-card__label">${loc.id === "Outro lugar" ? "Outro lugar" : escapeHtml(loc.id)}</span>
      </button>
    `;
  }).join("");

  const isOther = state.location === "Outro lugar";

  return `
    <section class="screen screen--choice">
      <div class="choice-card">
        <span class="eyebrow">Etapa 1 de 3</span>
        <h1 class="choice-title">Onde vamos?</h1>

        <div class="option-grid" id="location-grid">${cards}</div>

        <div class="custom-input-wrap" id="location-custom-wrap" ${isOther ? "" : "hidden"}>
          <input type="text" class="custom-input" id="location-custom-input" placeholder="Me conta onde você quer ir..." value="${escapeHtml(state.customLocation)}" aria-label="Digite o local desejado" />
        </div>

        <p class="form-error" id="location-error" hidden></p>

        <button type="button" class="romantic-button romantic-button--primary choice-continue" id="location-continue">
          <span class="romantic-button__label">Continuar ${icon("icon-heart")}</span>
        </button>
      </div>
    </section>
  `;
}

function bindLocationScreen() {
  const grid = document.getElementById("location-grid");
  const customWrap = document.getElementById("location-custom-wrap");
  const customInput = document.getElementById("location-custom-input");
  const errorEl = document.getElementById("location-error");

  grid.querySelectorAll(".option-card").forEach((card) => {
    card.addEventListener("click", () => {
      state.location = card.dataset.location;
      errorEl.hidden = true;
      grid.querySelectorAll(".option-card").forEach((c) => c.classList.remove("is-selected"));
      card.classList.add("is-selected");
      customWrap.hidden = state.location !== "Outro lugar";
      if (state.location === "Outro lugar") {
        customInput.focus();
      }
    });
  });

  customInput.addEventListener("input", (e) => {
    state.customLocation = e.target.value;
    errorEl.hidden = true;
  });

  document.getElementById("location-continue").addEventListener("click", () => {
    if (!state.location) {
      errorEl.hidden = false;
      errorEl.textContent = "Escolhe um lugarzinho pra gente, vai...";
      return;
    }
    if (state.location === "Outro lugar" && !state.customLocation.trim()) {
      errorEl.hidden = false;
      errorEl.textContent = "Me conta pelo menos um lugarzinho, senão fico sem ideia de onde te buscar.";
      return;
    }
    errorEl.hidden = true;
    goNext();
  });
}

/* ================================================================
   TELA 4: DATA E HORA
   ================================================================ */
function getToday() {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth(), day: now.getDate() };
}

function toDateKey(year, month, day) {
  const mm = String(month + 1).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

const TIME_SLOTS = [
  "09:00", "10:00", "11:00", "12:00",
  "13:00", "14:00", "15:00", "16:00",
  "17:00", "18:00", "19:00", "20:00",
  "21:00", "22:00",
];

function isDateTimeInFuture(date, time) {
  if (!date) return false;
  const timeToUse = time || "00:00";
  const candidate = new Date(`${date}T${timeToUse}:00`);
  if (Number.isNaN(candidate.getTime())) return false;
  return candidate.getTime() > Date.now() - 60000;
}

function renderDateTimeScreen() {
  return `
    <section class="screen screen--choice">
      <div class="choice-card">
        <span class="eyebrow">Etapa 2 de 3</span>
        <h1 class="choice-title">Quando vamos?</h1>

        <div class="date-picker" id="date-picker"></div>

        <h2 class="choice-subtitle">E que horas?</h2>

        <div class="time-picker" id="time-picker"></div>

        <p class="form-error" id="datetime-error" hidden></p>

        <div class="choice-nav-row">
          <button type="button" class="romantic-button romantic-button--ghost" id="datetime-back">
            <span class="romantic-button__label">Voltar</span>
          </button>
          <button type="button" class="romantic-button romantic-button--primary" id="datetime-continue">
            <span class="romantic-button__label">Continuar ${icon("icon-heart")}</span>
          </button>
        </div>
      </div>
    </section>
  `;
}

function bindDateTimeScreen() {
  const today = getToday();
  const todayKey = toDateKey(today.year, today.month, today.day);
  let viewYear = state.date ? parseInt(state.date.split("-")[0], 10) : today.year;
  let viewMonth = state.date ? parseInt(state.date.split("-")[1], 10) - 1 : today.month;

  const datePickerEl = document.getElementById("date-picker");
  const timePickerEl = document.getElementById("time-picker");
  const errorEl = document.getElementById("datetime-error");

  function renderCalendar() {
    const isPastMonth = viewYear < today.year || (viewYear === today.year && viewMonth < today.month);
    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

    let cellsHtml = "";
    for (let i = 0; i < firstDay; i += 1) {
      cellsHtml += `<span class="date-picker__cell date-picker__cell--empty"></span>`;
    }
    for (let d = 1; d <= daysInMonth; d += 1) {
      const key = toDateKey(viewYear, viewMonth, d);
      const isPast = key < todayKey;
      const isSelected = state.date === key;
      const isToday = key === todayKey;
      cellsHtml += `<button type="button" class="date-picker__cell ${isSelected ? "is-selected" : ""} ${isToday ? "is-today" : ""}" data-date="${key}" ${isPast ? "disabled" : ""}>${d}</button>`;
    }

    datePickerEl.innerHTML = `
      <div class="date-picker__header">
        <button type="button" class="date-picker__nav" id="date-prev" aria-label="Mês anterior" ${isPastMonth ? "disabled" : ""}>${icon("icon-chevron-left")}</button>
        <span class="date-picker__title">${MONTH_NAMES_CAP[viewMonth]} ${viewYear}</span>
        <button type="button" class="date-picker__nav" id="date-next" aria-label="Próximo mês">${icon("icon-chevron-right")}</button>
      </div>
      <div class="date-picker__weekdays">${WEEKDAYS.map((wd, i) => `<span>${wd}</span>`).join("")}</div>
      <div class="date-picker__grid">${cellsHtml}</div>
    `;

    document.getElementById("date-prev").addEventListener("click", () => {
      if (viewMonth === 0) {
        viewMonth = 11;
        viewYear -= 1;
      } else {
        viewMonth -= 1;
      }
      renderCalendar();
    });

    document.getElementById("date-next").addEventListener("click", () => {
      if (viewMonth === 11) {
        viewMonth = 0;
        viewYear += 1;
      } else {
        viewMonth += 1;
      }
      renderCalendar();
    });

    datePickerEl.querySelectorAll(".date-picker__cell:not(.date-picker__cell--empty):not(:disabled)").forEach((cell) => {
      cell.addEventListener("click", () => {
        state.date = cell.dataset.date;
        errorEl.hidden = true;
        renderCalendar();
      });
    });
  }

  function renderTimePicker() {
    const slotsHtml = TIME_SLOTS.map((slot) => `<button type="button" class="time-picker__slot ${state.time === slot ? "is-selected" : ""}" data-time="${slot}">${slot}</button>`).join("");

    timePickerEl.innerHTML = `
      <div class="time-picker__grid">${slotsHtml}</div>
      <div class="time-picker__custom">
        <label for="custom-time" class="time-picker__custom-label">Ou escolhe um horário certinho:</label>
        <input id="custom-time" type="time" class="time-picker__custom-input" value="${escapeHtml(state.time || "")}" aria-label="Escolher horário personalizado" />
      </div>
    `;

    timePickerEl.querySelectorAll(".time-picker__slot").forEach((slot) => {
      slot.addEventListener("click", () => {
        state.time = slot.dataset.time;
        errorEl.hidden = true;
        renderTimePicker();
      });
    });

    document.getElementById("custom-time").addEventListener("input", (e) => {
      state.time = e.target.value;
      errorEl.hidden = true;
    });
  }

  renderCalendar();
  renderTimePicker();

  document.getElementById("datetime-back").addEventListener("click", () => goToStep("location"));

  document.getElementById("datetime-continue").addEventListener("click", () => {
    if (!state.date) {
      errorEl.hidden = false;
      errorEl.textContent = "Escolhe uma data pra gente, vai ser especial.";
      return;
    }
    if (!state.time) {
      errorEl.hidden = false;
      errorEl.textContent = "Falta só a hora agora...";
      return;
    }
    if (!isDateTimeInFuture(state.date, state.time)) {
      errorEl.hidden = false;
      errorEl.textContent = "Esse horário já passou! Escolhe um momento no futuro pra gente.";
      return;
    }
    errorEl.hidden = true;
    goNext();
  });
}

/* ================================================================
   TELA 5: COMIDA
   ================================================================ */
const FOODS = [
  { id: "Hambúrguer", iconName: "icon-burger" },
  { id: "Sushi", iconName: "icon-sushi" },
  { id: "Pizza", iconName: "icon-pizza" },
  { id: "Pasta", iconName: "icon-pasta" },
  { id: "Surpreenda-me", iconName: "icon-gift" },
  { id: "Outra coisa", iconName: "icon-pencil" },
];

function renderFoodScreen() {
  const cards = FOODS.map((item, index) => {
    const selected = state.food === item.id ? "is-selected" : "";
    return `
      <button type="button" class="option-card ${selected}" data-food="${escapeHtml(item.id)}" style="animation-delay:${index * 0.06}s">
        <span class="option-card__icon">${icon(item.iconName)}</span>
        <span class="option-card__label">${escapeHtml(item.id)}</span>
      </button>
    `;
  }).join("");

  const isOther = state.food === "Outra coisa";

  return `
    <section class="screen screen--choice">
      <div class="choice-card">
        <span class="eyebrow">Etapa 3 de 3</span>
        <h1 class="choice-title">E o que vamos comer?</h1>

        <div class="option-grid option-grid--food" id="food-grid">${cards}</div>

        <div class="custom-input-wrap" id="food-custom-wrap" ${isOther ? "" : "hidden"}>
          <input type="text" class="custom-input" id="food-custom-input" placeholder="Então me conta o que você quer comer..." value="${escapeHtml(state.customFood)}" aria-label="Digite a comida desejada" />
        </div>

        <p class="form-error" id="food-error" hidden></p>

        <div class="choice-nav-row">
          <button type="button" class="romantic-button romantic-button--ghost" id="food-back">
            <span class="romantic-button__label">Voltar</span>
          </button>
          <button type="button" class="romantic-button romantic-button--primary" id="food-continue">
            <span class="romantic-button__label">Continuar ${icon("icon-heart")}</span>
          </button>
        </div>
      </div>
    </section>
  `;
}

function bindFoodScreen() {
  const grid = document.getElementById("food-grid");
  const customWrap = document.getElementById("food-custom-wrap");
  const customInput = document.getElementById("food-custom-input");
  const errorEl = document.getElementById("food-error");

  grid.querySelectorAll(".option-card").forEach((card) => {
    card.addEventListener("click", () => {
      state.food = card.dataset.food;
      errorEl.hidden = true;
      grid.querySelectorAll(".option-card").forEach((c) => c.classList.remove("is-selected"));
      card.classList.add("is-selected");
      customWrap.hidden = state.food !== "Outra coisa";
      if (state.food === "Outra coisa") {
        customInput.focus();
      }
    });
  });

  customInput.addEventListener("input", (e) => {
    state.customFood = e.target.value;
    errorEl.hidden = true;
  });

  document.getElementById("food-back").addEventListener("click", () => goToStep("datetime"));

  document.getElementById("food-continue").addEventListener("click", () => {
    if (!state.food) {
      errorEl.hidden = false;
      errorEl.textContent = "Escolhe uma comidinha pra gente...";
      return;
    }
    if (state.food === "Outra coisa" && !state.customFood.trim()) {
      errorEl.hidden = false;
      errorEl.textContent = "Me conta o que você tá com vontade de comer.";
      return;
    }
    errorEl.hidden = true;
    goNext();
  });
}

/* ================================================================
   TELA 6: RESUMO
   ================================================================ */
const FOOD_ICONS = {
  "Hambúrguer": "icon-burger",
  "Sushi": "icon-sushi",
  "Pizza": "icon-pizza",
  "Pasta": "icon-pasta",
  "Surpreenda-me": "icon-gift",
};

function renderSummaryScreen() {
  const foodIconName = FOOD_ICONS[state.food] || "icon-sparkle";

  return `
    <section class="screen screen--summary">
      <div class="summary-card">
        <h1 class="summary-title">Nosso date ${icon("icon-heart")}</h1>

        <div class="summary-list">
          <button type="button" class="summary-row" id="summary-edit-location">
            <span class="summary-row__icon">${icon("icon-pin")}</span>
            <span class="summary-row__text">${escapeHtml(resolveLocationLabel())}</span>
          </button>
          <button type="button" class="summary-row" id="summary-edit-date">
            <span class="summary-row__icon">${icon("icon-calendar")}</span>
            <span class="summary-row__text">${escapeHtml(formatDateLong(state.date))}</span>
          </button>
          <button type="button" class="summary-row" id="summary-edit-time">
            <span class="summary-row__icon">${icon("icon-clock")}</span>
            <span class="summary-row__text">${escapeHtml(state.time)}</span>
          </button>
          <button type="button" class="summary-row" id="summary-edit-food">
            <span class="summary-row__icon">${icon(foodIconName)}</span>
            <span class="summary-row__text">${escapeHtml(resolveFoodLabel())}</span>
          </button>
        </div>

        <p class="form-error" id="summary-error" ${state.submitError ? "" : "hidden"}>${escapeHtml(state.submitError || "")}</p>

        <div class="summary-actions">
          <button type="button" class="romantic-button romantic-button--primary" id="summary-confirm" ${state.isSubmitting ? "disabled" : ""}>
            <span class="romantic-button__label">${state.isSubmitting ? "Preparando nosso date..." : `Está perfeito! ${icon("icon-heart")}`}</span>
          </button>
          <button type="button" class="romantic-button romantic-button--ghost" id="summary-edit" ${state.isSubmitting ? "disabled" : ""}>
            <span class="romantic-button__label">Quero alterar</span>
          </button>
        </div>
      </div>
    </section>
  `;
}

function bindSummaryScreen() {
  document.getElementById("summary-edit-location").addEventListener("click", () => goToStep("location"));
  document.getElementById("summary-edit-date").addEventListener("click", () => goToStep("datetime"));
  document.getElementById("summary-edit-time").addEventListener("click", () => goToStep("datetime"));
  document.getElementById("summary-edit-food").addEventListener("click", () => goToStep("food"));
  document.getElementById("summary-edit").addEventListener("click", () => goToStep("location"));
  document.getElementById("summary-confirm").addEventListener("click", submitToFormspree);
}

async function submitToFormspree() {
  if (state.isSubmitting) return;
  state.isSubmitting = true;
  state.submitError = "";
  renderCurrentScreen();

  const payload = {
    response: state.response,
    location: state.location,
    customLocation: state.customLocation,
    date: state.date,
    time: state.time,
    food: state.food,
    customFood: state.customFood,
    timestamp: new Date().toISOString(),
  };

  if (!FORMSPREE_ENDPOINT || FORMSPREE_ENDPOINT.indexOf("COLOQUE_SEU_ENDPOINT_AQUI") !== -1) {
    await new Promise((resolve) => setTimeout(resolve, 700));
    state.isSubmitting = false;
    state.submitSuccess = true;
    goToStep("final");
    return;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const res = await fetch(FORMSPREE_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error("Falha no envio");
    }

    state.isSubmitting = false;
    state.submitSuccess = true;
    state.submitError = "";
    goToStep("final");
  } catch (err) {
    state.isSubmitting = false;
    state.submitSuccess = false;
    state.submitError = "Ops! Parece que tivemos um probleminha para enviar. Tenta novamente.";
    renderCurrentScreen();
  }
}

/* ================================================================
   TELA 7: FINAL
   ================================================================ */
function renderFinalScreen() {
  const foodIconName = FOOD_ICONS[state.food] || "icon-sparkle";

  return `
    <section class="screen screen--final">
      <div class="celebration-burst" id="final-burst"></div>
      <div class="final-card">
        <h1 class="final-title">Está marcado! ${icon("icon-heart")}</h1>
        <p class="final-subtitle">Agora é só esperar pelo nosso dia...</p>

        <div class="final-summary">
          <div class="final-summary__row">${icon("icon-pin")}<span>${escapeHtml(resolveLocationLabel())}</span></div>
          <div class="final-summary__row">${icon("icon-calendar")}<span>${escapeHtml(formatDateLong(state.date))}</span></div>
          <div class="final-summary__row">${icon("icon-clock")}<span>${escapeHtml(state.time)}</span></div>
          <div class="final-summary__row">${icon(foodIconName)}<span>${escapeHtml(resolveFoodLabel())}</span></div>
        </div>

        <p class="final-footer">mal posso esperar</p>
      </div>
    </section>
  `;
}

function bindFinalScreen() {
  triggerCelebrationBurst("final-burst");
}

/* ================================================================
   RENDER PRINCIPAL
   ================================================================ */
const SCREEN_RENDERERS = {
  invitation: { render: renderInvitationScreen, bind: bindInvitationScreen },
  celebration: { render: renderCelebrationScreen, bind: bindCelebrationScreen },
  location: { render: renderLocationScreen, bind: bindLocationScreen },
  datetime: { render: renderDateTimeScreen, bind: bindDateTimeScreen },
  food: { render: renderFoodScreen, bind: bindFoodScreen },
  summary: { render: renderSummaryScreen, bind: bindSummaryScreen },
  final: { render: renderFinalScreen, bind: bindFinalScreen },
};

function renderCurrentScreen() {
  const stepName = STEPS[state.currentStep];
  const screenDef = SCREEN_RENDERERS[stepName];
  const container = document.getElementById("screen-container");

  // Segurança: remove qualquer botão "Não" que tenha ficado solto no
  // <body> (movido pra lá durante a fuga) de uma navegação anterior.
  const strayNoButton = document.getElementById("no-button");
  if (strayNoButton && strayNoButton.parentElement === document.body) {
    strayNoButton.remove();
  }

  container.innerHTML = screenDef.render();
  renderDecorations(stepName);
  updateProgress(stepName);
  screenDef.bind();
}

document.addEventListener("DOMContentLoaded", () => {
  renderCurrentScreen();
});
