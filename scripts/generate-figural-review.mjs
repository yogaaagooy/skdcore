import fs from "node:fs";
import path from "node:path";

const outDir = path.resolve("public/question-assets/tiu/figural-review");
fs.mkdirSync(outDir, { recursive: true });

const colors = {
  ink: "#0f172a",
  blue: "#2563eb",
  amber: "#e8a51a",
  pale: "#f8fafc",
  line: "#cbd5e1",
  white: "#ffffff",
};

const svg = (width, height, body, label) => `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${label}">
  <rect width="${width}" height="${height}" fill="${colors.white}"/>
  ${body}
</svg>
`;

const panel = (x, y, w = 150, h = 130) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12" fill="${colors.pale}" stroke="${colors.line}" stroke-width="3"/>`;

function polygon(cx, cy, radius, sides, { fill = "none", stroke = colors.ink, rotate = -90, width = 5 } = {}) {
  const points = Array.from({ length: sides }, (_, i) => {
    const angle = (rotate + i * 360 / sides) * Math.PI / 180;
    return `${cx + radius * Math.cos(angle)},${cy + radius * Math.sin(angle)}`;
  }).join(" ");
  return `<polygon points="${points}" fill="${fill}" stroke="${stroke}" stroke-width="${width}" stroke-linejoin="round"/>`;
}

const circle = (cx, cy, r, fill = "none", stroke = colors.ink, width = 5) =>
  `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${width}"/>`;

const square = (cx, cy, size, fill = "none", stroke = colors.ink, width = 5) =>
  `<rect x="${cx - size / 2}" y="${cy - size / 2}" width="${size}" height="${size}" rx="4" fill="${fill}" stroke="${stroke}" stroke-width="${width}"/>`;

const diamond = (cx, cy, size, fill = "none", stroke = colors.ink, width = 5) =>
  polygon(cx, cy, size / Math.sqrt(2), 4, { fill, stroke, rotate: 0, width });

function arrow(cx, cy, direction, size = 42, color = colors.blue) {
  const rotations = { right: 0, down: 90, left: 180, up: 270 };
  return `<g transform="translate(${cx} ${cy}) rotate(${rotations[direction]})">
    <line x1="${-size}" y1="0" x2="${size * 0.45}" y2="0" stroke="${color}" stroke-width="8" stroke-linecap="round"/>
    <polyline points="${size * 0.1},${-size * 0.38} ${size * 0.55},0 ${size * 0.1},${size * 0.38}" fill="none" stroke="${color}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
  </g>`;
}

function dots(cx, cy, count, { gap = 18, color = colors.amber, vertical = false } = {}) {
  const offset = (count - 1) * gap / 2;
  return Array.from({ length: count }, (_, i) =>
    `<circle cx="${vertical ? cx : cx - offset + i * gap}" cy="${vertical ? cy - offset + i * gap : cy}" r="5.5" fill="${color}"/>`
  ).join("");
}

const marker = (x, y, fill = colors.amber) => `<circle cx="${x}" cy="${y}" r="8" fill="${fill}"/>`;
const questionMark = (x, y) => `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle" font-family="Arial, sans-serif" font-size="72" font-weight="700" fill="${colors.blue}">?</text>`;
const separator = (x, y) => `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle" font-family="Arial, sans-serif" font-size="44" font-weight="700" fill="${colors.ink}">→</text>`;

const write = (name, width, height, body, label) => {
  fs.writeFileSync(path.join(outDir, name), svg(width, height, body, label));
};

function optionFrame(body, label) {
  return svg(220, 170, `${panel(10, 10, 200, 150)}${body}`, label);
}

function saveOption(question, letter, body, label) {
  fs.writeFileSync(path.join(outDir, `fig-${question}-${letter.toLowerCase()}.svg`), optionFrame(body, label));
}

