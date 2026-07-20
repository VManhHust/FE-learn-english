import {
  Create,
  Datagrid,
  DateField,
  Edit,
  EditButton,
  Button,
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
  useCreatePath,
  useRedirect,
  useRecordContext,
} from "react-admin";
import TranslateOutlinedIcon from "@mui/icons-material/TranslateOutlined";
import { DetailBackButton } from "./DetailBackButton";
import { VocabularyImportActions } from "./VocabularyImportButton";

const topicFilters = [
  <SearchInput key="q" source="q" alwaysOn placeholder="Tìm tên nhóm (chủ đề)" />,
  <ReferenceInput key="deckId" source="deckId" reference="vocabulary/decks" label="Bộ thẻ" perPage={100}>
    <SelectInput optionText="title" />
  </ReferenceInput>,
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
  <List title="Chủ đề từ vựng" filters={topicFilters} sort={{ field: "id", order: "DESC" }} actions={<VocabularyImportActions />}>
    <Datagrid rowClick="edit" bulkActionButtons={false}>
      <TextField source="id" label="ID" />
      <TextField source="title" label="Nhóm (chủ đề)" />
      <TextField source="slug" label="Slug" />
      <TextField source="deckTitle" label="Bộ thẻ" />
      <NumberField source="wordCount" label="Số từ" />
      <NumberField source="sortOrder" label="Thứ tự" />
      <DateField source="createdAt" label="Ngày tạo" showTime locales="vi-VN" />
      <ViewTopicWordsButton />
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

