import XLSXStyle from 'xlsx-js-style';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ── Paleta del sistema de diseño ──────────────────────────────────────────────
const C = {
  indigo600:  '4F46E5',
  indigo700:  '4338CA',
  indigo100:  'E0E7FF',
  indigo50:   'EEF2FF',
  purple600:  '9333EA',
  white:      'FFFFFF',
  gray900:    '111827',
  gray700:    '374151',
  gray500:    '6B7280',
  gray400:    '9CA3AF',
  gray100:    'F3F4F6',
  gray50:     'F9FAFB',
  green600:   '16A34A',
  green50:    'F0FDF4',
  red600:     'DC2626',
  red50:      'FEF2F2',
  amber500:   'F59E0B',
};

const font  = (color, bold = false, sz = 11) => ({ name: 'Calibri', sz, bold, color: { rgb: color } });
const fill  = (fgColor) => ({ type: 'pattern', patternType: 'solid', fgColor: { rgb: fgColor } });
const border = (clr = 'E5E7EB') => ({
  top:    { style: 'thin', color: { rgb: clr } },
  bottom: { style: 'thin', color: { rgb: clr } },
  left:   { style: 'thin', color: { rgb: clr } },
  right:  { style: 'thin', color: { rgb: clr } },
});
const align = (h = 'left', v = 'center', wrap = false) => ({ horizontal: h, vertical: v, wrapText: wrap });

const cell = (v, s) => ({ v, t: typeof v === 'number' ? 'n' : 's', s });

// Celda blanca de relleno (mantiene la "página" blanca y sin cuadrícula)
const blank = () => ({ v: '', t: 's', s: { fill: fill(C.white) } });

// Fila de banner que ocupa todo el ancho con un mismo color de fondo
const bannerRow = (text, width, style) => {
  const arr = [cell(text, style)];
  for (let i = 1; i < width; i++) arr.push({ v: '', t: 's', s: { fill: style.fill } });
  return arr;
};

// Normaliza todas las filas a un ancho fijo rellenando con blanco
const padRows = (rows, width) =>
  rows.map((r) => {
    const c = r.slice();
    while (c.length < width) c.push(blank());
    return c;
  });

const precisionColor = (pct) =>
  pct >= 70 ? C.green600 : pct >= 40 ? C.amber500 : C.red600;

// Construye "13 jun 2026  ·  14:25 – 14:31 hrs" según los datos disponibles
const dateTimeLabel = ({ date, time, endTime }) => {
  let label = date || '';
  if (time && endTime && endTime !== time) label += `  ·  ${time} – ${endTime} hrs`;
  else if (time) label += `  ·  ${time} hrs`;
  return label;
};

