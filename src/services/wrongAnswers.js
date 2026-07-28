const WRONG_ANSWERS_KEY = "nalarasn_wrong_answers_v1";

export function getWrongAnswers() {
  try {
    const value = JSON.parse(window.localStorage.getItem(WRONG_ANSWERS_KEY) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

export function saveWrongAnswers(questions, answers) {
  const previous = getWrongAnswers();
  const byId = new Map(previous.map((item) => [`${item.category}-${item.id}`, item]));

  questions.forEach((question) => {
    const options = question.options || [];
    const bestScore = Math.max(0, ...options.map((option) => Number(option.score || 0)));
    const selected = options.find((option) => option.id === answers[question.id]);
    if (selected && Number(selected.score || 0) >= bestScore) {
      byId.delete(`${question.category}-${question.id}`);
      return;
    }
    byId.set(`${question.category}-${question.id}`, {
      id: question.id,
      category: question.category,
      question: question.question,
      options,
      selectedId: selected?.id || null,
      explanation: question.explanation || "",
      savedAt: new Date().toISOString(),
    });
  });

  window.localStorage.setItem(WRONG_ANSWERS_KEY, JSON.stringify([...byId.values()].slice(-300)));
}

export function clearWrongAnswers() {
  window.localStorage.removeItem(WRONG_ANSWERS_KEY);
}
