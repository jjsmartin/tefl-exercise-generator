export function formatGapFillQuestions(jsonString) {

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



  export function formatReadingComprehension(jsonString) {

    let data = JSON.parse(jsonString);

    let output = "";
  
    output += "Passage:\n\n" + data.passage + "\n\n";
  
    output += "Questions:\n";
    data.questions.forEach((question, index) => {
      output += (index + 1) + ". " + question + "\n";
    });
  
    output += "\nAnswers:\n";
    data.answers.forEach((answer, index) => {
      output += (index + 1) + ". " + answer + "\n";
    });
  
    return output;
  }