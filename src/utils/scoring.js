// scoring helpers (implement later)
export function scoreTWKTIU(question, selectedIndex){
  if (selectedIndex == null) return 0;
  return selectedIndex === question.answer ? 5 : 0;
}

export function scoreTKPFromMap(questionId, selectedIndex, mapping){
  // mapping: { qid: [v0,v1,v2,...] }
  if (!mapping || !mapping[questionId]) return 0;
  return mapping[questionId][selectedIndex] || 0;
}
