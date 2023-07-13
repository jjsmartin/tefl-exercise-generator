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
  formatReadingComprehension
} from "../api/helpers";


export async function getReadingComprehension(data) {

  //TODO the response is currently a bit off: typically doesn't illustrate the target grammar very well
  const reading_comprehension_template = `
  Generate a short passage of around 500 words at a {level} level of English that uses (but does not explicitly talk about) this grammatical construction: {grammar}, and relates to this topic: {topic}. The passage should not explictly discuss grammar -- it should be the sort of thing someone might read in a newspaper or magazine.
  We will use this passage as the basis for a reading comprehension exercise. The student will read the passage and then answer some questions about it. 
  Provide {numQuestions} questions about the passage in the format described below. These should require the student to understand the target grammar and/or the vocabulary related to the topic in order to answer them correctly.
  Also provide the answers to these questions.
  {format_instructions}
  `
  
  const questionSchema = z.object({
    passage: z.string().describe("The passage."),
    questions: z.array(z.string()).describe("The questions about the passage."),
    answers: z.array(z.string()).describe("The answers to the question."),
  })

  const parser = StructuredOutputParser.fromZodSchema(
    questionSchema
  );

  const formatInstructions = parser.getFormatInstructions();

  const model = new ChatOpenAI({
    model: "GPT-4",
    streaming: false, 
    temperature: 0.1,
    openAIApiKey: import.meta.env.VITE_OPENAI_API_KEY
  });

  const prompt_template = new PromptTemplate({
    template: reading_comprehension_template,
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

  return formatReadingComprehension(extractedContent);

}