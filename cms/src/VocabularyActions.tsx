import { type ChangeEvent, useRef, useState } from "react";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";
import {
  Button,
  CreateButton,
  TopToolbar,
  useListContext,
  useNotify,
  useRefresh,
} from "react-admin";
import { exportVocabularyCsv, exportVocabularyXlsx, importVocabularyCsv } from "./api";

const importSummary = (result: Awaited<ReturnType<typeof importVocabularyCsv>>) =>
  `Import xong: ${result.wordsCreated} từ mới, ${result.wordsUpdated} từ cập nhật, ` +
  `${result.topicsCreated} chủ đề mới, ${result.decksCreated} bộ thẻ mới` +
  (result.skippedRows ? `, bỏ qua ${result.skippedRows} dòng` : "");

export const VocabularyActions = () => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const notify = useNotify();
  const refresh = useRefresh();
  const { filterValues, sort } = useListContext();
  const [importing, setImporting] = useState(false);
  const [exportingCsv, setExportingCsv] = useState(false);
  const [exportingXlsx, setExportingXlsx] = useState(false);

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
      notify(error instanceof Error ? error.message : "Import CSV thất bại", { type: "error" });
    } finally {
      setImporting(false);
    }
  };

  const handleExportCsv = async () => {
    setExportingCsv(true);
    try {
      await exportVocabularyCsv({ filter: filterValues, sort });
      notify("Export CSV thành công", { type: "success" });
    } catch (error) {
      notify(error instanceof Error ? error.message : "Export CSV thất bại", { type: "error" });
    } finally {
      setExportingCsv(false);
    }
  };

  const handleExportXlsx = async () => {
    setExportingXlsx(true);
    try {
      await exportVocabularyXlsx({ filter: filterValues, sort });
      notify("Export XLSX thành công", { type: "success" });
    } catch (error) {
      notify(error instanceof Error ? error.message : "Export XLSX thất bại", { type: "error" });
    } finally {
      setExportingXlsx(false);
    }
  };

  return (
    <TopToolbar>
      <CreateButton />
      <Button
        label={exportingCsv ? "Đang export..." : "Export CSV"}
        disabled={exportingCsv}
        onClick={handleExportCsv}
      >
        <DownloadOutlinedIcon />
      </Button>
      <Button
        label={exportingXlsx ? "Đang export..." : "Export XLSX"}
        disabled={exportingXlsx}
        onClick={handleExportXlsx}
      >
        <DownloadOutlinedIcon />
      </Button>
      <Button
        label={importing ? "Đang import..." : "Import CSV"}
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