// ════════════════════════════════════════════════════════════════════════════
//  HOJA 1 — Participantes
// ════════════════════════════════════════════════════════════════════════════
const buildParticipantsSheet = (sessionData) => {
  const { title, precision, completion, participants, questions, users } = sessionData;
  const subtitle = dateTimeLabel(sessionData);
  const W = 9; // #, Código, Nombre, Cargo, Precisión, Punteo, Correctas, Incorrectas, Total

  const sectionStyle = { font: font(C.indigo700, true, 10), fill: fill(C.indigo50), alignment: align('left') };

  // KPI cards (4) — etiqueta arriba, valor abajo
  const kpiLabel = (t) => ({ v: t, t: 's', s: { font: font(C.gray500, false, 9), fill: fill(C.gray50), alignment: align('center'), border: border('FFFFFF') } });
  const kpiValue = (v, pct = false) => ({
    v: pct ? v / 100 : v, t: 'n', z: pct ? '0%' : '#,##0',
    s: { font: font(C.indigo600, true, 15), fill: fill(C.white), alignment: align('center'), border: border() },
  });

  const labelsRow = [
    kpiLabel('Precisión media'), blank(),
    kpiLabel('Terminación'),     blank(),
    kpiLabel('Participantes'),   blank(),
    kpiLabel('Preguntas'),       blank(), blank(),
  ];
  const valuesRow = [
    kpiValue(precision, true), blank(),
    kpiValue(completion, true), blank(),
    kpiValue(participants),    blank(),
    kpiValue(questions),       blank(), blank(),
  ];

  // Cabecera de tabla
  const th = (label, h = 'center') => cell(label, {
    font: font(C.white, true, 10), fill: fill(C.indigo600),
    alignment: align(h, 'center'), border: border(C.indigo700),
  });
  const headerRow = [
    th('N°'), th('Código'), th('Nombre', 'left'), th('Cargo / Área', 'left'),
    th('Precisión'), th('Punteo'), th('Correctas'), th('Incorrectas'), th('Total'),
  ];

  // Filas de datos
  const dataRows = users.map((u, i) => {
    const bg = i % 2 === 0 ? C.white : C.indigo50;
    const base = { fill: fill(bg), border: border() };
    const td = (v, opts = {}) => ({
      v, t: typeof v === 'number' ? 'n' : 's', z: opts.z,
      s: { ...base, font: opts.font || font(C.gray700, false, 10), alignment: align(opts.h || 'center', 'center') },
    });
    return [
      td(i + 1, { font: font(C.gray400, false, 10) }),
      td(u.personnelCode || '—'),
      td(u.name, { font: font(C.gray900, true, 10), h: 'left' }),
      td(u.cargo || '—', { font: font(C.gray700, false, 10), h: 'left' }),
      td(u.precision / 100, { z: '0%', font: font(precisionColor(u.precision), true, 10) }),
      td(u.score, { z: '#,##0', font: font(C.indigo600, true, 10) }),
      td(u.correctAnswers, { font: font(C.green600, true, 10) }),
      td(u.incorrectAnswers ?? Math.max((u.totalAnswers || 0) - (u.correctAnswers || 0), 0), { font: font(C.red600, false, 10) }),
      td(u.totalQuestions || questions, { font: font(C.gray500, false, 10) }),
    ];
  });

  const rows = [
    bannerRow(title || 'Reporte de sesión', W, { font: font(C.white, true, 16), fill: fill(C.indigo600), alignment: align('left') }),
    bannerRow(`Sesión en vivo  ·  ${subtitle}`, W, { font: font(C.indigo100, false, 10), fill: fill(C.indigo700), alignment: align('left') }),
    Array(W).fill(blank()),
    labelsRow,
    valuesRow,
    Array(W).fill(blank()),
    bannerRow('DETALLE POR PARTICIPANTE', W, sectionStyle),
    headerRow,
    ...dataRows,
    Array(W).fill(blank()),
  ];

  const ws = XLSXStyle.utils.aoa_to_sheet(padRows(rows, W));

  ws['!cols'] = [
    { wch: 5 }, { wch: 12 }, { wch: 28 }, { wch: 22 },
    { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 9 },
  ];
  ws['!rows'] = [
    { hpt: 34 }, { hpt: 18 }, { hpt: 6 },
    { hpt: 16 }, { hpt: 28 }, { hpt: 8 },
    { hpt: 20 }, { hpt: 22 },
    ...dataRows.map(() => ({ hpt: 19 })),
  ];
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: W - 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: W - 1 } },
    { s: { r: 6, c: 0 }, e: { r: 6, c: W - 1 } },
    // KPI cards (2 columnas cada uno)
    { s: { r: 3, c: 0 }, e: { r: 3, c: 1 } }, { s: { r: 4, c: 0 }, e: { r: 4, c: 1 } },
    { s: { r: 3, c: 2 }, e: { r: 3, c: 3 } }, { s: { r: 4, c: 2 }, e: { r: 4, c: 3 } },
    { s: { r: 3, c: 4 }, e: { r: 3, c: 5 } }, { s: { r: 4, c: 4 }, e: { r: 4, c: 5 } },
    { s: { r: 3, c: 6 }, e: { r: 3, c: 7 } }, { s: { r: 4, c: 6 }, e: { r: 4, c: 7 } },
  ];
  // Cabecera en fila 8 (índice 7); datos desde fila 9
  ws['!freeze'] = { xSplit: 0, ySplit: 8, topLeftCell: 'A9', activePane: 'bottomLeft' };
  ws['!autofilter'] = { ref: `A8:I${8 + users.length}` };

  return ws;
};

