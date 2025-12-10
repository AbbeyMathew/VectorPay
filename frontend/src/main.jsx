import React from 'react'; 
import {gsap} from 'gsap';
import { createRoot } from 'react-dom/client'; 
import { BrowserRouter } from 'react-router-dom'; 
import App from './App'; import './index.css'; 

createRoot(document.getElementById('root')).render(<BrowserRouter> <App/> </BrowserRouter>);




const $bigBall = document.querySelector('.cursor__ball--big');
const $smallBall = document.querySelector('.cursor__ball--small');
const $hoverables = document.querySelectorAll('.hoverable');

document.body.addEventListener('mousemove', onMouseMove);

for (let i = 0; i < $hoverables.length; i++) {
    $hoverables[i].addEventListener('mouseenter', onMouseHover);
    $hoverables[i].addEventListener('mouseleave', onMouseHoverOut);
}

function onMouseMove(e) {
    const bigX = e.clientX - 15;
    const bigY = e.clientY - 8;
    const smallX = e.clientX - 5;
    const smallY = e.clientY - 5;

    gsap.to($bigBall, { duration: 0.4, x: bigX, y: bigY, ease: "power2.out" });
    gsap.to($smallBall, { duration: 0.08, x: smallX, y: smallY, ease: "power1.out" });
}

function onMouseHover() {
    gsap.to($bigBall, { duration: 0.3, scale: 4, ease: "power2.out" });
}
function onMouseHoverOut() {
    gsap.to($bigBall, { duration: 0.3, scale: 1, ease: "power2.out" });
}