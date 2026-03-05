import { useEffect, useMemo, useState } from "react";
import Cropper from "react-easy-crop";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Camera, Loader2, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AssessmentSummary {
  id: string;
  assessment_type: string;
  results: any;
  created_at: string;
}

interface PublicRoleColorProfileSettingsProps {
  userId: string;
  userEmail?: string;
  displayName?: string;
  defaultAvatarUrl?: string;
  assessments: AssessmentSummary[];
}

interface PublicProfileRow {
  username: string;
  is_public: boolean;
  selected_assessment_result_id: string | null;
  theme: string;
  profile_image_url: string | null;
  view_count: number;
}

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 30);

const getColorFromResult = (results: any): string =>
  results?.primaryColor || results?.dominantColor || "red";

const splitName = (value?: string | null) => {
  const cleaned = String(value || "").trim();
  if (!cleaned) {
    return { firstName: "", lastName: "" };
  }

  const pieces = cleaned.split(/\s+/).filter(Boolean);
  if (pieces.length === 1) {
    return { firstName: pieces[0], lastName: "" };
  }

  return {
    firstName: pieces[0],
    lastName: pieces.slice(1).join(" "),
  };
};

const buildFullName = (firstName: string, lastName: string) => {
  const fullName = `${firstName} ${lastName}`.trim();
  return fullName || null;
};

const isPublicProfilesUnavailableError = (error: any) => {
  const message = String(error?.message || "").toLowerCase();
  const details = String(error?.details || "").toLowerCase();
  const code = String(error?.code || "").toLowerCase();

  return (
    message.includes("public_profiles") ||
    message.includes("relation") ||
    message.includes("schema cache") ||
    message.includes("permission") ||
    message.includes("rls") ||
    details.includes("public_profiles") ||
    details.includes("relation") ||
    code === "pgrst205" ||
    code === "42p01"
  );
};

const getCroppedImageBlob = async (imageSrc: string, pixelCrop: { x: number; y: number; width: number; height: number }) => {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = imageSrc;
  });

  const canvas = document.createElement("canvas");
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not create crop context");

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height,
  );

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Failed to create cropped image"));
        return;
      }
      resolve(blob);
    }, "image/jpeg", 0.92);
  });
};

