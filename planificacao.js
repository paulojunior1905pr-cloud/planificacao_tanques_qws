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
    return { DATA: DATA, fx: g('FAIXAS') || [], iso: iso, pts: pts, boc: boc, tq: tq, serv: serv, sit: sit, rings: Math.max.apply(null, DATA.map(function (d) { return d.a; })) };
  }

  // 3 etapas (Hidrojato, Fundo, Acabamento). Dado antigo com 4 valores: Fundo = maior entre 1ª e 2ª demão.
  function etapas(d) { var p = d.p; return p.length === 4 ? [p[0], Math.max(p[1], p[2]), p[3]] : p; }
  // cor da chapa: última etapa concluída; etapa em andamento = riscos cruzados na cor dessa etapa
  function corChapa(d, iso) {
    if (iso) { if (d.p >= 1) return { c: C.rem }; if (d.p > 0) return { c: C.ni, s: C.rem }; return null; }
    var p = d.pr ? etapas({ p: d.pr }) : etapas(d), E = [C.hidro, C.fundo, d.a === 1 ? C.acab1 : C.acab];
    var best = -1, part = -1;
    for (var i = 0; i < 3; i++) { if (p[i] >= 1) best = i; }
    for (i = best + 1; i < 3; i++) { if (p[i] > 0 && p[i] < 1) { part = i; break; } }
    if (best < 0 && part < 0) return null;
    var base = best >= 0 ? E[best] : C.ni;
    if (part < 0) return { c: base };
    var s = E[part]; if (s === C.acab && base !== C.acab1) s = '#F4F4F1'; if (s === base) s = C.niEdge;
    return { c: base, s: s };
  }
  function riscos(x, base, cor) {
    var pc = document.createElement('canvas'); pc.width = pc.height = 22;
    var q = pc.getContext('2d'); q.fillStyle = base; q.fillRect(0, 0, 22, 22); q.strokeStyle = cor; q.lineWidth = 4;
    [-22, 0, 22].forEach(function (k) { q.beginPath(); q.moveTo(k, 22); q.lineTo(k + 22, 0); q.stroke(); q.beginPath(); q.moveTo(k, 0); q.lineTo(k + 22, 22); q.stroke(); });
    return x.createPattern(pc, 'repeat');
  }

  function desenhar(D) {
    var ESTILO = (window.PLANIF_LEG || CFG.legenda || 'C');
    // imagem única: faixa contínua de 360° (360° à esquerda, 0° = Norte à direita), sem número de chapa
    var SPAN = 360, SECT = [[360, 'Vista externa · 360° à esquerda → 0° (Norte) à direita']];
    var W = 3840, PADL = 150, PADR = 60, GW = W - PADL - PADR, RH = D.rings > 3 ? 80 : 120, NR = D.rings;
    var HEAD = 110, SECH = (SECT.length > 1 ? 46 : 10) + 54 + NR * RH + 90, FOOT = D.iso ? 130 : ({ A: 185, B: 230, C: 240 }[ESTILO] || 140);
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
          if (c) { x.fillStyle = c.s ? riscos(x, c.c, c.s) : c.c; x.fillRect(lx - 0.6, ry, pw + 1.2, RH); }
          else { x.fillStyle = hatch; x.fillRect(lx, ry, pw, RH); x.strokeStyle = C.niEdge; x.lineWidth = 1.6; x.strokeRect(lx + 0.8, ry + 0.8, pw - 1.6, RH - 1.6); }
          var cx = Math.max(PADL, lx) + (Math.min(PADL + GW, lx + pw) - Math.max(PADL, lx)) / 2;
          if (Math.min(PADL + GW, lx + pw) - Math.max(PADL, lx) > 22) nums.push([cx, ry + RH / 2, d.n, c]);
        });
      });
      // faixas parciais na posição real (ex.: anel 6 acima do contraventamento): cor da etapa + contorno vermelho
      D.fx.forEach(function (f) {
        var ry = gy + (NR - f.a) * RH, bh = f.t * RH, pw = (f.ate - f.de) / SPAN * GW, E = [C.hidro, C.fundo, f.a === 1 ? C.acab1 : C.acab], best = null;
        [-360, 0, 360].forEach(function (sh) {
          var lx = PADL + (((hi - f.ate) % 360 + 360) % 360 + sh) / SPAN * GW;
          if (lx > PADL + GW || lx + pw < PADL) return;
          x.fillStyle = E[f.e]; x.fillRect(lx, ry, pw, bh);
          x.strokeStyle = '#D32F2F'; x.lineWidth = 5; x.strokeRect(lx + 2.5, ry + 2.5, pw - 5, bh - 5);
          var l = Math.max(PADL, lx), r = Math.min(PADL + GW, lx + pw);
          if (!best || r - l > best[1] - best[0]) best = [l, r];
        });
        if (f.txt && best && best[1] - best[0] > 300) {
          x.save(); x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = '700 ' + Math.round(Math.min(26, bh * 0.62)) + 'px ' + FONT_D;
          x.fillStyle = f.e === 2 && f.a !== 1 ? '#B71C1C' : '#FFFFFF'; x.fillText(f.txt, (best[0] + best[1]) / 2, ry + bh / 2 + 1); x.restore();
        }
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
    x.textBaseline = 'middle'; x.textAlign = 'left';
    var sw = function (fill, X, Y, w, h) { x.fillStyle = fill; x.fillRect(X, Y, w, h); x.strokeStyle = '#555'; x.lineWidth = 1.5; x.strokeRect(X + 0.75, Y + 0.75, w - 1.5, h - 1.5); };
    var acabSw = function (X, Y, w, h) { // acabamento: metade preta (anel 1) e metade branca (demais anéis)
      x.fillStyle = C.acab; x.fillRect(X, Y, w, h); x.fillStyle = C.acab1; x.beginPath(); x.moveTo(X, Y + h); x.lineTo(X + w, Y + h); x.lineTo(X + w, Y); x.closePath(); x.fill();
      x.strokeStyle = '#555'; x.lineWidth = 1.5; x.strokeRect(X + 0.75, Y + 0.75, w - 1.5, h - 1.5); };
    var txt = function (s, X, Y, font, cor) { x.font = font; x.fillStyle = cor || C.ink; x.fillText(s, X, Y); return x.measureText(s).width; };
    var pc = function (v) { return fmt(v * 100, 1) + '%'; };
    if (D.iso) {
      var vr = D.DATA.reduce(function (s, d) { return s + d.ar * d.p; }, 0) / tot, cx = 40, yy = fy + 45;
      [['Isolamento instalado', hatch], ['Remoção em andamento', riscos(x, C.ni, C.rem)], ['Removido', C.rem]].forEach(function (e) {
        sw(e[1], cx, yy - 22, 56, 44); cx += 72 + txt(e[0], cx + 72, yy, '600 34px ' + FONT_B) + 70; });
      x.textAlign = 'right'; txt('Removido: ' + pc(vr), W - 40, yy, '700 52px ' + FONT_D); x.textAlign = 'left';
      if (D.sit) { x.textAlign = 'right'; txt(D.sit, W - 40, yy + 52, '400 24px ' + FONT_M, C.muted); x.textAlign = 'left'; }
      return cv;
    }
    var et = [['Hidrojato', C.hidro], ['Fundo', C.fundo], ['Acabamento', C.acab]].map(function (e, i) {
      return { n: e[0], c: e[1], v: D.DATA.reduce(function (s, d) { return s + d.ar * etapas(d)[i]; }, 0) / tot }; });
    var glob = (et[0].v + et[1].v + et[2].v) / 3;
    var andam = riscos(x, C.hidro, C.fundo);
    var globalDireita = function (yy) {
      x.textAlign = 'right'; txt(pc(glob), W - 40, yy, '700 76px ' + FONT_D);
      var w = x.measureText(pc(glob)).width; txt('Avanço global', W - 60 - w, yy - 14, '600 30px ' + FONT_B, C.muted);
      txt('média das 3 etapas', W - 60 - w, yy + 20, '400 24px ' + FONT_B, C.muted); x.textAlign = 'left'; };
    if (ESTILO === 'A') { // linha única: cada cor aparece uma vez, com o avanço ao lado
      var cx = 40, yy = fy + 55;
      var item = function (fill, nome, val, acab) {
        if (acab) acabSw(cx, yy - 26, 60, 52); else sw(fill, cx, yy - 26, 60, 52);
        var w = txt(nome, cx + 76, yy, '600 36px ' + FONT_B);
        if (val !== null) w += 14 + txt(pc(val), cx + 76 + w + 14, yy, '700 40px ' + FONT_D);
        cx += 76 + w + 70; };
      item(hatch, 'Não iniciada', null);
      item(et[0].c, 'Hidrojato', et[0].v); item(et[1].c, 'Fundo', et[1].v); item(null, 'Acabamento', et[2].v, true);
      item(andam, 'Em andamento', null);
      txt('Acabamento: preto no anel 1, branco nos demais · em andamento = riscos na cor da etapa', 40, yy + 58, '400 24px ' + FONT_B, C.muted);
      globalDireita(yy);
    } else if (ESTILO === 'B') { // fluxo: a ordem das etapas, da esquerda para a direita
      var bx = 40, by = fy + 20, bw = 400, bh = 86, gap = 70;
      var passos = [{ n: 'Não iniciada', f: hatch, v: null }, { n: 'Hidrojato', f: C.hidro, v: et[0].v, tc: '#FFFFFF' }, { n: 'Fundo', f: C.fundo, v: et[1].v, tc: '#FFFFFF' }, { n: 'Acabamento', f: null, v: et[2].v }];
      passos.forEach(function (s, k) {
        var X = bx + k * (bw + gap);
        if (s.f) sw(s.f, X, by, bw, bh); else acabSw(X, by, bw, bh);
        x.textAlign = 'center';
        if (s.f === hatch) { x.fillStyle = 'rgba(255,255,255,0.85)'; x.fillRect(X + bw / 2 - 120, by + bh / 2 - 26, 240, 52); }
        if (!s.f) { x.fillStyle = 'rgba(255,255,255,0.9)'; x.fillRect(X + bw / 2 - 130, by + bh / 2 - 26, 260, 52); }
        txt(s.n, X + bw / 2, by + bh / 2 + 2, '700 40px ' + FONT_D, s.tc || C.ink);
        if (s.v !== null) {
          txt(pc(s.v), X + bw / 2, by + bh + 48, '700 44px ' + FONT_D);
        } else txt('—', X + bw / 2, by + bh + 48, '600 40px ' + FONT_D, C.muted);
        x.textAlign = 'left';
        if (k < passos.length - 1) { var ax = X + bw + 12, ay = by + bh / 2; x.strokeStyle = C.ink; x.lineWidth = 4; x.beginPath(); x.moveTo(ax, ay); x.lineTo(ax + gap - 26, ay); x.stroke();
          x.fillStyle = C.ink; x.beginPath(); x.moveTo(ax + gap - 24, ay - 12); x.lineTo(ax + gap - 6, ay); x.lineTo(ax + gap - 24, ay + 12); x.fill(); }
      });
      var lx = bx + 4 * (bw + gap) + 30;
      sw(andam, lx, by + 6, 70, 50); txt('Em andamento: riscos na cor da etapa', lx + 86, by + 31, '600 32px ' + FONT_B);
      acabSw(lx, by + 80, 70, 50); txt('Acabamento: preto no anel 1, branco nos demais', lx + 86, by + 105, '600 32px ' + FONT_B);
      globalDireita(by + 60);
    } else { // C: cartões com barra de avanço por etapa
      var cx = 40, cy = fy + 10, cw = 640, ch = 150;
      et.forEach(function (e, k) {
        var X = cx + k * (cw + 30);
        x.fillStyle = '#F4F5F3'; x.fillRect(X, cy, cw, ch); x.strokeStyle = '#D3D8D4'; x.lineWidth = 2; x.strokeRect(X + 1, cy + 1, cw - 2, ch - 2);
        if (k === 2) acabSw(X + 24, cy + 22, 50, 50); else sw(e.c, X + 24, cy + 22, 50, 50);
        txt(e.n, X + 92, cy + 48, '700 40px ' + FONT_D);
        x.textAlign = 'right'; txt(pc(e.v), X + cw - 24, cy + 48, '700 52px ' + FONT_D); x.textAlign = 'left';
        x.fillStyle = '#E4E6E8'; x.fillRect(X + 24, cy + 96, cw - 48, 26);
        x.fillStyle = k === 2 ? C.ink : e.c; x.fillRect(X + 24, cy + 96, (cw - 48) * Math.min(1, e.v), 26);
        x.strokeStyle = '#999'; x.lineWidth = 1; x.strokeRect(X + 24.5, cy + 96.5, cw - 49, 25);
      });
      var X = cx + 3 * (cw + 30);
      x.fillStyle = C.ink; x.fillRect(X, cy, 520, ch);
      txt('Avanço global', X + 28, cy + 44, '600 32px ' + FONT_B, '#C9CED4'); txt('média das 3 etapas', X + 28, cy + 82, '400 24px ' + FONT_B, '#9AA5B0');
      x.textAlign = 'right'; txt(pc(glob), X + 500, cy + 100, '700 80px ' + FONT_D, '#FFFFFF'); x.textAlign = 'left';
      var lx = X + 560, ly = cy + 26;
      [[hatch, 'Não iniciada'], [riscos(x, '#FFFFFF', C.muted), 'Em andamento']].forEach(function (e, k) {
        var Y = ly + 22 + k * 58; if (e[0]) sw(e[0], lx, Y - 18, 54, 38); else acabSw(lx, Y - 18, 54, 38); txt(e[1], lx + 70, Y + 1, '500 28px ' + FONT_B); });
    }
    if (D.sit) { x.textAlign = 'right'; txt(D.sit, W - 40, Hh - 26, '400 24px ' + FONT_M, C.muted); x.textAlign = 'left'; }
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
