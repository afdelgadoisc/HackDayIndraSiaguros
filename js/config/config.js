export const getWebsocketUrl = () => {
    const apiKey = localStorage.getItem('apiKey');
    return `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${apiKey}`;
};

export const getDeepgramApiKey = () => {
    return localStorage.getItem('deepgramApiKey') || '';
};

// Audio Configurations
export const MODEL_SAMPLE_RATE = parseInt(localStorage.getItem('sampleRate')) || 27000;

const thresholds = {
    0: "BLOCK_NONE",
    1: "BLOCK_ONLY_HIGH",
    2: "BLOCK_MEDIUM_AND_ABOVE",
    3: "BLOCK_LOW_AND_ABOVE"
}

export const getConfig = () => ({
    model: 'models/gemini-2.0-flash-exp',
    generationConfig: {
        temperature: parseFloat(localStorage.getItem('temperature')) || 1.8,
        top_p: parseFloat(localStorage.getItem('top_p')) || 0.95,
        top_k: parseInt(localStorage.getItem('top_k')) || 65,
        responseModalities: "audio",
        speechConfig: {
            voiceConfig: { 
                prebuiltVoiceConfig: { 
                    voiceName: localStorage.getItem('voiceName') || 'Aoede'                    
                }
            },
            languageCode: 'es-US'
        }
    },
    systemInstruction: {
        parts: [{
            text: `
            Eres un asistente de seguros que primero identifica la intención del usuario
            y luego ejecuta directamente las herramientas necesarias, sin preguntar si puedes usarlas:

            Tu flujo de interacción:
            1. Identifica con precisión la intención principal del usuario.
            2. Según esa intención, invoca una o varias herramientas, en este orden lógico:
                • Si la consulta se refiere a listar o explorar productos: GetPageInsuranceDataTool  
                • Si la consulta implica comparar dos o más productos: CompareInsurancesTool  
                • Si solicita llenar o enviar un formulario de cotización:FillQuoteFormTool  
                    Rellena solo los campos proporcionados y pide confirmación del email para enviar el formulario.  
                • Si la consulta es sobre lo que dicen otros clientes: GetTestimonialsTool  
                • Si la consulta es sobre cómo contactar a la empresa: GetContactInfoTool  

            3. Tras ejecutar cada herramienta, reúne sus resultados (detalles de pólizas, comparativas,
                explicación de términos, confirmación de envío, testimonios o datos de contacto) y preséntalos
                en un único mensaje claro y conciso.

            Si la petición no puede resolverse con estas herramientas ni con la navegación en el sitio,
            responde:
            “Lo siento, solo puedo ayudar con consultas sobre las pólizas disponibles, los testimonios,
            los datos de contacto y tu navegación en este sitio web.”
            `.trim()
        }]
        },
    tools: {
        functionDeclarations: []
    },
    safetySettings: [
        {
            "category": "HARM_CATEGORY_HARASSMENT",
            "threshold": thresholds[localStorage.getItem('harassmentThreshold')] || "HARM_BLOCK_THRESHOLD_UNSPECIFIED"
        },
        {
            "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
            "threshold": thresholds[localStorage.getItem('dangerousContentThreshold')] || "HARM_BLOCK_THRESHOLD_UNSPECIFIED"
        },
        {
            "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            "threshold": thresholds[localStorage.getItem('sexuallyExplicitThreshold')] || "HARM_BLOCK_THRESHOLD_UNSPECIFIED"
        },
        {
            "category": "HARM_CATEGORY_HATE_SPEECH",
            "threshold": thresholds[localStorage.getItem('hateSpeechThreshold')] || "HARM_BLOCK_THRESHOLD_UNSPECIFIED"
        },
        {
            "category": "HARM_CATEGORY_CIVIC_INTEGRITY",
            "threshold": thresholds[localStorage.getItem('civicIntegrityThreshold')] || "HARM_BLOCK_THRESHOLD_UNSPECIFIED"
        }
    ]
});