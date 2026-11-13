# Simulador de depósito — GOATBET

Página de presell (estática) com simulador de depósito/bônus, no mesmo formato da
referência `betanoss.site/presell2`, porém com a identidade da **GOATBET**
(goatibet.com): fundo `#080808`, dourado `#E7B84B`, tipografia Inter e as artes
vindas do repositório `C:\Repository\GoatBet`.

## Como abrir

É HTML/CSS/JS puro, sem build e sem dependências. Para publicar, basta subir a
pasta inteira em qualquer hospedagem estática.

Para rodar localmente (Node 18+), use o servidor embutido:

```bash
npm run dev
```

Ele serve a pasta em `http://localhost:4321`. Abrir o `index.html` direto pelo
`file://` também funciona, mas alguns navegadores bloqueiam os assets relativos.

## Estrutura

```
index.html              página inteira (hero, simulador, passos, jogos, FAQ, rodapé)
assets/css/style.css    tema e componentes
assets/js/app.js        regra da oferta + simulador
assets/img/             logo, ícones e banners copiados do GoatBet
assets/img/jogos/       capas dos jogos mais jogados
scripts/dev-server.mjs  servidor estático de desenvolvimento (sem dependências)
.claude/launch.json     configuração de preview do Claude Code
```

## Trocar a campanha

Tudo que muda de campanha está no objeto `CONFIG`, no topo de
[assets/js/app.js](assets/js/app.js):

| chave | o que faz |
| --- | --- |
| `destino` / `destinoLogin` | URLs dos botões (cadastro e login) |
| `codigoBonus` | código mostrado nos blocos "Código de bônus" (`''` esconde os blocos) |
| `codigoParam` | nome do parâmetro que leva o código na URL, ex.: `'bonus'` vira `?bonus=BOASVINDAS100` (`''` = não envia) |
| `minimo` / `maximo` / `passo` | depósito mínimo, depósito máximo e incremento do slider |
| `inicial` | valor que abre a página |
| `faixas` | faixas de bônus: `min` (depósito mínimo), `pct` (% de bônus), `maxBonus` (teto em R$, `0` = sem teto), `rotulo`, `popular` |
| `atalhos` | valores dos botões rápidos |

Os textos do subtítulo, da nota do simulador, da barra de progresso e do FAQ
"valor mínimo" são montados a partir do `CONFIG` — não precisa editar o HTML ao
mudar os números. O código aparece em quatro lugares (hero, simulador, passo 2 e
FAQ) e todos leem `codigoBonus`.

## A oferta configurada

Hoje é uma faixa só: **100% em qualquer depósito, de R$ 20 a R$ 1.000**, com o
código **BOASVINDAS100**. No topo da faixa o simulador mostra R$ 1.000 de
depósito virando R$ 2.000 creditados.

Com uma única faixa a página se adapta sozinha: os botões de escolha de faixa
somem do hero e a barra de progresso some do simulador, já que não há degrau a
subir. Basta acrescentar faixas em `CONFIG.faixas` para os dois voltarem.

Não há **teto de bônus** (`maxBonus: 0`): o limite hoje vem do próprio depósito
máximo, então o maior bônus possível é R$ 1.000. Se a promoção tiver um teto
menor que isso, preencha o `maxBonus` da faixa.

## Rastreio

A query string da página (`utm_*`, `fbclid`, `placement`, etc.) é repassada
automaticamente para o link de destino em todos os botões, como na referência.
Se o `/cadastrar` da GOATBET aceitar o código por URL, preencha `codigoParam`
que ele entra junto.
Para adicionar o pixel da Meta, inclua o snippet antes de `</head>` no
`index.html`; os botões já têm `data-cta` (`topo`, `hero`, `simulador`,
`sticky`, `entrar`) para disparar eventos por posição.

A página está com `noindex, nofollow` — uma presell de tráfego pago não deve
competir com o site principal na busca.
