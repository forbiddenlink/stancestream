import { useState } from 'react';
import { BASE_DEBATE_TOPICS } from '../data/debateTopics';
import './home.css';

// Facts below come from the repo, not from a live debate:
// - agents, roles and opening stances: ../index.js and ../addReformer.js (agent:*:profile seeds)
// - the opening line: ../index.js (seed message on stream debate:climatebill2025:messages)
// - rounds: runDebateRounds() in ../server.js defaults to 5; each round is one turn per agent
// - shift threshold: keyMoments.js flags a stance flip when the change is more than 0.3
const AGENTS = {
    senatorbot: { name: 'SenatorBot', role: 'Moderate US Senator', side: 'a' },
    reformerbot: { name: 'ReformerBot', role: 'Progressive Policy Advocate', side: 'b' },
};
const ORDER = ['senatorbot', 'reformerbot'];
const ROUNDS = 5;
const SHIFT_THRESHOLD = 0.3;
const TICKS = [0, 0.25, 0.5, 0.75, 1];

// Stance values stored on the seeded agent profiles. Only these two keys exist.
const SEED_STANCE = {
    climate_policy: { senatorbot: 0.4, reformerbot: 0.9 },
};
const SEED_LINE = 'We must balance environmental protection with economic growth.';

const turns = Array.from({ length: ROUNDS * ORDER.length }, (_, i) => ({
    n: i + 1,
    round: Math.floor(i / ORDER.length) + 1,
    agent: ORDER[i % ORDER.length],
}));

function Track({ values }) {
    const a = values?.senatorbot;
    const b = values?.reformerbot;
    const has = a !== undefined && b !== undefined;
    return (
        <div className="track" aria-hidden="true">
            <span className="track-rule" />
            {TICKS.map((t) => (
                <span key={t} className="track-tick" style={{ left: `${t * 100}%` }} />
            ))}
            {has && (
                <>
                    <span
                        className="track-gap"
                        style={{ left: `${Math.min(a, b) * 100}%`, width: `${Math.abs(a - b) * 100}%` }}
                    />
                    <span className="track-dot dot-a" style={{ left: `${a * 100}%` }}>
                        <span className="track-val">{a.toFixed(1)}</span>
                    </span>
                    <span className="track-dot dot-b" style={{ left: `${b * 100}%` }}>
                        <span className="track-val">{b.toFixed(1)}</span>
                    </span>
                </>
            )}
        </div>
    );
}