// 1. Arah berputar 90° searah jarum jam; titik bertambah satu.
write("fig-01-question.svg", 620, 170,
  `${panel(10,20)}${arrow(85,78,"right",30)}${dots(85,125,1)}
   ${panel(180,20)}${arrow(255,78,"down",30)}${dots(255,125,2)}
   ${panel(350,20)}${arrow(425,78,"left",30)}${dots(425,125,3)}
   ${separator(520,85)}${panel(545,20,65,130)}${questionMark(578,87)}`,
  "Deret panah berputar dengan jumlah titik bertambah");
[
  ["A", `${arrow(110,70,"up",35)}${dots(110,125,3)}`, "Panah ke atas dengan tiga titik"],
  ["B", `${arrow(110,70,"up",35)}${dots(110,125,4)}`, "Panah ke atas dengan empat titik"],
  ["C", `${arrow(110,70,"right",35)}${dots(110,125,4)}`, "Panah ke kanan dengan empat titik"],
  ["D", `${arrow(110,70,"down",35)}${dots(110,125,4)}`, "Panah ke bawah dengan empat titik"],
  ["E", `${arrow(110,70,"up",35)}${dots(110,125,5)}`, "Panah ke atas dengan lima titik"],
].forEach(([l,b,a]) => saveOption("01",l,b,a));

// 2. Jumlah sisi bertambah; isi bergantian kosong-penuh.
write("fig-02-question.svg", 620, 170,
  `${panel(10,20)}${polygon(85,85,48,3)}
   ${panel(180,20)}${polygon(255,85,45,4,{fill:colors.ink})}
   ${panel(350,20)}${polygon(425,85,48,5)}
   ${separator(520,85)}${panel(545,20,65,130)}${questionMark(578,87)}`,
  "Deret bangun dengan sisi bertambah dan isi bergantian");
[
  ["A", polygon(110,85,48,5,{fill:colors.ink}), "Segi lima penuh"],
  ["B", polygon(110,85,48,6), "Segi enam kosong"],
  ["C", polygon(110,85,48,4,{fill:colors.ink}), "Segi empat penuh"],
  ["D", polygon(110,85,48,6,{fill:colors.ink}), "Segi enam penuh"],
  ["E", polygon(110,85,48,7,{fill:colors.ink}), "Segi tujuh penuh"],
].forEach(([l,b,a]) => saveOption("02",l,b,a));

// 3. Analogi: bentuk luar dan dalam bertukar; penanda berpindah ke sisi berlawanan.
write("fig-03-question.svg", 760, 180,
  `${panel(10,25,150,130)}${square(85,90,88)}${circle(65,90,20,"none",colors.blue)}${marker(133,90)}
   ${separator(190,90)}
   ${panel(220,25,150,130)}${circle(295,90,46)}${square(320,90,34,"none",colors.blue)}${marker(247,90)}
   <text x="400" y="95" font-family="Arial" font-size="44" font-weight="700" fill="${colors.ink}">:</text>
   ${panel(435,25,150,130)}${polygon(510,90,50,3)}${diamond(510,65,30,"none",colors.blue)}${marker(510,132)}
   ${separator(615,90)}${panel(645,25,105,130)}${questionMark(697,92)}`,
  "Analogi pertukaran bentuk luar dan dalam serta perpindahan penanda");
[
  ["A", `${diamond(110,85,92)}${polygon(110,110,25,3,{stroke:colors.blue})}${marker(110,132)}`, "Belah ketupat luar, segitiga bawah, penanda bawah"],
  ["B", `${polygon(110,85,52,3)}${diamond(110,105,38,"none",colors.blue)}${marker(110,35)}`, "Segitiga luar, belah ketupat bawah, penanda atas"],
  ["C", `${diamond(110,85,92)}${polygon(110,110,25,3,{stroke:colors.blue})}${marker(110,38)}`, "Belah ketupat luar, segitiga di sisi berlawanan, penanda atas"],
  ["D", `${diamond(110,85,92)}${polygon(110,60,25,3,{stroke:colors.blue})}${marker(110,132)}`, "Belah ketupat luar, segitiga atas, penanda bawah"],
  ["E", `${circle(110,85,48)}${polygon(110,110,25,3,{stroke:colors.blue})}${marker(110,38)}`, "Lingkaran luar, segitiga bawah, penanda atas"],
].forEach(([l,b,a]) => saveOption("03",l,b,a));

