import { useState, useEffect, useRef } from 'react'
import './App.css'


function makeRandom(numberOfDigits: number): number {
  let value = 0;
  for (let digit = 0; digit < numberOfDigits; digit++) {
    value *= 10;
    value += Math.floor(10 * Math.random())
  }
  return value;
}

interface Result {
  numberOfDigits: number,
  numberToGuess: number,
  numberGuessed: number,
  success: boolean,
  durationNeededMilliSeconds: number,

};


function getMemorizeTimeMilliSeconds(numberOfDigits: number): number {
  return 1000 + 1000 * numberOfDigits;
}

interface SuccessStoryProps {
  results: Result[],
}

const THINK_FACE = "🤔"
const THUMB_UP = "👍";
const THUMB_DOWN = "👎";
const CLOCK = "🕑"

function SuccessStory(props: SuccessStoryProps) {
  if (props.results.length == 0) {
    return (<span>{THINK_FACE}</span>);
  }

  const lastResult = props.results[props.results.length - 1];

  const thumb = lastResult.success ? THUMB_UP : THUMB_DOWN;

  const explanation = lastResult.success ? <span/> : (
    <span>
      &nbsp;<s>{lastResult.numberGuessed}</s> {lastResult.numberToGuess}
    </span>
  );

  return (
    <>
      <span>
        {thumb} ({(lastResult.durationNeededMilliSeconds / 1000).toFixed(1)}s)
      </span>
      {explanation}
    </>
  );
}

function App() {

  // state

  // current 'level'
  const [numberOfDigits, setNumberOfDigits] = useState(3)
  // results from previous rounds
  const [results, setResults] = useState<Result[]>([]);
  // number to currently guess
  const [currentNumber, setCurrentNumber] = useState(0);  // ref:init
  // time in the current round; also encodes state: while negative the users can
  // see the number but not enter it, once positive they cannot see it but enter
  // it
  const [timeThisRoundMilliSeconds, setTimeThisRoundMilliSeconds] = useState(0); // ref:init

  const inputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setCurrentNumber(makeRandom(numberOfDigits));
    setTimeThisRoundMilliSeconds(- getMemorizeTimeMilliSeconds(numberOfDigits));
    if (inputRef.current != null) {
      inputRef.current.value = "";
    }
  }

  // initialize the values, this is executed only once
  useEffect(reset, []); // ref:init

  // timer

  // use an id to allow stopping the timer from 'outside'
  const timerId = useRef(0);

  const intervalDurationMilliSeconds = 100;
  useEffect(() => {
    timerId.current = setInterval(() => {
      setTimeThisRoundMilliSeconds(t => t + intervalDurationMilliSeconds);
    }, intervalDurationMilliSeconds)

    return () => clearInterval(timerId.current); // cleanup effect: stop that timer
  }, [currentNumber]) // restart timer whenever a new number is selected

  const checkValue = (value: string) => {
    if (value.length == numberOfDigits) {
      const enteredValue = parseInt(value);
      const correct = enteredValue == currentNumber;
      const nextNumberOfDigits = correct ? numberOfDigits + 1 : Math.max(2, numberOfDigits - 1);
      setResults([...results, { numberOfDigits: numberOfDigits, numberToGuess: currentNumber, numberGuessed: enteredValue, success: correct, durationNeededMilliSeconds: timeThisRoundMilliSeconds, }]);
      setNumberOfDigits(nextNumberOfDigits);
      clearInterval(timerId.current);
    }
  }


  // render

  const isMemorizationPhase = timeThisRoundMilliSeconds <= 0;

  // make sure that text input is in focus if it is not disabled
  if (!isMemorizationPhase) {
    if (document.activeElement != inputRef.current) {
      inputRef.current?.focus();
    }
  }

  return (
    <>
      <div>
        {isMemorizationPhase ? currentNumber : "?".repeat(numberOfDigits)}
      </div>
      <div>
        {CLOCK} <code>{(timeThisRoundMilliSeconds / 1000).toFixed(1)}</code>
      </div>
      <div>
        <form onSubmit={(event) => { event.preventDefault(); reset(); }}>
          <input ref={inputRef} type="number" pattern="[0-9]*" onChange={evt => checkValue(evt.target.value)} disabled={isMemorizationPhase} />
        </form>
      </div>
      <div>
        <SuccessStory results={results} />
      </div>
    </>
  )
}

export default App
