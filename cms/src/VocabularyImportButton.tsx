import { type ChangeEvent, useRef, useState } from "react";
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";
import { Button, CreateButton, TopToolbar, useNotify, useRefresh } from "react-admin";
import { importVocabularyCsv } from "./api";

const importSummary = (result: Awaited<ReturnType<typeof importVocabularyCsv>>) =>
  `Import xong: ${result.wordsCreated} t? m?i, ${result.wordsUpdated} t? c?p nh?t, ` +
  `${result.topicsCreated} ch? d? m?i, ${result.decksCreated} b? d? m?i` +
  (result.skippedRows ? `, b? qua ${result.skippedRows} dòng` : "");

export const VocabularyImportActions = () => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const notify = useNotify();
  const refresh = useRefresh();
  const [importing, setImporting] = useState(false);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setImporting(true);
    try {
      const result = await importVocabularyCsv(file);
      notify(importSummary(result), { type: "success" });
      refresh();
    } catch (error) {
      notify(error instanceof Error ? error.message : "Import CSV th?t b?i", { type: "error" });
    } finally {
      setImporting(false);
    }
  };

  return (
    <TopToolbar>
      <CreateButton />
      <Button
        label={importing ? "Ðang import..." : "Import CSV"}
        disabled={importing}
        onClick={() => inputRef.current?.click()}
      >
        <UploadFileOutlinedIcon />
      </Button>
      <input
        ref={inputRef}
        hidden
        type="file"
        accept=".csv,text/csv"
        onChange={handleFileChange}
      />
    </TopToolbar>
  );
};

