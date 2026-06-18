import {
  Admin,
  Resource,
  ShowGuesser,
} from "react-admin";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import PlayLessonOutlinedIcon from "@mui/icons-material/PlayLessonOutlined";
import TopicOutlinedIcon from "@mui/icons-material/TopicOutlined";
import { authProvider, dataProvider } from "./api";
import { Dashboard } from "./dashboard/Dashboard";
import { cmsTheme } from "./theme";
import { TopicCreate, TopicEdit, TopicList } from "./topics";
import { LessonEdit, LessonList } from "./lessons";
import { UserEdit, UserList } from "./users";

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
      options={{ label: "Chủ đề" }}
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
      edit={LessonEdit}
      show={ShowGuesser}
    />
    <Resource
      name="users"
      options={{ label: "Người dùng" }}
      icon={PeopleAltOutlinedIcon}
      list={UserList}
      edit={UserEdit}
      show={ShowGuesser}
    />
  </Admin>
);
