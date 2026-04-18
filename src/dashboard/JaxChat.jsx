import { useEffect, useRef, useState } from 'react';
import { postJson } from '../lib/api.js';

const INITIAL_MESSAGE = "Morning. Pipeline's running. What do you need?";

export default function JaxChat({ tenantId = null }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: INITIAL_MESSAGE }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function send() {
    const userMessage = input.trim();

    if (!userMessage || loading) {
      return;
    }

    const history = messages.map(({ role, content }) => ({ role, content }));
    setInput('');
    setMessages((current) => [...current, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const data = await postJson('/api/jax', {
        message: userMessage,
        history,
        tenantId
      });

      setMessages((current) => [...current, { role: 'assistant', content: data.reply }]);
    } catch (error) {
      const isNotFound = error.message.includes('404');
      const help = isNotFound
        ? 'API route not found. If you are running plain Vite, start the backend with `npx vercel dev` or set `VITE_API_PROXY_TARGET=http://localhost:3000` and run the API separately.'
        : error.message;

      setMessages((current) => [
        ...current,
        { role: 'assistant', content: `Something went wrong. ${help}` }
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="pill">Jax | Chief of Staff</div>
      <div className="chat-feed">
        {messages.map((message, index) => (
          <div
            key={`${message.role}-${index}`}
            className={`chat-bubble ${message.role}`}
          >
            {message.content}
          </div>
        ))}
        {loading ? <div className="chat-bubble assistant subtle">Jax is thinking...</div> : null}
        <div ref={bottomRef} />
      </div>
      <div className="composer">
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              send();
            }
          }}
          placeholder="Message Jax..."
        />
        <button type="button" onClick={send}>
          Send
        </button>
      </div>
    </>
  );
}
