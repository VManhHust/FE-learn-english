import {
  Create,
  Datagrid,
  DateField,
  Edit,
  EditButton,
  List,
  NumberField,
  required,
  SelectInput,
  SimpleForm,
  TextField,
  TextInput,
} from "react-admin";

const topicTypes = [
  { id: "YOUTUBE", name: "YouTube" },
];

const TopicForm = () => (
  <SimpleForm>
    <TextInput source="topicName" label="Tên chủ đề" fullWidth validate={required()} />
    <TextInput source="description" label="Mô tả" fullWidth multiline minRows={4} />
    <SelectInput source="type" label="Loại" choices={topicTypes} validate={required()} />
  </SimpleForm>
);

export const TopicList = () => (
  <List sort={{ field: "id", order: "DESC" }}>
    <Datagrid rowClick="edit" bulkActionButtons={false}>
      <TextField source="id" label="ID" />
      <TextField source="topicName" label="Chủ đề" />
      <TextField source="type" label="Loại" />
      <NumberField source="lessonCount" label="Số bài học" />
      <DateField source="createdAt" label="Ngày tạo" showTime />
      <EditButton />
    </Datagrid>
  </List>
);

export const TopicCreate = () => (
  <Create title="Tạo chủ đề">
    <TopicForm />
  </Create>
);

export const TopicEdit = () => (
  <Edit title="Cập nhật chủ đề">
    <TopicForm />
  </Edit>
);
