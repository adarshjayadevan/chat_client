import React, { useEffect, useRef, useState } from "react";
import { IoChatbubbleEllipsesOutline, IoVideocamOutline, IoMicOutline } from "react-icons/io5";
import { FaPlay, FaPause, FaStop } from "react-icons/fa";
import { IoIosCall, IoMdMore, IoIosArrowBack, IoIosMore } from "react-icons/io";
import WavesurferPlayer from '@wavesurfer/react'
import { GrEmoji } from "react-icons/gr";
import { PiTelegramLogo } from "react-icons/pi";
import { Dropdown, Modal, Button, Loader } from 'rsuite';
import EmojiPicker from 'emoji-picker-react';
import { jwtDecode } from "jwt-decode";
import moment from "moment";
import useWebSocket from "react-use-websocket";
import { useNavigate } from "react-router-dom";
import GroupIcon from '../assets/groupIcon.jpg';
import UserIcon from '../assets/user-avatar.jpg';
import { ScaleLoader } from "react-spinners";


export default function Messages({
  activeConversation,
  messages,
  conversationUser,
  handleBackClick,
  chatId,
  setMessages,
  isGroup,
  groupMessagesData,
  setGroupMessagesData,
  receiverImage,
  groupImage,
  loader
}) {
  const endRef = useRef(null);
  const navigate = useNavigate()
  const token = localStorage.getItem('token');
  const userId = token ? jwtDecode(token).id : ''
  const [newMessage, setNewMessage] = useState('');
  const [recordModal, setRecordModal] = useState(false);
  const [recording, setRecording] = useState(false);
  const [audioURL, setAudioURL] = useState(null);
  const [audioBase64, setAudioBase64] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const players = useRef({}); // Store wavesurfer instances without triggering re-renders
  const [playerStates, setPlayerStates] = useState({}); // Triggers UI updates
  const [durations, setDurations] = useState({});
  const [currentTimes, setCurrentTimes] = useState({});

  const [groupRecordModal, setGroupRecordModal] = useState(false);

  useEffect(() => {
    if (!token) {
      navigate('/login')
    }
    if (endRef.current) {
      endRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, groupMessagesData]);

  function handleEmoji(e) {
    setNewMessage(prev => prev + e.emoji);
  }

  const { sendJsonMessage, lastJsonMessage } = useWebSocket(import.meta.env.VITE_WS_URL, {
    queryParams: {
      type: isGroup ? "group" : "single",
      userId: userId,
      chatId: chatId
    },
    onMessage: (event) => {
      const receivedMessage = JSON.parse(event.data);
      console.log(lastJsonMessage)
      if (isGroup) {
        if (!receivedMessage.messages) {
          // setGroupMessagesData((prevData) => ({
          //   ...prevData,
          //   messages: [...prevData.messages, receivedMessage.message],
          // }));
          setGroupMessagesData((prevData) => ({
            ...prevData,
            messages: [...(prevData?.messages || []), receivedMessage.message],
          }));
        }
      } else {
        if (!receivedMessage.messages) {
          setMessages((prevMessages) => [...prevMessages, receivedMessage.message]);
        }
      }
    },
  })

  const handleSendMessage = () => {
    if (!audioURL) {
      if (newMessage.trim() === "") return;

      const messageData = {
        text: newMessage,
      };

      sendJsonMessage(messageData);
      setNewMessage("");
    } else {
      const messageData = {
        audio: audioBase64,
      };
      setAudioURL(null);
      sendJsonMessage(messageData);
      setRecordModal(false)
      setAudioBase64(null)
    }
  };

  // console.log(groupMessagesData)
  // console.log(JSON.stringify(messages))



  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });
        const url = URL.createObjectURL(audioBlob);
        setAudioURL(url);
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          setAudioBase64(reader.result);
        };
      };

      mediaRecorder.start();
      setRecording(true);
    } catch (error) {
      console.error("Error accessing microphone: ", error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? "0" : ""}${secs}`;
  };


  const onReady = (id, ws) => {
    players.current[id] = ws; // Store wavesurfer instance
    setPlayerStates((prev) => ({ ...prev, [id]: false })); // Initialize state
    const duration = ws.getDuration(); // Get audio duration
    setDurations((prev) => ({ ...prev, [id]: formatTime(duration) }));

    // Update current time dynamically while playing
    ws.on("audioprocess", (currentTime) => {
      setCurrentTimes((prev) => ({ ...prev, [id]: formatTime(currentTime) }));
    });

    // Ensure the time resets when the audio ends
    ws.on("finish", () => {
      setCurrentTimes((prev) => ({ ...prev, [id]: "00:00" }));
    });
  };

  const onPlayPause = (id) => {
    debugger
    if (players.current[id]) {
      players.current[id].playPause();
      setPlayerStates((prev) => ({ ...prev, [id]: !prev[id] })); // Update UI state
    }
  };

  if (activeConversation === "default") return null;

  function printMessage(elem) {
    if (elem.type == 'text') {
      return <div className="conversation-item-content">
        <div className="conversation-item-wrapper">
          <div className="conversation-item-box">
            <div className="conversation-item-text">
              <p className="message-text-content">{elem.text}</p>
              <div className="conversation-item-time">{moment(elem.timestamp).format('LT')}</div>
            </div>
          </div>
        </div>
      </div>
    } else if (elem.type == 'audio') {
      const id = elem._id || crypto.randomUUID();
      return <div key={id} className="conversation-item-content">
        <div className="conversation-item-wrapper">
          <div className="conversation-item-box">
            <div className="conversation-item-text">
              <div className="audio-container">
                <button className="audio-play-button" onClick={() => onPlayPause(id)}>
                  {playerStates[id] ? <FaPause /> : <FaPlay />}
                </button>
                <div className="audio-player">
                  <WavesurferPlayer
                    cursorColor="black"
                    height={30}
                    waveColor="black"
                    url={elem.audio}
                    onReady={(ws) => onReady(id, ws)}
                    onPlay={() => setPlayerStates((prev) => ({ ...prev, [id]: true }))}
                    onPause={() => setPlayerStates((prev) => ({ ...prev, [id]: false }))}
                  />
                </div>
                {/* {durations[id] && <span className="audio-duration">{durations[id]}</span>} */}
                {playerStates[id] ? <span className="audio-duration">{currentTimes[id] || "00:00"} / {durations[id] || "00:00"}</span> :
                  <span className="audio-duration">{durations[id]}</span>}
              </div>
              <div className="conversation-item-time">{moment(elem.timestamp).format('LT')}</div>
            </div>
          </div>
        </div>
      </div>
    }
  }

  function renderRecordButton() {
    if (!audioURL && !recording) {
      return <FaPlay className="record-btn" onClick={startRecording} />
    } else if (!audioURL && recording) {
      return <FaStop className="record-btn" onClick={stopRecording} />
    }
  }

  return (
    loader ? <>
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)'
      }}>
        <Loader />
      </div>
    </> :
      <div
        className={`conversation ${activeConversation !== "default" ? 'active' : ''}`}
        id={activeConversation}
      >
        {isGroup ?
          <>
            <div className="conversation-top">
              <button type="button" className="conversation-back" onClick={handleBackClick}><IoIosArrowBack /></button>
              <div className="conversation-user">
                <img className="conversation-user-image" src={groupImage || GroupIcon} alt="" />
                <div>
                  <div className="conversation-user-name">{conversationUser}</div>
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
                    ref={idx === groupMessagesData?.messages.length - 1 ? endRef : null}
                  >
                    <div className="conversation-item-side">
                      <img className="conversation-item-image" src={elem.sender == userId ? localStorage.getItem('profileImage') : groupMessagesData?.members?.find(val => val._id.toString() == elem.sender.toString()).profileImage} alt="" />
                      <p className="message-user-name">{elem.sender == userId ? 'you' : groupMessagesData?.members?.find(val => val._id.toString() == elem.sender.toString()).name}</p>
                    </div>
                    {printMessage(elem)}
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
                <button type="button" className="conversation-form-record" onClick={() => setRecordModal(true)}><IoMicOutline /></button>
              </div>
              <button onClick={() => { handleSendMessage() }} type="button" disabled={newMessage.length == 0} className="conversation-form-button conversation-form-submit"><PiTelegramLogo /></button>
            </div>
          </>
          :
          <>
            <div className="conversation-top">
              <button type="button" className="conversation-back" onClick={handleBackClick}><IoIosArrowBack /></button>
              <div className="conversation-user">
                <img className="conversation-user-image" src={receiverImage || UserIcon} alt="" />
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
                      <img className="conversation-item-image" src={elem?.sender?.toString() == userId ? localStorage.getItem('profileImage') : receiverImage} alt="" />
                    </div>
                    {printMessage(elem)}
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
                <button type="button" className="conversation-form-record" onClick={() => setRecordModal(true)}><IoMicOutline /></button>
              </div>
              <button onClick={() => { debugger; handleSendMessage() }} type="button" disabled={newMessage.length == 0} className="conversation-form-button conversation-form-submit"><PiTelegramLogo /></button>
            </div>
          </>
        }
        <Modal size={'xs'} open={recordModal} onClose={() => setRecordModal(false)}>
          <Modal.Header>
            <Modal.Title>{'Record'}</Modal.Title>
          </Modal.Header>
          <Modal.Body>

            <div className="recording-button">
              {renderRecordButton()}
            </div>
            {recording && <div className="recording-button record-loader">
              <ScaleLoader />
            </div>}

            {/* <button onClick={startRecording} disabled={recording}>Start Recording</button>
        <button onClick={stopRecording} disabled={!recording}>Stop Recording</button> */}
            {/* {audioURL && (
          <div>
            <audio controls src={audioURL}></audio>
            <a href={audioURL} download="recording.wav">Download</a>
          </div>
        )} */}

            <Button style={{ display: "block", margin: "10px auto" }} onClick={() => {
              if (audioURL) {
                handleSendMessage()
              }
            }} >Send</Button>
          </Modal.Body>
        </Modal>
      </div>
  );
}
