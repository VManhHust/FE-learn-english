import { type ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import SubtitlesOutlinedIcon from "@mui/icons-material/SubtitlesOutlined";
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";
import { useNotify, useRecordContext } from "react-admin";
import {
  apiFetch,
  exportLessonTranscriptSrt,
  importLessonTranscriptSrt,
  type TranscriptSegment,
} from "./api";

type LessonRecord = { id: number; moduleCount?: number };

const ROWS_PER_PAGE = 20;

const SAMPLE_SRT = `1
00:00:00,000 --> 00:00:03,200
EN: Welcome to today's English listening lesson.
VI: Chào mừng bạn đến với bài luyện nghe tiếng Anh hôm nay.

2
00:00:03,200 --> 00:00:07,100
EN: We will practice short sentences from a real video.
VI: Chúng ta sẽ luyện các câu ngắn từ một video thực tế.

3
00:00:07,100 --> 00:00:11,000
EN: Listen carefully, repeat, and compare your pronunciation.
VI: Hãy nghe kỹ, lặp lại và so sánh phát âm của bạn.
`;

const downloadBlob = (content: BlobPart, filename: string, type: string) => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
};

const formatTimestamp = (milliseconds: number) => {
  if (!Number.isFinite(milliseconds) || milliseconds < 0) return "--:--.---";
  const minutes = Math.floor(milliseconds / 60_000);
  const seconds = Math.floor((milliseconds % 60_000) / 1_000);
  const millis = Math.floor(milliseconds % 1_000);
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(millis).padStart(3, "0")}`;
};

const validateSegments = (segments: TranscriptSegment[]) => {
  for (let index = 0; index < segments.length; index += 1) {
    const segment = segments[index];
    const row = index + 1;
    if (!Number.isInteger(segment.timeStartMs) || segment.timeStartMs < 0) {
      return `Câu ${row}: thời gian bắt đầu phải là số nguyên không âm.`;
    }
    if (!Number.isInteger(segment.timeEndMs) || segment.timeEndMs <= segment.timeStartMs) {
      return `Câu ${row}: thời gian kết thúc phải lớn hơn thời gian bắt đầu.`;
    }
    if (!segment.content.trim()) {
      return `Câu ${row}: phụ đề tiếng Anh không được để trống.`;
    }
  }
  return null;
};

export const TranscriptEditor = () => {
  const record = useRecordContext<LessonRecord>();
  const notify = useNotify();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [segments, setSegments] = useState<TranscriptSegment[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);

  useEffect(() => {
    if (!record?.id) return;
    let active = true;
    setLoading(true);
    setError(null);
    apiFetch<TranscriptSegment[]>(`/admin/lessons/${record.id}/transcript`)
      .then((data) => {
        if (!active) return;
        setSegments(data);
        setDirty(false);
        setPage(0);
      })
      .catch((requestError: Error) => {
        if (active) setError(requestError.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [record?.id]);

  const visibleSegments = useMemo(
    () => segments.slice(page * ROWS_PER_PAGE, page * ROWS_PER_PAGE + ROWS_PER_PAGE),
    [page, segments],
  );

  const updateSegment = (
    id: number,
    field: "timeStartMs" | "timeEndMs" | "content" | "vietnameseText",
    value: string,
  ) => {
    setSegments((current) => current.map((segment) => {
      if (segment.id !== id) return segment;
      if (field === "timeStartMs" || field === "timeEndMs") {
        return { ...segment, [field]: value === "" ? Number.NaN : Number(value) };
      }
      return { ...segment, [field]: value };
    }));
    setDirty(true);
    setError(null);
  };

  const saveTranscript = async () => {
    if (!record?.id) return;
    const validationError = validateSegments(segments);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const updated = await apiFetch<TranscriptSegment[]>(`/admin/lessons/${record.id}/transcript`, {
        method: "PUT",
        body: JSON.stringify(segments.map((segment) => ({
          id: segment.id,
          timeStartMs: segment.timeStartMs,
          timeEndMs: segment.timeEndMs,
          content: segment.content,
          vietnameseText: segment.vietnameseText?.trim() || null,
        }))),
      });
      setSegments(updated);
      setDirty(false);
      notify("Đã lưu phụ đề thành công", { type: "success" });
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : "Không thể lưu phụ đề";
      setError(message);
      notify(message, { type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const importSrt = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!record?.id || !file) return;

    setImporting(true);
    setError(null);
    try {
      const imported = await importLessonTranscriptSrt(record.id, file);
      setSegments(imported);
      setDirty(false);
      setPage(0);
      notify(`Đã import ${imported.length} câu từ file SRT`, { type: "success" });
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : "Import SRT thất bại";
      setError(message);
      notify(message, { type: "error" });
    } finally {
      setImporting(false);
    }
  };

  const exportSrt = async () => {
    if (!record?.id) return;
    setExporting(true);
    try {
      await exportLessonTranscriptSrt(record.id);
      notify("Export SRT thành công", { type: "success" });
    } catch (requestError) {
      notify(requestError instanceof Error ? requestError.message : "Export SRT thất bại", { type: "error" });
    } finally {
      setExporting(false);
    }
  };

  if (!record?.id) return null;

  return (
    <Box sx={{ width: "100%", mt: 3 }}>
      <Paper variant="outlined" sx={{ overflow: "hidden", borderRadius: 2 }}>
        <Stack
          direction={{ xs: "column", lg: "row" }}
          alignItems={{ xs: "stretch", lg: "center" }}
          justifyContent="space-between"
          spacing={2}
          sx={{ p: 2, bgcolor: "action.hover", borderBottom: 1, borderColor: "divider" }}
        >
          <Box>
            <Stack direction="row" alignItems="center" spacing={1}>
              <SubtitlesOutlinedIcon color="primary" />
              <Typography variant="h6" fontWeight={700}>Phụ đề bài học</Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Import/export SRT song ngữ, hoặc chỉnh thời gian, phụ đề tiếng Anh và nghĩa tiếng Việt cho từng câu.
            </Typography>
          </Box>
          <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" useFlexGap>
            <Typography variant="body2" color={dirty ? "warning.main" : "text.secondary"}>
              {segments.length} câu{dirty ? " · Có thay đổi chưa lưu" : ""}
            </Typography>
            <Button
              type="button"
              variant="outlined"
              startIcon={<DownloadOutlinedIcon />}
              onClick={() => downloadBlob(SAMPLE_SRT, "bilingual-video-subtitle-sample.srt", "application/x-subrip;charset=utf-8")}
            >
              File mẫu
            </Button>
            <Button
              type="button"
              variant="outlined"
              startIcon={importing ? <CircularProgress color="inherit" size={16} /> : <UploadFileOutlinedIcon />}
              disabled={loading || importing}
              onClick={() => inputRef.current?.click()}
            >
              Import SRT
            </Button>
            <Button
              type="button"
              variant="outlined"
              startIcon={exporting ? <CircularProgress color="inherit" size={16} /> : <DownloadOutlinedIcon />}
              disabled={loading || exporting || segments.length === 0}
              onClick={exportSrt}
            >
              Export SRT
            </Button>
            <Button
              type="button"
              variant="contained"
              startIcon={saving ? <CircularProgress color="inherit" size={16} /> : <SaveOutlinedIcon />}
              disabled={loading || saving || !dirty || segments.length === 0}
              onClick={saveTranscript}
            >
              Lưu phụ đề
            </Button>
            <input ref={inputRef} hidden type="file" accept=".srt,application/x-subrip,text/plain" onChange={importSrt} />
          </Stack>
        </Stack>

        {error && <Alert severity="error" sx={{ borderRadius: 0 }}>{error}</Alert>}

        {loading ? (
          <Stack alignItems="center" spacing={1.5} sx={{ py: 8 }}>
            <CircularProgress />
            <Typography color="text.secondary">Đang tải phụ đề...</Typography>
          </Stack>
        ) : segments.length === 0 ? (
          <Alert severity="info" sx={{ m: 2 }}>Bài học này chưa có dữ liệu phụ đề. Bạn có thể import file SRT song ngữ.</Alert>
        ) : (
          <>
            <TableContainer sx={{ maxHeight: 680 }}>
              <Table stickyHeader size="small" sx={{ minWidth: 1100 }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: 60, fontWeight: 700 }}>Câu</TableCell>
                    <TableCell sx={{ width: 175, fontWeight: 700 }}>Bắt đầu (ms)</TableCell>
                    <TableCell sx={{ width: 175, fontWeight: 700 }}>Kết thúc (ms)</TableCell>
                    <TableCell sx={{ minWidth: 310, fontWeight: 700 }}>Phụ đề tiếng Anh</TableCell>
                    <TableCell sx={{ minWidth: 310, fontWeight: 700 }}>Nghĩa tiếng Việt</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {visibleSegments.map((segment, visibleIndex) => {
                    const absoluteIndex = page * ROWS_PER_PAGE + visibleIndex;
                    const invalidTime = segment.timeStartMs < 0 || segment.timeEndMs <= segment.timeStartMs;
                    return (
                      <TableRow key={segment.id} hover>
                        <TableCell>{absoluteIndex + 1}</TableCell>
                        <TableCell>
                          <TextField
                            fullWidth
                            size="small"
                            type="number"
                            value={Number.isNaN(segment.timeStartMs) ? "" : segment.timeStartMs}
                            error={invalidTime}
                            helperText={formatTimestamp(segment.timeStartMs)}
                            slotProps={{ htmlInput: { min: 0, step: 1 } }}
                            onChange={(event) => updateSegment(segment.id, "timeStartMs", event.target.value)}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            fullWidth
                            size="small"
                            type="number"
                            value={Number.isNaN(segment.timeEndMs) ? "" : segment.timeEndMs}
                            error={invalidTime}
                            helperText={formatTimestamp(segment.timeEndMs)}
                            slotProps={{ htmlInput: { min: 1, step: 1 } }}
                            onChange={(event) => updateSegment(segment.id, "timeEndMs", event.target.value)}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            fullWidth
                            multiline
                            minRows={2}
                            size="small"
                            value={segment.content}
                            error={!segment.content.trim()}
                            onChange={(event) => updateSegment(segment.id, "content", event.target.value)}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            fullWidth
                            multiline
                            minRows={2}
                            size="small"
                            placeholder="Nhập nghĩa tiếng Việt"
                            value={segment.vietnameseText ?? ""}
                            onChange={(event) => updateSegment(segment.id, "vietnameseText", event.target.value)}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={segments.length}
              page={page}
              rowsPerPage={ROWS_PER_PAGE}
              rowsPerPageOptions={[ROWS_PER_PAGE]}
              labelDisplayedRows={({ from, to, count }) => `${from}-${to} trong ${count}`}
              onPageChange={(_, nextPage) => setPage(nextPage)}
              onRowsPerPageChange={() => undefined}
            />
          </>
        )}
      </Paper>
    </Box>
  );
};
