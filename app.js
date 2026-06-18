// Firebase v9 모듈 가져오기 (CDN 방식)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getDatabase, ref, push, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// 💡 학생분의 Firebase 프로젝트 설정이 적용되었습니다!
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

// 제공해주신 Google Apps Script 배포 URL
const GAS_URL = "https://script.google.com/macros/s/AKfycbyaOgzeur9oHxEH-z_YO7P8olVGRC-93drN2tSQWVojP0xxQ7PcgMJ768z68lJLHFSNNg/exec";

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

// 로그인 상태 감지 (로그인 성공 시 화면 전환 및 데이터 로드)
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        authSection.style.display = 'none';
        mainSection.style.display = 'block';
        document.getElementById('user-email').innerText = user.email;
        loadWorkoutLogs(); // 로그인 성공 시 기록 불러오기
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

    // 유저 고유 ID(uid)별로 폴더를 만들어 운동 일지를 분리 저장합니다.
    const userLogRef = ref(db, 'workouts/' + currentUser.uid);
    push(userLogRef, { date: date, text: text })
        .then(() => {
            document.getElementById('log-text').value = "";
            alert("기록 완료!");
        });
});

function loadWorkoutLogs() {
    const userLogRef = ref(db, 'workouts/' + currentUser.uid);
    onValue(userLogRef, (snapshot) => {
        const logList = document.getElementById('log-list');
        logList.innerHTML = "";
        snapshot.forEach((childSnapshot) => {
            const data = childSnapshot.val();
            const li = document.createElement('li');
            li.innerHTML = `<strong>${data.date}</strong> <span>${data.text}</span>`;
            logList.appendChild(li);
        });
    });
}

// ----------------------------------------------------
// 3. AI 연동 및 TTS 기능 (Google Apps Script API)
// ----------------------------------------------------
const chatBox = document.getElementById('chat-box');
const aiInput = document.getElementById('ai-input');
const askBtn = document.getElementById('ask-btn');
const ttsBtn = document.getElementById('tts-btn');

askBtn.addEventListener('click', async () => {
    const question = aiInput.value;
    if (!question) return;

    // 사용자 메시지 화면에 표시
    chatBox.innerHTML += `<p class="user-msg">${question}</p>`;
    aiInput.value = "";
    chatBox.innerHTML += `<p class="ai-msg" id="loading-msg">AI 트레이너가 생각 중입니다...</p>`;
    chatBox.scrollTop = chatBox.scrollHeight;

    try {
        // 학생이 작성한 GAS로 POST 요청 보내기 (Chat)
        const response = await fetch(GAS_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ type: "chat", question: question })
        });
        
        const data = await response.json();
        document.getElementById('loading-msg').remove();
        
        if (data.answer) {
            lastAiResponse = data.answer; // TTS에 전달하기 위해 변수에 저장
            chatBox.innerHTML += `<p class="ai-msg">🤖: ${data.answer}</p>`;
        } else {
            chatBox.innerHTML += `<p class="ai-msg">오류: ${data.error}</p>`;
        }
    } catch (error) {
        document.getElementById('loading-msg').remove();
        chatBox.innerHTML += `<p class="ai-msg">통신 오류가 발생했습니다.</p>`;
    }
    chatBox.scrollTop = chatBox.scrollHeight;
});

// TTS 버튼 클릭 시 음성 재생
ttsBtn.addEventListener('click', async () => {
    if (!lastAiResponse) return alert("읽어줄 AI의 답변이 없습니다.");
    
    const originalText = ttsBtn.innerText;
    ttsBtn.innerText = "음성 생성 중...⏳";
    ttsBtn.disabled = true;

    try {
        // 학생이 작성한 GAS로 POST 요청 보내기 (TTS)
        const response = await fetch(GAS_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ type: "tts", text: lastAiResponse })
        });
        
        const data = await response.json();
        
        if (data.audioBase64) {
            // 인코딩된 Base64 데이터를 오디오로 변환하여 재생
            const audioUrl = "data:audio/mp3;base64," + data.audioBase64;
            const audio = new Audio(audioUrl);
            audio.play();
        } else {
            alert("TTS 변환 오류: " + data.error);
        }
    } catch (error) {
        alert("통신 오류가 발생했습니다.");
    } finally {
        ttsBtn.innerText = originalText;
        ttsBtn.disabled = false;
    }
});
