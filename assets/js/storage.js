/**
 * Acesso seguro ao localStorage.
 * Em janelas anônimas ou com armazenamento bloqueado, cai para memória
 * sem quebrar o site (o carrinho apenas não sobrevive ao recarregamento).
 */
const memory = new Map();

function store() {
  try {
    const s = globalThis.localStorage;
    const probe = "__fanny_probe__";
    s.setItem(probe, "1");
    s.removeItem(probe);
    return s;
  } catch {
    return null;
  }
}

const backend = store();
export const isPersistent = Boolean(backend);

export function readJSON(key, fallback = null) {
  try {
    const raw = backend ? backend.getItem(key) : memory.get(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function writeJSON(key, value) {
  const raw = JSON.stringify(value);
  try {
    if (backend) backend.setItem(key, raw);
    else memory.set(key, raw);
    return true;
  } catch {
    memory.set(key, raw);
    return false;
  }
}

export function remove(key) {
  try {
    if (backend) backend.removeItem(key);
  } catch {
    /* ignora */
  }
  memory.delete(key);
}
