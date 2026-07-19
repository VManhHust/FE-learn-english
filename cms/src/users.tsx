import {
  BooleanField,
  BooleanInput,
  Create,
  CreateButton,
  Datagrid,
  DateField,
  DateTimeInput,
  Edit,
  EditButton,
  EmailField,
  ExportButton,
  FormDataConsumer,
  List,
  PasswordInput,
  SaveButton,
  SelectInput,
  SimpleForm,
  TextField,
  TextInput,
  Toolbar,
  TopToolbar,
  useDelete,
  useListContext,
  useNotify,
  useRecordContext,
  useRedirect,
  useUpdate,
  required,
} from "react-admin";
import DeleteIcon from "@mui/icons-material/Delete";
import LockIcon from "@mui/icons-material/Lock";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import SearchIcon from "@mui/icons-material/Search";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import FormControl from "@mui/material/FormControl";
import InputAdornment from "@mui/material/InputAdornment";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Popover from "@mui/material/Popover";
import Select from "@mui/material/Select";
import MuiTextField from "@mui/material/TextField";
import type { SxProps } from "@mui/system";
import { useState } from "react";
import { DetailBackButton } from "./DetailBackButton";

const roleChoices = [
  { id: "USER", name: "User" },
  { id: "ADMIN", name: "Admin" },
];

const statusChoices = [
  { id: "ACTIVE", name: "Active" },
  { id: "LOCK", name: "Lock" },
  { id: "DELETE", name: "Delete" },
];

const proChoices = [
  { id: true, name: "Có Pro" },
  { id: false, name: "Không Pro" },
];

const filterFields = [
  { id: "q", name: "Email", type: "text" },
  { id: "displayName", name: "Tên hiển thị", type: "text" },
  { id: "role", name: "Vai trò", type: "select", choices: roleChoices },
  { id: "status", name: "Trạng thái", type: "select", choices: statusChoices },
  { id: "pro", name: "Pro", type: "select", choices: proChoices },
];

type FilterCondition = {
  id: number;
  fieldId: string;
  value: string;
};

const newFilterCondition = (): FilterCondition => ({
  id: Date.now() + Math.random(),
  fieldId: "q",
  value: "",
});

const formatFilterValue = (fieldId: string, value: unknown) => {
  if (fieldId === "pro") {
    return value === true || value === "true" ? "Có Pro" : "Không Pro";
  }
  return String(value);
};

const buildConditionsFromFilters = (filterValues: Record<string, unknown>) => {
  const conditions = filterFields
    .filter((field) => filterValues?.[field.id] !== undefined && filterValues?.[field.id] !== "")
    .flatMap((field) => {
      const rawValue = filterValues[field.id];
      const values = Array.isArray(rawValue) ? rawValue : [rawValue];
      return values.map((value) => ({
        id: Date.now() + Math.random(),
        fieldId: field.id,
        value: String(value),
      }));
    });
  return conditions.length > 0 ? conditions : [newFilterCondition()];
};

