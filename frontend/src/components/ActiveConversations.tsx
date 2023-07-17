import { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { ConversationModel } from '../models/Conversation';

/**
 * The `ActiveConversations` component fetches and displays a list of active conversations, including
 * the usernames of the other users involved and the last message sent in each conversation.
 * @returns The ActiveConversations component returns a JSX element that contains a list of
 * conversation items. Each conversation item is wrapped in a Link component and contains the username
 * of the other user in the conversation, the last message in the conversation, and the timestamp of
 * the last message.
 */
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

  /**
   * The function creates a conversation name by sorting and concatenating two usernames.
   * @param {string} username - The `username` parameter is a string that represents the username of a
   * user.
   * @returns a string that is created by concatenating the two usernames in alphabetical order,
   * separated by two underscores.
   */
  function createConversationName(username: string) {
    const nameAlph = [user?.username, username].sort();
    return `${nameAlph[0]}__${nameAlph[1]}`;
  }

  /**
   * The function `formatMessageTimestamp` formats a given timestamp into a localized time string.
   * @param {string} [timestamp] - The `timestamp` parameter is a string representing a date and time.
   * It is an optional parameter, meaning it can be omitted when calling the `formatMessageTimestamp`
   * function.
   * @returns a formatted timestamp string.
   */
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
