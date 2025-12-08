// simple CSV parser for browser usage (returns array of rows)
export function parseCSVFile(text){
  const rows = [];
  let i = 0, cur = '', inQuotes = false, row = [];
  while (i < text.length){
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i+1 < text.length && text[i+1] === '"') { cur += '"'; i += 2; continue; }
        inQuotes = false; i++; continue;
      }
      cur += ch; i++; continue;
    } else {
      if (ch === '"') { inQuotes = true; i++; continue; }
      if (ch === ',') { row.push(cur); cur=''; i++; continue; }
      if (ch === '\r') { i++; continue; }
      if (ch === '\n') { row.push(cur); rows.push(row); row=[]; cur=''; i++; continue; }
      cur += ch; i++; continue;
    }
  }
  if (cur !== '' || row.length) { row.push(cur); rows.push(row); }
  if (rows.length && rows[rows.length-1].length === 1 && rows[rows.length-1][0] === '') rows.pop();
  return rows;
}
