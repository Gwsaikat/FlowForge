import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, BrainCircuit, X, MessageSquare, ChevronRight } from 'lucide-react';
import { getAIAdvisor } from '../services/aiService.js';
import toast from 'react-hot-toast';

export default function AIAdvisorPanel({ projectId, onClose }) {
  const [loading, setLoading] = useState(false);
  const [advice, setAdvice] = useState('');
  const [prompt, setPrompt] = useState('');
  const [isOpen, setIsOpen] = useState(true);

  async function handleAsk(e) {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    try {
      const res = await getAIAdvisor(projectId, { prompt });
      setAdvice(res.advice);
      setPrompt('');
    } catch (err) {
      toast.error('Prophet connection failed');
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setIsOpen(false);
    setTimeout(onClose, 300);
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="ai-panel"
          initial={{ opacity: 0, x: -20, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: -20, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        >
          <div className="ai-panel-header">
            <div className="ai-panel-title">
              <BrainCircuit size={18} className="ai-icon" />
              <h3>AI CPM Advisor</h3>
              <span className="ai-badge">GPT-4o</span>
            </div>
            <button className="icon-btn" onClick={handleClose}>
              <X size={16} />
            </button>
          </div>

          <div className="ai-panel-body" style={{ display: 'flex', flexDirection: 'column', height: 400 }}>
            <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.5rem', marginBottom: '1rem' }}>
              {!advice && !loading && (
                <div className="empty-state" style={{ padding: '2rem 1rem' }}>
                  <Sparkles size={32} className="text-accent" style={{ margin: '0 auto 1rem' }} />
                  <p>Ask the AI advisor to analyze your critical path, identify risks, or suggest resource reallocations.</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
                    <button className="btn btn-ghost-sm" style={{ justifyContent: 'flex-start' }} onClick={() => setPrompt("What is the biggest risk to my deadline?")}>
                      "What is the biggest risk to my deadline?"
                    </button>
                    <button className="btn btn-ghost-sm" style={{ justifyContent: 'flex-start' }} onClick={() => setPrompt("How can I shorten the critical path?")}>
                      "How can I shorten the critical path?"
                    </button>
                  </div>
                </div>
              )}

              {loading && (
                <div className="ai-loading">
                  <div className="spinner" />
                  <span>Prophet is analyzing your CPM graph...</span>
                </div>
              )}

              {advice && !loading && (
                <motion.div 
                  className="ai-markdown"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div dangerouslySetInnerHTML={{ __html: advice.replace(/\n/g, '<br/>') }} />
                </motion.div>
              )}
            </div>

            <form onSubmit={handleAsk} style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
              <input
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ask about your project..."
                className="form-group"
                style={{ flex: 1, marginBottom: 0 }}
                disabled={loading}
              />
              <button type="submit" className="btn btn-primary" disabled={loading || !prompt.trim()} style={{ padding: '0.55rem' }}>
                <MessageSquare size={16} />
              </button>
            </form>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
