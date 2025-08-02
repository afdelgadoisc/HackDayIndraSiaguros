/**
 * Managing class where tools can be registered for easier use
 * Each tool must implement execute() and getDeclaration() methods.
 */
export class ToolManager {
    /**
     * Initializes a new ToolManager instance for registering, getting declarations, and executing tools.
     */
    constructor() {
        this.tools = new Map();
    }

    /**
     * Registers a new tool in the tool registry.
     * @param {string} name - Unique identifier for the tool
     * @param {Object} toolInstance - Instance of the tool implementing required interface
     */
    registerTool(name, toolInstance) {
        if (this.tools.has(name)) {
            console.warn(`Tool ${name} is already registered`);
            return;
        }
        this.tools.set(name, toolInstance);
        console.info(`Tool ${name} registered successfully`);
    }

    /**
     * Collects and returns declarations from all registered tools.
     * @returns {Array<Object>} Array of tool declarations for registered tools
     */
    getToolDeclarations() {
        const allDeclarations = [];
        this.tools.forEach((tool) => {
            if (tool.getDeclaration) {
                allDeclarations.push(tool.getDeclaration());
            } else {
                console.warn(`Tool ${tool.name} does not have a getDeclaration method`);
            }
        });
        return allDeclarations;
    }

    /**
     * Parses tool arguments and runs execute() method of the requested tool.
     * @param {Object} functionCall - Function call specification
     */
    async handleToolCall(functionCall) {
        const { name, args, id } = functionCall;
        console.info(`Handling tool call: ${name}`, { args });
        const tool = this.tools.get(name);
        try {
            const result = await tool.execute(args);
            return {
                output: result,
                id: id,
                error: null
            };
        } catch (error) {
            console.error(`Tool execution failed: ${name}`, error);
            return {
                output: null,
                id: id,
                error: error.message
            };
        }
    }
}

// ===== Default Tool Implementations =====

// 1. Devuelve un array JSON con todos los seguros mostrados en la sección #productos
class GetPageInsuranceDataTool {
    getDeclaration() {
        return {
            name: "getPageInsuranceData",
            description: "Devuelve un array JSON con todos los seguros mostrados en la sección de productos.",
            parameters: { type: "object", properties: {}, required: [] }
        };
    }
    async execute() {
        const link = document.querySelector(`header nav a[href="#productos"]`);
        link.click();
        const section = document.querySelector('#productos');
        if (!section) return [];
        const cards = section.querySelectorAll('.card');
        return Array.from(cards).map(card => {
            const id = card.id;
            const name = card.querySelector('h3')?.innerText.trim() || '';
            const description = card.querySelector('p')?.innerText.trim() || '';
            const features = Array.from(
                card.querySelectorAll('.features-list li')
            ).map(li => li.innerText.trim());

            // Parse coverage table
            const table = card.querySelector('.coverage-table');
            const coverages = [];
            if (table) {
                const headers = Array.from(
                    table.querySelectorAll('thead th')
                ).map(th => th.innerText.trim());
                table.querySelectorAll('tbody tr').forEach(tr => {
                    const cells = tr.querySelectorAll('td');
                    const entry = {};
                    cells.forEach((td, i) => {
                        entry[headers[i]] = td.innerText.trim();
                    });
                    coverages.push(entry);
                });
            }

            return { id, name, description, features, coverages };
        });
    }
}


// 3. Compara varios seguros según las necesidades del cliente y recomienda el mejor.
class CompareInsurancesTool {
    getDeclaration() {
        return {
            name: "compareInsurances",
            description: "Compara varios seguros según las necesidades del cliente y recomienda el mejor.",
            parameters: {
                type: "object",
                properties: {
                    products: { type: "array", items: { type: "string" }, description: "IDs de productos a comparar" },
                    needs: { type: "string", description: "Descripción de las necesidades del cliente" }
                },
                required: ["products", "needs"]
            }
        };
    }
    async execute({ products, needs }) {
        const all = await new GetPageInsuranceDataTool().execute();
        const selected = all.filter(p => products.includes(p.id));
        const withNumeric = selected.map(p => ({
            ...p,
            numericPrice: parseFloat(p.coverages[0][Object.keys(p.coverages[0])[1]].replace(/[^0-9\.]/g, '')) || Infinity
        }));
        withNumeric.sort((a, b) => a.numericPrice - b.numericPrice);
        return { recommended: withNumeric[0] || null, others: withNumeric };
    }
}

