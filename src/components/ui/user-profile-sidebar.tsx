import * as React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Camera, Loader2 } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface NavItem {
  icon: React.ReactNode;
  label: string;
  href?: string;
  onClick?: () => void;
  isSeparator?: boolean;
  isActive?: boolean;
}

interface UserProfile {
  name: string;
  email: string;
  avatarUrl?: string;
  userId?: string;
}

interface UserProfileSidebarProps {
  user: UserProfile;
  navItems: NavItem[];
  logoutItem: {
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
  };
  activeSection?: string;
  className?: string;
  onAvatarChange?: (url: string) => void;
}

const sidebarVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
} as const;

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      type: "spring" as const,
      stiffness: 100,
      damping: 15,
    },
  },
};

export const UserProfileSidebar = React.forwardRef<HTMLDivElement, UserProfileSidebarProps>(
  ({ user, navItems, logoutItem, activeSection, className, onAvatarChange }, ref) => {
    const location = useLocation();
    const { toast } = useToast();
    const [uploading, setUploading] = React.useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file || !user.userId) return;

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please upload an image file",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please upload an image smaller than 5MB",
          variant: "destructive",
        });
        return;
      }

      setUploading(true);

      try {
        const fileExt = file.name.split('.').pop();
        const filePath = `${user.userId}/avatar.${fileExt}`;

        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, file, { upsert: true });

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);

        // Add cache-busting query param
        const avatarUrl = `${publicUrl}?t=${Date.now()}`;

        // Update or insert profile
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            user_id: user.userId,
            avatar_url: avatarUrl,
          }, { onConflict: 'user_id' });

        if (profileError) throw profileError;

        onAvatarChange?.(avatarUrl);

        toast({
          title: "Avatar updated",
          description: "Your profile picture has been updated",
        });
      } catch (error) {
        console.error('Error uploading avatar:', error);
        toast({
          title: "Upload failed",
          description: "Failed to upload avatar. Please try again.",
          variant: "destructive",
        });
      } finally {
        setUploading(false);
      }
    };
    
    return (
      <motion.aside
        ref={ref}
        variants={sidebarVariants}
        initial="hidden"
        animate="visible"
        className={cn(
          'flex h-fit w-64 flex-col rounded-2xl border border-border bg-card p-4 shadow-elegant',
          className
        )}
      >
        {/* User Info Header */}
        <motion.div variants={itemVariants} className="flex items-center gap-3 pb-4">
          <div className="relative group">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="h-12 w-12 rounded-full object-cover ring-2 ring-primary/20"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-hero text-lg font-semibold text-white">
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
            {/* Upload overlay */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100 cursor-pointer"
            >
              {uploading ? (
                <Loader2 className="h-5 w-5 text-white animate-spin" />
              ) : (
                <Camera className="h-5 w-5 text-white" />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="truncate font-semibold text-foreground">{user.name}</p>
            <p className="truncate text-sm text-muted-foreground">{user.email}</p>
          </div>
        </motion.div>

        <div className="my-2 h-px bg-border" />

        {/* Navigation Links */}
        <nav className="flex-1 space-y-1 py-2">
          {navItems.map((item, index) => (
            <motion.div key={index} variants={itemVariants}>
              {item.isSeparator && <div className="my-3 h-px bg-border" />}
              {item.href ? (
                <Link
                  to={item.href}
                  className={cn(
                    'group flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                    location.pathname === item.href
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground hover:bg-accent'
                  )}
                >
                  <span className="flex items-center gap-3">
                    {item.icon}
                    {item.label}
                  </span>
                  <ChevronRight className={cn(
                    'h-4 w-4 opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-0.5',
                    location.pathname === item.href && 'opacity-100'
                  )} />
                </Link>
              ) : (
                <button
                  onClick={item.onClick}
                  className={cn(
                    'group flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                    item.isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground hover:bg-accent'
                  )}
                >
                  <span className="flex items-center gap-3">
                    {item.icon}
                    {item.label}
                  </span>
                  <ChevronRight className={cn(
                    'h-4 w-4 opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-0.5',
                    item.isActive && 'opacity-100'
                  )} />
                </button>
              )}
            </motion.div>
          ))}
        </nav>

        {/* Logout Button */}
        <motion.div variants={itemVariants} className="pt-2">
          <button
            onClick={logoutItem.onClick}
            className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-destructive transition-all duration-200 hover:bg-destructive/10"
          >
            {logoutItem.icon}
            {logoutItem.label}
          </button>
        </motion.div>
      </motion.aside>
    );
  }
);

UserProfileSidebar.displayName = 'UserProfileSidebar';
