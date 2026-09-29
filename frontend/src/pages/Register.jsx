import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Activity, User, Lock, Eye, EyeOff, ShieldCheck, BookOpen, LockKeyhole } from 'lucide-react';
import api from '../services/api';

function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await api.post('/auth/register', { username, password });
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.detail || "Registration failed");
    }
  };

  return (
    <div className="split-layout">
      {/* Left Marketing Panel */}
      <div className="split-left">
        <div className="marketing-content">
          <div className="brand-header">
            <div className="brand-logo">
              <Activity size={24} />
            </div>
            AI Health Assistant
          </div>
          
          <h1 className="marketing-title">
            Your Personal<br/>
            Health <span className="text-primary">Guide</span>
          </h1>
          
          <p className="marketing-subtitle">
            Get AI-powered health insights based on your symptoms.<br/>
            Educational information only, not a medical diagnosis.
          </p>

          <div className="feature-list">
            <div className="feature-item">
              <div className="feature-icon">
                <ShieldCheck size={20} />
              </div>
              <div className="feature-text">
                <h4>AI-Powered Analysis</h4>
                <p>Based on machine learning predictions</p>
              </div>
            </div>
            <div className="feature-item">
              <div className="feature-icon">
                <BookOpen size={20} />
              </div>
              <div className="feature-text">
                <h4>Educational Information</h4>
                <p>Learn about possible conditions</p>
              </div>
            </div>
            <div className="feature-item">
              <div className="feature-icon">
                <LockKeyhole size={20} />
              </div>
              <div className="feature-text">
                <h4>Your Privacy Matters</h4>
                <p>Your data is secure and confidential</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Register Panel */}
      <div className="split-right">
        <div className="auth-card">
          <div style={{textAlign: 'center', marginBottom: '2rem'}}>
            <div className="brand-logo" style={{marginBottom: '1rem'}}>
              <Activity size={32} />
            </div>
            <h2>Create Account</h2>
            <p className="text-muted" style={{marginTop: '0.5rem'}}>Join us to get started with AI health insights</p>
          </div>

          {error && <div style={{background: 'var(--error)', color: 'white', padding: '0.75rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem', textAlign: 'center'}}>{error}</div>}

          <form onSubmit={handleRegister}>
            <div className="form-group">
              <label>Username</label>
              <div className="input-with-icon">
                <User size={18} className="left-icon" />
                <input 
                  type="text" 
                  placeholder="Choose a username" 
                  required 
                  value={username} 
                  onChange={e => setUsername(e.target.value)} 
                />
              </div>
            </div>

            <div className="form-group">
              <label>Password</label>
              <div className="input-with-icon">
                <Lock size={18} className="left-icon" />
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Create a password" 
                  required 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                />
                {showPassword ? 
                  <EyeOff size={18} className="right-icon" onClick={() => setShowPassword(false)} /> : 
                  <Eye size={18} className="right-icon" onClick={() => setShowPassword(true)} />
                }
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{width: '100%', marginBottom: '1.5rem', marginTop: '1rem'}}>
              Register &rarr;
            </button>

            <div style={{textAlign: 'center', fontSize: '0.95rem'}}>
              Already have an account? <Link to="/login" className="auth-link">Login here</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Register;
