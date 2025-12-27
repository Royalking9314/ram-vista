import React, { useState } from 'react';
import { Mail, Send, Headset, MessageSquare, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

const ContactUs: React.FC = () => {
  const [status, setStatus] = useState<'idle' | 'sending' | 'success'>('idle');
  const [formData, setFormData] = useState({
    subject: '',
    priority: 'low',
    message: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    setTimeout(() => {
      setStatus('success');
      setTimeout(() => {
        setStatus('idle');
        setFormData({ subject: '', priority: 'low', message: '' });
      }, 3000);
    }, 1500);
  };

  return (
    <div className="w-full lg:w-80 shrink-0 flex flex-col h-full bg-doodle-surface border border-doodle-border rounded-[2rem] overflow-hidden shadow-2xl animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="p-6 border-b border-doodle-border bg-doodle-base/30 flex items-center gap-3">
        <div className="bg-doodle-purple p-2 rounded-xl">
           <Headset className="w-4 h-4 text-white" />
        </div>
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Support</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-doodle-muted uppercase tracking-widest ml-1">Subject</label>
            <input
              type="text"
              required
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              className="w-full bg-doodle-base border border-transparent focus:border-doodle-purple rounded-xl py-3 px-4 text-xs text-white placeholder-doodle-border focus:outline-none transition-all"
              placeholder="System Issue..."
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-doodle-muted uppercase tracking-widest ml-1">Priority</label>
            <div className="relative">
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full bg-doodle-base border border-transparent focus:border-doodle-purple rounded-xl py-3 px-4 text-xs text-white focus:outline-none appearance-none cursor-pointer"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-doodle-muted uppercase tracking-widest ml-1">Message</label>
            <textarea
              required
              rows={4}
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              className="w-full bg-doodle-base border border-transparent focus:border-doodle-purple rounded-xl p-4 text-xs text-white placeholder-doodle-border focus:outline-none transition-all resize-none"
              placeholder="Describe the issue..."
            />
          </div>

          <button
            type="submit"
            disabled={status !== 'idle'}
            className={`w-full py-3.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 mt-2 ${
              status === 'success' 
                ? 'bg-green-500 text-white' 
                : 'bg-doodle-text text-black hover:bg-white'
            } active:scale-95 disabled:opacity-70`}
          >
            {status === 'idle' && (
              <>
                <Send className="w-3.5 h-3.5" />
                Submit Ticket
              </>
            )}
            {status === 'sending' && (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Sending...
              </>
            )}
            {status === 'success' && (
              <>
                <CheckCircle className="w-3.5 h-3.5" />
                Ticket Sent
              </>
            )}
          </button>
        </form>
      </div>
      
      <div className="p-4 bg-doodle-base border-t border-doodle-border flex justify-center gap-4">
        <a href="#" className="text-doodle-muted hover:text-white transition-colors">
          <Mail className="w-4 h-4" />
        </a>
        <a href="#" className="text-doodle-muted hover:text-white transition-colors">
          <MessageSquare className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
};

export default ContactUs;