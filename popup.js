import { getCurrentTab } from "./tabs.js";
import { generateId } from "./utils.js";

const VARS = {
  radioName: "project-path",
};

(async function main() {
  loadItems();

  const tab = await getCurrentTab();
  const currentUrl = new URL(tab.url).origin;

  const addButton = document.querySelector(".add");
  const clearButton = document.querySelector(".clear");

  addButton.addEventListener("click", addItem(currentUrl));
  clearButton.addEventListener("click", clearItems);

  const saveButton = document.querySelector(".save");
  saveButton.addEventListener("click", save);
})();

function loadItems() {
  chrome.storage.local.get("data", (result) => {
    const items = result.data || [];
    items.forEach((item) => {
      const list = document.querySelector(".list");
      list.appendChild(createItem(item));
    });
  });
}

function addItem(url) {
  return () => {
    const list = document.querySelector(".list");
    list.appendChild(createItem({ url }));
  };
}

function clearItems() {
  const list = document.querySelector(".list");
  list.innerHTML = "";
}

function createItem({ id, checked, url, path, alias } = {}) {
  const newId = id || generateId();

  const item = document.createElement("li");
  item.className = "item";

  item.innerHTML = /* html */ `
    <label for=${newId} class="label">
      <input
        type="radio"
        id=${newId}
        name=${VARS.radioName}
        ${Boolean(checked) ? "checked" : ""}
      />
      <input type="text" placeholder="URL" ${url ? `value="${url}"` : ""} />
      <input
        type="text"
        placeholder="project path"
        ${path ? `value="${path}"` : ""}
      />
      <input
        type="text"
        placeholder="alias (optional)"
        ${alias ? `value="${alias}"` : ""}
      />
    </label>
    <button class="copy-path" title="copy project path">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        width="16"
        height="16"
      >
        <path fill="none" d="M0 0h24v24H0z" />
        <path
          d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"
        />
      </svg>
    </button>
    <button class="remove" title="remove">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16">
        <path fill="none" d="M0 0h24v24H0z"/>
        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
      </svg>
    </button>
  `;

  const removeButton = item.querySelector(".remove");
  removeButton.addEventListener("click", (event) => {
    event.target.closest(".item").remove();
  });

  const radioButton = item.querySelector(`input[type=radio]`);
  radioButton.addEventListener("change", () => {
    const items = document.querySelectorAll(".item");
    items.forEach((item) => {
      const radio = item.querySelector(`input[type=radio]`);
      radio.checked = radio === radioButton;
    });

    save();
  });

  const copyButton = item.querySelector(".copy-path");
  copyButton.addEventListener("click", () => {
    const pathInput = item.querySelector('input[placeholder="project path"]');
    navigator.clipboard.writeText(pathInput.value);

    toast({
      container: document.querySelector(".button-wrapper"),
      message: "✅ Copied!",
    });
  });

  return item;
}

function save() {
  const items = document.querySelectorAll(".item");
  const data = Array.from(items).map((item) => {
    const { id, checked } = item.querySelector("input[type=radio]");
    const [url, path, alias] = item.querySelectorAll("input[type=text]");

    return {
      id,
      checked,
      url: url.value,
      path: path.value,
      alias: alias.value,
    };
  });

  chrome.storage.local.set({ data });

  toast({
    container: document.querySelector(".button-wrapper"),
    message: "✅ Saved!",
  });
}

function toast({ container, message, position = "before" }) {
  if (document.querySelector(".toast")) {
    document.querySelector(".toast").remove();
  }

  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;

  if (position === "before") {
    container.prepend(toast);
  } else {
    container.appendChild(toast);
  }

  const showAnimation = toast.animate([{ opacity: 0 }, { opacity: 1 }], {
    duration: 500,
    fill: "forwards",
  });

  showAnimation.onfinish = () => {
    setTimeout(() => {
      const hideAnimation = toast.animate([{ opacity: 1 }, { opacity: 0 }], {
        duration: 500,
        fill: "forwards",
      });

      hideAnimation.onfinish = () => {
        toast.remove();
      };
    }, 1000);
  };
}
