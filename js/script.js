// script.js
import { GeminiAgent } from './main/agent.js';
import { getConfig, getWebsocketUrl, getDeepgramApiKey, MODEL_SAMPLE_RATE } from './config/config.js';
import toolManager from './tools/tool-manager.js';
import { GoogleSearchTool } from './tools/google-search.js';
import { ChatManager } from './chat/chat-manager.js';
import { setupEventListeners } from './dom/events.js';

(async () => {
  // —————————————————————————————————————————————————————————
  // 1) Registra todas tus herramientas (built-in + GoogleSearch)
  // —————————————————————————————————————————————————————————
  // Las 4 herramientas de seguro ya vienen pre-registradas en tool-manager.js
  toolManager.registerTool('googleSearch', new GoogleSearchTool());

  // —————————————————————————————————————————————————————————
  // 2) Prepara la configuración y "expón" las declarations al servidor
  // —————————————————————————————————————————————————————————
  const config = getConfig();
  config.tools.functionDeclarations = toolManager.getToolDeclarations();

  // —————————————————————————————————————————————————————————
  // 3) Crea el agente y la UI de chat
  // —————————————————————————————————————————————————————————
  const url            = getWebsocketUrl();
  const deepgramApiKey = getDeepgramApiKey();
  const agent = new GeminiAgent({
    url,
    config,
    deepgramApiKey,
    modelSampleRate: MODEL_SAMPLE_RATE,
    toolManager
  });

  const chatManager = new ChatManager();

  // —————————————————————————————————————————————————————————
  // 4) Enlaza eventos de chat → actualiza la UI
  // —————————————————————————————————————————————————————————
  agent.on('transcription', transcript => {
    chatManager.updateStreamingMessage(transcript);
  });

  agent.on('text_sent', text => {
    chatManager.finalizeStreamingMessage();
    chatManager.addUserMessage(text);
  });

  agent.on('interrupted', () => {
    chatManager.finalizeStreamingMessage();
    if (!chatManager.lastUserMessageType) {
      chatManager.addUserAudioMessage();
    }
  });

  agent.on('turn_complete', () => {
    chatManager.finalizeStreamingMessage();
  });

  // —————————————————————————————————————————————————————————
  // 5) Conecta y maneja llamadas a herramientas (tool_call)
  // —————————————————————————————————————————————————————————
  await agent.connect();

  agent.on('tool_call', async ({ name, arguments: args, id }) => {
    const response = await toolManager.handleToolCall({ name, args, id });
    await agent.sendToolResponse(response);
  });

  // —————————————————————————————————————————————————————————
  // 6) Inicializa listeners del DOM para interacción usuario
  // —————————————————————————————————————————————————————————
  setupEventListeners(agent);
})();
