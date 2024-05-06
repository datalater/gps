(function fn() {
  const Z_INDEX_MAX = 2147483647;
  const Z_INDEX_TOAST = Z_INDEX_MAX - 1;
  const Z_INDEX_GUIDE = Z_INDEX_MAX - 2;
  const Z_INDEX_TOOLTIP = Z_INDEX_MAX - 3;
  const LOCAL_STORAGE_KEY = "gps-project-path";

  say("GPS - Get Position of Source code is running.");

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

  (function initProjectPathHandler() {
    function handleKeyDown(event) {
      if (event.altKey && event.code === "KeyP") {
        const currentProjectPath = localStorage.getItem(LOCAL_STORAGE_KEY);

        const projectPath = prompt(
          `Project path를 설정해주세요.\n\ncurrent: ${currentProjectPath}`
        );

        if (projectPath) {
          localStorage.setItem(LOCAL_STORAGE_KEY, projectPath);
        }

        isOptionKeyPressed = false;
        document.dispatchEvent(new CustomEvent(CUSTOM_EVENTS.optionKeyUp));
      }
    }

    document.addEventListener("keydown", handleKeyDown);
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
    let tooltipElement = null;
    let hoveredElement = null;
    let mouseX;
    let mouseY;
    const overlayMargin = "10px";
    const overlayPadding = "8px 16px";

    const showShortcutGuide = () => {
      showGuide("Press (c) to copy, (p) to set project path");
    };

    async function handleKeyDown(event) {
      if (!source || !event.altKey) return;

      if (event.code === "KeyC") {
        navigator.clipboard.writeText(source);
        await showToast("✅ Copied to clipboard");
      }
    }

    function handleOptionKeyDown() {
      if (hoveredElement) {
        el = hoveredElement;
        source = getSource(el);
        showTooltip(el);
        showShortcutGuide();
      }
    }

    function handleOptionKeyUp() {
      hideTooltip();
      hideGuide();
    }

    function handleMouseOver(event) {
      hoveredElement = event.target;

      if (!event.altKey) return;
      if (el === event.target) return;

      mouseX = event.clientX;
      mouseY = event.clientY;

      if (mouseX > window.innerWidth / 2 && mouseY < window.innerHeight / 2) {
        overlayInlinePosition = "left";
      } else {
        overlayInlinePosition = "right";
      }

      el = event.target;
      source = getSource(el);

      showTooltip(el);
      showShortcutGuide();
    }

    function handleMouseOut(event) {
      hoveredElement = null;

      if (el === event.target) {
        el = null;
        hideTooltip();
        hideGuide();
      }
    }

    function handleClick(event) {
      if (event.altKey) {
        event.preventDefault();
        event.stopPropagation();

        isOptionKeyPressed = false;
        document.dispatchEvent(new CustomEvent(CUSTOM_EVENTS.optionKeyUp));

        navigator.clipboard.writeText(source);

        let projectPath = localStorage.getItem(LOCAL_STORAGE_KEY);

        if (!projectPath) {
          projectPath = prompt(`Project path를 설정해주세요.\n\n${source}`);

          if (projectPath) {
            localStorage.setItem(LOCAL_STORAGE_KEY, projectPath);
          }
        }

        if (!projectPath) return;

        const path = `vscode://file${projectPath}/${source}`;
        window.open(path);
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
      if (!reactRenderer) return;
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
      if (!tooltipElement) {
        tooltipElement = document.createElement("div");
        tooltipElement.style.position = "fixed";
        tooltipElement.style.background = source ? "#008DDA" : "#666666";
        tooltipElement.style.color = "rgba(255, 255, 255, 1)";
        tooltipElement.style.minWidth = "min-content";
        tooltipElement.style.maxWidth = "38ch";
        tooltipElement.style.padding = overlayPadding;
        tooltipElement.style.borderRadius = "4px";
        tooltipElement.style.overflowWrap = "break-word";
        tooltipElement.style.wordBreak = "keep-all";
        tooltipElement.style.zIndex = Z_INDEX_TOOLTIP;
        tooltipElement.style.fontSize = "14px";
        tooltipElement.style.lineHeight = "1.4";
        tooltipElement.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.15)";
        tooltipElement.style.pointerEvents = "none";
        document.body.appendChild(tooltipElement);
      }

      tooltipElement.textContent = source || "No source found";

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
    }

    function hideTooltip() {
      if (tooltipElement) {
        tooltipElement.remove();
        tooltipElement = null;
      }
    }

    function showToast(text, duration = 2000) {
      if (document.querySelector(".gps-guide")) {
        document.querySelector(".gps-guide").remove();
      }

      if (document.querySelector(".gps-toast")) {
        document.querySelector(".gps-toast").remove();
      }

      return new Promise((resolve) => {
        const toast = createBottomIsland({
          zIndex: Z_INDEX_TOAST,
          opacity: 0,
          transition: "opacity 0.3s ease-in-out",
        });
        toast.classList.add("gps-toast");
        toast.innerHTML = text;

        toast.addEventListener(
          "transitionend",
          () => {
            resolve();
          },
          { once: true }
        );

        // 토스트 요소를 서서히 나타나게 함
        setTimeout(() => {
          toast.style.opacity = "1";
        }, 100);

        // duration 이후에 토스트 요소를 서서히 사라지게 함
        setTimeout(() => {
          toast.style.opacity = "0";
          setTimeout(() => {
            toast.remove();
          }, 300);
        }, duration);
      });
    }

    function showGuide(text) {
      if (document.querySelector(".gps-toast")) {
        document.querySelector(".gps-guide")?.remove();
        return;
      }

      const guide =
        document.querySelector(".gps-guide") ||
        createBottomIsland({
          zIndex: Z_INDEX_GUIDE,
        });
      guide.classList.add("gps-guide");
      guide.innerHTML = text;
    }

    function hideGuide() {
      const guide = document.querySelector(".gps-guide");
      guide && guide.remove();
    }

    function createBottomIsland(styleProps = {}) {
      const element = document.createElement("div");
      element.classList.add("gps-bottom-island");
      element.style.position = "fixed";
      element.style.bottom = overlayMargin;
      element.style.left = "50%";
      element.style.transform = "translateX(-50%)";
      element.style.textAlign = "center";
      element.style.padding = overlayPadding;
      element.style.backgroundColor = "rgba(0, 0, 0, 1)";
      element.style.color = "#fff";
      element.style.borderRadius = "4px";
      element.style.fontSize = "16px";
      element.style.lineHeight = "1.4";
      Object.assign(element.style, styleProps);

      document.body.appendChild(element);

      const style = document.createElement("style");
      style.id = "gps-bottom-island-style";
      style.textContent = `
        .gps-bottom-island {
          @media (max-width: 768px) {
            width: calc(100% - 40px);
            font-size: 14px;
          }
        }
      `;
      document.head.appendChild(style);

      return element;
    }

    document.addEventListener("keydown", handleKeyDown, { capture: true });
    document.addEventListener("click", handleClick, { capture: true });
    document.addEventListener("mouseover", handleMouseOver, { capture: true });
    document.addEventListener("mouseout", handleMouseOut, { capture: true });
    document.addEventListener(CUSTOM_EVENTS.optionKeyUp, handleOptionKeyUp);
    document.addEventListener(CUSTOM_EVENTS.optionKeyDown, handleOptionKeyDown);
  })();

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
