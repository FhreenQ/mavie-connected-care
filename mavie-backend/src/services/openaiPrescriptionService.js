require("dotenv").config();

const fs = require("fs");
const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function extractMedicationsFromImage(imagePath, mimeType) {
  const base64Image = fs.readFileSync(imagePath, "base64");

  const response = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL,
    messages: [
      {
        role: "system",
        content:
          "You extract medication information from prescription or medication label images. Return only medicines that are visible in the image. Do not invent medicines. If the generic ingredient is clearly written in brackets or visible on the image, extract it. If it is not visible, you may provide a possible generic name only when highly confident, otherwise use null.",
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text:
              "Extract all medications from this prescription image. For each medicine, separate raw printed name, possible brand name, possible generic name, and ingredient candidates. Return JSON only.",
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
        name: "prescription_medications",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            medications: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                properties: {
                  name: {
                    type: ["string", "null"],
                    description:
                      "The full medication name exactly as printed or visible.",
                  },
                  rawName: {
                    type: ["string", "null"],
                    description:
                      "The raw printed medicine text from the prescription.",
                  },
                  brandName: {
                    type: ["string", "null"],
                    description:
                      "Brand or product name if visible or clearly separable.",
                  },
                  genericName: {
                    type: ["string", "null"],
                    description:
                      "Generic ingredient name if visible or highly confident.",
                  },
                  ingredientCandidates: {
                    type: "array",
                    items: {
                      type: "string",
                    },
                    description:
                      "Possible ingredient or generic names to check against the interaction database.",
                  },
                  strength: {
                    type: ["string", "null"],
                    description: "Strength such as 500mg, 10mg, etc.",
                  },
                  dosage: {
                    type: ["string", "null"],
                    description: "Dosage instruction if visible.",
                  },
                  frequency: {
                    type: ["string", "null"],
                    description:
                      "Frequency such as once daily, twice daily, etc.",
                  },
                  confidence: {
                    type: "string",
                    enum: ["high", "medium", "low"],
                  },
                },
                required: [
                  "name",
                  "rawName",
                  "brandName",
                  "genericName",
                  "ingredientCandidates",
                  "strength",
                  "dosage",
                  "frequency",
                  "confidence"
                ],
              },
            },
          },
          required: ["medications"],
        },
      },
    },
  });

  const content = response.choices[0].message.content;
  return JSON.parse(content);
}

module.exports = {
  extractMedicationsFromImage,
};