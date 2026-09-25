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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/field";

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
      if (!user.email) {
        toast.error("This account has no email address to reauthenticate with");
        return;
      }

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
      <div className="min-h-screen bg-gradient-to-br from-canvas via-surface to-surface-raised flex items-center justify-center">
        <div className="text-fg text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-canvas via-surface to-surface-raised">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            {/* Icon-only link with no text and no label: announced as a bare
                "link" and only 24px tall. */}
            <Button asChild variant="ghost" size="icon" shape="pill" className="-ml-2">
              <Link href="/dashboard" aria-label="Back to dashboard">
                <FiArrowLeft aria-hidden="true" size={22} />
              </Link>
            </Button>
            <h1 className="text-3xl font-bold text-fg">My Profile</h1>
          </div>
          
          {!isEditing && (
            <Button
              onClick={() => setIsEditing(true)}
              variant="accent"
            >
              <FiEdit2 size={18} />
              Edit Profile
            </Button>
          )}
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="bg-surface/50 backdrop-blur-sm rounded-xl border border-line-subtle overflow-hidden">
            {/* Profile Header */}
            <div className="bg-gradient-to-r from-accent-600/20 to-transparent p-8 border-b border-line-subtle">
              <div className="flex items-center gap-6">
                {/* Avatar */}
                <div className="relative">
                  <div className="w-24 h-24 rounded-full overflow-hidden bg-surface-raised border-4 border-accent-600/50">
                    {avatarPreview ? (
                      // next/image cannot optimise a data: URL, and this src is
                      // a FileReader preview of the file the user just picked.
                      // eslint-disable-next-line @next/next/no-img-element
                      <img 
                        src={avatarPreview} 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-fg-muted">
                        <FiUser size={32} />
                      </div>
                    )}
                  </div>
                  
                  {isEditing && (
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      variant="accent"
                      size="icon"
                      shape="pill"
                      aria-label="Change profile photo"
                      className="absolute bottom-0 right-0"
                    >
                      <FiCamera aria-hidden="true" size={14} />
                    </Button>
                  )}
                  
                  {/* Visually hidden but still in the accessibility tree, so it
                      needs a name of its own. */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    aria-label="Choose a profile photo"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </div>
                
                <div>
                  <h2 className="text-2xl font-bold text-fg mb-2">
                    {user.displayName || 'User'}
                  </h2>
                  <p className="text-fg-muted mb-1">{user.email}</p>
                  {user.role && (
                    <span className="inline-block px-3 py-1 bg-surface-raised text-accent-400 rounded-full text-sm font-medium">
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
                  <Label htmlFor="display-name" className="mb-1.5">
                    Display Name
                  </Label>
                  <Input
                    id="display-name"
                    type="text"
                    autoComplete="name"
                    leadingIcon={<FiUser aria-hidden="true" className="h-4 w-4" />}
                    value={profileData.displayName}
                    onChange={(e) => setProfileData({...profileData, displayName: e.target.value})}
                    disabled={!isEditing}
                    placeholder="Alex Navarro"
                  />
                </div>

                {/* Email (Read Only) */}
                <div>
                  <Label htmlFor="email-address" className="mb-1.5">
                    Email Address
                  </Label>
                  <Input
                    id="email-address"
                    type="email"
                    value={user.email ?? ""}
                    disabled
                    readOnly
                    aria-describedby="email-hint"
                    leadingIcon={<FiMail aria-hidden="true" className="h-4 w-4" />}
                  />
                  <p id="email-hint" className="mt-1.5 text-xs text-fg-subtle">
                    Email cannot be changed
                  </p>
                </div>

                {/* Phone Number */}
                <div>
                  <Label htmlFor="phone-number" className="mb-1.5">
                    Phone Number
                  </Label>
                  <Input
                    id="phone-number"
                    type="tel"
                    autoComplete="tel"
                    leadingIcon={<FiPhone aria-hidden="true" className="h-4 w-4" />}
                    value={profileData.phoneNumber}
                    onChange={(e) => setProfileData({...profileData, phoneNumber: e.target.value})}
                    disabled={!isEditing}
                    placeholder="(915) 555-0142"
                  />
                </div>

                {/* First Name */}
                <div>
                  <Label htmlFor="first-name" className="mb-1.5">
                    First Name
                  </Label>
                  <Input
                    id="first-name"
                    type="text"
                    autoComplete="given-name"
                    value={profileData.firstName}
                    onChange={(e) => setProfileData({...profileData, firstName: e.target.value})}
                    disabled={!isEditing}
                    placeholder="Alex"
                  />
                </div>

                {/* Last Name */}
                <div>
                  <Label htmlFor="last-name" className="mb-1.5">
                    Last Name
                  </Label>
                  <Input
                    id="last-name"
                    type="text"
                    autoComplete="family-name"
                    value={profileData.lastName}
                    onChange={(e) => setProfileData({...profileData, lastName: e.target.value})}
                    disabled={!isEditing}
                    placeholder="Navarro"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              {isEditing && (
                <div className="flex gap-4 mt-8">
                  <Button
                    onClick={handleUpdateProfile}
                    disabled={isUpdating}
                    variant="accent" size="lg"
                  >
                    <FiSave size={18} />
                    {isUpdating ? 'Saving...' : 'Save Changes'}
                  </Button>
                  
                  <Button
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
                    variant="outline" size="lg"
                  >
                    <FiX size={18} />
                    Cancel
                  </Button>
                </div>
              )}

              {/* Password Section */}
              <div className="mt-12 pt-8 border-t border-line-subtle">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-fg">Security</h3>
                  {!showPasswordForm && (
                    <Button
                      onClick={() => setShowPasswordForm(true)}
                      variant="outline"
                    >
                      <FiLock size={18} />
                      Change Password
                    </Button>
                  )}
                </div>

                {showPasswordForm && (
                  <div className="bg-surface-raised/50 rounded-lg p-6">
                    <h4 className="text-lg font-medium text-fg mb-4">Change Password</h4>
                    
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="current-password" className="mb-1.5">
                          Current Password
                        </Label>
                        <Input
                          id="current-password"
                          type="password"
                          autoComplete="current-password"
                          value={passwordData.currentPassword}
                          onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                          placeholder="Enter your current password"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="new-password" className="mb-1.5">
                          New Password
                        </Label>
                        <Input
                          id="new-password"
                          type="password"
                          autoComplete="new-password"
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                          placeholder="Enter your new password (min. 6 characters)"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="confirm-password" className="mb-1.5">
                          Confirm New Password
                        </Label>
                        <Input
                          id="confirm-password"
                          type="password"
                          autoComplete="new-password"
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                          placeholder="Confirm your new password"
                        />
                      </div>
                    </div>
                    
                    <div className="flex gap-4 mt-6">
                      <Button
                        onClick={handlePasswordChange}
                        disabled={isChangingPassword}
                        variant="accent" size="lg"
                      >
                        <FiLock size={18} />
                        {isChangingPassword ? 'Updating...' : 'Update Password'}
                      </Button>
                      
                      <Button
                        onClick={() => {
                          setShowPasswordForm(false);
                          setPasswordData({
                            currentPassword: '',
                            newPassword: '',
                            confirmPassword: ''
                          });
                        }}
                        variant="outline" size="lg"
                      >
                        <FiX size={18} />
                        Cancel
                      </Button>
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