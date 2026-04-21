import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY || "",
  baseURL: "https://ai.hackclub.com/proxy/v1",
});

type JudgeResponse = {
  time_score: number;
  neatness_score: number;
  placement_score: number;
  working_score: number;
  total_score: number;
  comments: string;
};

function prompt(minutes: number, seconds: number, working: boolean) {
  const workingLine = working ? "WORKING (fully functional)" : "NOT WORKING (reported as non-functional)";

  return `You are an expert judge for DIY soldering projects made by students aged 16-18.

Input Data:
- Time taken: ${minutes} minutes and ${seconds} seconds
- Functionality report: ${workingLine}
- There are exactly 2 images attached.

Scoring rubric (0-10 each):
1) Time Efficiency
2) Soldering Neatness & PCB Quality
3) Component Placement & Assembly
4) Functionality Score (STRICT rule: if functionality report says working, set working_score to 10; if not working, set working_score to 0)

Return ONLY valid JSON with this exact shape:
{
  "time_score": number,
  "neatness_score": number,
  "placement_score": number,
  "working_score": number,
  "total_score": number,
  "comments": "2-3 short sentences"
}`;
}

function cleanJson(raw: string): JudgeResponse {
  const trimmed = raw.trim().replace(/^```json\s*/i, "").replace(/```$/i, "");
  const match = trimmed.match(/\{[\s\S]*\}/);
  const payload = match ? match[0] : trimmed;
  const parsed = JSON.parse(payload) as JudgeResponse;
  parsed.total_score =
    Number(parsed.total_score) ||
    Number(parsed.time_score || 0) + Number(parsed.neatness_score || 0) + Number(parsed.placement_score || 0) + Number(parsed.working_score || 0);
  return parsed;
}

export async function POST(req: Request) {
  try {
    const { minutes, seconds, working, images } = await req.json();

    if (!Array.isArray(images) || images.length !== 2) {
      return Response.json({ error: "Please provide exactly 2 images." }, { status: 400 });
    }

    const completion = await client.chat.completions.create({
      model: "google/gemini-3-flash-preview",
      temperature: 0.2,
      max_tokens: 800,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt(minutes, seconds, Boolean(working)) },
            { type: "image_url", image_url: { url: images[0] } },
            { type: "image_url", image_url: { url: images[1] } },
          ],
        },
      ],
    });

    const raw = completion.choices?.[0]?.message?.content;
    if (!raw) {
      return Response.json({ error: "Empty AI response." }, { status: 502 });
    }

    const result = cleanJson(raw);
    return Response.json({ result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Judge API Error:", message);
    return Response.json({ error: message }, { status: 500 });
  }
}
