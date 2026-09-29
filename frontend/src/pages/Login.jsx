import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Activity, User, Lock, Eye, EyeOff, ShieldCheck, BookOpen, LockKeyhole } from 'lucide-react';
import api from '../services/api';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/auth/login', { username, password });
      localStorage.setItem('token', response.data.access_token);
      navigate('/chatbot'); // Changed to go straight to chatbot flow (which includes personal info) per requirements
    } catch (err) {
      setError(err.response?.data?.detail || "Login failed");
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

      {/* Right Login Panel */}
      <div className="split-right">
        <div className="auth-card">
          <div style={{textAlign: 'center', marginBottom: '2rem'}}>
            <div className="brand-logo" style={{marginBottom: '1rem'}}>
              <Activity size={32} />
            </div>
            <h2>Welcome Back</h2>
            <p className="text-muted" style={{marginTop: '0.5rem'}}>Login to your account to continue</p>
          </div>

          {error && <div style={{background: 'var(--error)', color: 'white', padding: '0.75rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem', textAlign: 'center'}}>{error}</div>}

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Username</label>
              <div className="input-with-icon">
                <User size={18} className="left-icon" />
                <input 
                  type="text" 
                  placeholder="Enter your username" 
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
                  placeholder="Enter your password" 
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

            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem'}}>
              <label className="checkbox-group">
                <input type="checkbox" /> Remember me
              </label>
              <a href="#" className="auth-link" style={{fontSize: '0.9rem'}}>Forgot password?</a>
            </div>

            <button type="submit" className="btn btn-primary" style={{width: '100%', marginBottom: '1.5rem'}}>
              Login &rarr;
            </button>

            <div style={{textAlign: 'center', marginBottom: '1.5rem', position: 'relative'}}>
              <hr style={{borderTop: '1px solid var(--border)', borderBottom: 'none'}} />
              <span style={{position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', background: 'white', padding: '0 10px', fontSize: '0.85rem', color: 'var(--text-muted)'}}>OR</span>
            </div>

            <button type="button" className="btn btn-outline" style={{width: '100%', marginBottom: '2rem'}}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25C22.56 11.47 22.49 10.72 22.36 10H12V14.26H17.92C17.67 15.63 16.89 16.81 15.72 17.59V20.35H19.28C21.36 18.43 22.56 15.6 22.56 12.25Z" fill="#4285F4"/>
                <path d="M12 23C14.97 23 17.46 22.02 19.28 20.35L15.72 17.59C14.74 18.25 13.48 18.66 12 18.66C9.14 18.66 6.71 16.73 5.84 14.15H2.17V16.99C4.01 20.65 7.74 23 12 23Z" fill="#34A853"/>
                <path d="M5.84 14.15C5.62 13.49 5.49 12.77 5.49 12C5.49 11.23 5.62 10.51 5.84 9.85V7.01H2.17C1.41 8.53 1 10.22 1 12C1 13.78 1.41 15.47 2.17 16.99L5.84 14.15Z" fill="#FBBC05"/>
                <path d="M12 5.34C13.62 5.34 15.07 5.9 16.21 6.99L19.35 3.85C17.45 2.07 14.97 1 12 1C7.74 1 4.01 3.35 2.17 7.01L5.84 9.85C6.71 7.27 9.14 5.34 12 5.34Z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>

            <div style={{textAlign: 'center', fontSize: '0.95rem'}}>
              Don't have an account? <Link to="/register" className="auth-link">Register here</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;
