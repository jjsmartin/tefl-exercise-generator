import { useState, useRef, useEffect } from "react";
import { Heading, Box, Flex, Button, Textarea, FormControl, FormLabel, Input, Select, Radio, RadioGroup, Stack, NumberInput, NumberInputField, NumberInputStepper, NumberIncrementStepper, NumberDecrementStepper } from "@chakra-ui/react";
import grammarOptions from '../data/grammarOptions';
import { getGrammarGapFill } from "../api/getGrammarGapFill";

function App() {

  let [prompt, setPrompt] = useState("");
  let [isLoading, setIsLoading] = useState(false);
  let [result, setResult] = useState("");
  const [grammar, setGrammar] = useState("");
  const [topic, setTopic] = useState("");
  const [numQuestions, setNumQuestions] = useState(1);

  const resultRef = useRef();
  useEffect(() => {
    resultRef.current = result;
  }, [result]);

  const handleSubmitButtonClicked = (e) => {

    e.preventDefault();
    setIsLoading(true);
    setResult("");

    const formData = {
      topic: topic,
      grammar: grammar,
      numQuestions: numQuestions,
    };

    console.log(formData);

    getGrammarGapFill(formData).then(results => {
      setResult(results);
      setIsLoading(false);
    })
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

// TODO figure out what to do with the API key when deploying to production