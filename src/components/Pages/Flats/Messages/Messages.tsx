import React, { useEffect, useState } from 'react';
import type { ChangeEvent } from 'react';
import { useLoaderData, useActionData, Form, useSubmit, useOutletContext, redirect, type LoaderFunctionArgs, type ActionFunctionArgs } from 'react-router-dom';
import Cookies from 'js-cookie';
import axios from './../../../../api/axiosConfig';
import { validateField } from '../../../../utils/validateField';
import type Message from '../../../../types/Message';
import styles from './Messages.module.css';

interface CurrentUser {
  firstName: string;
  lastName: string;
  email: string;
}

interface LoaderData {
  messages: Message[];
  isOwner: boolean;
  userCanMessage: boolean;
}

interface ActionData {
  success?: boolean;
  error?: string;
  message?: Partial<Message>;
}

interface ContextData {
  flatID: string;
  ownerID: string;
}

// Loader to fetch messages from backend
export const messagesLoader = async ({ params }: LoaderFunctionArgs): Promise<LoaderData | Response> => {
  const token = Cookies.get('token');
  if (!token) return redirect('/login');
  const flatID = params.flatID;
  if (!flatID) return redirect('/');

  try {
    await axios.get('/users/me', {
      headers: { Authorization: `Bearer ${token}` },
    });

    const { data: msgRes } = await axios.get(`/flats/${flatID}/messages`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const isOwner = msgRes.meta?.isOwner || false;
    const userCanMessage = msgRes.meta?.userCanMessage || false;
    const messages = msgRes.data
      .map((msg: any) => ({
        id: msg._id,
        flatID,
        senderId: msg.senderId,
        content: msg.content,
        creationTime: new Date(msg.createdAt).toLocaleString(),
        // fallback if backend doesn't return name/email
        senderName: msg.senderName,
        senderEmail: msg.senderEmail,
      }))
      .sort((a: Message, b: Message) => Date.parse(a.creationTime) - Date.parse(b.creationTime));

    return { messages, isOwner, userCanMessage };
  } catch (error: any) {
    console.error('Error loading messages:', error);

    const status = error?.response?.status;

    if (status === 401) {
      return redirect('/login');
    }

    if (status === 403) {
      return { messages: [], isOwner: false, userCanMessage: true };
    }

    throw new Response('Unexpected error loading messages', { status: 500 });
  }
};

export const messagesAction = async ({ request, params }: ActionFunctionArgs): Promise<ActionData> => {
  const token = Cookies.get('token');
  if (!token) return { error: 'Not authenticated' };

  const formData = await request.formData();
  const content = formData.get('messageContent') as string;
  const flatID = params.flatID;

  if (!flatID || !content?.trim()) return { error: 'Message content cannot be empty.' };

  try {
    const { data } = await axios.post(
      `/flats/${flatID}/messages`,
      { content },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    return {
      success: true,
      message: {
        id: data.data._id,
        flatID,
        senderId: data.data.senderId,
        content: data.data.content,
        creationTime: new Date(data.data.createdAt || Date.now()).toLocaleString(),
      },
    };
  } catch (error) {
    console.error('Error sending message:', error);
    return { error: 'Failed to send the message. Please try again.' };
  }
};

const Messages: React.FC = () => {
  const { flatID } = useOutletContext<ContextData>();
  const { messages: initialMessages, isOwner, userCanMessage } = useLoaderData() as LoaderData;
  const actionData = useActionData<ActionData>();
  const [messages, setMessages] = useState<Message[]>(initialMessages || []);
  const [newMessage, setNewMessage] = useState('');
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const submit = useSubmit();

  useEffect(() => {
    const fetchUser = async () => {
      const token = Cookies.get('token');
      if (!token) return;
      try {
        const { data } = await axios.get('/users/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCurrentUser(data.currentUser);
      } catch (error) {
        console.error('Error fetching current user:', error);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    if (actionData?.success && actionData.message) {
      const newMsg: Message = {
        id: actionData.message.id || '',
        flatID,
        senderId: actionData.message.senderId || '',
        content: actionData.message.content || '',
        creationTime: actionData.message.creationTime || new Date().toLocaleString(),
        senderName: currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'You',
        senderEmail: currentUser?.email || '—',
      };
      setMessages((prev) => [...prev, newMsg]);
      setNewMessage('');
      setError('');
    } else if (actionData?.error) {
      setError(actionData.error);
    }
  }, [actionData, currentUser, flatID]);

  const handleInputChange = async (e: ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setNewMessage(value);
    if (value.trim()) {
      const error = await validateField('messageContent', value);
      setError(error);
    } else {
      setError('');
    }
  };

  const handleBlur = async () => {
    const error = await validateField('messageContent', newMessage);
    setError(error);
  };

  return (
    <div className={styles.messages}>
      <h3>Messages</h3>
      <div className={styles.messageList}>
        {messages.length > 0 ? (
          messages.map((msg) => (
            <div key={msg.id} className={styles.message}>
              <p>
                <strong>From:</strong> {msg.senderName} ({msg.senderEmail})
              </p>
              <p>
                <strong>Sent:</strong> {msg.creationTime}
              </p>
              <p>
                <strong>Message:</strong> {msg.content}
              </p>
            </div>
          ))
        ) : (
          <p>No messages to display.</p>
        )}
      </div>

      {!isOwner && userCanMessage && (
        <Form
          method="post"
          onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            if (!newMessage.trim()) {
              setError('Message content can’t be an empty string.');
              return;
            }
            const formData = new FormData(e.currentTarget);
            submit(formData, { method: 'post' });
          }}
          className={styles.newMessage}
        >
          <textarea name="messageContent" placeholder="Write your message here..." value={newMessage} onChange={handleInputChange} onBlur={handleBlur} className={error ? styles.errorInput : ''} />
          {error && <p className={styles.error}>{error}</p>}
          <button type="submit" disabled={!newMessage.trim()}>
            Send Message
          </button>
        </Form>
      )}
    </div>
  );
};

export default Messages;