// ════════════════════════════════════════════════════════════════════════════
//  HOJA 2 — Análisis por Pregunta
// ════════════════════════════════════════════════════════════════════════════
const buildQuestionsSheet = (sessionData) => {
  const { title } = sessionData;
  const subtitle = dateTimeLabel(sessionData);
  const questionsList = sessionData.questionsList || [];
  const detailed = sessionData.detailedAnswers || [];
  const nQ = questionsList.length;

  const sectionStyle = { font: font(C.indigo700, true, 10), fill: fill(C.indigo50), alignment: align('left') };

  // Tendencia por pregunta (orden original)
  const trends = questionsList.map((q, idx) => {
    let correct = 0, incorrect = 0, unanswered = 0;
    detailed.forEach((p) => {
      const st = p.answers?.[idx]?.status;
      if (st === 'correct') correct++;
      else if (st === 'incorrect') incorrect++;
      else unanswered++;
    });
    const answered = correct + incorrect;
    const accuracy = answered > 0 ? Math.round((correct / answered) * 100) : 0;
    const correctText = Array.isArray(q.options) && typeof q.correctAnswer === 'number'
      ? q.options[q.correctAnswer] ?? '—' : '—';
    return { num: idx + 1, text: q.question || `Pregunta ${idx + 1}`, correctText, correct, incorrect, unanswered, accuracy };
  });

  // ── Bloque A: tabla de tendencias (7 columnas) ──
  const A_W = 7;
  const thA = (label, h = 'center') => cell(label, {
    font: font(C.white, true, 10), fill: fill(C.indigo600), alignment: align(h, 'center'), border: border(C.indigo700),
  });
  const headerA = [thA('P#'), thA('Pregunta', 'left'), thA('Respuesta correcta', 'left'), thA('Correctas'), thA('Incorrectas'), thA('Sin responder'), thA('% Acierto')];
  const rowsA = trends.map((t, i) => {
    const bg = i % 2 === 0 ? C.white : C.indigo50;
    const base = { fill: fill(bg), border: border() };
    const td = (v, opts = {}) => ({ v, t: typeof v === 'number' ? 'n' : 's', z: opts.z, s: { ...base, font: opts.font || font(C.gray700, false, 10), alignment: align(opts.h || 'center', 'center', opts.wrap) } });
    return [
      td(t.num, { font: font(C.indigo600, true, 10) }),
      td(t.text, { h: 'left', font: font(C.gray900, false, 10), wrap: true }),
      td(t.correctText, { h: 'left', font: font(C.green600, false, 10), wrap: true }),
      td(t.correct, { font: font(C.green600, true, 10) }),
      td(t.incorrect, { font: font(C.red600, false, 10) }),
      td(t.unanswered, { font: font(C.gray500, false, 10) }),
      td(t.accuracy / 100, { z: '0%', font: font(precisionColor(t.accuracy), true, 10) }),
    ];
  });

  // ── Bloque B: matriz de respuestas (Código, Nombre, P1..Pn) ──
  const B_W = 2 + nQ;
  const thB = (label, h = 'center') => cell(label, {
    font: font(C.white, true, 10), fill: fill(C.indigo600), alignment: align(h, 'center', true), border: border(C.indigo700),
  });
  const headerB = [thB('Código'), thB('Nombre', 'left'), ...questionsList.map((_, i) => thB(`P${i + 1}`))];
  const rowsB = detailed.map((p, i) => {
    const bg = i % 2 === 0 ? C.white : C.indigo50;
    const base = { fill: fill(bg), border: border() };
    const codeCell = { v: p.personnelCode || '—', t: 's', s: { ...base, font: font(C.gray700, false, 10), alignment: align('center') } };
    const nameCell = { v: p.name, t: 's', s: { ...base, font: font(C.gray900, true, 10), alignment: align('left') } };
    const answerCells = questionsList.map((_, idx) => {
      const a = p.answers?.[idx];
      const st = a?.status;
      const txt = a?.selectedText ?? (st === 'unanswered' ? '—' : '—');
      let bgc = bg, fg = C.gray500;
      if (st === 'correct') { bgc = C.green50; fg = C.green600; }
      else if (st === 'incorrect') { bgc = C.red50; fg = C.red600; }
      return { v: txt, t: 's', s: { fill: fill(bgc), border: border(), font: font(fg, st === 'correct', 9), alignment: align('center', 'center', true) } };
    });
    return [codeCell, nameCell, ...answerCells];
  });

  const W = Math.max(A_W, B_W);
  const noData = detailed.length === 0;

  const rows = [
    bannerRow(title || 'Reporte de sesión', W, { font: font(C.white, true, 16), fill: fill(C.indigo600), alignment: align('left') }),
    bannerRow(`Análisis por pregunta  ·  ${subtitle}`, W, { font: font(C.indigo100, false, 10), fill: fill(C.indigo700), alignment: align('left') }),
    Array(W).fill(blank()),
    bannerRow('TENDENCIA POR PREGUNTA', W, sectionStyle),
    padRows([headerA], W)[0],
    ...padRows(rowsA, W),
    Array(W).fill(blank()),
    bannerRow('DETALLE DE RESPUESTAS POR PARTICIPANTE', W, sectionStyle),
  ];

  if (noData) {
    rows.push(bannerRow('No hay respuestas detalladas para esta sesión (disponible en sesiones nuevas).', W, { font: font(C.gray500, false, 10), fill: fill(C.gray50), alignment: align('left') }));
  } else {
    rows.push(padRows([headerB], W)[0], ...padRows(rowsB, W));
  }
  rows.push(Array(W).fill(blank()));

  const ws = XLSXStyle.utils.aoa_to_sheet(padRows(rows, W));

  // Anchos: col0 código/P#, col1 pregunta/nombre, col2 respuesta correcta/P1, resto Pn
  const cols = [{ wch: 10 }, { wch: 34 }, { wch: 24 }];
  for (let i = 3; i < W; i++) cols.push({ wch: 16 });
  ws['!cols'] = cols;

  const headerAIdx = 4; // índice de fila de headerA
  ws['!rows'] = rows.map((_, i) => {
    if (i === 0) return { hpt: 34 };
    if (i === 1) return { hpt: 18 };
    if (i >= headerAIdx + 1 && i <= headerAIdx + rowsA.length) return { hpt: 26 }; // filas de tendencia (texto largo)
    return { hpt: 20 };
  });

  const merges = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: W - 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: W - 1 } },
    { s: { r: 3, c: 0 }, e: { r: 3, c: W - 1 } },
    { s: { r: headerAIdx + rowsA.length + 2, c: 0 }, e: { r: headerAIdx + rowsA.length + 2, c: W - 1 } }, // sección detalle
  ];
  if (noData) {
    merges.push({ s: { r: headerAIdx + rowsA.length + 3, c: 0 }, e: { r: headerAIdx + rowsA.length + 3, c: W - 1 } });
  }
  ws['!merges'] = merges;

  return ws;
};

