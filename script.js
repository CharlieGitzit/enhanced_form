const chatWindow = document.getElementById("chat-window");
const input = document.getElementById("user-input");
const btn = document.getElementById("send-btn");
const progressFill = document.getElementById("progress-fill");
const progressText = document.getElementById("progress-text");
const readinessScore = document.getElementById("readiness-score");
const exportBtn = document.getElementById("export-pdf");
const confidenceMeter = document.getElementById("confidence-meter");
const whyBox = document.getElementById("why-box");

const questions = [
  { q: "What country were you born in?", why: "Birth country helps determine eligibility categories.", key: "birthCountry", scoreWeight: 2 },
  { q: "What is your date of last entry to the U.S.? Please provide month and year.", why: "Entry date connects to official travel records.", key: "entryDate", scoreWeight: 3, validate: val => /^(0?[1-9]|1[0-2])\/? ?\d{4}$|^(January|February|March|April|May|June|July|August|September|October|November|December) ?\d{4}$/i.test(val) },
  { q: "What status did you have when you entered?", why: "Entry status affects legal pathways.", key: "entryStatus", scoreWeight: 2, validate: val => /(lawful|valid|visitor|student|work|tourist|diplomat|refugee|asylum|parole)/i.test(val) },
  { q: "Have you ever been in immigration court proceedings?", why: "Court history affects documentation needed.", key: "courtHistory", scoreWeight: 3, validate: val => /(no|none|never|yes|have)/i.test(val) },
  { q: "Do you currently have any applications pending with USCIS?", why: "Pending filings help avoid duplicate submissions.", key: "pendingApps", scoreWeight: 2, validate: val => /(no|none|never|yes|have)/i.test(val) },
  { q: "Have you ever been ordered removed or deported?", why: "Prior removal history is important for review.", key: "removalHistory", scoreWeight: 3, validate: val => /(no|none|never|yes|have)/i.test(val) },
  { q: "Do you have a valid passport from your home country?", why: "Travel documents are often required for processing.", key: "validPassport", scoreWeight: 2, validate: val => /(yes|no)/i.test(val) },
  { q: "Please list any immigration-related documents you currently possess (e.g. I-94, Employment Authorization, Green Card).", why: "Document inventory helps determine next steps.", key: "documents", scoreWeight: 3, validate: val => val.trim().length > 2 },
  { q: "Do you have a visa or similar documentation? If so, please specify the type and issue date.", why: "Visa status is crucial for understanding eligibility for certain benefits.", key: "visaDocs", scoreWeight: 3, validate: val => val.trim().length > 2 },
  { q: "Have you ever applied for asylum or refugee status? If so, please specify the date of application.", why: "Asylum or refugee status can influence your path forward.", key: "asylumStatus", scoreWeight: 4, validate: val => /^(0?[1-9]|1[0-2])\/? ?\d{4}$|^(January|February|March|April|May|June|July|August|September|October|November|December) ?\d{4}$/i.test(val) },
];

let step = 0;
let answers = {};
let score = 0;
const scoreThresholds = { pursue: 20, pending: 12 };

const botReplies = [
  "Thank you — that helps.",
  "Got it, I’ve noted that.",
  "Perfect, that’s clear.",
  "Thanks for sharing that.",
  "I appreciate the detail."
];

