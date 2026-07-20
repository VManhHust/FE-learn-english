import { Admin, Resource, ShowGuesser } from "react-admin";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import PlayLessonOutlinedIcon from "@mui/icons-material/PlayLessonOutlined";
import TopicOutlinedIcon from "@mui/icons-material/TopicOutlined";
import TranslateOutlinedIcon from "@mui/icons-material/TranslateOutlined";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import CategoryOutlinedIcon from "@mui/icons-material/CategoryOutlined";
import WorkspacePremiumOutlinedIcon from "@mui/icons-material/WorkspacePremiumOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import { authProvider, dataProvider } from "./api";
import { Dashboard } from "./dashboard/Dashboard";
import { cmsTheme } from "./theme";
import { TopicCreate, TopicEdit, TopicList } from "./topics";
import { LessonCreate, LessonEdit, LessonList } from "./lessons";
import { UserCreate, UserEdit, UserList } from "./users";
import { VocabularyCreate, VocabularyEdit, VocabularyList } from "./vocabulary";
import { CategoryCreate, CategoryEdit, CategoryList } from "./categories";
import {
  VocabularyTopicCreate,
  VocabularyTopicEdit,
  VocabularyTopicList,
} from "./vocabularyTopics";
import {
  PaymentOrderList,
  PaymentOrderShow,
  ProPlanCreate,
  ProPlanEdit,
  ProPlanList,
} from "./pro";

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
      show={ShowGuesser}
    />
    <Resource
      name="lessons"
      options={{ label: "Bài học" }}
      icon={PlayLessonOutlinedIcon}
      list={LessonList}
      create={LessonCreate}
      edit={LessonEdit}
      show={ShowGuesser}
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
      show={ShowGuesser}
    />
    <Resource
      name="vocabulary/decks"
      options={{ label: "Danh mục từ vựng" }}
      icon={CategoryOutlinedIcon}
      list={CategoryList}
      create={CategoryCreate}
      edit={CategoryEdit}
      show={ShowGuesser}
    />
    <Resource
      name="vocabulary/topics"
      options={{ label: "Chủ đề từ vựng" }}
      icon={MenuBookOutlinedIcon}
      list={VocabularyTopicList}
      create={VocabularyTopicCreate}
      edit={VocabularyTopicEdit}
      show={ShowGuesser}
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
  </Admin>
);