// ════════════════════════════════════════════════════════════════════════════
//  HOJA — Comentarios y calificaciones
//  `withSession` agrega una columna "Sesión" (para la exportación masiva)
// ════════════════════════════════════════════════════════════════════════════
const starString = (r) => {
  const n = Math.min(Math.max(Number(r) || 0, 0), 5);
  return '★'.repeat(n) + '☆'.repeat(5 - n);
};

const buildCommentsSheet = (title, subtitle, items, withSession) => {
  const headers = withSession
    ? ['Sesión', 'Persona', 'Cargo / Área', 'Calificación', 'Comentario', 'Fecha']
    : ['N°', 'Persona', 'Cargo / Área', 'Calificación', 'Comentario', 'Fecha'];
  const W = headers.length;

  const sectionStyle = { font: font(C.indigo700, true, 10), fill: fill(C.indigo50), alignment: align('left') };
  const th = (label, h = 'center') => cell(label, { font: font(C.white, true, 10), fill: fill(C.indigo600), alignment: align(h, 'center', true), border: border(C.indigo700) });
  const headerRow = headers.map((h, idx) => th(h, idx === 1 || idx === 2 || idx === 4 ? 'left' : 'center'));

  const dataRows = items.map((it, i) => {
    const bg = i % 2 === 0 ? C.white : C.indigo50;
    const base = { fill: fill(bg), border: border() };
    const td = (v, opts = {}) => ({ v, t: typeof v === 'number' ? 'n' : 's', s: { ...base, font: opts.font || font(C.gray700, false, 10), alignment: align(opts.h || 'center', 'center', opts.wrap) } });
    const r = Math.min(Math.max(Number(it.rating) || 0, 0), 5);
    const persona = it.personnelCode && it.personnelCode !== it.name ? `${it.personnelCode} - ${it.name}` : (it.name || 'Anónimo');
    const fecha = it.submittedAt
      ? new Date(it.submittedAt).toLocaleString('es-ES', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
      : '—';
    const firstCol = withSession
      ? td(it.sessionLabel || '—', { h: 'left', font: font(C.indigo600, true, 10) })
      : td(i + 1, { font: font(C.gray400, false, 10) });
    return [
      firstCol,
      td(persona, { h: 'left', font: font(C.gray900, true, 10) }),
      td(it.cargo || '—', { h: 'left' }),
      td(r > 0 ? `${starString(r)}  (${r}/5)` : 'Sin calificar', { font: font(r > 0 ? C.amber500 : C.gray400, false, 10) }),
      td(it.comment || '—', { h: 'left', wrap: true, font: font(it.comment ? C.gray700 : C.gray400, false, 10) }),
      td(fecha, { font: font(C.gray500, false, 9) }),
    ];
  });

  const noData = items.length === 0;
  const rows = [
    bannerRow(title || 'Comentarios', W, { font: font(C.white, true, 16), fill: fill(C.indigo600), alignment: align('left') }),
    bannerRow(subtitle, W, { font: font(C.indigo100, false, 10), fill: fill(C.indigo700), alignment: align('left') }),
    Array(W).fill(blank()),
    bannerRow('COMENTARIOS Y CALIFICACIONES', W, sectionStyle),
  ];
  if (noData) {
    rows.push(bannerRow('No hay comentarios para mostrar.', W, { font: font(C.gray500, false, 10), fill: fill(C.gray50), alignment: align('left') }));
  } else {
    rows.push(headerRow, ...dataRows);
  }
  rows.push(Array(W).fill(blank()));

  const ws = XLSXStyle.utils.aoa_to_sheet(padRows(rows, W));
  ws['!cols'] = withSession
    ? [{ wch: 16 }, { wch: 26 }, { wch: 20 }, { wch: 18 }, { wch: 50 }, { wch: 18 }]
    : [{ wch: 5 }, { wch: 26 }, { wch: 20 }, { wch: 18 }, { wch: 54 }, { wch: 18 }];
  ws['!rows'] = rows.map((_, i) => {
    if (i === 0) return { hpt: 34 };
    if (i === 1) return { hpt: 18 };
    if (!noData && i > 4) return { hpt: 30 }; // filas de comentario (texto largo)
    return { hpt: 20 };
  });
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: W - 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: W - 1 } },
    { s: { r: 3, c: 0 }, e: { r: 3, c: W - 1 } },
  ];
  if (noData) ws['!merges'].push({ s: { r: 4, c: 0 }, e: { r: 4, c: W - 1 } });
  return ws;
};

