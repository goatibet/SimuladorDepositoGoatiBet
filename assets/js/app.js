/* ==========================================================================
   GOATBET — Simulador de depósito
   Toda a regra da oferta fica em CONFIG. Mexa só aqui para trocar a campanha.
   ========================================================================== */

const CONFIG = {
  // Para onde vão todos os botões. A query string da página (utm_*, fbclid,
  // xtrk...) é repassada automaticamente para o destino.
  destino: 'https://goatibet.com/cadastrar',
  destinoLogin: 'https://goatibet.com/entrar',

  // Código que o jogador digita no depósito. Deixe '' para esconder o bloco.
  codigoBonus: 'BOASVINDAS100',
  // Nome do parâmetro que leva o código na URL (ex.: 'bonus' vira ?bonus=...).
  // Deixe '' para não mandar nada na URL.
  codigoParam: '',

  minimo: 20,       // depósito mínimo aceito
  maximo: 1000,     // depósito máximo aceito (também é o fim do slider)
  passo: 10,        // incremento do slider
  inicial: 500,     // valor que abre a página

  // Faixas de bônus, da menor para a maior. maxBonus = 0 significa sem teto.
  // Hoje é uma faixa só: 100% em qualquer depósito a partir do mínimo.
  faixas: [
    { min: 20, pct: 100, maxBonus: 0, rotulo: '+100% em todo depósito' },
  ],

  atalhos: [100, 250, 500, 1000],
};

/* ------------------------------------------------------------------ utils */

const brl = new Intl.NumberFormat('pt-BR', {
  style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0,
});
const money = (v) => brl.format(Math.round(v)).replace(/ /g, ' ');
const el = (nome) => document.querySelector(`[data-bind="${nome}"]`);
const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
const semMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Faixa ativa para um valor (a maior cujo mínimo foi atingido). */
function faixaDe(valor) {
  let ativa = null;
  for (const f of CONFIG.faixas) if (valor >= f.min) ativa = f;
  return ativa;
}

/** Próxima faixa ainda não atingida. */
function proximaFaixa(valor) {
  return CONFIG.faixas.find((f) => valor < f.min) || null;
}

/** Há degrau de bônus acima do depósito mínimo? Define se a barra aparece. */
const temEscada = CONFIG.faixas.some((f) => f.min > CONFIG.minimo);

function calcular(valor) {
  const faixa = faixaDe(valor);
  if (!faixa) return { pct: 0, bonus: 0, total: valor, faixa: null };
  let bonus = (valor * faixa.pct) / 100;
  if (faixa.maxBonus > 0) bonus = Math.min(bonus, faixa.maxBonus);
  return { pct: faixa.pct, bonus, total: valor + bonus, faixa };
}

/** Conta de um número ao outro, com fallback instantâneo. */
function animarValor(node, de, para) {
  if (semMovimento || de === para) { node.textContent = money(para); return; }
  const inicio = performance.now();
  const dur = 420;
  const passo = (agora) => {
    const t = clamp((agora - inicio) / dur, 0, 1);
    const eased = 1 - Math.pow(1 - t, 3);
    node.textContent = money(de + (para - de) * eased);
    if (t < 1) requestAnimationFrame(passo);
  };
  requestAnimationFrame(passo);
}

/* ------------------------------------------------------------------ links */

function montarLinks() {
  const extras = [];
  const query = window.location.search.replace(/^\?/, '');
  if (query) extras.push(query);
  if (CONFIG.codigoParam && CONFIG.codigoBonus) {
    extras.push(`${encodeURIComponent(CONFIG.codigoParam)}=${encodeURIComponent(CONFIG.codigoBonus)}`);
  }
  const comQuery = (base) => {
    if (!extras.length) return base;
    return base + (base.includes('?') ? '&' : '?') + extras.join('&');
  };
  document.querySelectorAll('[data-cta]').forEach((a) => {
    const destino = a.dataset.cta === 'entrar' ? CONFIG.destinoLogin : CONFIG.destino;
    a.href = comQuery(destino);
    a.rel = 'nofollow noopener';
  });
}

/* ------------------------------------------------------------ código ---- */

