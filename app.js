const reminderForm = document.getElementById("reminder-form");
const reminderTimeInput = document.getElementById("reminder-time");
const reminderModeSelect = document.getElementById("reminder-mode");
const reminderStatus = document.getElementById("reminder-status");
const wordForm = document.getElementById("word-form");
const wordInput = document.getElementById("word-input");
const wordList = document.getElementById("word-list");
const banner = document.getElementById("banner");

const STORAGE_KEY = "daily-word-reminder";
const WORDS_KEY = "daily-word-list";
const LAST_TRIGGER_KEY = "daily-word-last-trigger";

let scheduledTime = null;
let reminderMode = "notification";
let words = [];

const formatWords = (list) => (list.length ? list.join("、") : "还没有记录单词");

const loadSettings = () => {
  const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  scheduledTime = stored.time || "09:00";
  reminderMode = stored.mode || "notification";
  reminderTimeInput.value = scheduledTime;
  reminderModeSelect.value = reminderMode;

  const storedWords = JSON.parse(localStorage.getItem(WORDS_KEY) || "[]");
  words = Array.isArray(storedWords) ? storedWords : [];
};

const saveSettings = () => {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      time: scheduledTime,
      mode: reminderMode,
    })
  );
};

const saveWords = () => {
  localStorage.setItem(WORDS_KEY, JSON.stringify(words));
};

const renderWords = () => {
  wordList.innerHTML = "";
  if (words.length === 0) {
    const emptyItem = document.createElement("li");
    emptyItem.textContent = "先添加几个单词吧。";
    wordList.appendChild(emptyItem);
    return;
  }

  words.forEach((word, index) => {
    const item = document.createElement("li");
    const text = document.createElement("span");
    text.textContent = word;
    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.textContent = "删除";
    removeButton.addEventListener("click", () => {
      words.splice(index, 1);
      saveWords();
      renderWords();
      updateStatus();
    });
    item.append(text, removeButton);
    wordList.appendChild(item);
  });
};

const updateStatus = (message) => {
  const summary = `提醒时间：${scheduledTime} | 今日单词：${formatWords(words)}`;
  reminderStatus.textContent = message ? `${message} ${summary}` : summary;
};

const showBanner = (text) => {
  banner.textContent = text;
  banner.classList.add("is-visible");
  setTimeout(() => banner.classList.remove("is-visible"), 6000);
};

const sendNotification = () => {
  const content = `背单词时间到！今天的单词：${formatWords(words)}`;
  if (reminderMode === "banner") {
    showBanner(content);
    return;
  }

  if (Notification.permission === "granted") {
    new Notification("每日背单词提醒", { body: content });
    return;
  }

  if (Notification.permission === "default") {
    Notification.requestPermission().then((permission) => {
      if (permission === "granted") {
        new Notification("每日背单词提醒", { body: content });
      } else {
        showBanner(content);
      }
    });
    return;
  }

  showBanner(content);
};

const shouldTrigger = () => {
  const lastTrigger = localStorage.getItem(LAST_TRIGGER_KEY);
  const today = new Date().toISOString().slice(0, 10);
  return lastTrigger !== today;
};

const markTriggered = () => {
  const today = new Date().toISOString().slice(0, 10);
  localStorage.setItem(LAST_TRIGGER_KEY, today);
};

const checkReminder = () => {
  if (!scheduledTime) {
    return;
  }

  const now = new Date();
  const [hours, minutes] = scheduledTime.split(":").map(Number);

  if (now.getHours() === hours && now.getMinutes() === minutes && shouldTrigger()) {
    sendNotification();
    markTriggered();
  }
};

reminderForm.addEventListener("submit", (event) => {
  event.preventDefault();
  scheduledTime = reminderTimeInput.value;
  reminderMode = reminderModeSelect.value;
  saveSettings();
  updateStatus("提醒已更新。");
});

wordForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const value = wordInput.value.trim();
  if (!value) {
    return;
  }
  words.unshift(value);
  wordInput.value = "";
  saveWords();
  renderWords();
  updateStatus();
});

loadSettings();
renderWords();
updateStatus();

setInterval(checkReminder, 30000);
checkReminder();
