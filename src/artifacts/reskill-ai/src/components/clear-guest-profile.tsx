import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { customFetch } from "@workspace/api-client-react";
import { setActiveProfile } from "@/lib/fmt";
import { useT } from "@/i18n";
import { getObProfile, setObProfile, clearDraft } from "@/lib/onboarding";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { ErrorBox } from "./kit";
export function ClearGuestProfile({ id, name }: { id: number; name: string }) {
  const { lang, t } = useT(),
    qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const w =
    lang === "ms"
      ? {
          clear: "Padam profil",
          title: "Padam profil tetamu ini?",
          body: "Profil, pelan dan kemajuan yang disimpan pada peranti ini akan dipadam.",
        }
      : lang === "zh"
        ? {
            clear: "清除资料",
            title: "清除此访客资料？",
            body: "将删除此设备保存的资料、计划及学习进度。",
          }
        : {
            clear: "Clear profile",
            title: "Clear this guest profile?",
            body: "This device’s saved profile, plan and progress will be removed.",
          };
  const mutation = useMutation({
    mutationFn: () => customFetch(`/api/profiles/${id}`, { method: "DELETE" }),
    onSuccess: async () => {
      if (getObProfile("guest") === id) setObProfile("guest", null);
      clearDraft("guest", id);
      setActiveProfile(null);
      await qc.invalidateQueries();
      setOpen(false);
    },
  });
  return (
    <>
      <Button
        variant="outline"
        className="min-h-11 shrink-0 gap-2 text-xs"
        aria-label={`${w.clear}: ${name}`}
        onClick={() => setOpen(true)}
      >
        <Trash2 className="h-4 w-4" />
        <span className="hidden sm:inline">{w.clear}</span>
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-2xl p-5 sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{w.title}</DialogTitle>
            <DialogDescription>{w.body}</DialogDescription>
          </DialogHeader>
          <p className="font-semibold">{name}</p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="min-h-11 flex-1"
              onClick={() => setOpen(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button
              variant="destructive"
              className="min-h-11 flex-1"
              disabled={mutation.isPending}
              onClick={() => mutation.mutate()}
            >
              {w.clear}
            </Button>
          </div>
          {mutation.isError && <ErrorBox error={mutation.error} />}
        </DialogContent>
      </Dialog>
    </>
  );
}
