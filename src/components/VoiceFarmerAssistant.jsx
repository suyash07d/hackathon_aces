import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  IconVolume, 
  IconVolumeX, 
  IconAlertCircle
} from './Icons';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useTextToSpeech } from '../hooks/useTextToSpeech';
import { useApp } from '../context/useApp';

function getFormattedTime() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function createMsgId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function getWelcomeData(lang, cropName) {
  const welcomeText = lang === 'mr'
    ? `नमस्कार! मी तुमचा रेन मेकर कृषी सहाय्यक आहे. ${cropName || 'पिकां'}बाबत तुम्हाला सिंचन, रोग लक्षणे किंवा मशागतीविषयी काहीही विचारा. मी सोप्या भाषेत मार्गदर्शन करेन.`
    : lang === 'hi'
    ? `नमस्ते! मैं आपका रेन मेकर कृषि सहायक हूँ। ${cropName || 'फसल'} के बारे में सिंचाई, रोग रोकथाम या देखभाल संबंधी कोई भी सवाल पूछें।`
    : `Hello! I am your Rain Maker Crop Assistant. Ask me anything about watering, foliar signs, or safe cultural practices for your ${cropName || 'crops'}.`;

  const initialChips = lang === 'mr'
    ? ['पाणी कधी आणि कसे द्यावे?', 'रोगट पाने कशी काढावीत?', 'काय करणे टाळावे?']
    : lang === 'hi'
    ? ['सिंचाई का सही तरीका क्या है?', 'पत्तियों की छंटाई कैसे करें?', 'क्या नहीं करना चाहिए?']
    : ['How should I irrigate today?', 'What should I avoid doing?', 'Explain latest scan results'];

  return { welcomeText, initialChips };
}

