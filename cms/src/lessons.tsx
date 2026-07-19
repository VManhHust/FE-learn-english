import {
  BooleanField,
  Create,
  Datagrid,
  Edit,
  EditButton,
  ImageField,
  List,
  NumberField,
  SearchInput,
  SelectInput,
  SimpleForm,
  SaveButton,
  TextField,
  TextInput,
  Toolbar,
  useNotify,
  useRedirect,
  required,
} from "react-admin";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import { TranscriptEditor } from "./TranscriptEditor";
import { DetailBackButton } from "./DetailBackButton";
import { importLessonTranscript } from "./api";

const lessonFilters = [<SearchInput key="q" source="q" alwaysOn placeholder="Tìm bài học" />];
const levels = ["A1", "A2", "B1", "B2", "C1", "C2"].map((level) => ({
  id: level,
  name: level,
}));

export const LessonList = () => (
  <List filters={lessonFilters} sort={{ field: "createdAt", order: "DESC" }}>
    <Datagrid rowClick="edit" bulkActionButtons={false}>
      <ImageField source="thumbnailUrl" label="Ảnh" sx={{ "& img": { width: 96, height: 54 } }} />
      <TextField source="title" label="Bài học" />
      <TextField source="topicName" label="Chủ đề" />
      <TextField source="vocabularyLevel" label="Trình độ" />
      <NumberField source="moduleCount" label="Số phần" />
      <BooleanField source="premium" label="Pro" />
      <EditButton />
    </Datagrid>
  </List>
);

const validateVideoId = (value: unknown) => {
  if (typeof value !== "string" || !/^[a-zA-Z0-9_-]{11}$/.test(value.trim())) {
    return "Nhập đúng YouTube video ID gồm 11 ký tự";
  }
  return undefined;
};

const DownloadTranscriptToolbar = () => (
  <Toolbar>
    <SaveButton label="Download transcript" icon={<DownloadOutlinedIcon />} />
  </Toolbar>
);

export const LessonCreate = () => {
  const notify = useNotify();
  const redirect = useRedirect();

  const handleSubmit = async (data: Record<string, unknown>) => {
    const videoId = String(data.videoId ?? "").trim();
    const lesson = await importLessonTranscript(videoId);
    notify(`Đã import bài học "${lesson.title}" với ${lesson.moduleCount} đoạn transcript`, {
      type: "success",
    });
    redirect("edit", "lessons", lesson.id);
  };

  return (
    <Create title="Thêm bài học bằng YouTube ID">
      <SimpleForm onSubmit={handleSubmit} toolbar={<DownloadTranscriptToolbar />}>
        <DetailBackButton />
        <TextInput
          source="videoId"
          label="YouTube video ID"
          helperText="Ví dụ: NEmZoMdgbTQ"
          fullWidth
          validate={[required(), validateVideoId]}
        />
      </SimpleForm>
    </Create>
  );
};

export const LessonEdit = () => (
  <Edit title="Cập nhật bài học">
    <SimpleForm>
      <DetailBackButton />
      <TextInput source="title" label="Tiêu đề" fullWidth validate={required()} />
      <SelectInput
        source="vocabularyLevel"
        label="Trình độ"
        choices={levels}
        validate={required()}
      />
      <TextInput source="videoId" label="YouTube ID" disabled />
      <TranscriptEditor />
      <TextInput source="topicName" label="Chủ đề" disabled />
    </SimpleForm>
  </Edit>
);
