import {
  BooleanField,
  BooleanInput,
  Create,
  Datagrid,
  DateField,
  DeleteButton,
  Edit,
  EditButton,
  FunctionField,
  List,
  NumberField,
  NumberInput,
  SearchInput,
  SelectInput,
  Show,
  SimpleForm,
  SimpleShowLayout,
  TextField,
  TextInput,
  required,
} from "react-admin";

const planStatusChoices = [
  { id: "ACTIVE", name: "ACTIVE" },
  { id: "INACTIVE", name: "INACTIVE" },
];

const orderStatusChoices = [
  { id: "PENDING", name: "PENDING" },
  { id: "PAID", name: "PAID" },
  { id: "EXPIRED", name: "EXPIRED" },
  { id: "CANCELLED", name: "CANCELLED" },
];

const planFilters = [
  <SearchInput key="q" source="q" placeholder="Tìm mã, tên hoặc mô tả" alwaysOn />,
  <SelectInput key="status" source="status" label="Trạng thái" choices={planStatusChoices} />,
];

const orderFilters = [
  <SearchInput key="q" source="q" placeholder="Tìm mã thanh toán, email, gói" alwaysOn />,
  <SelectInput key="status" source="status" label="Trạng thái" choices={orderStatusChoices} />,
  <TextInput key="planCode" source="planCode" label="Mã gói" />,
];

const PlanForm = () => (
  <SimpleForm defaultValues={{ status: "ACTIVE", featured: false, sortOrder: 0 }}>
    <TextInput source="code" label="Mã gói" validate={required()} fullWidth />
    <TextInput source="name" label="Tên gói" validate={required()} fullWidth />
    <TextInput source="description" label="Mô tả" multiline minRows={2} fullWidth />
    <NumberInput source="amount" label="Giá (VND)" validate={required()} fullWidth />
    <NumberInput
      source="durationDays"
      label="Thời hạn (ngày)"
      helperText="Để trống nếu là gói trọn đời"
      fullWidth
    />
    <TextInput source="benefits" label="Quyền lợi PRO" multiline minRows={4} fullWidth />
    <TextInput source="specialBenefits" label="Quyền lợi đặc biệt" multiline minRows={3} fullWidth />
    <SelectInput source="status" label="Trạng thái" choices={planStatusChoices} validate={required()} />
    <BooleanInput source="featured" label="Gói nổi bật" />
    <NumberInput source="sortOrder" label="Thứ tự" />
  </SimpleForm>
);

export const ProPlanList = () => (
  <List title="Gói cước PRO" filters={planFilters} sort={{ field: "sortOrder", order: "ASC" }}>
    <Datagrid bulkActionButtons={false} rowClick="edit">
      <TextField source="id" label="ID" />
      <TextField source="code" label="Mã gói" />
      <TextField source="name" label="Tên gói" />
      <NumberField source="amount" label="Giá" locales="vi-VN" />
      <FunctionField
        label="Thời hạn"
        render={(record) => (record.durationDays ? `${record.durationDays} ngày` : "Trọn đời")}
      />
      <TextField source="status" label="Trạng thái" />
      <BooleanField source="featured" label="Nổi bật" />
      <NumberField source="orderCount" label="Đơn hàng" />
      <NumberField source="sortOrder" label="Thứ tự" />
      <DateField source="updatedAt" label="Cập nhật" showTime locales="vi-VN" />
      <EditButton label="Edit" />
      <DeleteButton label="Delete" mutationMode="pessimistic" />
    </Datagrid>
  </List>
);

export const ProPlanCreate = () => (
  <Create title="Thêm gói cước">
    <PlanForm />
  </Create>
);

export const ProPlanEdit = () => (
  <Edit title="Chỉnh sửa gói cước" mutationMode="pessimistic">
    <PlanForm />
  </Edit>
);

export const PaymentOrderList = () => (
  <List title="Đơn hàng PRO" filters={orderFilters} sort={{ field: "createdAt", order: "DESC" }}>
    <Datagrid bulkActionButtons={false} rowClick="show">
      <TextField source="paymentCode" label="Mã thanh toán" />
      <TextField source="userEmail" label="Email" />
      <TextField source="planName" label="Gói" />
      <TextField source="planCode" label="Mã gói" />
      <NumberField source="amount" label="Số tiền" locales="vi-VN" />
      <TextField source="status" label="Trạng thái" />
      <DateField source="expiresAt" label="Hết hạn thanh toán" showTime locales="vi-VN" />
      <DateField source="paidAt" label="Đã thanh toán" showTime locales="vi-VN" emptyText="-" />
      <TextField source="bankReferenceCode" label="Mã ngân hàng" emptyText="-" />
      <DateField source="createdAt" label="Ngày tạo" showTime locales="vi-VN" />
    </Datagrid>
  </List>
);

export const PaymentOrderShow = () => (
  <Show title="Chi tiết đơn hàng PRO">
    <SimpleShowLayout>
      <TextField source="id" label="ID" />
      <TextField source="paymentCode" label="Mã thanh toán" />
      <TextField source="status" label="Trạng thái" />
      <NumberField source="amount" label="Số tiền" locales="vi-VN" />
      <TextField source="planName" label="Gói" />
      <TextField source="planCode" label="Mã gói" />
      <TextField source="userEmail" label="Email" />
      <TextField source="userName" label="Người dùng" emptyText="-" />
      <DateField source="expiresAt" label="Hết hạn thanh toán" showTime locales="vi-VN" />
      <DateField source="paidAt" label="Đã thanh toán" showTime locales="vi-VN" emptyText="-" />
      <DateField source="proStartsAt" label="Bắt đầu PRO" showTime locales="vi-VN" emptyText="-" />
      <DateField source="proExpiresAt" label="Hết hạn PRO" showTime locales="vi-VN" emptyText="-" />
      <TextField source="sepayTransactionId" label="SePay transaction ID" emptyText="-" />
      <TextField source="bankReferenceCode" label="Mã ngân hàng" emptyText="-" />
      <DateField source="createdAt" label="Ngày tạo" showTime locales="vi-VN" />
      <DateField source="updatedAt" label="Cập nhật" showTime locales="vi-VN" />
    </SimpleShowLayout>
  </Show>
);
