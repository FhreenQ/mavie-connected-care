require("dotenv").config();

const fs = require("fs");
const OpenAI = require("openai");

function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured in .env.");
  }

  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

async function extractKoreanMedicineLabelFromImage(imagePath, mimeType) {
  const openai = getOpenAIClient();
  const base64Image = fs.readFileSync(imagePath, "base64");

  const response = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You extract visible Korean medicine label text. Do not prescribe. Do not infer hidden information. Return only visible text and possible fields from the image.",
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text:
              "Read this Korean medicine label. Extract visible product name, strength, visible ingredient if printed, and raw visible text. Return JSON only.",
          },
          {
            type: "image_url",
            image_url: {
              url: `data:${mimeType};base64,${base64Image}`,
            },
          },
        ],
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "korean_medicine_label",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            visibleProductName: {
              type: ["string", "null"],
              description: "Visible Korean product/brand name printed on the label.",
            },
            strength: {
              type: ["string", "null"],
              description: "Visible strength such as 500mg, 500밀리그램, 10mg.",
            },
            visibleIngredient: {
              type: ["string", "null"],
              description:
                "Visible active ingredient if printed, for example 아세트아미노펜. Use null if not visible.",
            },
            rawVisibleText: {
              type: "string",
              description: "All visible readable text from the medicine label.",
            },
            confidence: {
              type: "string",
              enum: ["high", "medium", "low"],
            },
            notes: {
              type: ["string", "null"],
              description:
                "Short note about uncertainty, unreadable areas, or manual confirmation needed.",
            },
          },
          required: [
            "visibleProductName",
            "strength",
            "visibleIngredient",
            "rawVisibleText",
            "confidence",
            "notes",
          ],
        },
      },
    },
  });

  const content = response.choices[0].message.content;
  return JSON.parse(content);
}

module.exports = {
  extractKoreanMedicineLabelFromImage,
};
