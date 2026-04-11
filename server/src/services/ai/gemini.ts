export async function analyzeSymptoms(prompt: string) {
  // STUB: Replace with real Gemini/LLM call.
  // For now return a mock analysis.
  return {
    summary: 'Possible dehydration and infection. Recommend vet visit.',
    confidence: 0.72,
    suggestions: ['Take to clinic', 'Provide fluids', 'Collect sample for lab']
  };
}
