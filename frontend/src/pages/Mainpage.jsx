import React, { useRef, useEffect } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import Register from './Register';
import './styles/Mainpage.css';

export default function Mainpage() {
    const panelRef = useRef(null);
    const subpanelRef = useRef(null);

    useEffect(() => {
        const myPanel = panelRef.current;
        const subpanel = subpanelRef.current;
        if (!myPanel || !subpanel) return;

        let transformAmount = 5;

        function transformPanel(e) {
            const rect = myPanel.getBoundingClientRect();
            const mouseX = e.clientX;
            const mouseY = e.clientY;

            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;

            const percentX = (mouseX - centerX) / (rect.width / 2);
            const percentY = -((mouseY - centerY) / (rect.height / 2));

            subpanel.style.transform =
                `perspective(400px) rotateY(${percentX * transformAmount}deg) rotateX(${percentY * transformAmount}deg)`;
        }

        function handleMouseEnter() {
            subpanel.style.transition = 'transform 0.08s';
            window.setTimeout(() => { subpanel.style.transition = ''; }, 120);
        }

        function handleMouseLeave() {
            subpanel.style.transition = 'transform 0.6s 1s';
            subpanel.style.transform = 'perspective(400px) rotateY(0deg) rotateX(0deg)';
            const t = window.setTimeout(() => { subpanel.style.transition = ''; }, 700);
        }

        myPanel.addEventListener('mousemove', transformPanel);
        myPanel.addEventListener('mouseenter', handleMouseEnter);
        myPanel.addEventListener('mouseleave', handleMouseLeave);

        return () => {
            myPanel.removeEventListener('mousemove', transformPanel);
            myPanel.removeEventListener('mouseenter', handleMouseEnter);
            myPanel.removeEventListener('mouseleave', handleMouseLeave);
        };
    }, []);

    return (
        <>
            <div className='card-main'>
                <div className="inner-card">
                    <h2>Fast And Simple <span style={{color: '#6247aa'}}>Digital Payment</span> Solution</h2>
                    <p>Designed for simplicity, built for speed. Make payments in seconds with an intuitive interface that works exactly the way you expect.</p>
                    <Link className="hoverable start-button" to="/register">
                        <button className='start-button'>Get Started</button>
                    </Link>
                </div>

                <div id="container">
                    <div id="panel" ref={panelRef}>
                        <div id="panel-container" ref={subpanelRef}>
                            <div className="glow"></div>
                            <div className="panel-content">
                                <div className="card-brand"></div>

                                <div className="card-chip" />

                                <div className="card-number">
                                    1234  ••••  ••••  5678
                                </div>

                                <div className="card-row">
                                    <div className="card-label">Developed By</div>
                                    <div className="card-label">Completed On</div>
                                </div>

                                <div className="card-row">
                                    <div className="card-value">Abbey Mathew</div>
                                    <div className="card-value">11/25</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Routes>
                <Route path='/register' element={<Register />} />
            </Routes>
        </>
    );
}
