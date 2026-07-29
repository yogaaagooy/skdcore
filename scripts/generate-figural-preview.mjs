import fs from "node:fs";

const questions = JSON.parse(fs.readFileSync("content/REVIEW-10-SOAL-FIGURAL-BATCH-1.json", "utf8"));
const localAsset = (url) => `../public${url}`;
const escapeHtml = (value) => String(value || "")
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;");

const cards = questions.map((question, index) => {
  const correct = question.options.find((option) => Number(option.score) === 5)?.id || "-";
  const options = question.options.map((option) => `
    <div class="option">
      <strong>${option.id}</strong>
      <img src="${localAsset(option.image.url)}" alt="${escapeHtml(option.image.alt)}">
      ${option.text ? `<span>${escapeHtml(option.text)}</span>` : ""}
    </div>`).join("");
  return `
    <article>
      <header><span>TIU Figural ${index + 1}</span><em>Kunci ${correct}</em></header>
      <h2>${escapeHtml(question.question)}</h2>
      <img class="question" src="${localAsset(question.image.url)}" alt="${escapeHtml(question.image.alt)}">
      <div class="options">${options}</div>
      <p><b>Pembahasan:</b> ${escapeHtml(question.explanation)}</p>
    </article>`;
}).join("");

const html = `<!doctype html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Review 10 Soal Figural NalarASN</title>
  <style>
    *{box-sizing:border-box}body{margin:0;background:#f1f5f9;color:#0f172a;font:15px/1.55 Arial,sans-serif}
    main{max-width:1100px;margin:auto;padding:28px 16px}h1{margin:0}.intro{color:#64748b;margin:6px 0 24px}
    article{background:white;border:1px solid #cbd5e1;border-radius:18px;padding:20px;margin:0 0 20px;box-shadow:0 8px 24px #0f172a0d}
    header{display:flex;justify-content:space-between;gap:12px;color:#2563eb;font-weight:700}header em{font-style:normal;color:#047857}
    h2{font-size:17px;margin:12px 0}.question{display:block;max-width:100%;max-height:390px;margin:12px auto;border:1px solid #e2e8f0;border-radius:12px}
    .options{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin-top:14px}.option{position:relative;border:1px solid #cbd5e1;border-radius:12px;padding:9px;text-align:center}
    .option strong{position:absolute;left:8px;top:6px;background:#2563eb;color:white;border-radius:99px;width:24px;height:24px;line-height:24px}.option img{display:block;width:100%;height:150px;object-fit:contain}.option span{font-size:12px}
    article p{background:#f8fafc;border-left:4px solid #e8a51a;padding:12px;margin:16px 0 0}
    @media(max-width:700px){.options{grid-template-columns:repeat(2,1fr)}.option img{height:130px}}
  </style>
</head>
<body><main><h1>Review 10 Soal Figural NalarASN</h1><p class="intro">Draf review visual. Belum masuk Firebase dan belum digunakan pada aplikasi.</p>${cards}</main></body>
</html>`;

fs.writeFileSync("docs/preview-10-soal-figural.html", html);
console.log("Generated docs/preview-10-soal-figural.html");