export default function PublicRoleColorProfileSettings({
  userId,
  userEmail,
  displayName,
  defaultAvatarUrl,
  assessments,
}: PublicRoleColorProfileSettingsProps) {
  const { toast } = useToast();
  const defaultNameParts = splitName(displayName || userEmail?.split("@")[0] || "");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [firstName, setFirstName] = useState(defaultNameParts.firstName);
  const [lastName, setLastName] = useState(defaultNameParts.lastName);

  const [profile, setProfile] = useState<PublicProfileRow>({
    username: slugify(userEmail?.split("@")[0] || "rolecolor-user"),
    is_public: true,
    selected_assessment_result_id: null,
    theme: "classic",
    profile_image_url: defaultAvatarUrl || null,
    view_count: 0,
  });

  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [publicProfilesAvailable, setPublicProfilesAvailable] = useState<boolean>(
    localStorage.getItem("public_profiles_available") !== "false",
  );

  const hasPremiumAccess = useMemo(
    () => assessments.some((item) => ["premium", "pro", "leadership"].includes(item.assessment_type)),
    [assessments],
  );

  const assessmentOptions = useMemo(
    () => assessments.map((item) => ({
      id: item.id,
      label: `${item.assessment_type.toUpperCase()} • ${new Date(item.created_at).toLocaleDateString()}`,
      color: getColorFromResult(item.results),
    })),
    [assessments],
  );

  const publicUrl = `${window.location.origin}/${profile.username}`;

  const getSelectedAssessment = (selectedId: string | null) => {
    if (selectedId) {
      return assessments.find((item) => item.id === selectedId) || assessments[0] || null;
    }
    return assessments[0] || null;
  };

  const persistLocalPublicProfile = (nextProfile: PublicProfileRow) => {
    const selectedAssessment = getSelectedAssessment(nextProfile.selected_assessment_result_id);
    const localPayload = {
      username: nextProfile.username.toLowerCase(),
      is_public: nextProfile.is_public,
      theme: nextProfile.theme,
      profile_image_url: nextProfile.profile_image_url,
      view_count: nextProfile.view_count || 0,
      person: {
        full_name: buildFullName(firstName, lastName) || displayName || userEmail?.split("@")[0] || null,
        avatar_url: nextProfile.profile_image_url || defaultAvatarUrl || null,
      },
      assessment: selectedAssessment || null,
      updated_at: new Date().toISOString(),
    };

    localStorage.setItem(`public_profile_${nextProfile.username.toLowerCase()}`, JSON.stringify(localPayload));
    localStorage.setItem(`public_profile_user_${userId}`, nextProfile.username.toLowerCase());
  };

  const markPublicProfilesAvailability = (available: boolean) => {
    setPublicProfilesAvailable(available);
    localStorage.setItem("public_profiles_available", available ? "true" : "false");
  };

  const probePublicProfilesAvailability = async (): Promise<boolean> => {
    try {
      const { error } = await (supabase as any)
        .from("public_profiles")
        .select("id")
        .limit(1);

      if (error && isPublicProfilesUnavailableError(error)) {
        return false;
      }

      return true;
    } catch (error) {
      return !isPublicProfilesUnavailableError(error);
    }
  };

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const { data: accountProfile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("user_id", userId)
          .maybeSingle();

        if (accountProfile?.full_name) {
          const accountNameParts = splitName(accountProfile.full_name);
          setFirstName(accountNameParts.firstName);
          setLastName(accountNameParts.lastName);
        }
      } catch {
        // keep fallback from display name/email
      }

      if (!publicProfilesAvailable) {
        const availableNow = await probePublicProfilesAvailability();
        if (availableNow) {
          markPublicProfilesAvailability(true);
          setLoading(false);
          return;
        }

        const cachedUsername = localStorage.getItem(`public_profile_user_${userId}`);
        if (cachedUsername) {
          const cachedRaw = localStorage.getItem(`public_profile_${cachedUsername}`);
          if (cachedRaw) {
            const cached = JSON.parse(cachedRaw);
            setProfile((prev) => ({
              ...prev,
              username: cached.username || prev.username,
              is_public: cached.is_public ?? prev.is_public,
              theme: cached.theme || prev.theme,
              profile_image_url: cached.profile_image_url || prev.profile_image_url,
              view_count: cached.view_count || 0,
            }));
          }
        }
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await (supabase as any)
          .from("public_profiles")
          .select("username, is_public, selected_assessment_result_id, theme, profile_image_url, view_count")
          .eq("user_id", userId)
          .maybeSingle();

        if (error) {
          if (isPublicProfilesUnavailableError(error)) {
            markPublicProfilesAvailability(false);
          }
          throw error;
        }

        markPublicProfilesAvailability(true);

        if (data) {
          const loadedProfile = {
            username: data.username,
            is_public: data.is_public,
            selected_assessment_result_id: data.selected_assessment_result_id,
            theme: data.theme || "classic",
            profile_image_url: data.profile_image_url || defaultAvatarUrl || null,
            view_count: data.view_count || 0,
          };
          setProfile(loadedProfile);
          persistLocalPublicProfile(loadedProfile);
        } else {
          const cachedUsername = localStorage.getItem(`public_profile_user_${userId}`);
          if (cachedUsername) {
            const cachedRaw = localStorage.getItem(`public_profile_${cachedUsername}`);
            if (cachedRaw) {
              const cached = JSON.parse(cachedRaw);
              setProfile((prev) => ({
                ...prev,
                username: cached.username || prev.username,
                is_public: cached.is_public ?? prev.is_public,
                theme: cached.theme || prev.theme,
                profile_image_url: cached.profile_image_url || prev.profile_image_url,
                view_count: cached.view_count || 0,
              }));
            }
          }
        }
      } catch (error) {
        if (!isPublicProfilesUnavailableError(error)) {
          console.error("Failed to load public profile", error);
        }
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [defaultAvatarUrl, publicProfilesAvailable, userId]);

  const checkUsernameAvailability = async (username: string) => {
    if (!username || username.length < 3) return;
    if (!publicProfilesAvailable) {
      setUsernameAvailable(null);
      return;
    }

    setCheckingUsername(true);
    try {
      const { data, error } = await (supabase as any)
        .from("public_profiles")
        .select("user_id")
        .eq("username", username)
        .maybeSingle();

      if (error) {
        if (isPublicProfilesUnavailableError(error)) {
          markPublicProfilesAvailability(false);
          setUsernameAvailable(null);
          return;
        }
        throw error;
      }

      setUsernameAvailable(!data || data.user_id === userId);
    } catch {
      setUsernameAvailable(null);
    } finally {
      setCheckingUsername(false);
    }
  };

  const onSelectPhoto = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please select an image.", variant: "destructive" });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setCropImageSrc(reader.result as string);
      setCropDialogOpen(true);
      setZoom(1);
      setCrop({ x: 0, y: 0 });
    };
    reader.readAsDataURL(file);
  };

  const saveCroppedPhoto = async () => {
    if (!cropImageSrc || !croppedAreaPixels) return;

    setUploadingPhoto(true);
    try {
      const blob = await getCroppedImageBlob(cropImageSrc, croppedAreaPixels);
      const filePath = `${userId}/profile-${Date.now()}.jpg`;

      let usedBucket = "public-profile-photos";
      let uploadResult = await supabase.storage
        .from(usedBucket)
        .upload(filePath, blob, { upsert: true, contentType: "image/jpeg" });

      if (uploadResult.error && uploadResult.error.message?.toLowerCase().includes("bucket")) {
        usedBucket = "avatars";
        uploadResult = await supabase.storage
          .from(usedBucket)
          .upload(filePath, blob, { upsert: true, contentType: "image/jpeg" });
      }

      let imageUrl = "";

      if (uploadResult.error) {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
        imageUrl = dataUrl;
      } else {
        const { data: urlData } = supabase.storage.from(usedBucket).getPublicUrl(filePath);
        imageUrl = `${urlData.publicUrl}?t=${Date.now()}`;
      }

      await supabase
        .from("profiles")
        .upsert(
          {
            user_id: userId,
            avatar_url: imageUrl,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" },
        );

      if (publicProfilesAvailable) {
        try {
          const { error } = await (supabase as any)
            .from("public_profiles")
            .update({
              profile_image_url: imageUrl,
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", userId);

          if (error && isPublicProfilesUnavailableError(error)) {
            markPublicProfilesAvailability(false);
          }
        } catch {
          // keep local fallback path
        }
      }

      const updatedProfile = { ...profile, profile_image_url: imageUrl };
      setProfile(updatedProfile);
      persistLocalPublicProfile(updatedProfile);
      setCropDialogOpen(false);
      setCropImageSrc(null);

      toast({
        title: "Profile photo updated",
        description: uploadResult.error
          ? "Cropped image saved without storage bucket dependency."
          : (usedBucket === "avatars"
              ? "Cropped image saved using existing avatar storage."
              : "Cropped image is ready."),
      });
    } catch (error: any) {
      toast({ title: "Upload failed", description: error?.message || "Could not upload image", variant: "destructive" });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const saveSettings = async () => {
    const cleanedUsername = slugify(profile.username);
    const accountFullName = buildFullName(firstName, lastName);

    if (cleanedUsername.length < 3) {
      toast({ title: "Invalid URL", description: "Username must be at least 3 characters.", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      await supabase
        .from("profiles")
        .upsert(
          {
            user_id: userId,
            full_name: accountFullName,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" },
        );

      try {
        await supabase.auth.updateUser({
          data: {
            full_name: accountFullName,
          },
        });
      } catch {
        // profile table is primary source; metadata update is best-effort
      }

      const payload = {
        user_id: userId,
        username: cleanedUsername,
        is_public: profile.is_public,
        selected_assessment_result_id: profile.selected_assessment_result_id,
        selected_assessment_type: profile.selected_assessment_result_id ? "manual" : "latest",
        theme: hasPremiumAccess ? profile.theme : "classic",
        profile_image_url: profile.profile_image_url,
        updated_at: new Date().toISOString(),
      };

      const nextProfile = {
        ...profile,
        username: cleanedUsername,
        theme: hasPremiumAccess ? profile.theme : "classic",
      };

      if (!publicProfilesAvailable) {
        setProfile(nextProfile);
        setUsernameAvailable(true);
        persistLocalPublicProfile(nextProfile);
        toast({
          title: "Profile saved locally",
          description: "Your public settings are saved in this browser until database sync is available.",
        });
        return;
      }

      const { error } = await (supabase as any)
        .from("public_profiles")
        .upsert(payload, { onConflict: "user_id" });

      if (error) {
        const errorText = String(error?.message || "").toLowerCase();
        const canFallbackLocally =
          isPublicProfilesUnavailableError(error) ||
          errorText.includes("public_profiles") ||
          errorText.includes("relation") ||
          errorText.includes("schema cache") ||
          errorText.includes("permission") ||
          errorText.includes("rls");

        if (!canFallbackLocally) {
          throw error;
        }

        markPublicProfilesAvailability(false);

        setProfile(nextProfile);
        setUsernameAvailable(true);
        persistLocalPublicProfile(nextProfile);

        toast({
          title: "Profile saved locally",
          description: "Your public settings are saved in this browser until database sync is available.",
        });
        return;
      }

      setProfile(nextProfile);
      setUsernameAvailable(true);
      persistLocalPublicProfile(nextProfile);

      toast({ title: "Public profile saved", description: "Your RoleColor social profile is live." });
    } catch (error: any) {
      toast({ title: "Save failed", description: error?.message || "Could not save profile settings", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-10 flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="relative overflow-hidden shadow-lg border-primary/20 bg-gradient-to-br from-primary/10 to-transparent">
        <CardHeader>
          <CardTitle className="text-lg">RoleColor Social Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center gap-4">
            {profile.profile_image_url ? (
              <img src={profile.profile_image_url} alt="Profile" className="w-16 h-16 rounded-full object-cover border" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-primary/20 border flex items-center justify-center text-lg font-bold">
                {(displayName || userEmail || "R").charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <input type="file" accept="image/*" className="hidden" id="public-profile-photo-input" onChange={onSelectPhoto} />
              <Button variant="outline" onClick={() => document.getElementById("public-profile-photo-input")?.click()}>
                <Camera className="w-4 h-4 mr-2" />
                Upload & Crop Photo
              </Button>
              <p className="text-xs text-muted-foreground mt-1">Shown on your public page</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Name</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Input
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                placeholder="First name"
              />
              <Input
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                placeholder="Last name"
              />
            </div>
            <p className="text-xs text-muted-foreground">Auto-synced from your account profile.</p>
          </div>

          <div className="space-y-2">
            <Label>Custom URL</Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground whitespace-nowrap">rolecolorfinder.com/</span>
              <Input
                value={profile.username}
                onChange={(event) => {
                  const value = slugify(event.target.value);
                  setProfile((prev) => ({ ...prev, username: value }));
                  setUsernameAvailable(null);
                }}
                onBlur={() => checkUsernameAvailability(profile.username)}
                placeholder="your-name"
              />
            </div>
            {checkingUsername && <p className="text-xs text-muted-foreground">Checking username...</p>}
            {usernameAvailable === false && <p className="text-xs text-destructive">That URL is already taken.</p>}
            {usernameAvailable === true && <p className="text-xs text-green-600">URL is available.</p>}
          </div>

          <div className="space-y-2">
            <Label>Assessment shown on public page</Label>
            <Select
              value={profile.selected_assessment_result_id || "latest"}
              onValueChange={(value) =>
                setProfile((prev) => ({
                  ...prev,
                  selected_assessment_result_id: value === "latest" ? null : value,
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select assessment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="latest">Latest completed assessment</SelectItem>
                {assessmentOptions.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Profile Theme</Label>
              {!hasPremiumAccess && <Badge variant="outline">Premium</Badge>}
            </div>
            <Select
              value={hasPremiumAccess ? profile.theme : "classic"}
              onValueChange={(value) => setProfile((prev) => ({ ...prev, theme: value }))}
              disabled={!hasPremiumAccess}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="classic">Classic</SelectItem>
                <SelectItem value="midnight">Midnight</SelectItem>
                <SelectItem value="sunset">Sunset</SelectItem>
              </SelectContent>
            </Select>
            {!hasPremiumAccess && (
              <p className="text-xs text-muted-foreground">Custom themes and analytics unlock with Premium/Pro.</p>
            )}
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium">Public profile visibility</p>
              <p className="text-xs text-muted-foreground">Allow anyone with link to view your profile.</p>
            </div>
            <Switch
              checked={profile.is_public}
              onCheckedChange={(value) => setProfile((prev) => ({ ...prev, is_public: value }))}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3 bg-muted/20">
            <div>
              <p className="text-sm font-medium">Profile analytics</p>
              <p className="text-xs text-muted-foreground">Public views</p>
            </div>
            <div className="text-xl font-bold">{hasPremiumAccess ? profile.view_count : "—"}</div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={saveSettings} disabled={saving || usernameAvailable === false}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Public Profile
            </Button>
            <Button variant="outline" onClick={() => window.open(publicUrl, "_blank")}>
              <ExternalLink className="w-4 h-4 mr-2" />
              View Public Page
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={cropDialogOpen} onOpenChange={setCropDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Crop profile photo</DialogTitle>
          </DialogHeader>

          <div className="relative h-80 w-full rounded-lg overflow-hidden bg-black/60">
            {cropImageSrc && (
              <Cropper
                image={cropImageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={(_, croppedPixels) => setCroppedAreaPixels(croppedPixels)}
              />
            )}
          </div>

          <div className="space-y-2">
            <Label>Zoom</Label>
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(event) => setZoom(Number(event.target.value))}
              className="w-full"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setCropDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveCroppedPhoto} disabled={uploadingPhoto}>
              {uploadingPhoto && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Crop
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
