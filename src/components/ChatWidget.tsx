import { useEffect } from "react";

const ChatWidget = () => {
  useEffect(() => {
    const injectStyles = () => {
      const widget = document.querySelector("elevenlabs-convai");
      if (!widget?.shadowRoot) return false;

      if (widget.shadowRoot.querySelector("#el-custom-css")) return true;

      const style = document.createElement("style");
      style.id = "el-custom-css";
      // Target all elements inside shadow DOM aggressively
      style.textContent = `
        /* Hide the expanded card / popup */
        [class*="powered"] { display: none !important; }
        a[href*="elevenlabs"] { display: none !important; }
        
        /* Hide "Need help?" text and "Start a chat" button panel */
        .widget__text, .widget__cta, .widget-cta,
        [class*="WidgetBubble__text"],
        [class*="text"], [class*="label"],
        [class*="popover"], [class*="Popover"],
        [class*="tooltip"], [class*="callout"],
        [class*="bubble-text"], [class*="bubble_text"],
        [class*="prompt"], [class*="message-bubble"] {
          display: none !important;
        }

        /* Target the outer container to be small */
        :host {
          width: 48px !important;
          height: 48px !important;
          overflow: visible !important;
        }
      `;
      widget.shadowRoot.appendChild(style);
      return true;
    };

    // Also try to hide via DOM manipulation
    const hideElements = () => {
      const widget = document.querySelector("elevenlabs-convai");
      if (!widget?.shadowRoot) return;

      // Find all text nodes and elements containing branding text
      const walker = document.createTreeWalker(
        widget.shadowRoot,
        NodeFilter.SHOW_ELEMENT,
        null
      );

      let node: Node | null = walker.currentNode;
      while (node) {
        const el = node as HTMLElement;
        if (el.textContent?.includes("Powered by") || 
            el.textContent?.includes("ElevenLabs") ||
            el.textContent?.includes("Need help") ||
            el.textContent?.includes("Start a chat")) {
          // Only hide if it's a leaf-ish container (not the root)
          if (el.children.length <= 2 && el !== widget.shadowRoot.firstElementChild) {
            (el as HTMLElement).style.display = "none";
          }
        }
        node = walker.nextNode();
      }
    };

    // Retry multiple times as widget loads asynchronously
    const intervals = [500, 1000, 1500, 2000, 3000, 5000];
    const timers = intervals.map((ms) =>
      setTimeout(() => {
        injectStyles();
        hideElements();
      }, ms)
    );

    // Also watch for changes
    const observer = new MutationObserver(() => {
      injectStyles();
      hideElements();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      timers.forEach(clearTimeout);
      observer.disconnect();
    };
  }, []);

  return null;
};

export default ChatWidget;
