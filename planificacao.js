/* Botão "Planificação (PNG)": desenha no navegador a planificação do costado no layout da aba
   "Planificação" da planilha (4 setores de 90°, um anel por linha, chapa na posição real) e baixa o PNG.
   Usa os dados que já estão na página (DATA, NUM/BVS/PLS, FEATS/BOC) e window.PLANIF_CFG {escada:[ini,fim]}.
   Cores padrão do projeto; a imagem é sempre clara, independente do tema do site. */
(function () {
  'use strict';
  var CFG = window.PLANIF_CFG || {};
  var C = {
    hidro: '#7F878E', fundo: '#7A3E22', inter: '#E2D3AE', acab: '#FFFFFF', acab1: '#1C1C1C',
    rem: '#2E8B57',
    ni: '#E4E6E8', niHatch: '#A9AFB5', niEdge: '#8A9096',
    ink: '#1B2430', muted: '#5B6672', frame: '#1B2430', bv: '#C62828', pl: '#00838F', esc: '#B8860B', escLine: '#E0A800'
  };
  var FONT_D = "'Barlow Condensed','Arial Narrow',Arial,sans-serif";
  var FONT_B = "'IBM Plex Sans',Arial,sans-serif";
  var FONT_M = "'IBM Plex Mono','Courier New',monospace";

  function g(name) { try { return eval(name); } catch (e) { return undefined; } } // consts de outros <script>
  function hex(c) { c = c.replace('#', ''); return [0, 2, 4].map(function (i) { return parseInt(c.substr(i, 2), 16); }); }
  function mix(a, b, f) { if (f === undefined) f = 0.5; var x = hex(a), y = hex(b);
    return '#' + x.map(function (v, i) { return Math.round(v + (y[i] - v) * f).toString(16).padStart(2, '0'); }).join(''); }
  function lum(c) { var x = hex(c); return (0.299 * x[0] + 0.587 * x[1] + 0.114 * x[2]) / 255; }
  function fmt(x, d) { return x.toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d }); }

  function dados() {
    var DATA = g('DATA') || [];
    var iso = DATA.length && typeof DATA[0].p === 'number';
    var pts = [];
    var NUM = g('NUM'), BVS = g('BVS'), PLS = g('PLS');
    if (NUM) NUM.forEach(function (n) { pts.push([n[0], n[1]]); });
    else { (BVS || []).forEach(function (n) { pts.push([n[0], n[1]]); }); (PLS || []).forEach(function (n) { pts.push([n[0], n[1]]); }); }
    var boc = [];
    var F = g('FEATS'), B = g('BOC');
    if (F) F.forEach(function (f) { boc.push(f[0]); });
    if (B) B.forEach(function (f) { boc.push(f[0]); });
    var tq = (document.querySelector('h1') || {}).textContent || document.title;
    tq = (tq.match(/TQ-\d+/) || [''])[0];
    var serv = ((document.querySelector('.eyebrow') || {}).textContent || '').split('·').pop().trim();
    var sit = ((document.querySelector('header .date') || {}).textContent || '').trim();
    return { DATA: DATA, iso: iso, pts: pts, boc: boc, tq: tq, serv: serv, sit: sit, rings: Math.max.apply(null, DATA.map(function (d) { return d.a; })) };
  }

  // cor da chapa no padrão da planilha: etapa mais avançada concluída; tom intermediário = próxima em andamento
  function corChapa(d, iso) {
    if (iso) { if (d.p >= 1) return C.rem; if (d.p > 0) return mix(C.ni, C.rem, 0.45); return null; }
    var E = [C.hidro, C.fundo, C.inter, d.a === 1 ? C.acab1 : C.acab];
    var best = -1, part = -1;
    for (var i = 0; i < 4; i++) { if (d.p[i] >= 1) best = i; }
    for (i = 0; i < 4; i++) { if (d.p[i] > 0 && d.p[i] < 1 && i > best) { part = i; break; } }
    if (best < 0 && part < 0) return null;
    if (part >= 0) return mix(best >= 0 ? E[best] : C.ni, E[part], 0.5);
    return E[best];
  }

  function desenhar(D) {
    // imagem única: faixa contínua de 360° (360° à esquerda, 0° = Norte à direita), sem número de chapa
    var SPAN = 360, SECT = [[360, 'Vista externa · 360° à esquerda → 0° (Norte) à direita']];
    var W = 3840, PADL = 150, PADR = 60, GW = W - PADL - PADR, RH = D.rings > 3 ? 80 : 120, NR = D.rings;
    var HEAD = 150, SECH = (SECT.length > 1 ? 46 : 10) + 54 + NR * RH + 90, FOOT = 190;
    var Hh = HEAD + SECT.length * SECH + FOOT;
    var cv = document.createElement('canvas'); cv.width = W; cv.height = Hh;
    var x = cv.getContext('2d');
    x.fillStyle = '#FFFFFF'; x.fillRect(0, 0, W, Hh);
    // hachura da não iniciada
    var pc = document.createElement('canvas'); pc.width = pc.height = 18;
    var px = pc.getContext('2d'); px.fillStyle = C.ni; px.fillRect(0, 0, 18, 18);
    px.strokeStyle = C.niHatch; px.lineWidth = 1.6;
    [-18, 0, 18].forEach(function (k) { px.beginPath(); px.moveTo(k, 18); px.lineTo(k + 18, 0); px.stroke(); });
    var hatch = x.createPattern(pc, 'repeat');

    // cabeçalho
    x.fillStyle = C.ink; x.fillRect(0, 0, W, 96);
    x.fillStyle = '#FFFFFF'; x.font = '700 50px ' + FONT_D; x.textBaseline = 'middle';
    x.fillText(D.tq + ' · ' + (D.iso ? 'Remoção do isolamento térmico do costado' : 'Pintura externa do costado') + ' – planificação', 40, 50);
    x.font = '500 24px ' + FONT_B; x.fillStyle = '#C9CED4'; x.textAlign = 'right';
    x.fillText('Vista externa · 360° à esquerda → 0° (Norte) à direita', W - 40, 50);
    x.textAlign = 'left';
    x.font = 'italic 400 26px ' + FONT_B; x.fillStyle = C.muted;
    x.fillText(D.iso ? 'Verde = isolamento removido · tom claro = remoção em andamento · hachurado = isolamento ainda instalado. BV-1 sob a escada; numeração no sentido anti-horário visto de cima.'
      : 'Cor = última etapa concluída na chapa · tom intermediário = etapa seguinte em andamento · hachurado com divisões = chapa não iniciada. BV-1 sob a escada; numeração no sentido anti-horário visto de cima.', 40, 126);

    var esc = CFG.escada;
    SECT.forEach(function (S, si) {
      var hi = S[0], y0 = HEAD + si * SECH, gy = y0 + (SECT.length > 1 ? 46 : 10) + 54, gh = NR * RH;
      var X = function (ang) { return PADL + (((hi - ang) % 360 + 360) % 360) / SPAN * GW; };
      x.fillStyle = C.ink; x.font = '700 30px ' + FONT_D; x.textBaseline = 'alphabetic'; x.textAlign = 'left'; if (SECT.length > 1) x.fillText(S[1], PADL, y0 + 32);
      // ângulos a cada 10°
      x.font = '600 22px ' + FONT_M; x.textAlign = 'center'; x.fillStyle = C.muted;
      for (var k = 0; k <= SPAN / 10; k++) { var ang = ((hi - k * 10) % 360 + 360) % 360, xx = PADL + k * 10 / SPAN * GW;
        x.fillText((k === 0 ? hi : ang) + '°', xx, gy - 10); x.fillRect(xx - 0.5, gy - 6, 1, 6); }
      // escada
      if (esc) {
        var a0 = Math.min(esc[0], esc[1]), a1 = Math.max(esc[0], esc[1]);
        [-360, 0, 360].forEach(function (sh) {
          var l = PADL + (hi - (a1 + sh)) / SPAN * GW, r = PADL + (hi - (a0 + sh)) / SPAN * GW;
          l = Math.max(l, PADL); r = Math.min(r, PADL + GW); if (r - l < 2) return;
          x.fillStyle = 'rgba(224,168,0,0.22)'; x.fillRect(l, gy - 62, r - l, 26); x.fillStyle = C.escLine; x.fillRect(l, gy - 40, r - l, 4);
          x.fillStyle = C.esc; x.font = '700 20px ' + FONT_D; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('ESCADA', (l + r) / 2, gy - 50); x.textBaseline = 'alphabetic';
        });
      }
      // anéis
      x.textAlign = 'right'; x.textBaseline = 'middle'; x.font = '700 28px ' + FONT_D; x.fillStyle = C.ink;
      for (var a = 1; a <= NR; a++) x.fillText(a + 'º anel', PADL - 14, gy + (NR - a + 0.5) * RH);
      // chapas
      x.save(); x.beginPath(); x.rect(PADL, gy, GW, gh); x.clip();
      var nums = [];
      D.DATA.forEach(function (d) {
        var w = ((d.e - d.s) % 360 + 360) % 360, ry = gy + (NR - d.a) * RH, c = corChapa(d, D.iso);
        [-360, 0, 360].forEach(function (sh) {
          var lx = PADL + (((hi - d.e) % 360 + 360) % 360 + sh) / SPAN * GW, pw = w / SPAN * GW;
          if (lx > PADL + GW || lx + pw < PADL) return;
          if (c) { x.fillStyle = c; x.fillRect(lx - 0.6, ry, pw + 1.2, RH); }
          else { x.fillStyle = hatch; x.fillRect(lx, ry, pw, RH); x.strokeStyle = C.niEdge; x.lineWidth = 1.6; x.strokeRect(lx + 0.8, ry + 0.8, pw - 1.6, RH - 1.6); }
          var cx = Math.max(PADL, lx) + (Math.min(PADL + GW, lx + pw) - Math.max(PADL, lx)) / 2;
          if (Math.min(PADL + GW, lx + pw) - Math.max(PADL, lx) > 22) nums.push([cx, ry + RH / 2, d.n, c]);
        });
      });
      if (CFG.numeros) nums.forEach(function (n) {
        var dark = n[3] && lum(n[3]) < 0.55;
        x.fillStyle = dark ? 'rgba(255,255,255,0.85)' : 'rgba(27,36,48,0.75)';
        if (!n[3]) { x.fillStyle = 'rgba(255,255,255,0.9)'; x.fillRect(n[0] - 15, n[1] - 11, 30, 22); x.fillStyle = 'rgba(27,36,48,0.8)'; }
        x.fillText(n[2], n[0], n[1] + 1);
      });
      // divisão entre anéis (leve) e moldura
      x.fillStyle = 'rgba(27,36,48,0.28)';
      for (a = 1; a < NR; a++) x.fillRect(PADL, gy + a * RH - 0.75, GW, 1.5);
      x.restore();
      x.strokeStyle = C.frame; x.lineWidth = 3; x.strokeRect(PADL, gy, GW, gh);
      // BV / PL / bocais abaixo do 1º anel
      var by = gy + gh, items = [];
      D.pts.forEach(function (p) { var d = (((hi - p[0]) % 360) + 360) % 360; if (d <= SPAN) items.push([PADL + d / SPAN * GW, p[1]]); });
      items.sort(function (a, b) { return a[0] - b[0]; });
      var prev = -999, lvl = 0;
      items.forEach(function (it) {
        lvl = it[0] - prev < 70 ? 1 - lvl : 0; prev = it[0];
        var col = it[1].indexOf('PL') === 0 ? C.pl : C.bv, ty = by + 28 + lvl * 26;
        x.strokeStyle = col; x.lineWidth = 2; x.beginPath(); x.moveTo(it[0], by + 8); x.lineTo(it[0], ty - 12); x.stroke();
        x.fillStyle = '#FFFFFF'; x.lineWidth = 2.5;
        if (it[1].indexOf('PL') === 0) { x.fillRect(it[0] - 9, by - 9, 18, 18); x.strokeRect(it[0] - 9, by - 9, 18, 18); }
        else { x.beginPath(); x.arc(it[0], by, 8, 0, 7); x.fill(); x.stroke(); }
        x.fillStyle = col; x.font = '700 28px ' + FONT_D; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(it[1], it[0], ty);
      });
      D.boc.forEach(function (b) { var d = (((hi - b) % 360) + 360) % 360; if (d > SPAN) return; var bx = PADL + d / SPAN * GW;
        x.fillStyle = '#FFFFFF'; x.strokeStyle = '#30363b'; x.lineWidth = 1.6; x.beginPath(); x.arc(bx, by - RH * 0.3, 5, 0, 7); x.fill(); x.stroke(); });
    });

    // rodapé: avanço e legenda
    var fy = HEAD + SECT.length * SECH + 20;
    x.fillStyle = '#C0C5CA'; x.fillRect(40, fy - 10, W - 80, 1.5);
    var tot = D.DATA.reduce(function (s, d) { return s + d.ar; }, 0);
    var av = D.iso ? [['Isolamento removido', C.rem, D.DATA.reduce(function (s, d) { return s + d.ar * d.p; }, 0) / tot]]
      : [['Hidrojato', C.hidro], ['Fundo 1ª demão', C.fundo], ['2ª demão', C.inter], ['Acabamento', C.acab]].map(function (e, i) {
        return [e[0], e[1], D.DATA.reduce(function (s, d) { return s + d.ar * d.p[i]; }, 0) / tot]; });
    x.textBaseline = 'middle'; x.textAlign = 'left';
    x.fillStyle = C.ink; x.font = '700 40px ' + FONT_D; x.fillText('Avanço:', 40, fy + 30);
    var cx = 200;
    av.forEach(function (e) {
      x.fillStyle = e[1]; x.fillRect(cx, fy + 12, 36, 36); x.strokeStyle = '#333'; x.lineWidth = 1; x.strokeRect(cx + 0.5, fy + 12.5, 35, 35);
      x.fillStyle = C.ink; x.font = '600 38px ' + FONT_D; var t = e[0] + ' ' + fmt(e[2] * 100, 1) + '%'; x.fillText(t, cx + 48, fy + 31);
      cx += 48 + x.measureText(t).width + 50;
    });
    var leg = D.iso ? [['Isolamento instalado', null], ['Em andamento', mix(C.ni, C.rem, 0.45)], ['Removido', C.rem]]
      : [['Não iniciada', null], ['Hidrojato', C.hidro], ['Fundo 1ª demão', C.fundo], ['2ª demão', C.inter], ['Acabamento (anéis 2 em diante)', C.acab], ['Acabamento (anel 1)', C.acab1], ['Tom intermediário = etapa seguinte em andamento', mix(C.fundo, C.inter, 0.5)]];
    cx = 40; var ly = fy + 100;
    x.font = '500 30px ' + FONT_B;
    leg.forEach(function (e) {
      var w = 40 + 12 + x.measureText(e[0]).width + 44;
      if (cx + w > W - 40) { cx = 40; ly += 40; }
      x.fillStyle = e[1] || hatch; x.fillRect(cx, ly - 17, 40, 34);
      x.strokeStyle = '#555'; x.lineWidth = 1; x.strokeRect(cx + 0.5, ly - 16.5, 39, 33);
      x.fillStyle = C.ink; x.fillText(e[0], cx + 52, ly + 1); cx += w;
    });
    if (D.sit) { x.font = '400 26px ' + FONT_M; x.fillStyle = C.muted; x.textAlign = 'right'; x.fillText(D.sit, W - 40, fy + 31); }
    return cv;
  }

  function nomeArquivo(tq) {
    var d = new Date(), p = function (n) { return String(n).padStart(2, '0'); };
    return (tq || 'tanque') + '_planificacao_' + p(d.getDate()) + '-' + p(d.getMonth() + 1) + '-' + d.getFullYear() + '.png';
  }

  function baixar(btn) {
    var old = btn.textContent; btn.textContent = 'Gerando…'; btn.disabled = true;
    var go = function () {
      try {
        var D = dados(), cv = desenhar(D), name = nomeArquivo(D.tq);
        cv.toBlob(function (b) {
          var fim = function () { btn.textContent = old; btn.disabled = false; };
          var direto = function () {
            var a = document.createElement('a'); a.download = name; a.href = URL.createObjectURL(b);
            document.body.appendChild(a); a.click(); a.remove();
            setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000); fim();
          };
          // dentro do claude.ai (página de teste) o download passa pela confirmação do próprio claude.ai
          if (window.claude && window.claude.use) {
            window.claude.use('downloads').then(function (dl) {
              if (!dl) return direto();
              dl.save({ filename: name, data: b }).then(fim, fim);
            }, direto);
          } else direto();
        }, 'image/png');
      } catch (e) { console.error(e); btn.textContent = old; btn.disabled = false; alert('Não foi possível gerar a imagem.'); }
    };
    (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(go);
  }

  window.PLANIF = { dados: dados, desenhar: desenhar };
  var b = document.getElementById('planif-png');
  if (b) b.addEventListener('click', function () { baixar(b); });
})();
