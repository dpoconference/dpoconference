import { useRef, useState } from "react";
import type { Editor } from "@tiptap/react";
import { Button } from "@/components/ui/button";
import { apiUpload } from "@/lib/upload";
import { notify } from "@/lib/toast";
import { RichTextEditor } from "@/components/app/RichTextEditor";

type Props = {
  coverUrl: string;
  bodyHtml: string;
  onCoverChange: (url: string) => void;
  onBodyChange: (html: string) => void;
  folder?: string;
  bodyLabel?: string;
  coverLabel?: string;
};

export function RichMediaFields({
  coverUrl,
  bodyHtml,
  onCoverChange,
  onBodyChange,
  folder = "ndpo/cms",
  bodyLabel = "Details",
  coverLabel = "Cover / banner image",
}: Props) {
  const coverRef = useRef<HTMLInputElement>(null);
  const inlineRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<Editor | null>(null);
  const [busy, setBusy] = useState<"cover" | "inline" | null>(null);

  async function upload(kind: "cover" | "inline", file: File | undefined) {
    if (!file) return;
    setBusy(kind);
    try {
      const uploaded = await apiUpload(file, folder);
      if (kind === "cover") {
        onCoverChange(uploaded.url);
      } else if (editorRef.current) {
        editorRef.current.chain().focus().setImage({ src: uploaded.url }).run();
      } else {
        onBodyChange(`${bodyHtml}<p><img src="${uploaded.url}" alt="" /></p>`);
      }
      notify.success(kind === "cover" ? "Cover uploaded." : "Image inserted.");
    } catch (err) {
      notify.error(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">{coverLabel}</p>
        {coverUrl ? (
          <img src={coverUrl} alt="" className="h-32 w-full rounded-lg border object-cover" />
        ) : (
          <div className="flex h-24 items-center justify-center rounded-lg border border-dashed text-xs text-muted-foreground">
            No cover yet
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          <input
            ref={coverRef}
            type="file"
            accept="image/jpeg,image/png"
            className="hidden"
            onChange={(e) => void upload("cover", e.target.files?.[0])}
          />
          <Button type="button" size="sm" variant="outline" loading={busy === "cover"} onClick={() => coverRef.current?.click()}>
            Upload cover
          </Button>
          {coverUrl && (
            <Button type="button" size="sm" variant="ghost" onClick={() => onCoverChange("")}>
              Remove
            </Button>
          )}
        </div>
        <input
          className="w-full rounded-md border px-3 py-2 text-xs"
          placeholder="Or paste image URL"
          value={coverUrl}
          onChange={(e) => onCoverChange(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">{bodyLabel}</p>
        <input
          ref={inlineRef}
          type="file"
          accept="image/jpeg,image/png"
          className="hidden"
          onChange={(e) => void upload("inline", e.target.files?.[0])}
        />
        <RichTextEditor
          value={bodyHtml}
          onChange={onBodyChange}
          editorRef={editorRef}
          onRequestImage={() => inlineRef.current?.click()}
          placeholder="Write with headings, bold, italics, lists and links…"
        />
        {busy === "inline" ? <p className="text-xs text-muted-foreground">Uploading image…</p> : null}
      </div>
    </div>
  );
}