// ════════════════════════════════════════════════════════════════════════════
export const exportToExcel = (sessionData) => {
  const wb = XLSXStyle.utils.book_new();
  XLSXStyle.utils.book_append_sheet(wb, buildParticipantsSheet(sessionData), 'Participantes');
  XLSXStyle.utils.book_append_sheet(wb, buildQuestionsSheet(sessionData), 'Preguntas');
  XLSXStyle.utils.book_append_sheet(
    wb,
    buildCommentsSheet(sessionData.title, `Comentarios  ·  ${dateTimeLabel(sessionData)}`, sessionData.feedback || [], false),
    'Comentarios'
  );

  const safeName = (sessionData.title || 'reporte').replace(/[^a-zA-Z0-9_\- ]/g, '').trim();
  XLSXStyle.writeFile(wb, `${safeName || 'reporte'}_resultados.xlsx`);
};

// ════════════════════════════════════════════════════════════════════════════
//  EXPORTACIÓN MASIVA — todas las sesiones de un quiz en un solo Excel
// ════════════════════════════════════════════════════════════════════════════

// Hoja 1: Resumen de todas las sesiones
const buildSessionsSummarySheet = (quizTitle, sessions) => {
  const W = 9;
  const totalSessions = sessions.length;
  const totalParticipants = sessions.reduce((a, s) => a + (s.participants || 0), 0);
  const avgPrecision = totalSessions
    ? Math.round(sessions.reduce((a, s) => a + (s.precision || 0), 0) / totalSessions)
    : 0;

  const sectionStyle = { font: font(C.indigo700, true, 10), fill: fill(C.indigo50), alignment: align('left') };

  const kpiLabel = (t) => ({ v: t, t: 's', s: { font: font(C.gray500, false, 9), fill: fill(C.gray50), alignment: align('center') } });
  const kpiValue = (v, pct = false) => ({
    v: pct ? v / 100 : v, t: 'n', z: pct ? '0%' : '#,##0',
    s: { font: font(C.indigo600, true, 15), fill: fill(C.white), alignment: align('center'), border: border() },
  });
  const labelsRow = [
    kpiLabel('Sesiones'), blank(), blank(),
    kpiLabel('Participantes'), blank(), blank(),
    kpiLabel('Precisión prom.'), blank(), blank(),
  ];
  const valuesRow = [
    kpiValue(totalSessions), blank(), blank(),
    kpiValue(totalParticipants), blank(), blank(),
    kpiValue(avgPrecision, true), blank(), blank(),
  ];

  const th = (label, h = 'center') => cell(label, { font: font(C.white, true, 10), fill: fill(C.indigo600), alignment: align(h, 'center'), border: border(C.indigo700) });
  const headerRow = [th('N°'), th('Fecha', 'left'), th('Hora'), th('Código'), th('Participantes'), th('Preguntas'), th('Precisión'), th('Punteo Prom.'), th('Duración')];

  const dataRows = sessions.map((s, i) => {
    const raw = s.rawData || {};
    const dur = raw.finishedAt && raw.startedAt ? Math.round((raw.finishedAt - raw.startedAt) / 60000) : null;
    const avgScore = Number(raw.summary?.averageScore) || 0;
    const bg = i % 2 === 0 ? C.white : C.indigo50;
    const base = { fill: fill(bg), border: border() };
    const td = (v, opts = {}) => ({ v, t: typeof v === 'number' ? 'n' : 's', z: opts.z, s: { ...base, font: opts.font || font(C.gray700, false, 10), alignment: align(opts.h || 'center', 'center') } });
    return [
      td(i + 1, { font: font(C.gray400, false, 10) }),
      td(s.date || '—', { h: 'left', font: font(C.gray900, true, 10) }),
      td(s.time || '—'),
      td(raw.joinCode || '—'),
      td(s.participants || 0),
      td(s.questions || 0),
      td((s.precision || 0) / 100, { z: '0%', font: font(precisionColor(s.precision || 0), true, 10) }),
      td(avgScore, { z: '#,##0', font: font(C.indigo600, true, 10) }),
      td(dur === null ? '—' : `${dur} min`),
    ];
  });

  const subtitle = `${totalSessions} ${totalSessions === 1 ? 'sesión' : 'sesiones'}  ·  exportado ${new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}`;

  const rows = [
    bannerRow(quizTitle || 'Reporte de sesiones', W, { font: font(C.white, true, 16), fill: fill(C.indigo600), alignment: align('left') }),
    bannerRow(`Todas las sesiones  ·  ${subtitle}`, W, { font: font(C.indigo100, false, 10), fill: fill(C.indigo700), alignment: align('left') }),
    Array(W).fill(blank()),
    labelsRow,
    valuesRow,
    Array(W).fill(blank()),
    bannerRow('SESIONES REALIZADAS', W, sectionStyle),
    headerRow,
    ...dataRows,
    Array(W).fill(blank()),
  ];

  const ws = XLSXStyle.utils.aoa_to_sheet(padRows(rows, W));
  ws['!cols'] = [{ wch: 5 }, { wch: 16 }, { wch: 10 }, { wch: 12 }, { wch: 14 }, { wch: 11 }, { wch: 12 }, { wch: 14 }, { wch: 12 }];
  ws['!rows'] = [{ hpt: 34 }, { hpt: 18 }, { hpt: 6 }, { hpt: 16 }, { hpt: 28 }, { hpt: 8 }, { hpt: 20 }, { hpt: 22 }, ...dataRows.map(() => ({ hpt: 19 }))];
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: W - 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: W - 1 } },
    { s: { r: 6, c: 0 }, e: { r: 6, c: W - 1 } },
    { s: { r: 3, c: 0 }, e: { r: 3, c: 2 } }, { s: { r: 4, c: 0 }, e: { r: 4, c: 2 } },
    { s: { r: 3, c: 3 }, e: { r: 3, c: 5 } }, { s: { r: 4, c: 3 }, e: { r: 4, c: 5 } },
    { s: { r: 3, c: 6 }, e: { r: 3, c: 8 } }, { s: { r: 4, c: 6 }, e: { r: 4, c: 8 } },
  ];
  ws['!freeze'] = { xSplit: 0, ySplit: 8, topLeftCell: 'A9', activePane: 'bottomLeft' };
  ws['!autofilter'] = { ref: `A8:I${8 + sessions.length}` };
  return ws;
};

