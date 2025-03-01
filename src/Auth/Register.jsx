import React, { useEffect, useState } from 'react';
import './Login.css';
import LOGIN_IMG from '../assets/login.JPG';
import { CiUser } from "react-icons/ci";
import { RiLockPasswordLine } from "react-icons/ri";
import { FaMobileRetro } from "react-icons/fa6";
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export const Register = () => {
    const navigate = useNavigate();
    const token = localStorage.getItem('token');
    const [user, setUser] = useState({
        name: '',
        password: '',
        mobile:''
    })
    const [error, setError] = useState({
        name: '',
        password: '',
        mobile:''
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
        if (!user.mobile) {
            setError({
                ...error,
                mobile: `Enter Mobile Number`
            })
        }
        if (error.name || error.password || error.mobile) {
            return
        }
        axios.post(`${import.meta.env.VITE_API_URL}/register`, user).then(res => {
            console.log(res)
            if(res?.data?.status){
                navigate('/login')
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
                        <h1 className="login__title">Create Account</h1>

                        <div className="login__box">
                            <CiUser />
                            <input type="text" value={user.name} onChange={(e) => setUser({
                                ...user,
                                name: e.target.value
                            })} placeholder="Username" className="login__input" />
                        </div>
                        {error.name && <p className='error_message'>{error.name}</p>}
                        <div className="login__box">
                            <FaMobileRetro />
                            <input type="text" value={user.mobile} onChange={(e) => setUser({
                                ...user,
                                mobile: e.target.value
                            })} placeholder="Mobile Number" className="login__input" />
                        </div>
                        {error.password && <p className='error_message'>{error.password}</p>}    
                        <div className="login__box">
                            <RiLockPasswordLine />
                            <input type="password" value={user.password} onChange={(e) => setUser({
                                ...user,
                                password: e.target.value
                            })} placeholder="Password" className="login__input" />
                        </div>
                        {error.password && <p className='error_message'>{error.password}</p>}
                        {apiError && <p className='error_message'>{apiError}</p>}

                        <a onClick={() => handleSubmit()} className="login__button">Register</a>

                        <div>
                            <span className="login__account">Already have an account ?</span>
                            <span className="login__signin" onClick={()=>navigate('/login')} id="sign-up">Login</span>
                        </div>
                    </form>

                </div>
            </div>
        </div>
    )
}
