import express from 'express';
import * as dotenv from 'dotenv';
import cors from 'cors';
import { ChatOpenAI } from "langchain/chat_models/openai";
import { HumanMessage, SystemMessage } from "langchain/schema";
import { z } from "zod";
import {
  PromptTemplate
} from "langchain/prompts";
import {
  StructuredOutputParser
} from "langchain/output_parsers";
// import {
//   formatGapFillQuestions
// } from "./helpers";

dotenv.config({path: '../.env'});


// TODO import this from helpers
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


const model = new ChatOpenAI({
    model: "GPT-4",
    streaming: false,
    temperature: 0.1,
    openAIApiKey: process.env.OPENAI_API_KEY,
});

const app = express();
app.use(cors());
app.use(express.json());



const grammar_gap_fill_template = `
Here is some background about what you will be asked to do:
A "gap-fill exercise" is a common technique used in language teaching, particularly in teaching English as a foreign language (EFL). In a gap-fill exercise, students are given sentences or a paragraph where certain words (or phrases) are missing. The students' task is to fill in these gaps with appropriate words or phrases.
You will create a gap-fill exercise which be used to practice specific grammatical structures, which we will call the "target grammar". You will be evaluated on how good your exercise is at teaching this target grammar.
The exercise should be designed in a way that only the target grammar fits the gaps. The exercise should be engaging, and help students understand how the grammar point is used in real-world communication. There should be exactly one correct answer for each gap.
Provide a balanced challenge: The exercise shouldn't be too easy, or it won't be an effective learning tool. But it also shouldn't be so difficult that it frustrates the students. You want to challenge them just enough to stretch their abilities without discouraging them.
You should also include "distractors". Distractors are incorrect options that a student might think would fill the gap but in fact do not fit the grammar rule being applied. They are effective in ensuring that students aren't just guessing the answer and truly understand the target grammar.
Taking into account this background, generate a sentence of around 20 words that can be used to practice the target grammar.
Here is a description of the target grammar:

{grammar}

The sentence should also relate to this topic:

{topic}

You should return {numQuestions} different gap fill exercises in the format described below. Include some variety so the student cannot just guess the answer.

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

app.get('/', (req, res) => {
    res.status(200).send({message: 'Hello World!'});
});

app.post('/', async (req, res) => {
    try {

        const { grammar, topic, numQuestions } = req.body;

        const prompt_template = new PromptTemplate({
            template: grammar_gap_fill_template,
            inputVariables: ["topic", "grammar", "numQuestions"],
            partialVariables: { format_instructions: formatInstructions },
        });

        const prompt = await prompt_template.format({
            topic: topic,
            grammar: grammar,
            numQuestions: numQuestions,
            formatInstructions: formatInstructions,
        });
        console.log(prompt);

        const response = await model.call([
            new SystemMessage(
            "You are a helpful teacher of English as a foreign language."
            ),
            new HumanMessage(prompt),
        ]);

        res.status(200).send(response)

    } catch (error) {
        console.log(error);
        res.status(500).send({error});
    }
})
 
app.listen(8888, () => console.log('Server running on http://localhost:8888'));
