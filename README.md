# Blip & Camicado — Black Friday de Natal

Site estático (`src/`) + Azure Function (`api/notificar`) que dispara templates no WhatsApp via API de campanha do Blip.

## Configurações (Azure Static Web App > Configuration)

| Nome             | Valor                                                   |
|------------------|---------------------------------------------------------|
| BLIP_AUTH_KEY    | `Key <token>`                                           |
| BLIP_FLOW_ID     | id do flow (ex: 6f06ef73-122c-4066-a336-7d84224077aa)   |
| BLIP_MASTERSTATE | id do bot (ex: blipvarejo20@msging.net)                 |
| BLIP_STATE_ID    | (opcional) id do bloco. Padrão: onboarding              |

## Eventos e templates

| Evento       | Template              | Quando                                           |
|--------------|-----------------------|--------------------------------------------------|
| carrinho     | blipcamicadocarrinho  | Fechou o modal com telefone ou ficou 15s parado  |
| pedido       | blipcamicadopedido    | "Finalizar pedido"                               |
| confirmado   | blippedidoconfirmado  | "Confirmar pedido"                               |
| despacha     | blipcamicadodespacha  | Área de teste (`?teste=1`)                       |
| confirma     | blipcamicadoconfirma  | Área de teste (`?teste=1`)                       |

Todos os templates recebem uma única variável `{{0}}`: a URL da imagem do produto.

## Produtos
Edite o array `PRODUTOS` em `src/index.html` para trocar nomes, preços e imagens.
