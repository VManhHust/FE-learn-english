import { Admin, Resource, ShowGuesser } from "react-admin";
import CategoryOutlinedIcon from "@mui/icons-material/CategoryOutlined";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import PlayLessonOutlinedIcon from "@mui/icons-material/PlayLessonOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import TopicOutlinedIcon from "@mui/icons-material/TopicOutlined";
import TranslateOutlinedIcon from "@mui/icons-material/TranslateOutlined";
import WorkspacePremiumOutlinedIcon from "@mui/icons-material/WorkspacePremiumOutlined";
import { authProvider, dataProvider } from "./api";
import { AuditLogList, AuditLogShow } from "./auditLogs";
import { CategoryCreate, CategoryEdit, CategoryList, CategoryShow } from "./categories";
import { Dashboard } from "./dashboard/Dashboard";
import { LessonCreate, LessonEdit, LessonList, LessonShow } from "./lessons";
import {
  PaymentOrderList,
  PaymentOrderShow,
  ProPlanCreate,
  ProPlanEdit,
  ProPlanList,
} from "./pro";
import { cmsTheme } from "./theme";
import { TopicCreate, TopicEdit, TopicList, TopicShow } from "./topics";
import { UserCreate, UserEdit, UserList } from "./users";
import { VocabularyCreate, VocabularyEdit, VocabularyList, VocabularyShow } from "./vocabulary";
import {
  VocabularyTopicCreate,
  VocabularyTopicEdit,
  VocabularyTopicList,
  VocabularyTopicShow,
} from "./vocabularyTopics";

export const App = () => (
  <Admin
    title="Learn English CMS"
    dashboard={Dashboard}
    authProvider={authProvider}
    dataProvider={dataProvider}
    theme={cmsTheme}
    requireAuth
  >
    <Resource
      name="topics"
      options={{ label: "Danh mục bài học" }}
      icon={TopicOutlinedIcon}
      list={TopicList}
      create={TopicCreate}
      edit={TopicEdit}
      show={TopicShow}
    />
    <Resource
      name="lessons"
      options={{ label: "Bài học" }}
      icon={PlayLessonOutlinedIcon}
      list={LessonList}
      create={LessonCreate}
      edit={LessonEdit}
      show={LessonShow}
    />
    <Resource
      name="users"
      options={{ label: "Người dùng" }}
      icon={PeopleAltOutlinedIcon}
      list={UserList}
      create={UserCreate}
      edit={UserEdit}
      show={ShowGuesser}
    />
    <Resource
      name="vocabulary/words"
      options={{ label: "Từ vựng" }}
      icon={TranslateOutlinedIcon}
      list={VocabularyList}
      create={VocabularyCreate}
      edit={VocabularyEdit}
      show={VocabularyShow}
    />
    <Resource
      name="vocabulary/decks"
      options={{ label: "Danh mục từ vựng" }}
      icon={CategoryOutlinedIcon}
      list={CategoryList}
      create={CategoryCreate}
      edit={CategoryEdit}
      show={CategoryShow}
    />
    <Resource
      name="vocabulary/topics"
      options={{ label: "Chủ đề từ vựng" }}
      icon={MenuBookOutlinedIcon}
      list={VocabularyTopicList}
      create={VocabularyTopicCreate}
      edit={VocabularyTopicEdit}
      show={VocabularyTopicShow}
    />
    <Resource
      name="pro/plans"
      options={{ label: "Gói cước PRO" }}
      icon={WorkspacePremiumOutlinedIcon}
      list={ProPlanList}
      create={ProPlanCreate}
      edit={ProPlanEdit}
      show={ShowGuesser}
    />
    <Resource
      name="pro/orders"
      options={{ label: "Đơn hàng PRO" }}
      icon={ReceiptLongOutlinedIcon}
      list={PaymentOrderList}
      show={PaymentOrderShow}
    />
    <Resource
      name="audit-logs"
      options={{ label: "Audit log" }}
      icon={HistoryOutlinedIcon}
      list={AuditLogList}
      show={AuditLogShow}
    />
  </Admin>
);
