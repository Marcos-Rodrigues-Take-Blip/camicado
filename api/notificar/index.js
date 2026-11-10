const { app } = require('@azure/functions');
const axios = require('axios');

// Eventos permitidos -> template aprovado no Blip
const EVENTOS = {
    carrinho:   { campanha: 'Carrinho abandonado', template: 'blipcamicadocarrinho' },
    pedido:     { campanha: 'Pedido feito',        template: 'blipcamicadopedido' },
    confirmado: { campanha: 'Pedido confirmado',   template: 'blippedidoconfirmado' },
    despacha:   { campanha: 'Pedido despachado',   template: 'blipcamicadodespacha' },
    confirma:   { campanha: 'Entrega concluida',   template: 'blipcamicadoconfirma' }
};

// Todas as imagens dos produtos vêm do mesmo storage
const IMAGEM_PREFIXO = 'https://blipmediastore.blob.core.windows.net/public-medias/';

// Normaliza para 5511955504030 (sem +)
function normalizarTelefone(raw) {
    let digitos = String(raw || '').replace(/\D/g, '');
    if (digitos.length >= 10 && digitos.length <= 11) digitos = '55' + digitos;
    return /^55\d{10,11}$/.test(digitos) ? digitos : null;
}

app.http('notificar', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        try {
            const { event, name, phone, imagem } = await request.json();

            const evento = EVENTOS[event];
            if (!evento) {
                return { status: 400, jsonBody: { success: false, error: 'Evento inválido' } };
            }

            const telefone = normalizarTelefone(phone);
            if (!telefone) {
                return { status: 400, jsonBody: { success: false, error: 'Telefone inválido' } };
            }

            if (typeof imagem !== 'string' || !imagem.startsWith(IMAGEM_PREFIXO)) {
                return { status: 400, jsonBody: { success: false, error: 'Imagem inválida' } };
            }

            const nomeCliente = String(name || 'Cliente').trim().slice(0, 60);

            // Chave fica somente nas configurações do Azure (Static Web App > Configuration)
            const authHeader = process.env.BLIP_AUTH_KEY;
            if (!authHeader) {
                return { status: 500, jsonBody: { success: false, error: 'BLIP_AUTH_KEY não configurada' } };
            }

            context.log(`Evento: ${event} -> ${telefone}`);

            const payload = {
                id: `${event}_${Date.now()}`,
                to: 'postmaster@activecampaign.msging.net',
                method: 'set',
                uri: '/campaign/full',
                type: 'application/vnd.iris.activecampaign.full-campaign+json',
                resource: {
                    campaign: {
                        name: `${evento.campanha} - ${nomeCliente}`,
                        campaignType: 'Individual',
                        flowId: process.env.BLIP_FLOW_ID,
                        stateId: process.env.BLIP_STATE_ID || 'onboarding',
                        masterstate: process.env.BLIP_MASTERSTATE,
                        channelType: 'WhatsApp',
                        tags: ['API', 'BlipCamicado', evento.campanha]
                    },
                    audience: {
                        recipient: `+${telefone}`,
                        messageParams: { '0': imagem }
                    },
                    message: {
                        messageTemplate: evento.template,
                        messageParams: ['0'],
                        channelType: 'WHATSAPP',
                        messageTemplateLanguage: 'pt_BR'
                    }
                }
            };

            const resposta = await axios.post('https://payments.http.msging.net/commands', payload, {
                headers: { Authorization: authHeader, 'Content-Type': 'application/json' }
            });

            return { status: 200, jsonBody: { success: true, blipResponse: resposta.data } };
        } catch (error) {
            context.log(`Erro no disparo para o Blip: ${error.message}`);
            return {
                status: 500,
                jsonBody: { success: false, error: error.message, detail: error.response?.data || null }
            };
        }
    }
});
