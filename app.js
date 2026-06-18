// Firebase v9 모듈 가져오기 (CDN 방식)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getDatabase, ref, push, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// 학생분의 Firebase 프로젝트 설정
const firebaseConfig = {
  apiKey: "AIzaSyBw899OfLP_yv167gAXRs03pY718S9at-o",
  authDomain: "qotmdals.firebaseapp.com",
  databaseURL: "https://qotmdals-default-rtdb.firebaseio.com",
  projectId: "qotmdals",
  storageBucket: "qotmdals.firebasestorage.app",
  messagingSenderId: "808542366841",
  appId: "1:808542366841:web:a8e8696798358e6728b8a8",
  measurementId: "G-BHM51QW9YM"
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// 💡 새로 발급받으신 Google Apps Script 배포 URL이 적용되었습니다!
const GAS_URL = "https://script.google.com/macros/s/AKfycbxmr4b5dqU7DReNmx0Lt5KkNA4Z1OkcPtRMpGPdFgpkvZ1mdIp8ybifHkgAx35C2L6J/exec";

// DOM 요소 가져오기
const authSection = document.getElementById('auth-section');
const mainSection = document.getElementById('main-section');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const authMsg = document.getElementById('auth-msg');

let currentUser = null;
let lastAiResponse = ""; // TTS에 사용할 마지막 답변 저장용

// ----------------------------------------------------
// 1. Firebase Authentication (로그인/회원가입)
// ----------------------------------------------------
document.getElementById('signup-btn').addEventListener('click', () => {
    createUserWithEmailAndPassword(auth, emailInput.value, passwordInput.value)
        .then(() => alert("회원가입 성공!"))
        .catch(error => authMsg.innerText = "오류: " + error.message);
});

document.getElementById('login-btn').addEventListener('click', () => {
    signInWithEmailAndPassword(auth, emailInput.value, passwordInput.value)
        .catch(error => authMsg.innerText = "오류: " + error.message);
});

document.getElementById('logout-btn').addEventListener('click', () => signOut(auth));

// 로그인 상태 감지
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        authSection.style.display = 'none';
        mainSection.style.display = 'block';
        document.getElementById('user-email').innerText = user.email;
        loadWorkoutLogs();
    } else {
        currentUser = null;
        authSection.style.display = 'block';
        mainSection.style.display = 'none';
    }
});

// ----------------------------------------------------
// 2. Firebase Database 연동 (운동 기록장)
// ----------------------------------------------------
document.getElementById('save-log-btn').addEventListener('click', () => {
    const date = document.getElementById('log-date').value;
    const text = document.getElementById('log-text').value;

    if (!date || !text) return alert("날짜와 운동 내용을 모두 입력하세요!");

    const userLogRef = ref(db, 'workouts/' + currentUser.uid);
    push(userLogRef, { date: date, text: text })
        .then(() => {
            document.getElementById('log-text').value = "";
            alert("기록 완료!");
        });
});

function loadWorkoutLogs() {
    const userLogRef = ref(db, 'workouts/' + currentUser.uid);
    onValue(userLogRef
