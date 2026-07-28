import { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CircularProgress,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import PaymentsOutlinedIcon from "@mui/icons-material/PaymentsOutlined";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import PlayLessonOutlinedIcon from "@mui/icons-material/PlayLessonOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import StarsOutlinedIcon from "@mui/icons-material/StarsOutlined";
import TopicOutlinedIcon from "@mui/icons-material/TopicOutlined";
import { Title, useNotify } from "react-admin";
import { apiFetch } from "../api";

type Summary = {
  users: number;
  activeProUsers: number;
  topics: number;
  lessons: number;
  revenueAmount: number;
  paidOrderCount: number;
  revenueFrom?: string | null;
  revenueTo?: string | null;
};

type SummaryKey = keyof Pick<
  Summary,
  "users" | "activeProUsers" | "topics" | "lessons" | "revenueAmount" | "paidOrderCount"
>;

const cards: ReadonlyArray<{
  key: SummaryKey;
  label: string;
  icon: typeof PeopleAltOutlinedIcon;
  color: string;
}> = [
  { key: "users", label: "Người dùng", icon: PeopleAltOutlinedIcon, color: "#3867d6" },
  { key: "activeProUsers", label: "Tài khoản Pro", icon: StarsOutlinedIcon, color: "#f59e0b" },
  { key: "topics", label: "Chủ đề", icon: TopicOutlinedIcon, color: "#0f9d7a" },
  { key: "lessons", label: "Bài học", icon: PlayLessonOutlinedIcon, color: "#8b5cf6" },
  { key: "revenueAmount", label: "Doanh thu PRO", icon: PaymentsOutlinedIcon, color: "#0891b2" },
  { key: "paidOrderCount", label: "Đơn đã thanh toán", icon: ReceiptLongOutlinedIcon, color: "#db2777" },
];

const revenuePresetChoices = [
  { value: "all", label: "Tất cả thời gian" },
  { value: "today", label: "Hôm nay" },
  { value: "yesterday", label: "Hôm qua" },
  { value: "last7Days", label: "7 ngày qua" },
  { value: "thisMonth", label: "Tháng này" },
  { value: "custom", label: "Tùy chọn" },
] as const;

type RevenuePreset = (typeof revenuePresetChoices)[number]["value"];

const formatInputDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const firstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);

const getPresetRange = (preset: RevenuePreset, customFrom: string, customTo: string) => {
  const today = new Date();

  switch (preset) {
    case "today":
      return { from: formatInputDate(today), to: formatInputDate(today) };
    case "yesterday": {
      const yesterday = addDays(today, -1);
      return { from: formatInputDate(yesterday), to: formatInputDate(yesterday) };
    }
    case "last7Days":
      return { from: formatInputDate(addDays(today, -6)), to: formatInputDate(today) };
    case "thisMonth":
      return { from: formatInputDate(firstDayOfMonth(today)), to: formatInputDate(today) };
    case "custom":
      return { from: customFrom, to: customTo };
    default:
      return { from: "", to: "" };
  }
};

const formatSummaryValue = (summary: Summary, key: SummaryKey) => {
  if (key === "revenueAmount") {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(summary.revenueAmount ?? 0);
  }

  return (summary[key] ?? 0).toLocaleString("vi-VN");
};

export const Dashboard = () => {
  const [summary, setSummary] = useState<Summary>();
  const [revenuePreset, setRevenuePreset] = useState<RevenuePreset>("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const notify = useNotify();
  const revenueRange = useMemo(
    () => getPresetRange(revenuePreset, customFrom, customTo),
    [customFrom, customTo, revenuePreset],
  );
  const dashboardPath = useMemo(() => {
    const query = new URLSearchParams();
    if (revenueRange.from) {
      query.set("revenueFrom", revenueRange.from);
    }
    if (revenueRange.to) {
      query.set("revenueTo", revenueRange.to);
    }

    const queryString = query.toString();
    return `/admin/dashboard${queryString ? `?${queryString}` : ""}`;
  }, [revenueRange]);

  useEffect(() => {
    apiFetch<Summary>(dashboardPath)
      .then(setSummary)
      .catch((error: Error) => notify(error.message, { type: "error" }));
  }, [dashboardPath, notify]);

  return (
    <Stack spacing={3}>
      <Title title="Tổng quan" />
      <Stack
        direction={{ xs: "column", md: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", md: "flex-end" }}
        gap={2}
      >
        <div>
          <Typography variant="h5">Tổng quan hệ thống</Typography>
          <Typography color="text.secondary">Theo dõi nội dung, người học và doanh thu PRO tại một nơi.</Typography>
        </div>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
          <TextField
            select
            size="small"
            label="Khoảng doanh thu"
            value={revenuePreset}
            onChange={(event) => setRevenuePreset(event.target.value as RevenuePreset)}
            sx={{ minWidth: 190 }}
          >
            {revenuePresetChoices.map((choice) => (
              <MenuItem key={choice.value} value={choice.value}>
                {choice.label}
              </MenuItem>
            ))}
          </TextField>
          {revenuePreset === "custom" ? (
            <>
              <TextField
                size="small"
                type="date"
                label="Từ ngày"
                value={customFrom}
                onChange={(event) => setCustomFrom(event.target.value)}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                size="small"
                type="date"
                label="Đến ngày"
                value={customTo}
                onChange={(event) => setCustomTo(event.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </>
          ) : null}
        </Stack>
      </Stack>

      {!summary ? (
        <CircularProgress />
      ) : (
        <Grid container spacing={2.5}>
          {cards.map(({ key, label, icon: Icon, color }) => (
            <Grid key={key} size={{ xs: 12, sm: 6, lg: 4 }}>
              <Card>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <div>
                      <Typography color="text.secondary" variant="body2">
                        {label}
                      </Typography>
                      <Typography variant="h4" fontWeight={750} mt={0.5}>
                        {formatSummaryValue(summary, key)}
                      </Typography>
                    </div>
                    <Stack
                      alignItems="center"
                      justifyContent="center"
                      sx={{
                        width: 52,
                        height: 52,
                        borderRadius: 3,
                        bgcolor: `${color}18`,
                        color,
                      }}
                    >
                      <Icon />
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Stack>
  );
};
