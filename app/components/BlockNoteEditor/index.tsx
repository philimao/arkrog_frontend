import "@blocknote/core/fonts/inter.css";
import {
  getDefaultReactSlashMenuItems,
  SuggestionMenuController,
  useCreateBlockNote,
} from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import * as locales from "@blocknote/core/locales";
import { filterSuggestionItems } from "@blocknote/core";
import "@blocknote/mantine/style.css";
import { useEffect, useState } from "react";
import { Button } from "@heroui/react";
import { MantineProvider } from "@mantine/core";
import "@mantine/core/styles.css";
import { useStorageStore } from "~/stores/storageStore";
import { openModal } from "~/utils/dom";
import { AttachmentIcon } from "~/components/Icons";

interface BlockNoteEditorProps {
  initialMarkdown: string;
  onSave: (markdown: string) => void;
  onChange?: (content: string) => void;
  onCancel: () => void;
}

export default function BlockNoteEditor({
  initialMarkdown,
  onSave,
  onCancel,
  onChange,
}: BlockNoteEditorProps) {
  const {
    uploadDirectory,
    setUploadDirectory,
    setUploadLabel,
    setOnUploadedItemClick,
  } = useStorageStore();

  // Creates a new editor instance.
  const editor = useCreateBlockNote({
    dictionary: locales.zh,
  });
  const [isLoaded, setIsLoaded] = useState(false);

  const focusEditor = () => {
    // 让聚焦在本次鼠标事件之后发生，避免被默认行为抢焦点。
    requestAnimationFrame(() => {
      editor.focus();
    });
  };

  useEffect(() => {
    async function loadContent() {
      if (editor) {
        const blocks = await editor.tryParseMarkdownToBlocks(
          initialMarkdown || "",
        );
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

  const handleChange = async () => {
    if (!onChange) return;
    const markdown = await editor.blocksToMarkdownLossy(editor.document);
    onChange(markdown);
  };

  const getCustomSlashMenuItems = (editor: any) => {
    const defaultItems = getDefaultReactSlashMenuItems(editor);
    const uploadImageItem = {
      aliases: ["upload", "cos", "tc"],
      group: "上传",
      icon: <AttachmentIcon width="1em" height="1em" />,
      key: "upload-center",
      onItemClick: () => {
        setUploadLabel("其他内容");
        setUploadDirectory(uploadDirectory);
        setOnUploadedItemClick((item) => {
          const currentBlock = editor.getTextCursorPosition().block;
          const name = (
            item.url.match(/\/([^/]+?)\.\w+$/)?.[1] || "_图片"
          ).split("_")[1];
          // If current block is empty paragraph, replace it. Otherwise insert after.
          if (
            currentBlock.type === "paragraph" &&
            (!currentBlock.content || currentBlock.content.length === 0)
          ) {
            editor.replaceBlocks(
              [currentBlock.id],
              [{ type: "image", props: { name, url: item.url } }],
            );
          } else {
            editor.insertBlocks(
              [{ type: "image", props: { name, url: item.url } }],
              currentBlock,
              "after",
            );
          }
        });
        openModal("upload-center");
      },
      title: "图床上传",
      subtext: "从上传中心选择图片",
    };
    defaultItems.splice(0, 0, uploadImageItem);
    return defaultItems;
  };

  if (!isLoaded) {
    return <div>Loading editor...</div>;
  }

  return (
    <MantineProvider forceColorScheme="dark">
      <div className="flex flex-col h-full w-full bg-[#18181b] rounded-md">
        <div
          className="flex-grow border border-white/10 rounded-md overflow-y-auto mb-4 p-2 blocknote-container bg-[#1f1f1f]"
          onMouseDown={(e) => {
            // 只在点击容器空白/padding 处时触发；点击编辑器内部不要干预光标/选区行为。
            if (e.target !== e.currentTarget) return;
            focusEditor();
          }}
        >
          <BlockNoteView
            editor={editor}
            theme="dark"
            slashMenu={false}
            onChange={handleChange}
          >
            <SuggestionMenuController
              triggerCharacter={"/"}
              getItems={async (query) =>
                filterSuggestionItems(getCustomSlashMenuItems(editor), query)
              }
            />
            <SuggestionMenuController
              triggerCharacter={"、"}
              getItems={async (query) =>
                filterSuggestionItems(getCustomSlashMenuItems(editor), query)
              }
            />
          </BlockNoteView>
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
