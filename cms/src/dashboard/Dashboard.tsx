import { useEffect, useState } from "react";
import { Card, CardContent, CircularProgress, Grid, Stack, Typography } from "@mui/material";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import PlayLessonOutlinedIcon from "@mui/icons-material/PlayLessonOutlined";
import StarsOutlinedIcon from "@mui/icons-material/StarsOutlined";
import TopicOutlinedIcon from "@mui/icons-material/TopicOutlined";
import { Title, useNotify } from "react-admin";
import { apiFetch } from "../api";

type Summary = {
  users: number;
  activeProUsers: number;
  topics: number;
  lessons: number;
};

const cards = [
  { key: "users", label: "Người dùng", icon: PeopleAltOutlinedIcon, color: "#3867d6" },
  { key: "activeProUsers", label: "Tài khoản Pro", icon: StarsOutlinedIcon, color: "#f59e0b" },
  { key: "topics", label: "Chủ đề", icon: TopicOutlinedIcon, color: "#0f9d7a" },
  { key: "lessons", label: "Bài học", icon: PlayLessonOutlinedIcon, color: "#8b5cf6" },
] as const;

export const Dashboard = () => {
  const [summary, setSummary] = useState<Summary>();
  const notify = useNotify();

  useEffect(() => {
    apiFetch<Summary>("/admin/dashboard")
      .then(setSummary)
      .catch((error: Error) => notify(error.message, { type: "error" }));
  }, [notify]);

  return (
    <Stack spacing={3}>
      <Title title="Tổng quan" />
      <div>
        <Typography variant="h5">Tổng quan hệ thống</Typography>
        <Typography color="text.secondary">
          Theo dõi nội dung và người học tại một nơi.
        </Typography>
      </div>

      {!summary ? (
        <CircularProgress />
      ) : (
        <Grid container spacing={2.5}>
          {cards.map(({ key, label, icon: Icon, color }) => (
            <Grid key={key} size={{ xs: 12, sm: 6, lg: 3 }}>
              <Card>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <div>
                      <Typography color="text.secondary" variant="body2">
                        {label}
                      </Typography>
                      <Typography variant="h4" fontWeight={750} mt={0.5}>
                        {summary[key].toLocaleString("vi-VN")}
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
