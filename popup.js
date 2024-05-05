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

  item.innerHTML = `
    <label for=${newId} class="label">
      <input 
        type="radio" 
        id=${newId} 
        name=${VARS.radioName} 
        ${Boolean(checked) ? "checked" : ""}
      />
      <input type="text" placeholder="URL" ${url ? `value="${url}"` : ""} />
      <input type="text" placeholder="project path" ${
        path ? `value="${path}"` : ""
      } />
      <input type="text" placeholder="alias (optional)" ${
        alias ? `value="${alias}"` : ""
      } />
    </label>
    <button class="remove">X</button>
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
    message: "Saved!",
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
