import React, { useState, useEffect } from "react";
import { IoChatbubbleEllipsesOutline } from "react-icons/io5";
import { IoIosLogOut } from "react-icons/io";
import { HiUserAdd } from "react-icons/hi";
import { MdGroupAdd } from "react-icons/md";
import { CiUser } from "react-icons/ci";
import { Modal, List, HStack, Text, Avatar, Button, Placeholder } from 'rsuite';
import 'rsuite/dist/rsuite.min.css';
import "./styles.css";
import "./color-palette.css";
import Messages from "./Messages";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import axios from "axios";
import AvatarImg from '../assets/avatar.jpg'
import moment from "moment";


export default function ChatApp() {
  const navigate = useNavigate()
  const [isProfileActive, setIsProfileActive] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [activeConversation, setActiveConversation] = useState("default");
  const [conversationUser, setConversationUser] = useState('');
  const [contacts, setContacts] = useState([]);
  const [chatId, setChatId] = useState('');
  const [groupId, setGroupId] = useState('');
  const [isGroup, setIsGroup] = useState(false);
  const [userMessages, setUserMessages] = useState([]);
  const [newChatModal, setNewChatModal] = useState(false);
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('chat');
  const [refreshFlag, setRefreshFlag] = useState(false);
  const [groupMessagesData, setGroupMessagesData] = useState({});

  const handleProfileToggle = (e) => {
    e.preventDefault();
    setIsProfileActive(!isProfileActive);
  };

  const handleClickOutside = (e) => {
    if (!e.target.closest('.chat-sidebar-profile')) {
      setIsProfileActive(false);
    }
  };

  const handleClickOutsideDropdown = (e) => {
    if (!e.target.closest('.conversation-item-dropdown')) {
      setActiveDropdown(null);
    }
  };

  const handleConversationClick = (e, conversationId, userName, chatId, groupname) => {
    e.preventDefault();
    setChatId(chatId)
    setActiveConversation(conversationId);
    if (userName) {
      setIsGroup(false);
      setConversationUser(userName)
    } else {
      setIsGroup(true);
      setConversationUser(groupname)
    }
    if (userName) {
      setIsGroup(false);
      getMessages(conversationId)
    } else {
      setIsGroup(true);
      getGroupMessages(conversationId)
    }
  };

  const handleBackClick = (e) => {
    e.preventDefault();
    setActiveConversation("default");
  };

  useEffect(() => {
    document.addEventListener('click', handleClickOutside);
    document.addEventListener('click', handleClickOutsideDropdown);

    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('click', handleClickOutsideDropdown);
    };
  }, []);

  useEffect(() => {
    getContacts()
  }, [userMessages])

  async function getContacts() {
    const token = localStorage.getItem('token');
    const userId = jwtDecode(token).id
    axios.post(`${import.meta.env.VITE_API_URL}/chats`, { userId }, { headers: { Authorization: `Bearer ${token}` } }).then(res => {
      console.log(res);
      setContacts(res?.data?.data);
    }).catch(err => {
      console.log(err);
      if (err.status == 401 && err.response?.data?.message == "Unauthorized") {
        localStorage.removeItem('token');
        navigate('/')
      }
      if (err.status == 401 && err.response?.data?.message == "Authorization failed due to jwt expired") {
        localStorage.removeItem('token');
        navigate('/')
      }
      debugger
    })
  }

  async function getMessages(conversationId) {
    const token = localStorage.getItem('token');
    const userId = jwtDecode(token).id
    axios.post(`${import.meta.env.VITE_API_URL}/messages`, { userId, chatId: conversationId }, { headers: { Authorization: `Bearer ${token}` } }).then(res => {
      console.log(res);
      if (res?.data?.data[0]) {
        setUserMessages(res?.data?.data[0].messages)
      }
    }).catch(err => {
      console.log(err);
      if (err.status == 401 && err.response?.data?.message == "Unauthorized") {
        localStorage.removeItem('token');
        navigate('/')
      }
      if (err.status == 401 && err.response?.data?.message == "Authorization failed due to jwt expired") {
        localStorage.removeItem('token');
        navigate('/')
      }
      debugger
    })
  }

  async function getGroupMessages(conversationId) {
    const token = localStorage.getItem('token');
    axios.post(`${import.meta.env.VITE_API_URL}/groupmessages`, { groupId: conversationId }, { headers: { Authorization: `Bearer ${token}` } }).then(res => {
      console.log(res);
      if (res?.data?.data[0]) {
        debugger
        setGroupMessagesData(res?.data?.data[0]);
      }
    }).catch(err => {
      console.log(err);
      if (err.status == 401 && err.response?.data?.message == "Unauthorized") {
        localStorage.removeItem('token');
        navigate('/')
      }
      if (err.status == 401 && err.response?.data?.message == "Authorization failed due to jwt expired") {
        localStorage.removeItem('token');
        navigate('/')
      }
      debugger
    })
  }

  async function getAllUsers() {
    const token = localStorage.getItem('token');
    const userId = jwtDecode(token).id
    axios.post(`${import.meta.env.VITE_API_URL}/contacts`, { userId }, { headers: { Authorization: `Bearer ${token}` } }).then(res => {
      console.log(res);
      if (res?.data?.data) {
        setUsers(res?.data?.data)
      }
      setNewChatModal(true);
    }).catch(err => {
      console.log(err);
      if (err.status == 401 && err.response?.data?.message == "Unauthorized") {
        localStorage.removeItem('token');
        navigate('/')
      }
      if (err.status == 401 && err.response?.data?.message == "Authorization failed due to jwt expired") {
        localStorage.removeItem('token');
        navigate('/')
      }
      debugger
    })
  }

  async function newChat(user, e) {
    const token = localStorage.getItem('token');
    const userId = jwtDecode(token).id
    axios.post(`${import.meta.env.VITE_API_URL}/newchat`, { userId, friendId: user._id.toString() }, { headers: { Authorization: `Bearer ${token}` } }).then(res => {
      if (res?.data?.data) {
        handleConversationClick(e, res?.data?.data?._id?.toString(), user.name, res?.data?.data?.chatId)
      }
    }).catch(err => {
      console.log(err);
      if (err.status == 401 && err.response?.data?.message == "Unauthorized") {
        localStorage.removeItem('token');
        navigate('/')
      }
      if (err.status == 401 && err.response?.data?.message == "Authorization failed due to jwt expired") {
        localStorage.removeItem('token');
        navigate('/')
      }
      debugger
    })
  }

  function logout() {
    localStorage.removeItem('token');
    navigate('/login')
  }

  return (
    <section className="chat-section">
      <div className="chat-container">
        <aside className="chat-sidebar">
          <a href="#" className="chat-sidebar-logo">
            <i className="ri-chat-1-fill"></i>
          </a>
          <ul className="chat-sidebar-menu">
            <li className={activeTab == 'chat' ? 'active' : ''}><a href="#" onClick={() => setActiveTab('chat')} data-title="Chats"><IoChatbubbleEllipsesOutline /></a></li>
            <li className={activeTab == 'contacts' ? 'active' : ''}><a href="#" onClick={() => { setActiveTab('contacts'); getAllUsers() }} data-title="New Chat"><HiUserAdd /></a></li>
            <li className={activeTab == 'group' ? 'active' : ''}><a href="#" onClick={() => setActiveTab('group')} data-title="New Group"><MdGroupAdd /></a></li>
            <li className={`chat-sidebar-profile ${isProfileActive ? 'active' : ''}`}>
              <button type="button" className="chat-sidebar-profile-toggle" onClick={handleProfileToggle}>
                <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OXx8cGVvcGxlfGVufDB8fDB8fHww&auto=format&fit=crop&w=500&q=60" alt="" />
              </button>
              <ul className="chat-sidebar-profile-dropdown">
                <li><a href="#"><CiUser /> Profile</a></li>
                <li><a onClick={() => logout()} href="#"><IoIosLogOut /> Logout</a></li>
              </ul>
            </li>
          </ul>
        </aside>
        <div className="chat-content">
          <div className="content-sidebar">
            <div className="content-sidebar-title">Chats</div>
            <form action="" className="content-sidebar-form">
              <input type="search" className="content-sidebar-input" placeholder="Search..." />
              <button type="submit" className="content-sidebar-submit"><i className="ri-search-line"></i></button>
            </form>
            <div className="content-messages">
              <ul className="content-messages-list">

                {contacts.map((elem, idx) => {
                  return <li key={elem._id}>
                    <a href="#" data-conversation={`#${elem._id}`} onClick={(e) => {
                      if(elem.hasOwnProperty('members')){
                        handleConversationClick(e, elem._id.toString(), elem.receiver, elem._id, elem.name)
                      }else{
                        handleConversationClick(e, elem._id.toString(), elem.receiver, elem.chatId, elem.name)
                      }
                    }}>
                      <img className="content-message-image" src={AvatarImg} alt="" />
                      <span className="content-message-info">
                        <span className="content-message-name">{elem.receiver || elem.name}</span>
                        <span className="content-message-text">{elem.messages?.text || ''}</span>
                      </span>
                      <span className="content-message-more">
                        <span className="content-message-time">{elem.messages?.timestamp ? moment(elem.messages?.timestamp).format('LT') : ''}</span>
                      </span>
                    </a>
                  </li>
                })}

              </ul>
            </div>
          </div>
          <div className={`conversation conversation-default ${activeConversation === "default" ? 'active' : ''}`}>
            <i className="ri-chat-3-line"></i>
            <p>Select chat and view conversation!</p>
          </div>
          <Messages
            activeConversation={activeConversation}
            messages={userMessages}
            conversationUser={conversationUser}
            handleBackClick={handleBackClick}
            chatId={chatId}
            setMessages={setUserMessages}
            isGroup={isGroup}
            groupMessagesData={groupMessagesData}
            setGroupMessagesData={setGroupMessagesData}
          />
        </div>
      </div>
      <Modal size={'xs'} open={newChatModal} onClose={() => setNewChatModal(false)}>
        <Modal.Header>
          <Modal.Title>Contacts</Modal.Title>
        </Modal.Header>
        <Modal.Body className="list-contacts">
          <List>
            {users.map((user, idx) => (
              <List.Item className="user-contact" onClick={(e) => {
                if (user.chatId) {
                  handleConversationClick(e, user.conversationId.toString(), user.name, user.chatId)
                } else {
                  newChat(user, e)
                }
                setNewChatModal(false)
              }} key={user._id}>
                <HStack spacing={15} alignItems="center">
                  <Avatar src={`https://i.pravatar.cc/150?u=${idx + 1}`} alt={user.name} circle />
                  <HStack.Item flex={1}>
                    <HStack justifyContent="space-between">
                      <Text strong>{user.name}</Text>
                    </HStack>
                  </HStack.Item>
                </HStack>
              </List.Item>
            ))}
          </List>
        </Modal.Body>
      </Modal>
    </section>
  );
}