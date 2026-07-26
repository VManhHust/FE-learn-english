import {
  BooleanField,
  Datagrid,
  DateField,
  FunctionField,
  List,
  SearchInput,
  SelectInput,
  Show,
  SimpleShowLayout,
  TextField,
  useRefresh,
} from "react-admin";
import { useEffect } from "react";

const actionChoices = [
  { id: "CREATE", name: "CREATE" },
  { id: "UPDATE", name: "UPDATE" },
  { id: "DELETE", name: "DELETE" },
];

const successChoices = [
  { id: true, name: "Thành công" },
  { id: false, name: "Thất bại" },
];

const auditLogFilters = [
  <SearchInput key="q" source="q" placeholder="Tìm email, resource, path" alwaysOn />,
  <SelectInput key="action" source="action" label="Hành động" choices={actionChoices} />,
  <SearchInput key="resource" source="resource" placeholder="Resource" />,
  <SearchInput key="actorEmail" source="actorEmail" placeholder="Email admin" />,
  <SelectInput key="success" source="success" label="Kết quả" choices={successChoices} />,
];

const AuditLogAutoRefresh = () => {
  const refresh = useRefresh();

  useEffect(() => {
    refresh();
    const timers = [
      window.setTimeout(refresh, 300),
      window.setTimeout(refresh, 1000),
    ];

    return () => {
      timers.forEach(window.clearTimeout);
    };
  }, [refresh]);

  return null;
};

export const AuditLogList = () => (
  <List
    title="Audit log"
    filters={auditLogFilters}
    sort={{ field: "createdAt", order: "DESC" }}
    queryOptions={{
      staleTime: 0,
      refetchOnMount: "always",
      refetchOnWindowFocus: true,
    }}
  >
    <AuditLogAutoRefresh />
    <Datagrid bulkActionButtons={false} rowClick="show">
      <TextField source="id" label="ID" />
      <DateField source="createdAt" label="Thời gian" showTime locales="vi-VN" />
      <TextField source="actorEmail" label="Admin" emptyText="-" />
      <TextField source="action" label="Hành động" />
      <TextField source="resource" label="Resource" />
      <TextField source="resourceId" label="ID dữ liệu" emptyText="-" />
      <TextField source="httpMethod" label="Method" />
      <TextField source="responseStatus" label="Status" />
      <BooleanField source="success" label="Thành công" />
      <FunctionField
        label="Path"
        render={(record) => (
          <span title={record.requestPath}>{record.requestPath}</span>
        )}
      />
    </Datagrid>
  </List>
);

export const AuditLogShow = () => (
  <Show title="Chi tiết audit log">
    <SimpleShowLayout>
      <TextField source="id" label="ID" />
      <DateField source="createdAt" label="Thời gian" showTime locales="vi-VN" />
      <TextField source="actorUserId" label="Admin ID" emptyText="-" />
      <TextField source="actorEmail" label="Admin email" emptyText="-" />
      <TextField source="action" label="Hành động" />
      <TextField source="resource" label="Resource" />
      <TextField source="resourceId" label="ID dữ liệu" emptyText="-" />
      <TextField source="httpMethod" label="HTTP method" />
      <TextField source="requestPath" label="Request path" />
      <TextField source="queryString" label="Query string" emptyText="-" />
      <TextField source="responseStatus" label="Response status" />
      <BooleanField source="success" label="Thành công" />
      <TextField source="ipAddress" label="IP" emptyText="-" />
      <TextField source="userAgent" label="User agent" emptyText="-" />
      <TextField source="details" label="Chi tiết" emptyText="-" />
    </SimpleShowLayout>
  </Show>
);
