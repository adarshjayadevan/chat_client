import React, { useState, useEffect } from "react";
import { IoChatbubbleEllipsesOutline } from "react-icons/io5";
import { IoIosLogOut,IoIosSearch  } from "react-icons/io";
import { HiUserAdd } from "react-icons/hi";
import { MdGroupAdd } from "react-icons/md";
import { CiUser } from "react-icons/ci";
import { Modal, List, HStack, Text, Avatar, Form, Button, CheckPicker, Stack, Input, Image } from 'rsuite';
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
  const [displayImage, setDisplayImage] = useState(localStorage.getItem('profileImage') || AvatarImg)

  const [newGroupModal, setNewGroupModal] = useState(false);
  const [newGroupAdded, setNewGroupAdded] = useState(null);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupId, setNewGroupId] = useState('');
  const [selectedGroupMembers, setSelectedGroupMembers] = useState([]);

  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('chat');
  const [refreshFlag, setRefreshFlag] = useState(false);
  const [groupMessagesData, setGroupMessagesData] = useState({});

  const [userProfileModal, setUserProfileModal] = useState(false);
  const [imgFile, setImgFile] = useState(null);
  const [image, setImage] = useState(localStorage.getItem('profileImage'));
  const [imgErr, setImgErr] = useState('');
  const [imageErr, setImageErr] = useState(false);

  const [ search, setSearch] = useState('')

  const [receiverImage, setReceiverImage] = useState('')

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
  }, [refreshFlag, search])

  async function getContacts() {
    const token = localStorage.getItem('token');
    const userId = jwtDecode(token).id
    axios.post(`${import.meta.env.VITE_API_URL}/chats`, { userId, search }, { headers: { Authorization: `Bearer ${token}` } }).then(res => {
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
        debugger
        setUserMessages(res?.data?.data[0].messages);
        setReceiverImage(res?.data?.data[0].receiverImage)
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
      debugger
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

  async function createGroup() {
    const token = localStorage.getItem('token');
    const userId = jwtDecode(token).id
    axios.post(`${import.meta.env.VITE_API_URL}/group`, { name: newGroupName }, { headers: { Authorization: `Bearer ${token}` } }).then(res => {
      debugger
      setNewGroupId(res?.data?.groupId)
      setNewGroupAdded(true);
      axios.post(`${import.meta.env.VITE_API_URL}/contacts`, { userId }, { headers: { Authorization: `Bearer ${token}` } }).then(res => {
        console.log(res);
        debugger
        if (res?.data?.data) {
          setUsers(res?.data?.data)
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

  async function addGroupMembers() {
    const token = localStorage.getItem('token');
    axios.post(`${import.meta.env.VITE_API_URL}/members`, { groupId: newGroupId, members: selectedGroupMembers }, { headers: { Authorization: `Bearer ${token}` } }).then(res => {
      // if (res?.data?.data) {
      //   handleConversationClick(e, res?.data?.data?._id?.toString(), user.name, res?.data?.data?.chatId)
      // }
      setRefreshFlag(prev => !prev)
      setNewGroupModal(false)
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

  function handleNewGroupClose() {
    setNewGroupModal(false)
    setRefreshFlag(prev => !prev)
  }

  async function getUserProfile() {
    setUserProfileModal(true)
  }

  async function updateProfile(){
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('image',imgFile);
    axios.put(`${import.meta.env.VITE_API_URL}/profile`, formData, { headers: { Authorization: `Bearer ${token}` } }).then(res => {
      if (res?.data?.image) {
        localStorage.setItem('profileImage',res?.data?.image);
        setDisplayImage(res?.data?.image);
        setUserProfileModal(false)
        setRefreshFlag(prev=>!prev)
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
    })
  }


  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('profileImage');
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
            <li className={activeTab == 'group' ? 'active' : ''}><a href="#" onClick={() => { setActiveTab('group'); setNewGroupModal(true) }} data-title="New Group"><MdGroupAdd /></a></li>
            <li className={`chat-sidebar-profile ${isProfileActive ? 'active' : ''}`}>
              <button type="button" className="chat-sidebar-profile-toggle" onClick={handleProfileToggle}>
                <img src={displayImage} alt="" />
              </button>
              <ul className="chat-sidebar-profile-dropdown">
                <li><a onClick={() => getUserProfile()} href="#"><CiUser /> Profile</a></li>
                <li><a onClick={() => logout()} href="#"><IoIosLogOut /> Logout</a></li>
              </ul>
            </li>
          </ul>
        </aside>
        <div className="chat-content">
          <div className="content-sidebar">
            <div className="content-sidebar-title">Messenger</div>
            <div className="content-sidebar-form">
              <input type="search" onChange={(e)=>setSearch(e.target.value)} className="content-sidebar-input" placeholder="Search..." />
              <button onClick={()=>getContacts()} className="content-sidebar-submit"><IoIosSearch /></button>
            </div>
            <div className="content-messages">
              <ul className="content-messages-list">

                {contacts.map((elem, idx) => {
                  return <li key={elem._id}>
                    <a href="#" data-conversation={`#${elem._id}`} onClick={(e) => {
                      if (elem.hasOwnProperty('members')) {
                        handleConversationClick(e, elem._id.toString(), elem.receiver, elem._id, elem.name)
                      } else {
                        handleConversationClick(e, elem._id.toString(), elem.receiver, elem.chatId, elem.name)
                      }
                    }}>
                      <img className="content-message-image" src={elem.receiverImage || elem.groupImage || AvatarImg} alt="" />
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
            receiverImage={receiverImage}
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
                  <Avatar src={user.profileImage || `https://i.pravatar.cc/150?u=${idx + 1}`} alt={user.name} circle />
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
      <Modal size={'sm'} open={newGroupModal} onClose={() => handleNewGroupClose()}>
        <Modal.Header>
          <Modal.Title>{newGroupAdded ? newGroupName : 'Create Group'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {!newGroupAdded ? (
            <Form layout="inline">
              <Stack spacing={10} alignItems="center">
                <Form.Group controlId="username-8">
                  <Form.ControlLabel>Group Name</Form.ControlLabel>
                  <Input
                    onChange={(value) => setNewGroupName(value)}
                    placeholder="Group Name"
                    style={{ width: 180 }} // Adjust width for aesthetics
                  />
                </Form.Group>
                <Button appearance="primary" onClick={() => createGroup()}>Create</Button>
              </Stack>
            </Form>
          ) : (
            <Stack spacing={10} alignItems="center">
              <Form.Group controlId="username-8">
                <Form.ControlLabel>Add Members</Form.ControlLabel>
                <CheckPicker
                  data={users.map(item => ({ label: item.name, value: item._id }))}
                  style={{ width: 224 }}
                  onChange={(e) => setSelectedGroupMembers(e)}
                />
              </Form.Group>
              <Button
                appearance="primary"
                disabled={selectedGroupMembers.length === 0}
                onClick={() => addGroupMembers()}
              >
                Add
              </Button>
            </Stack>
          )}
        </Modal.Body>

      </Modal>
      <Modal size={'xs'} open={userProfileModal} onClose={() => setUserProfileModal(false)}>
        <Modal.Header>
          <Modal.Title>{'Update Profile'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Image
              circle
              src={image}
              alt="brown french bulldog puppy lying on yellow textile"
              width={160}
            />
          </div>
          <div style={{ display: "flex", justifyContent: "center", marginLeft:'10%', marginTop: "10px" }}>
            <input type="file" onChange={(e)=>{
              if(e.target.files[0]?.type?.includes('image')){
                setImgFile(e.target.files[0])
                setImage((URL.createObjectURL(e.target.files[0])))
              }else{
                setImgErr(`Select an image file!`)
                setImageErr(true);
              }
            }}/>
          </div>
            {imageErr&&<p style={{ color:'red', display: "block", margin: " auto" }}>{imgErr}</p>}
          <Button onClick={()=>updateProfile()} style={{ display: "block", margin: "10px auto" }}>Update</Button>
        </Modal.Body>
      </Modal>
    </section>
  );
}