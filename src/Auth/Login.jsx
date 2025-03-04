import React, { useEffect, useState } from 'react';
import './Login.css';
import LOGIN_IMG from '../assets/login.JPG';
import { CiUser } from "react-icons/ci";
import { RiLockPasswordLine } from "react-icons/ri";
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

export const Login = () => {
    const navigate = useNavigate();
    const token = localStorage.getItem('token');
    const [user, setUser] = useState({
        name: '',
        password: ''
    })
    const [error, setError] = useState({
        name: '',
        password: ''
    })
    const [apiError, setApiError] = useState('')

    useEffect(() => {
        if (token) {
            navigate('/');
        }
    }, [token])

    async function handleSubmit() {
        if (!user.name) {
            setError({
                ...error,
                name: `Enter Username`
            })
        }
        if (!user.password) {
            setError({
                ...error,
                password: `Enter Password`
            })
        }
        if (error.name || error.password) {
            return
        }
        axios.post(`${import.meta.env.VITE_API_URL}/login`, user).then(res => {
            console.log(res)
            if(res?.data?.status){
                debugger
                localStorage.setItem('token',res?.data?.token)
                localStorage.setItem('profileImage',res?.data?.profileImage)
                navigate('/')
            }
        }).catch(err => {
            console.log(err);
            setApiError(err.response?.data?.message)
        })
    }

    return (
        <div className="login">
            <div className="login__content">
                <div className="login__img">
                    <img src={LOGIN_IMG} alt="" />
                </div>

                <div className="login__forms">
                    <form action="" className="login__registre" id="login-in">
                        <h1 className="login__title">Login</h1>

                        <div className="login__box">
                            <CiUser />
                            <input type="text" value={user.name} onChange={(e) => setUser({
                                ...user,
                                name: e.target.value
                            })} placeholder="Username" className="login__input" />
                        </div>
                        {error.name && <p className='error_message'>{error.name}</p>}

                        <div className="login__box">
                            <RiLockPasswordLine />
                            <input type="password" value={user.password} onChange={(e) => setUser({
                                ...user,
                                password: e.target.value
                            })} placeholder="Password" className="login__input" />
                        </div>
                        {error.password && <p className='error_message'>{error.password}</p>}
                        {apiError && <p className='error_message'>{apiError}</p>}

                        {/* <a href="#" className="login__forgot">Forgot password?</a> */}

                        <a onClick={() => handleSubmit()} className="login__button">Sign In</a>

                        <div>
                            <span className="login__account">Don't have an Account ?</span>
                            <span className="login__signin" onClick={()=>navigate('/register')} id="sign-up">Sign Up</span>
                        </div>
                    </form>

                </div>
            </div>
        </div>
    )
}
