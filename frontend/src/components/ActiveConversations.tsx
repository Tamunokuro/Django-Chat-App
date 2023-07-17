import { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { ConversationModel } from '../models/Conversation';

export function ActiveConversations() {
  const { user } = useContext(AuthContext);
  const [conversation, setActiveConversation] = useState<ConversationModel[]>(
    [],
  );

  useEffect(() => {
    async function fetchUsers() {
      const res = await fetch('http://127.0.0.1:8000/api/conversations/', {
        headers: {
          Authorization: `Token ${user?.token}`,
        },
      });
      const data = await res.json();
      setActiveConversation(data);
    }
    fetchUsers();
  }, [user]);

  function createConversationName(username: string) {
    const nameAlph = [user?.username, username].sort();
    return `${nameAlph[0]}__${nameAlph[1]}`;
  }

  function formatMessageTimestamp(timestamp?: string) {
    if (!timestamp) return;
    const date = new Date(timestamp);
    return date.toLocaleTimeString().slice(0, 5);
  }

  return (
    <div>
      {conversation.map((conver) => (
        <Link
          to={`/chats/${createConversationName(conver.other_users.username)}`}
          key={conver.other_users.username}
        >
          <div className="border border-gray-200 w-full p-3">
            <h3 className="text-xl font-semibold text-gray-800">
              {conver.other_users.username}
            </h3>
            <div className="flex justify-between">
              <p className="text-gray-700">{conver.last_message?.chat}</p>
              <p className="text-gray-700">
                {formatMessageTimestamp(conver.last_message?.timestamp)}
              </p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
