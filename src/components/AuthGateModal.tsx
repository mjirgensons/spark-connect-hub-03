import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LogIn, UserPlus } from "lucide-react";

interface AuthGateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  redirectTo?: string;
}

const AuthGateModal = ({
  open,
  onOpenChange,
  title = "Sign in to continue",
  description = "You need an account to perform this action.",
  redirectTo,
}: AuthGateModalProps) => {
  const navigate = useNavigate();
  const redirect = redirectTo || window.location.pathname;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-serif">{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 pt-2">
          <Button
            onClick={() => {
              onOpenChange(false);
              navigate(`/login?redirect=${encodeURIComponent(redirect)}`);
            }}
          >
            <LogIn className="w-4 h-4 mr-2" />
            Sign In
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              navigate(`/register?redirect=${encodeURIComponent(redirect)}`);
            }}
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Create Account
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuthGateModal;
