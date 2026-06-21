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

const vocabularyFilters = [
  <SearchInput key="q" source="q" alwaysOn placeholder="Tìm từ hoặc nghĩa" />,
];

const VocabularyForm = () => (
  <SimpleForm>
    <DetailBackButton />
    <ReferenceInput source="topicId" reference="vocabulary/topics" label="Chủ đề" perPage={100}>
      <SelectInput optionText="title" validate={required()} fullWidth />
    </ReferenceInput>
    <TextInput source="word" label="Từ vựng" validate={required()} fullWidth />
    <TextInput source="partOfSpeech" label="Từ loại" validate={required()} fullWidth />
    <TextInput source="ipaUs" label="Phiên âm Mỹ" />
    <TextInput source="ipaUk" label="Phiên âm Anh" />
    <TextInput source="audioUsUrl" label="Audio Mỹ" fullWidth />
    <TextInput source="audioUkUrl" label="Audio Anh" fullWidth />
    <TextInput
      source="englishDefinition"
      label="Định nghĩa tiếng Anh"
      validate={required()}
      multiline
      minRows={3}
      fullWidth
    />
    <TextInput
      source="vietnameseDefinition"
      label="Định nghĩa tiếng Việt"
      validate={required()}
      multiline
      minRows={3}
      fullWidth
    />
    <TextInput
      source="vietnameseTranslation"
      label="Nghĩa tiếng Việt"
      validate={required()}
      fullWidth
    />
    <TextInput source="exampleSentence" label="Câu ví dụ" multiline fullWidth />
    <TextInput source="exampleSentenceVi" label="Dịch câu ví dụ" multiline fullWidth />
    <TextInput source="imageUrl" label="Ảnh minh hoạ" fullWidth />
    <NumberInput source="sortOrder" label="Thứ tự" defaultValue={0} min={0} />
  </SimpleForm>
);

export const VocabularyList = () => (
  <List
    title="Quản lý từ vựng"
    filters={vocabularyFilters}
    sort={{ field: "id", order: "DESC" }}
  >
    <Datagrid rowClick="edit" bulkActionButtons={false}>
      <TextField source="id" label="ID" />
      <TextField source="word" label="Từ vựng" />
      <TextField source="partOfSpeech" label="Từ loại" />
      <TextField source="vietnameseTranslation" label="Nghĩa tiếng Việt" />
      <TextField source="topicTitle" label="Chủ đề" />
      <TextField source="deckTitle" label="Bộ từ" />
      <NumberField source="sortOrder" label="Thứ tự" />
      <DateField source="updatedAt" label="Cập nhật" showTime locales="vi-VN" />
      <EditButton />
    </Datagrid>
  </List>
);

export const VocabularyCreate = () => (
  <Create title="Thêm từ vựng" redirect="list">
    <VocabularyForm />
  </Create>
);

export const VocabularyEdit = () => (
  <Edit title="Cập nhật từ vựng">
    <VocabularyForm />
  </Edit>
);
