import {
  BooleanField,
  Datagrid,
  Edit,
  EditButton,
  ImageField,
  List,
  NumberField,
  SearchInput,
  SelectInput,
  SimpleForm,
  TextField,
  TextInput,
  required,
} from "react-admin";

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
      <BooleanField source="premium" label="Premium" />
      <EditButton />
    </Datagrid>
  </List>
);

export const LessonEdit = () => (
  <Edit title="Cập nhật bài học">
    <SimpleForm>
      <TextInput source="title" label="Tiêu đề" fullWidth validate={required()} />
      <SelectInput
        source="vocabularyLevel"
        label="Trình độ"
        choices={levels}
        validate={required()}
      />
      <TextInput source="videoId" label="YouTube ID" disabled />
      <TextInput source="topicName" label="Chủ đề" disabled />
    </SimpleForm>
  </Edit>
);
