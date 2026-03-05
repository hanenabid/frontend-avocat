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

  const appBarRef = React.useRef(null);

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
    <AppBar position="fixed" elevation={1} className="navbar-root" ref={appBarRef}>
      <Container maxWidth="xl">
        <Toolbar disableGutters>

          {/* MOBILE MENU BUTTON */}
          <Box sx={{ display: { xs: "flex", md: "none" }, mr: 1 }}>
            <IconButton
              color="inherit"
              onClick={openNav}
              aria-controls="mobile-nav-menu"
              aria-haspopup="true"
            >
              <MenuIcon />
            </IconButton>

            <Menu
              id="mobile-nav-menu"
              anchorEl={anchorElNav}
              open={Boolean(anchorElNav)}
              onClose={closeNav}
              keepMounted
              disableScrollLock
              anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
              transformOrigin={{ vertical: "top",    horizontal: "left" }}
              PaperProps={{
                sx: {
                  width: 260,
                  mt: 1,
                  zIndex: (theme) => theme.zIndex.appBar + 10,
                },
              }}
            >
              {pages.map((p) => (
                <MenuItem
                  key={p.label}
                  onClick={() => handleNavClick(p)}
                  className="navbar-mobile-menu"
                >
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
                onClick={() => { navigate("/login"); closeNav(); }}
                className="navbar-mobile-btn-espace"
              >
                {t("nav.login", { defaultValue: "Se connecter" })}
              </MenuItem>
              <MenuItem
                onClick={() => { navigate("/signup"); closeNav(); }}
                className="navbar-mobile-btn-avocat"
              >
                {t("nav.signup", { defaultValue: "S'inscrire" })}
              </MenuItem>
            </Menu>
          </Box>

          {/* LOGO */}
          <Box className="navbar-logo" sx={{ flexGrow: { xs: 1, md: 0 } }}>
            <Logo />
          </Box>

          {/* CENTER LINKS — desktop only */}
          <Box sx={{ flexGrow: 1, display: { xs: "none", md: "flex" }, justifyContent: "center" }}>
            {pages.map((p) => (
              <Button key={p.label} onClick={() => handleNavClick(p)} className="navbar-link">
                {t(p.label)}
              </Button>
            ))}
          </Box>

          {/* RIGHT SIDE */}
          <Box className="navbar-right">

            {/* Language picker */}
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
                keepMounted
                disableScrollLock
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                transformOrigin={{ vertical: "top",    horizontal: "right" }}
                PaperProps={{ sx: { minWidth: 170, mt: 1 } }}
              >
                {languages.map(({ code, label, flagCode, i18n: i18nKey }) => (
                  <MenuItem key={code} onClick={() => changeLang(code, i18nKey)}>
                    <FlagItem flagCode={flagCode} label={label} />
                  </MenuItem>
                ))}
              </Menu>
            </Box>

            {/* Se connecter (outlined) */}
            <Button
              onClick={() => navigate("/login")}
              variant="outlined"
              className="navbar-outlined-btn"
            >
              {t("nav.login", { defaultValue: "Se connecter" })}
            </Button>

            {/* S'inscrire (gold filled) */}
            <Button
              onClick={() => navigate("/signup")}
              variant="contained"
              className="navbar-gold-btn"
            >
              {t("nav.signup", { defaultValue: "S'inscrire" })}
            </Button>

          </Box>

        </Toolbar>
      </Container>
    </AppBar>
  );
}

export default Navbar;