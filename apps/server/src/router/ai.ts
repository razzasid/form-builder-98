import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import * as dotenv from 'dotenv';
dotenv.config({ path: '../../.env' });

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

const SYSTEM_PROMPT = `You are a form builder AI assistant. The user will describe what kind of form they need, and you must generate a structured JSON form definition.

IMPORTANT: Respond ONLY with valid JSON, no markdown, no code fences, no explanation. Just the raw JSON object.

If the user's message is a greeting, pleasantry, joke, question, statement, or anything unrelated to describing what form they want to build, you must NOT return a form definition. Instead, respond with a JSON object in this exact structure:
{
  "message": "Dynamic response here..."
}

Rules for the dynamic message:
- Address the user as {USER_NAME} (replace {USER_NAME} with the user's actual name provided).
- Keep it witty, sarcastic, and funny in a classic sassy assistant (Clippy) persona.
- Urge them strictly to stop wasting tokens / time on pleasantries or off-topic talk, and prompt them to describe what form they want to build.
- Respond contextually to what they said (e.g., if they tell a joke, make a sarcastic remark about it; if they ask a question, give a brief sarcastic/funny answer but refuse to go in-depth because you only build forms).

Otherwise, the JSON must follow this exact structure:
{
  "title": "Form Title",
  "description": "Brief description of the form",
  "fields": [
    {
      "type": "text|email|number|textarea|dropdown|checkbox|radio",
      "label": "Field Label",
      "placeholder": "placeholder text or empty string",
      "required": true|false,
      "options": ["opt1", "opt2"] or null,
      "displayOrder": 0
    }
  ]
}

Rules for generating forms:
- "type" must be one of: text, email, number, textarea, dropdown, checkbox, radio
- "options" is ONLY used for dropdown, checkbox, and radio types. Set to null for other types.
- "displayOrder" must start at 0 and increment by 1.
- "placeholder" should be a helpful hint for text/email/number/textarea types, empty string for others.
- Generate sensible, real-world fields based on the user's description.
- Use "required: true" for essential fields.
- Keep forms practical with 3-8 fields typically.`;

export const aiRouter = router({
  generateForm: protectedProcedure
    .input(z.object({ prompt: z.string().min(1).max(500) }))
    .mutation(async ({ input, ctx }) => {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error(
          'GEMINI_API_KEY is not set. Add it to your .env file. Get one free at https://aistudio.google.com/apikey'
        );
      }

      const userName = ctx.user?.name || 'there';
      const formattedSystemPrompt = SYSTEM_PROMPT.replace('{USER_NAME}', userName);

      const body = JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: `${formattedSystemPrompt}\n\nUser request: ${input.prompt}` }],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
          responseMimeType: 'application/json',
        },
      });

      // Retry with exponential backoff for rate limiting (429)
      let response: Response | null = null;
      const maxRetries = 3;
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
        });

        if (response.status === 429 && attempt < maxRetries) {
          const waitMs = Math.pow(2, attempt + 1) * 1000; // 2s, 4s, 8s
          console.log(`Gemini rate limited (429). Retrying in ${waitMs / 1000}s... (attempt ${attempt + 1}/${maxRetries})`);
          await new Promise((resolve) => setTimeout(resolve, waitMs));
          continue;
        }
        break;
      }

      if (!response || !response.ok) {
        const errorBody = response ? await response.text() : 'No response';
        console.error('Gemini API error:', response?.status, errorBody);
        if (response?.status === 429) {
          throw new Error(
            'Gemini API quota exceeded (limit: 0). Your API key does not have quota enabled. Please create a new API key at https://aistudio.google.com/apikey using "Create API key in new project".'
          );
        }
        throw new Error(`Gemini API error: ${response?.status}`);
      }

      const data = await response.json() as any;
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text) {
        throw new Error('No response from Gemini');
      }

      // Parse the JSON response
      try {
        const parsed = JSON.parse(text);

        // Check for casual message response first
        if (parsed.message) {
          return {
            message: parsed.message,
          };
        }

        // Validate the form structure
        if (!parsed.title || !Array.isArray(parsed.fields)) {
          throw new Error('Invalid form structure from AI');
        }

        // Sanitize fields
        const validTypes = ['text', 'email', 'number', 'textarea', 'dropdown', 'checkbox', 'radio'];
        parsed.fields = parsed.fields
          .filter((f: any) => f.label && validTypes.includes(f.type))
          .map((f: any, i: number) => ({
            type: f.type,
            label: f.label,
            placeholder: f.placeholder || '',
            required: !!f.required,
            options: ['dropdown', 'checkbox', 'radio'].includes(f.type)
              ? (Array.isArray(f.options) ? f.options : null)
              : null,
            displayOrder: i,
          }));

        return {
          title: parsed.title,
          description: parsed.description || '',
          fields: parsed.fields,
        };
      } catch (parseErr) {
        console.error('Failed to parse Gemini response:', text);
        throw new Error('AI returned an invalid form. Please try again with a different description.');
      }
    }),
});
