import React, { useState } from 'react';
import { UserProfile } from '../types';
import { updateUser } from '../services/authService';
import { ArrowRight, Upload, User, Save, Image as ImageIcon } from 'lucide-react';

interface ProfileEditorProps {
  mode: 'icon' | 'name';
  currentUser: UserProfile;
  onUpdate: (user: UserProfile) => void;
  onBack: () => void;
}

const ProfileEditor: React.FC<ProfileEditorProps> = ({ mode, currentUser, onUpdate, onBack }) => {
  const [firstName, setFirstName] = useState(currentUser.firstName);
  const [lastName, setLastName] = useState(currentUser.lastName);
  const [previewImage, setPreviewImage] = useState<string | null>(currentUser.avatarUrl || null);
  const [isLoading, setIsLoading] = useState(false);

  const handleNameSave = () => {
    setIsLoading(true);
    // Simulate network delay
    setTimeout(() => {
      const updated = updateUser(currentUser.id, { firstName, lastName });
      onUpdate(updated);
      setIsLoading(false);
      onBack();
    }, 800);
  };

  const handleIconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleIconSave = () => {
    if (!previewImage) return;
    setIsLoading(true);
    setTimeout(() => {
      const updated = updateUser(currentUser.id, { avatarUrl: previewImage });
      onUpdate(updated);
      setIsLoading(false);
      onBack();
    }, 800);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 flex items-center justify-center">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 p-8">
        
        <button onClick={onBack} className="text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center gap-2 mb-6">
          <ArrowRight className="rotate-180" /> Back
        </button>

        <h1 className="text-2xl font-bold mb-2">
          {mode === 'name' ? 'Update Your Name' : 'Change Profile Icon'}
        </h1>
        <p className="text-slate-500 mb-8">
          {mode === 'name' 
            ? 'This is how you will appear to your friends.' 
            : 'Upload a new avatar to personalize your profile.'}
        </p>

        {mode === 'name' ? (
          <div className="space-y-4">
             <div>
               <label className="block text-xs font-bold text-slate-500 uppercase mb-1">First Name</label>
               <input 
                 type="text" 
                 value={firstName}
                 onChange={(e) => setFirstName(e.target.value)}
                 className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500"
               />
             </div>
             <div>
               <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Last Name</label>
               <input 
                 type="text" 
                 value={lastName}
                 onChange={(e) => setLastName(e.target.value)}
                 className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500"
               />
             </div>
             <button 
               onClick={handleNameSave}
               disabled={isLoading || !firstName || !lastName}
               className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl mt-4 flex items-center justify-center gap-2"
             >
               {isLoading ? 'Saving...' : <><Save size={18} /> Save Changes</>}
             </button>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="relative w-32 h-32 mb-6 group cursor-pointer">
              <div className="w-full h-full rounded-full overflow-hidden border-4 border-indigo-100 dark:border-indigo-900 bg-slate-200 dark:bg-slate-800">
                {previewImage ? (
                  <img src={previewImage} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                    <User size={48} />
                  </div>
                )}
              </div>
              <label className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white font-medium gap-2">
                 <Upload size={18} /> Upload
                 <input type="file" accept="image/*" className="hidden" onChange={handleIconUpload} />
              </label>
            </div>

            <button 
               onClick={handleIconSave}
               disabled={isLoading || !previewImage}
               className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl mt-4 flex items-center justify-center gap-2"
             >
               {isLoading ? 'Uploading...' : <><Save size={18} /> Save New Icon</>}
             </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default ProfileEditor;
