import type { Editor } from "@tiptap/core";

/**
 * Bitta "Kod" tugmasi o'zi aniqlaydi: kod ichida bo'lsa — kodni o'chiradi; bir qator matn belgilangan bo'lsa — qator ichidagi kod;
 * belgilanmagan yoki bir necha qator/abzats belgilangan bo'lsa — kod bloki.
 */
export function toggleSmartCode(editor: Editor): void {
  const chain = editor.chain().focus();
  if (editor.isActive("codeBlock")) {
    chain.toggleCodeBlock().run();
    return;
  }
  if (editor.isActive("code")) {
    chain.toggleCode().run();
    return;
  }
  const { doc, selection } = editor.state;
  // Bitta abzats (matn bloki) ichida belgilangan bo'lsa — qator ichida; butun hujjat yoki bir necha abzats — blok
  const oneLine =
    !selection.empty &&
    selection.$from.parent.isTextblock &&
    selection.$from.sameParent(selection.$to) &&
    !doc.textBetween(selection.from, selection.to).includes("\n");
  if (oneLine) {
    chain.toggleCode().run();
    return;
  }
  // Bir necha abzats belgilangan bo'lsa ular BITTA kod blokiga birlashadi (har abzats alohida blok bo'lib ketmasin)
  const text = selection.empty ? "" : doc.textBetween(selection.from, selection.to, "\n");
  if (text.trim()) {
    chain
      .insertContentAt({ from: selection.from, to: selection.to }, { type: "codeBlock", attrs: { language: "python" }, content: [{ type: "text", text }] })
      .run();
  } else chain.setCodeBlock({ language: "python" }).run();
}
