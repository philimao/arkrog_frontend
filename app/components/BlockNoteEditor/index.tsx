import "@blocknote/core/fonts/inter.css";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import * as locales from "@blocknote/core/locales";
import "@blocknote/mantine/style.css";
import { useEffect, useState } from "react";
import { Button } from "@heroui/react";
import { MantineProvider } from "@mantine/core";
import "@mantine/core/styles.css";

interface BlockNoteEditorProps {
  initialMarkdown: string;
  onSave: (markdown: string) => void;
  onCancel: () => void;
}

export default function BlockNoteEditor({ initialMarkdown, onSave, onCancel }: BlockNoteEditorProps) {
  // Creates a new editor instance.
  const editor = useCreateBlockNote({
    dictionary: locales.zh,
  });
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    async function loadContent() {
      if (editor) {
        const blocks = await editor.tryParseMarkdownToBlocks(initialMarkdown || "");
        editor.replaceBlocks(editor.document, blocks);
        setIsLoaded(true);
      }
    }
    loadContent();
  }, [editor, initialMarkdown]);

  const handleSave = async () => {
    const markdown = await editor.blocksToMarkdownLossy(editor.document);
    onSave(markdown);
  };

  if (!isLoaded) {
    return <div>Loading editor...</div>;
  }

  return (
    <MantineProvider forceColorScheme="dark">
      <div className="flex flex-col h-[600px] w-full bg-[#18181b] rounded-md">
        <div className="flex-grow border border-white/10 rounded-md overflow-y-auto mb-4 p-2 blocknote-container bg-[#1f1f1f]">
          <BlockNoteView editor={editor} theme="dark" />
        </div>
        <div className="flex justify-end gap-2">
          <Button color="danger" variant="light" onPress={onCancel}>
            取消
          </Button>
          <Button color="primary" onPress={handleSave}>
            保存
          </Button>
        </div>
      </div>
    </MantineProvider>
  );
}
