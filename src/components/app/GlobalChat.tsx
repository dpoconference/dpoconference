import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { ImagePlus, MessageSquare, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/app/PageHeader";
import { PageSkeleton } from "@/components/app/PageSkeleton";
import { apiGet, apiPost } from "@/lib/api";
import { notify } from "@/lib/toast";

const MAX_MEDIA_BYTES = 300 * 1024;
const ACCEPTED_MEDIA_TYPES = ["image/jpeg", "image/png", "image/webp"];

type GroupChatMessage = {
  id: string;
  body: string;
  mediaUrl: string | null;
  mediaMime: string | null;
  mediaBytes: number | null;
  createdAt: string;
  sender: { id: string; name: string; avatarUrl: string | null; role: string };
};

export function GlobalChat() {
  const [body, setBody] = useState("");
  const [media, setMedia] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const mediaInput = useRef<HTMLInputElement>(null);
  const bottom = useRef<HTMLDivElement>(null);
  const messagesQuery = useQuery({
    queryKey: ["global-chat-messages"],
    queryFn: () => apiGet<GroupChatMessage[]>("/portal/chat/messages"),
    refetchInterval: 5_000,
  });

  const messages = messagesQuery.data ?? [];
  const newestMessageId = messages[messages.length - 1]?.id;

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth" });
  }, [newestMessageId]);

  function chooseMedia(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0] ?? null;
    if (!file) return;
    if (!ACCEPTED_MEDIA_TYPES.includes(file.type)) {
      notify.error("Choose a JPEG, PNG, or WebP image.");
      event.currentTarget.value = "";
      return;
    }
    if (file.size > MAX_MEDIA_BYTES) {
      notify.error("Images must be 300 KB or smaller.");
      event.currentTarget.value = "";
      return;
    }
    setMedia(file);
  }

  function clearMedia() {
    setMedia(null);
    if (mediaInput.current) mediaInput.current.value = "";
  }

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = body.trim();
    if (!text && !media) return;

    const form = new FormData();
    form.set("body", text);
    if (media) form.set("media", media);

    setSending(true);
    try {
      await apiPost<GroupChatMessage>("/portal/chat/messages", form);
      setBody("");
      clearMedia();
      await messagesQuery.refetch();
    } catch (error) {
      notify.error(error instanceof Error ? error.message : "Could not send your message.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={MessageSquare}
        title="Group chat"
        subtitle="One shared room for members, staff, and administrators. Messages refresh automatically."
      />

      <section aria-label="Shared group chat" className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between gap-4 border-b border-border px-4 py-3">
          <div>
            <h2 className="font-semibold">Everyone</h2>
            <p className="text-xs text-muted-foreground">Visible to signed-in users</p>
          </div>
          <span className="text-xs text-muted-foreground">Latest 100 messages</span>
        </div>

        <div className="max-h-[55vh] min-h-72 space-y-4 overflow-y-auto p-4" aria-live="polite">
          {messagesQuery.isPending ? <PageSkeleton /> : null}
          {messagesQuery.isError ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm">
              <p>Could not load group chat.</p>
              <Button type="button" variant="outline" size="sm" className="mt-3" onClick={() => void messagesQuery.refetch()}>
                Try again
              </Button>
            </div>
          ) : null}
          {messages.map((message) => (
            <article key={message.id} className="flex gap-3">
              {message.sender.avatarUrl ? (
                <img src={message.sender.avatarUrl} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" />
              ) : (
                <span aria-hidden="true" className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[color:var(--brand-tint)] text-xs font-semibold text-[color:var(--brand-deep)]">
                  {message.sender.name.slice(0, 1).toUpperCase()}
                </span>
              )}
              <div className="min-w-0 max-w-[min(90%,42rem)] rounded-lg bg-muted/70 px-3 py-2">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <p className="text-sm font-semibold">{message.sender.name}</p>
                  <p className="text-[10px] uppercase text-muted-foreground">{message.sender.role.replaceAll("_", " ")}</p>
                  <time className="text-[10px] text-muted-foreground" dateTime={message.createdAt}>
                    {new Date(message.createdAt).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" })}
                  </time>
                </div>
                {message.body ? <p className="mt-1 whitespace-pre-wrap break-words text-sm">{message.body}</p> : null}
                {message.mediaUrl ? (
                  <a href={message.mediaUrl} target="_blank" rel="noreferrer" className="mt-2 block w-fit max-w-full">
                    <img src={message.mediaUrl} alt="Chat attachment" className="max-h-72 max-w-full rounded-md object-contain" loading="lazy" />
                  </a>
                ) : null}
              </div>
            </article>
          ))}
          {!messagesQuery.isPending && !messagesQuery.isError && messages.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">No messages yet. Start the conversation.</p>
          ) : null}
          <div ref={bottom} />
        </div>

        <form onSubmit={sendMessage} className="border-t border-border p-3 sm:p-4">
          {media ? (
            <div className="mb-3 flex items-center gap-2 rounded-md bg-muted px-3 py-2 text-xs">
              <ImagePlus className="h-4 w-4 shrink-0" />
              <span className="min-w-0 flex-1 truncate">{media.name} · {(media.size / 1024).toFixed(0)} KB</span>
              <button type="button" onClick={clearMedia} aria-label="Remove image" className="rounded p-1 hover:bg-background">
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : null}
          <div className="flex items-end gap-2">
            <label className="grid h-11 w-11 shrink-0 cursor-pointer place-items-center rounded-md border border-input hover:bg-accent" title="Attach image (max 300 KB)">
              <ImagePlus className="h-4 w-4" />
              <span className="sr-only">Attach image, maximum 300 KB</span>
              <input
                ref={mediaInput}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={chooseMedia}
              />
            </label>
            <textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              maxLength={4000}
              rows={2}
              placeholder="Write to everyone…"
              aria-label="Write a group chat message"
              className="min-h-11 min-w-0 flex-1 resize-y rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <Button type="submit" loading={sending} disabled={sending || (!body.trim() && !media)} aria-label="Send message" className="h-11 w-11 shrink-0 px-0">
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">JPEG, PNG, or WebP images up to 300 KB.</p>
        </form>
      </section>
    </div>
  );
}