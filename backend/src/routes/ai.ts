import type { FastifyInstance } from 'fastify';
import { AppError } from '../utils/AppError.js';

export async function aiRoutes(fastify: FastifyInstance) {
  const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

  const fallbackModels = [
    'google/gemini-2.5-pro',
    'google/gemini-2.5-flash',
    'anthropic/claude-3.5-sonnet',
    'openai/gpt-4o-mini',
    'meta-llama/llama-3.1-70b-instruct'
  ];

  const fetchOpenRouter = async (prompt: string, systemPrompt: string) => {
    if (!OPENROUTER_API_KEY) {
      throw new AppError('OpenRouter API Key is missing. Please configure it in .env', 500);
    }

    let lastErrorDetail = '';
    let lastStatus = 502;

    for (const model of fallbackModels) {
      try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: prompt }
            ]
          })
        });

        if (!response.ok) {
          let errorDetail = response.statusText;
          try {
            const errJson = await response.json();
            errorDetail = errJson.error?.message || JSON.stringify(errJson);
          } catch (e) {
            // Ignored
          }
          lastErrorDetail = errorDetail;
          lastStatus = response.status;
          fastify.log.warn({ msg: `Model ${model} failed`, errorDetail });
          continue; // Try next model
        }

        const data = await response.json();
        return data.choices[0].message.content;
      } catch (err: any) {
        lastErrorDetail = err.message;
        fastify.log.warn({ msg: `Model ${model} threw an exception`, error: err.message });
        continue; // Try next model
      }
    }

    throw new AppError(`All AI models failed. Last error: ${lastErrorDetail}`, lastStatus);
  };

  // Endpoint to generate flashcards based on reading session notes
  fastify.post('/flashcards', {
    schema: {
      body: {
        type: 'object',
        required: ['sessionNotes', 'bookTitle'],
        properties: {
          sessionNotes: { type: 'string', minLength: 1 },
          bookTitle: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    const { sessionNotes, bookTitle } = request.body as { sessionNotes: string; bookTitle: string };

    const systemPrompt = `You are an AI assistant that helps users retain information from their reading sessions. 
Generate 3 to 5 concise flashcards based on the provided text (which may be raw extracted book pages or personal notes). 
Focus on key concepts, vocabulary, or important facts.
Format the output as a JSON array of objects, where each object has a "question" and "answer" field. Do not include any markdown formatting like \`\`\`json, just return the raw JSON array.`;

    const prompt = `Book Title: ${bookTitle || 'Unknown'}\nReading Content:\n${sessionNotes}`;

    const result = await fetchOpenRouter(prompt, systemPrompt);

    let flashcards = [];
    try {
      flashcards = JSON.parse(result);
    } catch (e) {
      fastify.log.error({ msg: 'Failed to parse flashcards JSON', result });
      throw new AppError('AI returned invalid JSON format', 502);
    }

    return reply.send({ success: true, flashcards });
  });

  // Endpoint to get dictionary explanation for a difficult word
  fastify.post('/dictionary', {
    schema: {
      body: {
        type: 'object',
        required: ['word'],
        properties: {
          word: { type: 'string', minLength: 1 },
          context: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    const { word, context } = request.body as { word: string; context?: string };

    const systemPrompt = `You are a helpful dictionary assistant. 
Explain the meaning of the given word clearly and concisely. 
If context is provided, explain the meaning of the word specifically within that context. Provide a simple example sentence.
Format the output as a JSON object with "definition" and "example" fields. Do not include any markdown formatting like \`\`\`json, just return the raw JSON object.`;

    let prompt = `Word: ${word}`;
    if (context) prompt += `\nContext: ${context}`;

    const result = await fetchOpenRouter(prompt, systemPrompt);

    let dictionaryData;
    try {
      dictionaryData = JSON.parse(result);
    } catch (e) {
      fastify.log.error({ msg: 'Failed to parse dictionary JSON', result });
      throw new AppError('AI returned invalid JSON format', 502);
    }

    return reply.send({ success: true, ...dictionaryData });
  });
}