// 4. Rellena y envía el formulario de cotización (opcionalmente via webhook n8n)
class FillQuoteFormTool {
  getDeclaration() {
    return {
      name: "fillQuoteForm",
      description: "Rellena el formulario de cotización con los datos proporcionados y, si `send` es true, envía la solicitud a un webhook de n8n.",
      parameters: {
        type: "object",
        properties: {
          tipo:     { type: "string", description: "Tipo de seguro (hogar-basico, hogar-premium, auto-basico, auto-premium, salud-basico, salud-premium)", default: "" },
          nombre:   { type: "string", description: "Nombre completo del cliente", default: "" },
          email:    { type: "string", description: "Correo electrónico del cliente", default: "" },
          telefono: { type: "string", description: "Teléfono del cliente", default: "" },
          send:     { type: "boolean", description: "Si es true, envía la solicitud al webhook", default: false }
        },
        required: []
      }
    };
  }

  async execute({ tipo = "", nombre = "", email = "", telefono = "", send = false }) {
    const link = document.querySelector(`header nav a[href="#cotizacion"]`);
    link.click();
    // 1) Localiza el formulario
    const section = document.querySelector('#cotizacion');
    if (!section) throw new Error('Sección #cotizacion no encontrada');
    const form = section.querySelector('form');
    if (!form) throw new Error('Formulario dentro de #cotizacion no encontrado');

    // 2) Rellena los campos
    form.querySelector('select[name="tipo"]').value   = tipo;
    form.querySelector('input[name="nombre"]').value  = nombre;
    form.querySelector('input[name="email"]').value   = email;
    if (telefono) {
      form.querySelector('input[name="telefono"]').value = telefono;
    }

    // 3) Si no se envía, solo devuelvo confirmación de llenado
    if (!send) {
      return 'Formulario completado (no enviado)';
    }

    // 4) Envía los datos al webhook de n8n vía fetch
    const webhookUrl = "https://n8n.afdelgadoisc.com/webhook/9f0f3f03-5bf9-4596-a222-77ae6281fb7e";
    if (!webhookUrl) {
      throw new Error('URL de webhook n8n no configurada en localStorage');
    }
    const payload = { tipo, nombre, email, telefono };
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      throw new Error(`Error al enviar al webhook: ${res.status} ${res.statusText}`);
    }

    return 'Solicitud de cotización enviada correctamente';
  }
}

// 6) Obtener testimonios de clientes
class GetTestimonialsTool {
  getDeclaration() {
    return {
      name: 'getTestimonials',
      description: 'Devuelve una lista de testimonios de clientes con texto y autor.',
      parameters: { type: 'object', properties: {}, required: [] }
    };
  }
  async execute() {
    const link = document.querySelector(`header nav a[href="#testimonios"]`);
    link.click();
    const section = document.querySelector('#testimonios');
    if (!section) return [];
    return Array.from(section.querySelectorAll('.testimonial')).map(item => ({
      quote: item.querySelector('blockquote')?.innerText.trim() || '',
      author: item.querySelector('cite')?.innerText.replace(/^—\s*/, '').trim() || ''
    }));
  }
}

// 7) Obtener información de contacto
class GetContactInfoTool {
  getDeclaration() {
    return {
      name: 'getContactInfo',
      description: 'Devuelve el correo y teléfono de la sección de contacto.',
      parameters: { type: 'object', properties: {}, required: [] }
    };
  }
  async execute() {
    const link = document.querySelector(`header nav a[href="#contacto"]`);
    link.click();
    const section = document.querySelector('#contacto');
    if (!section) return {};
    const emailEl = section.querySelector('a[href^="mailto:"]');
    const phoneEl = section.querySelector('strong');
    return {
      email: emailEl?.innerText.trim() || '',
      phone: phoneEl?.innerText.trim() || ''
    };
  }
}

// Instanciación y registro de herramientas
const toolManager = new ToolManager();

toolManager.registerTool('getPageInsuranceData', new GetPageInsuranceDataTool());
toolManager.registerTool('compareInsurances', new CompareInsurancesTool());
toolManager.registerTool('fillQuoteForm', new FillQuoteFormTool());
toolManager.registerTool('getTestimonials', new GetTestimonialsTool());
toolManager.registerTool('getContactInfo', new GetContactInfoTool());

export default toolManager;