// 4. Matriks: kolom ketiga adalah jumlah simbol kolom pertama dan kedua.
write("fig-04-question.svg", 560, 360,
  `${panel(20,20,150,140)}${dots(95,90,1)}
   ${panel(200,20,150,140)}${dots(275,90,2)}
   ${panel(380,20,150,140)}${dots(455,90,3)}
   ${panel(20,190,150,140)}${polygon(95,260,28,3,{fill:colors.blue})}
   ${panel(200,190,150,140)}${polygon(255,260,25,3,{fill:colors.blue})}${polygon(295,260,25,3,{fill:colors.blue})}
   ${panel(380,190,150,140)}${questionMark(455,262)}`,
  "Matriks jumlah simbol pada setiap baris");
[
  ["A", `${polygon(70,85,24,3,{fill:colors.blue})}${polygon(110,85,24,3,{fill:colors.blue})}${polygon(150,85,24,3,{fill:colors.blue})}`, "Tiga segitiga"],
  ["B", `${polygon(90,85,26,3,{fill:colors.blue})}${polygon(130,85,26,3,{fill:colors.blue})}`, "Dua segitiga"],
  ["C", `${polygon(55,85,22,3,{fill:colors.blue})}${polygon(90,85,22,3,{fill:colors.blue})}${polygon(125,85,22,3,{fill:colors.blue})}${polygon(160,85,22,3,{fill:colors.blue})}`, "Empat segitiga"],
  ["D", dots(110,85,3), "Tiga titik"],
  ["E", `${polygon(80,85,26,3)}${polygon(140,85,26,3)}`, "Dua segitiga kosong"],
].forEach(([l,b,a]) => saveOption("04",l,b,a));

// 5. Yang berbeda: titik seharusnya berlawanan dengan arah panah.
write("fig-05-question.svg", 760, 170,
  ["right","down","left","up","right"].map((dir,i) => {
    const x=10+i*150;
    const dotPos={
      right:[x+35,85], down:[x+75,45], left:[x+115,85], up:[x+75,125]
    }[dir];
    const actual=i===3?[x+75,45]:dotPos;
    return `${panel(x,20,135,130)}${arrow(x+67,85,dir,25)}${marker(actual[0],actual[1])}<text x="${x+67}" y="145" text-anchor="middle" font-family="Arial" font-size="18" font-weight="700">${"ABCDE"[i]}</text>`;
  }).join(""),
  "Lima pasangan panah dan titik untuk mencari pola berbeda");

// Opsi nomor 5 mengacu pada panel A–E, tetapi tetap disajikan sebagai gambar huruf.
["A","B","C","D","E"].forEach((l) => saveOption("05",l,
  `<text x="110" y="100" text-anchor="middle" font-family="Arial" font-size="64" font-weight="700" fill="${colors.blue}">${l}</text>`,
  `Panel ${l}`));

// 6. Dua siklus: panah searah jarum jam, titik berpindah sudut searah jarum jam, warna bergantian.
function cyclePanel(x, dir, dotX, dotY, filled) {
  return `${panel(x,20)}${arrow(x+75,82,dir,27,filled?colors.ink:colors.blue)}${marker(x+dotX,dotY,filled?colors.amber:colors.blue)}`;
}
write("fig-06-question.svg", 620, 170,
  `${cyclePanel(10,"up",35,45,false)}
   ${cyclePanel(180,"right",115,45,true)}
   ${cyclePanel(350,"down",115,125,false)}
   ${separator(520,85)}${panel(545,20,65,130)}${questionMark(578,87)}`,
  "Deret arah panah, posisi titik, dan warna bergantian");
