import React, { useState } from "react";
import useWebSocket, { ReadyState } from "react-use-websocket";


export default function App() {
  const [welcomeMessage, setWelcomeMessage] = useState("");

  const [message, setMessage] = useState("");
  const [name, setName] = useState("");

  const [messageHistory, setMessageHistory] = useState([])

  const { readyState, sendJsonMessage } = useWebSocket("ws://127.0.0.1:8000/", {
    onOpen: () => {
      console.log('Connection Successful')
    },
    onClose: () => {
      console.log('Disconnected')
    },  
    onMessage: (e) => {
      const data = JSON.parse(e.data)
      switch(data.type){
        case "chat":
          setWelcomeMessage(data.text);
          break;
        case "chat_message_echo":
          setMessageHistory((prev) => prev.concat(data));
          break;
        default:
          console.error("Unknown message")
          break;
        
      }
  }
  })

  const connectionStatus = {
    [ReadyState.CONNECTING] : "Connecting...",
    [ReadyState.OPEN]: "Open",
    [ReadyState.CLOSING]: "Closing",
    [ReadyState.CLOSED]: "Closed",
    [ReadyState.UNINSTANTIATED]: "Uninitiated"
  }[readyState];

  function handleChangeMessage(e) {
    setMessage(e.target.value);
  }
  
  function handleChangeName(e) {
    setName(e.target.value);
  }

  function handleSubmit(){
    sendJsonMessage({
      type: "chat_message",
      message,
      name
    });
    setName("");
    setMessage("");
  }


  return (
    <div className="flex flex-col justify-content-center">
      <span>The websocket is currently {connectionStatus}</span>
      <p>{welcomeMessage}</p>

     <input className="w-80" name="name" placeholder="Name" onChange={handleChangeName} value={name} />
     <input className="w-80" name="message" placeholder="Message" onChange={handleChangeMessage} value={message} />
     <button className="ml-3 bg-gray-300 px-3 py-3 my-3 w-80" onClick={handleSubmit}>
      Send
     </button>

     <hr />
     <ul>
     {messageHistory.map((message, idx) => (
      <div className='border border-gray-200 py-3 px-3' key={idx}>
        {message.name}: {message.message}
      </div>
     ))}
     </ul>
    </div>
  )
}