// Hoja 2: Participantes consolidados de todas las sesiones
const buildAllParticipantsSheet = (quizTitle, sessions) => {
  const W = 10;
  const sectionStyle = { font: font(C.indigo700, true, 10), fill: fill(C.indigo50), alignment: align('left') };
  const th = (label, h = 'center') => cell(label, { font: font(C.white, true, 10), fill: fill(C.indigo600), alignment: align(h, 'center'), border: border(C.indigo700) });
  const headerRow = [th('Sesión', 'left'), th('Fecha'), th('Código'), th('Nombre', 'left'), th('Cargo / Área', 'left'), th('Precisión'), th('Punteo'), th('Correctas'), th('Incorrectas'), th('Total')];

  const dataRows = [];
  sessions.forEach((s, si) => {
    const bg = si % 2 === 0 ? C.white : C.indigo50;
    (s.users || []).forEach((u) => {
      const base = { fill: fill(bg), border: border() };
      const td = (v, opts = {}) => ({ v, t: typeof v === 'number' ? 'n' : 's', z: opts.z, s: { ...base, font: opts.font || font(C.gray700, false, 10), alignment: align(opts.h || 'center', 'center') } });
      dataRows.push([
        td(`S${si + 1}`, { h: 'left', font: font(C.indigo600, true, 10) }),
        td(s.date || '—'),
        td(u.personnelCode || '—'),
        td(u.name, { h: 'left', font: font(C.gray900, true, 10) }),
        td(u.cargo || '—', { h: 'left' }),
        td((u.precision || 0) / 100, { z: '0%', font: font(precisionColor(u.precision || 0), true, 10) }),
        td(u.score || 0, { z: '#,##0', font: font(C.indigo600, true, 10) }),
        td(u.correctAnswers || 0, { font: font(C.green600, true, 10) }),
        td(u.incorrectAnswers ?? 0, { font: font(C.red600, false, 10) }),
        td(u.totalQuestions || s.questions || 0, { font: font(C.gray500, false, 10) }),
      ]);
    });
  });

  const subtitle = `${dataRows.length} registros  ·  ${sessions.length} ${sessions.length === 1 ? 'sesión' : 'sesiones'}`;

  const rows = [
    bannerRow(quizTitle || 'Reporte de sesiones', W, { font: font(C.white, true, 16), fill: fill(C.indigo600), alignment: align('left') }),
    bannerRow(`Participantes — todas las sesiones  ·  ${subtitle}`, W, { font: font(C.indigo100, false, 10), fill: fill(C.indigo700), alignment: align('left') }),
    Array(W).fill(blank()),
    bannerRow('DETALLE CONSOLIDADO', W, sectionStyle),
    headerRow,
    ...dataRows,
    Array(W).fill(blank()),
  ];

  const ws = XLSXStyle.utils.aoa_to_sheet(padRows(rows, W));
  ws['!cols'] = [{ wch: 8 }, { wch: 14 }, { wch: 12 }, { wch: 26 }, { wch: 22 }, { wch: 11 }, { wch: 12 }, { wch: 11 }, { wch: 12 }, { wch: 8 }];
  ws['!rows'] = [{ hpt: 34 }, { hpt: 18 }, { hpt: 6 }, { hpt: 20 }, { hpt: 22 }, ...dataRows.map(() => ({ hpt: 19 }))];
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: W - 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: W - 1 } },
    { s: { r: 3, c: 0 }, e: { r: 3, c: W - 1 } },
  ];
  ws['!freeze'] = { xSplit: 0, ySplit: 5, topLeftCell: 'A6', activePane: 'bottomLeft' };
  ws['!autofilter'] = { ref: `A5:J${5 + dataRows.length}` };
  return ws;
};

