import { Link, useNavigate } from 'react-router-dom';
import { Activity, ShieldCheck, HeartPulse, ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';

function Home() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    navigate('/login');
  };

  return (
    <div style={{minHeight: '100vh', display: 'flex', flexDirection: 'column'}}>
      {/* Top Navbar */}
      <nav style={{padding: '1.5rem 4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', borderBottom: '1px solid var(--border)'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 700, fontSize: '1.25rem'}}>
          <div className="brand-logo">
            <Activity size={24} />
          </div>
          AI Health Assistant
        </div>
        <div style={{display: 'flex', gap: '1rem', alignItems: 'center'}}>
          {isLoggedIn ? (
            <>
              <Link to="/chatbot" className="btn btn-primary">New Consultation</Link>
              <button className="btn btn-outline" onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-outline">Login</Link>
              <Link to="/register" className="btn btn-primary">Create Account</Link>
            </>
          )}
        </div>
      </nav>

      {/* Main Hero */}
      <div style={{flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '4rem 2rem'}}>
        <div style={{display: 'inline-flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--primary-faint)', color: 'var(--primary-hover)', padding: '0.5rem 1rem', borderRadius: '20px', fontWeight: 600, fontSize: '0.9rem', marginBottom: '2rem'}}>
          <HeartPulse size={16} /> <span>Educational Health Intelligence</span>
        </div>
        
        <h1 style={{fontSize: '4rem', lineHeight: 1.1, marginBottom: '1.5rem', maxWidth: '800px'}}>
          Empowering Your Health With <span className="text-primary">AI Insights</span>
        </h1>
        
        <p className="text-muted" style={{fontSize: '1.25rem', maxWidth: '600px', marginBottom: '3rem', lineHeight: 1.6}}>
          Get instant, machine-learning driven health insights based on your symptoms. Fast, secure, and entirely private.
        </p>

        {isLoggedIn ? (
          <Link to="/chatbot" className="btn btn-primary" style={{padding: '1rem 3rem', fontSize: '1.1rem', borderRadius: '16px'}}>
            Start Consultation <ArrowRight size={20} />
          </Link>
        ) : (
          <Link to="/register" className="btn btn-primary" style={{padding: '1rem 3rem', fontSize: '1.1rem', borderRadius: '16px'}}>
            Get Started <ArrowRight size={20} />
          </Link>
        )}

        <div style={{display: 'flex', gap: '3rem', marginTop: '5rem'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)'}}>
            <ShieldCheck className="text-primary" size={20} /> Data Encrypted
          </div>
          <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)'}}>
            <Activity className="text-primary" size={20} /> Advanced SVC & DT Models
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer style={{textAlign: 'center', padding: '2rem', backgroundColor: 'white', borderTop: '1px solid var(--border)', fontSize: '0.85rem', color: 'var(--text-muted)'}}>
        <p><strong>Disclaimer:</strong> This tool provides educational information based on machine-learning predictions and is not a medical diagnosis. Consult a qualified healthcare professional for medical advice. If you are experiencing severe, sudden, or life-threatening symptoms, seek emergency medical care immediately.</p>
      </footer>
    </div>
  );
}

export default Home;
