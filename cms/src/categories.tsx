import {
  BooleanField,
  BooleanInput,
  Create,
  Datagrid,
  DateField,
  DeleteButton,
  Edit,
  EditButton,
  List,
  NumberField,
  NumberInput,
  required,
  SearchInput,
  SelectInput,
  SimpleForm,
  TextField,
  TextInput,
} from "react-admin";
import { DetailBackButton } from "./DetailBackButton";

const categoryFilters = [
  <SearchInput key="q" source="q" alwaysOn placeholder="Tìm tên, slug hoặc nhóm danh mục" />,
];

const statusChoices = [
  { id: "DRAFT", name: "Nháp" },
  { id: "PUBLISHED", name: "Đã xuất bản" },
  { id: "ARCHIVED", name: "Lưu trữ" },
];

const CategoryForm = () => (
  <SimpleForm>
    <DetailBackButton />
    <TextInput source="title" label="Tên danh mục" validate={required()} fullWidth />
    <TextInput
      source="slug"
      label="Slug"
      validate={required()}
      helperText="Chỉ gồm chữ thường, số và dấu gạch ngang"
      fullWidth
    />
    <TextInput source="category" label="Nhóm danh mục" validate={required()} fullWidth />
    <TextInput source="description" label="Mô tả" multiline minRows={3} fullWidth />
    <TextInput source="coverColor" label="Màu đại diện" validate={required()} defaultValue="#2f356d" />
    <SelectInput
      source="status"
      label="Trạng thái"
      choices={statusChoices}
      validate={required()}
      defaultValue="PUBLISHED"
    />
    <BooleanInput source="premium" label="Danh mục Pro" defaultValue={false} />
    <NumberInput source="learnerCount" label="Số người học" defaultValue={0} min={0} />
    <NumberInput source="sortOrder" label="Thứ tự" defaultValue={0} min={0} />
    <DeleteButton mutationMode="pessimistic" />
  </SimpleForm>
);

export const CategoryList = () => (
  <List
    title="Danh mục từ vựng"
    filters={categoryFilters}
    sort={{ field: "id", order: "DESC" }}
  >
    <Datagrid rowClick="edit" bulkActionButtons={false}>
      <TextField source="id" label="ID" />
      <TextField source="title" label="Bộ từ vựng" />
      <TextField source="slug" label="Slug" />
      <TextField source="category" label="Nhóm" />
      <TextField source="status" label="Trạng thái" />
      <BooleanField source="premium" label="Pro" />
      <NumberField source="topicCount" label="Số chủ đề" />
      <NumberField source="wordCount" label="Số từ" />
      <NumberField source="sortOrder" label="Thứ tự" />
      <DateField source="updatedAt" label="Cập nhật" showTime locales="vi-VN" />
      <EditButton />
      <DeleteButton mutationMode="pessimistic" />
    </Datagrid>
  </List>
);

export const CategoryCreate = () => (
  <Create title="Thêm danh mục từ vựng" redirect="list">
    <CategoryForm />
  </Create>
);

export const CategoryEdit = () => (
  <Edit title="Chỉnh sửa danh mục từ vựng">
    <CategoryForm />
  </Edit>
);
