import React from "react";
import useWebSocket, { ReadyState } from "react-use-websocket";


export default function App() {
  const { readyState } = useWebSocket("ws://127.0.0.1:8000/", {
    onOpen: () => {
      console.log('Connection Successful')
    },
    onClose: () => {
      console.log('Disconnected')
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
    </div>
  )
}