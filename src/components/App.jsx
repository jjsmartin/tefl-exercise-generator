import { useState, useRef, useEffect } from "react";
import { Heading, Text, Box, Flex, Button, Textarea, FormControl, FormLabel, Input, Select, Radio, RadioGroup, Stack, Spinner } from "@chakra-ui/react";
import grammarOptions from '../data/grammarOptions';
import { getGrammarGapFill } from "../api/getGrammarGapFill";
import { SSE } from "sse";

function App() {

  let [prompt, setPrompt] = useState("");
  let [isLoading, setIsLoading] = useState(false);
  let [result, setResult] = useState("");
  const [level, setLevel] = useState('beginner')
  const [exerciseType, setExerciseType] = useState("");
  const [grammar, setGrammar] = useState("");
  const [topic, setTopic] = useState("");

  const resultRef = useRef();
  useEffect(() => {
    resultRef.current = result;
  }, [result]);

  const handleSubmitButtonClicked = (e) => {
    setIsLoading(true);
    setResult("");
    e.preventDefault();
    const formData = {
      level: level,
      exerciseType: exerciseType,
      topic: topic,
      grammar: grammar,
    };

    // TODO select the right kind of exercise
    getGrammarGapFill(formData).then(results => {
      setResult(results);
      setIsLoading(false);
    });

  };

  let handleClearButtonClicked = () => {
    setPrompt("");
    setResult("");
  };


  return (
    <Flex
      width={"100vw"}
      height={"100vh"}
      alignContent={"center"}
      justifyContent={"center"}
      backgroundColor="#F0F8FF"
    >
      <Box maxW="2xl" m="0 auto" p="20px">
        <Heading
          as="h1"
          textAlign="center"
          fontSize="5xl"
          mt="100px"
          color="orange.500"
        >
          TEFL Exercise Generator
        </Heading>
        <Heading as="h2" textAlign="center" fontSize="3xl" mt="20px" color="blue.500">
          Infinite TEFL exercises!
        </Heading>

        <Box p={5}>
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
            </Stack>
          </form>
        </Box>

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
        <Box maxW="4xl" m="0 auto" style={{ whiteSpace: 'pre-wrap' }}>
          <Heading as="h5" textAlign="left" fontSize="lg" mt="40px">
            Result:
          </Heading>
          <Box border="1px" borderColor="gray.200" borderRadius="md" p={1}>
            <Text fontSize="lg" textAlign="left" mt="20px">{result}</Text>
          </Box>
        </Box>
      </Box>
    </Flex >
  );
}

export default App;



