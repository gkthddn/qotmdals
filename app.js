// ----------------------------------------------------
// 3. AI 연동 및 TTS 기능 (수정본)
// ----------------------------------------------------
const chatBox = document.getElementById('chat-box');
const aiInput = document.getElementById('ai-input');
const askBtn = document.getElementById('ask-btn');
const ttsBtn = document.getElementById('tts-btn');

askBtn.addEventListener('click', async () => {
    const question = aiInput.value;
    if (!question) return;

    chatBox.innerHTML += `<p class="user-msg">${question}</p>`;
    aiInput.value = "";
    chatBox.innerHTML += `<p class="ai-msg" id="loading-msg">AI 트레이너가 생각 중입니다...</p>`;
    chatBox.scrollTop = chatBox.scrollHeight;

    try {
        const response = await fetch(GAS_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ question: question }) // type: "chat"은 이제 필요 없습니다.
        });
        
        const data = await response.json();
        document.getElementById('loading-msg').remove();
        
        if (data.answer) {
            lastAiResponse = data.answer; // TTS에 사용할 답변 저장
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

// 브라우저 내장 TTS(Web Speech API) 기능으로 변경하여 API 키 없이 구현 완료!
ttsBtn.addEventListener('click', () => {
    if (!lastAiResponse) return alert("읽어줄 AI의 답변이 없습니다.");
    
    // 현재 브라우저가 다른 말을 하고 있다면 멈추기
    window.speechSynthesis.cancel();

    // 텍스트를 읽기 위한 객체 생성
    const utterance = new SpeechSynthesisUtterance(lastAiResponse);
    utterance.lang = 'ko-KR'; // 한국어 설정
    utterance.rate = 1.0;     // 말하는 속도 (1.0이 보통)

    ttsBtn.innerText = "음성 재생 중...🔊";
    ttsBtn.disabled = true;

    // 말하기가 끝났을 때 버튼 복구
    utterance.onend = () => {
        ttsBtn.innerText = "🔊 마지막 AI 답변 듣기";
        ttsBtn.disabled = false;
    };

    // 오류 발생 시 버튼 복구
    utterance.onerror = () => {
        ttsBtn.innerText = "🔊 마지막 AI 답변 듣기";
        ttsBtn.disabled = false;
    };

    // 브라우저에게 말하기 명령
    window.speechSynthesis.speak(utterance);
});
