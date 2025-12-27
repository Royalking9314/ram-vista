import React, { useState } from 'react';
import { User as UserType } from '../types.ts';
import { User, FileText, Save, Loader2, X, ArrowLeft, Trash2, AlertTriangle, ShieldAlert } from 'lucide-react';

interface ProfileProps {
  user: UserType;
  onUpdate: (updatedUser: UserType) => void;
  onBack: () => void;
  onDelete: () => void;
}

const Profile: React.FC<ProfileProps> = ({ user, onUpdate, onBack, onDelete }) => {
  const [formData, setFormData] = useState<UserType>({
    ...user,
    age: user.age || 0,
    role: user.role || '',
    company: user.company || '',
    bio: user.bio || '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      onUpdate(formData);
      setIsSaving(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }, 800);
  };

  const handleDelete = () => {
    setDeleteLoading(true);
    setTimeout(() => {
      onDelete();
      setDeleteLoading(false);
    }, 1500);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'age' ? parseInt(value) || 0 : value
    }));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
      {/* Floating Escape Button */}
      <div className="absolute -top-12 right-0 z-10">
        <button 
          onClick={onBack}
          className="group flex items-center gap-2 px-4 py-2 rounded-full bg-doodle-surface border border-doodle-border hover:border-doodle-blue transition-all shadow-xl text-doodle-muted hover:text-white"
        >
          <span className="text-[10px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">Escape</span>
          <div className="bg-doodle-base rounded-full p-1.5 border border-doodle-border group-hover:bg-doodle-blue group-hover:border-doodle-blue transition-colors">
            <X className="w-4 h-4" />
          </div>
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Left Side: Summary Card */}
        <div className="w-full md:w-1/3 space-y-6">
          <div className="bg-doodle-surface border border-doodle-border rounded-[2.5rem] p-8 relative overflow-hidden shadow-2xl text-center">
            <div className="w-32 h-32 mx-auto rounded-full p-1 bg-gradient-to-tr from-doodle-blue to-doodle-purple mb-6 shadow-2xl shadow-doodle-blue/10">
              <div className="w-full h-full rounded-full bg-doodle-black flex items-center justify-center overflow-hidden">
                <User className="w-16 h-16 text-white" />
              </div>
            </div>
            
            <h2 className="text-2xl font-black text-white mb-1">{formData.name}</h2>
            <p className="text-doodle-blue font-bold text-xs uppercase tracking-widest mb-6">
              {formData.role || 'Unassigned User'}
            </p>
            
            <div className="bg-doodle-base rounded-2xl p-4 space-y-3 border border-doodle-border">
              <div className="flex justify-between items-center text-[10px] tracking-widest font-black">
                <span className="text-doodle-muted">STATUS</span>
                <span className="text-green-400 bg-green-400/10 px-2 py-0.5 rounded">ACTIVE</span>
              </div>
              <div className="flex justify-between items-center text-[10px] tracking-widest font-black">
                <span className="text-doodle-muted">SECURITY</span>
                <span className="text-doodle-purple">ENCRYPTED</span>
              </div>
            </div>
          </div>

          <button 
            onClick={onBack}
            className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-2xl bg-doodle-base text-doodle-muted border border-doodle-border hover:border-doodle-blue hover:text-white transition-all font-bold text-xs uppercase tracking-widest group shadow-lg"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Terminal
          </button>
        </div>

        {/* Right Side: Form */}
        <div className="flex-1 space-y-6">
          <div className="bg-doodle-surface border border-doodle-border rounded-[2.5rem] p-10 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-doodle-glow pointer-events-none opacity-50 blur-3xl"></div>
            
            <h3 className="text-xl font-bold text-white mb-8 flex items-center gap-3">
              <div className="bg-doodle-blue/10 p-2.5 rounded-xl border border-doodle-blue/20">
                <FileText className="w-5 h-5 text-doodle-blue" />
              </div>
              Identity Profile
            </h3>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-doodle-muted uppercase tracking-widest ml-1">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full bg-doodle-base border border-transparent hover:border-doodle-border focus:border-doodle-blue rounded-2xl py-3.5 px-5 text-white placeholder-doodle-border focus:outline-none transition-all font-medium"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-doodle-muted uppercase tracking-widest ml-1">Experience (Years)</label>
                  <input
                    type="number"
                    name="age"
                    value={formData.age}
                    onChange={handleChange}
                    className="w-full bg-doodle-base border border-transparent hover:border-doodle-border focus:border-doodle-blue rounded-2xl py-3.5 px-5 text-white placeholder-doodle-border focus:outline-none transition-all font-medium"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-doodle-muted uppercase tracking-widest ml-1">Current Role</label>
                  <input
                    type="text"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="w-full bg-doodle-base border border-transparent hover:border-doodle-border focus:border-doodle-blue rounded-2xl py-3.5 px-5 text-white placeholder-doodle-border focus:outline-none transition-all font-medium"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-doodle-muted uppercase tracking-widest ml-1">Organization</label>
                  <input
                    type="text"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    className="w-full bg-doodle-base border border-transparent hover:border-doodle-border focus:border-doodle-blue rounded-2xl py-3.5 px-5 text-white placeholder-doodle-border focus:outline-none transition-all font-medium"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-doodle-muted uppercase tracking-widest ml-1">Biography</label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  rows={4}
                  className="w-full bg-doodle-base border border-transparent hover:border-doodle-border focus:border-doodle-blue rounded-2xl p-5 text-white placeholder-doodle-border focus:outline-none transition-all resize-none font-medium leading-relaxed"
                  placeholder="Tell us about your technical background..."
                />
              </div>

              <div className="flex items-center justify-end pt-6 gap-6">
                  {showSuccess && (
                    <div className="flex items-center gap-2 text-green-400 text-xs font-bold animate-in fade-in slide-in-from-right-4">
                      <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                      CHANGES SYNCHRONIZED
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="bg-doodle-blue hover:bg-blue-600 text-white font-bold py-3.5 px-10 rounded-2xl transition-all shadow-xl hover:shadow-blue-500/25 active:scale-95 disabled:opacity-50 flex items-center gap-2 text-sm"
                  >
                    {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    Update Identity
                  </button>
              </div>
            </form>
          </div>

          {/* Danger Zone */}
          <div className="bg-doodle-surface border border-red-900/30 rounded-[2.5rem] p-10 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 pointer-events-none blur-3xl"></div>
            
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
              <div className="bg-red-500/10 p-2.5 rounded-xl border border-red-500/20">
                <ShieldAlert className="w-5 h-5 text-red-500" />
              </div>
              Danger Zone
            </h3>

            <p className="text-sm text-doodle-muted mb-8 leading-relaxed">
              Once you delete your account, there is no going back. All of your memory stream data, artifacts, and configuration will be permanently wiped from the prototype.
            </p>

            {isConfirmingDelete ? (
              <div className="bg-doodle-base border border-red-500/20 rounded-[2rem] p-6 animate-in zoom-in-95 duration-200">
                <div className="flex items-start gap-4 mb-6">
                  <div className="bg-red-500/20 p-2 rounded-full">
                    <AlertTriangle className="w-6 h-6 text-red-500" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white mb-1">Are you absolutely sure?</h4>
                    <p className="text-xs text-doodle-muted">This action is irreversible. All session data will be lost.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleDelete}
                    disabled={deleteLoading}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-sm shadow-lg shadow-red-500/20"
                  >
                    {deleteLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    Confirm Deletion
                  </button>
                  <button
                    onClick={() => setIsConfirmingDelete(false)}
                    className="flex-1 bg-doodle-surface hover:bg-doodle-highlight text-white border border-doodle-border font-bold py-3 rounded-xl transition-all text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setIsConfirmingDelete(true)}
                className="w-full md:w-auto bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 font-bold py-3.5 px-8 rounded-2xl transition-all flex items-center justify-center gap-2 text-sm group"
              >
                <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                Delete Identity Account
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;