import { defaultTheme } from "react-admin";

export const cmsTheme = {
  ...defaultTheme,
  palette: {
    mode: "light" as const,
    primary: {
      main: "#14213d",
      light: "#29446f",
      dark: "#09152b",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#fca311",
    },
    background: {
      default: "#f5f7fb",
      paper: "#ffffff",
    },
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily: '"Inter", "Segoe UI", sans-serif',
    h5: {
      fontWeight: 700,
    },
  },
  components: {
    ...defaultTheme.components,
    MuiCard: {
      styleOverrides: {
        root: {
          border: "1px solid #e8ecf4",
          boxShadow: "0 8px 28px rgba(20, 33, 61, 0.07)",
        },
      },
    },
  },
};
