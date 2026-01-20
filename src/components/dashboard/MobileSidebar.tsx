import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Camera, Loader2, Menu } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
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

interface MobileSidebarProps {
  user: UserProfile;
  navItems: NavItem[];
  logoutItem: {
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
  };
  onAvatarChange?: (url: string) => void;
}

export const MobileSidebar = ({ user, navItems, logoutItem, onAvatarChange }: MobileSidebarProps) => {
  const [open, setOpen] = React.useState(false);
  const location = useLocation();
  const { toast } = useToast();
  const [uploading, setUploading] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user.userId) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file",
        variant: "destructive",
      });
      return;
    }

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

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const avatarUrl = `${publicUrl}?t=${Date.now()}`;

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

  const handleNavClick = (item: NavItem) => {
    if (item.onClick) {
      item.onClick();
    }
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="lg:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] p-0">
        <div className="flex h-full flex-col p-4">
          {/* User Info Header */}
          <div className="flex items-center gap-3 pb-4">
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
          </div>

          <div className="my-2 h-px bg-border" />

          {/* Navigation Links */}
          <nav className="flex-1 space-y-1 py-2">
            {navItems.map((item, index) => (
              <div key={index}>
                {item.isSeparator && <div className="my-3 h-px bg-border" />}
                {item.href ? (
                  <Link
                    to={item.href}
                    onClick={() => setOpen(false)}
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
                    <ChevronRight className="h-4 w-4 opacity-50" />
                  </Link>
                ) : (
                  <button
                    onClick={() => handleNavClick(item)}
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
                    <ChevronRight className="h-4 w-4 opacity-50" />
                  </button>
                )}
              </div>
            ))}
          </nav>

          {/* Logout Button */}
          <div className="pt-2 border-t">
            <button
              onClick={() => {
                logoutItem.onClick();
                setOpen(false);
              }}
              className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-destructive transition-all duration-200 hover:bg-destructive/10"
            >
              {logoutItem.icon}
              {logoutItem.label}
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
