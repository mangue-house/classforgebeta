// config.js - Configuração centralizada para ambientes diferentes

const isDevelopment = window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";

const config = {
  // Chave da API Gemini
  // Em desenvolvimento: use .env local
  // Em produção: injetado via GitHub Actions
  GEMINI_API_KEY: "__GEMINI_API_KEY__", // Substituído via GitHub Actions

  // Modelo Gemini
  GEMINI_MODEL: "gemini-3.1-pro",

  // URL da API Gemini
  GEMINI_URL: "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent",

  // Timeout para chamadas API (ms)
  API_TIMEOUT: 60000,

  // Debug mode
  DEBUG: isDevelopment,

  // Configurações do jogo
  GAME: {
    MAX_PDF_PAGES: 30,
    MAX_CONTENT_LENGTH: 100000,
    MIN_CONTENT_LENGTH: 10,
  },

  // Versão
  VERSION: "1.9 (Oracle)",
};

// Restaurar chave local em desenvolvimento
if (isDevelopment) {
  // Solicitar chave se não estiver configurada
  if (config.GEMINI_API_KEY === "__GEMINI_API_KEY__" || !config.GEMINI_API_KEY) {
    const key = localStorage.getItem("GEMINI_API_KEY");
    if (key) {
      config.GEMINI_API_KEY = key;
    }
  }
}

// Override de configurações via query params (para testes)
const params = new URLSearchParams(window.location.search);
if (params.has("apiKey")) {
  config.GEMINI_API_KEY = params.get("apiKey");
  localStorage.setItem("GEMINI_API_KEY", config.GEMINI_API_KEY);
}
if (params.has("debug")) {
  config.DEBUG = params.get("debug") === "true";
}

// Log de configuração (sem exibir a chave)
if (config.DEBUG) {
  console.log("🎮 Class Forge Config:", {
    ...config,
    GEMINI_API_KEY: config.GEMINI_API_KEY ? "***" : "NÃO CONFIGURADA"
  });
}

// Exportar para uso global
window.ClassForgeConfig = config;
