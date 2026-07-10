import { useState, useEffect, useRef } from 'react';
import { scanAPI } from '../services/api';
import ScanForm from '../components/Scanner/ScanForm';
import ScanAnimation from '../components/Scanner/ScanAnimation';
import ScanReport from '../components/Scanner/ScanReport';

export default function Scanner() {
  const [loading, setLoading] = useState(false);
  const [step, setStep]       = useState(0);
  const [report, setReport]   = useState(null);
  const [error, setError]     = useState('');
  const timerRef = useRef(null);

  useEffect(() => () => clearInterval(timerRef.current), []);

  const handleScan = async (url) => {
    setLoading(true);
    setStep(0);
    setReport(null);
    setError('');

    // Animate steps while waiting
    timerRef.current = setInterval(() => {
      setStep(prev => (prev < 4 ? prev + 1 : prev));
    }, 1800);

    try {
      const { data } = await scanAPI.scan(url);
      clearInterval(timerRef.current);
      setStep(5);
      setTimeout(() => { setReport(data); setLoading(false); }, 400);
    } catch (err) {
      clearInterval(timerRef.current);
      setError(err.response?.data?.detail || 'Backend hors ligne — lancez start_backend.bat');
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl space-y-5 animate-fade-in">
      <div>
        <h1 className="font-display font-bold text-2xl text-white">Scanner IA</h1>
        <p className="text-sm text-slate-400 mt-1">Analyse complète : SSL · Headers · OWASP · IA</p>
      </div>

      <ScanForm onScan={handleScan} loading={loading} />

      {loading && <ScanAnimation step={step} />}

      {error && (
        <div className="p-4 rounded-xl bg-red/5 border border-red/20 text-sm text-red">
          {error}
        </div>
      )}

      {report && <ScanReport data={report} />}
    </div>
  );
}