[
  ["A", `${arrow(110,82,"left",32,colors.ink)}${marker(50,125,colors.amber)}`, "Panah kiri hitam dan titik kuning kiri bawah"],
  ["B", `${arrow(110,82,"left",32,colors.blue)}${marker(50,125,colors.blue)}`, "Panah kiri biru dan titik biru kiri bawah"],
  ["C", `${arrow(110,82,"up",32,colors.ink)}${marker(50,125,colors.amber)}`, "Panah atas hitam dan titik kuning kiri bawah"],
  ["D", `${arrow(110,82,"left",32,colors.ink)}${marker(170,125,colors.amber)}`, "Panah kiri hitam dan titik kuning kanan bawah"],
  ["E", `${arrow(110,82,"left",32,colors.ink)}${marker(50,45,colors.amber)}`, "Panah kiri hitam dan titik kuning kiri atas"],
].forEach(([l,b,a]) => saveOption("06",l,b,a));

// 7. Matriks superposisi: sel ketiga menggabungkan dua sel sebelumnya.
const combo = (cx,cy,types) => types.map((t,i) => {
  const dx=(i%2)*42-21, dy=Math.floor(i/2)*42-21;
  if(t==="circle") return circle(cx+dx,cy+dy,16,"none",colors.blue,4);
  if(t==="triangle") return polygon(cx+dx,cy+dy,18,3,{stroke:colors.amber,width:4});
  if(t==="square") return square(cx+dx,cy+dy,30,"none",colors.ink,4);
  return diamond(cx+dx,cy+dy,30,"none","#16a34a",4);
}).join("");
write("fig-07-question.svg", 560, 540,
  `${panel(20,20,150,140)}${combo(95,90,["circle"])}
   ${panel(200,20,150,140)}${combo(275,90,["triangle"])}
   ${panel(380,20,150,140)}${combo(455,90,["circle","triangle"])}
   ${panel(20,190,150,140)}${combo(95,260,["square"])}
   ${panel(200,190,150,140)}${combo(275,260,["diamond"])}
   ${panel(380,190,150,140)}${combo(455,260,["square","diamond"])}
   ${panel(20,360,150,140)}${combo(95,430,["circle","square"])}
   ${panel(200,360,150,140)}${combo(275,430,["triangle","diamond"])}
   ${panel(380,360,150,140)}${questionMark(455,432)}`,
  "Matriks superposisi empat jenis bentuk");
[
  ["A", combo(110,85,["circle","triangle","square","diamond"]), "Gabungan lingkaran, segitiga, persegi, dan belah ketupat"],
  ["B", combo(110,85,["circle","triangle","square"]), "Gabungan lingkaran, segitiga, dan persegi"],
  ["C", combo(110,85,["circle","square","diamond"]), "Gabungan lingkaran, persegi, dan belah ketupat"],
  ["D", combo(110,85,["triangle","square","diamond"]), "Gabungan segitiga, persegi, dan belah ketupat"],
  ["E", combo(110,85,["circle","triangle","diamond"]), "Gabungan lingkaran, segitiga, dan belah ketupat"],
].forEach(([l,b,a]) => saveOption("07",l,b,a));

// 8. Analogi: arah berputar 90° CW, warna dibalik, titik bertambah satu.
write("fig-08-question.svg", 760, 180,
  `${panel(10,25,150,130)}${arrow(85,72,"up",30,colors.blue)}${dots(85,125,1)}
   ${separator(190,90)}
   ${panel(220,25,150,130)}${arrow(295,72,"right",30,colors.ink)}${dots(295,125,2)}
   <text x="400" y="95" font-family="Arial" font-size="44" font-weight="700" fill="${colors.ink}">:</text>
   ${panel(435,25,150,130)}${arrow(510,72,"left",30,colors.ink)}${dots(510,125,2)}
   ${separator(615,90)}${panel(645,25,105,130)}${questionMark(697,92)}`,
  "Analogi rotasi arah, pergantian warna, dan pertambahan titik");
