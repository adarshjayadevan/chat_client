import React, { useEffect, useRef, useState } from "react";
import { IoChatbubbleEllipsesOutline, IoVideocamOutline, IoMicOutline } from "react-icons/io5";
import { IoIosCall, IoMdMore, IoIosArrowBack, IoIosMore } from "react-icons/io";
import { GrEmoji } from "react-icons/gr";
import { PiTelegramLogo } from "react-icons/pi";
import { Dropdown } from 'rsuite';
import EmojiPicker from 'emoji-picker-react';
import { jwtDecode } from "jwt-decode";
import moment from "moment";
import useWebSocket from "react-use-websocket";
import { useNavigate } from "react-router-dom";

export default function Messages({ activeConversation, messages, conversationUser, handleBackClick, chatId, setMessages, isGroup, groupMessagesData, setGroupMessagesData, receiverImage }) {
  const endRef = useRef(null);
  const navigate = useNavigate()
  const token = localStorage.getItem('token');
  const userId = token?jwtDecode(token).id:''
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    if(!token){
      navigate('/login')
    }
    if (endRef.current) {
      endRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages,groupMessagesData]);

  function handleEmoji(e) {
    setNewMessage(prev => prev + e.emoji);
    console.log(newMessage)
  }

  const { sendJsonMessage, lastJsonMessage } = useWebSocket(import.meta.env.VITE_WS_URL, {
    queryParams: {
      type: isGroup?"group":"single",
      userId: userId,
      chatId: chatId
    },
    onMessage: (event) => {
      const receivedMessage = JSON.parse(event.data);
      console.log(lastJsonMessage)
      if(isGroup){
        if (!receivedMessage.messages) {
          setGroupMessagesData((prevData) => ({
            ...prevData,
            messages: [...prevData.messages, receivedMessage.message],
          }));
        }        
      }else{
        if (!receivedMessage.messages) {
          setMessages((prevMessages) => [...prevMessages, receivedMessage.message]);
        }
      }
    },
  })

  const handleSendMessage = () => {
    if (newMessage.trim() === "") return;

    const messageData = {
      text: newMessage,
    };

    sendJsonMessage(messageData);
    setNewMessage("");
  };

  console.log(groupMessagesData)
  console.log(JSON.stringify(messages))


  if (activeConversation === "default") return null;

  return (
    <div
      className={`conversation ${activeConversation !== "default" ? 'active' : ''}`}
      id={activeConversation}
    >
      {isGroup ?
        <>
          <div className="conversation-top">
            <button type="button" className="conversation-back" onClick={handleBackClick}><IoIosArrowBack /></button>
            <div className="conversation-user">
              <img className="conversation-user-image" src="https://images.unsplash.com/photo-1530099486328-e021101a494a?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MzB8fGdyb3VwfGVufDB8fDB8fHww" alt="" />
              <div>
                <div className="conversation-user-name">{conversationUser}</div>
                <div className="conversation-user-status online">online</div>
              </div>
            </div>
            <div className="conversation-buttons">
              <button type="button"><IoIosCall /></button>
              <button type="button"><IoVideocamOutline /></button>
              <button type="button"><IoMdMore /></button>
            </div>
          </div>
          <div className="conversation-main">
            <ul className="conversation-wrapper">
              {groupMessagesData?.messages?.map((elem, idx) => (
                <li
                  key={elem._id}
                  className={`conversation-item ${elem?.sender?.toString() == userId ? "me" : ""}`}
                  ref={idx === messages.length - 1 ? endRef : null}
                >
                  <div className="conversation-item-side">
                    <img className="conversation-item-image" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OXx8cGVvcGxlfGVufDB8fDB8fHww&auto=format&fit=crop&w=500&q=60" alt="" />
                    <p className="message-user-name">{elem.sender==userId?'you':groupMessagesData?.members?.find(val=>val._id.toString()==elem.sender.toString()).name}</p>
                  </div>
                  <div className="conversation-item-content">
                    <div className="conversation-item-wrapper">
                      <div className="conversation-item-box">
                        <div className="conversation-item-text">
                          <p className="message-text-content">{elem.text}</p>
                          <div className="conversation-item-time">{moment(elem.timestamp).format('LT')}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="conversation-form">
            <Dropdown noCaret title={<GrEmoji />} placement="topStart">
              {<EmojiPicker onEmojiClick={e => { handleEmoji(e) }} />}
            </Dropdown>
            <div className="conversation-form-group">
              <textarea className="conversation-form-input" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} rows="1" placeholder="Type here..."></textarea>
              <button type="button" className="conversation-form-record"><IoMicOutline /></button>
            </div>
            <button onClick={() => handleSendMessage()} type="button" disabled={newMessage.length == 0} className="conversation-form-button conversation-form-submit"><PiTelegramLogo /></button>
          </div>
        </>
        :
        <>
          <div className="conversation-top">
            <button type="button" className="conversation-back" onClick={handleBackClick}><IoIosArrowBack /></button>
            <div className="conversation-user">
              <img className="conversation-user-image" src={receiverImage||"https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OXx8cGVvcGxlfGVufDB8fDB8fHww&auto=format&fit=crop&w=500&q=60"} alt="" />
              <div>
                <div className="conversation-user-name">{conversationUser}</div>
                {/* <div className="conversation-user-status online">online</div> */}
              </div>
            </div>
            <div className="conversation-buttons">
              <button type="button"><IoIosCall /></button>
              <button type="button"><IoVideocamOutline /></button>
              <button type="button"><IoMdMore /></button>
            </div>
          </div>
          <div className="conversation-main">
            <ul className="conversation-wrapper">
              {messages.map((elem, idx) => (
                <li
                  key={elem._id}
                  className={`conversation-item ${elem?.sender?.toString() == userId ? "me" : ""}`}
                  ref={idx === messages.length - 1 ? endRef : null}
                >
                  <div className="conversation-item-side">
                    <img className="conversation-item-image" src={elem?.sender?.toString() == userId ?localStorage.getItem('profileImage'):receiverImage} alt="" />
                  </div>
                  <div className="conversation-item-content">
                    <div className="conversation-item-wrapper">
                      <div className="conversation-item-box">
                        <div className="conversation-item-text">
                          <p className="message-text-content">{elem.text}</p>
                          <div className="conversation-item-time">{moment(elem.timestamp).format('LT')}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="conversation-form">
            <Dropdown noCaret title={<GrEmoji />} placement="topStart">
              {<EmojiPicker onEmojiClick={e => { handleEmoji(e) }} />}
            </Dropdown>
            <div className="conversation-form-group">
              <textarea className="conversation-form-input" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} rows="1" placeholder="Type here..."></textarea>
              <button type="button" className="conversation-form-record"><IoMicOutline /></button>
            </div>
            <button onClick={() => handleSendMessage()} type="button" disabled={newMessage.length == 0} className="conversation-form-button conversation-form-submit"><PiTelegramLogo /></button>
          </div>
        </>
      }
    </div>
  );
}