function montarCodigo() {
  const blocos = document.querySelectorAll('[data-codigo]');
  if (!CONFIG.codigoBonus) {
    blocos.forEach((b) => b.remove());
    document.querySelectorAll('[data-codigo-texto]').forEach((n) => n.remove());
    return;
  }
  blocos.forEach((bloco) => {
    bloco.querySelector('[data-codigo-valor]').textContent = CONFIG.codigoBonus;
    const botao = bloco.querySelector('[data-copiar]');
    const rotulo = botao.textContent;
    botao.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(CONFIG.codigoBonus);
      } catch {
        const campo = document.createElement('textarea');
        campo.value = CONFIG.codigoBonus;
        campo.style.cssText = 'position:fixed;opacity:0';
        document.body.appendChild(campo);
        campo.select();
        try { document.execCommand('copy'); } catch { /* sem clipboard */ }
        campo.remove();
      }
      botao.textContent = 'Copiado!';
      botao.classList.add('codebox__btn--ok');
      setTimeout(() => {
        botao.textContent = rotulo;
        botao.classList.remove('codebox__btn--ok');
      }, 1800);
    });
  });
}

/* ------------------------------------------------------------- construção */

function montarFaixas() {
  const box = el('tiers');
  box.innerHTML = '';
  // Com uma faixa só não existe escolha a fazer — o bloco some.
  if (CONFIG.faixas.length < 2) { box.hidden = true; return; }
  box.hidden = false;
  CONFIG.faixas.forEach((f) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'tier';
    b.dataset.min = String(f.min);
    b.setAttribute('aria-pressed', 'false');
    b.innerHTML = (f.popular ? '<span class="tier__badge">MAIS POPULAR</span>' : '') + f.rotulo;
    b.addEventListener('click', () => definir(f.min, true));
    box.appendChild(b);
  });
}

function montarAtalhos() {
  const box = el('chips');
  box.innerHTML = '';
  CONFIG.atalhos.forEach((v) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip';
    b.dataset.valor = String(v);
    b.setAttribute('aria-pressed', 'false');
    b.textContent = money(v);
    b.addEventListener('click', () => definir(v, true));
    box.appendChild(b);
  });
}

/* ------------------------------------------------------------- renderizar */

const slider = document.getElementById('valor');
const campo = document.getElementById('valor-texto');

let valorAtual = CONFIG.inicial;
let bonusAnterior = 0;
let totalAnterior = 0;

function render(valor, { pular = false } = {}) {
  const { pct, bonus, total, faixa } = calcular(valor);

  // hero
  el('hero-deposito').textContent = money(valor);
  el('hero-total').textContent = money(total);

  // cartões
  if (pular) {
    el('bonus').textContent = money(bonus);
    el('total').textContent = money(total);
  } else {
    animarValor(el('bonus'), bonusAnterior, bonus);
    animarValor(el('total'), totalAnterior, total);
  }
  bonusAnterior = bonus;
  totalAnterior = total;

  el('bonus-pct').textContent = pct ? `+${pct}%` : 'sem bônus nesta faixa';
  el('sticky-total').textContent = money(total);

  // slider — compensa a largura do polegar para o preenchimento parar no centro dele
  const prop = clamp((valor - CONFIG.minimo) / (CONFIG.maximo - CONFIG.minimo), 0, 1);
  el('slider-fill').style.width = `calc(${prop * 100}% + ${(0.5 - prop) * 24}px)`;

  // progresso até a melhor faixa — a barra só existe quando há degrau a subir
  const melhor = CONFIG.faixas[CONFIG.faixas.length - 1];
  const barra = document.querySelector('.progress__bar');
  if (temEscada) {
    el('progress').style.width = `${clamp((valor / melhor.min) * 100, 0, 100)}%`;
  } else if (barra) {
    barra.hidden = true;
  }

  const msg = el('progress-msg');
  const prox = proximaFaixa(valor);
  if (prox) {
    const falta = prox.min - valor;
    msg.classList.add('progress__msg--muted');
    msg.textContent = `Faltam ${money(falta)} para o bônus de ${prox.pct}%`;
  } else if (faixa) {
    msg.classList.remove('progress__msg--muted');
    msg.textContent = temEscada
      ? `Bônus máximo de ${melhor.pct}% ativado`
      : `Bônus de ${faixa.pct}% aplicado neste depósito`;
  } else {
    msg.classList.add('progress__msg--muted');
    msg.textContent = `Depósito mínimo de ${money(CONFIG.minimo)}`;
  }

  // botão do simulador
  el('cta-sim').textContent = `DEPOSITAR ${money(valor)} AGORA`;

  // estados dos botões
  document.querySelectorAll('.tier').forEach((b) => {
    b.setAttribute('aria-pressed', String(faixa ? Number(b.dataset.min) === faixa.min : false));
  });
  document.querySelectorAll('.chip').forEach((b) => {
    b.setAttribute('aria-pressed', String(Number(b.dataset.valor) === valor));
  });
}