[
  ["A", `${arrow(110,70,"up",34,colors.blue)}${dots(110,125,3)}`, "Panah atas biru dengan tiga titik"],
  ["B", `${arrow(110,70,"down",34,colors.blue)}${dots(110,125,3)}`, "Panah bawah biru dengan tiga titik"],
  ["C", `${arrow(110,70,"up",34,colors.ink)}${dots(110,125,3)}`, "Panah atas hitam dengan tiga titik"],
  ["D", `${arrow(110,70,"up",34,colors.blue)}${dots(110,125,2)}`, "Panah atas biru dengan dua titik"],
  ["E", `${arrow(110,70,"right",34,colors.blue)}${dots(110,125,3)}`, "Panah kanan biru dengan tiga titik"],
].forEach(([l,b,a]) => saveOption("08",l,b,a));

// 9. Sisi berkurang satu, titik bertambah satu, isi bergantian.
write("fig-09-question.svg", 620, 170,
  `${panel(10,20)}${polygon(85,76,46,6,{fill:colors.ink})}${dots(85,132,1)}
   ${panel(180,20)}${polygon(255,76,46,5)}${dots(255,132,2)}
   ${panel(350,20)}${polygon(425,76,44,4,{fill:colors.ink})}${dots(425,132,3)}
   ${separator(520,85)}${panel(545,20,65,130)}${questionMark(578,87)}`,
  "Deret jumlah sisi berkurang, titik bertambah, dan isi bergantian");
[
  ["A", `${polygon(110,72,44,3)}${dots(110,132,4)}`, "Segitiga kosong dengan empat titik"],
  ["B", `${polygon(110,72,44,3,{fill:colors.ink})}${dots(110,132,4)}`, "Segitiga penuh dengan empat titik"],
  ["C", `${polygon(110,72,44,4)}${dots(110,132,4)}`, "Persegi kosong dengan empat titik"],
  ["D", `${polygon(110,72,44,3)}${dots(110,132,3)}`, "Segitiga kosong dengan tiga titik"],
  ["E", `${polygon(110,72,44,5)}${dots(110,132,4)}`, "Segi lima kosong dengan empat titik"],
].forEach(([l,b,a]) => saveOption("09",l,b,a));

// 10. Pergerakan dua objek: lingkaran searah jarum jam, persegi berlawanan arah.
function cornerObjects(circleCorner, squareCorner) {
  const pos={tl:[55,42],tr:[165,42],br:[165,128],bl:[55,128]};
  return `${circle(...pos[circleCorner],16,"none",colors.blue,5)}${square(...pos[squareCorner],30,"none",colors.amber,5)}`;
}
write("fig-10-question.svg", 620, 170,
  `${panel(10,20)}<g transform="translate(0 0)">${cornerObjects("tl","br")}</g>
   ${panel(180,20)}<g transform="translate(170 0)">${cornerObjects("tr","bl")}</g>
   ${panel(350,20)}<g transform="translate(340 0)">${cornerObjects("br","tl")}</g>
   ${separator(520,85)}${panel(545,20,65,130)}${questionMark(578,87)}`,
  "Deret pergerakan lingkaran dan persegi pada empat sudut");
[
  ["A", cornerObjects("bl","tr"), "Lingkaran kiri bawah dan persegi kanan atas"],
  ["B", cornerObjects("bl","tl"), "Lingkaran kiri bawah dan persegi kiri atas"],
  ["C", cornerObjects("tl","tr"), "Lingkaran kiri atas dan persegi kanan atas"],
  ["D", cornerObjects("br","tr"), "Lingkaran kanan bawah dan persegi kanan atas"],
  ["E", cornerObjects("bl","br"), "Lingkaran kiri bawah dan persegi kanan bawah"],
].forEach(([l,b,a]) => saveOption("10",l,b,a));

console.log(`Generated ${fs.readdirSync(outDir).length} SVG files in ${outDir}`);
