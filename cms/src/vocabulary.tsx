import { useEffect, useRef } from "react";
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
  Show,
  ShowButton,
  SimpleForm,
  SimpleShowLayout,
  TextField,
  TextInput,
} from "react-admin";
import { useFormContext, useWatch } from "react-hook-form";
import { DetailBackButton } from "./DetailBackButton";
import { VocabularyActions } from "./VocabularyActions";
import { publicationStatusChoices } from "./publicationStatus";

const PART_OF_SPEECH_OTHER = "__OTHER__";

const partOfSpeechChoices = [
  { id: "noun", name: "Noun (danh từ)" },
  { id: "verb", name: "Verb (động từ)" },
  { id: "adjective", name: "Adjective (tính từ)" },
  { id: "adverb", name: "Adverb (trạng từ)" },
  { id: "pronoun", name: "Pronoun (đại từ)" },
  { id: "preposition", name: "Preposition (giới từ)" },
  { id: "conjunction", name: "Conjunction (liên từ)" },
  { id: "interjection", name: "Interjection (thán từ)" },
  { id: "determiner", name: "Determiner (từ hạn định)" },
  { id: "phrase", name: "Phrase (cụm từ)" },
  { id: "idiom", name: "Idiom (thành ngữ)" },
  { id: "phrasal verb", name: "Phrasal verb (cụm động từ)" },
  { id: "abbreviation", name: "Abbreviation (viết tắt)" },
  { id: PART_OF_SPEECH_OTHER, name: "Khác" },
];

const partOfSpeechAliases: Record<string, string> = {
  n: "noun",
  "n.": "noun",
  noun: "noun",
  nouns: "noun",
  v: "verb",
  "v.": "verb",
  verb: "verb",
  verbs: "verb",
  adj: "adjective",
  "adj.": "adjective",
  adjective: "adjective",
  adjectives: "adjective",
  adv: "adverb",
  "adv.": "adverb",
  adverb: "adverb",
  adverbs: "adverb",
  pron: "pronoun",
  "pron.": "pronoun",
  pronoun: "pronoun",
  pronouns: "pronoun",
  prep: "preposition",
  "prep.": "preposition",
  preposition: "preposition",
  prepositions: "preposition",
  conj: "conjunction",
  "conj.": "conjunction",
  conjunction: "conjunction",
  conjunctions: "conjunction",
  interj: "interjection",
  "interj.": "interjection",
  interjection: "interjection",
  interjections: "interjection",
  determiner: "determiner",
  determiners: "determiner",
  phrase: "phrase",
  phrases: "phrase",
  idiom: "idiom",
  idioms: "idiom",
  "phrasal verb": "phrasal verb",
  "phrasal verbs": "phrasal verb",
  abbreviation: "abbreviation",
  abbreviations: "abbreviation",
};

type VocabularyFormData = Record<string, unknown> & {
  partOfSpeech?: string;
  partOfSpeechOther?: string;
  partOfSpeechType?: string;
};

const normalizePartOfSpeech = (value: unknown) =>
  typeof value === "string" ? value.trim().toLowerCase().replace(/\s+/g, " ") : "";

const resolvePartOfSpeechChoice = (value: unknown) => {
  const normalized = normalizePartOfSpeech(value);

  if (!normalized) {
    return "noun";
  }

  return partOfSpeechAliases[normalized] ?? PART_OF_SPEECH_OTHER;
};

const transformVocabularyPayload = (data: VocabularyFormData) => {
  const selectedPartOfSpeech =
    data.partOfSpeechType === PART_OF_SPEECH_OTHER
      ? data.partOfSpeechOther?.trim()
      : data.partOfSpeechType;
  const { partOfSpeechType, partOfSpeechOther, ...payload } = data;

  return {
    ...payload,
    partOfSpeech: selectedPartOfSpeech || data.partOfSpeech,
  };
};

const PartOfSpeechInput = ({ mode }: { mode: "create" | "edit" }) => {
  const { getValues, setValue } = useFormContext();
  const initializedRef = useRef(false);
  const selectedPartOfSpeech = useWatch({ name: "partOfSpeechType" });
  const existingPartOfSpeechValue = useWatch({ name: "partOfSpeech" });

  useEffect(() => {
    if (initializedRef.current) {
      return;
    }

    const currentSelection = getValues("partOfSpeechType");
    if (currentSelection) {
      initializedRef.current = true;
      return;
    }

    const existingPartOfSpeech = getValues("partOfSpeech") ?? existingPartOfSpeechValue;
    if (mode === "edit" && !existingPartOfSpeech) {
      return;
    }

    const resolvedChoice = resolvePartOfSpeechChoice(existingPartOfSpeech);

    setValue("partOfSpeechType", resolvedChoice, { shouldDirty: false });
    if (resolvedChoice === PART_OF_SPEECH_OTHER && typeof existingPartOfSpeech === "string") {
      setValue("partOfSpeechOther", existingPartOfSpeech, { shouldDirty: false });
    }

    initializedRef.current = true;
  }, [existingPartOfSpeechValue, getValues, mode, setValue]);

  return (
    <>
      <SelectInput
        source="partOfSpeechType"
        label="Từ loại"
        choices={partOfSpeechChoices}
        validate={required()}
        defaultValue="noun"
        fullWidth
      />
      {selectedPartOfSpeech === PART_OF_SPEECH_OTHER ? (
        <TextInput source="partOfSpeechOther" label="Từ loại khác" validate={required()} fullWidth />
      ) : null}
    </>
  );
};

