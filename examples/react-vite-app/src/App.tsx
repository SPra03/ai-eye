import { useState } from 'react';
import './App.css';

function App() {
  const [count, setCount] = useState(0);
  const [message, setMessage] = useState('');

  return (
    <div className="app">
      <header className="header">
        <h1>VisionCraft Source Mapping Demo - 60 (HMR Test!)</h1>
        <p>Inspect any element below to see source location attributes!</p>
      </header>

      <main className="main">
        <section className="counter-section">
          <h2>Counter Demo</h2>
          <div className="counter-display">
            Count: <span className="count-value">{count}</span>
          </div>
          <div className="button-group">
            <button onClick={() => setCount(count - 1)}>
              Decrement
            </button>
            <button onClick={() => setCount(0)}>
              Reset
            </button>
            <button onClick={() => setCount(count + 1)}>
              Increment
            </button>
          </div>
        </section>

        <section className="input-section">
          <h2>Input Demo</h2>
          <input
            type="text"
            placeholder="Type something..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="text-input"
          />
          {message && (
            <div className="message-display">
              You typed: <strong>{message}</strong>
            </div>
          )}
        </section>

        <section className="info-section">
          <h2>How to Verify Source Mapping</h2>
          <ol className="steps-list">
            <li>Right-click any element on this page</li>
            <li>Select "Inspect Element"</li>
            <li>Look for <code>data-vc-source</code>, <code>data-vc-line</code>, <code>data-vc-col</code> attributes</li>
            <li>These tell VisionCraft where the element came from!</li>
          </ol>
        </section>
      </main>

      <footer className="footer">
        <p>
          Built with ❤️ using VisionCraft |
          Open DevTools and inspect elements to see source mapping
        </p>
      </footer>
    </div>
  );
}

export default App;
