import { ChatOpenAI } from "langchain/chat_models/openai";
import { HumanMessage, SystemMessage } from "langchain/schema";
import { z } from "zod";
import {
  PromptTemplate
} from "langchain/prompts";
import { 
  StructuredOutputParser
} from "langchain/output_parsers";



function formatGapFillQuestions(jsonString) {

  let data = JSON.parse(jsonString);

  let output = '';

  for (let i = 0; i < data.length; i++) {
      let item = data[i];

      output += `Question ${i + 1}\n\n`;
      output += `${item.question}\n\n`;

      // Combine correct and incorrect answers
      let options = [item.correct, ...item.incorrect];

      // Randomize the order of options
      options.sort(() => Math.random() - 0.5);

      // Print options with labels A-D
      for (let j = 0; j < options.length; j++) {
          output += String.fromCharCode('A'.charCodeAt(0) + j) + '. ' + options[j] + '\n';
      }

      // Find the label of the correct answer
      let correctLabel = String.fromCharCode('A'.charCodeAt(0) + options.indexOf(item.correct));

      output += `\nThe correct answer is ${correctLabel}. ${item.correct}\n`;
      output += `\n${item.explanation}\n\n`;
      output += '\n\n';
  }

  return output;
}

export async function getGrammarGapFill(data) {

  //TODO the response is currently a bit off: typically doesn't illustrate the target grammar very well
  // const grammar_gap_fill_template = `
  // Generate a sentence of around 20 words at a {level} level of English that illustrates this grammatical construction: {grammar}. We will call this the "target grammar"
  // The sentence should also relate to the the topic of: {topic}.
  // A "gap fill exercise" is one in which certain words or phrases are removed from a sentence and replaced with blanks. Someone studying English as a foreign language might be asked to fill in the blanks with the correct words or phrases.
  // We will use the sentence you just generated as the template for a gap fill exercise. To do this, we need to show the student a version of that sentence with the part relating to the target grammar removed and replace by a single blank space.
  // The original sentence and the sentence with blank should be exactly the same except for this blank space.
  // Then generate three incorrect options to fill the gap. These three options should be words which, if they were used to fill in the blank, would give grammatically incorrect versions of the same sentence.
  // Then generate an explanation of why the correct option is correct and why the incorrect options are incorrect.
  // You should choose the sentence, the part to make blank and the incorrect options in a way that will help a student understand the target grammar as clearly as possible.
  // You should return {numQuestions} different gap fill exercises in the format described below.
  // {format_instructions}
  // `

  // TODO some types of grammar seem to work better than others. Evaluation with that langchain approach?
  const grammar_gap_fill_template = `
  In the context of teaching English as a foreign language, a "gap fill exercise" (sometimes called a "cloze" exercise) is one in which a student has to replace a word or short phrase missing from a text. Typically, this text is a sentence or short paragraph.
  In this context, the student will also be given a number of options to fill the gap. The student must choose the correct option.
  In a good exercise, the missing word and the options should be chosen in a way that helps the student understand the target grammar. They should focus the student's attention on the way the English language routinely uses the target grammar. They should not be easily guessable from the context, by a student who does not understand the target grammar.
  You will be asked to generate {numQuestions} different gap fill exercises in the format described below. These exercises will focus on the target grammar: {grammar} and should be tailored to a student at a {level} level of English.
  The sentences should also relate to the the topic of: {topic}, although it is much more important that they illustrate the target grammar clearly.
  Please consider whether a student would learn something relevant from each question, and remember that we are not testing the student's general knowledge or spelling, but their understanding of the target grammar and their ability to distringuish between grammatically correct and incorrect sentences.
  {format_instructions}
  `

  console.log(data);
  

  const questionSchema = z.object({
    sentence: z.string().describe("A grammatical English sentence of no less than 20 words that illustrates the target grammar. It should help the student understand the target grammar. There should be no blank space in this sentence. It should be a complete sentence."),
    question: z.string().describe("The sentence referred to above, but with the target grammar removed and replaced with a blank space"),
    correct: z.string().describe("The correct option to fill the blank space; this would turn the question above back into the exact original sentence above"),
    incorrect: z.array(z.string()).describe("Three grammatically incorrect options. You will be assessed on how plausible these options are, so they should be similar to the correct option in some way. But they absolutely must be be bad grammar in this context."),
    explanation: z.string().describe("An explanation of why the correct explanation is correct and why the incorrect options are incorrect. This explanation must itself be factually correct."),
    evaluation: z.string().describe("Tell me if you think this question will help a student of English to understand the target grammar. Explicitly say if it is good or bad. Please explain why.")
  })

  const questionArraySchema = z.array(questionSchema).describe("An array of questions, each in the format described above.")

  const parser = StructuredOutputParser.fromZodSchema(
    questionArraySchema
  );

  const formatInstructions = parser.getFormatInstructions();
  console.log(data);
  const model = new ChatOpenAI({
    model: "GPT-4",
    streaming: false, 
    temperature: 0.3,
    //outputParser:parser,  // TODO do I need this here?
    openAIApiKey: import.meta.env.VITE_OPENAI_API_KEY
  });

  const prompt_template = new PromptTemplate({
    template: grammar_gap_fill_template,
    inputVariables: ["level", "topic", "grammar", "numQuestions"],
    partialVariables: { format_instructions: formatInstructions },
  });
  //console.log(prompt_template);

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
  //return formatGapFillQuestion(response.content);
  //return JSON.parse(extractedContent);  // TODO there should be a way to use the parser here (?)
  
  // TODO randomize the order of the questions properly (currently the correct answer is always A)
  return formatGapFillQuestions(extractedContent);

}