export const exportAllSessionsToExcel = (quizTitle, sessions) => {
  if (!sessions || sessions.length === 0) return;
  // Más reciente primero
  const ordered = [...sessions].sort((a, b) => (b.rawData?.finishedAt || 0) - (a.rawData?.finishedAt || 0));

  // Comentarios consolidados de todas las sesiones (sesión, persona, comentario, calificación)
  const allFeedback = [];
  ordered.forEach((s, si) => {
    (s.feedback || []).forEach((f) => {
      allFeedback.push({ ...f, sessionLabel: `S${si + 1} · ${s.date || ''}` });
    });
  });

  const wb = XLSXStyle.utils.book_new();
  XLSXStyle.utils.book_append_sheet(wb, buildSessionsSummarySheet(quizTitle, ordered), 'Resumen de Sesiones');
  XLSXStyle.utils.book_append_sheet(wb, buildAllParticipantsSheet(quizTitle, ordered), 'Participantes');
  XLSXStyle.utils.book_append_sheet(
    wb,
    buildCommentsSheet(quizTitle, 'Comentarios — todas las sesiones', allFeedback, true),
    'Comentarios'
  );

  const safeName = (quizTitle || 'reporte').replace(/[^a-zA-Z0-9_\- ]/g, '').trim();
  XLSXStyle.writeFile(wb, `${safeName || 'reporte'}_todas_las_sesiones.xlsx`);
};

