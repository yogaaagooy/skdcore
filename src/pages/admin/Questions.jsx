import React, { useState } from 'react'
import { parseCSVFile } from '../../utils/parseCSV'
export default function Questions(){
  const [preview, setPreview] = useState(null)
  function onFile(e){
    const f = e.target.files?.[0]; if(!f) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const rows = parseCSVFile(ev.target.result);
      setPreview(rows);
    };
    reader.readAsText(f, 'utf-8');
  }
  return (
    <div className="container">
      <div className="card">
        <h2>Import Questions (CSV)</h2>
        <input type="file" accept=".csv" onChange={onFile} />
        <div style={{marginTop:12}}>
          {preview ? <pre style={{maxHeight:300, overflow:'auto'}}>{JSON.stringify(preview, null, 2)}</pre> : <div>No preview</div>}
        </div>
      </div>
    </div>
  )
}
