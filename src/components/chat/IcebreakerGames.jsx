import { useState } from 'react';

const TRUTH_OR_DARE = {
  truth: [
    "What's the most embarrassing thing you've done in public?",
    "What's a secret talent you have?",
    "What's the last lie you told?",
    "What's your biggest fear?",
    "What's the most childish thing you still do?",
    "What's your guilty pleasure song?",
    "Have you ever stalked someone on social media?",
    "What's the weirdest dream you've had?",
    "What's something you've never told anyone?",
    "If you could read minds for a day, whose would you read?",
    "What's the most ridiculous thing you believed as a kid?",
    "What habit do you wish you could break?",
    "What's the worst date you've been on?",
    "What's a movie that made you cry?",
    "What's the most spontaneous thing you've ever done?",
  ],
  dare: [
    "Send the 5th photo in your gallery (describe it)",
    "Type with your eyes closed for the next message",
    "Say something in a different language",
    "Describe your outfit right now",
    "Tell a joke - if I don't laugh, you lose!",
    "Share the last song you listened to",
    "Describe yourself in 3 emojis only",
    "Make up a short rap about today's weather",
    "Tell me your most unpopular opinion",
    "Describe your room in one sentence",
    "Share your phone's battery percentage honestly",
    "Type the next 3 messages in ALL CAPS",
    "Give me your best pickup line",
    "Describe your ideal weekend",
    "Share the last thing you searched on Google",
  ],
};

const WOULD_YOU_RATHER = [
  "Would you rather be able to fly or be invisible?",
  "Would you rather travel to the past or the future?",
  "Would you rather have unlimited money or unlimited knowledge?",
  "Would you rather live in the mountains or by the ocean?",
  "Would you rather never use social media again or never watch movies again?",
  "Would you rather be famous but lonely or unknown but loved?",
  "Would you rather always say what you think or never speak again?",
  "Would you rather have super speed or super strength?",
  "Would you rather live in a world without music or without color?",
  "Would you rather be able to talk to animals or speak every human language?",
  "Would you rather always be 10 min late or 20 min early?",
  "Would you rather give up your phone or your computer?",
  "Would you rather live without AC or without heating?",
  "Would you rather be the funniest person or the smartest?",
  "Would you rather have free WiFi everywhere or free coffee everywhere?",
];

const TWO_TRUTHS_ONE_LIE = [
  "Tell me 2 truths and 1 lie about yourself — I'll guess the lie!",
  "Share 3 facts about your childhood — one is false. Which one?",
  "Name 3 places you've been — one is made up!",
  "Tell me 3 foods you love — one of them is actually a lie!",
  "Share 3 hobbies — I bet I can spot the fake one!",
];

const THIS_OR_THAT = [
  "Coffee or tea?",
  "Morning person or night owl?",
  "Cats or dogs?",
  "Netflix or YouTube?",
  "Summer or winter?",
  "Sweet or savory?",
  "City or countryside?",
  "Books or movies?",
  "Call or text?",
  "Pizza or burgers?",
  "Android or iPhone?",
  "Rain or sunshine?",
  "Cooking or ordering in?",
  "Spotify or Apple Music?",
  "Early bird or night owl?",
];

const TRIVIA = [
  { q: "What planet is closest to the Sun?", a: "Mercury" },
  { q: "How many bones are in the human body?", a: "206" },
  { q: "What is the capital of Australia?", a: "Canberra" },
  { q: "Who painted the Mona Lisa?", a: "Leonardo da Vinci" },
  { q: "What is the smallest country in the world?", a: "Vatican City" },
  { q: "What year did the Titanic sink?", a: "1912" },
  { q: "How many continents are there?", a: "7" },
  { q: "What is the hardest natural substance?", a: "Diamond" },
  { q: "Who wrote Romeo and Juliet?", a: "William Shakespeare" },
  { q: "What is the longest river in the world?", a: "Nile (or Amazon, debated)" },
  { q: "What gas do plants absorb from the atmosphere?", a: "Carbon dioxide" },
  { q: "What is the largest ocean on Earth?", a: "Pacific Ocean" },
  { q: "How many players are on a soccer team?", a: "11" },
  { q: "What is the chemical symbol for gold?", a: "Au" },
  { q: "What language has the most native speakers?", a: "Mandarin Chinese" },
];

function getRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export default function IcebreakerGames({ onSend, onClose }) {
  const [activeGame, setActiveGame] = useState(null);
  const [triviaRevealed, setTriviaRevealed] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);

  function startGame(game) {
    setActiveGame(game);
    setTriviaRevealed(false);
    generateNew(game);
  }

  function generateNew(game) {
    setTriviaRevealed(false);
    const g = game || activeGame;
    if (g === 'truth') setCurrentItem(getRandom(TRUTH_OR_DARE.truth));
    else if (g === 'dare') setCurrentItem(getRandom(TRUTH_OR_DARE.dare));
    else if (g === 'wyr') setCurrentItem(getRandom(WOULD_YOU_RATHER));
    else if (g === 'truths') setCurrentItem(getRandom(TWO_TRUTHS_ONE_LIE));
    else if (g === 'tot') setCurrentItem(getRandom(THIS_OR_THAT));
    else if (g === 'trivia') setCurrentItem(getRandom(TRIVIA));
  }

  function sendToChat() {
    if (!currentItem) return;
    if (activeGame === 'trivia') {
      onSend(`🧠 Trivia: ${currentItem.q}`);
    } else {
      const emoji = activeGame === 'truth' ? '🤔' :
                    activeGame === 'dare' ? '😈' :
                    activeGame === 'wyr' ? '🤷' :
                    activeGame === 'truths' ? '🎭' :
                    activeGame === 'tot' ? '⚡' : '🎮';
      onSend(`${emoji} ${currentItem}`);
    }
  }

  const games = [
    { id: 'truth', label: 'Truth', icon: '🤔' },
    { id: 'dare', label: 'Dare', icon: '😈' },
    { id: 'wyr', label: 'Would You Rather', icon: '🤷' },
    { id: 'truths', label: '2 Truths 1 Lie', icon: '🎭' },
    { id: 'tot', label: 'This or That', icon: '⚡' },
    { id: 'trivia', label: 'Trivia', icon: '🧠' },
  ];

  return (
    <div className="icebreaker-panel">
      <div className="icebreaker-header">
        <h4>Icebreaker Games</h4>
        <button className="btn-icon" onClick={onClose} title="Close">✕</button>
      </div>

      {!activeGame ? (
        <div className="icebreaker-games-grid">
          {games.map(g => (
            <button key={g.id} className="icebreaker-game-btn" onClick={() => startGame(g.id)}>
              <span className="icebreaker-game-icon">{g.icon}</span>
              <span>{g.label}</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="icebreaker-active">
          <div className="icebreaker-card">
            <p className="icebreaker-question">
              {activeGame === 'trivia' ? currentItem?.q : currentItem}
            </p>
            {activeGame === 'trivia' && (
              <button
                className="btn-reveal-answer"
                onClick={() => setTriviaRevealed(!triviaRevealed)}
              >
                {triviaRevealed ? `Answer: ${currentItem?.a}` : 'Reveal Answer'}
              </button>
            )}
          </div>
          <div className="icebreaker-actions">
            <button className="btn btn-secondary btn-sm" onClick={() => generateNew()}>
              Next
            </button>
            <button className="btn btn-primary btn-sm" onClick={sendToChat}>
              Send to Chat
            </button>
          </div>
          <button className="icebreaker-back" onClick={() => setActiveGame(null)}>
            ← Back to games
          </button>
        </div>
      )}
    </div>
  );
}
