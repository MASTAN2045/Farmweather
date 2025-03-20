import React, { useState } from "react";
import axios from "axios";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function ChatBot() {
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState("");

  const sendMessage = async () => {
    if (!userInput.trim()) return;

    const newMessages = [...messages, { sender: "user", text: userInput }];
    setMessages(newMessages);

    try {
      const response = await axios.post("http://localhost:5000/chat", { message: userInput });
      const botReply = response.data.reply;
      setMessages([...newMessages, { sender: "bot", text: botReply }]);
    } catch (error) {
      console.error("Error fetching response:", error);
      setMessages([...newMessages, { sender: "bot", text: "Sorry, I couldn't process your request." }]);
    }

    setUserInput("");
  };

  return (
    <div className="flex flex-col items-center w-full max-w-md p-4 bg-white shadow-lg rounded-lg">
      <h2 className="text-xl font-semibold mb-4">AI Farm Assistant</h2>
      <div className="w-full h-64 overflow-y-auto border p-2 mb-4 bg-gray-100 rounded">
        {messages.map((msg, index) => (
          <div key={index} className={`p-2 my-1 rounded ${msg.sender === "user" ? "bg-blue-300 text-right" : "bg-gray-300"}`}>
            {msg.text}
          </div>
        ))}
      </div>
      <div className="flex w-full">
        <Input
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          className="flex-1 p-2 border rounded"
          placeholder="Ask something..."
        />
        <Button onClick={sendMessage} className="ml-2">Send</Button>
      </div>
    </div>
  );
}
