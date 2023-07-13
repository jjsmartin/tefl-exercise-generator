import { useState, useRef, useEffect } from "react";
import { Heading, Text, Box, Flex, Button, Textarea, FormControl, FormLabel, Input, Select, Radio, RadioGroup, Stack, NumberInput, NumberInputField, NumberInputStepper, NumberIncrementStepper, NumberDecrementStepper } from "@chakra-ui/react";
import grammarOptions from '../data/grammarOptions';
import { getGrammarGapFill } from "../api/getGrammarGapFill";
import { getVocabGapFill } from "../api/getVocabGapFill";
import { getReadingComprehension } from "../api/getReadingComprehension";

function App() {

  let [prompt, setPrompt] = useState("");
  let [isLoading, setIsLoading] = useState(false);
  let [result, setResult] = useState("");
  const [level, setLevel] = useState('beginner')
  const [exerciseType, setExerciseType] = useState("");
  const [grammar, setGrammar] = useState("");
  const [topic, setTopic] = useState("");
  const [numQuestions, setNumQuestions] = useState(1);

  const resultRef = useRef();
  useEffect(() => {
    resultRef.current = result;
  }, [result]);

  const handleSubmitButtonClicked = (e) => {

    e.preventDefault();
    // if (!exerciseType) {
    //   alert('Please choose an exercise type before submitting.');
    //   return;
    // }

    setIsLoading(true);
    setResult("");

    const formData = {
      level: level,
      exerciseType: exerciseType,
      topic: topic,
      grammar: grammar,
      numQuestions: numQuestions,
    };

    console.log(formData);

    if (formData.exerciseType === "grammar gap-fill") {

      getGrammarGapFill(formData).then(results => {
        setResult(results);
        setIsLoading(false);
      })
    } else if (formData.exerciseType === "vocab gap-fill") {
      getVocabGapFill(formData).then(results => {
        setResult(results);
        setIsLoading(false);
      })
    } else if (formData.exerciseType === "reading comprehension") {
      getReadingComprehension(formData).then(results => {
        setResult(results);
        setIsLoading(false);
      })
    } else
      console.log("Error: exercise type not recognized");
  };


  let handleClearButtonClicked = () => {
    setPrompt("");
    setResult("");
    setIsLoading(false);
  };


  return (
    <Box>
      <Heading
        as="h1"
        textAlign="center"
        fontSize="5xl"
        mt="50px"
        mb="50px"
        color="orange.500"
      >
        TEFL Exercise Generator
      </Heading>

      <Flex>
        <Box w="25%" h="100%" p={4}>
          <form onSubmit={handleSubmitButtonClicked}>
            <Stack spacing={5}>

              <FormControl mt={5}>
                <FormLabel fontSize="lg" fontWeight="bold">What level of English?</FormLabel>
                <RadioGroup onChange={setLevel} value={level}>
                  <Stack direction='row'>
                    <Radio value='beginner'>Beginner</Radio>
                    <Radio value='intermediate'>Intermediate</Radio>
                    <Radio value='advanced'>Advanced</Radio>
                  </Stack>
                </RadioGroup>
              </FormControl>

              <FormControl mt={5}>
                <FormLabel fontSize="lg" fontWeight="bold">What sort of Exercise?</FormLabel>
                <Select placeholder="Select option" onChange={e => setExerciseType(e.target.value)} size="lg">
                  <option value="grammar gap-fill">Grammar Gap-fill</option>
                  <option value="vocab gap-fill">Vocab Gap-fill</option>
                  <option value="reading comprehension">Reading Comprehension</option>
                </Select>
              </FormControl>

              <FormControl mt={4}>
                <FormLabel fontSize="lg" fontWeight="bold" >What sort of topic?</FormLabel>
                <Input type="text" placeholder="Select option" autoComplete="off" value={topic} onChange={(e) => setTopic(e.target.value)} />
              </FormControl>

              <FormControl mt={4}>
                <FormLabel fontSize="lg" fontWeight="bold">What kind of grammar?</FormLabel>
                <Select placeholder="Select option?" onChange={(e) => setGrammar(e.target.value)}>
                  {grammarOptions.map((option, index) => (
                    <option key={index} value={option}>
                      {option}
                    </option>
                  ))}
                </Select>
              </FormControl>

              <FormControl mt={4}>
                <FormLabel fontSize="lg" fontWeight="bold">How many questions (max 10)?</FormLabel>
                <NumberInput min={1} max={10} defaultValue={1} onChange={(e) => setNumQuestions(e)}>
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>

            </Stack>
          </form>

          <Button
            colorScheme="teal"
            size="lg"
            mt="30px"
            ml="20px"
            onClick={handleSubmitButtonClicked}
            isLoading={isLoading}
            loadingText="Generating Exercise"
          >
            Submit
          </Button>

          <Button
            colorScheme="teal"
            size="lg"
            mt="30px"
            ml="20px"
            onClick={handleClearButtonClicked}
          >
            Clear
          </Button>

        </Box>

        <Box w="75%" border="1px" borderColor="gray.200" p={4}>

          <Box p={1}>
            <Textarea value={result} height="1200px" fontSize="lg" textAlign="left" mt="10px" isReadOnly={true} />
          </Box>

        </Box>
      </Flex>
    </Box>

  );
}

export default App;

// TODO the prompts are all pretty inconsistent. Go back to LLM api vs chat api?
// TODO different exercise types use different input variables (e.g. grammar vs vocab gap-fill). How do I handle this?
// TODO figure out what to do with the API key when deploying to production
