import {
  Create,
  Datagrid,
  DateField,
  Edit,
  EditButton,
  List,
  NumberField,
  NumberInput,
  ReferenceInput,
  required,
  SearchInput,
  SelectInput,
  SimpleForm,
  TextField,
  TextInput,
} from "react-admin";
import { DetailBackButton } from "./DetailBackButton";

const topicFilters = [
  <SearchInput key="q" source="q" alwaysOn placeholder="Tìm tên chủ đề" />,
];

const VocabularyTopicForm = () => (
  <SimpleForm>
    <DetailBackButton />
    <ReferenceInput source="deckId" reference="vocabulary/decks" label="Bộ từ vựng" perPage={100}>
      <SelectInput optionText="title" validate={required()} fullWidth />
    </ReferenceInput>
    <TextInput source="title" label="Tên chủ đề" validate={required()} fullWidth />
    <TextInput
      source="slug"
      label="Slug"
      validate={required()}
      helperText="Chỉ gồm chữ thường, số và dấu gạch ngang"
      fullWidth
    />
    <TextInput source="description" label="Mô tả" multiline minRows={3} fullWidth />
    <TextInput source="thumbnailUrl" label="Ảnh đại diện" fullWidth />
    <NumberInput source="sortOrder" label="Thứ tự" defaultValue={0} min={0} />
  </SimpleForm>
);

export const VocabularyTopicList = () => (
  <List title="Chủ đề từ vựng" filters={topicFilters} sort={{ field: "id", order: "DESC" }}>
    <Datagrid rowClick="edit" bulkActionButtons={false}>
      <TextField source="id" label="ID" />
      <TextField source="title" label="Chủ đề" />
      <TextField source="slug" label="Slug" />
      <TextField source="deckTitle" label="Bộ từ vựng" />
      <NumberField source="wordCount" label="Số từ" />
      <NumberField source="sortOrder" label="Thứ tự" />
      <DateField source="createdAt" label="Ngày tạo" showTime locales="vi-VN" />
      <EditButton />
    </Datagrid>
  </List>
);

export const VocabularyTopicCreate = () => (
  <Create title="Tạo chủ đề từ vựng" redirect="list">
    <VocabularyTopicForm />
  </Create>
);

export const VocabularyTopicEdit = () => (
  <Edit title="Cập nhật chủ đề từ vựng">
    <VocabularyTopicForm />
  </Edit>
);