function addBubble(text, type) {
  const bubble = document.createElement("div");
  bubble.className = "bubble " + type;
  bubble.textContent = text;
  chatWindow.appendChild(bubble);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function updateProgress() {
  const percent = Math.round((step / questions.length) * 100);
  progressFill.style.width = percent + "%";
  progressText.textContent = percent + "%";
  if (percent < 30) confidenceMeter.textContent = "Confidence Level: Getting Started";
  else if (percent < 90) confidenceMeter.textContent = "Confidence Level: Organized";
  else confidenceMeter.textContent = "Confidence Level: Consultant Ready";
}

function botNext() {
  if (step < questions.length) {
    setTimeout(() => addBubble(questions[step].q, "bot"), 350);
    whyBox.textContent = "Why we ask this: " + questions[step].why;
  } else {
    addBubble("You’ve completed the intake. This summary will help professionals review your situation efficiently.", "bot");
    whyBox.textContent = "";
  }
}

function evaluateAnswer(stepIndex, answer) {
  let valid = true;
  if (questions[stepIndex].validate) valid = questions[stepIndex].validate(answer);
  if (valid) score += questions[stepIndex].scoreWeight;
  else score += 0;
  return valid;
}

function getReadinessStatus() {
  if (score >= scoreThresholds.pursue) return "Pursue";
  if (score >= scoreThresholds.pending) return "Pending";
  return "Fail";
}

function getReadinessMessage() {
  const status = getReadinessStatus();
  if (status === "Pursue") {
    return "You're well-prepared and ready to schedule a consultation soon.";
  } else if (status === "Pending") {
    return "You've made a good start — reviewing additional resources is recommended before consultation.";
  } else {
    return "Based on your responses, more preparation is advised before a consultation.";
  }
}

function generateConsultantSummary() {
  let lines = [];
  const status = getReadinessStatus();
  if (status === "Pursue") {
    lines.push("Applicant is well-prepared for consultation.");
  } else if (status === "Pending") {
    lines.push("Applicant has partial information; further preparation suggested.");
  } else {
    lines.push("Applicant appears unprepared; additional information gathering needed.");
  }
  questions.forEach((q, i) => {
    if (!answers["q" + i] || answers["q" + i].trim() === "") {
      lines.push(`- Missing response for: "${q.q}"`);
    }
  });
  return lines.join(" ");
}

function showExportSection() {
  if (Object.keys(answers).length === questions.length) {
    document.querySelector(".export-section").style.display = "block";
  }
}

function handleSend() {
  const text = input.value.trim();
  if (!text) return;
  addBubble(text, "user");
  answers["q" + step] = text;
  const valid = evaluateAnswer(step, text);
  input.value = "";
  step++;
  updateProgress();
  addBubble(botReplies[Math.floor(Math.random() * botReplies.length)], "bot");
  if (step < questions.length) {
    botNext();
  } else {
    addBubble(getReadinessMessage(), "bot");
    readinessScore.innerHTML = `<strong>Consultation Readiness:</strong> ${getReadinessStatus()}`;
    showExportSection();
  }
}

btn.addEventListener("click", handleSend);
input.addEventListener("keypress", e => {
  if (e.key === "Enter") {
    e.preventDefault();
    handleSend();
  }
});

window.onload = () => {
  botNext();
  document.querySelector(".export-section").style.display = "none";
};

exportBtn.addEventListener("click", () => {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  let y = 20;
  doc.setFontSize(18);
  doc.text("Immigration Intake Summary", 20, y);
  y += 10;
  doc.setFontSize(12);
  doc.text(`Readiness Status: ${getReadinessStatus()}`, 20, y);
  y += 10;
  doc.text(getReadinessMessage(), 20, y);
  y += 15;

  const summary = generateConsultantSummary();
  doc.setFillColor(230, 230, 250);
  doc.rect(15, y - 5, 180, 40, "F");
  doc.setTextColor(40, 40, 40);
  doc.setFontSize(12);
  doc.text("Consultant Summary:", 20, y);
  doc.setFontSize(11);
  doc.text(summary, 20, y + 7, { maxWidth: 170 });
  y += 45;
  doc.setTextColor(0, 0, 0);

  doc.text("Answers Summary:", 20, y);
  y += 10;
  Object.keys(answers).forEach((k, i) => {
    doc.text(`Q${i + 1}: ${questions[i].q}`, 20, y);
    y += 7;
    doc.text(`A: ${answers[k]}`, 25, y);
    y += 10;
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
  });

  doc.save("intake-summary.pdf");
});

