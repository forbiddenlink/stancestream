// How it works: a short numbered list shown in a dialog.
import { useEffect, useRef, useState } from 'react';

const STEPS = [
  ['Pick a topic and start a debate.', 'Two AI bots, SenatorBot and ReformerBot, argue it in turns.'],
  ['Read the record.', 'Each turn and each stance is recorded. A diamond marks a turn where a bot\'s stance moved by more than 0.3 on the 0 to 1 scale.'],
  ['Check the facts.', 'Each message is checked against stored facts, and the match score is listed under Fact checks.'],
  ['Look under the record.', 'Analytics shows what the stats service measured. Platform lists the four Redis data models. Tools has the operations list.'],
];

const IntroModule = ({ onComplete, showIntro = false }) => {
  const [isVisible, setIsVisible] = useState(showIntro);
  const closeRef = useRef(null);

  const [previousShowIntro, setPreviousShowIntro] = useState(showIntro);
  if (previousShowIntro !== showIntro) {
    setPreviousShowIntro(showIntro);
    setIsVisible(showIntro);
  }

  const handleComplete = () => {
    setIsVisible(false);
    if (onComplete) onComplete();
  };

  useEffect(() => {
    if (!isVisible) return undefined;
    closeRef.current?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setIsVisible(false);
        if (onComplete) onComplete();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isVisible, onComplete]);

  if (!isVisible) return null;

  return (
    <div className="arena-modal" role="dialog" aria-modal="true" aria-labelledby="intro-title">
      <div className="arena-modal-body">
        <h2 id="intro-title" className="pane-title">How StanceStream works</h2>
        <ol className="how-list">
          {STEPS.map(([head, body]) => (
            <li key={head}>
              <p className="how-head">{head}</p>
              <p className="how-body">{body}</p>
            </li>
          ))}
        </ol>
        <button type="button" className="btn-primary" onClick={handleComplete} ref={closeRef}>Got it</button>
      </div>
    </div>
  );
};

export default IntroModule;
