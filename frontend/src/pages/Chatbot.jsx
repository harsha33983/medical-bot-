import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, MicOff, Send, LogOut, Home, PlusCircle, Trash2, User, ChevronRight, Activity, Calendar, UserCircle2, Settings, Info, CheckCircle2, Paperclip } from 'lucide-react';
import api from '../services/api';

const THRESHOLD = 10;

function Chatbot() {
  const navigate = useNavigate();

  const [stage, setStage] = useState(() => localStorage.getItem('chat_stage') || 'PERSONAL_INFO');
  const [personalInfo, setPersonalInfo] = useState(() => {
    const saved = localStorage.getItem('chat_personalInfo');
    return saved ? JSON.parse(saved) : { name: '', age: '', gender: '' };
  });
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem('chat_messages');
    return saved ? JSON.parse(saved) : [];
  });
  const [symptomList, setSymptomList] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSymptoms, setSelectedSymptoms] = useState(() => {
    const saved = localStorage.getItem('chat_selectedSymptoms');
    return saved ? JSON.parse(saved) : [];
  });
  const [filteredSymptoms, setFilteredSymptoms] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const [liveChatMessage, setLiveChatMessage] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
    } else {
      fetchSymptoms();
    }
  }, [navigate]);

  useEffect(() => {
    localStorage.setItem('chat_stage', stage);
    localStorage.setItem('chat_personalInfo', JSON.stringify(personalInfo));
    localStorage.setItem('chat_messages', JSON.stringify(messages));
    localStorage.setItem('chat_selectedSymptoms', JSON.stringify(selectedSymptoms));
  }, [stage, personalInfo, messages, selectedSymptoms]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, stage]);

  const fetchSymptoms = async () => {
    try {
      const response = await api.get('/symptoms');
      setSymptomList(response.data.symptoms);
    } catch (error) {
      console.error('Failed to load symptoms', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const playTTS = async (text) => {
    try {
      const res = await api.post('/tts', { text });
      const audioUrl = `http://localhost:8000${res.data.audio_url}`;
      const audio = new Audio(audioUrl);
      audio.play();
    } catch (err) {
      console.error("TTS failed via backend pyttsx3", err);
      const utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);
    }
  };

  const addMessage = (sender, text, extra = null) => {
    setMessages(prev => [...prev, { id: Date.now() + Math.random(), sender, text, timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), ...extra }]);
  };

  // ----- FLOW HANDLERS -----

  const handlePersonalInfoSubmit = (e) => {
    e.preventDefault();
    setStage('INITIATE_CHAT');
  };

  const handleInitiateChat = () => {
    setMessages([]);
    setStage('ASSESSMENT');
    const welcomeMsg = "Welcome to the Medical Chatbot!";
    addMessage('bot', welcomeMsg);
    playTTS(welcomeMsg);
    
    setTimeout(() => {
      const assessMsg = "Assessment of Infection: Are you experiencing any symptoms of infection or feeling unwell?";
      addMessage('bot', assessMsg, { type: 'assessment_prompt' });
      playTTS(assessMsg);
    }, 1000);
  };

  const handleAssessmentResponse = (response) => {
    addMessage('user', response);
    if (response === 'NO') {
      const msg = "Thank you for contacting us. Have a healthy day!";
      addMessage('bot', msg, { type: 'end_chat' });
      playTTS(msg);
    } else {
      setStage('QUESTIONNAIRE');
      const msg = "Please complete the Symptomatic Questionnaire by searching and adding your symptoms below.";
      addMessage('bot', msg);
      playTTS(msg);
    }
  };

  // ----- QUESTIONNAIRE LOGIC -----

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (value.trim() === '') {
      setFilteredSymptoms([]);
    } else {
      const filtered = symptomList.filter(s => 
        s.replace(/_/g, ' ').toLowerCase().includes(value.toLowerCase()) && 
        !selectedSymptoms.includes(s)
      );
      setFilteredSymptoms(filtered.slice(0, 10));
    }
  };

  const addSymptom = (symptom) => {
    if (!selectedSymptoms.includes(symptom)) {
      setSelectedSymptoms([...selectedSymptoms, symptom]);
    }
    setSearchTerm('');
    setFilteredSymptoms([]);
  };

  const removeSymptom = (symptom) => {
    setSelectedSymptoms(selectedSymptoms.filter(s => s !== symptom));
  };

  const startVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Your browser doesn't support speech recognition.");
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsListening(true);
    
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript.toLowerCase();
      const newSymptoms = [];
      symptomList.forEach(sym => {
        const cleanSym = sym.replace(/_/g, ' ');
        if (transcript.includes(cleanSym) && !selectedSymptoms.includes(sym)) {
          newSymptoms.push(sym);
        }
      });
      if (newSymptoms.length > 0) {
        setSelectedSymptoms(prev => [...new Set([...prev, ...newSymptoms])]);
      } else {
        alert("Could not identify specific symptoms from: '" + transcript + "'");
      }
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  const handleSubmitSymptoms = async () => {
    if (selectedSymptoms.length === 0) return;

    addMessage('user', `My symptoms are: ${selectedSymptoms.map(s => s.replace(/_/g, ' ')).join(', ')}`);
    setLoading(true);

    try {
      const response = await api.post('/predict', { symptoms: selectedSymptoms });
      const { prediction, prediction_svc, prediction_dt, description, precautions, severity } = response.data;
      
      let totalSeverity = 0;
      if (severity && severity.length > 0) {
        totalSeverity = severity.reduce((acc, curr) => acc + (curr.severity || 0), 0);
      }

      if (totalSeverity >= THRESHOLD) {
        setStage('RESULT_HIGH');
        const doctorMsg = "High severity detected. Requests doctor to come to action. Please seek immediate professional medical care.";
        addMessage('bot', doctorMsg, { type: 'end_chat_urgent', predictionDetails: { prediction, prediction_svc, prediction_dt, description, severityScore: totalSeverity } });
        playTTS("High severity detected. Please seek immediate professional medical care.");
      } else {
        setStage('RESULT_LOW');
        const predictionMsg = `Based on your symptoms, the model predicts you might have: ${prediction}.`;
        const preventMsg = `Description of Preventive Measure:\n${precautions.map(p => "• " + p).join('\n')}`;
        
        addMessage('bot', predictionMsg, {
          predictionDetails: { prediction, prediction_svc, prediction_dt, description, precautions, severityScore: totalSeverity }
        });
        addMessage('bot', preventMsg, { type: 'faq_prompt' });
        playTTS(`The model predicts ${prediction}. Please read the description of preventive measures.`);
      }
      setSelectedSymptoms([]);
    } catch (error) {
      addMessage('bot', error.response?.data?.detail || "Error processing symptoms.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendLiveChatMessage = () => {
    if (liveChatMessage.trim() === '') return;
    addMessage('user', liveChatMessage);
    setLiveChatMessage('');
    
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      addMessage('bot', "Thank you for your message. A representative is reviewing your case and will respond shortly. (Mock Agent Reply)");
    }, 1500);
  };

  const handleResetChat = () => {
    localStorage.removeItem('chat_stage');
    localStorage.removeItem('chat_personalInfo');
    localStorage.removeItem('chat_messages');
    localStorage.removeItem('chat_selectedSymptoms');
    setStage('PERSONAL_INFO');
    setPersonalInfo({ name: '', age: '', gender: '' });
    setMessages([]);
    setSelectedSymptoms([]);
  };

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <div className="sidebar">
        <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 700, fontSize: '1.2rem', padding: '0 1rem'}}>
          <div className="brand-logo" style={{padding: '0.4rem'}}>
            <Activity size={20} />
          </div>
          AI Health<br/>Assistant
        </div>
        
        <div className="sidebar-nav">
          <button className="sidebar-btn" onClick={() => navigate('/home')}>
            <Home size={18} /> <span>Main Menu</span>
          </button>
          <button className={`sidebar-btn ${stage === 'PERSONAL_INFO' ? 'active' : ''}`} onClick={handleResetChat}>
            <PlusCircle size={18} /> <span>New Consultation</span>
          </button>
        </div>
        
        <button className="sidebar-btn" style={{marginTop: 'auto'}} onClick={handleLogout}>
          <LogOut size={18} /> <span>Logout</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="main-content">
        
        {/* Topbar */}
        <div className="chat-topbar">
          <div className="chat-topbar-info">
            <Info size={16} className="text-primary" />
            This tool provides educational information based on machine-learning predictions and is not a medical diagnosis.
          </div>
          <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
            Threshold configured at {THRESHOLD}. <Settings size={14} />
          </div>
        </div>

        {/* PERSONAL INFO SCREEN */}
        {stage === 'PERSONAL_INFO' && (
          <div className="personal-info-container">
            <div className="profile-icon-large">
              <User size={32} />
            </div>
            <h2 style={{marginBottom: '0.5rem'}}>Personal Information</h2>
            <p className="text-muted" style={{marginBottom: '2rem', fontSize: '0.95rem'}}>Please provide your personal information to start the consultation.</p>
            
            <form onSubmit={handlePersonalInfoSubmit} style={{width: '100%', maxWidth: '400px'}}>
              <div className="form-group">
                <label>Full Name</label>
                <div className="input-with-icon">
                  <User size={18} className="left-icon" />
                  <input type="text" placeholder="Enter your full name" required value={personalInfo.name} onChange={e => setPersonalInfo({...personalInfo, name: e.target.value})} />
                </div>
              </div>
              
              <div className="form-group">
                <label>Age</label>
                <div className="input-with-icon">
                  <Calendar size={18} className="left-icon" />
                  <input type="number" placeholder="Enter your age" required value={personalInfo.age} onChange={e => setPersonalInfo({...personalInfo, age: e.target.value})} />
                </div>
              </div>
              
              <div className="form-group" style={{marginBottom: '2rem'}}>
                <label>Gender</label>
                <div className="gender-selector">
                  <div className={`gender-btn ${personalInfo.gender === 'male' ? 'selected' : ''}`} onClick={() => setPersonalInfo({...personalInfo, gender: 'male'})}>
                    ♂ Male
                  </div>
                  <div className={`gender-btn ${personalInfo.gender === 'female' ? 'selected' : ''}`} onClick={() => setPersonalInfo({...personalInfo, gender: 'female'})}>
                    ♀ Female
                  </div>
                  <div className={`gender-btn ${personalInfo.gender === 'other' ? 'selected' : ''}`} onClick={() => setPersonalInfo({...personalInfo, gender: 'other'})}>
                    <UserCircle2 size={16} /> Other
                  </div>
                </div>
              </div>
              
              <button type="submit" className="btn btn-primary" style={{width: '100%'}} disabled={!personalInfo.name || !personalInfo.age || !personalInfo.gender}>
                Proceed &rarr;
              </button>
            </form>
          </div>
        )}

        {/* INITIATE CHAT SCREEN */}
        {stage === 'INITIATE_CHAT' && (
          <div className="personal-info-container">
            <div className="profile-icon-large">
              <User size={32} />
            </div>
            <h2 style={{marginBottom: '0.5rem'}}>Hello, {personalInfo.name || 'User'}</h2>
            <p className="text-muted" style={{marginBottom: '2rem'}}>Your personal information has been saved securely.</p>
            <button className="btn btn-primary" style={{padding: '1rem 2.5rem', fontSize: '1.1rem'}} onClick={handleInitiateChat}>
              Initiate Chat
            </button>
          </div>
        )}

        {/* CHAT MESSAGES */}
        {['ASSESSMENT', 'QUESTIONNAIRE', 'RESULT_HIGH', 'RESULT_LOW', 'LIVE_CHAT'].includes(stage) && (
          <>
            <div className="chat-history">
              {messages.map((msg) => (
                <div key={msg.id} className={`chat-message-row ${msg.sender}`}>
                  {msg.sender === 'bot' && (
                    <div className="avatar bot-avatar">
                      <Activity size={20} />
                    </div>
                  )}
                  
                  <div style={{display: 'flex', flexDirection: 'column'}}>
                    <div className="message-bubble">
                      {msg.text.split('\n').map((line, idx) => <span key={idx}>{line}<br/></span>)}
                      
                      {msg.predictionDetails && (
                        <div style={{marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1rem'}}>
                          <h4 style={{marginBottom: '0.25rem'}}>Condition: {msg.predictionDetails.prediction}</h4>
                          <p style={{fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem'}}>
                            Models Output: SVC: {msg.predictionDetails.prediction_svc} | Decision Tree: {msg.predictionDetails.prediction_dt}
                          </p>
                          <p style={{fontSize: '0.9rem'}}>{msg.predictionDetails.description}</p>
                        </div>
                      )}

                      {msg.type === 'assessment_prompt' && stage === 'ASSESSMENT' && (
                        <div className="decision-buttons">
                          <button className="btn btn-primary" onClick={() => handleAssessmentResponse('YES')}>YES</button>
                          <button className="btn btn-outline" onClick={() => handleAssessmentResponse('NO')}>NO</button>
                        </div>
                      )}

                      {(msg.type === 'end_chat' || msg.type === 'end_chat_urgent') && (
                        <div className="success-card">
                          <div className="success-header">
                            <CheckCircle2 className="text-primary" />
                            {msg.type === 'end_chat_urgent' ? 'Consultation Complete' : 'Thank you for contacting us. Have a healthy day!'}
                          </div>
                          <div className="decision-buttons" style={{marginTop: 0}}>
                            <button className="btn btn-outline" onClick={() => navigate('/home')}>Main Menu</button>
                            <button className="btn btn-outline" onClick={handleResetChat}>End Chat (Restart)</button>
                          </div>
                        </div>
                      )}

                      {msg.type === 'faq_prompt' && stage === 'RESULT_LOW' && (
                        <div style={{marginTop: '1.5rem'}}>
                          <h4 style={{marginBottom: '0.75rem'}}>Frequently Asked Questions</h4>
                          <div style={{background: 'var(--bg-color)', padding: '1rem', borderRadius: '12px', marginBottom: '1rem', fontSize: '0.9rem'}}>
                            <p><strong>Q: What should I do if symptoms worsen?</strong><br/>A: Seek immediate medical attention.</p>
                            <p style={{marginTop: '0.5rem'}}><strong>Q: Are these precautions guaranteed to cure me?</strong><br/>A: No, they are preventive measures. Consult a doctor for treatment.</p>
                          </div>
                          <div className="decision-buttons">
                            <button className="btn btn-primary" onClick={() => {
                              setStage('LIVE_CHAT');
                              addMessage('bot', "Live Chat Initiated. Connecting you to a healthcare representative... (Mock Feature)");
                            }}>Live Chat</button>
                            <button className="btn btn-outline" onClick={() => navigate('/home')}>Main Menu / End Chat</button>
                          </div>
                        </div>
                      )}
                    </div>
                    <span className="timestamp">{msg.timestamp || 'Just now'}</span>
                  </div>

                  {msg.sender === 'user' && (
                    <div className="avatar user-avatar">
                      <User size={20} />
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="chat-message-row bot">
                  <div className="avatar bot-avatar"><Activity size={20} /></div>
                  <div className="message-bubble text-muted" style={{fontStyle: 'italic', padding: '0.75rem 1.25rem'}}>Processing...</div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* CHAT INPUT AREA */}
            <div className="chat-input-area">
              {stage === 'QUESTIONNAIRE' && (
                <div style={{display: 'flex', flexDirection: 'column'}}>
                  {selectedSymptoms.length > 0 && (
                    <div className="selected-symptoms-container">
                      {selectedSymptoms.map(sym => (
                        <span key={sym} className="symptom-tag">
                          {sym.replace(/_/g, ' ')}
                          <button onClick={() => removeSymptom(sym)}><Trash2 size={12}/></button>
                        </span>
                      ))}
                    </div>
                  )}
                  <div style={{display: 'flex', gap: '1rem', alignItems: 'center'}}>
                    <div className="chat-input-wrapper" style={{flexGrow: 1, position: 'relative'}}>
                      <Paperclip size={18} className="text-muted" />
                      <input
                        type="text"
                        placeholder="Type to search symptoms..."
                        value={searchTerm}
                        onChange={handleSearchChange}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && filteredSymptoms.length > 0) {
                            addSymptom(filteredSymptoms[0]);
                          }
                        }}
                      />
                      <button className="icon-btn" onClick={startVoiceInput} style={{color: isListening ? 'var(--primary)' : 'var(--text-muted)'}}>
                        {isListening ? <Mic size={18} /> : <MicOff size={18} />}
                      </button>
                      
                      {filteredSymptoms.length > 0 && (
                        <div className="symptom-suggestions-dropdown">
                          {filteredSymptoms.map(sym => (
                            <div key={sym} className="suggestion-item" onClick={() => addSymptom(sym)}>
                              {sym.replace(/_/g, ' ')}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <button className="send-btn" onClick={handleSubmitSymptoms} disabled={selectedSymptoms.length === 0 || loading}>
                      <Send size={18} />
                    </button>
                  </div>
                </div>
              )}

              {stage === 'LIVE_CHAT' && (
                <div style={{display: 'flex', gap: '1rem', alignItems: 'center'}}>
                  <div className="chat-input-wrapper" style={{flexGrow: 1}}>
                    <Paperclip size={18} className="text-muted" />
                    <input 
                      type="text" 
                      placeholder="Type your message here..." 
                      value={liveChatMessage}
                      onChange={(e) => setLiveChatMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && liveChatMessage.trim() !== '') {
                          handleSendLiveChatMessage();
                        }
                      }}
                    />
                  </div>
                  <button className="send-btn" onClick={handleSendLiveChatMessage} disabled={!liveChatMessage.trim()}>
                    <Send size={18} />
                  </button>
                  <button className="btn btn-outline" style={{padding: '0.5rem 1rem'}} onClick={() => navigate('/home')}>End</button>
                </div>
              )}
              
              {/* Disabled state visual for stages that don't allow typing */}
              {!['QUESTIONNAIRE', 'LIVE_CHAT'].includes(stage) && (
                <div className="chat-input-wrapper" style={{opacity: 0.5, pointerEvents: 'none'}}>
                  <Paperclip size={18} className="text-muted" />
                  <input type="text" placeholder="Interaction locked (awaiting choice...)" disabled />
                  <button className="icon-btn" disabled><MicOff size={18} /></button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Chatbot;
