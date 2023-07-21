import React, { useState, useContext, useEffect, useRef } from 'react';
import useWebSocket, { ReadyState } from 'react-use-websocket';
import InfiniteScroll from 'react-infinite-scroll-component';
import { AuthContext } from '../contexts/AuthContext';
import { useParams } from 'react-router-dom';
import { useHotkeys } from 'react-hotkeys-hook';

import { ChatLoader } from './ChatLoader';
import { ConversationModel } from '../models/Conversation';
import { MessageModel } from '../models/Message';
import { Message } from './Message';

export function Chat() {
  const { chatName } = useParams();
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [messageHistory, setMessageHistory] = useState<MessageModel[]>([]);
  const [message, setMessage] = useState('');
  const [page, setPage] = useState(2);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [conversation, setConversation] = useState<ConversationModel | null>(
    null,
  );
  const [participants, setParticipants] = useState<string[]>([]);
  const [userTyping, setUserTyping] = useState(false);
  const timeOut = useRef<any>();
  const [typing, setTyping] = useState(false);

  const { user } = useContext(AuthContext);

  const updateTyping = (event: { user: string; typing: boolean }) => {
    if (event.user !== user!.username) {
      setTyping(event.typing);
    }
  };

  const { readyState, sendJsonMessage } = useWebSocket(
    user ? `ws://127.0.0.1:8000/${chatName}/` : null,
    {
      queryParams: {
        token: user ? user.token : '',
      },
      onOpen: () => {
        console.log('Connected!');
      },
      onClose: () => {
        console.log('Disconnected!');
      },
      // onMessage handler
      onMessage: (e) => {
        const data = JSON.parse(e.data);
        switch (data.type) {
          case 'welcome_message':
            setWelcomeMessage(data.message);
            break;
          case 'chat_message_echo':
            setMessageHistory((prev: any) => [data.message, ...prev]);
            break;
          case 'last_50_messages':
            setMessageHistory(data.messages);
            setHasMoreMessages(data.has_more);
            break;
          case 'user_joined':
            setParticipants((users: string[]) => {
              if (!users.includes(data.user)) {
                return [...users, data.user];
              }
              return users;
            });
            break;
          case 'user_left':
            setParticipants((users: string[]) => {
              const newUser = users.filter((user) => user !== data.user);
              return newUser;
            });
            break;
          case 'online_users':
            setParticipants(data.users);
            break;
          case 'typing':
            updateTyping(data);
            break;
          default:
            console.error('Unknown message type!');
            break;
        }
      },
    },
  );

  const connectionStatus = {
    [ReadyState.CONNECTING]: 'Connecting',
    [ReadyState.OPEN]: 'Open',
    [ReadyState.CLOSING]: 'Closing',
    [ReadyState.CLOSED]: 'Closed',
    [ReadyState.UNINSTANTIATED]: 'Uninstantiated',
  }[readyState];

  /**
   * The function `onType` handles user typing events and sends a JSON message indicating that the user
   * is typing, with a timeout to stop indicating typing after a certain period of time.
   */
  const onType = () => {
    if (userTyping === false) {
      setUserTyping(true);
      sendJsonMessage({ type: 'typing', typing: true });
      timeOut.current = setTimeout(timeOutFunc, 5000); // timeout after five seconds
    } else {
      clearTimeout(timeOut.current);
      timeOut.current = setTimeout(timeOutFunc, 5000);
    }
  };

  useEffect(() => () => clearTimeout(timeOut.current), []);

  function handleChangeMessage(e: any) {
    setMessage(e.target.value);
    onType();
  }

  const handleSubmit = () => {
    if (message.length === 0) return;
    if (message.length > 600) return;
    sendJsonMessage({
      type: 'chat_message',
      message,
    });
    setMessage('');
    clearTimeout(timeOut.current);
    timeOutFunc();
  };

  async function fetchMessages() {
    const res = await fetch(
      `http://127.0.0.1:8000/api/messages/?conversation=${chatName}&page=${page}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Token ${user?.token}`,
          Accept: 'application/json',
        },
      },
    );
    if (res.status === 200) {
      const data: {
        count: number;
        next: string | null; // URL
        previous: string | null; // URL
        results: MessageModel[];
      } = await res.json();
      setHasMoreMessages(data.next != null);
      setPage(page + 1);
      setMessageHistory((prev: MessageModel[]) => prev.concat(data.results));
    }
  }

  useEffect(() => {
    async function fetchConversations() {
      const res = await fetch(
        `http://127.0.0.1:8000/api/conversations/${chatName}/`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Token ${user?.token}`,
            Accept: 'application/json',
          },
        },
      );
      if (res.status === 200) {
        const data: ConversationModel = await res.json();
        setConversation(data);
      }
    }
    fetchConversations();
  }, [conversation, user]);

  const inputRef: any = useHotkeys(
    'enter',
    () => {
      handleSubmit();
    },
    {
      enableOnFormTags: ['INPUT'],
    },
  );

  useEffect(() => {
    (inputRef.current as HTMLElement).focus();
  }, [inputRef]);

  const timeOutFunc = () => {
    setUserTyping(false);
    sendJsonMessage({ type: 'typing', typing: false });
  };

  return (
    <div>
      <span>The WebSocket is currently {connectionStatus}</span>
      {conversation && (
        <div className="py-6">
          <h3 className="text-3xl font-semibold text-gray-900">
            Chat with user: {conversation.other_users.username}
          </h3>
          <span className="text-sm">
            {conversation.other_users.username} is currently
            {participants.includes(conversation.other_users.username)
              ? ' online'
              : ' offline'}
          </span>
        </div>
      )}
      <p>{welcomeMessage}</p>
      <div
        id="scrollableChatDiv"
        className="h-[20rem] mt-3 flex flex-col-reverse relative w-full border border-gray-200 overflow-y-auto p-6"
      >
        <div>
          <InfiniteScroll
            dataLength={messageHistory.length}
            next={fetchMessages}
            className="flex flex-col-reverse"
            inverse={true}
            hasMore={hasMoreMessages}
            loader={<ChatLoader />}
            scrollableTarget="scrollableChatDiv"
          >
            {messageHistory.map((message: MessageModel) => (
              <Message key={message.id} message={message} />
            ))}
          </InfiniteScroll>

          {typing && (
            <p className="truncate text-sm text-gray-500">typing...</p>
          )}
        </div>
      </div>
      <hr />
      <input
        name="message"
        placeholder="Message"
        onChange={handleChangeMessage}
        value={message}
        required
        ref={inputRef}
        maxLength={600}
        className="block w-full rounded bg-gray-100 p-2 outline-none focus:text-gray-700 w-96"
      />
      <button
        className="ml-3 bg-gray-300 px-3 py-1 my-3 rounded w-24"
        onClick={handleSubmit}
      >
        Send
      </button>
    </div>
  );
}
