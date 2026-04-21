import { callGeminiAPI } from './js/api.js';

"use strict";

const App = (() => {
  const OMEGA_CODE = ["r", "u", "g", "a", "l"];
  const PDF_READING_MESSAGE = "⏳ Lendo PDF...";
  // Chave Gemini e configurações carregadas de config.js
  const GEMINI_API_KEY = window.ClassForgeConfig?.GEMINI_API_KEY;
  const GEMINI_MODEL = window.ClassForgeConfig?.GEMINI_MODEL || "gemini-flash-latest";
  const MAX_PDF_PAGES = window.ClassForgeConfig?.GAME?.MAX_PDF_PAGES || 30;

  const state = {
    playerHP: 100,
    adventureData: [],
    currentEnemyIndex: -1,
    isBusy: false,
    hintVouchers: 0,
    secretKeyIndex: 0,
    musicInterval: null,
    confetti: [],
    pdfContent: ""
  };

  const refs = {
    body: document.body,
    confettiCanvas: document.getElementById("confetti-canvas"),
    gameHud: document.getElementById("game-hud"),
    hpBar: document.getElementById("hp-bar"),
    hpText: document.getElementById("hp-text"),
    voucherCount: document.getElementById("voucher-count"),
    gameArea: document.getElementById("game-area"),
    mapContainer: document.getElementById("map-container"),
    configScreen: document.getElementById("config-screen"),
    configBox: document.getElementById("configBox"),
    loading: document.getElementById("loading"),
    loadingText: document.getElementById("loading-text"),
    dashboard: document.getElementById("dashboard"),
    battleModal: document.getElementById("battle-modal"),
    battleBody: document.getElementById("battle-body"),
    enemyTitle: document.getElementById("enemy-title"),
    subject: document.getElementById("subject"),
    fileInput: document.getElementById("fileInput"),
    classContent: document.getElementById("classContent"),
    difficulty: document.getElementById("difficulty"),
    openDashboardBtn: document.getElementById("openDashboardBtn"),
    showReportsBtn: document.getElementById("showReportsBtn"),
    closeDashboardBtn: document.getElementById("closeDashboardBtn"),
    startAiBtn: document.getElementById("startAiBtn"),
    startDemoBtn: document.getElementById("startDemoBtn"),
    downloadPdfBtn: document.getElementById("downloadPdfBtn"),
    restartBtn: document.getElementById("restartBtn"),
    closeModalBtn: document.getElementById("closeModalBtn")
  };

  const confettiCtx = refs.confettiCanvas.getContext("2d");
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

  function init() {
    bindEvents();
    resizeConfettiCanvas();
    checkOmega();
  }

  function bindEvents() {
    document.addEventListener("keydown", handleOmegaUnlockSequence);
    document.addEventListener("click", handleGlobalClickSound);

    window.addEventListener("resize", resizeConfettiCanvas);
    refs.gameArea.addEventListener("wheel", handleHorizontalScroll, { passive: false });

    refs.openDashboardBtn.addEventListener("click", showDashboard);
    refs.showReportsBtn.addEventListener("click", showDashboard);
    refs.closeDashboardBtn.addEventListener("click", hideDashboard);
    refs.startAiBtn.addEventListener("click", () => initGame(true));
    refs.startDemoBtn.addEventListener("click", () => initGame(false));
    refs.downloadPdfBtn.addEventListener("click", generatePDF);
    refs.restartBtn.addEventListener("click", () => window.location.reload());
    refs.closeModalBtn.addEventListener("click", closeModal);
    refs.fileInput.addEventListener("change", handleFileInputChange);
    refs.difficulty.addEventListener("change", checkOmega);
  }

  function handleGlobalClickSound(event) {
    if (event.target instanceof HTMLElement && event.target.closest("button")) {
      playSound("click");
    }
  }

  function handleHorizontalScroll(evt) {
    if (window.innerWidth <= 768) {
      return;
    }

    evt.preventDefault();
    refs.gameArea.scrollLeft += evt.deltaY;
  }

  function handleOmegaUnlockSequence(event) {
    if (event.key.toLowerCase() === OMEGA_CODE[state.secretKeyIndex]) {
      state.secretKeyIndex += 1;
      if (state.secretKeyIndex === OMEGA_CODE.length) {
        activateOmegaMode();
        state.secretKeyIndex = 0;
      }
      return;
    }

    state.secretKeyIndex = 0;
  }

  function activateOmegaMode() {
    playSound("boss");

    const alreadyExists = Array.from(refs.difficulty.options).some((opt) => opt.value === "10");
    if (!alreadyExists) {
      const omegaOption = document.createElement("option");
      omegaOption.value = "10";
      omegaOption.text = "Ω MODO OMEGA (Vestibular - 10 Fases)";
      omegaOption.style.fontWeight = "bold";
      omegaOption.style.color = "#a020f0";
      refs.difficulty.add(omegaOption);
    }

    refs.difficulty.value = "10";
    checkOmega();
    alert("⚠️ MODO OMEGA DESBLOQUEADO");
  }

  function checkOmega() {
    refs.configBox.classList.toggle("omega-active", refs.difficulty.value === "10");
  }

  function ensureAudioIsActive() {
    if (audioCtx.state === "suspended") {
      audioCtx.resume().catch(() => undefined);
    }
  }

  function playBossMusic() {
    ensureAudioIsActive();
    if (state.musicInterval) {
      clearInterval(state.musicInterval);
    }

    let noteIndex = 0;
    const freedomMotif = [
      { f: 349.23, d: 0.15 },
      { f: 415.3, d: 0.15 },
      { f: 466.16, d: 0.15 },
      { f: 523.25, d: 0.15 },
      { f: 554.37, d: 0.15 },
      { f: 523.25, d: 0.15 },
      { f: 466.16, d: 0.15 },
      { f: 415.3, d: 0.15 },
      { f: 349.23, d: 0.15 },
      { f: 415.3, d: 0.15 },
      { f: 523.25, d: 0.15 },
      { f: 466.16, d: 0.15 }
    ];

    state.musicInterval = setInterval(() => {
      const now = audioCtx.currentTime;
      const noteData = freedomMotif[noteIndex % freedomMotif.length];

      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sawtooth";
      osc.frequency.value = noteData.f;
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + noteData.d);
      osc.start(now);
      osc.stop(now + noteData.d);

      if (noteIndex % 4 === 0) {
        const bass = audioCtx.createOscillator();
        const bassGain = audioCtx.createGain();
        bass.type = "square";
        bass.frequency.value = noteData.f / 2;
        bass.connect(bassGain);
        bassGain.connect(audioCtx.destination);
        bassGain.gain.setValueAtTime(0.05, now);
        bassGain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        bass.start(now);
        bass.stop(now + 0.3);
      }

      noteIndex += 1;
    }, 150);
  }

  function stopBossMusic() {
    if (!state.musicInterval) {
      return;
    }

    clearInterval(state.musicInterval);
    state.musicInterval = null;
  }

  function playSound(type) {
    ensureAudioIsActive();
    const now = audioCtx.currentTime;

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    if (type === "click") {
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.1);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
      return;
    }

    if (type === "win") {
      [523.25, 659.25, 783.99].forEach((freq, index) => {
        const note = audioCtx.createOscillator();
        const noteGain = audioCtx.createGain();
        note.connect(noteGain);
        noteGain.connect(audioCtx.destination);
        note.type = "triangle";
        note.frequency.value = freq;
        noteGain.gain.setValueAtTime(0.1, now + index * 0.1);
        noteGain.gain.exponentialRampToValueAtTime(0.01, now + index * 0.1 + 0.5);
        note.start(now + index * 0.1);
        note.stop(now + index * 0.1 + 0.5);
      });
      return;
    }

    if (type === "error") {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.linearRampToValueAtTime(50, now + 0.3);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
      return;
    }

    if (type === "boss") {
      osc.type = "square";
      osc.frequency.setValueAtTime(100, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 1);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 1);
      osc.start(now);
      osc.stop(now + 1);
    }
  }

  function resizeConfettiCanvas() {
    refs.confettiCanvas.width = window.innerWidth;
    refs.confettiCanvas.height = window.innerHeight;
  }

  function startConfetti() {
    refs.confettiCanvas.style.display = "block";
    state.confetti = Array.from({ length: 150 }, () => ({
      x: Math.random() * refs.confettiCanvas.width,
      y: -Math.random() * refs.confettiCanvas.height,
      color: `hsl(${Math.random() * 360}, 100%, 50%)`,
      size: Math.random() * 10 + 5,
      speed: Math.random() * 3 + 2,
      angle: Math.random() * 6.2
    }));

    requestAnimationFrame(updateConfetti);
  }

  function updateConfetti() {
    confettiCtx.clearRect(0, 0, refs.confettiCanvas.width, refs.confettiCanvas.height);

    state.confetti.forEach((piece) => {
      piece.y += piece.speed;
      piece.x += Math.sin(piece.angle) * 2;
      piece.angle += 0.1;
      confettiCtx.fillStyle = piece.color;
      confettiCtx.fillRect(piece.x, piece.y, piece.size, piece.size);

      if (piece.y > refs.confettiCanvas.height) {
        piece.y = -10;
      }
    });

    if (refs.confettiCanvas.style.display === "block") {
      requestAnimationFrame(updateConfetti);
    }
  }

  function showDashboard() {
    refs.dashboard.style.display = "flex";
  }

  function hideDashboard() {
    refs.dashboard.style.display = "none";
  }

  async function generatePDF() {
    if (!state.adventureData.length) {
      alert("⚠️ Gere o jogo com a IA primeiro!");
      return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const date = new Date().toLocaleDateString("pt-BR");

    doc.setFontSize(18);
    doc.text("CLASS FORGE - ATIVIDADE IMPRESSA", 10, 20);
    doc.setFontSize(12);
    doc.text(`Data: ${date}   |   Aluno: _______________________`, 10, 30);

    const pageWidth = 190;
    const pageHeight = 280;
    let y = 45;

    state.adventureData.forEach((node, index) => {
      if (y + 10 > pageHeight) {
        doc.addPage();
        y = 20;
      }

      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(`Questão ${index + 1}: ${node.title}`, 10, y);
      y += 7;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      const lines = doc.splitTextToSize(node.quiz.question, pageWidth);
      const blockHeight = lines.length * 5;
      if (y + blockHeight > pageHeight) {
        doc.addPage();
        y = 20;
      }

      doc.text(lines, 10, y);
      y += blockHeight + 5;

      if (Array.isArray(node.quiz.options) && node.quiz.options.length > 0) {
        const optionsHeight = node.quiz.options.length * 6;
        if (y + optionsHeight > pageHeight) {
          doc.addPage();
          y = 20;
        }

        node.quiz.options.forEach((option) => {
          doc.text(`[   ] ${option}`, 15, y);
          y += 6;
        });
      } else {
        if (y + 10 > pageHeight) {
          doc.addPage();
          y = 20;
        }
        doc.text("___________________________________________________", 15, y + 5);
        y += 10;
      }

      y += 10;
    });

    doc.addPage();
    doc.setFontSize(18);
    doc.text("GABARITO (USO DO PROFESSOR)", 10, 20);

    y = 40;
    state.adventureData.forEach((node, index) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }

      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(`${index + 1}. ${node.title}`, 10, y);
      y += 7;

      doc.setFont("helvetica", "normal");
      const correctText = Array.isArray(node.quiz.options) && node.quiz.options.length > 0
        ? node.quiz.options[node.quiz.correct]
        : node.quiz.correct;
      doc.setTextColor(0, 150, 0);
      doc.text(`Resposta: ${correctText}`, 15, y);
      doc.setTextColor(0, 0, 0);
      y += 10;
    });

    doc.save("class_forge_prova.pdf");
  }

  async function handleFileInputChange(event) {
    const file = event.target.files?.[0];
    if (!file || file.type !== "application/pdf") {
      return;
    }

    refs.classContent.placeholder = PDF_READING_MESSAGE;
    state.pdfContent = await readPDF(file);
    refs.classContent.placeholder = "✅ PDF carregado em background! O texto do PDF será enviado à IA.\n\nUse esta área de texto apenas se quiser adicionar contexto extra, observações ou regras específicas para o professor...";
  }

  async function readPDF(file) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const maxPages = Math.min(pdf.numPages, MAX_PDF_PAGES);
      let fullText = "";

      for (let pageIndex = 1; pageIndex <= maxPages; pageIndex += 1) {
        const page = await pdf.getPage(pageIndex);
        const textItems = await page.getTextContent();
        fullText += `${textItems.items.map((item) => item.str).join(" ")} `;
      }

      return fullText.trim();
    } catch {
      return "";
    }
  }

  // API logic moved to js/api.js

  function calcHintVouchersByDifficulty(totalStages) {
    if (totalStages === 3) {
      return 1;
    }
    if (totalStages === 5) {
      return 2;
    }
    if (totalStages === 7) {
      return 3;
    }
    return 0;
  }

  async function initGame(useRealAI) {
    try {
      const textAreaContent = refs.classContent.value;
      const content = state.pdfContent ? `${state.pdfContent}\n\n${textAreaContent}` : textAreaContent;
      const totalStages = Number.parseInt(refs.difficulty.value, 10);
      const subject = refs.subject.value;

      if (subject === "" && (!content || content.length < 10 || content === PDF_READING_MESSAGE)) {
        alert("⚠️ Para MODO LIVRE, insira um PDF ou texto.");
        return;
      }

      state.hintVouchers = calcHintVouchersByDifficulty(totalStages);
      refs.voucherCount.innerText = String(state.hintVouchers);
      refs.configBox.classList.add("hidden");
      refs.loading.classList.remove("hidden");
      if (refs.loadingText) refs.loadingText.innerText = "Gerando fases...";

      if (useRealAI) {
        const payload = {
          subject: subject || "Matéria Livre",
          content: content.slice(0, window.ClassForgeConfig?.GAME?.MAX_CONTENT_LENGTH || 100000),
          totalStages: totalStages,
          mode: totalStages === 10 ? "omega" : "normal",
          isRigorous: document.getElementById('rigorousTest')?.checked || false
        };
        const adventure = await callGeminiAPI(payload);
        state.adventureData = adventure;
        if (!state.adventureData || !state.adventureData.length) {
          throw new Error("A IA não retornou fases utilizáveis.");
        }
      } else {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        state.adventureData = getDemoData(totalStages);
      }

      startGameUI();
      renderMap();
    } catch (error) {
      console.error(error);
      alert(`Erro: ${error.message}\nCarregando demo.`);
      state.adventureData = getDemoData(3);
      startGameUI();
      renderMap();
    }
  }

  function startGameUI() {
    refs.configScreen.classList.add("hidden");
    refs.gameArea.style.display = "block";
    refs.gameHud.style.display = "flex";
  }

  function renderMap() {
    refs.mapContainer.innerHTML = "";

    state.adventureData.forEach((node, index) => {
      if (index > 0) {
        const connector = document.createElement("div");
        connector.className = "connector";
        refs.mapContainer.appendChild(connector);
      }

      const card = document.createElement("div");
      const isLocked = index > 0 && !state.adventureData[index - 1].completed;
      card.className = `card ${node.type} ${node.completed ? "cleared" : ""} ${isLocked ? "locked" : ""}`;

      const icon = node.completed ? "🛡️" : node.type === "boss" ? "🐲" : "💀";
      card.innerHTML = `
        <div class="card-icon">${icon}</div>
        <div class="card-title">${node.title}</div>
        <div class="card-desc">${node.desc || "..."}</div>
      `;

      card.addEventListener("click", () => {
        if (!isLocked && !node.completed && !state.isBusy) {
          openBattleSelector(index);
        }
      });

      refs.mapContainer.appendChild(card);
    });
  }

  function openBattleSelector(index) {
    state.currentEnemyIndex = index;
    const node = state.adventureData[index];
    const isBoss = node.type === "boss";

    refs.enemyTitle.innerText = (node.title || "Inimigo").toUpperCase();
    refs.battleModal.style.display = "flex";
    refs.body.classList.toggle("boss-mode", isBoss);

    if (isBoss) {
      playBossMusic();
      renderCombat("quiz", true);
      return;
    }

    stopBossMusic();

    const lore = createLoreElement(node.desc || "Desafio...");
    const selector = document.createElement("div");
    selector.className = "combat-selector";

    selector.appendChild(createCombatOption("⚔️", "COMBATE", "Quiz", () => renderCombat("quiz")));
    selector.appendChild(createCombatOption("✨", "MAGIA", "V ou F", () => renderCombat("magic")));
    selector.appendChild(createCombatOption("🧩", "FURTIVO", "Pergunta Aberta", () => renderCombat("stealth")));

    refs.battleBody.innerHTML = "";
    refs.battleBody.appendChild(lore);
    refs.battleBody.appendChild(selector);
  }

  function createLoreElement(desc) {
    const lore = document.createElement("div");
    lore.className = "lore-box";
    lore.innerText = `"${desc}"`;
    return lore;
  }

  function createCombatOption(icon, title, subtitle, onClick) {
    const option = document.createElement("button");
    option.type = "button";
    option.className = "combat-option";
    option.innerHTML = `
      <div class="combat-icon">${icon}</div>
      <div class="combat-info">
        <h3>${title}</h3>
        <p>${subtitle}</p>
      </div>
    `;
    option.addEventListener("click", onClick);
    return option;
  }

  function useHint(hintText, hintButton) {
    if (state.hintVouchers > 0) {
      state.hintVouchers -= 1;
      refs.voucherCount.innerText = String(state.hintVouchers);
      alert(`💡 DICA: ${hintText}`);
      hintButton.disabled = true;
      hintButton.style.opacity = "0.5";
      hintButton.innerText = "Dica Usada";
      return;
    }

    playSound("error");
    hintButton.classList.add("wrong");
    setTimeout(() => hintButton.classList.remove("wrong"), 500);

    if (refs.difficulty.value === "10") {
      alert("🚫 OMEGA MODE: Sem dicas aqui.");
      return;
    }

    alert("🚫 Sem vouchers de dica!");
  }

  function renderCombat(mode, isBoss = false) {
    playSound("click");

    const node = state.adventureData[state.currentEnemyIndex];
    const oldLore = refs.battleBody.querySelector(".lore-box") || createLoreElement(node.desc || "Desafio...");

    refs.battleBody.innerHTML = "";
    refs.battleBody.appendChild(oldLore);

    const contentWrap = document.createElement("div");
    const feedbackArea = document.createElement("div");
    feedbackArea.id = "feedback-area";
    contentWrap.appendChild(feedbackArea);

    let currentHint = "Sem dica disponível.";

    if (mode === "quiz") {
      currentHint = node.quiz.hint || currentHint;
      contentWrap.appendChild(createQuestionText(node.quiz.question));

      if (isBoss && (!node.quiz.options || node.quiz.options.length === 0)) {
        const bossAnswer = document.createElement("div");
        bossAnswer.className = "boss-answer";
        bossAnswer.innerHTML = `<em>Gab: ${node.quiz.correct}</em>`;
        contentWrap.appendChild(bossAnswer);

        const winButton = document.createElement("button");
        winButton.type = "button";
        winButton.className = "btn-main";
        winButton.innerText = "VENCER";
        winButton.addEventListener("click", () => resolveBattle(true));
        contentWrap.appendChild(winButton);
      } else {
        node.quiz.options.forEach((option, index) => {
          const button = document.createElement("button");
          button.type = "button";
          button.className = "quiz-btn";
          button.innerText = option;
          button.addEventListener("click", () => checkQuiz(index, node.quiz.correct));
          contentWrap.appendChild(button);
        });
      }
    }

    if (mode === "magic") {
      currentHint = node.magic.hint || currentHint;

      const text = createQuestionText(`"${node.magic.statement}"`);
      text.style.textAlign = "center";
      contentWrap.appendChild(text);

      const trueBtn = document.createElement("button");
      trueBtn.type = "button";
      trueBtn.className = "btn-main";
      trueBtn.innerText = "VERDADEIRO";
      trueBtn.addEventListener("click", () => checkMagic(true, node.magic.is_true));
      contentWrap.appendChild(trueBtn);

      const falseBtn = document.createElement("button");
      falseBtn.type = "button";
      falseBtn.className = "btn-main btn-sec";
      falseBtn.innerText = "FALSO";
      falseBtn.style.marginTop = "15px";
      falseBtn.addEventListener("click", () => checkMagic(false, node.magic.is_true));
      contentWrap.appendChild(falseBtn);
    }

    if (mode === "stealth") {
      currentHint = node.stealth.hint || "Tente lembrar das palavras chave.";
      contentWrap.appendChild(createQuestionText(node.stealth.question));

      const answerInput = document.createElement("textarea");
      answerInput.id = "stealth-input";
      answerInput.className = "stealth-input";
      answerInput.placeholder = "Digite sua resposta aqui...";
      contentWrap.appendChild(answerInput);

      const submit = document.createElement("button");
      submit.type = "button";
      submit.id = "check-stealth-btn";
      submit.className = "btn-main";
      submit.style.marginTop = "15px";
      submit.innerText = "ENVIAR RESPOSTA";
      submit.addEventListener("click", checkStealth);
      contentWrap.appendChild(submit);
    }

    refs.battleBody.appendChild(contentWrap);

    const isOmega = refs.difficulty.value === "10";
    const hintButton = document.createElement("button");
    hintButton.type = "button";
    hintButton.className = isOmega ? "hint-btn broken-btn" : "hint-btn";
    hintButton.innerText = "💡 DICA";
    hintButton.addEventListener("click", () => useHint(currentHint, hintButton));
    refs.battleBody.appendChild(hintButton);

    if (!isBoss) {
      const backButton = document.createElement("button");
      backButton.type = "button";
      backButton.className = "back-btn";
      backButton.innerText = "VOLTAR";
      backButton.addEventListener("click", () => openBattleSelector(state.currentEnemyIndex));
      refs.battleBody.appendChild(backButton);
    }
  }

  function createQuestionText(text) {
    const paragraph = document.createElement("p");
    paragraph.className = "question-text";
    paragraph.innerText = text;
    return paragraph;
  }

  function checkStealth() {
    const node = state.adventureData[state.currentEnemyIndex];
    const answer = (document.getElementById("stealth-input")?.value || "").toLowerCase();
    const keywords = Array.isArray(node.stealth.keywords) ? node.stealth.keywords : [];

    const hit = keywords.some((keyword) => answer.includes(keyword.toLowerCase()));

    if (hit) {
      showFeedback("RESPOSTA COERENTE!", true);
      winEffect(document.getElementById("check-stealth-btn"));
      return;
    }

    showFeedback("RESPOSTA INCOMPLETA! (-15 HP)", false);
    loseEffect(document.getElementById("check-stealth-btn"));
    setTimeout(() => alert(`Resposta Esperada: ${node.stealth.answer}`), 500);
  }

  function showFeedback(message, isGood) {
    const area = document.getElementById("feedback-area");
    if (!area) {
      return;
    }

    area.innerText = message;
    area.className = isGood ? "correct" : "wrong";
    area.style.color = isGood ? "var(--green)" : "var(--red)";
    area.style.border = isGood ? "1px solid var(--green)" : "1px solid var(--red)";
  }

  function checkQuiz(selectedIndex, correctIndex) {
    const buttons = Array.from(document.querySelectorAll(".quiz-btn"));
    if (selectedIndex === correctIndex) {
      showFeedback("CORRETO!", true);
      winEffect(buttons[selectedIndex]);
      return;
    }

    showFeedback("ERRADO! (-15 HP)", false);
    loseEffect(buttons[selectedIndex]);
  }

  function checkMagic(userAnswer, correctAnswer) {
    const buttons = Array.from(refs.battleBody.querySelectorAll(".btn-main"));
    const target = userAnswer ? buttons[0] : buttons[1];

    if (userAnswer === correctAnswer) {
      showFeedback("CORRETO!", true);
      winEffect(target);
      return;
    }

    showFeedback("ERRADO! (-15 HP)", false);
    loseEffect(target);
  }

  function winEffect(element) {
    if (!element) {
      return;
    }

    playSound("win");
    element.classList.add("correct");
    state.isBusy = true;
    setTimeout(() => {
      resolveBattle(true);
      state.isBusy = false;
    }, 1000);
  }

  function loseEffect(element) {
    if (!element) {
      return;
    }

    playSound("error");
    element.classList.add("wrong");
    updateHP(-15);
    setTimeout(() => element.classList.remove("wrong"), 1000);
  }

  function resolveBattle(win) {
    if (!win) {
      return;
    }

    state.adventureData[state.currentEnemyIndex].completed = true;
    refs.body.classList.remove("boss-mode");
    stopBossMusic();
    refs.battleModal.style.display = "none";
    renderMap();

    if (state.adventureData.every((node) => node.completed)) {
      startConfetti();
      setTimeout(() => alert("🏆 VITÓRIA! VOCÊ ZEROU A MATÉRIA!"), 500);
    }
  }

  function updateHP(amount) {
    state.playerHP += amount;
    if (state.playerHP < 0) {
      state.playerHP = 0;
    }

    refs.hpBar.style.width = `${state.playerHP}%`;
    refs.hpText.innerText = String(state.playerHP);

    if (state.playerHP === 0) {
      alert("💀 GAME OVER! Tente novamente.");
      window.location.reload();
    }
  }

  function closeModal() {
    refs.body.classList.remove("boss-mode");
    stopBossMusic();
    refs.battleModal.style.display = "none";
  }

  function getDemoData(stageCount) {
    return Array(stageCount)
      .fill(null)
      .map((_, index) => ({
        title: index === stageCount - 1 ? "Rei do Caos" : "Inimigo",
        desc: "Lore de teste...",
        type: index === stageCount - 1 ? "boss" : "enemy",
        completed: false,
        quiz: {
          question: "1+1?",
          options: ["2", "3", "4", "5"],
          correct: 0,
          hint: "Use os dedos"
        },
        magic: {
          statement: "Sol é gelado?",
          is_true: false,
          hint: "Olhe pra cima"
        },
        stealth: {
          question: "Quem sou eu?",
          answer: "Eu sou legal",
          keywords: ["legal"],
          hint: "Sou legal"
        }
      }));
  }

  return {
    init
  };
})();

document.addEventListener("DOMContentLoaded", App.init);
