import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";

interface TermsPrivacyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "privacy" | "terms";
}

const CONTENT = {
  privacy: {
    title: "Privacy Policy",
    description: "Your privacy is important to us. POTLAUNCH by POTLOCK does not collect personal data unless explicitly provided by you. All information is handled in accordance with best practices for user privacy and security.",
    body: (
      <>
        <p>POTLAUNCH by POTLOCK is committed to protecting your privacy. We do not collect any personal information unless you voluntarily provide it. Any data you provide is used solely for the purpose of improving your experience on our platform.</p>
        <p>For more information, please refer to our <a href="https://docs.potlaunch.com/" target="_blank" className="underline">documentation</a>.</p>
      </>
    )
  },
  terms: {
    title: "Terms of Use",
    description: "By using POTLAUNCH by POTLOCK, you agree to our terms. Use the platform responsibly and at your own risk. See documentation for more details.",
    body: (
      <>
        <p>By accessing or using POTLAUNCH by POTLOCK, you agree to comply with all applicable laws and regulations. The platform is provided as-is, without warranties of any kind. Use at your own risk.</p>
        <p>For more information, please refer to our <a href="https://docs.potlaunch.com/" target="_blank" className="underline">documentation</a>.</p>
      </>
    )
  }
};

export const TermsPrivacyModal = ({ open, onOpenChange, type }: TermsPrivacyModalProps) => {
  const content = CONTENT[type];
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{content.title}</DialogTitle>
          <DialogDescription>{content.description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          {content.body}
        </div>
      </DialogContent>
    </Dialog>
  );
}; 