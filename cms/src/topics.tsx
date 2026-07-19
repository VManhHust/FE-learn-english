import {
  Create,
  Datagrid,
  DateField,
  DeleteButton,
  Edit,
  EditButton,
  List,
  NumberField,
  required,
  SearchInput,
  SelectInput,
  SimpleForm,
  TextField,
  TextInput,
} from "react-admin";
import { DetailBackButton } from "./DetailBackButton";

const topicTypes = [
  { id: "YOUTUBE", name: "YouTube" },
];

const topicFilters = [
  <SearchInput key="q" source="q" alwaysOn placeholder="Tìm tên hoặc mô tả danh mục" />,
];

const TopicForm = () => (
  <SimpleForm>
    <DetailBackButton />
    <TextInput source="topicName" label="Tên danh mục" fullWidth validate={required()} />
    <TextInput source="description" label="Mô tả" fullWidth multiline minRows={4} />
    <SelectInput source="type" label="Loại" choices={topicTypes} validate={required()} />
    <DeleteButton mutationMode="pessimistic" />
  </SimpleForm>
);

export const TopicList = () => (
  <List title="Danh mục bài học/video" filters={topicFilters} sort={{ field: "id", order: "DESC" }}>
    <Datagrid rowClick="edit" bulkActionButtons={false}>
      <TextField source="id" label="ID" />
      <TextField source="topicName" label="Danh mục" />
      <TextField source="type" label="Loại" />
      <NumberField source="lessonCount" label="Số bài học" />
      <DateField source="createdAt" label="Ngày tạo" showTime />
      <EditButton />
      <DeleteButton mutationMode="pessimistic" />
    </Datagrid>
  </List>
);

export const TopicCreate = () => (
  <Create title="Tạo danh mục bài học" redirect="list">
    <TopicForm />
  </Create>
);

export const TopicEdit = () => (
  <Edit title="Cập nhật danh mục bài học">
    <TopicForm />
  </Edit>
);
