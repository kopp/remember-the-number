import { useState, useEffect, useRef, CSSProperties } from 'react'
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

function colorizeLetters(letters: string, color: CSSProperties["color"], mask: boolean[]): JSX.Element {
  if (letters.length != mask.length) {
    console.error(`Unable to color ${letters} with maks ${mask} of different length.`);
    return (<span>{letters}</span>);
  }

  // const colorizedLetters = letters.split("").map((char, idx) => { mask[idx] ? (<span style={{color: color}}>{char}</span>) : (<span>{char}</span>) });
  const colorizedLetters = (() => {
    const characters = letters.split("");
    let colorized = new Array<JSX.Element>(characters.length);
    for (let i = 0; i < characters.length; ++i) {
      if (mask[i]) {
        colorized[i] = (<span style={{ color: color }}>{characters[i]}</span>);
      }
      else {
        colorized[i] = (<span>{characters[i]}</span>);
      }
    }
    return colorized;
  })();
  console.log(colorizedLetters);
  return (
    <>
      {colorizedLetters}
    </>
  );
}

function visualDiff(reference: number, toCheck: number): JSX.Element {
  const ref = reference.toString();
  const check = toCheck.toString();

  if (ref.length != check.length) {
    return (
      <span>
        <s>{ref}</s> {check}
      </span>
    );
  }

  const charDiffers = (() => {
    let same = new Array<boolean>(ref.length);
    for (let i = 0; i < ref.length; ++i) {
      same[i] = ref[i] != check[i];
    }
    return same;
  })();

  return (
    <>
      {colorizeLetters(ref, "green", charDiffers)}&nbsp;&nbsp;
      {colorizeLetters(check, "red", charDiffers)}
    </>
  )

}

function SuccessStory(props: SuccessStoryProps) {
  if (props.results.length == 0) {
    return (<span>{THINK_FACE}</span>);
  }

  const lastResult = props.results[props.results.length - 1];

  const thumb = lastResult.success ? THUMB_UP : THUMB_DOWN;

  const explanation = lastResult.success ? <span /> : (
    <span>
      &nbsp;{visualDiff(lastResult.numberToGuess, lastResult.numberGuessed)}
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

  const clearText = () => {
    if (inputRef.current != null) {
      inputRef.current.value = "";
    }
  }

  const reset = () => {
    setCurrentNumber(makeRandom(numberOfDigits));
    setTimeThisRoundMilliSeconds(- getMemorizeTimeMilliSeconds(numberOfDigits));
    clearText();
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

  // make sure that text input is in focus
  if (document.activeElement != inputRef.current) {
    inputRef.current?.focus();
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
          <input ref={inputRef} type="number" pattern="[0-9]*" onChange={evt => {
            if (isMemorizationPhase) {
              // ignore input
              // An alternative would be to disable the input in this case.
              // Downside to that alternative is, that on mobile devices the
              // keyboard will be removed if there is no input field.
              clearText();
            } else {
              checkValue(evt.target.value);
            }
          }} />
        </form>
      </div>
      <div>
        <SuccessStory results={results} />
      </div>
    </>
  )
}

export default App
