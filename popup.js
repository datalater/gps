import { getCurrentTab } from "./tabs.js";
import { generateId } from "./utils.js";

const VARS = {
  radioName: "project-path",
};

(async function main() {
  const tab = await getCurrentTab();
  const currentUrl = new URL(tab.url).origin;

  const addButton = document.querySelector(".add");
  const clearButton = document.querySelector(".clear");

  addButton.addEventListener("click", addItem(currentUrl));
  clearButton.addEventListener("click", clearItems);
})();

function addItem(url) {
  return () => {
    const list = document.querySelector(".list");
    list.appendChild(createItem(url));
  };
}

function clearItems() {
  const list = document.querySelector(".list");
  list.innerHTML = "";
}

function createItem(url) {
  const item = document.createElement("li");
  item.className = "item";
  const id = generateId();

  item.innerHTML = `
    <label for=${id} class="label">
      <input type="radio" id=${id} name=${VARS.radioName} />
      <input type="text" placeholder="URL" value=${url} />
      <input type="text" placeholder="project path" />
      <input type="text" placeholder="alias (optional)" />
    </label>
    <button class="remove">X</button>
  `;

  const removeButton = item.querySelector(".remove");
  removeButton.addEventListener("click", (event) => {
    event.target.closest(".item").remove();
  });

  return item;
}
