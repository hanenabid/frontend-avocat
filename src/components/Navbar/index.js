import * as React from "react";
import {
  AppBar, Box, Toolbar, IconButton, Menu,
  Container, Button, Tooltip, MenuItem, Divider
} from "@mui/material";

import MenuIcon from "@mui/icons-material/Menu";
import TranslateIcon from "@mui/icons-material/Translate";

import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Logo from "../Logo";
import "./Navbar.css";

// flag-icons — ajoute dans index.html ou index.css :
// @import "https://cdn.jsdelivr.net/npm/flag-icons@7.2.3/css/flag-icons.min.css";

const pages = [
  { label: "nav.comment",  hash: "comment-ca-marche" },
  { label: "nav.clients",  hash: "pour-les-clients" },
  { label: "nav.avocats",  hash: "pour-les-avocats" },
  { label: "nav.diaspora", hash: "diaspora" },
  { label: "nav.urgence",  hash: "urgence" },
];

const languages = [
  { code: "FR", label: "Français", flagCode: "fr", i18n: "fr" },
  { code: "EN", label: "English",  flagCode: "gb", i18n: "en" },
  { code: "AR", label: "العربية",  flagCode: "tn", i18n: "ar" },
  { code: "IT", label: "Italiano", flagCode: "it", i18n: "it" },
  { code: "DE", label: "Deutsch",  flagCode: "de", i18n: "de" },
];

const FlagItem = ({ flagCode, label }) => (
  <Box sx={{ display: "flex", alignItems: "center", gap: "10px" }}>
    <span
      className={`fi fi-${flagCode}`}
      style={{ width: 24, height: 18, borderRadius: 3, display: "inline-block", flexShrink: 0 }}
    />
    <span>{label}</span>
  </Box>
);

function Navbar() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const [anchorElNav, setAnchorElNav] = React.useState(null);
  const [anchorLang,  setAnchorLang]  = React.useState(null);

  const openNav   = (e) => setAnchorElNav(e.currentTarget);
  const closeNav  = ()  => setAnchorElNav(null);
  const openLang  = (e) => setAnchorLang(e.currentTarget);
  const closeLang = ()  => setAnchorLang(null);

  const changeLang = (code, i18nKey) => {
    localStorage.setItem("selectedLanguage", code);
    i18n.changeLanguage(i18nKey);
    closeLang();
  };

  const handleNavClick = (page) => {
    if (window.location.pathname === "/") {
      document.getElementById(page.hash)?.scrollIntoView({ behavior: "smooth" });
    } else {
      navigate("/");
      setTimeout(() => {
        document.getElementById(page.hash)?.scrollIntoView({ behavior: "smooth" });
      }, 300);
    }
    closeNav();
  };

  return (
    <AppBar position="fixed" elevation={1} className="navbar-root">
      <Container maxWidth="xl">
        <Toolbar disableGutters>

          {/* LOGO */}
          <Box className="navbar-logo">
            <Logo />
          </Box>

          {/* MOBILE MENU BUTTON */}
          <Box sx={{ flexGrow: 1, display: { xs: "flex", md: "none" } }}>
            <IconButton color="inherit" onClick={openNav}>
              <MenuIcon />
            </IconButton>
            <Menu
              anchorEl={anchorElNav}
              open={Boolean(anchorElNav)}
              onClose={closeNav}
              PaperProps={{ sx: { width: 260, mt: 1 } }}
            >
              {pages.map((p) => (
                <MenuItem key={p.label} onClick={() => handleNavClick(p)} className="navbar-mobile-menu">
                  {t(p.label)}
                </MenuItem>
              ))}

              <Divider className="navbar-mobile-divider" />

              {languages.map(({ code, label, flagCode, i18n: i18nKey }) => (
                <MenuItem key={code} onClick={() => changeLang(code, i18nKey)}>
                  <FlagItem flagCode={flagCode} label={label} />
                </MenuItem>
              ))}

              <Divider className="navbar-mobile-divider" />

              <MenuItem
                onClick={() => { navigate("/signup"); closeNav(); }}
                className="navbar-mobile-btn-espace"
              >
                {t("nav.espaceAvocats", { defaultValue: "Espace Avocats" })}
              </MenuItem>
              <MenuItem
                onClick={() => { navigate("/lawyers"); closeNav(); }}
                className="navbar-mobile-btn-avocat"
              >
                {t("nav.trouverAvocat", { defaultValue: "Trouver un avocat" })}
              </MenuItem>
            </Menu>
          </Box>

          {/* CENTER LINKS — desktop */}
          <Box sx={{ flexGrow: 1, display: { xs: "none", md: "flex" }, justifyContent: "center" }}>
            {pages.map((p) => (
              <Button key={p.label} onClick={() => handleNavClick(p)} className="navbar-link">
                {t(p.label)}
              </Button>
            ))}
          </Box>

          {/* RIGHT SIDE — desktop */}
          <Box className="navbar-right">

            <Box sx={{ display: { xs: "none", sm: "flex" } }}>
              <Tooltip title="Language">
                <IconButton onClick={openLang} className="navbar-icon-btn">
                  <TranslateIcon />
                </IconButton>
              </Tooltip>
              <Menu
                anchorEl={anchorLang}
                open={Boolean(anchorLang)}
                onClose={closeLang}
                PaperProps={{ sx: { minWidth: 170, mt: 1 } }}
              >
                {languages.map(({ code, label, flagCode, i18n: i18nKey }) => (
                  <MenuItem key={code} onClick={() => changeLang(code, i18nKey)}>
                    <FlagItem flagCode={flagCode} label={label} />
                  </MenuItem>
                ))}
              </Menu>
            </Box>

            <Button
              onClick={() => navigate("/signup")}
              variant="outlined"
              className="navbar-outlined-btn"
            >
              {t("nav.espaceAvocats", { defaultValue: "Espace Avocats" })}
            </Button>

            <Button
              onClick={() => navigate("/signup")}
              variant="contained"
              className="navbar-gold-btn"
            >
              {t("nav.trouverAvocat", { defaultValue: "Trouver un avocat" })}
            </Button>

          </Box>

        </Toolbar>
      </Container>
    </AppBar>
  );
}

export default Navbar;