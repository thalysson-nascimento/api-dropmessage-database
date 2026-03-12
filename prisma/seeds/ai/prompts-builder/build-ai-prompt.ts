import fs from "fs";
import path from "path";

export function buildAIPrompt(ai: any) {
  const promptPath = path.join(
    __dirname,
    "..",
    "prompts",
    `${ai.slug}.prompt.md`
  );

  const template = fs.readFileSync(promptPath, "utf-8");

  return template
    .replace("{{name}}", ai.name)
    .replace("{{age}}", String(ai.age))
    .replace("{{city}}", ai.city)
    .replace("{{country}}", ai.country)
    .replace("{{traits}}", ai.traits.map((t: any) => t.trait.name).join(", "))
    .replace(
      "{{interests}}",
      ai.interests.map((i: any) => i.hobby.name).join(", ")
    )
    .replace(
      "{{lifestyles}}",
      ai.lifestyles.map((l: any) => l.hobby.name).join(", ")
    );
}
