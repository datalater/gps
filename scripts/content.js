(function fn() {
  const Z_INDEX_MAX = 2147483647;
  const LOCAL_STORAGE_KEY = "gps-project-path";

  say(
    "GPS - Get Position of Source code is running.\n\n",
    "Current project path: \n\n\t",
    localStorage.getItem(LOCAL_STORAGE_KEY) || "Not set."
  );

  const CUSTOM_EVENTS = {
    optionKeyUp: "optionKeyUp",
    optionKeyDown: "optionKeyDown",
  };

  let isOptionKeyPressed = false;

  (function initCustomEventHandlers() {
    function handleOptionKeyDown(event) {
      if (event.altKey) {
        isOptionKeyPressed = true;
        document.dispatchEvent(new CustomEvent(CUSTOM_EVENTS.optionKeyDown));
      }
    }

    function handleKeyUp(event) {
      if (["Alt", "Escape"].includes(event.key)) {
        isOptionKeyPressed = false;
        document.dispatchEvent(new CustomEvent(CUSTOM_EVENTS.optionKeyUp));
      }
    }

    function handleScroll() {
      document.dispatchEvent(new CustomEvent(CUSTOM_EVENTS.optionKeyUp));
    }

    document.addEventListener("keydown", handleOptionKeyDown);
    document.addEventListener("keyup", handleKeyUp);
    document.addEventListener("scroll", handleScroll);
  })();

  (function styler() {
    let hoveredElement = null;

    function handleOptionKeyDown() {
      if (hoveredElement) {
        hoveredElement.setAttribute("data-view-source", "");
        applyHoverStyle();
      }
    }

    function handleOptionKeyUp() {
      undoStyle();
    }

    function handleMouseOver(event) {
      hoveredElement = event.target;

      if (isOptionKeyPressed) {
        hoveredElement.setAttribute("data-view-source", "");
        applyHoverStyle();
      }
    }

    function handleMouseOut() {
      if (hoveredElement) {
        hoveredElement.removeAttribute("data-view-source");
        hoveredElement = null;
        removeHoverStyle();
      }
    }

    function applyHoverStyle() {
      const styleElement = document.getElementById("view-source");

      if (!styleElement) {
        const style = document.createElement("style");
        style.id = "view-source";
        style.textContent =
          "[data-view-source] { outline: 2px solid blue; outline-offset: 2px; background-color: lightblue; }";
        document.head.appendChild(style);
      }
    }

    function undoStyle() {
      removeHoverStyle();
      removeDataViewSourceFromAllElements();
    }

    function removeHoverStyle() {
      const styleElement = document.getElementById("view-source");
      if (styleElement) {
        styleElement.remove();
      }
    }

    function removeDataViewSourceFromAllElements() {
      const elements = document.querySelectorAll("[data-view-source]");
      elements.forEach((element) => {
        element.removeAttribute("data-view-source");
      });
    }

    function handleVisibilityChange() {
      if (!document.hidden) {
        isOptionKeyPressed = false;
        undoStyle();
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("mouseover", handleMouseOver);
    document.addEventListener("mouseout", handleMouseOut);
    document.addEventListener(CUSTOM_EVENTS.optionKeyUp, handleOptionKeyUp);
    document.addEventListener(CUSTOM_EVENTS.optionKeyDown, handleOptionKeyDown);
  })();

  (function locator() {
    let el = null;
    let source = null;
    let projectPath = null;
    let tooltipElement = null;
    let hoveredElement = null;

    function handleOptionKeyDown() {
      if (hoveredElement) {
        el = hoveredElement;
        source = getSource(el);
        showTooltip(el);
      }
    }

    function handleOptionKeyUp() {
      hideTooltip();
    }

    function handleMouseOver(event) {
      hoveredElement = event.target;

      if (!event.altKey) return;
      if (el === event.target) return;

      el = event.target;
      source = getSource(el);

      showTooltip(el);
    }

    function handleMouseOut(event) {
      hoveredElement = null;

      if (el === event.target) {
        el = null;
        hideTooltip();
      }
    }

    function handleClick(event) {
      if (event.altKey) {
        event.preventDefault();
        event.stopPropagation();

        isOptionKeyPressed = false;

        navigator.clipboard.writeText(source);

        let projectPath = localStorage.getItem(LOCAL_STORAGE_KEY);

        if (!projectPath) {
          projectPath = prompt(`Project path를 설정해주세요.\n\n${source}`);

          if (projectPath) {
            localStorage.setItem(LOCAL_STORAGE_KEY, projectPath);
          }
        }

        if (!projectPath) {
          document.dispatchEvent(new CustomEvent(CUSTOM_EVENTS.optionKeyUp));
          return;
        }

        const path = `vscode://file${projectPath}/${source}`;
        window.open(path);

        document.dispatchEvent(new CustomEvent(CUSTOM_EVENTS.optionKeyUp));
      }
    }

    function getSource(element) {
      return (
        getSourceFromVue(element) ||
        getSourceFromReact(element) ||
        getSourceFromReactUsingReactDevtools(element)
      );
    }

    function getSourceFromVue(element) {
      return ((el) => {
        while (el && !el.__vueParentComponent?.type.__file) el = el.parentNode;
        return el ? `${el.__vueParentComponent?.type.__file}:1:1` : undefined;
      })(element);
    }

    function getSourceFromReact(element) {
      return ((el) => {
        while (el && !el._debugSource) el = el._debugOwner;
        return el
          ? `${el._debugSource.fileName.split("/").slice(2).join("/")}:${
              el._debugSource.lineNumber
            }:${el._debugSource.columnNumber}`
          : undefined;
      })(
        element?.[
          Object.keys(element).find((key) => key.startsWith("__reactFiber"))
        ]
      );
    }

    function getSourceFromReactUsingReactDevtools(element) {
      const hasReactDevtools = Object.getOwnPropertyNames(window).includes(
        "__REACT_DEVTOOLS_GLOBAL_HOOK__"
      );
      if (!hasReactDevtools) return;

      const reactRenderer = Array.from(
        window.__REACT_DEVTOOLS_GLOBAL_HOOK__?.renderers.values()
      )[0];
      element = reactRenderer.findFiberByHostInstance(element);

      return ((el) => {
        while (el && !el._debugSource) el = el._debugOwner;
        return el
          ? `${el._debugSource.fileName.split("/").slice(2).join("/")}:${
              el._debugSource.lineNumber
            }:${el._debugSource.columnNumber}`
          : undefined;
      })(element);
    }

    function showTooltip(element) {
      if (!source) return;

      if (!tooltipElement) {
        tooltipElement = document.createElement("div");
        tooltipElement.style.position = "fixed";
        tooltipElement.style.background = "#008DDAEE";
        tooltipElement.style.color = "rgba(255, 255, 255, 1)";
        tooltipElement.style.minWidth = "min-content";
        tooltipElement.style.maxWidth = "38ch";
        tooltipElement.style.padding = "8px 12px";
        tooltipElement.style.borderRadius = "4px";
        tooltipElement.style.overflowWrap = "break-word";
        tooltipElement.style.wordBreak = "keep-all";
        tooltipElement.style.zIndex = Z_INDEX_MAX;
        tooltipElement.style.fontSize = "14px";
        tooltipElement.style.lineHeight = "1.4";
        tooltipElement.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.15)";
        tooltipElement.style.pointerEvents = "none";
        document.body.appendChild(tooltipElement);
      }

      tooltipElement.textContent = source;

      const tooltipWidth = tooltipElement.offsetWidth;
      const tooltipHeight = tooltipElement.offsetHeight;
      const windowWidth = window.innerWidth;

      const BUFFER_FROM_WINDOW = 20;
      const MARGIN_FROM_ELEMENT = 10;
      const rect = element.getBoundingClientRect();
      let left = rect.left + rect.width / 2 - tooltipWidth / 2;
      let top = rect.top - tooltipHeight - MARGIN_FROM_ELEMENT;

      if (left < MARGIN_FROM_ELEMENT) {
        left = MARGIN_FROM_ELEMENT;
      } else if (left + tooltipWidth > windowWidth) {
        left = windowWidth - tooltipWidth - BUFFER_FROM_WINDOW;
      }

      if (top < 0) {
        top = rect.bottom + MARGIN_FROM_ELEMENT;
      }

      tooltipElement.style.left = `${left}px`;
      tooltipElement.style.top = `${top}px`;

      /*
      devtool(
        `tooltipElement: ${JSON.stringify(
          tooltipElement.getBoundingClientRect()
        )}`
      );
      */
    }

    function hideTooltip() {
      if (tooltipElement) {
        tooltipElement.remove();
        tooltipElement = null;
      }
    }

    document.addEventListener("click", handleClick, { capture: true });
    document.addEventListener("mouseover", handleMouseOver, { capture: true });
    document.addEventListener("mouseout", handleMouseOut, { capture: true });
    document.addEventListener(CUSTOM_EVENTS.optionKeyUp, handleOptionKeyUp);
    document.addEventListener(CUSTOM_EVENTS.optionKeyDown, handleOptionKeyDown);
  })();

  function devtool(textContent) {
    let devtool = document.querySelector(".devtool");

    if (!devtool) {
      devtool = document.createElement("div");
      devtool.classList.add("devtool");
      document.body.insertBefore(devtool, document.body.firstChild);
    }

    devtool.innerHTML = `
    <div style="position: fixed; top: 8px; left: 8px; z-index: 9999; background-color: rgba(10,10,10,0.8); color: #FFD700; max-width: 600px; overflow-wrap: anywhere; line-height: 1.4; padding: 8px 12px; text-align: center; border: 1px solid; border-radius: 15px; line-height: 1.5;">
      <span>${textContent}</span>
    </div>
  `;
  }

  function say(...messages) {
    const prefix = "📌";

    const s1 =
      "color: black; background-color: lightblue; font-weight: bold; border-radius: 5px; padding-block: 0.2rem; padding-inline: 0.4rem; margin-block: 0.2rem;";
    const s2 = "color: #7fe787";

    const newMessages = messages.map((msg) =>
      typeof msg === "object" ? JSON.stringify(msg, null, 2) : msg
    );

    console.log(`%c${prefix}%c ${newMessages.join("")}`, s1, s2);
  }
})();