function definir(valor, rolar = false) {
  valorAtual = clamp(Math.round(valor), CONFIG.minimo, CONFIG.maximo);
  slider.value = String(valorAtual);
  campo.value = String(valorAtual);
  render(valorAtual);
  if (rolar && !semMovimento) {
    const card = el('total');
    card.classList.remove('is-bump');
    void card.offsetWidth;
    card.classList.add('is-bump');
  }
}

/* ---------------------------------------------------------------- eventos */

function ligarControles() {
  slider.min = String(CONFIG.minimo);
  slider.max = String(CONFIG.maximo);
  slider.step = String(CONFIG.passo);

  slider.addEventListener('input', () => {
    valorAtual = Number(slider.value);
    campo.value = String(valorAtual);
    render(valorAtual, { pular: true });
  });

  campo.addEventListener('input', () => {
    const limpo = campo.value.replace(/\D/g, '');
    campo.value = limpo;
    if (!limpo) return;
    valorAtual = clamp(Number(limpo), 0, CONFIG.maximo);
    slider.value = String(clamp(valorAtual, CONFIG.minimo, CONFIG.maximo));
    render(clamp(valorAtual, 0, CONFIG.maximo), { pular: true });
  });

  campo.addEventListener('blur', () => definir(Number(campo.value || CONFIG.minimo)));
  campo.addEventListener('keydown', (e) => { if (e.key === 'Enter') campo.blur(); });
}

function ligarBarraFixa() {
  const barra = el('stickybar');
  const alvo = document.querySelector('.hero__cta');
  if (!('IntersectionObserver' in window)) { barra.classList.add('stickybar--on'); return; }
  new IntersectionObserver(
    ([entrada]) => barra.classList.toggle('stickybar--on', !entrada.isIntersecting),
    { rootMargin: '-10px 0px 0px 0px' }
  ).observe(alvo);
}

/* ------------------------------------------------------------------ start */

montarLinks();
montarCodigo();
montarFaixas();
montarAtalhos();
ligarControles();
ligarBarraFixa();

const primeira = CONFIG.faixas[0];
const ultima = CONFIG.faixas[CONFIG.faixas.length - 1];
const comCodigo = CONFIG.codigoBonus ? ` com o código ${CONFIG.codigoBonus}` : '';

el('sim-note').textContent = temEscada
  ? `Depósito de ${money(CONFIG.minimo)} a ${money(CONFIG.maximo)}. Bônus a partir de ${money(primeira.min)}.`
  : `Depósito de ${money(CONFIG.minimo)} a ${money(CONFIG.maximo)} · crédito na hora, via PIX.`;

el('faq-minimo').textContent = temEscada
  ? `O depósito vai de ${money(CONFIG.minimo)} a ${money(CONFIG.maximo)}. Para ativar o bônus, precisa ser de pelo menos ${money(primeira.min)}.`
  : `O depósito vai de ${money(CONFIG.minimo)} a ${money(CONFIG.maximo)}, e o bônus de ${primeira.pct}% vale em todo esse intervalo.`;

el('hero-sub').textContent = temEscada
  ? `Bônus de ${primeira.pct}% a partir de ${money(primeira.min)} e ${ultima.pct}% a partir de ${money(ultima.min)}. Crédito na hora, via PIX.`
  : `Bônus de ${primeira.pct}% no seu depósito${comCodigo}. Crédito na hora, via PIX.`;

document.querySelectorAll('[data-codigo-texto]').forEach((n) => {
  n.textContent = CONFIG.codigoBonus;
});

definir(CONFIG.inicial);
render(valorAtual, { pular: true });
