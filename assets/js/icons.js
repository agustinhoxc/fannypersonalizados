/** Ícones de interface (SVG inline, herdam a cor do texto). */
const s = (d, extra = "") =>
  `<svg class="icon" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"${extra}>${d}</svg>`;

export const ICON = {
  bag: s('<path d="M5 8h14l-1.2 11.2a2 2 0 0 1-2 1.8H8.2a2 2 0 0 1-2-1.8L5 8z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/>'),
  search: s('<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>'),
  menu: s('<path d="M4 7h16M4 12h16M4 17h16"/>'),
  close: s('<path d="M6 6l12 12M18 6 6 18"/>'),
  plus: s('<path d="M12 5v14M5 12h14"/>'),
  minus: s('<path d="M5 12h14"/>'),
  trash: s('<path d="M5 7h14M10 11v6M14 11v6M7 7l1 12a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2l1-12M9 7V5h6v2"/>'),
  chevronDown: s('<path d="m6 9 6 6 6-6"/>'),
  chevronRight: s('<path d="m9 6 6 6-6 6"/>'),
  chevronLeft: s('<path d="m15 6-6 6 6 6"/>'),
  home: s('<path d="M4 11 12 4l8 7v8a1 1 0 0 1-1 1h-5v-6h-4v6H5a1 1 0 0 1-1-1z"/>'),
  grid: s('<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>'),
  edit: s('<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>'),
  pause: s('<path d="M9 6v12M15 6v12"/>'),
  play: s('<path d="M8 5.5v13l10-6.5z"/>'),
  check: s('<path d="m5 12.5 4.5 4.5L19 7.5"/>'),
  info: s('<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5M12 8h.01"/>'),
  filter: s('<path d="M4 6h16M7 12h10M10 18h4"/>'),
  sparkle: s('<path d="M12 3c.6 4.6 2.4 6.4 7 7-4.6.6-6.4 2.4-7 7-.6-4.6-2.4-6.4-7-7 4.6-.6 6.4-2.4 7-7z"/>'),
  instagram: s('<rect x="4" y="4" width="16" height="16" rx="4.5"/><circle cx="12" cy="12" r="3.6"/><path d="M16.8 7.2h.01"/>'),
  whatsapp:
    '<svg class="icon" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false" fill="currentColor"><path d="M12.04 2.5a9.4 9.4 0 0 0-8.1 14.2L2.6 21.5l4.9-1.3a9.4 9.4 0 1 0 4.54-17.7zm0 17.2a7.8 7.8 0 0 1-3.98-1.09l-.29-.17-2.9.76.78-2.83-.19-.3a7.8 7.8 0 1 1 6.58 3.63zm4.28-5.84c-.23-.12-1.38-.68-1.6-.76-.21-.08-.37-.12-.53.12-.15.23-.6.76-.74.92-.14.15-.27.17-.5.06a6.4 6.4 0 0 1-1.88-1.16 7.1 7.1 0 0 1-1.3-1.62c-.14-.23 0-.36.1-.47.11-.11.24-.27.35-.41.12-.14.16-.23.24-.39.08-.15.04-.29-.02-.4-.06-.12-.53-1.27-.72-1.74-.19-.46-.38-.39-.53-.4h-.45a.86.86 0 0 0-.62.29 2.6 2.6 0 0 0-.82 1.95 4.5 4.5 0 0 0 .95 2.4 10.4 10.4 0 0 0 3.97 3.5c.55.24.99.38 1.32.49.56.18 1.06.15 1.46.09.45-.07 1.38-.56 1.57-1.1.2-.55.2-1.01.14-1.11-.06-.1-.21-.16-.44-.27z"/></svg>',
};
