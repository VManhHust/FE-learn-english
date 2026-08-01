import {
  BooleanField,
  BooleanInput,
  Button,
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
  Show,
  ShowButton,
  SimpleForm,
  SimpleShowLayout,
  TextField,
  TextInput,
  useCreatePath,
  useRedirect,
  useRecordContext,
} from "react-admin";
import FormatListBulletedOutlinedIcon from "@mui/icons-material/FormatListBulletedOutlined";
import { DetailBackButton } from "./DetailBackButton";
import { publicationStatusChoices } from "./publicationStatus";

const categoryFilters = [
  <SearchInput key="q" source="q" alwaysOn placeholder="Tìm tên, slug hoặc nhóm (chủ đề)" />,
  <SelectInput key="status" source="status" label="Trạng thái" choices={publicationStatusChoices} />,
];

const CategoryForm = () => (
  <SimpleForm>
    <DetailBackButton />
    <TextInput source="title" label="Tên bộ thẻ" validate={required()} fullWidth />
    <TextInput
      source="slug"
      label="Slug"
      validate={required()}
      helperText="Chỉ gồm chữ thường, số và dấu gạch ngang"
      fullWidth
    />
    <TextInput source="category" label="Nhóm (chủ đề)" validate={required()} fullWidth />
    <TextInput source="description" label="Mô tả" multiline minRows={3} fullWidth />
    <TextInput source="coverColor" label="Màu đại diện" validate={required()} defaultValue="#2f356d" />
    <SelectInput
      source="status"
      label="Trạng thái"
      choices={publicationStatusChoices}
      validate={required()}
      defaultValue="DRAFT"
      helperText="Xuất bản lần đầu sẽ tự động gửi thông báo bộ từ mới đến người dùng."
    />
    <BooleanInput source="premium" label="Bộ thẻ Pro" defaultValue={false} />
    <NumberInput source="learnerCount" label="Số người học" defaultValue={0} min={0} />
    <NumberInput source="sortOrder" label="Thứ tự" defaultValue={0} min={0} />
    <DeleteButton mutationMode="pessimistic" />
  </SimpleForm>
);

const ViewDeckTopicsButton = () => {
  const record = useRecordContext();
  const createPath = useCreatePath();
  const redirect = useRedirect();
  if (!record) return null;

  const openTopics = (event: React.MouseEvent) => {
    event.stopPropagation();
    const query = new URLSearchParams({
      filter: JSON.stringify({ deckId: record.id }),
    });
    redirect(() => ({
      pathname: createPath({ resource: "vocabulary/topics", type: "list" }),
      search: query.toString(),
    }));
  };

  return (
    <Button label="Nhóm (chủ đề)" onClick={openTopics}>
      <FormatListBulletedOutlinedIcon />
    </Button>
  );
};

export const CategoryList = () => (
  <List title="Danh mục từ vựng" filters={categoryFilters} sort={{ field: "id", order: "DESC" }}>
    <Datagrid rowClick="edit" bulkActionButtons={false}>
      <TextField source="id" label="ID" />
      <TextField source="title" label="Bộ thẻ" />
      <TextField source="slug" label="Slug" />
      <TextField source="category" label="Nhóm (chủ đề)" />
      <TextField source="status" label="Trạng thái" />
      <BooleanField source="premium" label="Pro" />
      <NumberField source="topicCount" label="Số nhóm (chủ đề)" />
      <NumberField source="wordCount" label="Số từ" />
      <NumberField source="sortOrder" label="Thứ tự" />
      <DateField source="updatedAt" label="Cập nhật" showTime locales="vi-VN" />
      <ViewDeckTopicsButton />
      <ShowButton label="Preview" />
      <EditButton />
      <DeleteButton mutationMode="pessimistic" />
    </Datagrid>
  </List>
);

export const CategoryCreate = () => (
  <Create title="Thêm bộ thẻ từ vựng" redirect="list">
    <CategoryForm />
  </Create>
);

export const CategoryEdit = () => (
  <Edit title="Chỉnh sửa bộ thẻ từ vựng">
    <CategoryForm />
  </Edit>
);

export const CategoryShow = () => (
  <Show title="Preview bộ thẻ từ vựng">
    <SimpleShowLayout>
      <DetailBackButton />
      <TextField source="title" label="Bộ thẻ" />
      <TextField source="slug" label="Slug" />
      <TextField source="category" label="Nhóm (chủ đề)" />
      <TextField source="description" label="Mô tả" />
      <TextField source="status" label="Trạng thái" />
      <BooleanField source="premium" label="Pro" />
      <NumberField source="topicCount" label="Số nhóm (chủ đề)" />
      <NumberField source="wordCount" label="Số từ" />
      <DateField source="updatedAt" label="Cập nhật" showTime locales="vi-VN" />
    </SimpleShowLayout>
  </Show>
);
