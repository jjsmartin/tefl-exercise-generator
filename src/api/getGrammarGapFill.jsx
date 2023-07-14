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

  const grammar_gap_fill_template = `
  A "gap-fill exercise" is a common technique used in language teaching, particularly in teaching English as a foreign language (EFL).

  In a gap-fill exercise, students are given sentences or a paragraph where certain words (or phrases) are missing. These missing words are indicated by blanks, or "gaps," hence the name. The students' task is to fill in these gaps with appropriate words or phrases.

  Gap-fill exercises are effective as they engage learners actively, test their comprehension, and provide teachers with an opportunity to assess learning. They are a versatile tool that can be easily integrated into a variety of lesson plans.

  You will create a gap-full exercise which be used to practice specific grammatical structures.

  When creating a gap-fill exercise focused on grammar, it's important to carefully plan the exercise to ensure that it effectively teaches and tests the grammatical point you're targeting. Here are some points to consider:

  Identify the specific grammar point: First, you need to decide what grammar point you want the exercise to focus on. This could be a particular verb tense, preposition, article, modal verb, etc. The exercise should be designed in a way that only this specific grammar point fits the gaps.

  Contextual relevance: It's important to create sentences that are contextually relevant and make sense. It not only makes the exercise more engaging, but it also helps students understand how the grammar point is used in real-world communication.

  Use clear and understandable sentences: The sentences should be at a suitable level for the student. They should be able to understand the sentence as a whole, with the exception of the targeted grammar point.

  Provide a balanced challenge: The exercise shouldn't be too easy, or it won't be an effective learning tool. But it also shouldn't be so difficult that it frustrates the students. You want to challenge them just enough to stretch their abilities without discouraging them.

  Include distractors: Distractors are incorrect options that could logically fill the gap but do not fit the context or grammar rule being applied. They are effective in ensuring that students aren't just guessing the answer and truly understand the grammar.

  Include variations: If you're teaching a grammar point that has different forms or uses, include examples of these variations in your exercise. This can help students understand the grammar point in a more comprehensive way.

  Review and Feedback: After students have completed the exercise, provide explanations that clear up any confusion.

  By paying attention to these points, you can create a gap-fill exercise that effectively teaches the grammar point you're focusing on, giving your students an opportunity to practice and understand the grammar concept in a meaningful context.

  Taking into account this backgroups, generate a sentence of around 20 words that can be used to practice this grammatical construction: 
  "{grammar}".

  We will call this the "target grammar".

  The sentence should also relate to this topic:
  "{topic}"

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