// Firebase SDK 모듈 가져오기
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, collection, addDoc, query, where, orderBy, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// 1. Firebase 환경 설정 (본인의 Firebase 프로젝트 설정 값으로 교체하세요)
const firebaseConfig = {
    apiKey: "AIzaSyC2x8DVRy47J3jKeLwz8sjNni0-dWsVJcQEY",
    authDomain: "sport-95ece.firebaseapp.com",
    projectId: "sport-95ece",
    storageBucket: "sport-95ece.firebasestorage.app",
    messagingSenderId: "737592792201",
    appId: "1:737592792201:web:95ce1f7838b6421ad72258"
};

// 생성형 AI (Gemini) API 키 설정
const GEMINI_API_KEY = "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"; 

// Firebase 초기화
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// DOM 요소 선택
const btnLogin = document.getElementById("btn-login");
const btnLogout = document.getElementById("btn-logout");
const guestView = document.getElementById("guest-view");
const userView = document.getElementById("user-view");
const userName = document.getElementById("user-name");
const userInput = document.getElementById("user-input");
const btnAsk = document.getElementById("btn-ask");
const resultContainer = document.getElementById("result-container");
const aiResponse = document.getElementById("ai-response");
const btnSpeak = document.getElementById("btn-speak");
const historyList = document.getElementById("history-list");

let currentUser = null;
let currentAiText = ""; // TTS용 텍스트 저장 변수

// 2. Firebase Authentication (로그인 상태 감지)
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        userName.innerText = user.displayName;
        guestView.classList.add("hidden");
        btnLogin.classList.add("hidden");
        userView.classList.remove("hidden");
        btnLogout.classList.remove("hidden");
        loadHistory(user.uid); // 로그인 시 이전 기록 불러오기
    } else {
        currentUser = null;
        guestView.classList.remove("hidden");
        btnLogin.classList.remove("hidden");
        userView.classList.add("hidden");
        btnLogout.classList.add("hidden");
    }
});

// 로그인 / 로그아웃 이벤트
btnLogin.addEventListener("click", () => signInWithPopup(auth, provider));
btnLogout.addEventListener("click", () => signOut(auth));

// 3. API 생성형 인공지능 연동 (Gemini API 사용 예시)
async function askAiCoach(prompt) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;
    
    // 체육 전문가 정체성을 부여하기 위한 프롬프트 엔지니어링
    const systemPrompt = `너는 전문 스포츠 트레이너이자 정신력 코치야. 다음 사용자의 체육/운동 관련 질문에 대해 전문적이고 활기찬 톤으로 조언과 루틴을 제안해줘:\n\n${prompt}`;

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: systemPrompt }] }]
            })
        });
        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
    } catch (error) {
        console.error("AI 호출 에러:", error);
        return "AI 코치와 연결이 원활하지 않습니다. 다시 시도해주세요.";
    }
}

// 진단받기 버튼 클릭 이벤트
btnAsk.addEventListener("click", async () => {
    const text = userInput.value.trim();
    if (!text) return alert("내용을 입력해주세요!");

    btnAsk.innerText = "코칭 분석 중...";
    btnAsk.disabled = true;

    // AI 응답 받기
    const reply = await askAiCoach(text);
    currentAiText = reply;
    aiResponse.innerText = reply;
    resultContainer.classList.remove("hidden");

    btnAsk.innerText = "AI 코치에게 진단받기";
    btnAsk.disabled = false;

    // 4. Firebase Firestore 데이터 연동 (결과 저장)
    try {
        await addDoc(collection(db, "coaching_logs"), {
            uid: currentUser.uid,
            question: text,
            answer: reply,
            timestamp: new Date()
        });
        loadHistory(currentUser.uid); // 목록 새로고침
    } catch (e) {
        console.error("데이터 저장 실패:", e);
    }
});

// 5. Firebase 데이터 연동 (과거 기록 불러오기)
async function loadHistory(uid) {
    historyList.innerHTML = "";
    const q = query(collection(db, "coaching_logs"), where("uid", "==", uid), orderBy("timestamp", "desc"));
    
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => {
        const data = doc.data();
        const li = document.createElement("li");
        li.innerHTML = `<strong>질문:</strong> ${data.question} <br> <strong>코치 처방:</strong> ${data.answer.substring(0, 50)}...`;
        historyList.appendChild(li);
    });
}

// 6. TTS (Web Speech API 활용 음성 출력 기능)
btnSpeak.addEventListener("click", () => {
    if (!currentAiText) return;
    
    // 브라우저 내장 TTS 기능 사용 (따로 API 키 필요 없음)
    const speech = new SpeechSynthesisUtterance(currentAiText);
    speech.lang = "ko-KR"; // 한국어 설정
    speech.pitch = 1;      // 음높이
    speech.rate = 1.1;     // 속도 (약간 빠르게 살짝 활기찬 느낌)
    
    // 기존에 나오고 있는 음성이 있다면 취소하고 새로 시작
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(speech);
});
