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
import fs from 'fs';
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


  function readFileContent(filename) {
    try {
        const data = fs.readFileSync(filename, 'utf8');
        return data;
    } catch (err) {
        console.error(`Error reading file from disk: ${err}`);
    }
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
You are a helpful teacher of English as a foreign language. You are creating a gap-fill exercise for your students to practice a specific grammar point. In a gap-fill exercise, students are given sentences where certain words (or phrases) are missing. The students' task is to fill in these gaps with appropriate words or phrases.
You will create a gap-fill exercise which be used to practice a particular area of grammar. You will be evaluated on how good your exercise is at teaching this target grammar.

This is the grammar we are trying to teach, and your response will be evaluated based on how well it matches what is said here:
\`\`\`
{grammar}
\`\`\`

Create a fun and relevant gap-fill exercise based on this grammar. The questions should relate to this topic:
\`\`\`
{topic}
\`\`\`

There should be {numQuestions} different questions like this. Return everything in the format described below:
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
        const { grammar, topic, numQuestions } = req.body.formData;

        const prompt_template = new PromptTemplate({
            template: grammar_gap_fill_template,
            inputVariables: ["topic", "grammar", "numQuestions"],
            partialVariables: { format_instructions: formatInstructions },
        });

        const grammarPromptPart = readFileContent(`grammar-prompts/${grammar}.txt`);

        const prompt = await prompt_template.format({
            topic: topic,
            grammar: grammarPromptPart,
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

        // I thought lanchain's parser would handle this, but it seems not to
        const extractedContent = response.content.match(/```json\n([\s\S]*?)\n```/)[1]; //parser.extractContent(response.content);

        // TODO does it make sense to do this here?
        const formattedResponse = formatGapFillQuestions(extractedContent);
        res.status(200).send(JSON.stringify(formattedResponse));

    } catch (error) {
        console.log(error);
        res.status(500).send({error});
    }
})
 
app.listen(8888, () => console.log('Server running on http://localhost:8888'));
