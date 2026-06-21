import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
import { Button } from "@mui/material";
import { useNavigate } from "react-router-dom";

export const DetailBackButton = () => {
  const navigate = useNavigate();

  return (
    <Button
      variant="text"
      color="primary"
      startIcon={<ArrowBackOutlinedIcon />}
      onClick={() => navigate(-1)}
      sx={{ alignSelf: "flex-start", mb: 1, textTransform: "none" }}
    >
      Quay lại
    </Button>
  );
};
