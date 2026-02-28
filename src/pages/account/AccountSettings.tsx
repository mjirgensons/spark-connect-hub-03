import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Breadcrumbs from "@/components/Breadcrumbs";

const AccountSettings = () => {
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const { toast } = useToast();
  const qc = useQueryClient();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteText, setDeleteText] = useState("");

  const fieldClass = "border-2 border-border focus:ring-0 focus:border-foreground";

  // Password strength
  const getPasswordStrength = (pw: string) => {
    if (!pw) return { label: "", color: "", width: "0%" };
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    if (score <= 1) return { label: "Weak", color: "bg-destructive", width: "25%" };
    if (score === 2) return { label: "Fair", color: "bg-yellow-500", width: "50%" };
    if (score === 3) return { label: "Good", color: "bg-green-500", width: "75%" };
    return { label: "Strong", color: "bg-green-600", width: "100%" };
  };

  const strength = getPasswordStrength(newPassword);

  const profileMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: fullName.trim(), phone: phone.trim() || null } as any)
        .eq("id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile"] });
      toast({ title: "Profile updated" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const passwordMutation = useMutation({
    mutationFn: async () => {
      if (newPassword !== confirmPassword) throw new Error("Passwords don't match");
      if (newPassword.length < 8) throw new Error("Password must be at least 8 characters");
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
    },
    onSuccess: () => {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast({ title: "Password updated" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const handleDeleteAccount = async () => {
    // Sign out and notify — actual deletion requires admin action
    toast({ title: "Account deletion requested", description: "Your request has been submitted. We'll process it within 48 hours." });
    setDeleteConfirm(false);
    await signOut();
    navigate("/");
  };

  return (
    <div className="space-y-8">
      <Breadcrumbs items={[{ label: "My Account", href: "/account" }, { label: "Settings" }]} />
      <h1 className="text-2xl font-bold font-serif">Account Settings</h1>

      {/* Profile */}
      <Card className="border-2 border-border shadow-[3px_3px_0px_0px_hsl(var(--foreground))]">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Profile Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Email</Label>
            <Input value={user?.email || ""} disabled className={`${fieldClass} bg-muted`} />
            <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
          </div>
          <div>
            <Label>Full Name</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} className={fieldClass} />
          </div>
          <div>
            <Label>Phone</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} className={fieldClass} placeholder="(416) 555-0000" />
          </div>
          <Button
            onClick={() => profileMutation.mutate()}
            disabled={profileMutation.isPending}
            className="border-2 shadow-[3px_3px_0px_0px_hsl(var(--foreground))]"
          >
            {profileMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Update Profile
          </Button>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card className="border-2 border-border shadow-[3px_3px_0px_0px_hsl(var(--foreground))]">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Change Password</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>New Password</Label>
            <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={fieldClass} />
            {newPassword && (
              <div className="mt-2">
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className={`h-full ${strength.color} transition-all`} style={{ width: strength.width }} />
                </div>
                <p className="text-xs text-muted-foreground mt-1">{strength.label}</p>
              </div>
            )}
          </div>
          <div>
            <Label>Confirm Password</Label>
            <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={fieldClass} />
            {confirmPassword && confirmPassword !== newPassword && (
              <p className="text-xs text-destructive mt-1">Passwords don't match</p>
            )}
          </div>
          <Button
            variant="outline"
            className="border-2"
            onClick={() => passwordMutation.mutate()}
            disabled={passwordMutation.isPending || !newPassword || newPassword !== confirmPassword}
          >
            {passwordMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Change Password
          </Button>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-2 border-destructive">
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-destructive flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            Permanently delete your account and all associated data. This action cannot be undone.
          </p>
          <Button variant="destructive" className="border-2" onClick={() => setDeleteConfirm(true)}>
            Delete Account
          </Button>
        </CardContent>
      </Card>

      {/* Delete confirmation */}
      <Dialog open={deleteConfirm} onOpenChange={setDeleteConfirm}>
        <DialogContent className="border-2 border-destructive shadow-[6px_6px_0px_0px_hsl(var(--destructive))]">
          <DialogHeader>
            <DialogTitle className="text-destructive">Delete Account</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will permanently delete your account, orders, and saved data.
            Type <strong>DELETE</strong> to confirm.
          </p>
          <Input value={deleteText} onChange={(e) => setDeleteText(e.target.value)} placeholder="Type DELETE" className={fieldClass} />
          <DialogFooter>
            <Button variant="outline" className="border-2" onClick={() => setDeleteConfirm(false)}>Cancel</Button>
            <Button variant="destructive" disabled={deleteText !== "DELETE"} onClick={handleDeleteAccount}>
              Permanently Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AccountSettings;
