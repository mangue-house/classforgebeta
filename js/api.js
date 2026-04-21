// api.js - Módulo de integração com a IA Gemini

/**
 * Normaliza os dados retornados pela IA para garantir que possuam os campos necessários.
 */
function normalizeAdventureData(data, totalStages) {
  const normalized = Array.isArray(data) ? data : [];

  while (normalized.length < totalStages && normalized.length > 0) {
    const clone = JSON.parse(JSON.stringify(normalized[normalized.length - 1]));
    normalized.push(clone);
  }

  normalized.forEach((node, index) => {
    if (index === normalized.length - 1) {
      node.type = "boss";
      if (typeof node.title === "string" && !node.title.toLowerCase().includes("boss")) {
        node.title = `BOSS FINAL: ${node.title}`;
      }
    } else {
      node.type = "enemy";
    }

    node.completed = Boolean(node.completed);
  });

  return normalized;
}

/**
 * Faz a chamada real à API do Gemini usando o prompt master e tenta com modelos fallback em caso de erro.
 */
export async function callGeminiAPI(payload) {
  const GEMINI_API_KEY = window.ClassForgeConfig?.GEMINI_API_KEY;

  if (!GEMINI_API_KEY || GEMINI_API_KEY === "__GEMINI_API_KEY__") {
    throw new Error("❌ Chave Gemini não configurada. Configure em config.js ou use ?apiKey=SUA_CHAVE");
  }

  const { content, subject, totalStages, mode, isRigorous } = payload;
  
  let modelsToTry = [];
  if (isRigorous) {
    // Se o usuário pedir um teste rígido, começa pelos modelos Pro.
    modelsToTry = ["gemini-pro-latest", "gemini-2.5-pro", "gemini-2.5-flash"];
  } else {
    // Caso normal, usa o padrão configurado e o flash como fallback seguro
    const defaultModel = window.ClassForgeConfig?.GEMINI_MODEL || "gemini-flash-latest";
    modelsToTry = [defaultModel, "gemini-2.5-flash"];
  }

  const context = subject === "Matéria Livre" || subject === ""
    ? `Baseie-se ESTRITAMENTE neste texto: "${content}"`
    : `Matéria: ${subject}. Texto apoio: "${content}"`;

  const promptStyle = mode === "omega"
    ? "MODO OMEGA (VESTIBULAR): Gere enunciados complexos, longos, estilo ENEM/FUVEST. Alto rigor acadêmico."
    : "MODO ESCOLAR: Gere enunciados claros e educativos com bom rigor factual.";

  const prompt = `ATUE COMO MESTRE DE RPG. ${context}
OBJETIVO: Gerar um array JSON com EXATAMENTE ${totalStages} objetos.
${promptStyle}
REGRAS:
1. 'title': Nome do inimigo ou boss.
2. 'desc': Lore envolvente e contextualizado.
3. RIGOR FACTUAL: Verifique fatos e contas. Sem informações falsas.
4. QUIZ: Forneça 4 OPÇÕES (A,B,C,D) em array e inclua campo 'hint' (dica útil). Indique o índice correto (0 a 3).
5. STEALTH: 'question' (Pergunta Aberta), 'answer' (Resposta completa), 'keywords' (Array de 3+ palavras chave obrigatórias para validação), 'hint' (Dica).
6. MAGIC: 'statement' (Verdadeiro ou Falso), 'is_true' (boolean), 'hint' (Dica). Pegadinhas são bem-vindas.
7. BALANCEAMENTO: Distribua dificuldade e tipos de pergunta de forma equilibrada.

A RESPOSTA DEVE SER ESTRITAMENTE UM ARRAY JSON NESTE FORMATO:
[
  {
    "title": "Nome do Inimigo",
    "desc": "Descrição lore do inimigo",
    "quiz": {
      "question": "Pergunta com 4 opções?",
      "options": ["Opção A", "Opção B", "Opção C", "Opção D"],
      "correct": 0,
      "hint": "Dica para a pergunta"
    },
    "magic": {
      "statement": "Afirmação verdadeira ou falsa",
      "is_true": true,
      "hint": "Dica"
    },
    "stealth": {
      "question": "Pergunta aberta",
      "answer": "Resposta completa esperada",
      "keywords": ["palavra1", "palavra2", "palavra3"],
      "hint": "Dica"
    }
  }
]`;

  let lastError = null;

  for (const model of modelsToTry) {
    console.log(`⏳ Tentando IA com o modelo: ${model}...`);
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature: 0.7, // Reduzido de 0.9 para melhor aderência factual
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 8192,
            responseMimeType: "application/json" // GARANTE RETORNO JSON
          }
        })
      });

      if (!response.ok) {
        const errData = await response.text();
        throw new Error(`Erro ${response.status}: ${errData}`);
      }

      const data = await response.json();
      if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
        throw new Error("Resposta inválida da API Gemini");
      }

      const text = data.candidates[0].content.parts[0].text;
      
      let parsedData;
      try {
          parsedData = JSON.parse(text);
      } catch (e) {
          throw new Error("A IA não retornou um JSON válido.");
      }

      console.log(`✅ Sucesso com o modelo: ${model}`);
      return normalizeAdventureData(parsedData, totalStages);
    } catch (error) {
      console.warn(`⚠️ Falha no modelo ${model}: ${error.message}`);
      lastError = error;
    }
  }

  // Se todos falharem
  throw new Error(`Erro ao chamar Gemini API após tentar os modelos de fallback. Último erro: ${lastError?.message}`);
}