export default function VoiceFarmerAssistant({ 
  currentCropId, 
  currentCropName, 
  latestScan, 
  liveWeather,
  activeLocationName
}) {
  const { language } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState(() => {
    const { welcomeText } = getWelcomeData(language, currentCropName);
    return [
      {
        id: 'msg-welcome',
        role: 'assistant',
        text: welcomeText,
        timestamp: getFormattedTime(),
      },
    ];
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [quickChips, setQuickChips] = useState(() => getWelcomeData(language, currentCropName).initialChips);

  const messagesEndRef = useRef(null);

  const handleTranscript = useCallback((text) => {
    setInputText(text);
  }, []);

  // Speech Recognition hook
  const { 
    isListening, 
    error: speechError, 
    startListening, 
    stopListening, 
    resetTranscript 
  } = useSpeechRecognition(language, handleTranscript);

  // Text-To-Speech hook
  const { speak, stop: stopSpeech, isSpeaking } = useTextToSpeech(language);

  // Auto-scroll messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Send message to server
  const handleSendMessage = async (queryToSend) => {
    const query = (queryToSend || inputText).trim();
    if (!query) return;

    // Stop active speech recognition or speech output
    if (isListening) stopListening();
    if (isSpeaking) stopSpeech();

    const userMsg = {
      id: createMsgId('user'),
      role: 'user',
      text: query,
      timestamp: getFormattedTime(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    resetTranscript();
    setIsProcessing(true);

    try {
      const response = await fetch('/api/farmer-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          conversationHistory: messages.slice(-4),
          cropContext: {
            cropId: currentCropId,
            cropName: currentCropName,
            latestScan,
            weather: liveWeather ? {
              temp: liveWeather.current?.temperature_2m ?? liveWeather.temperature,
              humidity: liveWeather.current?.relative_humidity_2m ?? liveWeather.relativeHumidity,
              rain: liveWeather.current?.precipitation ?? liveWeather.precipitation,
              locationName: activeLocationName,
            } : null,
          },
          language,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const replyText = data.reply || 'Your inquiry was recorded.';
        const assistantMsg = {
          id: createMsgId('asst'),
          role: 'assistant',
          text: replyText,
          timestamp: getFormattedTime(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
        if (Array.isArray(data.quickChips) && data.quickChips.length > 0) {
          setQuickChips(data.quickChips);
        }
        // Auto-read response if speech was used
        speak(replyText);
      } else {
        throw new Error('Assistant API returned an error');
      }
    } catch {
      const errorMsg = {
        id: createMsgId('err'),
        role: 'assistant',
        text: language === 'mr'
          ? 'माफ करा, संपर्क साधण्यात अडचण आली. कृपया पुन्हा प्रयत्न करा किंवा थेट 1800-180-1551 वर कॉल करा.'
          : language === 'hi'
          ? 'क्षमा करें, संपर्क में समस्या आई। कृपया पुनः प्रयास करें या सीधे 1800-180-1551 पर कॉल करें।'
          : 'Could not connect to assistant. Please try again or call the Kisan Call Centre at 1800-180-1551.',
        timestamp: getFormattedTime(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMicClick = () => {
    if (isListening) {
      stopListening();
    } else {
      if (isSpeaking) stopSpeech();
      startListening();
    }
  };

  return (
    <div className="voice-assistant-root">
      {/* Floating Launcher Button */}
      {!isOpen && (
        <button
          type="button"
          className="btn-voice-assistant-launcher"
          onClick={() => setIsOpen(true)}
          title="Open Voice Farmer Assistant"
          aria-label="Open Voice Farmer Assistant"
        >
          <div className="vfa-launcher-icon">
            <span className="vfa-mic-emoji">🎙️</span>
            <span className="vfa-pulse-ring"></span>
          </div>
          <span className="vfa-launcher-label">
            {language === 'mr' ? 'कृषी सहाय्यक' : language === 'hi' ? 'किसान सहायक' : 'Voice Assistant'}
          </span>
        </button>
      )}

      {/* Expanded Assistant Card */}
      {isOpen && (
        <div className="voice-assistant-card reveal-smooth" role="dialog" aria-modal="true">
          {/* Card Header */}
          <div className="vfa-header">
            <div className="vfa-header-left">
              <span className="vfa-avatar">🌱</span>
              <div>
                <strong className="vfa-title">
                  {language === 'mr' ? 'रेन मेकर कृषी सहाय्यक' : language === 'hi' ? 'रेन मेकर किसान सहायक' : 'Rain Maker Voice Assistant'}
                </strong>
                <span className="vfa-status-sub">
                  ● {language.toUpperCase()} • {currentCropName || 'Crop'} ({activeLocationName || 'Farm'})
                </span>
              </div>
            </div>
            <button
              type="button"
              className="vfa-close-btn"
              onClick={() => {
                if (isListening) stopListening();
                if (isSpeaking) stopSpeech();
                setIsOpen(false);
              }}
              title="Close Assistant"
            >
              ✕
            </button>
          </div>

          {/* Context Reminder Strip */}
          <div className="vfa-context-bar">
            <span>🌾 {currentCropName || 'Active Crop'}</span>
            {liveWeather && (
              <span>
                💧 {liveWeather.current?.relative_humidity_2m ?? liveWeather.relativeHumidity ?? 70}% RH
              </span>
            )}
            {latestScan?.topCandidate && (
              <span className="vfa-scan-pill">
                🔬 {latestScan.topCandidate}
              </span>
            )}
          </div>

          {/* Messages Scroll Area */}
          <div className="vfa-messages-container">
            {messages.map((msg) => (
              <div key={msg.id} className={`vfa-msg-bubble ${msg.role === 'user' ? 'vfa-msg-user' : 'vfa-msg-asst'}`}>
                <div className="vfa-msg-text">{msg.text}</div>
                <div className="vfa-msg-meta">
                  <span className="vfa-msg-time">{msg.timestamp}</span>
                  {msg.role === 'assistant' && (
                    <button
                      type="button"
                      className="btn-read-bubble"
                      onClick={() => (isSpeaking ? stopSpeech() : speak(msg.text))}
                      title="Read Aloud"
                    >
                      {isSpeaking ? <IconVolumeX size={13} /> : <IconVolume size={13} />}
                    </button>
                  )}
                </div>
              </div>
            ))}
            {isProcessing && (
              <div className="vfa-typing-indicator">
                <span className="dot"></span>
                <span className="dot"></span>
                <span className="dot"></span>
                <span className="typing-text">Analyzing agronomic guidance...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestion Chips */}
          {quickChips.length > 0 && !isProcessing && (
            <div className="vfa-chips-strip">
              {quickChips.map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="vfa-chip-btn"
                  onClick={() => handleSendMessage(chip)}
                >
                  {chip}
                </button>
              ))}
            </div>
          )}

          {/* Speech Status / Error Banner */}
          {isListening && (
            <div className="vfa-listening-banner">
              <span className="pulse-mic">🎙️</span>
              <span>Listening... Speak in {language === 'mr' ? 'Marathi' : language === 'hi' ? 'Hindi' : 'English'}</span>
              <button type="button" className="btn-stop-mic" onClick={stopListening}>Done</button>
            </div>
          )}
          {speechError && (
            <div className="vfa-error-banner">
              <IconAlertCircle size={14} />
              <span>{speechError}</span>
            </div>
          )}

          {/* Input & Mic Controls */}
          <div className="vfa-input-row">
            <button
              type="button"
              className={`btn-vfa-mic ${isListening ? 'mic-listening-active' : ''}`}
              onClick={handleMicClick}
              title={isListening ? 'Stop Listening' : 'Speak to Assistant'}
              aria-label="Microphone"
            >
              🎙️
            </button>

            <input
              type="text"
              className="vfa-input-field"
              placeholder={isListening ? 'Transcribing your voice...' : 'Type or speak your question...'}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSendMessage();
              }}
            />

            <button
              type="button"
              className="btn-vfa-send"
              onClick={() => handleSendMessage()}
              disabled={isProcessing || !inputText.trim()}
              title="Send"
            >
              ➤
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