export default function Home() {
    const [topicId, setTopicId] = useState('climate');
    const topic = BASE_DEBATE_TOPICS.find((t) => t.id === topicId);
    const seed = SEED_STANCE[topic.stanceKey];
    const hasSeedLine = topic.stanceKey === 'climate_policy';

    return (
        <div className="home">
            <header className="home-nav">
                <a className="home-brand" href="/">StanceStream</a>
                <nav aria-label="Site">
                    <a href="/about">About</a>
                    <a href="/contact">Contact</a>
                </nav>
            </header>

            <main id="main">
                <section className="home-head" aria-labelledby="home-title">
                    <h1 id="home-title">The record of a debate between two AI bots.</h1>
                    <p className="home-lede">
                        SenatorBot and ReformerBot take opposite sides of a topic and argue it in turns.
                        Each turn goes on the record, and each bot&rsquo;s stance on a scale of 0 to 1 is
                        tracked as it moves.
                    </p>

                    <fieldset className="topic-pick">
                        <legend>Choose the topic for the record</legend>
                        <div className="topic-list">
                            {BASE_DEBATE_TOPICS.map((t) => (
                                <label key={t.id} className={t.id === topicId ? 'is-on' : ''}>
                                    <input
                                        type="radio"
                                        name="topic"
                                        value={t.id}
                                        checked={t.id === topicId}
                                        onChange={() => setTopicId(t.id)}
                                    />
                                    <span>{t.name}</span>
                                </label>
                            ))}
                        </div>
                    </fieldset>

                    <p className="home-action">
                        <a className="open-arena" href={`/arena?topic=${topic.id}`}>
                            Open the arena
                            <span aria-hidden="true"> &rarr;</span>
                        </a>
                        <span className="home-action-note">
                            Opens the live arena with {topic.name} selected. You start the debate there.
                        </span>
                    </p>
                </section>

                <section className="record" aria-labelledby="record-title">
                    <div className="record-head">
                        <h2 id="record-title">{topic.name}</h2>
                        <p>
                            {topic.description}. Sample record: the structure of a debate, with the turns
                            left empty until one is run. No debate has been recorded on this page.
                        </p>
                        <p className="key">
                            <span className="shift-mark" aria-hidden="true" />
                            <span>
                                A mark in the margin means a bot&rsquo;s stance moved by more than{' '}
                                {SHIFT_THRESHOLD} between turns.
                            </span>
                        </p>
                    </div>

                    <div className="meter-head" aria-hidden="true">
                        <div className="meter-legend">
                            <span className="lg lg-a">{AGENTS.senatorbot.name}</span>
                            <span className="lg lg-b">{AGENTS.reformerbot.name}</span>
                        </div>
                        <div className="meter-scale">
                            <span style={{ left: '0%' }}>0</span>
                            <span style={{ left: '50%' }}>0.5</span>
                            <span style={{ left: '100%' }}>1</span>
                        </div>
                    </div>

                    <ol className="turns">
                        {turns.map((t, i) => {
                            const agent = AGENTS[t.agent];
                            const first = t.n === 1;
                            const filled = first && hasSeedLine;
                            return (
                                <li key={t.n} className={`turn${filled ? ' is-seed' : ''}`}>
                                    {t.n % ORDER.length === 1 && (
                                        <p className="round" role="presentation">Round {t.round}</p>
                                    )}
                                    <div className="who">
                                        <span className={`who-name side-${agent.side}`}>{agent.name}</span>
                                        <span className="who-role">{agent.role}</span>
                                    </div>
                                    <div className="mark">
                                        <span className="shift-slot" aria-hidden="true" />
                                    </div>
                                    <div className="para">
                                        <span className="para-n">{t.n}.</span>
                                        {filled ? (
                                            <>
                                                <p className="para-text">{SEED_LINE}</p>
                                                <p className="para-note">
                                                    Seed line from the demo setup (index.js). Not a debate turn.
                                                </p>
                                            </>
                                        ) : (
                                            <p className="para-text is-empty">
                                                Empty slot. {agent.name}&rsquo;s turn {t.n} is recorded here
                                                when a debate runs.
                                            </p>
                                        )}
                                        <p className="sr-only">
                                            Stance-shift mark appears in the margin if this turn moves the
                                            stance by more than {SHIFT_THRESHOLD}.
                                        </p>
                                    </div>
                                    <div className="meter">
                                        <Track values={first ? seed : undefined} />
                                        {first && (
                                            <p className="meter-note">
                                                {seed
                                                    ? `Opening stances on file: ${AGENTS.senatorbot.name} ${seed.senatorbot}, ${AGENTS.reformerbot.name} ${seed.reformerbot}.`
                                                    : 'No opening stance is on file for this topic.'}
                                            </p>
                                        )}
                                        {i === 0 && <span className="sr-only">Stance meter, 0 to 1.</span>}
                                    </div>
                                </li>
                            );
                        })}
                    </ol>

                    <p className="record-foot">
                        A debate runs {ROUNDS} rounds by default, one turn per bot in each round.{' '}
                        <a href={`/arena?topic=${topic.id}`}>Open the arena</a> to fill this record.
                    </p>
                </section>
            </main>

            <footer className="home-foot">
                <a href="/about">About</a>
                <a href="/contact">Contact</a>
                <a href="/privacy-policy">Privacy policy</a>
            </footer>
        </div>
    );
}
