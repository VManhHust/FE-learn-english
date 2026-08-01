import {
  Button,
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
import TranslateOutlinedIcon from "@mui/icons-material/TranslateOutlined";
import { DetailBackButton } from "./DetailBackButton";
import { VocabularyImportActions } from "./VocabularyImportButton";
import { publicationStatusChoices } from "./publicationStatus";

const topicFilters = [
  <SearchInput key="q" source="q" alwaysOn placeholder="Tìm tên nhóm (chủ đề)" />,
  <ReferenceInput key="deckId" source="deckId" reference="vocabulary/decks" label="Bộ thẻ" perPage={100}>
    <SelectInput optionText="title" />
  </ReferenceInput>,
  <SelectInput key="status" source="status" label="Trạng thái" choices={publicationStatusChoices} />,
];

const VocabularyTopicForm = () => (
  <SimpleForm>
    <DetailBackButton />
    <ReferenceInput source="deckId" reference="vocabulary/decks" label="Bộ thẻ" perPage={100}>
      <SelectInput optionText="title" validate={required()} fullWidth />
    </ReferenceInput>
    <TextInput source="title" label="Tên nhóm (chủ đề)" validate={required()} fullWidth />
    <TextInput
      source="slug"
      label="Slug"
      validate={required()}
      helperText="Chỉ gồm chữ thường, số và dấu gạch ngang"
      fullWidth
    />
    <TextInput source="description" label="Mô tả" multiline minRows={3} fullWidth />
    <TextInput source="thumbnailUrl" label="Ảnh đại diện" fullWidth />
    <SelectInput
      source="status"
      label="Trạng thái"
      choices={publicationStatusChoices}
      validate={required()}
      defaultValue="DRAFT"
      helperText="Xuất bản lần đầu sẽ tự động gửi thông báo chủ đề từ vựng mới."
    />
    <NumberInput source="sortOrder" label="Thứ tự" defaultValue={0} min={0} />
  </SimpleForm>
);

const ViewTopicWordsButton = () => {
  const record = useRecordContext();
  const createPath = useCreatePath();
  const redirect = useRedirect();
  if (!record) return null;

  const openWords = (event: React.MouseEvent) => {
    event.stopPropagation();
    const query = new URLSearchParams({
      filter: JSON.stringify({ topicId: record.id }),
    });
    redirect(() => ({
      pathname: createPath({ resource: "vocabulary/words", type: "list" }),
      search: query.toString(),
    }));
  };

  return (
    <Button label="Từ" onClick={openWords}>
      <TranslateOutlinedIcon />
    </Button>
  );
};

export const VocabularyTopicList = () => (
  <List
    title="Chủ đề từ vựng"
    filters={topicFilters}
    sort={{ field: "id", order: "DESC" }}
    actions={<VocabularyImportActions />}
  >
    <Datagrid rowClick="edit" bulkActionButtons={false}>
      <TextField source="id" label="ID" />
      <TextField source="title" label="Nhóm (chủ đề)" />
      <TextField source="slug" label="Slug" />
      <TextField source="deckTitle" label="Bộ thẻ" />
      <TextField source="status" label="Trạng thái" />
      <NumberField source="wordCount" label="Số từ" />
      <NumberField source="sortOrder" label="Thứ tự" />
      <DateField source="createdAt" label="Ngày tạo" showTime locales="vi-VN" />
      <ViewTopicWordsButton />
      <ShowButton label="Preview" />
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

export const VocabularyTopicShow = () => (
  <Show title="Preview chủ đề từ vựng">
    <SimpleShowLayout>
      <DetailBackButton />
      <TextField source="title" label="Nhóm (chủ đề)" />
      <TextField source="slug" label="Slug" />
      <TextField source="deckTitle" label="Bộ thẻ" />
      <TextField source="description" label="Mô tả" />
      <TextField source="thumbnailUrl" label="Ảnh đại diện" />
      <TextField source="status" label="Trạng thái" />
      <NumberField source="wordCount" label="Số từ" />
      <DateField source="updatedAt" label="Cập nhật" showTime locales="vi-VN" />
    </SimpleShowLayout>
  </Show>
);