const UserSmartFilter = (_props: { source?: string; alwaysOn?: boolean }) => {
  const { filterValues, setFilters } = useListContext();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [conditions, setConditions] = useState<FilterCondition[]>(() =>
    buildConditionsFromFilters(filterValues ?? {}),
  );

  const activeConditions = buildConditionsFromFilters(filterValues ?? {}).filter((condition) => condition.value !== "");
  const displayValue =
    activeConditions.length === 0
      ? ""
      : activeConditions
          .map((condition) => {
            const field = filterFields.find((item) => item.id === condition.fieldId);
            return `${field?.name ?? condition.fieldId}: ${formatFilterValue(condition.fieldId, condition.value)}`;
          })
          .join("; ");

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setConditions(buildConditionsFromFilters(filterValues ?? {}));
    setAnchorEl(event.currentTarget);
  };

  const updateCondition = (id: number, patch: Partial<FilterCondition>) => {
    setConditions((current) =>
      current.map((condition) =>
        condition.id === id
          ? {
              ...condition,
              ...patch,
              value: patch.fieldId && patch.fieldId !== condition.fieldId ? "" : patch.value ?? condition.value,
            }
          : condition,
      ),
    );
  };

  const removeCondition = (id: number) => {
    setConditions((current) => {
      const next = current.filter((condition) => condition.id !== id);
      return next.length > 0 ? next : [newFilterCondition()];
    });
  };

  const handleApply = () => {
    const nextFilters = conditions.reduce<Record<string, unknown>>((filters, condition) => {
      if (condition.value === "") {
        return filters;
      }

      const normalizedValue = condition.fieldId === "pro" ? condition.value === "true" : condition.value;
      const existing = filters[condition.fieldId];

      if (existing === undefined) {
        filters[condition.fieldId] = normalizedValue;
      } else if (Array.isArray(existing)) {
        filters[condition.fieldId] = [...existing, normalizedValue];
      } else {
        filters[condition.fieldId] = [existing, normalizedValue];
      }

      return filters;
    }, {});

    setFilters(nextFilters, {}, false);
    setAnchorEl(null);
  };

  const handleClear = () => {
    setConditions([newFilterCondition()]);
    setFilters({}, {}, false);
    setAnchorEl(null);
  };

  const handleFilterKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleApply();
    }
  };

  return (
    <>
      <MuiTextField
        value={displayValue}
        placeholder="Tìm kiếm"
        onClick={handleOpen}
        size="small"
        sx={{ width: 340 }}
        InputProps={{
          readOnly: true,
          endAdornment: (
            <InputAdornment position="end">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
      />
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      >
        <Box sx={{ display: "grid", gap: 2, p: 2, width: 520 }} onKeyDown={handleFilterKeyDown}>
          {conditions.map((condition) => {
            const selectedField = filterFields.find((field) => field.id === condition.fieldId) ?? filterFields[0];

            return (
              <Box key={condition.id} sx={{ display: "grid", gridTemplateColumns: "180px 1fr auto", gap: 1 }}>
                <FormControl size="small" fullWidth>
                  <InputLabel>Trường filter</InputLabel>
                  <Select
                    label="Trường filter"
                    value={condition.fieldId}
                    onChange={(event) => updateCondition(condition.id, { fieldId: event.target.value })}
                  >
                    {filterFields.map((field) => (
                      <MenuItem key={field.id} value={field.id}>
                        {field.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {selectedField.type === "select" ? (
                  <FormControl size="small" fullWidth>
                    <InputLabel>Giá trị</InputLabel>
                    <Select
                      label="Giá trị"
                      value={condition.value}
                      onChange={(event) => updateCondition(condition.id, { value: String(event.target.value) })}
                    >
                      {selectedField.choices?.map((choice) => (
                        <MenuItem key={String(choice.id)} value={String(choice.id)}>
                          {choice.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                ) : (
                  <MuiTextField
                    label="Giá trị"
                    size="small"
                    value={condition.value}
                    onChange={(event) => updateCondition(condition.id, { value: event.target.value })}
                    fullWidth
                  />
                )}

                <Button color="error" onClick={() => removeCondition(condition.id)}>
                  Xóa
                </Button>
              </Box>
            );
          })}

          <Button onClick={() => setConditions((current) => [...current, newFilterCondition()])}>
            Thêm điều kiện
          </Button>

          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <Button onClick={handleClear}>Xóa lọc</Button>
            <Button variant="contained" onClick={handleApply}>
              Áp dụng
            </Button>
          </Box>
        </Box>
      </Popover>
    </>
  );
};

const userFilters = [<UserSmartFilter key="smartFilter" source="q" alwaysOn />];

const userListActions = (
  <TopToolbar>
    <CreateButton label="Thêm tài khoản" />
    <ExportButton />
  </TopToolbar>
);

const deletedUserRowSx = (record?: Record<string, unknown>): SxProps =>
  record?.status === "DELETE"
    ? {
        "& td, & .RaDatagrid-rowCell": {
          color: "#d32f2f",
        },
        "& td:nth-of-type(2), & td:nth-of-type(3)": {
          textDecoration: "line-through",
          textDecorationThickness: "2px",
        },
        "& td:nth-of-type(2) a": {
          color: "#d32f2f",
          textDecoration: "line-through",
          textDecorationThickness: "2px",
        },
        "& svg": {
          color: "#d32f2f",
        },
      }
    : {};

const toUserPayload = (data: Record<string, unknown>) => {
  const proEnabled = Boolean(data.pro);
  return {
    email: data.email,
    password: data.password,
    displayName: data.displayName,
    role: data.role,
    status: data.status,
    proStartsAt: proEnabled ? data.proStartsAt : null,
    proExpiresAt: proEnabled ? data.proExpiresAt : null,
  };
};

const ProFields = () => (
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
);

const ConfirmDeleteUserButton = () => {
  const record = useRecordContext();
  const notify = useNotify();
  const redirect = useRedirect();
  const [deleteOne, { isPending }] = useDelete();
  const [open, setOpen] = useState(false);

  const handleDelete = () => {
    if (!record?.id) {
      return;
    }


    deleteOne(
      "users",
      { id: record.id, previousData: record },
      {
        mutationMode: "pessimistic",
        onSuccess: () => {
          setOpen(false);
          notify("Đã xóa tài khoản", { type: "success" });
          redirect("list", "users");
        },
        onError: () => {
          notify("Không thể xóa tài khoản", { type: "error" });
        },
      },
    );
  };

  return (
    <>
      <Button color="error" startIcon={<DeleteIcon />} disabled={isPending} onClick={() => setOpen(true)}>
        Delete
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Xóa tài khoản</DialogTitle>
        <DialogContent>
          <DialogContentText>Bạn có chắc chắn muốn xóa tài khoản này không?</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} disabled={isPending}>
            Hủy
          </Button>
          <Button color="error" startIcon={<DeleteIcon />} disabled={isPending} onClick={handleDelete}>
            Xóa
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

const ToggleLockUserButton = () => {
  const record = useRecordContext();
  const notify = useNotify();
  const [update, { isPending }] = useUpdate();

  if (!record?.id || record.status === "DELETE") {
    return null;
  }

  const locked = record.status === "LOCK";
  const nextStatus = locked ? "ACTIVE" : "LOCK";

  const handleToggle = () => {
    update(
      "users",
      {
        id: record.id,
        data: { ...record, status: nextStatus },
        previousData: record,
      },
      {
        mutationMode: "pessimistic",
        onSuccess: () => {
          notify(locked ? "Đã mở khóa tài khoản" : "Đã khóa tài khoản", { type: "success" });
        },
        onError: () => {
          notify(locked ? "Không thể mở khóa tài khoản" : "Không thể khóa tài khoản", { type: "error" });
        },
      },
    );
  };

  return (
    <Button
      color={locked ? "primary" : "warning"}
      startIcon={locked ? <LockOpenIcon /> : <LockIcon />}
      disabled={isPending}
      onClick={handleToggle}
    >
      {locked ? "Mở khóa" : "Khóa"}
    </Button>
  );
};

const UserEditToolbar = () => (
  <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
    <SaveButton />
    <Box sx={{ display: "flex", gap: 1 }}>
      <ToggleLockUserButton />
      <ConfirmDeleteUserButton />
    </Box>
  </Toolbar>
);

export const UserList = () => (
  <List filters={userFilters} sort={{ field: "statusOrder", order: "ASC" }} actions={userListActions}>
    <Datagrid rowClick="edit" bulkActionButtons={false} rowSx={deletedUserRowSx}>
      <TextField source="id" label="ID" />
      <EmailField source="email" label="Email" />
      <TextField source="displayName" label="Tên hiển thị" />
      <TextField source="role" label="Vai trò" />
      <TextField source="status" label="Trạng thái" />
      <BooleanField source="pro" label="Pro" />
      <DateField source="proStartsAt" label="Bắt đầu Pro" showTime emptyText="-" locales="vi-VN" />
      <DateField source="proExpiresAt" label="Hết hạn Pro" showTime emptyText="-" locales="vi-VN" />
      <EditButton />
    </Datagrid>
  </List>
);

export const UserCreate = () => (
  <Create title="Thêm tài khoản" transform={toUserPayload} redirect="list">
    <SimpleForm defaultValues={{ role: "USER", status: "ACTIVE", pro: false }}>
      <DetailBackButton />
      <TextInput source="email" label="Email" type="email" validate={required()} fullWidth />
      <PasswordInput source="password" label="Mật khẩu" validate={required()} fullWidth />
      <TextInput source="displayName" label="Tên hiển thị" fullWidth />
      <SelectInput source="role" label="Vai trò" choices={roleChoices} validate={required()} />
      <SelectInput source="status" label="Trạng thái" choices={statusChoices} validate={required()} />
      <BooleanInput source="pro" label="Kích hoạt Pro" />
      <ProFields />
    </SimpleForm>
  </Create>
);

export const UserEdit = () => (
  <Edit title="Cập nhật người dùng">
    <SimpleForm toolbar={<UserEditToolbar />}>
      <DetailBackButton />
      <TextInput source="email" label="Email" disabled fullWidth />
      <TextInput source="displayName" label="Tên hiển thị" fullWidth />
      <SelectInput source="role" label="Vai trò" choices={roleChoices} />
      <SelectInput source="status" label="Trạng thái" choices={statusChoices} />
      <BooleanInput source="pro" label="Kích hoạt Pro" />
      <ProFields />
    </SimpleForm>
  </Edit>
);
