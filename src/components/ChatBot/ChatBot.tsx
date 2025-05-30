import React, { useState, useRef, useEffect } from 'react';
import axios from '../../api/axiosConfig';
import styles from './ChatBot.module.css';
import Cookies from 'js-cookie';
import { FaTimes } from 'react-icons/fa';
import { BsChatDots } from 'react-icons/bs';

// Define the exact type for sender values
interface Message {
  sender: 'user' | 'bot';
  text: string;
  links?: string[]; // optional list of links for bot messages
}

const ChatBot: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isOpen && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { sender: 'user', text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    const token = Cookies.get('token');

    try {
      const res = await axios.post(
        '/ai/chatbot',
        { prompt: userMessage.text },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true, // 🔥 Asta trimite cookie-urile spre backend
        }
      );

      const botLinks = res.data?.links || [];
      const botText =
        botLinks.length > 0
          ? '' // Don't display message text if we have links
          : res.data?.message || 'Sorry, I could not understand your request.';

      const botMessage: Message = { sender: 'bot', text: botText, links: botLinks };
      setMessages((prev) => [...prev, botMessage]);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Something went wrong.';
      setMessages((prev) => [...prev, { sender: 'bot', text: errorMsg }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage();
  };

  return (
    <>
      {isOpen && (
        <div className={styles.chatBotWrapper}>
          <div className={styles.chatWindow}>
            {messages.map((msg, index) => (
              <div key={index} className={msg.sender === 'user' ? styles.userMsg : styles.botMsg}>
                {msg.text && msg.text.split('\n').map((line, i) => <p key={i}>{line}</p>)}
                {msg.links && msg.links.length > 0 && (
                  <ul>
                    {msg.links.map((link, i) => (
                      <li key={i}>
                        <a href={link} target="_blank" rel="noopener noreferrer">
                          {link}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
            {loading && <div className={styles.botMsg}>Thinking...</div>}
            <div ref={chatEndRef} />
          </div>

          <form onSubmit={handleSubmit} className={styles.inputArea}>
            <input type="text" placeholder="Ask me about flats..." value={input} onChange={(e) => setInput(e.target.value)} />
            <button type="submit" disabled={loading || !input.trim()}>
              Send
            </button>
          </form>
        </div>
      )}

      <button className={styles.toggleButton} onClick={() => setIsOpen((prev) => !prev)}>
        {isOpen ? <FaTimes size={24} /> : <BsChatDots size={24} />}
      </button>
    </>
  );
};

export default ChatBot;
