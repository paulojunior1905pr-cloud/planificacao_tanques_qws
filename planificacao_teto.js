/* Botão "Teto (PNG)": desenha no navegador a planificação (vista de cima) do lençol do teto flutuante
   com a situação da limpeza e baixa o PNG. Usa os dados que já estão na página: ROOF_P (fiada, chapa, área, polígono
   em metros, x = leste, y = norte), ROOF_L ("fiada-chapa" -> fração limpa), RP0/RP1 (pontão) e as BVs do teto.
   Modelos: A = vista de cima + cartões embaixo; B = 16:9, planta à esquerda e painel à direita;
   C = planta com fiadas numeradas + avanço por fiada. Imagem sempre clara, independente do tema do site. */
(function () {
  'use strict';
  var C = { limpo: '#2E86C1', sujo: '#D9D2C3', sujoEdge: '#A8A292', parc: '#8FBBD9', pont: '#C9CED4', shell: '#1B2430',
    ink: '#1B2430', muted: '#5B6672', bv: '#E67E22', bvC: '#C62828', card: '#F4F5F3', cardEdge: '#D3D8D4' };
  var FD = "'Barlow Condensed','Arial Narrow',Arial,sans-serif", FB = "'IBM Plex Sans',Arial,sans-serif", FM = "'IBM Plex Mono','Courier New',monospace";
  var RS = 49.25; // raio do costado (m)
  var BVT = [[0, 22.2, 'baixa'], [60, 22.2, 'baixa'], [120, 22.2, 'baixa'], [180, 22.2, 'baixa'], [240, 22.2, 'baixa'], [300, 22.2, 'baixa'], [48.5, 35.8, 'alta'], [253, 35.8, 'alta']];
  function g(n) { try { return eval(n); } catch (e) { return undefined; } }
  function fmt(x, d) { return x.toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d }); }

  function dados() {
    var P = g('ROOF_P') || [], L = g('ROOF_L') || {};
    var pl = P.map(function (p) { return { f: p[0], c: p[1], ar: p[2], poly: p[3], p: Math.min(1, L[p[0] + '-' + p[1]] || 0) }; });
    var tot = 0, ok = 0, nL = 0, nP = 0, aL = 0, aP = 0, fi = {};
    pl.forEach(function (d) { tot += d.ar; ok += d.ar * d.p; if (d.p >= 1) { nL++; aL += d.ar; } else if (d.p > 0) { nP++; aP += d.ar; }
      var F = fi[d.f] || (fi[d.f] = { f: d.f, ar: 0, ok: 0, y: 0, n: 0 }); F.ar += d.ar; F.ok += d.ar * d.p;
      d.poly.forEach(function (q) { F.y += q[1]; F.n++; }); });
    var fiadas = Object.keys(fi).map(function (k) { var F = fi[k]; F.y /= F.n; return F; }).sort(function (a, b) { return a.f - b.f; });
    var pts = [], NUM = g('NUM'), BVS = g('BVS');
    (NUM || BVS || []).forEach(function (n) { if (String(n[1]).indexOf('BV') === 0) pts.push([n[0], n[1]]); });
    var tq = ((document.querySelector('h1') || {}).textContent || document.title).match(/TQ-\d+/);
    var sit = window.ROOF_SIT || ((document.querySelector('header .date') || {}).textContent || '').trim();
    return { pl: pl, tot: tot, ok: ok, nL: nL, nP: nP, aL: aL, aP: aP, n: pl.length, fiadas: fiadas, pts: pts,
      rp0: g('RP0') || 36.937, rp1: g('RP1') || 49.05, tq: tq ? tq[0] : '', sit: sit };
  }

  function corChapa(p) { return p >= 1 ? C.limpo : C.sujo; } // só 2 estados (Paulo, 24/11): chapa parcial = parte limpa em azul

  // planta: centro (cx, cy), escala s px/m
  function planta(x, D, cx, cy, s, o) {
    o = o || {};
    var X = function (m) { return cx + m * s; }, Y = function (m) { return cy - m * s; };
    var RR = o.soLencol ? D.rp0 + 1.2 : RS; // raio de referência dos ângulos / norte
    // costado e pontão (fora no modelo só do lençol)
    if (!o.soLencol) { x.fillStyle = C.pont; x.beginPath(); x.arc(cx, cy, D.rp1 * s, 0, 2 * Math.PI); x.fill(); }
    x.fillStyle = '#FFFFFF'; x.beginPath(); x.arc(cx, cy, D.rp0 * s, 0, 2 * Math.PI); x.fill();
    // chapas do lençol
    x.lineJoin = 'round';
    D.pl.forEach(function (d) {
      x.beginPath(); d.poly.forEach(function (q, i) { if (i) x.lineTo(X(q[0]), Y(q[1])); else x.moveTo(X(q[0]), Y(q[1])); }); x.closePath();
      x.fillStyle = corChapa(d.p); x.fill();
      if (d.p > 0 && d.p < 1) { // parte limpa proporcional à área, a partir do lado leste da chapa
        var x0 = Infinity, x1 = -Infinity; d.poly.forEach(function (q) { x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); });
        x.save(); x.clip(); x.fillStyle = C.limpo; x.fillRect(X(x1 - (x1 - x0) * d.p), 0, (x1 - x0) * d.p * s + 2, 1e5); x.restore();
        x.beginPath(); d.poly.forEach(function (q, i) { if (i) x.lineTo(X(q[0]), Y(q[1])); else x.moveTo(X(q[0]), Y(q[1])); }); x.closePath(); }
      x.strokeStyle = d.p > 0 ? 'rgba(255,255,255,0.75)' : C.sujoEdge; x.lineWidth = 1.2; x.stroke();
    });
    // contornos
    x.strokeStyle = '#8A9096'; x.lineWidth = 2; x.beginPath(); x.arc(cx, cy, D.rp0 * s, 0, 2 * Math.PI); x.stroke();
    if (!o.soLencol) { x.strokeStyle = C.shell; x.lineWidth = 6; x.beginPath(); x.arc(cx, cy, RS * s, 0, 2 * Math.PI); x.stroke(); }
    if (o.pontaoTxt) { x.save(); x.fillStyle = C.muted; x.font = '600 ' + Math.round(s * 1.5) + 'px ' + FB; x.textAlign = 'center'; x.textBaseline = 'middle';
      var r = (D.rp0 + D.rp1) / 2 * s, a = 135 * Math.PI / 180; x.translate(cx + r * Math.sin(a), cy - r * Math.cos(a)); x.rotate(a - Math.PI);
      x.fillText('PONTÃO (fora do acompanhamento)', 0, 0); x.restore(); }
    // ângulos a cada 30° fora do costado
    x.fillStyle = C.muted; x.font = '600 ' + Math.round(s * 1.25) + 'px ' + FM; x.textAlign = 'center'; x.textBaseline = 'middle';
    for (var a = 0; a < 360; a += 30) { var r1 = RR * s + 8, r2 = RR * s + 24, rr = RR * s + s * 3.2, t = a * Math.PI / 180;
      x.strokeStyle = C.muted; x.lineWidth = 2; x.beginPath(); x.moveTo(cx + r1 * Math.sin(t), cy - r1 * Math.cos(t)); x.lineTo(cx + r2 * Math.sin(t), cy - r2 * Math.cos(t)); x.stroke();
      if (a !== 0) x.fillText(a + '°', cx + rr * Math.sin(t), cy - rr * Math.cos(t)); }
    // norte
    var ny = cy - RR * s - s * 3.6; x.fillStyle = C.ink; x.font = '700 ' + Math.round(s * 2.2) + 'px ' + FD; x.textAlign = 'right'; x.fillText('N  0°', cx - s * 1.2, ny + s * 0.6); x.textAlign = 'center';
    x.beginPath(); x.moveTo(cx, ny - s * 0.1); x.lineTo(cx - s * 0.8, ny + s * 1.3); x.lineTo(cx + s * 0.8, ny + s * 1.3); x.closePath(); x.fill();
    // BVs do costado (referência)
    if (o.bvCostado !== false && !o.soLencol) D.pts.forEach(function (p) { var t = p[0] * Math.PI / 180, r = RS * s;
      x.fillStyle = '#FFFFFF'; x.strokeStyle = C.bvC; x.lineWidth = 4; x.beginPath(); x.arc(cx + r * Math.sin(t), cy - r * Math.cos(t), s * 0.75, 0, 2 * Math.PI); x.fill(); x.stroke();
      var r3 = RS * s + s * 5.6; x.fillStyle = C.bvC; x.font = '700 ' + Math.round(s * 1.35) + 'px ' + FD; x.fillText(p[1], cx + r3 * Math.sin(t), cy - r3 * Math.cos(t)); });
    // BVs do teto
    BVT.forEach(function (b) { var t = b[0] * Math.PI / 180, px = X(b[1] * Math.sin(t)), py = Y(b[1] * Math.cos(t));
      x.fillStyle = C.bv; x.strokeStyle = C.ink; x.lineWidth = 3; x.beginPath(); x.arc(px, py, s * (b[2] === 'alta' ? 0.9 : 0.75), 0, 2 * Math.PI); x.fill(); x.stroke();
      if (o.bvTxt) { x.font = '700 ' + Math.round(s * 1.1) + 'px ' + FB; x.textAlign = 'center'; x.fillStyle = C.ink;
        x.lineWidth = 6; x.strokeStyle = 'rgba(255,255,255,0.9)'; var lb = b[2] === 'alta' ? 'BV alta' : 'BV'; x.strokeText(lb, px, py + s * 1.9); x.fillText(lb, px, py + s * 1.9); } });
    // fiadas numeradas
    if (o.fiadas) { x.font = '600 ' + Math.round(s * 0.95) + 'px ' + FM; x.fillStyle = C.muted; x.textBaseline = 'middle';
      D.fiadas.forEach(function (F) { if (F.f % 2 && F.f !== D.fiadas.length) return;
        var hx = Math.sqrt(Math.max(0, D.rp0 * D.rp0 - F.y * F.y)); x.textAlign = 'right'; x.fillText('F' + F.f, X(-hx) - s * 0.5, Y(F.y));
        x.textAlign = 'left'; x.fillText('F' + F.f, X(hx) + s * 0.5, Y(F.y)); }); }
    x.textAlign = 'left'; x.textBaseline = 'alphabetic';
  }

  function cabecalho(x, D, W, sub, tit) {
    x.fillStyle = C.ink; x.fillRect(0, 0, W, 96);
    x.fillStyle = '#FFFFFF'; x.font = '700 50px ' + FD; x.textBaseline = 'middle'; x.fillText((D.tq ? D.tq + ' · ' : '') + (tit || 'Teto flutuante – limpeza do lençol'), 40, 50);
    x.font = '500 24px ' + FB; x.fillStyle = '#C9CED4'; x.textAlign = 'right'; x.fillText(sub || 'Vista de cima · 0° = Norte', W - 40, 50); x.textAlign = 'left'; x.textBaseline = 'alphabetic';
  }
  function sw(x, f, X, Y, w, h) { x.fillStyle = f; x.fillRect(X, Y, w, h); x.strokeStyle = '#555'; x.lineWidth = 1.5; x.strokeRect(X + 0.75, Y + 0.75, w - 1.5, h - 1.5); }
  function bvSw(x, X, Y, r) { x.fillStyle = C.bv; x.strokeStyle = C.ink; x.lineWidth = 3; x.beginPath(); x.arc(X, Y, r, 0, 2 * Math.PI); x.fill(); x.stroke(); }
  function txt(x, s, X, Y, f, c) { x.font = f; x.fillStyle = c || C.ink; x.fillText(s, X, Y); return x.measureText(s).width; }
  function pc(v) { return fmt(v * 100, 1) + '%'; }

  // cartão do avanço (escuro) + itens da legenda, em coluna (painel) ou em linha (rodapé)
  function cardGlobal(x, D, X, Y, w, h) {
    x.fillStyle = C.ink; x.fillRect(X, Y, w, h);
    txt(x, 'Lençol limpo', X + 28, Y + 48, '600 32px ' + FB, '#C9CED4');
    txt(x, fmt(D.ok, 0) + ' de ' + fmt(D.tot, 0) + ' m²', X + 28, Y + 86, '400 24px ' + FB, '#9AA5B0');
    x.textAlign = 'right'; txt(x, pc(D.ok / D.tot), X + w - 24, Y + h - 30, '700 84px ' + FD, '#FFFFFF'); x.textAlign = 'left';
    x.fillStyle = 'rgba(255,255,255,0.18)'; x.fillRect(X + 28, Y + h - 18, w - 56, 8); x.fillStyle = C.limpo; x.fillRect(X + 28, Y + h - 18, (w - 56) * Math.min(1, D.ok / D.tot), 8);
  }
  function cardItem(x, X, Y, w, h, f, nome, val, sub) {
    x.fillStyle = C.card; x.fillRect(X, Y, w, h); x.strokeStyle = C.cardEdge; x.lineWidth = 2; x.strokeRect(X + 1, Y + 1, w - 2, h - 2);
    sw(x, f, X + 24, Y + h / 2 - 25, 50, 50); txt(x, nome, X + 92, Y + h / 2 - 4, '700 38px ' + FD);
    if (sub) txt(x, sub, X + 92, Y + h / 2 + 30, '400 22px ' + FB, C.muted);
    if (val) { x.textAlign = 'right'; txt(x, val, X + w - 24, Y + h / 2 + 14, '700 46px ' + FD); x.textAlign = 'left'; }
  }
  function itens(D) {
    return [[C.limpo, 'Limpo', fmt(D.ok, 0) + ' m²', pc(D.ok / D.tot) + ' do lençol'],
      [C.sujo, 'Não limpo', fmt(D.tot - D.ok, 0) + ' m²', pc(1 - D.ok / D.tot) + ' do lençol']];
  }
  function chaveBV(x, X, Y, so) { bvSw(x, X + 16, Y, 14); txt(x, 'BV do teto', X + 44, Y + 9, '500 26px ' + FB); if (so) return;
    x.fillStyle = '#fff'; x.strokeStyle = C.bvC; x.lineWidth = 4; x.beginPath(); x.arc(X + 236, Y, 12, 0, 2 * Math.PI); x.fill(); x.stroke();
    txt(x, 'BV do costado', X + 262, Y + 9, '500 26px ' + FB);
    sw(x, C.pont, X + 480, Y - 16, 46, 32); txt(x, 'Pontão (fora do acompanhamento)', X + 540, Y + 9, '500 26px ' + FB); }

  function desenhar(D, M) {
    M = M || window.TETO_LEG || 'A'; // A = escolhido pelo Paulo (24/11/2026)
    var cv = document.createElement('canvas'), x;
    if (M === 'B') { // 16:9: planta à esquerda, painel à direita
      var W = 3840, H = 2160; cv.width = W; cv.height = H; x = cv.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, W, H);
      cabecalho(x, D, W); var s = 18.5; planta(x, D, 1160, 1150, s, { bvTxt: true, pontaoTxt: true });
      var PX = 2380, PW = 1400; cardGlobal(x, D, PX, 220, PW, 260);
      itens(D).forEach(function (e, k) { cardItem(x, PX, 520 + k * 180, PW, 150, e[0], e[1], e[2], e[3]); });
      var ly = 1110; txt(x, 'Legenda', PX, ly, '700 36px ' + FD);
      chaveBV(x, PX, ly + 60);
      txt(x, 'Limpeza em etapa única (limpo / não limpo). Não entra no avanço da pintura do costado.', PX, ly + 140, '400 26px ' + FB, C.muted);
      txt(x, D.n + ' chapas do lençol em ' + D.fiadas.length + ' fiadas · ' + fmt(D.tot, 0) + ' m²', PX, ly + 186, '400 26px ' + FB, C.muted);
      if (D.sit) { x.textAlign = 'right'; txt(x, D.sit, W - 60, H - 40, '400 26px ' + FM, C.muted); x.textAlign = 'left'; }
      return cv;
    }
    if (M === 'C') { // fiadas numeradas + avanço por fiada à direita
      var W = 3840, H = 2400; cv.width = W; cv.height = H; x = cv.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, W, H);
      cabecalho(x, D, W, 'Vista de cima · 0° = Norte · fiadas F1 (norte) a F' + D.fiadas.length + ' (sul)');
      var s = 19, cy = 1200; planta(x, D, 1180, cy, s, { bvTxt: true, fiadas: true });
      var PX = 2420, PW = 1360; cardGlobal(x, D, PX, 150, PW, 230);
      var it = itens(D); it.forEach(function (e, k) { var w = (PW - 20 * (it.length - 1)) / it.length, X = PX + k * (w + 20);
        x.fillStyle = C.card; x.fillRect(X, 410, w, 120); x.strokeStyle = C.cardEdge; x.lineWidth = 2; x.strokeRect(X + 1, 411, w - 2, 118);
        sw(x, e[0], X + 18, 432, 34, 34); txt(x, e[1], X + 64, 460, '700 30px ' + FD); txt(x, e[2] + ' · ' + e[3], X + 18, 510, '400 22px ' + FB, C.muted); });
      // barras por fiada, alinhadas à altura da fiada na planta
      txt(x, 'Limpo por fiada', PX, 600, '700 34px ' + FD);
      var bx = PX + 90, bw = PW - 200;
      var y0 = 660, step = (H - 200 - y0) / D.fiadas.length;
      D.fiadas.forEach(function (F, k) { var yy = y0 + (k + 0.5) * step, v = F.ok / F.ar, hh = step * 0.72;
        x.fillStyle = '#ECEEEC'; x.fillRect(bx, yy - hh / 2, bw, hh); x.fillStyle = C.limpo; x.fillRect(bx, yy - hh / 2, bw * v, hh);
        x.font = '600 24px ' + FM; x.fillStyle = C.muted; x.textAlign = 'right'; x.textBaseline = 'middle'; x.fillText('F' + F.f, bx - 12, yy);
        x.textAlign = 'left'; x.fillStyle = v > 0 ? C.ink : '#A0A6AC'; x.fillText(v > 0 ? fmt(v * 100, 0) + '%' : '–', bx + bw + 12, yy); x.textBaseline = 'alphabetic'; });
      chaveBV(x, 60, H - 60);
      if (D.sit) { x.textAlign = 'right'; txt(x, D.sit, W - 60, H - 40, '400 26px ' + FM, C.muted); x.textAlign = 'left'; }
      return cv;
    }
    // A: vista de cima com cartões embaixo (mesma linguagem do PNG do costado)
    // só o lençol, sem o flutuador (pedido do Paulo, 25/11/2026)
    var RA = D.rp0 + 6.5, W = 2600, s = 1180 / RA, top = 96, plan = 2 * RA * s, H = top + plan + 330; cv.width = W; cv.height = H; x = cv.getContext('2d');
    x.fillStyle = '#fff'; x.fillRect(0, 0, W, H); cabecalho(x, D, W);
    planta(x, D, W / 2, top + RA * s + 20, s, { bvTxt: false, soLencol: true });
    var fy = top + plan + 40; x.fillStyle = '#C0C5CA'; x.fillRect(40, fy - 14, W - 80, 1.5);
    var gw = 768, w3 = (W - 80 - gw - 48) / 2; itens(D).forEach(function (e, k) { cardItem(x, 40 + k * (w3 + 24), fy, w3, 150, e[0], e[1], e[2], e[3]); });
    cardGlobal(x, D, W - 40 - gw, fy, gw, 150);
    chaveBV(x, 40, fy + 210, true);
    if (D.sit) { x.textAlign = 'right'; txt(x, D.sit, W - 40, fy + 220, '400 24px ' + FM, C.muted); x.textAlign = 'left'; }
    return cv;
  }

  // ---------- flutuador (pontão): 72 porões x setor interno/externo, mesmo padrão da imagem do lençol
  function dadosFlut() {
    var S = g('FLUT_S') || [], L = g('FLUT_L') || {}, base = dados();
    var se = S.map(function (q) { var k = 'P' + q[0] + '-' + (q[1] === 'i' ? 'interno' : 'externo');
      return { p: q[0], s: q[1], a0: q[2], a1: q[3], r0: q[4], r1: q[5], ar: q[6], v: Math.min(1, L[k] || 0) }; });
    var tot = 0, ok = 0; se.forEach(function (d) { tot += d.ar; ok += d.ar * d.v; });
    return { se: se, tot: tot, ok: ok, n: se.length, nL: se.filter(function (d) { return d.v >= 1; }).length, pts: base.pts, tq: base.tq, sit: base.sit,
      rp0: base.rp0, rp1: base.rp1 };
  }
  function setor(x, cx, cy, s, r0, r1, a0, a1) { var R = Math.PI / 180;
    x.beginPath(); x.arc(cx, cy, r1 * s, (a0 - 90) * R, (a1 - 90) * R); x.arc(cx, cy, r0 * s, (a1 - 90) * R, (a0 - 90) * R, true); x.closePath(); }
  function desenharFlut(F) {
    var W = 2600, RA = F.rp1 + 7, s = 1180 / RA, top = 96, plan = 2 * RA * s, H = top + plan + 330, cx = W / 2, cy = top + RA * s + 20;
    var cv = document.createElement('canvas'); cv.width = W; cv.height = H; var x = cv.getContext('2d');
    x.fillStyle = '#fff'; x.fillRect(0, 0, W, H); cabecalho(x, F, W, 'Vista de cima · 0° = Norte · P1 = BV-1, sentido anti-horário', 'Teto flutuante – limpeza do flutuador');
    // lençol só como referência
    x.fillStyle = '#EEF0F2'; x.beginPath(); x.arc(cx, cy, F.rp0 * s, 0, 2 * Math.PI); x.fill();
    x.fillStyle = '#9AA1A8'; x.font = '700 ' + Math.round(s * 3) + 'px ' + FD; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('LENÇOL', cx, cy - s * 1.2);
    x.font = '400 ' + Math.round(s * 1.3) + 'px ' + FB; x.fillText('(acompanhado na imagem do lençol)', cx, cy + s * 2);
    // setores
    F.se.forEach(function (d) {
      setor(x, cx, cy, s, d.r0, d.r1, d.a0, d.a1); x.fillStyle = C.sujo; x.fill();
      if (d.v > 0) { setor(x, cx, cy, s, d.r0, d.r1, d.a0, d.a0 + (d.a1 - d.a0) * d.v); x.fillStyle = C.limpo; x.fill(); }
      setor(x, cx, cy, s, d.r0, d.r1, d.a0, d.a1); x.strokeStyle = C.sujoEdge; x.lineWidth = 1.5; x.stroke();
    });
    x.strokeStyle = C.shell; x.lineWidth = 6; x.beginPath(); x.arc(cx, cy, F.rp1 * s, 0, 2 * Math.PI); x.stroke();
    // número do porão (no setor interno) e BVs do flutuador
    var R = Math.PI / 180;
    for (var k = 0; k < 72; k++) { var p = k + 1, am = 107.5 - 5 * k, t = am * R, rl = (F.rp0 + 40.6) / 2;
      x.save(); x.translate(cx + rl * s * Math.sin(t), cy - rl * s * Math.cos(t)); var aa = ((am % 360) + 360) % 360; x.rotate(aa > 90 && aa < 270 ? t + Math.PI : t);
      x.fillStyle = C.ink; x.font = '700 ' + Math.round(s * 0.95) + 'px ' + FB; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('P' + p, 0, 0); x.restore();
      var ab = (2.4 + 5 * k) * R; [43.0, 46.5].forEach(function (rb) {
        x.fillStyle = '#16A085'; x.strokeStyle = C.ink; x.lineWidth = 2; x.beginPath(); x.arc(cx + rb * s * Math.sin(ab), cy - rb * s * Math.cos(ab), s * 0.42, 0, 2 * Math.PI); x.fill(); x.stroke(); }); }
    // ângulos, norte e BVs do costado
    x.fillStyle = C.muted; x.font = '600 ' + Math.round(s * 1.15) + 'px ' + FM; x.textAlign = 'center'; x.textBaseline = 'middle';
    for (var a = 30; a < 360; a += 30) { var ta = a * R, rr = F.rp1 * s + s * 4.6; x.fillText(a + '°', cx + rr * Math.sin(ta), cy - rr * Math.cos(ta)); }
    x.fillStyle = C.ink; x.font = '700 ' + Math.round(s * 2) + 'px ' + FD; x.textAlign = 'right'; x.fillText('N  0°', cx - s * 1.3, cy - F.rp1 * s - s * 4.4); x.textAlign = 'center';
    x.beginPath(); x.moveTo(cx, cy - F.rp1 * s - s * 5.4); x.lineTo(cx - s * 0.7, cy - F.rp1 * s - s * 4.1); x.lineTo(cx + s * 0.7, cy - F.rp1 * s - s * 4.1); x.closePath(); x.fill();
    F.pts.forEach(function (q) { var tq = q[0] * R, r = F.rp1 * s;
      x.fillStyle = '#fff'; x.strokeStyle = C.bvC; x.lineWidth = 4; x.beginPath(); x.arc(cx + r * Math.sin(tq), cy - r * Math.cos(tq), s * 0.6, 0, 2 * Math.PI); x.fill(); x.stroke();
      var r3 = F.rp1 * s + s * 2.3; x.fillStyle = C.bvC; x.font = '700 ' + Math.round(s * 1.2) + 'px ' + FD; x.fillText(q[1], cx + r3 * Math.sin(tq), cy - r3 * Math.cos(tq)); });
    x.textAlign = 'left'; x.textBaseline = 'alphabetic';
    // cartões (mesmo padrão do lençol)
    var fy = top + plan + 40; x.fillStyle = '#C0C5CA'; x.fillRect(40, fy - 14, W - 80, 1.5);
    var it = [[C.limpo, 'Limpo', fmt(F.ok, 0) + ' m²', pc(F.ok / F.tot) + ' do flutuador'], [C.sujo, 'Não limpo', fmt(F.tot - F.ok, 0) + ' m²', pc(1 - F.ok / F.tot) + ' do flutuador']];
    var gw = 768, w3 = (W - 80 - gw - 48) / 2; it.forEach(function (e, k) { cardItem(x, 40 + k * (w3 + 24), fy, w3, 150, e[0], e[1], e[2], e[3]); });
    var X = W - 40 - gw; x.fillStyle = C.ink; x.fillRect(X, fy, gw, 150);
    txt(x, 'Flutuador limpo', X + 28, fy + 48, '600 32px ' + FB, '#C9CED4'); txt(x, fmt(F.ok, 0) + ' de ' + fmt(F.tot, 0) + ' m²', X + 28, fy + 86, '400 24px ' + FB, '#9AA5B0');
    x.textAlign = 'right'; txt(x, pc(F.ok / F.tot), X + gw - 24, fy + 120, '700 84px ' + FD, '#FFFFFF'); x.textAlign = 'left';
    x.fillStyle = 'rgba(255,255,255,0.18)'; x.fillRect(X + 28, fy + 132, gw - 56, 8); x.fillStyle = C.limpo; x.fillRect(X + 28, fy + 132, (gw - 56) * Math.min(1, F.ok / F.tot), 8);
    x.fillStyle = '#16A085'; x.strokeStyle = C.ink; x.lineWidth = 3; x.beginPath(); x.arc(56, fy + 210, 14, 0, 2 * Math.PI); x.fill(); x.stroke();
    txt(x, 'BV do flutuador (2 por porão)', 84, fy + 219, '500 26px ' + FB);
    x.fillStyle = '#fff'; x.strokeStyle = C.bvC; x.lineWidth = 4; x.beginPath(); x.arc(510, fy + 210, 12, 0, 2 * Math.PI); x.fill(); x.stroke(); txt(x, 'BV do costado', 536, fy + 219, '500 26px ' + FB);
    if (F.sit) { x.textAlign = 'right'; txt(x, F.sit, W - 40, fy + 220, '400 24px ' + FM, C.muted); x.textAlign = 'left'; }
    return cv;
  }
  function baixarFlut() {
    var F = dadosFlut(); if (!F.se.length) return; var cv = desenharFlut(F), d = new Date(), p = function (n) { return String(n).padStart(2, '0'); };
    var nome = (F.tq || 'tanque') + '_flutuador_planificacao_' + p(d.getDate()) + '-' + p(d.getMonth() + 1) + '-' + d.getFullYear() + '.png';
    cv.toBlob(function (b) { var a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = nome; document.body.appendChild(a); a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000); }, 'image/png');
  }

  function nomeArquivo(tq) { var d = new Date(), p = function (n) { return String(n).padStart(2, '0'); };
    return (tq || 'tanque') + '_teto_planificacao_' + p(d.getDate()) + '-' + p(d.getMonth() + 1) + '-' + d.getFullYear() + '.png'; }
  function baixar() {
    var D = dados(); if (!D.pl.length) return;
    var cv = desenhar(D), nome = nomeArquivo(D.tq);
    cv.toBlob(function (b) {
      var a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = nome; document.body.appendChild(a); a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
    }, 'image/png');
  }
  window.PLANIF_TETO = { dados: dados, desenhar: desenhar, baixar: baixar, dadosFlut: dadosFlut, desenharFlut: desenharFlut, baixarFlut: baixarFlut };
  var bf = document.getElementById('flut-png'); if (bf) bf.addEventListener('click', function () { (document.fonts ? document.fonts.ready : Promise.resolve()).then(baixarFlut); });
  var b = document.getElementById('teto-png'); if (b) b.addEventListener('click', function () { (document.fonts ? document.fonts.ready : Promise.resolve()).then(baixar); });
})();
