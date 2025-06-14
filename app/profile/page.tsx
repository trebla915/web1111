"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { toast } from 'react-hot-toast';
import { 
  FiUser, 
  FiMail, 
  FiPhone, 
  FiCamera, 
  FiEdit2, 
  FiSave, 
  FiX, 
  FiLock,
  FiArrowLeft 
} from 'react-icons/fi';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import Link from 'next/link';

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [profileData, setProfileData] = useState({
    displayName: '',
    phoneNumber: '',
    firstName: '',
    lastName: ''
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  // Populate form with user data
  useEffect(() => {
    if (user) {
      setProfileData({
        displayName: user.displayName || '',
        phoneNumber: user.phoneNumber || '',
        firstName: user.firstName || '',
        lastName: user.lastName || ''
      });
      setAvatarPreview(user.photoURL || '');
    }
  }, [user]);

  // Handle avatar file selection
  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }
      
      // Check file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file');
        return;
      }
      
      setAvatarFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Upload avatar
  const uploadAvatar = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await fetch('/api/upload/avatar', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload avatar');
      }
      
      const { url } = await response.json();
      return url;
    } catch (error) {
      console.error('Avatar upload error:', error);
      throw error;
    }
  };

  // Handle profile update
  const handleUpdateProfile = async () => {
    if (!user) return;
    
    if (!profileData.displayName.trim()) {
      toast.error('Display name is required');
      return;
    }
    
    setIsUpdating(true);
    
    try {
      let photoURL = user.photoURL;
      
      // Upload new avatar if selected
      if (avatarFile) {
        photoURL = await uploadAvatar(avatarFile);
      }
      
      const updateData = {
        displayName: profileData.displayName,
        phoneNumber: profileData.phoneNumber,
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        photoURL: photoURL
      };
      
      const response = await fetch(`/api/users/${user.uid}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await auth.currentUser?.getIdToken()}`
        },
        body: JSON.stringify(updateData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to update profile');
      }
      
      toast.success('Profile updated successfully!');
      setIsEditing(false);
      setAvatarFile(null);
      window.location.reload();
      
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error('Failed to update profile. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle password change
  const handlePasswordChange = async () => {
    if (!user || !auth.currentUser) return;
    
    // Validate password form
    if (!passwordData.currentPassword) {
      toast.error('Current password is required');
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    
    setIsChangingPassword(true);
    
    try {
      // Reauthenticate user
      const credential = EmailAuthProvider.credential(
        user.email,
        passwordData.currentPassword
      );
      
      await reauthenticateWithCredential(auth.currentUser, credential);
      
      // Update password
      await updatePassword(auth.currentUser, passwordData.newPassword);
      
      toast.success('Password updated successfully!');
      setShowPasswordForm(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
    } catch (error: any) {
      console.error('Password change error:', error);
      if (error.code === 'auth/wrong-password') {
        toast.error('Current password is incorrect');
      } else {
        toast.error('Failed to update password. Please try again.');
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-white text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link 
              href="/dashboard"
              className="text-white hover:text-cyan-400 transition-colors"
            >
              <FiArrowLeft size={24} />
            </Link>
            <h1 className="text-3xl font-bold text-white">My Profile</h1>
          </div>
          
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors"
            >
              <FiEdit2 size={18} />
              Edit Profile
            </button>
          )}
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800 overflow-hidden">
            {/* Profile Header */}
            <div className="bg-gradient-to-r from-cyan-600/20 to-purple-600/20 p-8 border-b border-gray-800">
              <div className="flex items-center gap-6">
                {/* Avatar */}
                <div className="relative">
                  <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-800 border-4 border-cyan-600/50">
                    {avatarPreview ? (
                      <img 
                        src={avatarPreview} 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <FiUser size={32} />
                      </div>
                    )}
                  </div>
                  
                  {isEditing && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-0 right-0 p-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-full transition-colors"
                    >
                      <FiCamera size={14} />
                    </button>
                  )}
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </div>
                
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    {user.displayName || 'User'}
                  </h2>
                  <p className="text-gray-400 mb-1">{user.email}</p>
                  {user.role && (
                    <span className="inline-block px-3 py-1 bg-gray-800 text-cyan-400 rounded-full text-sm font-medium">
                      {user.role.toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Profile Form */}
            <div className="p-8">
              <div className="space-y-6">
                {/* Display Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Display Name
                  </label>
                  <div className="relative">
                    <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={profileData.displayName}
                      onChange={(e) => setProfileData({...profileData, displayName: e.target.value})}
                      disabled={!isEditing}
                      className={`w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500 ${
                        !isEditing ? 'cursor-not-allowed opacity-60' : ''
                      }`}
                      placeholder="Enter your display name"
                    />
                  </div>
                </div>

                {/* Email (Read Only) */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      value={user.email}
                      disabled
                      className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white cursor-not-allowed opacity-60"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Phone Number
                  </label>
                  <div className="relative">
                    <FiPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="tel"
                      value={profileData.phoneNumber}
                      onChange={(e) => setProfileData({...profileData, phoneNumber: e.target.value})}
                      disabled={!isEditing}
                      className={`w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500 ${
                        !isEditing ? 'cursor-not-allowed opacity-60' : ''
                      }`}
                      placeholder="Enter your phone number"
                    />
                  </div>
                </div>

                {/* First Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={profileData.firstName}
                    onChange={(e) => setProfileData({...profileData, firstName: e.target.value})}
                    disabled={!isEditing}
                    className={`w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500 ${
                      !isEditing ? 'cursor-not-allowed opacity-60' : ''
                    }`}
                    placeholder="Enter your first name"
                  />
                </div>

                {/* Last Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={profileData.lastName}
                    onChange={(e) => setProfileData({...profileData, lastName: e.target.value})}
                    disabled={!isEditing}
                    className={`w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500 ${
                      !isEditing ? 'cursor-not-allowed opacity-60' : ''
                    }`}
                    placeholder="Enter your last name"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              {isEditing && (
                <div className="flex gap-4 mt-8">
                  <button
                    onClick={handleUpdateProfile}
                    disabled={isUpdating}
                    className="flex items-center gap-2 px-6 py-3 bg-cyan-600 hover:bg-cyan-700 disabled:bg-cyan-600/50 text-white rounded-lg transition-colors"
                  >
                    <FiSave size={18} />
                    {isUpdating ? 'Saving...' : 'Save Changes'}
                  </button>
                  
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setAvatarFile(null);
                      setAvatarPreview(user.photoURL || '');
                      setProfileData({
                        displayName: user.displayName || '',
                        phoneNumber: user.phoneNumber || '',
                        firstName: user.firstName || '',
                        lastName: user.lastName || ''
                      });
                    }}
                    className="flex items-center gap-2 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                  >
                    <FiX size={18} />
                    Cancel
                  </button>
                </div>
              )}

              {/* Password Section */}
              <div className="mt-12 pt-8 border-t border-gray-800">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-white">Security</h3>
                  {!showPasswordForm && (
                    <button
                      onClick={() => setShowPasswordForm(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                    >
                      <FiLock size={18} />
                      Change Password
                    </button>
                  )}
                </div>

                {showPasswordForm && (
                  <div className="bg-gray-800/50 rounded-lg p-6">
                    <h4 className="text-lg font-medium text-white mb-4">Change Password</h4>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Current Password
                        </label>
                        <input
                          type="password"
                          value={passwordData.currentPassword}
                          onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                          className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500"
                          placeholder="Enter your current password"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          New Password
                        </label>
                        <input
                          type="password"
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                          className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500"
                          placeholder="Enter your new password (min. 6 characters)"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Confirm New Password
                        </label>
                        <input
                          type="password"
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                          className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500"
                          placeholder="Confirm your new password"
                        />
                      </div>
                    </div>
                    
                    <div className="flex gap-4 mt-6">
                      <button
                        onClick={handlePasswordChange}
                        disabled={isChangingPassword}
                        className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-600/50 text-white rounded-lg transition-colors"
                      >
                        <FiLock size={18} />
                        {isChangingPassword ? 'Updating...' : 'Update Password'}
                      </button>
                      
                      <button
                        onClick={() => {
                          setShowPasswordForm(false);
                          setPasswordData({
                            currentPassword: '',
                            newPassword: '',
                            confirmPassword: ''
                          });
                        }}
                        className="flex items-center gap-2 px-6 py-3 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors"
                      >
                        <FiX size={18} />
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 