export const exportToPDF = (sessionData) => {
  const pdf = new jsPDF();
  const { title, precision, completion, participants, questions, users } =
    sessionData;

  // Título
  pdf.setFontSize(18);
  pdf.setTextColor(79, 70, 229); // indigo-600
  pdf.text(title, 14, 20);

  pdf.setFontSize(10);
  pdf.setTextColor(107, 114, 128); // gray-500
  pdf.text(`Sesión en vivo · ${dateTimeLabel(sessionData)}`, 14, 28);

  // Métricas resumidas
  pdf.setFontSize(11);
  pdf.setTextColor(17, 24, 39); // gray-900
  const metrics = [
    ['Precisión media', `${precision}%`],
    ['Tasa de terminación', `${completion}%`],
    ['Participantes', String(participants)],
    ['Preguntas', String(questions)],
  ];
  let y = 38;
  metrics.forEach(([label, value]) => {
    pdf.setFont(undefined, 'bold');
    pdf.text(label + ':', 14, y);
    pdf.setFont(undefined, 'normal');
    pdf.text(value, 60, y);
    y += 7;
  });

  // Tabla de participantes
  autoTable(pdf, {
    startY: y + 4,
    head: [['Participante', 'Código', 'Precisión %', 'Correctas', 'Puntuación']],
    body: users.map((u) => [
      u.name,
      u.personnelCode || '-',
      `${u.precision}%`,
      u.correctAnswers,
      u.score,
    ]),
    headStyles: { fillColor: [79, 70, 229] },
    alternateRowStyles: { fillColor: [238, 242, 255] },
  });

  const safeName = title.replace(/[^a-zA-Z0-9_\- ]/g, '').trim();
  pdf.save(`${safeName || 'reporte'}_reporte.pdf`);
};
