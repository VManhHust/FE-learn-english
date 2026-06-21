import { useEffect, useMemo, useState } from "react";
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
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import SubtitlesOutlinedIcon from "@mui/icons-material/SubtitlesOutlined";
import { useNotify, useRecordContext } from "react-admin";
import { apiFetch } from "./api";

type LessonRecord = { id: number; moduleCount?: number };

type TranscriptSegment = {
  id: number;
  timeStartMs: number;
  timeEndMs: number;
  content: string;
  vietnameseText?: string | null;
};

const ROWS_PER_PAGE = 20;

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
  const [segments, setSegments] = useState<TranscriptSegment[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
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

  if (!record?.id) return null;

  return (
    <Box sx={{ width: "100%", mt: 3 }}>
      <Paper variant="outlined" sx={{ overflow: "hidden", borderRadius: 2 }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          alignItems={{ xs: "stretch", sm: "center" }}
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
              Chỉnh thời gian theo mili giây, phụ đề tiếng Anh và nghĩa tiếng Việt cho từng câu.
            </Typography>
          </Box>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Typography variant="body2" color={dirty ? "warning.main" : "text.secondary"}>
              {segments.length} câu{dirty ? " · Có thay đổi chưa lưu" : ""}
            </Typography>
            <Button
              type="button"
              variant="contained"
              startIcon={saving ? <CircularProgress color="inherit" size={16} /> : <SaveOutlinedIcon />}
              disabled={loading || saving || !dirty || segments.length === 0}
              onClick={saveTranscript}
            >
              Lưu phụ đề
            </Button>
          </Stack>
        </Stack>

        {error && <Alert severity="error" sx={{ borderRadius: 0 }}>{error}</Alert>}

        {loading ? (
          <Stack alignItems="center" spacing={1.5} sx={{ py: 8 }}>
            <CircularProgress />
            <Typography color="text.secondary">Đang tải phụ đề...</Typography>
          </Stack>
        ) : segments.length === 0 ? (
          <Alert severity="info" sx={{ m: 2 }}>Bài học này chưa có dữ liệu phụ đề.</Alert>
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
                            fullWidth size="small" type="number"
                            value={Number.isNaN(segment.timeStartMs) ? "" : segment.timeStartMs}
                            error={invalidTime}
                            helperText={formatTimestamp(segment.timeStartMs)}
                            slotProps={{ htmlInput: { min: 0, step: 1 } }}
                            onChange={(event) => updateSegment(segment.id, "timeStartMs", event.target.value)}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            fullWidth size="small" type="number"
                            value={Number.isNaN(segment.timeEndMs) ? "" : segment.timeEndMs}
                            error={invalidTime}
                            helperText={formatTimestamp(segment.timeEndMs)}
                            slotProps={{ htmlInput: { min: 1, step: 1 } }}
                            onChange={(event) => updateSegment(segment.id, "timeEndMs", event.target.value)}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            fullWidth multiline minRows={2} size="small"
                            value={segment.content}
                            error={!segment.content.trim()}
                            onChange={(event) => updateSegment(segment.id, "content", event.target.value)}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            fullWidth multiline minRows={2} size="small"
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
