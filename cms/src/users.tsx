import {
  BooleanField,
  BooleanInput,
  Datagrid,
  DateField,
  DateTimeInput,
  Edit,
  EditButton,
  EmailField,
  FormDataConsumer,
  List,
  SearchInput,
  SelectInput,
  SimpleForm,
  TextField,
  TextInput,
  required,
} from "react-admin";

const userFilters = [<SearchInput key="q" source="q" alwaysOn placeholder="Tìm email/tên" />];

export const UserList = () => (
  <List filters={userFilters} sort={{ field: "createdAt", order: "DESC" }}>
    <Datagrid rowClick="edit" bulkActionButtons={false}>
      <TextField source="id" label="ID" />
      <EmailField source="email" label="Email" />
      <TextField source="displayName" label="Tên hiển thị" />
      <TextField source="role" label="Vai trò" />
      <BooleanField source="pro" label="Pro" />
      <DateField source="proStartsAt" label="Bắt đầu Pro" showTime emptyText="-" locales="vi-VN" />
      <DateField source="proExpiresAt" label="Hết hạn Pro" showTime emptyText="-" locales="vi-VN" />
      <EditButton />
    </Datagrid>
  </List>
);

export const UserEdit = () => (
  <Edit title="Cập nhật người dùng">
    <SimpleForm>
      <TextInput source="email" label="Email" disabled fullWidth />
      <TextInput source="displayName" label="Tên hiển thị" fullWidth />
      <SelectInput
        source="role"
        label="Vai trò"
        choices={[
          { id: "USER", name: "User" },
          { id: "ADMIN", name: "Admin" },
        ]}
      />
      <BooleanInput source="pro" label="Kích hoạt Pro" />
      <FormDataConsumer>
        {({ formData }) =>
          formData.pro ? (
            <>
              <DateTimeInput
                source="proStartsAt"
                label="Bắt đầu Pro"
                helperText="Thời điểm bắt đầu hiệu lực gói Pro"
                validate={required()}
              />
              <DateTimeInput
                source="proExpiresAt"
                label="Hết hạn Pro"
                helperText="Thời điểm kết thúc hiệu lực gói Pro"
                validate={required()}
              />
            </>
          ) : null
        }
      </FormDataConsumer>
    </SimpleForm>
  </Edit>
);
