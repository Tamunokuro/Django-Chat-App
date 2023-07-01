import React, { useState } from "react";
import useWebSocket, { ReadyState } from "react-use-websocket";


export default function App() {
  const [welcomeMessage, setWelcomeMessage] = useState("")
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
        default:
          e.error("Unknown message")
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


  return (
    <div>
      <span>The websocket is currently {connectionStatus}</span>
      <p>{welcomeMessage}</p>
     <button className="bg-gray-300 px-3 py-1"
     onClick={() => {
      sendJsonMessage({
        type:"message",
        message: "Hey there!"
      })
     }}>
      Send Message!
     </button>
    </div>
  )
}