import { ChatOpenAI } from "langchain/chat_models/openai";
import { HumanMessage, SystemMessage } from "langchain/schema";
import { z } from "zod";
import {
  PromptTemplate
} from "langchain/prompts";
import { 
  StructuredOutputParser
} from "langchain/output_parsers";
import { 
  formatGapFillQuestions
} from "../api/helpers";


export async function getGrammarGapFill(data) {

  //TODO these questions types are not being generated correctly: adverbials, uncount nouns. Are gap-fill questions the right format for these?
  const grammar_gap_fill_template = `
  Generate a sentence of around 20 words that includes this grammatical construction: 
  "{grammar}".
  We will call this the "target grammar". This is the most important thing. But the sentence should absolutely not explicitly mention the target grammar.
  Instead, the sentence should relate to this topic:
  "{topic}"
  A "gap fill exercise" is one in which certain words or phrases are removed from a sentence and replaced with blanks. Someone studying English as a foreign language might be asked to fill in the blanks with the correct words or phrases.
  We will use the sentence you just generated as the template for a gap fill exercise. 
  Consider what a student of English as a foreign language might get wrong about the target grammar, and replace the relevant part of the sentence with a single blank space.
  The original sentence and the sentence with blank should be exactly the same except for this blank space.
  Then generate the correct option to fill the gap. This should be a word or phrase which, if it were used to fill in the blank, would give back the original sentence.
  This student should have to understand the target grammar in order to choose the correct option.
  Then generate three incorrect options to fill the gap. These three options should be words which, if they were used to fill in the blank, would give grammatically incorrect versions of the same sentence.
  Then generate an explanation of why the correct option is correct. You should also go through each incorrect option and explain why it is grammatically incorrect.
  You should choose the sentence, the part to make blank and the incorrect options in a way that will help a student understand the target grammar as clearly as possible.
  You should return {numQuestions} different gap fill exercises in the format described below. Do not use the same correct option more than once.
  {format_instructions}
  `
  
  const questionSchema = z.object({
    sentence: z.string().describe("The original sentence, with no blanks."),
    question: z.string().describe("The sentence the student will see, with a blank space"),
    correct: z.string().describe("The correct option."),
    incorrect: z.array(z.string()).describe("Three incorrect options."),
    explanation: z.string().describe("An explanation of the correct and the three incorrect options."),
  })

  const questionArraySchema = z.array(questionSchema).describe("An array of questions, each in the format described above.")

  const parser = StructuredOutputParser.fromZodSchema(
    questionArraySchema
  );

  const formatInstructions = parser.getFormatInstructions();

  const model = new ChatOpenAI({
    model: "GPT-4",
    streaming: false, 
    temperature: 0.1,
    openAIApiKey: import.meta.env.VITE_OPENAI_API_KEY
  });

  const prompt_template = new PromptTemplate({
    template: grammar_gap_fill_template,
    inputVariables: ["level", "topic", "grammar", "numQuestions"],
    partialVariables: { format_instructions: formatInstructions },
  });

  const prompt = await prompt_template.format({
    level: data.level,
    topic: data.topic,
    grammar: data.grammar,
    numQuestions: data.numQuestions,
    formatInstructions: formatInstructions,
  });
  console.log(prompt);

  const response = await model.call([
    new SystemMessage(
      "You are a helpful teacher of English as a foreign language."
    ),
    new HumanMessage(prompt),
  ]);

  console.log("response:");
  console.log(response);

  const extractedContent = response.content.match(/```json\n([\s\S]*?)\n```/)[1]; //parser.extractContent(response.content);
  console.log(extractedContent);
  
  console.log("parsed:");
  console.log(JSON.parse(extractedContent));

  return formatGapFillQuestions(extractedContent);

}