const vocabularyFilters = [
  <SearchInput key="q" source="q" alwaysOn placeholder="Tìm từ hoặc nghĩa" />,
  <ReferenceInput key="deckId" source="deckId" reference="vocabulary/decks" label="Bộ thẻ" perPage={100}>
    <SelectInput optionText="title" />
  </ReferenceInput>,
  <ReferenceInput key="topicId" source="topicId" reference="vocabulary/topics" label="Nhóm (chủ đề)" perPage={100}>
    <SelectInput optionText="title" />
  </ReferenceInput>,
  <SelectInput key="status" source="status" label="Trạng thái" choices={publicationStatusChoices} />,
];

const VocabularyForm = ({ mode }: { mode: "create" | "edit" }) => (
  <SimpleForm>
    <DetailBackButton />
    <ReferenceInput source="topicId" reference="vocabulary/topics" label="Nhóm (chủ đề)" perPage={100}>
      <SelectInput optionText="title" validate={required()} fullWidth />
    </ReferenceInput>
    <TextInput source="word" label="Từ vựng" validate={required()} fullWidth />
    <PartOfSpeechInput mode={mode} />
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
    <TextInput source="vietnameseTranslation" label="Nghĩa tiếng Việt" validate={required()} fullWidth />
    <TextInput source="exampleSentence" label="Câu ví dụ" multiline fullWidth />
    <TextInput source="exampleSentenceVi" label="Dịch câu ví dụ" multiline fullWidth />
    <TextInput source="imageUrl" label="Ảnh minh họa" fullWidth />
    <SelectInput
      source="status"
      label="Trạng thái"
      choices={publicationStatusChoices}
      validate={required()}
      defaultValue="DRAFT"
    />
    <NumberInput source="sortOrder" label="Thứ tự" defaultValue={0} min={0} />
  </SimpleForm>
);

export const VocabularyList = () => (
  <List
    title="Quản lý từ vựng"
    filters={vocabularyFilters}
    sort={{ field: "id", order: "DESC" }}
    actions={<VocabularyActions />}
  >
    <Datagrid rowClick="edit" bulkActionButtons={false}>
      <TextField source="id" label="ID" />
      <TextField source="word" label="Từ vựng" />
      <TextField source="partOfSpeech" label="Từ loại" />
      <TextField source="vietnameseTranslation" label="Nghĩa tiếng Việt" />
      <TextField source="topicTitle" label="Nhóm (chủ đề)" />
      <TextField source="deckTitle" label="Bộ thẻ" />
      <TextField source="status" label="Trạng thái" />
      <NumberField source="sortOrder" label="Thứ tự" />
      <DateField source="updatedAt" label="Cập nhật" showTime locales="vi-VN" />
      <ShowButton label="Preview" />
      <EditButton />
    </Datagrid>
  </List>
);

export const VocabularyCreate = () => (
  <Create title="Thêm từ vựng" redirect="list" transform={transformVocabularyPayload}>
    <VocabularyForm mode="create" />
  </Create>
);

export const VocabularyEdit = () => (
  <Edit title="Cập nhật từ vựng" transform={transformVocabularyPayload}>
    <VocabularyForm mode="edit" />
  </Edit>
);

export const VocabularyShow = () => (
  <Show title="Preview từ vựng">
    <SimpleShowLayout>
      <DetailBackButton />
      <TextField source="word" label="Từ vựng" />
      <TextField source="partOfSpeech" label="Từ loại" />
      <TextField source="vietnameseTranslation" label="Nghĩa tiếng Việt" />
      <TextField source="englishDefinition" label="Định nghĩa tiếng Anh" />
      <TextField source="vietnameseDefinition" label="Định nghĩa tiếng Việt" />
      <TextField source="exampleSentence" label="Câu ví dụ" />
      <TextField source="exampleSentenceVi" label="Dịch câu ví dụ" />
      <TextField source="topicTitle" label="Nhóm (chủ đề)" />
      <TextField source="deckTitle" label="Bộ thẻ" />
      <TextField source="status" label="Trạng thái" />
      <DateField source="updatedAt" label="Cập nhật" showTime locales="vi-VN" />
    </SimpleShowLayout>
  </Show>
);
