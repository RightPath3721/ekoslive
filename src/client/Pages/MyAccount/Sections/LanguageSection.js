import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { 
  Box, 
  Typography, 
  Paper, 
  Divider,
  Button,
  useTheme 
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { optionActions } from "@redux/actions";
import { selectOptions } from "@redux/selectors";
import s from "@common/shared/i18n/i18n";
import Dropdown from "@components/Dropdown";

const SettingsText = styled(Typography)(({ theme }) => ({
  fontSize: "1rem",
  color: theme.palette.common.white,
}));

const LanguageSection = () => {
  const dispatch = useDispatch();
  const { palette } = useTheme();
  const options = useSelector(selectOptions);
  const [currentLanguage, setCurrentLanguage] = useState(s.getLanguage());
  
  // Update current language when options change
  useEffect(() => {
    setCurrentLanguage(s.getLanguage());
  }, [options]);
  
  const handleLanguageChange = ({ value }) => {
    s.setLanguage(value);
    dispatch(optionActions.setOption("language", value));
  };
  
  return (
    <Box>      
      <Box sx={{ display: "grid", gridTemplateColumns: {xs: "1fr", md: "140px 1fr"}, gap: 2, alignItems: "center" }}>
        <SettingsText>
          {s.settings.language}
        </SettingsText>
        
        <Box sx={{ maxWidth: 300 }}>
          <Dropdown
            value={currentLanguage}
            options={s
              .getAvailableLanguages()
              .map((lang) => ({ label: lang, value: lang }))}
            onChange={handleLanguageChange}
            width="100%"
            containerStyles={{
              border: `1px solid rgba(255, 255, 255, 0.23)`,
              borderRadius: "8px",
              height: "45px",
            }}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default LanguageSection;
