import React, { useEffect, useRef, useState } from "react";
import { IoChatbubbleEllipsesOutline, IoVideocamOutline, IoMicOutline } from "react-icons/io5";
import { FaPlay, FaPause, FaStop, FaImage, FaTimes, FaAngleLeft, FaAngleRight, FaDownload  } from "react-icons/fa";
import { IoIosCall, IoMdMore, IoIosArrowBack, IoIosMore } from "react-icons/io";
import WavesurferPlayer from '@wavesurfer/react'
import { GrEmoji, GrAttachment } from "react-icons/gr";
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
import Lightbox from 'react-spring-lightbox';


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
  loader,
  galleryImages,
  setGalleryImages
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

  const [attachmentModal, setAttachmentModal] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imageSelected, setImageSelected] = useState(false);
  const [imageBase64, setImageBase64] = useState(null);
  const fileInputRef = useRef(null);

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
          if (receivedMessage.message?.type == 'image') {
            setGalleryImages(prev => [...prev || [], {
              ...receivedMessage.message,
              src: receivedMessage.message.image,
              id: receivedMessage.message._id
            }])
          }
          setGroupMessagesData((prevData) => ({
            ...prevData,
            messages: [...(prevData?.messages || []), receivedMessage.message],
          }));
        }
      } else {
        if (!receivedMessage.messages) {
          if (receivedMessage.message?.type == 'image') {
            setGalleryImages(prev => [...prev, {
              ...receivedMessage.message,
              src: receivedMessage.message.image,
              id: receivedMessage.message._id
            }])
          }
          setMessages((prevMessages) => [...prevMessages, receivedMessage.message]);
        }
      }
    },
  })

  const handleSendMessage = () => {
    if (imageFile) {

      const messageData = {
        image: imageBase64,
      };

      sendJsonMessage(messageData);
      setImageBase64(null);
      setImageFile(null);
      setImageSelected(false);
    } else if (audioURL) {
      const messageData = {
        audio: audioBase64,
      };
      setAudioURL(null);
      sendJsonMessage(messageData);
      setRecordModal(false)
      setAudioBase64(null)
    } else {
      if (newMessage.trim() === "") return;

      const messageData = {
        text: newMessage,
      };

      sendJsonMessage(messageData);
      setNewMessage("");
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
    if (players.current[id]) {
      players.current[id].playPause();
      setPlayerStates((prev) => ({ ...prev, [id]: !prev[id] })); // Update UI state
    }
  };

  const [currentImageIndex, setCurrentIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  const openLightbox = (id) => {
    debugger
    const index = galleryImages.findIndex((img) => img.id === id);
    if (index !== -1) {
      setCurrentIndex(index);
      setIsOpen(true);
    }
  };

  const closeLightbox = () => setIsOpen(false);

  const gotoPrevious = () => {
    setCurrentIndex((prevIndex) => (prevIndex > 0 ? prevIndex - 1 : galleryImages.length - 1));
  };

  const gotoNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex < galleryImages.length - 1 ? prevIndex + 1 : 0));
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
    } else if (elem.type == 'image') {
      const id = elem._id;
      return <div key={id} className="conversation-item-content">
        <div className="conversation-item-wrapper">
          <div className="conversation-item-box">
            <div className="conversation-item-text" onClick={() => openLightbox(id)}>
              <div className="image-container">
                <img src={elem.image} />
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



  const handleFileUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }

  const handleClose = () => {
    setImageSelected(false);
    setImageFile(null);
  };

  const downloadBase64Image = (idx) => {
    const base64Data = galleryImages[idx]["src"];
    const link = document.createElement("a");
    link.href = base64Data;
    link.download = `Messenger-${moment().format()}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


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
              <Dropdown className="conversation-form-attachment" noCaret title={<GrAttachment />} placement="topEnd">
                {[
                  <Dropdown.Item className="attachment-dropdown-item" key={1}><span onClick={() => handleFileUpload()} className="attachment-icon-text">
                    <FaImage className="attachment-dropdown-icon" />Image</span></Dropdown.Item>,
                ]}
              </Dropdown>
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
              {/* <button type="button" className="conversation-form-attachment" onClick={() => setAttachmentModal(true)}><GrAttachment /></button> */}
              <Dropdown className="conversation-form-attachment" noCaret title={<GrAttachment />} placement="topEnd">
                {[
                  <Dropdown.Item className="attachment-dropdown-item" key={1}><span onClick={() => handleFileUpload()} className="attachment-icon-text">
                    <FaImage className="attachment-dropdown-icon" />Image</span></Dropdown.Item>,
                ]}
              </Dropdown>
              <button onClick={() => { debugger; handleSendMessage() }} type="button" disabled={newMessage.length == 0} className="conversation-form-button conversation-form-submit"><PiTelegramLogo /></button>
            </div>
          </>
        }
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          style={{ display: 'none' }}
          onChange={(e) => {
            console.log("File selected:", e.target.files[0]);
            setImageFile(e.target.files[0]);
            setImageSelected(true);
            const reader = new FileReader();
            reader.readAsDataURL(e.target.files[0]);
            reader.onloadend = () => {
              setImageBase64(reader.result);
            };
          }}
        />
        {imageSelected &&
          <Lightbox
            isOpen={imageSelected}
            images={[{
              src: URL.createObjectURL(imageFile),
              alt: imageFile.name
            }]}
            onClose={() => handleClose()}
            singleClickToZoom
            style={{ backgroundColor: "rgba(0, 0, 0, 0.9)" }}
            renderHeader={() => (
              <div
                style={{
                  top: 0,
                  left: 0,
                  width: "100%",
                  background: "rgba(0, 0, 0, 0.8)",
                  padding: "10px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  color: "#fff",
                }}
              >
                <span style={{ fontSize: "18px", fontWeight: "bold" }}>
                  {imageFile.name}
                </span>
                <div className="lightbox-btn">
                  <button
                    className="lightbox-send-btn"
                    onClick={() => handleSendMessage()}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#fff",
                      fontSize: "18px",
                      cursor: "pointer",
                    }}>
                    <span>
                      <PiTelegramLogo />
                    </span>
                  </button>
                  <button
                    onClick={() => {
                      handleClose()
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#fff",
                      fontSize: "18px",
                      cursor: "pointer",
                    }}
                  >
                    <FaTimes />
                  </button>
                </div>
              </div>
            )}
          />}
        {isOpen && (
          <Lightbox
            isOpen={isOpen}
            images={galleryImages}
            currentIndex={currentImageIndex}
            onClose={closeLightbox}
            onPrev={gotoPrevious}
            onNext={gotoNext}
            style={{ background: 'rgba(0, 0, 0, 0.8)' }}

            // Header (Close Button)
            renderHeader={() => (
              <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 1000 }}>
                <button onClick={()=>downloadBase64Image(currentImageIndex)} style={{ background: 'none',marginInline:'1rem', border: 'none', cursor: 'pointer' }}>
                  <FaDownload  size={30} color="white" />
                </button>
                <button onClick={closeLightbox} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                  <FaTimes size={30} color="white" />
                </button>
              </div>
            )}

            // Previous Button
            renderPrevButton={() => (
              <button onClick={gotoPrevious} style={{ position: 'absolute', left: 20, top: '50%', background: 'none', border: 'none', cursor: 'pointer', zIndex: 1000 }}>
                <FaAngleLeft size={40} color="white" />
              </button>
            )}

            // Next Button
            renderNextButton={() => (
              <button onClick={gotoNext} style={{ position: 'absolute', right: 20, top: '50%', background: 'none', border: 'none', cursor: 'pointer', zIndex: 1000 }}>
                <FaAngleRight size={40} color="white" />
              </button>
            )}
          />
        )}
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
