import { ChatOpenAI } from "langchain/chat_models/openai";
import { HumanMessage, SystemMessage } from "langchain/schema";
import { z } from "zod";
import {
  PromptTemplate
} from "langchain/prompts";
import { 
  StructuredOutputParser
} from "langchain/output_parsers";

function formatGapFillQuestion(jsonInput) {
  const data = JSON.parse(jsonInput);
  
  // Combine correct and incorrect answers
  let answers = [data.correct, ...data.incorrect];

  // Shuffle answers
  answers = answers.sort(() => Math.random() - 0.5);

  // Create an object to hold the answers and their labels
  const answerLabels = ['A', 'B', 'C', 'D'];
  let labeledAnswers = {};

  for (let i = 0; i < answers.length; i++) {
      labeledAnswers[answerLabels[i]] = answers[i];
  }

  // Determine the label of the correct answer
  const correctAnswerLabel = answerLabels[answers.indexOf(data.correct)];

  const question = `Fill in the blank in the following sentence:\n\n${data.question}\n\nOptions:`;

  // Create a string representation of the options
  let options = Object.entries(labeledAnswers)
      .map(([label, answer]) => `${label}. ${answer}`)
      .join('\n');

  return `${question}\n${options}\n\nThe correct answer is ${correctAnswerLabel}.`;
}

export async function getGrammarGapFill(data) {

  //TODO the response is currently a bit off: typically doesn't illustrate the target grammar very well
  const grammar_gap_fill_template = `
  Generate a sentence of around 20 words at a {level} level of English that illustrates this grammatical construction: {grammar}. We will call this the "target grammar"
  The sentence should also relate to the the topic of: {topic}.
  A "gap fill exercise" is one in which certain words or phrases are removed from a sentence and replaced with blanks. Someone studying English as a foreign language might be asked to fill in the blanks with the correct words or phrases.
  We will use the sentence you just generated as the template for a gap fill exercise. To do this, we need to show the student a version of that sentence with the part relating to the target grammar removed and replace by a single blank space.
  The original sentence and the sentence with blank should be exactly the same except for this blank space.
  Then generate three incorrect options to fill the gap. These three options should be words which, if they were used to fill in the blank, would give grammatically incorrect versions of the same sentence.
  Then generate an explanation of why the correct option is correct and why the incorrect options are incorrect.
  You should choose the sentence, the part to make blank and the incorrect options in a way that will help a student understand the target grammar as clearly as possible.
  {format_instructions}
  Do not return anything else but data in this format. Do not say "Here is the data you requested" or anything like that. Just return exactly what was specified and nothing else.
  `

  

  const parser = StructuredOutputParser.fromZodSchema(
    z.object({
      sentence: z.string().describe("A grammatical English sentence of no less than 20 words that illustrates the target grammar. It should help the student understand the target grammar."),
      question: z.string().describe("The sentence referred to above, but with the target grammar removed and replaced with a blank space"),
      correct: z.string().describe("The correct option to fill the blank space; this would turn the question above back into the exact original sentence above"),
      incorrect: z.array(z.string()).describe("Three grammatically incorrect options. You will be assessed on how plausible these options are, so they should be similar to the correct option in some way. But they absolutely must be be bad grammar in this context."),
      explanation: z.string().describe("An explanation of why the correct explanation is correct and why the incorrect options are incorrect. This explanation must itself be factually correct.")
    })
  );

  const formatInstructions = parser.getFormatInstructions();
  console.log(data);
  const model = new ChatOpenAI({
    model: "GPT-4",
    // streaming: true, 
    // callbacks: [
    //   {
    //     handleLLMNewToken(token) {
    //       console.log(token);
    //     },
    //   },
    // ],
    temperature: 0.3,
    //outputParser:parser,  // TODO do I need this here?
    openAIApiKey: import.meta.env.VITE_OPENAI_API_KEY
  });

  const prompt_template = new PromptTemplate({
    template: grammar_gap_fill_template,
    inputVariables: ["level", "topic", "grammar"],
    partialVariables: { format_instructions: formatInstructions },
  });
  //console.log(prompt_template);

  const prompt = await prompt_template.format({
    level: data.level,
    topic: data.topic,
    grammar: data.grammar,
    formatInstructions: formatInstructions,
  });
  console.log(prompt);

  const response = await model.call([
    new SystemMessage(
      "You are a helpful teacher of English as a foreign language."
    ),
    new HumanMessage(prompt),
  ]);

  console.log(response);

  //return formatGapFillQuestion(response.content);
  return response.content;
  
}